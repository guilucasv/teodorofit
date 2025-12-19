/**
 * Payment Brick Integration for Mercado Pago
 * Handles checkout with Payment Brick (replaces old token-based flow)
 */

class PaymentBrickManager {
  constructor(publicKey, brickId) {
    this.publicKey = publicKey;
    this.brickId = brickId;
    this.brickInstance = null;
    this.initSDK();
  }

  /**
   * Initialize Mercado Pago SDK
   */
  initSDK() {
    if (window.MercadoPago) {
      window.mp = new window.MercadoPago(this.publicKey, {
        locale: 'pt-BR'
      });
      console.log('✓ Mercado Pago SDK inicializado com sucesso');
    } else {
      console.error('✗ SDK Mercado Pago não carregado');
    }
  }

  /**
   * Initialize Payment Brick
   */
  async renderBrick() {
    try {
      if (!window.mp) {
        throw new Error('SDK Mercado Pago não inicializado');
      }

      const settings = {
        initialization: {
          amount: this.getOrderTotal(),
        },
        customization: {
          visual: {
            style: {
              theme: 'default' // ou 'dark'
            }
          },
          checkout: {
            theme: 'default'
          },
          paymentMethods: {
            creditCard: 'all',
            debitCard: 'all',
            ticket: 'all',
            bankTransfer: 'all',
            atm: 'all',
            onboarding_credits: 'all',
            wallet_purchase: 'all',
            maxInstallments: 12
          }
        },
        callbacks: {
          onReady: () => {
            console.log('✓ Payment Brick pronto');
            this.hideBrickLoader();
          },
          onSubmit: async (param) => {
            // O parâmetro recebido contém { formData }
            const formData = param.formData;
            console.log('✓ Payment Brick submitted. Param:', param);
            console.log('✓ Extracted formData:', formData);

            try {
              await this.handlePaymentSubmit(formData);
            } catch (error) {
              console.error('✗ Erro ao processar pagamento:', error);
            }
          },
          onError: (error) => {
            console.error('✗ Erro no Payment Brick:', error);
            const errorMsg = error?.cause?.[0]?.description || error?.message || JSON.stringify(error);
            this.showNotification(`Erro: ${errorMsg}`, 'error');
          },
          onInstallmentChange: (installmentData) => {
            console.log('Installment changed:', installmentData);
          }
        }
      };

      // Renderizar Brick no container
      const containerId = 'brick-payment-container';
      const brickContainer = document.getElementById(containerId);
      if (!brickContainer) {
        throw new Error(`Container #${containerId} não encontrado no HTML`);
      }

      // Store the controller instance (await the promise)
      this.brickInstance = await window.mp.bricks().create('payment', containerId, settings);
      console.log('✓ Payment Brick renderizado com sucesso');

    } catch (error) {
      console.error('Erro ao renderizar Payment Brick:', error);
      this.showNotification(`Erro ao carregar formulário de pagamento: ${error.message}`, 'error');
    }
  }

