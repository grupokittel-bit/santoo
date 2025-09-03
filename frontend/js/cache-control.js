/**
 * SANTOO CACHE CONTROL
 * 
 * PROBLEMA: Browser cacheia arquivos JS corruptos/incompletos
 * SOLUÇÃO: Cache-busting automático via timestamp
 * 
 * Este script força o browser a sempre carregar a versão mais
 * recente dos arquivos JavaScript, evitando problemas de cache.
 */

(function() {
  'use strict';
  
  console.log('🔄 Santoo Cache Control - Verificando cache...');
  
  // Função para adicionar timestamp a URLs
  function addCacheBuster(url) {
    const separator = url.includes('?') ? '&' : '?';
    const timestamp = Date.now();
    return `${url}${separator}v=${timestamp}`;
  }
  
  // Função para verificar se script carregou corretamente
  function verifyScript(scriptSrc) {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.onload = () => {
        console.log(`✅ Script carregado: ${scriptSrc}`);
        resolve(true);
      };
      script.onerror = () => {
        console.error(`❌ Erro ao carregar: ${scriptSrc}`);
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }
  
  // Função principal de cache-busting
  async function applyCacheBusting() {
    console.log('🚀 Aplicando cache-busting...');
    
    // Lista de scripts críticos que precisam de cache-busting
    const criticalScripts = [
      'js/utils.js',
      'js/api.js',
      'js/components.js', 
      'js/auth.js',
      'js/upload.js',
      'js/video-player.js',
      'js/main.js'
    ];
    
    // Remove scripts existentes que podem estar corrompidos
    const existingScripts = document.querySelectorAll('script[src]');
    existingScripts.forEach(script => {
      const src = script.getAttribute('src');
      if (criticalScripts.some(critical => src && src.includes(critical))) {
        console.log(`🗑️ Removendo script em cache: ${src}`);
        script.remove();
      }
    });
    
    // Carrega scripts com cache-busting
    for (const scriptPath of criticalScripts) {
      const scriptUrl = addCacheBuster(scriptPath);
      await verifyScript(scriptUrl);
      
      // Pequeno delay para garantir ordem de carregamento
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log('✅ Cache-busting aplicado com sucesso!');
  }
  
  // Detecta se precisa aplicar cache-busting
  function needsCacheBusting() {
    // Se SantooAPI não está definido após 2 segundos, provável problema de cache
    return !window.SantooAPI || typeof window.SantooAPI !== 'object';
  }
  
  // Verifica periodicamente se há problema de cache
  function monitorCacheHealth() {
    setTimeout(() => {
      if (needsCacheBusting()) {
        console.log('⚠️ Problema de cache detectado - aplicando correção...');
        applyCacheBusting();
      }
    }, 2000);
  }
  
  // Auto-aplicar se detectar problemas
  monitorCacheHealth();
  
  // Expor para uso manual se necessário
  window.SantooCacheControl = {
    applyCacheBusting,
    needsCacheBusting,
    addCacheBuster
  };
  
})();