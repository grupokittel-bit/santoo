#!/bin/bash

# SANTOO - SCRIPT PARA ACESSAR PELO CELULAR
# Inicia o frontend acessível via rede local

echo "🚀 Iniciando Santoo Frontend para acesso mobile..."
echo ""
echo "📱 ACESSO VIA CELULAR:"
echo "   Conecte o celular na MESMA WiFi do computador"
echo "   Acesse: http://192.168.3.63:8000"
echo ""
echo "💻 ACESSO LOCAL:"
echo "   http://localhost:8000"
echo ""

# Verifica se live-server está instalado
if ! command -v live-server &> /dev/null; then
    echo "❌ live-server não encontrado. Instalando..."
    npm install -g live-server
fi

# Inicia servidor acessível via rede
live-server --host=0.0.0.0 --port=8000 --no-browser --ignore="*.scss,*.sass"