  /**
   * Handle Payment Brick submission
   */
  async handlePaymentSubmit(data) {
    try {
      console.log('🔄 Processando pagamento no servidor...');

      // Mostrar loading
      this.showNotification('Processando pagamento...', 'info');

      // Prepare payload for backend
      const customerName = this.getCustomerName();
      const customerEmail = this.getCustomerEmail();

      if (!customerName || customerName.trim() === '') {
        this.showNotification('Por favor, preencha seu Nome e Sobrenome nos detalhes de faturamento.', 'error');
        throw new Error('Nome do cliente obrigatório');
      }

      if (customerEmail === 'customer@example.com' || !customerEmail) {
        this.showNotification('Por favor, preencha seu Email nos detalhes de faturamento.', 'error');
        throw new Error('Email do cliente obrigatório');
      }

      const payload = {
        ...data,
        payer: {
          ...data.payer,
          email: customerEmail,
          first_name: customerName.split(' ')[0],
          last_name: customerName.split(' ').slice(1).join(' '),
          phone: this.getCustomerPhone()
        },
        description: `Pedido ${Date.now()}`,
        external_reference: `ORD-${Date.now()}`,
        notification_url: 'https://seusite.com/webhook/mercado-pago', // Replace with actual URL if available
        additional_info: {
          items: cart.getCart().map(item => {
            let price = 0;
            if (typeof item.price === 'number') {
              price = item.price;
            } else if (typeof item.price === 'string') {
              price = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
            }
            return {
              id: item.id,
              title: item.title,
              description: item.title,
              picture_url: item.image || '',
              category_id: 'fashion',
              quantity: item.quantity,
              unit_price: price
            };
          }),
          payer: {
            first_name: this.getCustomerName().split(' ')[0],
            last_name: this.getCustomerName().split(' ').slice(1).join(' '),
            phone: {
              area_code: '11', // Should be extracted from phone input
              number: '999999999' // Should be extracted from phone input
            },
            address: this.getCustomerAddress() // Add address here
          }
        }
      };

      console.log('Dados enviados ao backend:', payload);

      // Enviar dados para backend
      const response = await fetch('/api/pagamento-mercado-pago', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers.get('content-type'));

      // Verificar se response é válido
      if (!response.ok) {
        const errorText = await response.text();
        console.error('✗ Erro HTTP:', response.status, errorText);

        // Tentar fazer parse para ver se é erro de estoque
        try {
          const errObj = JSON.parse(errorText);
          // Lança o objeto stringificado para ser tratado no catch externo
          throw new Error(JSON.stringify(errObj));
        } catch (e) {
          // Se não for JSON, lança texto normal
          throw new Error(errorText || `Erro ${response.status}`);
        }
      }

      // Tentar fazer parse de JSON
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        const text = await response.text();
        console.error('✗ Erro ao fazer parse JSON:', parseError);
        console.error('📝 Conteúdo da resposta:', text);
        throw new Error('Resposta inválida do servidor (não é JSON válido)');
      }

      console.log('✓ Resposta do servidor:', result);

      if (result.success) {
        console.log('✅ Pagamento processado!', result);
        this.showNotification('Pedido realizado! Redirecionando...', 'success');

        // Redirecionar para página de sucesso após 2 segundos
        setTimeout(() => {
          window.location = `thankyou.html?transaction=${result.transaction_id}`;
        }, 2000);
        return true;
      } else {
        console.error('✗ Pagamento recusado:', result);
        const errorMsg = result.message || result.details || 'Pagamento recusado pelo Mercado Pago';
        throw new Error(errorMsg);
      }

    } catch (error) {
      console.error('✗ Erro ao processar pagamento:', error);

      // Tenta extrair mensagem amigável do JSON de erro se disponível
      let msg = error.message;
      try {
        // Se a mensagem for um JSON stringificado (como acontece em alguns throws acima)
        if (msg.startsWith('{')) {
          const errorObj = JSON.parse(msg);
          if (errorObj.error === 'Estoque insuficiente' && errorObj.message) {
            msg = `⚠️ ${errorObj.message}`;
          } else {
            msg = errorObj.message || errorObj.error || msg;
          }
        }
      } catch (e) {
        // falha no parse, usa mensagem original
      }

      this.showNotification(msg, 'error');

      // Re-throw para parar processamento se necessário (mas o catch do brick já captura)
      throw error;
    }
  }

  /**
   * Get order total from page
   */
  getOrderTotal() {
    const totalElement = document.getElementById('checkout-total');
    if (!totalElement) {
      console.warn('⚠️ Elemento #checkout-total não encontrado');
      return 0;
    }

    let text = totalElement.textContent || totalElement.innerText;
    if (!text) {
      console.warn('⚠️ Valor total vazio');
      return 0;
    }

    // Parse: 'R$ 1.234,56' -> 1234.56
    let cleaned = text.replace(/\s/g, '').replace('R$', '');

    // Handle BR format: 1.234,56
    if (cleaned.indexOf(',') !== -1 && cleaned.indexOf('.') !== -1) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.indexOf(',') !== -1 && cleaned.indexOf('.') === -1) {
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.replace(/[^0-9.\-]/g, '');
    }

    const value = parseFloat(cleaned);
    console.log('💰 Total parseado:', value);
    return isNaN(value) ? 0 : value;
  }

  /**
   * Get customer email from form
   */
  getCustomerEmail() {
    const emailInput = document.getElementById('c_email_address');
    if (!emailInput) {
      console.error('Campo de email (c_email_address) não encontrado!');
      return '';
    }
    const email = emailInput.value;
    console.log('📧 Email capturado do formulário:', email);
    return email;
  }

  /**
   * Get customer name from form
   */
  getCustomerName() {
    const firstNameInput = document.getElementById('c_fname');
    const lastNameInput = document.getElementById('c_lname');
    const firstName = firstNameInput ? firstNameInput.value : '';
    const lastName = lastNameInput ? lastNameInput.value : '';
    const fullName = `${firstName} ${lastName}`.trim();
    console.log('👤 Nome:', fullName);
    return fullName;
  }

  /**
   * Get customer address from form
   */
  getCustomerAddress() {
    const street = document.getElementById('c_address')?.value || '';
    const zip = document.getElementById('c_postal_zip')?.value || '';
    const state = document.getElementById('c_country')?.value || '';
    const city = document.getElementById('c_city')?.value || '';
    // Neighborhood isn't in form, mapped to empty

    return {
      zip_code: zip,
      street_name: street,
      city: city,
      federal_unit: state
    };
  }

  /**
   * Get customer phone from form
   */
  getCustomerPhone() {
    const phoneInput = document.getElementById('c_phone');
    if (!phoneInput) {
      return { area_code: '11', number: '999999999' }; // Fallback
    }
    const rawPhone = phoneInput.value.replace(/\D/g, '');
    const areaCode = rawPhone.substring(0, 2) || '11';
    const number = rawPhone.substring(2) || '999999999';

    return {
      area_code: areaCode,
      number: number
    };
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);

    const notification = document.createElement('div');
    const alertClass = type === 'success' ? 'alert-success' : type === 'error' ? 'alert-danger' : 'alert-info';
    notification.className = `alert ${alertClass} alert-dismissible fade show`;
    notification.role = 'alert';
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.maxWidth = '500px';

    document.body.appendChild(notification);

    // Auto-remover após 5 segundos
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  /**
   * Hide loader
   */
  hideBrickLoader() {
    const loader = document.getElementById('brick-loader');
    if (loader) {
      loader.style.display = 'none';
    }
  }

  /**
   * Update amount (se carrinho mudar)
   */
  updateAmount(newAmount) {
    try {
      if (this.brickInstance) {
        // Use the controller instance to update
        this.brickInstance.update({
          initialization: {
            amount: newAmount
          }
        });
        console.log(`💰 Amount atualizado para: ${newAmount}`);
      } else {
        console.warn('⚠️ Brick instance not ready yet');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao atualizar amount:', error.message);
    }
  }
}

/**
 * Initialize Payment Brick when DOM is ready
 */
// Export/Expose class globally
window.PaymentBrickManager = PaymentBrickManager;
console.log('✓ Classe PaymentBrickManager carregada');
