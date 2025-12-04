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
          payer: {
            email: this.getCustomerEmail()
          }
        },
        customization: {
          visual: {
            style: {
              theme: 'default' // ou 'dark'
            }
          },
          checkout: {
            theme: 'default'
          }
        },
        callbacks: {
          onReady: () => {
            console.log('✓ Payment Brick pronto');
            this.hideBrickLoader();
          },
          onSubmit: async (formData) => {
            console.log('✓ Payment Brick submitted with formData:', formData);
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
      const brickContainer = document.getElementById('brick-payment-container');
      if (!brickContainer) {
        throw new Error('Container #brick-payment-container não encontrado no HTML');
      }

      this.brickInstance = window.mp.bricks().create('payment', this.brickId, settings);
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

      // Extrair payment_id do formData
      const payment_id = data?.id;
      
      if (!payment_id) {
        console.warn('⚠️ Nenhum payment_id no formData. Tentando enviar formData completo.');
      }

      console.log('Dados enviados ao backend:', {
        payment_id: payment_id || data?.id,
        order_id: `ORD-${Date.now()}`,
        amount: this.getOrderTotal(),
        customer_email: this.getCustomerEmail(),
        customer_name: this.getCustomerName(),
        installments: data?.installments || 1,
        formData_keys: Object.keys(data || {})
      });

      // Enviar dados para backend
      const response = await fetch('/api/pagamento-mercado-pago', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment_id: payment_id || data?.id,
          order_id: `ORD-${Date.now()}`,
          amount: this.getOrderTotal(),
          customer_email: this.getCustomerEmail(),
          customer_name: this.getCustomerName(),
          installments: data.installments || 1
        })
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers.get('content-type'));

      // Verificar se response é válido
      if (!response.ok) {
        const errorText = await response.text();
        console.error('✗ Erro HTTP:', response.status, errorText);
        throw new Error(`Erro ${response.status}: ${errorText || 'Sem resposta do servidor'}`);
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
        console.log('✅ Pagamento aprovado!', result);
        this.showNotification('Pagamento aprovado! 🎉', 'success');
        
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
      this.showNotification(`Erro: ${error.message}`, 'error');
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
    const email = emailInput ? emailInput.value : 'customer@example.com';
    console.log('📧 Email:', email);
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
      if (this.brickInstance && window.mp) {
      window.mp.bricks().update('payment', this.brickId, {
        initialization: {
          amount: newAmount
        }
      });
        console.log(`💰 Amount atualizado para: ${newAmount}`);
      }
    } catch (error) {
      console.warn('⚠️ Erro ao atualizar amount:', error.message);
    }
  }
}

/**
 * Initialize Payment Brick when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('=== Inicializando Payment Brick ===');
  
  // Valores do .env (configurados no checkout.html)
  const publicKey = window.MP_PUBLIC_KEY || '';
  const brickId = window.MP_BRICK_ID || '';

  console.log('🔑 Public Key:', publicKey ? '✓ Definida' : '✗ Não definida');
  console.log('🧱 Brick ID:', brickId ? '✓ Definida' : '✗ Não definida');

  if (!publicKey || !brickId) {
    console.error('✗ PUBLIC_KEY ou BRICK_ID não definidos. Verifique o arquivo de configuração.');
    return;
  }

  // Criar instância do Payment Brick
  window.paymentBrickManager = new PaymentBrickManager(publicKey, brickId);

  // Renderizar Brick no container
  window.paymentBrickManager.renderBrick();

  // Atualizar amount se carrinho for atualizado
  window.addEventListener('cartUpdated', () => {
    const newTotal = window.paymentBrickManager.getOrderTotal();
    window.paymentBrickManager.updateAmount(newTotal);
  });

  console.log('=== Payment Brick inicializado ===');
});
