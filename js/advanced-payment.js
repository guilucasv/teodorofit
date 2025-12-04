// Script avançado para processamento de pagamentos
// Integra validações, formatação e segurança

class AdvancedPaymentProcessor {
  constructor() {
    this.transactionLog = [];
    this.setupEventListeners();
  }

  // Aguarda o carregamento do SDK do Mercado Pago (window.Mercadopago)
  // timeout em ms (padrão 5000)
  ensureMercadoPagoLoaded(timeout = 5000) {
    return new Promise((resolve, reject) => {
      const interval = 100;
      let waited = 0;

      const check = () => {
        if (typeof window !== 'undefined' && window.Mercadopago) {
          // Se houver chave pública definida, garantir que ela foi aplicada
          try {
            if (window.MP_PUBLIC_KEY) {
              Mercadopago.setPublishableKey(window.MP_PUBLIC_KEY);
            }
          } catch (e) {
            // ignore
          }
          resolve(true);
          return;
        }
        waited += interval;
        if (waited >= timeout) {
          reject(new Error('Timeout ao aguardar SDK Mercado Pago'));
          return;
        }
        setTimeout(check, interval);
      };

      check();
    });
  }

  setupEventListeners() {
    // Validação do formulário em tempo real
    const form = document.getElementById('payment-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }
  }

  // Validar CPF/CNPJ
  validateCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    // Validar primeiro dígito
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf[i]) * (10 - i);
    }
    let firstDigit = 11 - (sum % 11);
    firstDigit = firstDigit >= 10 ? 0 : firstDigit;

    if (parseInt(cpf[9]) !== firstDigit) return false;

    // Validar segundo dígito
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf[i]) * (11 - i);
    }
    let secondDigit = 11 - (sum % 11);
    secondDigit = secondDigit >= 10 ? 0 : secondDigit;

    return parseInt(cpf[10]) === secondDigit;
  }

  // Validar telefone
  validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 11;
  }

  // Validar e-mail
  validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // Validar CEP
  validateCEP(cep) {
    const cleaned = cep.replace(/\D/g, '');
    return cleaned.length === 8;
  }

  // Buscar dados do CEP (ViaCEP)
  async fetchAddressByCEP(cep) {
    try {
      const cleaned = cep.replace(/\D/g, '');
      const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return null;
    }
  }

  // Encriptar dados do cartão (simples, usar tokenização em produção)
  encryptCardData(cardData) {
    // Em produção, use a SDK do Pagar.me ou Mercado Pago
    // Esta é apenas uma função stub
    return btoa(JSON.stringify(cardData));
  }

  // Registrar transação
  logTransaction(data) {
    this.transactionLog.push({
      timestamp: new Date().toISOString(),
      ...data
    });
    console.log('Transação registrada:', data);
  }

  // Manipular envio do formulário
  async handleFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      // Coletar dados
      const cardNumber = document.getElementById('card_number').value;
      const cardHolder = document.getElementById('card_holder').value;
      const cardExpiration = document.getElementById('card_expiration_date').value;
      const cardCVV = document.getElementById('card_cvv').value;
      const installments = document.getElementById('installments').value;

      // Validar dados do cartão
      const paymentProcessor = new PaymentProcessor();
      
      if (!paymentProcessor.validateCardNumber(cardNumber)) {
        throw new Error('Número do cartão inválido');
      }
      if (!paymentProcessor.validateExpirationDate(cardExpiration)) {
        throw new Error('Data de expiração inválida');
      }
      if (!paymentProcessor.validateCVV(cardCVV)) {
        throw new Error('CVV inválido');
      }

      // Validar dados de faturamento
      const firstName = document.getElementById('c_fname').value;
      const lastName = document.getElementById('c_lname').value;
      const email = document.getElementById('c_email_address').value;
      const phone = document.getElementById('c_phone').value;
      const cep = document.getElementById('c_postal_zip').value;

      if (!email) throw new Error('Email é obrigatório');
      if (!this.validateEmail(email)) throw new Error('Email inválido');
      if (!this.validatePhone(phone)) throw new Error('Telefone inválido');
      if (!this.validateCEP(cep)) throw new Error('CEP inválido');

      // Log
      this.logTransaction({
        status: 'iniciado',
        firstName,
        email,
        cardBrand: paymentProcessor.getCardBrand(cardNumber)
      });

      // Mostrar mensagem de processamento
      this.showNotification('Processando pagamento...', 'info');

      // Preparar expiration month/year esperado pela SDK
      const expParts = cardExpiration.split('/').map(p => p.trim());
      let expMonth = expParts[0] || '';
      let expYear = expParts[1] || '';
      if (expYear.length === 2) expYear = '20' + expYear;

      // Preencher campos ocultos (adicionados ao form) para a SDK do Mercado Pago
      const expMonthInput = document.getElementById('card_expiration_month');
      const expYearInput = document.getElementById('card_expiration_year');
      if (expMonthInput) expMonthInput.value = expMonth;
      if (expYearInput) expYearInput.value = expYear;

      // Obter payment_method_id a partir do BIN (6 primeiros dígitos)
      const bin = cardNumber.replace(/\s/g, '').slice(0, 6);
      let payment_method_id = null;

      // Garantir que o SDK do Mercado Pago esteja carregado antes de usá-lo
      try {
        await this.ensureMercadoPagoLoaded(5000);
      } catch (err) {
        console.error('SDK Mercado Pago não carregado:', err);
        throw new Error('SDK do Mercado Pago não está disponível. Recarregue a página e tente novamente.');
      }

      const mpGetPaymentMethod = () => new Promise((resolve, reject) => {
        try {
          Mercadopago.getPaymentMethod({ 'bin': bin }, function(status, response) {
            if (status === 200 && response && response.length > 0) {
              resolve(response[0].id);
            } else if (response && response[0] && response[0].id) {
              resolve(response[0].id);
            } else {
              resolve(null);
            }
          });
        } catch (err) {
          resolve(null);
        }
      });

      payment_method_id = await mpGetPaymentMethod();

      // Se não detectamos o payment_method_id via SDK, registrar aviso e mostrar a bandeira estimada
      if (!payment_method_id) {
        console.warn('mp.getPaymentMethod não retornou payment_method_id para BIN', bin);
        const estimatedBrand = paymentProcessor.getCardBrand(cardNumber);
        const brandEl = document.getElementById('card-brand');
        if (brandEl) brandEl.textContent = estimatedBrand === 'unknown' ? '' : estimatedBrand;
      } else {
        const brandEl = document.getElementById('card-brand');
        if (brandEl) brandEl.textContent = payment_method_id;
      }

      // Criar token no cliente usando o form (a SDK vai ler inputs por name)
      const formElement = document.getElementById('payment-form');
      const mpCreateToken = () => new Promise((resolve, reject) => {
        try {
          Mercadopago.createToken(formElement, function(status, resp) {
            if (status === 200 || status === 201) {
              resolve(resp.id);
            } else {
              reject({ status, resp });
            }
          });
        } catch (err) {
          reject(err);
        }
      });

      let token;
      try {
        token = await mpCreateToken();
      } catch (mpErr) {
        console.error('Erro ao criar token Mercado Pago:', mpErr);
        throw new Error('Falha ao tokenizar o cartão. Verifique os dados e tente novamente.');
      }

      // Enviar token e payment_method_id ao servidor
      const response = await fetch('/api/pagamento-mercado-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          payment_method_id: payment_method_id,
          amount: this.getOrderTotal(),
          customer_email: email,
          installments: parseInt(installments),
          order_id: 'ORD-' + Date.now()
        })
      });

      const result = await response.json();

      if (result.success) {
        this.logTransaction({
          status: 'sucesso',
          transaction_id: result.transaction_id
        });

        this.showNotification('Pagamento aprovado! 🎉', 'success');

        // Redirecionar após 2 segundos
        setTimeout(() => {
          window.location = 'thankyou.html?transaction=' + result.transaction_id;
        }, 2000);
      } else {
        // Se a API do servidor retornou detalhes, mostre-os para debug
        const errMsg = result.error || (result.raw && result.raw.cause && result.raw.cause[0] && result.raw.cause[0].description) || 'Erro no pagamento';
        throw new Error(errMsg);
      }

    } catch (error) {
      this.logTransaction({
        status: 'erro',
        error: error.message
      });
      
      this.showNotification('Erro: ' + error.message, 'error');
    } finally {
      submitButton.disabled = false;
    }
  }

  // Obter total do pedido
  getOrderTotal() {
    // Preferir elemento com id `checkout-total`, fallback para selector antigo
    const totalElById = document.getElementById('checkout-total');
    let text = null;
    if (totalElById) {
      text = totalElById.textContent || totalElById.innerText;
    } else {
      const totalElement = document.querySelector('.text-black.font-weight-bold strong:last-of-type');
      if (totalElement) text = totalElement.textContent || totalElement.innerText;
    }

    if (!text) return 0;

    // Normalizar formatos: 'R$ 1.234,56' -> 1234.56 ; 'R$ 100.00' -> 100.00
    // Remover símbolo R$ e espaços
    let cleaned = text.replace(/\s/g, '').replace('R$', '');
    // Se houver vírgula como separador decimal (formato BR), trocar por ponto e remover pontos de milhar
    if (cleaned.indexOf(',') !== -1 && cleaned.indexOf('.') !== -1) {
      // exemplo: 1.234,56 -> remove pontos e troca vírgula
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.indexOf(',') !== -1 && cleaned.indexOf('.') === -1) {
      // exemplo: 1234,56 -> troca vírgula por ponto
      cleaned = cleaned.replace(',', '.');
    } else {
      // manter ponto como decimal
      cleaned = cleaned.replace(/[^0-9.\-]/g, '');
    }

    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : value;
  }

  // Mostrar notificação
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} alert-dismissible fade show`;
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

  // Histórico de transações
  getTransactionHistory() {
    return this.transactionLog;
  }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.advancedPaymentProcessor = new AdvancedPaymentProcessor();

  // Auto-preencher endereço com base no CEP
  const cepInput = document.getElementById('c_postal_zip');
  if (cepInput) {
    cepInput.addEventListener('blur', async (e) => {
      if (window.advancedPaymentProcessor.validateCEP(e.target.value)) {
        const address = await window.advancedPaymentProcessor.fetchAddressByCEP(e.target.value);
        if (address) {
          document.getElementById('c_address').value = address.logradouro;
          // Preencher complemento
          const complement = document.querySelector('input[placeholder="Complemento"]');
          if (complement) complement.value = address.bairro;
        }
      }
    });
  }
});
