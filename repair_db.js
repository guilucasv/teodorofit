const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'products.json');

const freshData = [
    {
        "id": "prod-001",
        "title": "Legging Pro",
        "price": 89.90,
        "image": "images/model1.png",
        "description": "Conforto e flexibilidade para seus treinos mais intensos.",
        "quantity": 15,
        "stock": 15
    },
    {
        "id": "prod-002",
        "title": "Top Elite",
        "price": 69.90,
        "image": "images/model2.png",
        "description": "Sustentação máxima com design moderno.",
        "quantity": 25,
        "stock": 25
    },
    {
        "id": "prod-003",
        "title": "Conjunto Fit",
        "price": 149.90,
        "image": "images/model3.png",
        "description": "A combinação perfeita de estilo e funcionalidade.",
        "quantity": 10,
        "stock": 10
    },
    {
        "id": "prod-004",
        "title": "Conjunto Elegance",
        "price": 60.00,
        "image": "images/product-3.png",
        "description": "Conjunto Academia completo: legging modeladora e top esportivo exclusivo.",
        "quantity": 100,
        "stock": 100
    },
    {
        "id": "prod-005",
        "title": "Conjunto Green Moon",
        "price": 60.00,
        "image": "images/product-1.png",
        "description": "Estilo verde vibrante para quem não tem medo de ousar.",
        "quantity": 20,
        "stock": 20
    }
];

try {
    fs.writeFileSync(dbPath, JSON.stringify(freshData, null, 2));
    console.log('Database successfully repaired!');
} catch (e) {
    console.error('Failed to repair:', e);
}
