document.addEventListener("DOMContentLoaded", () => {

    console.log("payment-handler.js carregado!");

    // ==============================
    // ELEMENTOS DO DOM
    // ==============================
    const form = document.getElementById("payment-form");
    const messageBox = document.getElementById("message-box");
    const loader = document.getElementById("loader");

    if (!form || !messageBox) {
        console.error("Erro: elementos essenciais não encontrados no HTML.");
        return;
    }

    // ==============================
    // FUNÇÃO DE MENSAGENS
    // ==============================
    function showMessage(type, text) {
        messageBox.style.display = "block";
        messageBox.className = `message-box ${type}`;
        messageBox.innerText = text;

        setTimeout(() => {
            messageBox.style.display = "none";
        }, 4000);
    }

    // ==============================
    // EXIBE LOADING
    // ==============================
    function showLoader(show) {
        if (!loader) return;
        loader.style.display = show ? "flex" : "none";
    }

    // ==============================
    // TOKENIZAÇÃO DO MERCADO PAGO
    // ==============================
    async function gerarTokenMP() {
        const cardData = {
            cardNumber: document.getElementById("card_number").value.replace(/\s+/g, ""),
            cardholderName: document.getElementById("card_holder").value,
            securityCode: document.getElementById("card_cvv").value,
            cardExpirationMonth: document.getElementById("card_exp_month").value,
            cardExpirationYear: document.getElementById("card_exp_year").value
        };

        console.log("🔹 Dados enviados para tokenização:", cardData);

        return new Promise((resolve, reject) => {
            MercadoPago.cardToken.create(cardData, (status, response) => {
                if (status !== 200 && status !== 201) {
                    console.error("❌ Erro ao gerar token MP:", response);
                    reject("Não foi possível tokenizar o cartão.");
                } else {
                    console.log("🔹 Token gerado com sucesso:", response.id);
                    resolve(response.id);
                }
            });
        });
    }

    // ==============================
    // ENVIO DO FORMULÁRIO
    // ==============================
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        showLoader(true);

        try {
            const gateway = document.querySelector("input[name='payment_gateway']:checked").value;

            if (gateway === "mercado_pago") {
                await pagarMercadoPago();
            } else if (gateway === "pagar_me") {
                await pagarPagarMe();
            } else {
                showMessage("error", "Selecione um método de pagamento.");
            }

        } catch (err) {
            console.error(err);
            showMessage("error", err.toString());
        }

        showLoader(false);
    });

    // ==============================
    // PAGAMENTO - MERCADO PAGO
    // ==============================
    async function pagarMercadoPago() {
        const token = await gerarTokenMP();

        const payload = {
            token: token,
            amount: parseFloat(document.getElementById("amount").value),
            customer_email: document.getElementById("customer_email").value,
            customer_name: document.getElementById("customer_name").value,
            customer_phone: document.getElementById("customer_phone").value,
            payment_method_id: "visa", // MP detecta automaticamente
            installments: 1,
            order_id: "PEDIDO-" + Date.now()
        };

        console.log("🔸 Enviando pagamento Mercado Pago:", payload);

        const response = await fetch("/api/pagamento-mercado-pago", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            showMessage("success", "Pagamento aprovado com sucesso!");
        } else {
            showMessage("error", data.error || "Erro no Mercado Pago");
        }
    }

    // ==============================
    // PAGAMENTO - PAGAR.ME
    // ==============================
    async function pagarPagarMe() {

        const payload = {
            card_number: document.getElementById("card_number").value.replace(/\s/g, ""),
            card_holder: document.getElementById("card_holder").value,
            card_expiration_date: `${document.getElementById("card_exp_month").value}/${document.getElementById("card_exp_year").value}`,
            card_cvv: document.getElementById("card_cvv").value,
            amount: parseFloat(document.getElementById("amount").value),
            customer_email: document.getElementById("customer_email").value,
            customer_name: document.getElementById("customer_name").value,
            customer_phone: document.getElementById("customer_phone").value,
            order_id: "PEDIDO-" + Date.now()
        };

        console.log("🔸 Enviando pagamento Pagar.me:", payload);

        const response = await fetch("/api/pagamento-pagar-me", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            showMessage("success", "Pagamento aprovado pelo Pagar.me!");
        } else {
            showMessage("error", data.details || "Erro no Pagar.me");
        }
    }

});
