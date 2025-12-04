@echo off
REM Script para iniciar o servidor de pagamentos - Windows

echo.
echo ========================================
echo  Teodoro Fitness - API de Pagamentos
echo ========================================
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js não está instalado!
    echo.
    echo Faça download em: https://nodejs.org/
    echo Escolha a versão LTS
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detectado
node --version
echo.

REM Verificar se package.json existe
if not exist package.json (
    echo [ERRO] package.json não encontrado!
    echo Certifique-se de estar no diretório correto.
    pause
    exit /b 1
)

echo [OK] package.json encontrado
echo.

REM Verificar se node_modules existe
if not exist node_modules (
    echo [INFO] Instalando dependências...
    call npm install
    echo.
)

REM Verificar se .env existe
if not exist .env (
    echo [AVISO] Arquivo .env não encontrado!
    echo Criando a partir de .env.example...
    if exist .env.example (
        copy .env.example .env
    ) else (
        echo [ERRO] .env.example também não encontrado!
        pause
        exit /b 1
    )
    echo [INFO] Arquivo .env criado. Configure suas credenciais!
    pause
    exit /b 1
)

echo [OK] Arquivo .env encontrado
echo.

REM Iniciar servidor
echo ========================================
echo  Iniciando servidor...
echo ========================================
echo.
echo Servidor rodará em: http://localhost:3000
echo.
echo Para parar o servidor: Pressione Ctrl+C
echo.

npm start

pause
