# 🚀 Guia Completo: Configurar e Executar API de Pagamentos

## ❗ Pré-requisitos: Instalar Node.js

### Passo 1: Baixar Node.js
1. Acesse: https://nodejs.org/
2. Clique em **"LTS"** (versão recomendada)
3. Baixe o instalador para Windows

### Passo 2: Instalar Node.js
1. Execute o arquivo baixado
2. Clique em **"Next"** até o final
3. ✅ Certifique-se de marcar **"Add to PATH"**
4. Clique em **"Install"**
5. Reinicie o computador (importante!)

### Passo 3: Verificar Instalação
Abra PowerShell e execute:
```powershell
node --version
npm --version
```

Se retornar números de versão (ex: v18.17.0), está instalado! ✅

---

## 🔧 Configurar o Projeto

### Passo 4: Instalar Dependências
Abra PowerShell **como Administrador** e execute:

```powershell
cd "c:\Users\Lucas Guilherme\teodorofit"
npm install
```

Aguarde até aparecer "added X packages".

### Passo 5: Verificar Arquivo .env
Confirme que seu `.env` tem as credenciais:

```env
MERCADO_PAGO_TOKEN=APP_USR-8568483798589697-112823-cfd9187fe49f7d92a0827a63249d7122-3025217709
MERCADO_PAGO_PUBLIC_KEY=APP_USR-238a9213-1f64-478b-b45a-0dbccca53400
PORT=3000
NODE_ENV=development
TEST_MODE=true
```

---

## ▶️ Iniciar o Servidor

### Opção 1: Desenvolvimento (Com Auto-reload)
```powershell
cd "c:\Users\Lucas Guilherme\teodorofit"
npm run dev
```

### Opção 2: Produção
```powershell
cd "c:\Users\Lucas Guilherme\teodorofit"
npm start
```

### Resultado Esperado
```
Servidor de pagamentos rodando na porta 3000
Mercado Pago: Configurado
```

Pronto! O servidor está rodando em `http://localhost:3000`

---

## ✅ Testar a API

### Teste 1: Verificar Status
Abra uma aba do navegador e acesse:
```
http://localhost:3000/api/status
```

Você verá algo como:
```json
{
  "status": "Servidor rodando",
  "timestamp": "2025-01-15T10:30:00Z",
  "mercado_pago_configured": true
}
```

### Teste 2: Processar Pagamento de Teste

Use o **Postman** ou **curl** para fazer uma requisição POST:

**URL:** `http://localhost:3000/api/pagamento-mercado-pago`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
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
}
```

---

## 🌐 Usar no Site

### Alteração no checkout.html
O site já está configurado! Quando o cliente clicar em "Finalizar Compra":

1. ✅ Os dados do cartão são validados
2. ✅ A requisição é enviada para `http://localhost:3000/api/pagamento-mercado-pago`
3. ✅ O pagamento é processado
4. ✅ Página de sucesso é exibida

### Fluxo Completo:
```
Cliente na Loja → Adiciona Produtos → Vai ao Carrinho → Checkout → Preenche Cartão → Clica Finalizar → Pagamento Processado ✅
```

### Configurar `MERCADO_PAGO_PUBLIC_KEY` no cliente

1. Abra o arquivo `checkout.html` e localize o script que define a chave pública (há um placeholder `COLOQUE_SUA_PUBLIC_KEY_AQUI`).
2. Substitua esse placeholder pela sua `MERCADO_PAGO_PUBLIC_KEY` (é seguro expor essa chave no cliente):

```html
<script>
  window.MP_PUBLIC_KEY = 'APP_USR-COLOQUE_AQUI_SUA_PUBLIC_KEY';
  if (window.Mercadopago) Mercadopago.setPublishableKey(window.MP_PUBLIC_KEY);
</script>
```

3. Alternativamente, você pode criar uma rota no servidor que sirva a public key dinamicamente e inserir via `fetch` no frontend. Para testes rápidos, editar `checkout.html` diretamente é mais simples.

4. Após definir a chave pública, recarregue a página de checkout e faça um pagamento de teste. A tokenização será feita no cliente e o servidor receberá apenas o `token`.

---

## 🐛 Solução de Problemas

### Erro: "npm não é reconhecido"
**Solução:** Reinicie o computador após instalar Node.js

### Erro: "Cannot find module"
**Solução:** Execute `npm install` novamente

### Erro: "Port 3000 already in use"
**Solução:** Mude a porta no `.env`:
```env
PORT=3001
```

### Pagamento recusado
**Solução:** Use cartões de teste:
- Visa: `4111111111111111`
- Mastercard: `5555555555554444`

---

## 📝 Resumo de Comandos

```powershell
# Entrar no diretório
cd "c:\Users\Lucas Guilherme\teodorofit"

# Instalar dependências
npm install

# Iniciar em desenvolvimento
npm run dev

# Iniciar em produção
npm start

# Verificar status
# Acesse no navegador: http://localhost:3000/api/status
```

---

## 🎉 Pronto!

Depois que o servidor estiver rodando:
1. Abra `http://localhost:3000` no navegador
2. Navegue normalmente pelo site
3. Adicione produtos ao carrinho
4. Vá ao checkout e preencha o formulário
5. Clique em **"Finalizar Compra"**
6. Seu pagamento será processado! 💳

**Dúvidas?** Verifique o console do Node.js para mensagens de erro.
