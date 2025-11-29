// Script para processar pagamentos no cliente
class PaymentProcessor {
  constructor(apiProvider = 'mercado-pago') {
    this.apiProvider = apiProvider;
    this.cardData = {};
  }

  // Validar número do cartão (Luhn algorithm)
  validateCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) return false;
    
    let sum = 0;
    let isEven = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  }

  // Validar data de expiração
  validateExpirationDate(date) {
    const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!regex.test(date)) return false;
    
    const [month, year] = date.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expYear = parseInt(year, 10);
    const expMonth = parseInt(month, 10);
    
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;
    
    return true;
  }

  // Validar CVV
  validateCVV(cvv) {
    return /^\d{3,4}$/.test(cvv);
  }

  // Formatar número do cartão
  formatCardNumber(cardNumber) {
    return cardNumber
      .replace(/\D/g, '')
      .replace(/(\d{4})/g, '$1 ')
      .trim()
      .substring(0, 19);
  }

  // Formatar data de expiração
  formatExpirationDate(date) {
    const cleaned = date.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  }

  // Obter bandeira do cartão
  getCardBrand(cardNumber) {
    const cleaned = cardNumber.replace(/\D/g, '');
    const patterns = {
      visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
      mastercard: /^5[1-5][0-9]{14}$/,
      amex: /^3[47][0-9]{13}$/,
      elo: /^(4011(78|79)|43(1274|8935)|45(1416|7393|763(1|2))|50(4175|6699|67[0-6][0-9]|677[0-8]|9[0-8][0-9]|99[0-8])|627780|63(6297|6368)|650(03([^3])|04([0-9])|05(0|1)|4([0-3]|[5-9])|5([0-2]|[4-9])|9([0-2]|[3-9])|541|592|7(70|71)|9(201|66))|651652|655000|655021|65523[1-3])|627595|992915)/,
      hipercard: /^(384100|384140|384160|606282|637095|637568|60(?!11))/
    };

    for (const [brand, regex] of Object.entries(patterns)) {
      if (regex.test(cleaned)) return brand;
    }
    return 'unknown';
  }

  // Processar pagamento
  async processPayment(paymentData) {
    try {
      // Validações
      if (!this.validateCardNumber(paymentData.card_number)) {
        throw new Error('Número do cartão inválido');
      }
      if (!this.validateExpirationDate(paymentData.card_expiration_date)) {
        throw new Error('Data de expiração inválida ou expirada');
      }
      if (!this.validateCVV(paymentData.card_cvv)) {
        throw new Error('CVV inválido');
      }

      // Mostrar loading
      this.showLoading(true);

      // Enviar para o servidor
      const endpoint = this.apiProvider === 'pagar-me' 
        ? '/api/pagamento-pagar-me' 
        : '/api/pagamento-mercado-pago';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar pagamento');
      }

      return {
        success: true,
        transaction_id: data.transaction_id,
        status: data.status,
        message: 'Pagamento realizado com sucesso!'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.showLoading(false);
    }
  }

  // Mostrar/ocultar loading
  showLoading(show) {
    let loader = document.getElementById('payment-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'payment-loader';
      loader.innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Processando...</span></div>';
      loader.style.cssText = 'display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;';
      document.body.appendChild(loader);
    }
    loader.style.display = show ? 'block' : 'none';
  }
}

// Inicializar
const paymentProcessor = new PaymentProcessor('mercado-pago'); // Mudar para 'pagar-me' se necessário

// Event listeners para formatação de campos
document.addEventListener('DOMContentLoaded', function() {
  const cardNumberInput = document.getElementById('card_number');
  const expirationInput = document.getElementById('card_expiration_date');
  const cvvInput = document.getElementById('card_cvv');

  if (cardNumberInput) {
    cardNumberInput.addEventListener('input', function(e) {
      e.target.value = paymentProcessor.formatCardNumber(e.target.value);
    });
  }

  if (expirationInput) {
    expirationInput.addEventListener('input', function(e) {
      e.target.value = paymentProcessor.formatExpirationDate(e.target.value);
    });
  }

  if (cvvInput) {
    cvvInput.addEventListener('input', function(e) {
      e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
    });
  }
});
