const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendReceiptEmail(to, items, total, status) {
  try {
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">R$ ${item.unit_price.toFixed(2)}</td>
      </tr>
    `).join('');

    let subject = 'Recibo do seu Pedido - Teodoro Fitness';
    let title = 'Obrigado pela sua compra!';
    let message = 'Seu pagamento foi aprovado com sucesso. Abaixo estão os detalhes do seu pedido:';

    if (status === 'pending' || status === 'in_process') {
      subject = 'Pedido Recebido - Aguardando Pagamento';
      title = 'Pedido Realizado!';
      message = 'Seu pedido foi recebido e está aguardando a confirmação do pagamento. Assim que confirmado, você receberá outro email.';
    }

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { color: #ef5734; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f8f9fa; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            .total { font-weight: bold; font-size: 1.2em; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="header">${title}</h1>
            <p>Olá,</p>
            <p>${message}</p>
            
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Qtd</th>
                  <th>Preço</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="text-align: right; font-weight: bold;">Total:</td>
                  <td class="total">R$ ${total}</td>
                </tr>
              </tfoot>
            </table>
            
            <p style="margin-top: 30px;">Se tiver dúvidas, entre em contato conosco.</p>
            <p>Atenciosamente,<br>Equipe Teodoro Fitness</p>
          </div>
        </body>
        </html>
      `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: html
    };

    saveEmailLocally('RECEIPT', to, subject, html);

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email enviado:', info.response);
  } catch (error) {
    console.error('✗ Erro ao enviar email:', error);
  }
}

