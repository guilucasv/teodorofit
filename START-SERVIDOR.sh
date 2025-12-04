#!/bin/bash
# Script para iniciar o servidor de pagamentos - Mac/Linux

echo ""
echo "========================================"
echo " Teodoro Fitness - API de Pagamentos"
echo "========================================"
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "[ERRO] Node.js não está instalado!"
    echo ""
    echo "Faça download em: https://nodejs.org/"
    echo "Escolha a versão LTS"
    echo ""
    exit 1
fi

echo "[OK] Node.js detectado"
node --version
echo ""

# Verificar se package.json existe
if [ ! -f package.json ]; then
    echo "[ERRO] package.json não encontrado!"
    echo "Certifique-se de estar no diretório correto."
    exit 1
fi

echo "[OK] package.json encontrado"
echo ""

# Verificar se node_modules existe
if [ ! -d node_modules ]; then
    echo "[INFO] Instalando dependências..."
    npm install
    echo ""
fi

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "[AVISO] Arquivo .env não encontrado!"
    echo "Criando a partir de .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
    else
        echo "[ERRO] .env.example também não encontrado!"
        exit 1
    fi
    echo "[INFO] Arquivo .env criado. Configure suas credenciais!"
    exit 1
fi

echo "[OK] Arquivo .env encontrado"
echo ""

# Iniciar servidor
echo "========================================"
echo " Iniciando servidor..."
echo "========================================"
echo ""
echo "Servidor rodará em: http://localhost:3000"
echo ""
echo "Para parar o servidor: Pressione Ctrl+C"
echo ""

npm start
