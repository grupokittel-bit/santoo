#!/bin/bash

# SANTOO - INICIALIZAÇÃO COMPLETA PARA ACESSO MOBILE
# Script que inicia backend E frontend para acesso pelo celular

echo "📱🚀 SANTOO - MODO MOBILE COMPLETO"
echo "=================================="
echo ""
echo "🌐 CONFIGURAÇÕES DE REDE:"
echo "   IP Local: 192.168.3.63"
echo ""
echo "📱 PARA ACESSAR PELO CELULAR:"
echo "   1. Conecte o celular na MESMA REDE WiFi"
echo "   2. Abra o navegador do celular"
echo "   3. Digite: http://192.168.3.63:8000"
echo ""
echo "💻 PARA ACESSAR PELO COMPUTADOR:"
echo "   http://localhost:8000"
echo ""

# Função para cleanup ao sair
cleanup() {
    echo ""
    echo "🛑 Parando servidores..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap para cleanup
trap cleanup SIGINT SIGTERM

echo "🔄 Iniciando Backend..."
cd /home/marcelo/Desktop/santoo/backend
npm start &
BACKEND_PID=$!

echo "⏳ Aguardando backend inicializar..."
sleep 3

echo "🔄 Iniciando Frontend com LIVE-RELOAD..."
cd /home/marcelo/Desktop/santoo/frontend

# Inicia live-server com live-reload acessível pela rede
live-server --host=0.0.0.0 --port=8000 --no-browser --watch="." --ignore="*.scss,*.sass,node_modules" --wait=500 &
FRONTEND_PID=$!

echo ""
echo "✅ SANTOO ONLINE!"
echo "=================================="
echo ""
echo "🌐 Backend: http://192.168.3.63:3001"
echo "📱 Frontend: http://192.168.3.63:8000"
echo ""
echo "📋 STATUS DOS SERVIÇOS:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "🛑 Para parar: Pressione Ctrl+C"
echo ""

# Aguarda os processos
wait