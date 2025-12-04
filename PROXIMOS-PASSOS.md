# ✅ PRÓXIMOS PASSOS - API de Pagamentos Mercado Pago

## 📋 Checklist de Configuração

Você já completou ✅:
- [x] Criar arquivo `.env` com credenciais
- [x] Copiar `MERCADO_PAGO_TOKEN`
- [x] Copiar `MERCADO_PAGO_PUBLIC_KEY`
- [x] Criar `server.js` com rotas de pagamento
- [x] Criar `cart.js` com gerenciamento de carrinho
- [x] Atualizar `checkout.html` com formulário

## 🚀 Próximos Passos

### PASSO 1️⃣: Instalar Node.js

**Se ainda não tem:**
1. Baixe em: https://nodejs.org/ (versão LTS)
2. Execute o instalador
3. ✅ Marque "Add to PATH"
4. Reinicie o PC

**Verificar instalação:**
```powershell
node --version
npm --version
```

---

### PASSO 2️⃣: Instalar Dependências

Abra **PowerShell como Administrador** e execute:

```powershell
cd "c:\Users\Lucas Guilherme\teodorofit"
npm install
```

Aguarde completar. Você verá: `added X packages` ✅

---

### PASSO 3️⃣: Iniciar o Servidor

**Opção A - Automaticamente (Recomendado):**
1. Vá para: `c:\Users\Lucas Guilherme\teodorofit`
2. Clique 2x em: `START-SERVIDOR.bat`
3. Uma janela preta abrirá mostrando o servidor rodando

**Opção B - Manual (PowerShell):**
```powershell
cd "c:\Users\Lucas Guilherme\teodorofit"
npm start
```

**Você verá:**
```
Servidor de pagamentos rodando na porta 3000
Mercado Pago: Configurado
```

---

### PASSO 4️⃣: Testar Pagamento

#### Teste 1: Verificar Servidor
Abra o navegador e acesse:
```
http://localhost:3000/api/status
```

Você verá algo como:
```json
{
  "status": "Servidor rodando",
  "timestamp": "...",
  "mercado_pago_configured": true
}
```

#### Teste 2: Testar Pagamento (Recomendado)
1. Abra seu navegador
2. Acesse: `file:///c:/Users/Lucas Guilherme/teodorofit/test-pagamento.html`
3. Preencha com dados de teste:
   - **Cartão:** `4111111111111111`
   - **Nome:** `MARIA SILVA`
   - **Validade:** `12/25`
   - **CVV:** `123`
   - **Valor:** `100.00`
4. Clique em **"Processar Pagamento"**
5. Veja a resposta do servidor

---

### PASSO 5️⃣: Usar no Site

**Agora o site funciona completo:**

1. Abra seu site local (pode manter em `file://` ou usar um servidor local)
2. Vá para `shop.html` → clique "Adicionar ao Carrinho"
3. Vá para `cart.html` → clique "Finalizar Compra"
4. Vá para `checkout.html` → preencha formulário de pagamento
5. Clique em **"Processar Pagamento"**
6. Seu pagamento será processado pelo Mercado Pago! ✅

---

## 📱 Fluxo Completo

```
┌─────────────┐
│  SHOP.HTML  │  ← Cliente escolhe produtos
└──────┬──────┘
       │ "Adicionar ao Carrinho"
       ↓
┌─────────────┐
│ CART.HTML   │  ← Visualiza itens e totais
└──────┬──────┘
       │ "Finalizar Compra"
       ↓
┌───────────────────┐
│  CHECKOUT.HTML    │  ← Preenche dados e cartão
└──────┬────────────┘
       │ "Processar Pagamento"
       ↓
┌───────────────────────────┐
│  SERVER.JS (PORT 3000)    │  ← Processa pagamento
└──────┬────────────────────┘
       │ Valida + Envia para Mercado Pago
       ↓
┌───────────────────────────┐
│  MERCADO PAGO API         │  ← Processa pagamento
└──────┬────────────────────┘
       │ Responde com resultado
       ↓
┌───────────────────┐
│  THANKYOU.HTML    │  ← Sucesso! 🎉
└───────────────────┘
```

---

## 🎯 Resumo

| Etapa | Ação | Status |
|-------|------|--------|
| 1 | Instalar Node.js | 📌 TODO |
| 2 | `npm install` | 📌 TODO |
| 3 | `npm start` | 📌 TODO |
| 4 | Testar em `test-pagamento.html` | 📌 TODO |
| 5 | Usar no site real | 📌 TODO |

---

## ⚠️ Problemas Comuns

| Erro | Solução |
|------|---------|
| "npm não é reconhecido" | Reinicie o PC após instalar Node.js |
| "Port 3000 already in use" | Mude em `.env`: `PORT=3001` |
| "Cannot find module" | Execute: `npm install` |
| Pagamento recusado | Use cartão de teste: `4111111111111111` |

---

## 📞 Resumo de Arquivos Criados

✅ **server.js** - Servidor Node.js com rotas de pagamento
✅ **package.json** - Dependências do projeto
✅ **.env** - Suas credenciais (MANTÉM SECRETO!)
✅ **js/cart.js** - Gerenciador de carrinho
✅ **js/payment.js** - Validações de cartão
✅ **shop.html** - Loja com botão de carrinho
✅ **cart.html** - Carrinho funcional
✅ **checkout.html** - Checkout com formulário de pagamento
✅ **test-pagamento.html** - Interface para testar API
✅ **START-SERVIDOR.bat** - Executável para iniciar servidor
✅ **SETUP-PAGAMENTOS.md** - Documentação completa

---

## 🎉 Quando Completar Todos os Passos

Seu site terá:
- ✅ Carrinho funcionando
- ✅ Checkout com formulário
- ✅ Processamento de pagamentos real
- ✅ Integração com Mercado Pago
- ✅ Tudo funcionando! 🚀

---

**Precisa de ajuda?** Verifique `SETUP-PAGAMENTOS.md` ou `README-PAGAMENTOS.md`
