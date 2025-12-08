const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('.'));

// ============ PAGAR.ME ============
// Rota para processar pagamento com Pagar.me
app.post('/api/pagamento-pagar-me', async (req, res) => {
  try {
    const {
      card_number,
      card_holder,
      card_expiration_date,
      card_cvv,
      amount,
      customer_email,
      customer_name,
      customer_phone,
      order_id
    } = req.body;

    // Validação básica
    if (!card_number || !card_holder || !card_expiration_date || !card_cvv || !amount) {
      return res.status(400).json({ error: 'Campos de cartão obrigatórios' });
    }

    const response = await axios.post(
      'https://api.pagar.me/core/v5/orders',
      {
        customer: {
          email: customer_email,
          name: customer_name,
          phones: [
            {
              country_code: '55',
              number: customer_phone.replace(/\D/g, ''),
              area_code: customer_phone.substring(0, 2)
            }
          ]
        },
        payments: [
          {
            payment_method: 'card',
            card: {
              number: card_number.replace(/\s/g, ''),
              holder_name: card_holder,
              exp_month: parseInt(card_expiration_date.split('/')[0]),
              exp_year: parseInt(card_expiration_date.split('/')[1]),
              cvv: card_cvv
            },
            amount: Math.round(amount * 100) // Converter para centavos
          }
        ],
        metadata: {
          order_id: order_id
        }
      },
      {
        auth: {
          username: process.env.PAGAR_ME_API_KEY,
          password: ''
        }
      }
    );

    res.json({
      success: true,
      transaction_id: response.data.id,
      status: response.data.status,
      message: 'Pagamento processado com sucesso'
    });

  } catch (error) {
    console.error('Erro Pagar.me:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Erro ao processar pagamento',
      details: error.response?.data?.errors || error.message
    });
  }
});

// ============ MERCADO PAGO - PAYMENT BRICK ============
// Rota para processar pagamento com Payment Brick
// ============ MERCADO PAGO - PAYMENT BRICK ============
// Rota para processar pagamento com Payment Brick
app.post('/api/pagamento-mercado-pago', async (req, res) => {
  try {
    const paymentData = req.body;

    console.log('Recebido /api/pagamento-mercado-pago -> req.body:', JSON.stringify(paymentData));

    // Validação básica
    if (!paymentData.token && !paymentData.payment_method_id) {
      return res.status(400).json({ error: 'Dados de pagamento incompletos (token ou payment_method_id faltando)' });
    }

    // Preparar payload para a API do Mercado Pago
    // https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post
    const payload = {
      token: paymentData.token,
      issuer_id: paymentData.issuer_id,
      payment_method_id: paymentData.payment_method_id,
      transaction_amount: Number(paymentData.transaction_amount),
      installments: Number(paymentData.installments),
      description: paymentData.description || 'Produto Teodoro Fitness',
      payer: paymentData.payer,
      external_reference: paymentData.external_reference,
      notification_url: paymentData.notification_url,
      additional_info: paymentData.additional_info
    };

    console.log('Enviando para Mercado Pago API:', JSON.stringify(payload));

    const response = await axios.post(
      'https://api.mercadopago.com/v1/payments',
      payload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.MERCADO_PAGO_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `IDEM-${Date.now()}-${Math.random()}`
        }
      }
    );

    console.log('Resposta Mercado Pago:', JSON.stringify(response.data));

    // Retornar resultado
    res.json({
      success: response.data.status === 'approved',
      transaction_id: response.data.id,
      status: response.data.status,
      message: response.data.status === 'approved' ? 'Pagamento aprovado com sucesso!' : `Pagamento com status: ${response.data.status}`,
      raw: response.data
    });

  } catch (error) {
    console.error('Erro Mercado Pago (Payment Brick):', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Erro ao processar pagamento',
      details: error.response?.data?.message || error.message,
      status: error.response?.data?.status,
      cause: error.response?.data?.cause
    });
  }
});

// ============ WEBHOOK ============
// Webhook para Pagar.me (receber notificações de status)
app.post('/webhook/pagar-me', (req, res) => {
  const event = req.body;

  // Processar evento de pagamento
  if (event.type === 'order.paid' || event.type === 'charge.succeeded') {
    console.log('Pagamento confirmado:', event);
    // Aqui você atualiza o banco de dados
  }

  res.json({ received: true });
});

// Webhook para Mercado Pago
app.post('/webhook/mercado-pago', (req, res) => {
  const { data, type } = req.query;

  if (type === 'payment') {
    console.log('Notificação Mercado Pago:', data);
    // Aqui você busca e atualiza o pagamento
  }

  res.json({ received: true });
});

// ============ ROTAS DE TESTE ============
app.get('/api/status', (req, res) => {
  res.json({
    status: 'Servidor rodando',
    timestamp: new Date(),
    pagar_me_configured: !!process.env.PAGAR_ME_API_KEY,
    mercado_pago_configured: !!process.env.MERCADO_PAGO_TOKEN
  });
});

// Verifica se o access token do Mercado Pago é válido (sem criar pagamento)
app.get('/api/mercado-pago-test', async (req, res) => {
  try {
    const response = await axios.get('https://api.mercadopago.com/v1/users/me', {
      headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_TOKEN}` }
    });
    res.json({ ok: true, account: response.data });
  } catch (error) {
    console.error('Erro validação Mercado Pago:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ ok: false, error: error.response?.data || error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de pagamentos rodando na porta ${PORT}`);
  console.log(`Pagar.me: ${process.env.PAGAR_ME_API_KEY ? 'Configurado' : 'Não configurado'}`);
  // Mostrar apenas prefixo mascarado do token para diagnóstico (não expor o token completo)
  const mpToken = process.env.MERCADO_PAGO_TOKEN || '';
  const masked = mpToken ? (mpToken.length > 10 ? mpToken.slice(0, 6) + '...' + mpToken.slice(-4) : mpToken) : '';
  console.log(`Mercado Pago: ${mpToken ? 'Configurado' : 'Não configurado'} (token: ${masked})`);
});