async function sendAdminNotification(items, total, customerEmail, payerData, status) {
  try {
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">R$ ${item.unit_price.toFixed(2)}</td>
      </tr>
    `).join('');

    let subject = `🔔 Novo Pedido Recebido! - R$ ${total}`;
    let title = 'Novo Pedido Realizado!';
    let message = 'Um novo pedido foi aprovado no site.';

    if (status === 'pending' || status === 'in_process') {
      subject = `⏳ Novo Pedido (Pendente) - R$ ${total}`;
      message = 'Um novo pedido foi realizado e está aguardando pagamento (Pix/Boleto).';
    }

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #28a745;">${title}</h1>
          <p>${message}</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Dados do Cliente:</h3>
            <p><strong>Nome:</strong> ${payerData.first_name} ${payerData.last_name}</p>
            <p><strong>Email:</strong> ${customerEmail}</p>
            <p><strong>Telefone:</strong> (${payerData.phone.area_code}) ${payerData.phone.number}</p>
          </div>

          <h3>Itens do Pedido:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #eee;">
                <th style="padding: 10px; text-align: left;">Produto</th>
                <th style="padding: 10px; text-align: left;">Qtd</th>
                <th style="padding: 10px; text-align: left;">Preço</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                <td style="padding: 10px; font-weight: bold;">R$ ${total}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Envia para o próprio email da loja
      subject: subject,
      html: html
    };

    saveEmailLocally('ADMIN', process.env.EMAIL_USER, subject, html);

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Notificação admin enviada:', info.response);
  } catch (error) {
    console.error('✗ Erro ao enviar notificação admin:', error);
  }
}

// Função auxiliar para salvar email localmente (debug)
function saveEmailLocally(type, to, subject, html) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `local_emails/${timestamp}_${type}_to_${to}.html`;

    // Adicionar cabeçalho com metadados
    const fileContent = `<!--
      TO: ${to}
      SUBJECT: ${subject}
      DATE: ${new Date().toLocaleString()}
    -->
    ${html}`;

    fs.writeFileSync(path.join(__dirname, filename), fileContent);
    console.log(`💾 Email salvo localmente em: ${filename}`);
  } catch (error) {
    console.error('Erro ao salvar email localmente:', error);
  }
}

async function sendLowStockAlert(lowStockItems) {
  try {
    const itemsHtml = lowStockItems.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; color: red; font-weight: bold;">${item.stock}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.low_stock_threshold}</td>
      </tr>
    `).join('');

    const subject = '⚠️ Alerta de Estoque Baixo - Teodoro Fitness';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc3545;">Atenção: Estoque Baixo!</h1>
          <p>Os seguintes produtos atingiram o nível mínimo de estoque:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #eee;">
                <th style="padding: 10px; text-align: left;">Produto</th>
                <th style="padding: 10px; text-align: left;">Estoque Atual</th>
                <th style="padding: 10px; text-align: left;">Mínimo</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <p style="margin-top: 20px;">Por favor, providencie a reposição.</p>
        </div>
      `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: subject,
      html: html
    };

    // Salvar localmente antes de tentar enviar
    saveEmailLocally('ALERT', process.env.EMAIL_USER, subject, html);

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Alerta de estoque enviado:', info.response);
  } catch (error) {
    console.error('✗ Erro ao enviar alerta de estoque:', error);
  }
}

function updateStock(purchasedItems) {
  try {
    const productsPath = path.join(__dirname, 'products.json');

    if (!fs.existsSync(productsPath)) {
      console.error('Arquivo products.json não encontrado!');
      return;
    }

    const productsData = fs.readFileSync(productsPath, 'utf8');
    let products = JSON.parse(productsData);
    let lowStockItems = [];
    let stockUpdated = false;

    purchasedItems.forEach(item => {
      // Tenta encontrar o produto pelo ID ou pelo título (fallback)
      const productIndex = products.findIndex(p => p.id === item.id || p.title === item.title);

      if (productIndex !== -1) {
        const product = products[productIndex];

        // CORREÇÃO: Usar 'quantity' em vez de 'stock' para atualizar
        const currentQty = product.quantity !== undefined ? product.quantity : (product.stock || 0);
        const newStock = Math.max(0, currentQty - item.quantity);

        products[productIndex].quantity = newStock;
        // Mantém sync se existir o campo antigo
        if (product.stock !== undefined) products[productIndex].stock = newStock;

        stockUpdated = true;
        console.log(`📉 Estoque baixado: ${product.title} (${currentQty} -> ${newStock})`);

        // Verificar nível baixo
        if (newStock <= (product.low_stock_threshold || 5)) {
          lowStockItems.push({
            ...product,
            stock: newStock // Para o email usar o valor certo
          });
        }
      } else {
        console.warn(`Produto não encontrado no estoque: ${item.title} (ID: ${item.id})`);
      }
    });

    if (stockUpdated) {
      fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
      console.log('💾 products.json salvo com sucesso.');
    }

    if (lowStockItems.length > 0) {
      sendLowStockAlert(lowStockItems);
    }

  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
  }
}

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security Middleware
// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Desativa CSP para permitir scripts inline
}));

// Rate Limiting (Proteção contra DDoS/Spam)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // AUMENTADO PARA 1000 para evitar bloqueio em testes
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisições deste IP, por favor tente novamente mais tarde.'
});
app.use('/api/', limiter); // Aplica apenas nas rotas de API

// Middleware
app.use(express.json());
app.use(cors()); // Em produção, configure a origin: 'https://seusite.com'
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

function validateStock(items) {
  try {
    const productsPath = path.join(__dirname, 'products.json');
    if (!fs.existsSync(productsPath)) return { valid: true }; // Se não tiver controle, permite

    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    const unavailable = [];

    items.forEach(item => {
      const product = products.find(p => p.id === item.id || p.title === item.title);
      if (product) {
        // CORREÇÃO: Usar 'quantity' em vez de 'stock' para validar
        const availableStock = product.quantity !== undefined ? product.quantity : (product.stock || 0);

        if (availableStock < item.quantity) {
          unavailable.push({
            title: product.title,
            available: availableStock,
            requested: item.quantity
          });
        }
      }
    });

    return {
      valid: unavailable.length === 0,
      unavailable
    };
  } catch (error) {
    console.error('Erro ao validar estoque:', error);
    return { valid: true }; // Em caso de erro técnico, não bloqueia (opcional)
  }
}

function calculateOrderTotal(items) {
  try {
    const productsPath = path.join(__dirname, 'products.json');
    if (!fs.existsSync(productsPath)) return 0;

    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    let total = 0;

    items.forEach(item => {
      const product = products.find(p => p.id === item.id || p.title === item.title);
      if (product) {
        total += product.price * item.quantity;
      }
    });

    return total;
  } catch (error) {
    console.error('Erro ao calcular total:', error);
    return 0;
  }
}

// ============ MERCADO PAGO - PAYMENT BRICK ============
// Rota para processar pagamento com Payment Brick
app.post('/api/pagamento-mercado-pago', async (req, res) => {
  try {
    console.log('🔔 Rota /api/pagamento-mercado-pago chamada!');
    const paymentData = req.body;

    console.log('Recebido /api/pagamento-mercado-pago -> req.body:', JSON.stringify(paymentData));

    // Validar estoque antes de processar
    const stockCheck = validateStock(paymentData.additional_info.items);
    if (!stockCheck.valid) {
      console.log('🚫 Estoque insuficiente:', stockCheck.unavailable);
      return res.status(400).json({
        error: 'Estoque insuficiente',
        unavailable_items: stockCheck.unavailable,
        message: `Os seguintes itens acabaram: ${stockCheck.unavailable.map(i => i.title).join(', ')}`
      });
    }

    // CALCULAR TOTAL NO SERVIDOR (SEGURANÇA CONTRA ADULTERAÇÃO DE PREÇO)
    const safeTotal = calculateOrderTotal(paymentData.additional_info.items);

    const logMessage = `[${new Date().toISOString()}] 💰 Total calculado no servidor: R$ ${safeTotal} (Cliente enviou: R$ ${paymentData.transaction_amount})\n`;
    fs.appendFileSync(path.join(__dirname, 'server.log'), logMessage);
    console.log(logMessage);

    // Sobrescrever o valor enviado pelo frontend com o valor seguro
    // Se o valor for 0 (erro ou produto não encontrado), bloqueia
    if (safeTotal <= 0) {
      return res.status(400).json({ error: 'Erro ao calcular valor do pedido.' });
    }

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
      transaction_amount: Number(safeTotal), // USA O VALOR SEGURO
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
    const isSuccess = response.data.status === 'approved' || response.data.status === 'pending' || response.data.status === 'in_process';

    console.log(`🔍 Status do pagamento: ${response.data.status}`);
    console.log(`🔍 isSuccess: ${isSuccess}`);

    res.json({
      success: isSuccess,
      transaction_id: response.data.id,
      status: response.data.status,
      message: isSuccess ? 'Pagamento processado com sucesso!' : `Pagamento com status: ${response.data.status}`,
      raw: response.data
    });

    // Enviar email se aprovado ou pendente (Pix)
    if (isSuccess) {
      // Usar o email original do formulário (paymentData), pois o Mercado Pago Sandbox substitui por test_user
      const recipientEmail = paymentData.payer.email;
      console.log(`📧 Tentando enviar email para: ${recipientEmail} (Status: ${response.data.status})`);
      sendReceiptEmail(recipientEmail, paymentData.additional_info.items, response.data.transaction_amount, response.data.status);

      // Enviar notificação para o admin
      sendAdminNotification(paymentData.additional_info.items, response.data.transaction_amount, recipientEmail, paymentData.payer, response.data.status);

      // Atualizar estoque
      updateStock(paymentData.additional_info.items);

      // SALVAR PEDIDO NO BANCO DE DADOS
      saveOrder({
        id: `ORD-${Date.now()}`,
        customer: {
          name: `${paymentData.payer.first_name} ${paymentData.payer.last_name}`,
          email: recipientEmail,
          phone: `(${paymentData.payer.phone.area_code}) ${paymentData.payer.phone.number}`
        },
        items: paymentData.additional_info.items,
        total: response.data.transaction_amount,
        status: response.data.status,
        payment_method: 'mercadopago',
        transaction_id: response.data.id
      });

    } else {
      console.log('⚠️ Email não enviado pois status não é de sucesso.');
    }

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

// Buscar detalhes do pagamento (para exibir QR Code do Pix)
app.get('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_TOKEN}` }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar pagamento:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: 'Erro ao buscar pagamento' });
  }
});

