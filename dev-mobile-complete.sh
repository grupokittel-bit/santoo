#!/bin/bash

# SANTOO - DESENVOLVIMENTO COMPLETO MOBILE
# Backend + Frontend com live-reload para desenvolvimento

echo "🚀📱 SANTOO - MODO DESENVOLVIMENTO MOBILE COMPLETO"
echo "=================================================="
echo ""
echo "🔄 RECURSOS ATIVOS:"
echo "   ✅ Live-reload no Frontend (mudanças instantâneas)"
echo "   ✅ Nodemon no Backend (reinicialização automática)"
echo "   ✅ Acesso pelo celular e computador"
echo ""
echo "📱 CELULAR:"
echo "   Frontend: http://192.168.3.63:8000"
echo "   Backend:  http://192.168.3.63:3001"
echo ""
echo "💻 COMPUTADOR:"
echo "   Frontend: http://localhost:8000" 
echo "   Backend:  http://localhost:3001"
echo ""
echo "📝 DESENVOLVIMENTO:"
echo "   - Edite qualquer arquivo .js, .css, .html"
echo "   - Mudanças aparecerão automaticamente"
echo "   - No computador E celular ao mesmo tempo!"
echo ""

# Função para cleanup
cleanup() {
    echo ""
    echo "🛑 Parando servidores de desenvolvimento..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Desenvolvimento parado"
    exit 0
}

# Trap para cleanup
trap cleanup SIGINT SIGTERM

echo "🔄 Iniciando Backend com NODEMON..."
cd /home/marcelo/Desktop/santoo/backend
npm run dev &
BACKEND_PID=$!

echo "⏳ Aguardando backend inicializar..."
sleep 4

echo "🔄 Iniciando Frontend com LIVE-RELOAD..."
cd /home/marcelo/Desktop/santoo/frontend

# Live-server otimizado para desenvolvimento
live-server \
  --host=0.0.0.0 \
  --port=8000 \
  --no-browser \
  --watch="." \
  --ignore="*.scss,*.sass,node_modules,*.git" \
  --wait=200 \
  --cors &

FRONTEND_PID=$!

echo ""
echo "✅ DESENVOLVIMENTO ATIVO!"
echo "========================="
echo ""
echo "🎯 TESTE AGORA:"
echo "   1. Edite qualquer arquivo CSS/JS/HTML"
echo "   2. Veja a mudança automática no celular E computador"
echo "   3. Backend reinicia automaticamente se mudar .js do backend"
echo ""
echo "🛡️  STATUS DOS PROCESSOS:"
echo "   Backend (nodemon): PID $BACKEND_PID"  
echo "   Frontend (live-server): PID $FRONTEND_PID"
echo ""
echo "🛑 Para parar desenvolvimento: Ctrl+C"
echo ""

# Aguarda os processos
wait