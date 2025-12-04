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
          onSubmit: (data) => {
            console.log('Payment Brick submitted:', data);
            return this.handlePaymentSubmit(data);
          },
          onError: (error) => {
            console.error('✗ Erro no Payment Brick:', error);
            this.showNotification(`Erro: ${error.message}`, 'error');
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
      console.log('Processando pagamento...', data);

      // Mostrar loading
      this.showNotification('Processando pagamento...', 'info');

      // Enviar dados para backend
      const response = await fetch('/api/pagamento-mercado-pago', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment_id: data.id, // Payment ID gerado pelo Brick
          order_id: `ORD-${Date.now()}`,
          amount: this.getOrderTotal(),
          customer_email: this.getCustomerEmail(),
          customer_name: this.getCustomerName(),
          installments: data.installments || 1
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✓ Pagamento aprovado!', result);
        this.showNotification('Pagamento aprovado! 🎉', 'success');
        
        // Redirecionar para página de sucesso após 2 segundos
        setTimeout(() => {
          window.location = `thankyou.html?transaction=${result.transaction_id}`;
        }, 2000);
      } else {
        console.error('✗ Pagamento recusado:', result);
        throw new Error(result.message || 'Pagamento recusado pelo Mercado Pago');
      }

    } catch (error) {
      console.error('✗ Erro ao processar pagamento:', error);
      this.showNotification(`Erro: ${error.message}`, 'error');
      return false; // Impede redirecionamento automático do Brick
    }
  }

  /**
   * Get order total from page
   */
  getOrderTotal() {
    const totalElement = document.getElementById('checkout-total');
    if (!totalElement) return 0;

    let text = totalElement.textContent || totalElement.innerText;
    if (!text) return 0;

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
    return isNaN(value) ? 0 : value;
  }

  /**
   * Get customer email from form
   */
  getCustomerEmail() {
    const emailInput = document.getElementById('c_email_address');
    return emailInput ? emailInput.value : 'customer@example.com';
  }

  /**
   * Get customer name from form
   */
  getCustomerName() {
    const firstNameInput = document.getElementById('c_fname');
    const lastNameInput = document.getElementById('c_lname');
    const firstName = firstNameInput ? firstNameInput.value : '';
    const lastName = lastNameInput ? lastNameInput.value : '';
    return `${firstName} ${lastName}`.trim();
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const alertClass = type === 'success' ? 'alert-success' : type === 'error' ? 'alert-danger' : 'alert-info';
    notification.className = `alert ${alertClass} alert-dismissible fade show`;
    notification.role = 'alert';
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
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
    if (this.brickInstance && window.mp) {
      window.mp.bricks().update('payment', this.brickId, {
        initialization: {
          amount: newAmount
        }
      });
      console.log(`✓ Amount atualizado para: ${newAmount}`);
    }
  }
}

/**
 * Initialize Payment Brick when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  // Valores do .env (configurados no checkout.html)
  const publicKey = window.MP_PUBLIC_KEY || '';
  const brickId = window.MP_BRICK_ID || '';

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
    window.paymentBrickManager.updateAmount(
      window.paymentBrickManager.getOrderTotal()
    );
  });
});
