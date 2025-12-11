const axios = require('axios');

async function testPriceTampering() {
    console.log('🕵️ INICIANDO TESTE DE SEGURANÇA: TENTATIVA DE FRAUDE DE PREÇO');
    console.log('-------------------------------------------------------------');

    // Dados simulados de um "Hacker" tentando pagar R$ 1,00 num produto de R$ 55,00 (Produto 5)
    const fakePayload = {
        token: "fake_token_123",
        issuer_id: "123",
        payment_method_id: "master",
        transaction_amount: 1.00, // <--- PREÇO ADULTERADO (O real é 55.00)
        installments: 1,
        payer: {
            email: "hacker@teste.com",
            first_name: "Hacker",
            last_name: "Teste",
            identification: { type: "CPF", number: "12345678909" }
        },
        additional_info: {
            items: [
                {
                    id: "produto-5", // Conjunto Green (R$ 55.00 na loja)
                    title: "Conjunto Green",
                    quantity: 1,
                    unit_price: 1.00 // <--- PREÇO UNITÁRIO ADULTERADO
                }
            ]
        }
    };

    console.log(`😈 Enviando requisição com valor FRAUDULENTO: R$ ${fakePayload.transaction_amount}`);

    try {
        const response = await axios.post('http://localhost:3000/api/pagamento-mercado-pago', fakePayload);
        console.log('Resposta do servidor:', response.data);
    } catch (error) {
        // É esperado que dê erro 400 ou erro do Mercado Pago (token inválido), 
        // mas o importante é ver o LOG DO SERVIDOR mostrando o cálculo correto.
        if (error.response) {
            console.log(`Status retornado: ${error.response.status}`);
            console.log('Erro retornado (esperado, pois o token é falso):', error.response.data);
        } else {
            console.log('Erro na requisição:', error.message);
        }
    }

    console.log('-------------------------------------------------------------');
    console.log('👀 AGORA VERIFIQUE O TERMINAL DO SERVIDOR (npm start) ou o arquivo server.log.');
    console.log('Você deve ver uma mensagem como: "💰 Total calculado no servidor: R$ 55"');
    console.log('Isso prova que o servidor ignorou o R$ 1,00 e usou o preço real!');
}

testPriceTampering();
