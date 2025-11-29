# Integração de Pagamentos - Teodoro Fitness

Este guia mostra como configurar e usar a integração com Pagar.me ou Mercado Pago no seu site.

## 📋 Conteúdo

- [Pré-requisitos](#pré-requisitos)
- [Configuração Inicial](#configuração-inicial)
- [Pagar.me](#pagarme)
- [Mercado Pago](#mercado-pago)
- [Instalação e Execução](#instalação-e-execução)
- [Testando](#testando)
- [Estrutura de Arquivos](#estrutura-de-arquivos)

---

## Pré-requisitos

- Node.js 14+ instalado ([Download](https://nodejs.org/))
- Conta em uma das plataformas de pagamento:
  - [Pagar.me](https://pagar.me)
  - [Mercado Pago](https://mercadopago.com.br)

---

## Configuração Inicial

### 1. Renomear arquivo de configuração

Renomeie `.env.example` para `.env`:

```bash
# Windows PowerShell
Rename-Item .env.example .env
```

### 2. Instalar dependências

```bash
npm install
```

Isso instalará:
- **express**: Framework web
- **axios**: Cliente HTTP
- **cors**: Habilitar requisições cross-origin
- **dotenv**: Gerenciar variáveis de ambiente
- **nodemon**: Recarregar servidor automaticamente (desenvolvimento)

---

## Pagar.me

### Obter Credenciais

1. Acesse [app.pagar.me](https://app.pagar.me/account/api)
2. Vá para **API Keys**
3. Copie sua **API Key** (chave de teste/produção)
4. Copie sua **Encryption Key**

### Configurar .env

```env
PAGAR_ME_API_KEY=sk_test_seu_api_key_aqui
PAGAR_ME_ENCRYPTION_KEY=ek_test_seu_encryption_key_aqui
```

### Cartões de Teste (Modo Teste)

| Bandeira    | Número               | Exp | CVV |
|-----------|------------------|-----|-----|
| Visa      | 4111111111111111 | 12/25 | 123 |
| Mastercard| 5555555555554444 | 12/25 | 123 |
| Amex      | 378282246310005  | 12/25 | 1234 |

### Documentação

- [Pagar.me - API Documentation](https://docs.pagar.me/)
- [Pagar.me - Postman Collection](https://www.postman.com/pagarme/workspace/pagar-me-api)

---

## Mercado Pago

### Obter Credenciais

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers/panel)
2. Faça login ou crie uma conta
3. Vá para **Credenciais de produção** ou **Credenciais de teste**
4. Copie seu **Access Token**
5. Copie sua **Public Key**

### Configurar .env

```env
MERCADO_PAGO_TOKEN=TEST-seu_token_aqui
MERCADO_PAGO_PUBLIC_KEY=TEST-sua_public_key_aqui
```

### Cartões de Teste (Modo Teste)

| Bandeira    | Número               | Exp | CVV |
|-----------|------------------|-----|-----|
| Visa      | 4111111111111111 | 11/25 | 123 |
| Mastercard| 5555555555554444 | 11/25 | 123 |
| Amex      | 378282246310005  | 11/25 | 1234 |

### Documentação

- [Mercado Pago - API Reference](https://www.mercadopago.com.br/developers/pt/reference)
- [Mercado Pago - SDKs](https://www.mercadopago.com.br/developers/pt/guides)

---

## Instalação e Execução

### Modo Desenvolvimento (com auto-reload)

```bash
npm run dev
```

Saída esperada:
```
Servidor de pagamentos rodando na porta 3000
Pagar.me: Configurado
Mercado Pago: Configurado
```

### Modo Produção

```bash
npm start
```

---

## Testando

### 1. Verificar Status do Servidor

```bash
curl http://localhost:3000/api/status
```

Resposta:
```json
{
  "status": "Servidor rodando",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "pagar_me_configured": true,
  "mercado_pago_configured": true
}
```

### 2. Testar Pagamento (Pagar.me)

```bash
curl -X POST http://localhost:3000/api/pagamento-pagar-me \
  -H "Content-Type: application/json" \
  -d '{
    "card_number": "4111111111111111",
    "card_holder": "MARIA SILVA",
    "card_expiration_date": "12/25",
    "card_cvv": "123",
    "amount": 150.00,
    "customer_email": "maria@email.com",
    "customer_name": "Maria Silva",
    "customer_phone": "11987654321",
    "order_id": "ORD-001"
  }'
```

### 3. Testar Pagamento (Mercado Pago)

```bash
curl -X POST http://localhost:3000/api/pagamento-mercado-pago \
  -H "Content-Type: application/json" \
  -d '{
    "card_number": "4111111111111111",
    "card_holder": "MARIA SILVA",
    "card_expiration_date": "12/25",
    "card_cvv": "123",
    "amount": 150.00,
    "customer_email": "maria@email.com",
    "customer_name": "Maria Silva",
    "customer_phone": "11987654321",
    "installments": 1,
    "order_id": "ORD-001"
  }'
```

---

## Estrutura de Arquivos

```
teodorofit/
├── server.js                 # Servidor Node.js principal
├── package.json              # Dependências do projeto
├── .env                      # Variáveis de ambiente (criar a partir de .env.example)
├── .env.example              # Template de configuração
├── checkout.html             # Página de checkout com formulário de pagamento
├── thankyou.html             # Página de confirmação
├── js/
│   ├── payment.js            # Classes e validações de pagamento
│   ├── custom.js             # Scripts customizados
│   └── bootstrap.bundle.min.js
├── css/
│   ├── style.css
│   └── bootstrap.min.css
└── README-PAGAMENTOS.md      # Este arquivo
```

---

## Usando no Seu Site

### 1. Iniciar o Servidor

```bash
npm start
```

O servidor estará em `http://localhost:3000`

### 2. Formulário de Checkout

O `checkout.html` já está configurado com:

- ✅ Formulário de cartão de crédito
- ✅ Validação em tempo real
- ✅ Detecção de bandeira
- ✅ Formatação automática
- ✅ Suporte a parcelamento
- ✅ Integração com backend

### 3. Trocar Provedor de Pagamento

No seu `checkout.html`, altere a linha:

```javascript
// Para Mercado Pago (padrão)
const paymentProcessor = new PaymentProcessor('mercado-pago');

// Ou para Pagar.me
const paymentProcessor = new PaymentProcessor('pagar-me');
```

---

## Recursos de Segurança

### ✅ Já Implementados

- Validação de número de cartão (Algoritmo de Luhn)
- Validação de data de expiração
- Validação de CVV
- Detecção automática de bandeira
- HTTPS recomendado em produção
- Variáveis de ambiente para chaves secretas

### 📝 TODO para Produção

- [ ] Usar HTTPS
- [ ] Implementar rate limiting
- [ ] Adicionar logging detalhado
- [ ] Implementar autenticação de usuários
- [ ] Adicionar rastreamento de transações em BD
- [ ] Implementar webhooks para confirmação de pagamentos
- [ ] PCI DSS compliance

---

## Solução de Problemas

### Erro: "ENOENT: no such file or directory, open '.env'"

**Solução**: Crie o arquivo `.env` a partir de `.env.example`:
```bash
Rename-Item .env.example .env
```

### Erro: "ERR_MODULE_NOT_FOUND"

**Solução**: Instale as dependências:
```bash
npm install
```

### Erro: "Port 3000 already in use"

**Solução**: Mude a porta no `.env`:
```env
PORT=3001
```

### Pagamento recusado em teste

**Verifique**:
- Está usando cartões de teste?
- A data está no futuro?
- Credenciais estão corretas no `.env`?
- Modo de teste está ativado?

---

## Webhook para Notificações

### Pagar.me Webhook

Registre em `https://app.pagar.me/account/webhooks`:
```
URL: https://seu-site.com/webhook/pagar-me
Eventos: charge.succeeded, charge.failed
```

### Mercado Pago Webhook

Registre em `https://www.mercadopago.com.br/developers/pt/guides`:
```
URL: https://seu-site.com/webhook/mercado-pago
Eventos: payment.success, payment.failure
```

---

## Próximas Etapas

1. **Integração com Banco de Dados**: Armazenar transações
2. **Sistema de Cupons**: Implementar desconto por código
3. **Envio de Email**: Confirmação de pedido
4. **Painel de Administração**: Gerenciar vendas
5. **Relatorios**: Analytics de vendas

---

## Suporte

Para dúvidas:
- 📧 Contato: teodorofitness@email.com
- 📞 WhatsApp: +55 62 98218-7692
- 🐙 GitHub: [CodeBridge Solutions](https://github.com/CodeBridge-Solutions)

---

**Versão**: 1.0.0
**Última atualização**: Novembro 2024
