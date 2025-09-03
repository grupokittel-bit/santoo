/**
 * SANTOO - PROFESSIONAL ICONS INITIALIZATION
 * 
 * Inicializa os ícones Lucide para interface profissional
 * Substitui emojis por ícones SVG vetoriais de alta qualidade
 */

(function() {
  'use strict';
  
  console.log('🎨 Inicializando ícones profissionais Lucide...');
  
  // Função para inicializar ícones
  function initLucideIcons() {
    try {
      // Verifica se Lucide está disponível
      if (typeof lucide === 'undefined') {
        console.warn('⚠️ Lucide não carregado ainda, tentando novamente...');
        setTimeout(initLucideIcons, 100);
        return;
      }
      
      // Inicializa todos os ícones Lucide na página
      lucide.createIcons();
      
      console.log('✅ Ícones Lucide inicializados com sucesso!');
      
      // Lista todos os ícones encontrados para debug
      const icons = document.querySelectorAll('[data-lucide]');
      console.log(`🔍 ${icons.length} ícones profissionais carregados:`, 
        Array.from(icons).map(icon => icon.getAttribute('data-lucide'))
      );
      
      // Aplica estilos específicos se necessário
      icons.forEach(icon => {
        icon.style.transition = 'all 0.2s ease';
      });
      
    } catch (error) {
      console.error('❌ Erro ao inicializar ícones Lucide:', error);
      
      // Fallback: mostrar texto caso ícones falhem
      const iconElements = document.querySelectorAll('[data-lucide]');
      iconElements.forEach(icon => {
        const iconName = icon.getAttribute('data-lucide');
        icon.textContent = iconName.charAt(0).toUpperCase();
        icon.style.display = 'inline-block';
        icon.style.width = '18px';
        icon.style.height = '18px';
        icon.style.textAlign = 'center';
        icon.style.lineHeight = '18px';
        icon.style.fontSize = '12px';
        icon.style.fontWeight = 'bold';
      });
    }
  }
  
  // Função para reinicializar ícones após mudanças dinâmicas
  function reinitializeIcons() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
      console.log('🔄 Ícones reinicializados');
    }
  }
  
  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLucideIcons);
  } else {
    initLucideIcons();
  }
  
  // Expor função para uso em outros scripts
  window.SantooIcons = {
    init: initLucideIcons,
    reinit: reinitializeIcons
  };
  
  // Observador para reinicializar ícones quando conteúdo é adicionado dinamicamente
  const observer = new MutationObserver((mutations) => {
    let needsReinit = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            if (node.querySelector && node.querySelector('[data-lucide]')) {
              needsReinit = true;
            } else if (node.getAttribute && node.getAttribute('data-lucide')) {
              needsReinit = true;
            }
          }
        });
      }
    });
    
    if (needsReinit) {
      setTimeout(reinitializeIcons, 50);
    }
  });
  
  // Inicia observação após DOM carregar
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
  
})();