// Buscar lista de produtos com estoque
// Busca lista de produtos
app.get('/api/products', (req, res) => {
  try {
    const productsPath = path.join(__dirname, 'products.json');
    if (!fs.existsSync(productsPath)) return res.json([]);
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// ============ ADMIN ENDPOINTS ============

// Middleware de Autenticação Admin Simplificado
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Se não tiver senha configurada no servidor, bloqueia tudo
  if (!adminPassword) return res.status(500).json({ error: 'Servidor mal configurado' });

  if (authHeader === `Bearer ${adminPassword}`) {
    next();
  } else {
    res.status(401).json({ error: 'Não autorizado' });
  }
};

// Criar novo produto (Admin)
app.post('/api/products', authenticateAdmin, (req, res) => {
  try {
    const { title, price, image, description, quantity } = req.body;

    // Basic validation
    if (!title || !price) {
      return res.status(400).json({ success: false, error: 'Dados incompletos' });
    }

    const productsPath = path.join(__dirname, 'products.json');
    let products = [];
    if (fs.existsSync(productsPath)) {
      products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    }

    const newProduct = {
      id: Date.now().toString(),
      title,
      price: parseFloat(price),
      image: image || 'images/product-1.png',
      description: description || '',
      quantity: parseInt(quantity) || 0,
      stock: parseInt(quantity) || 0
    };

    products.push(newProduct);
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));

    res.json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ success: false, error: 'Erro ao salvar produto' });
  }
});

