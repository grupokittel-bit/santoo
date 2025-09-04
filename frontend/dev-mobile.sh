#!/bin/bash

# SANTOO - DESENVOLVIMENTO FRONTEND MOBILE
# Frontend com live-reload acessível pelo celular

echo "🚀📱 SANTOO - DESENVOLVIMENTO MOBILE"
echo "===================================="
echo ""
echo "🔄 LIVE-RELOAD ATIVO!"
echo "   - Mudanças em arquivos serão atualizadas automaticamente"
echo "   - No computador E no celular simultaneamente!"
echo ""
echo "📱 ACESSO PELO CELULAR:"
echo "   http://192.168.3.63:8000"
echo ""
echo "💻 ACESSO PELO COMPUTADOR:" 
echo "   http://localhost:8000"
echo ""
echo "📝 ARQUIVOS MONITORADOS:"
echo "   - HTML, CSS, JavaScript"
echo "   - Mudanças detectadas em 500ms"
echo ""
echo "🛑 Para parar: Ctrl+C"
echo ""

# Live-server com configuração otimizada para desenvolvimento
live-server \
  --host=0.0.0.0 \
  --port=8000 \
  --no-browser \
  --watch="." \
  --ignore="*.scss,*.sass,node_modules,*.git" \
  --wait=200 \
  --verbose \
  --cors