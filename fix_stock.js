const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'products.json');

try {
    if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const products = JSON.parse(raw);

        console.log(`Log: Lendo ${products.length} produtos...`);
        let updated = false;

        products.forEach(p => {
            // Sincronizar stock com quantity (priorizando quantity, que é o que o Admin usa)
            const qty = parseInt(p.quantity) || 0;
            const stok = parseInt(p.stock) || 0;

            if (stok !== qty) {
                console.log(`Corrigindo produto "${p.title}": Stock (${stok}) -> Quantity (${qty})`);
                p.stock = qty;
                updated = true;
            }
        });

        if (updated) {
            fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
            console.log('✅ Sucesso! Banco de dados corrigido. O servidor deve reconhecer o estoque agora.');
        } else {
            console.log('✅ Tudo ok! Os estoques já estavam sincronizados.');
        }

    } else {
        console.error('Erro: products.json não encontrado.');
    }
} catch (err) {
    console.error('Erro fatal:', err);
}