// Deletar produto (Admin)
app.delete('/api/products/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const productsPath = path.join(__dirname, 'products.json');

    if (fs.existsSync(productsPath)) {
      let products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
      const initialLength = products.length;
      products = products.filter(p => p.id !== id);

      if (products.length === initialLength) {
        return res.status(404).json({ success: false, error: 'Produto não encontrado' });
      }

      fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
      res.json({ success: true, message: 'Produto removido' });
    } else {
      res.status(404).json({ success: false, error: 'Banco de dados não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar produto' });
  }
});

// Login (Verifica login e senha)
app.post('/api/admin/login', (req, res) => {
  const { login, password } = req.body;

  // Verifica se as variáveis de ambiente estão configuradas
  const envLogin = process.env.ADMIN_LOGIN || 'admin'; // Fallback para 'admin' se não configurado
  const envPass = process.env.ADMIN_PASSWORD;

  console.log(`🔍 Tentativa de Login:`);
  console.log(`   - Recebido: Login="${login}", Pass="${password}"`);
  console.log(`   - Esperado: Login="${envLogin}", Pass="${envPass}"`);
  console.log(`   - Length Pass: Recebido=${password?.length}, Esperado=${envPass?.length}`);

  if (!envPass) {
    return res.status(500).json({ success: false, error: 'Servidor sem senha configurada' });
  }

  if (login === envLogin && password === envPass) {
    // Retorna token simples
    res.json({ success: true, token: password });
  } else {
    res.json({ success: false, error: 'Credenciais inválidas' });
  }
});

// Atualizar Estoque (Protegido)
app.post('/api/admin/stock', authenticateAdmin, (req, res) => {
  try {
    const { productId, newStock } = req.body;
    const productsPath = path.join(__dirname, 'products.json');

    let products = [];
    if (fs.existsSync(productsPath)) {
      products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    }

    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) return res.status(404).json({ error: 'Produto não encontrado' });

    products[productIndex].quantity = parseInt(newStock);
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));

    console.log(`📦 Estoque atualizado: ${products[productIndex].title} -> ${newStock}`);
    res.json({ success: true, product: products[productIndex] });
  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});



// ============ GESTÃO DE PEDIDOS ============

// Função auxiliar para salvar pedido
function saveOrder(orderData) {
  try {
    const ordersPath = path.join(__dirname, 'orders.json');
    let orders = [];

    if (fs.existsSync(ordersPath)) {
      orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
    }

    const newOrder = {
      id: orderData.id || `ORD-${Date.now()}`,
      date: new Date().toISOString(),
      customer: orderData.customer, // { name, email, phone }
      items: orderData.items,
      total: orderData.total,
      status: orderData.status || 'pending', // pending, approved, shipped, etc.
      payment_method: orderData.payment_method,
      transaction_id: orderData.transaction_id
    };

    orders.unshift(newOrder); // Adiciona no início (mais recente primeiro)
    fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
    console.log(`📦 Pedido salvo: ${newOrder.id}`);
    return newOrder;
  } catch (error) {
    console.error('Erro ao salvar pedido:', error);
    return null;
  }
}

// Endpoint para listar pedidos (Admin)
app.get('/api/admin/orders', authenticateAdmin, (req, res) => {
  try {
    const ordersPath = path.join(__dirname, 'orders.json');
    if (!fs.existsSync(ordersPath)) return res.json([]);

    const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
    res.json(orders);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
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
