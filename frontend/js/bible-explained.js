/**
 * SANTOO - BIBLE EXPLAINED
 * Sistema completo para página pública da Bíblia Explicada
 */

class BibleExplainedManager {
  constructor() {
    this.currentPage = 1;
    this.currentCategory = 'all';
    this.posts = [];
    this.loading = false;
    this.hasMore = true;
    this.userInteractions = new Map(); // Cache das interações do usuário
    
    console.log('📖 Inicializando Bible Explained Manager...');
    this.init();
  }

  /**
   * Inicializa o sistema
   */
  async init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
    } else {
      this.onDOMReady();
    }
  }

  /**
   * Executado quando DOM está pronto
   */
  async onDOMReady() {
    console.log('📖 Bible Explained DOM Ready');
    
    try {
      this.setupEventListeners();
      await this.loadInitialPosts();
    } catch (error) {
      console.error('❌ Erro ao inicializar Bible Explained:', error);
      this.showError('Erro ao carregar conteúdo da Bíblia Explicada');
    }
  }

  /**
   * Configura todos os event listeners
   */
  setupEventListeners() {
    console.log('📖 Configurando event listeners...');

    // Filtros de categoria
    this.setupCategoryFilters();
    
    // Botão carregar mais
    this.setupLoadMoreButton();
    
    // Event delegation para interações dos posts
    this.setupPostInteractions();
  }

  /**
   * Configura filtros de categoria
   */
  setupCategoryFilters() {
    const filterButtons = document.querySelectorAll('.bible-filters .filter-btn');
    
    filterButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const category = btn.dataset.category;
        if (category === this.currentCategory) return;
        
        // Atualiza visual dos botões
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Recarrega posts com nova categoria
        await this.filterByCategory(category);
      });
    });
  }

  /**
   * Configura botão carregar mais
   */
  setupLoadMoreButton() {
    const loadMoreBtn = document.getElementById('loadMoreBiblePosts');
    
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.loadMorePosts();
      });
    }
  }

  /**
   * Configura interações dos posts (like, amém, ops, discordar)
   */
  setupPostInteractions() {
    const bibleFeed = document.getElementById('bibleFeed');
    
    if (bibleFeed) {
      bibleFeed.addEventListener('click', async (e) => {
        const actionBtn = e.target.closest('.bible-action-btn');
        
        if (actionBtn) {
          e.preventDefault();
          await this.handlePostInteraction(actionBtn);
        }
      });
    }
  }

  /**
   * Carrega posts iniciais
   */
  async loadInitialPosts() {
    console.log('📖 Carregando posts iniciais...');
    
    this.showLoading();
    this.currentPage = 1;
    this.posts = [];
    
    try {
      const response = await window.SantooAPI.get('/api/bible-posts', {
        page: this.currentPage,
        limit: 10,
        category: this.currentCategory === 'all' ? undefined : this.currentCategory
      });
      
      if (response?.data?.length > 0) { // 🔧 CORRIGIDO: backend retorna 'data'
        this.posts = response.data; // 🔧 CORRIGIDO: backend retorna 'data', não 'posts'
        this.hasMore = response.pagination?.has_more || false; // 🔧 CORRIGIDO: has_more
        
        // Carrega interações do usuário se logado
        if (window.santooAuth?.isAuthenticated()) {
          await this.loadUserInteractions();
        }
        
        this.renderPosts();
        this.hideLoading();
        this.updateLoadMoreButton();
      } else {
        this.showEmptyState();
        this.hideLoading();
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar posts:', error);
      this.showError('Erro ao carregar posts da Bíblia');
      this.hideLoading();
    }
  }

  /**
   * Carrega mais posts
   */
  async loadMorePosts() {
    if (this.loading || !this.hasMore) return;
    
    console.log('📖 Carregando mais posts...');
    
    this.loading = true;
    this.currentPage++;
    
    // Atualiza botão para estado de loading
    const loadMoreBtn = document.getElementById('loadMoreBiblePosts');
    if (loadMoreBtn) {
      loadMoreBtn.innerHTML = `
        <div class="loading-spinner" style="width: 20px; height: 20px; border: 2px solid var(--color-bg-tertiary); border-radius: 50%; border-top-color: var(--color-accent); animation: var(--animation-spin); margin-right: var(--space-2);"></div>
        <span>Carregando...</span>
      `;
      loadMoreBtn.disabled = true;
    }
    
    try {
      const response = await window.SantooAPI.get('/api/bible-posts', {
        page: this.currentPage,
        limit: 10,
        category: this.currentCategory === 'all' ? undefined : this.currentCategory
      });
      
      if (response?.data?.length > 0) { // 🔧 CORRIGIDO: backend retorna 'data'
        // Adiciona novos posts ao array existente
        this.posts = [...this.posts, ...response.data]; // 🔧 CORRIGIDO: backend retorna 'data'
        this.hasMore = response.pagination?.has_more || false; // 🔧 CORRIGIDO: has_more
        
        // Renderiza apenas os novos posts
        this.renderNewPosts(response.data); // 🔧 CORRIGIDO: backend retorna 'data'
        this.updateLoadMoreButton();
      } else {
        this.hasMore = false;
        this.updateLoadMoreButton();
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar mais posts:', error);
      this.showError('Erro ao carregar mais posts');
      this.currentPage--; // Reverte o incremento
    } finally {
      this.loading = false;
    }
  }

  /**
   * Filtra posts por categoria
   */
  async filterByCategory(category) {
    console.log('📖 Filtrando por categoria:', category);
    
    this.currentCategory = category;
    await this.loadInitialPosts();
  }

  /**
   * Carrega interações do usuário atual
   */
  async loadUserInteractions() {
    try {
      // Carregar interações de todos os tipos disponíveis
      const types = ['like', 'amen', 'ops'];
      this.userInteractions.clear();
      
      for (const type of types) {
        try {
          const response = await window.SantooAPI.get(`/api/bible-posts/my-interactions/${type}`);
          
          if (response?.data && Array.isArray(response.data)) {
            // Organiza interações por post_id
            response.data.forEach(interaction => {
              this.userInteractions.set(interaction.bible_post_id, interaction.interaction_type);
            });
          }
        } catch (typeError) {
          console.warn(`⚠️ Erro ao carregar interações do tipo ${type}:`, typeError.message);
          // Continua para próximo tipo
        }
      }
      
      console.log('📖 Interações do usuário carregadas:', this.userInteractions.size);
      
    } catch (error) {
      console.error('❌ Erro ao carregar interações do usuário:', error);
      // Não mostra erro para o usuário - funcionalidade não crítica
    }
  }

  /**
   * Renderiza todos os posts
   */
  renderPosts() {
    const bibleFeed = document.getElementById('bibleFeed');
    if (!bibleFeed) return;
    
    bibleFeed.innerHTML = '';
    
    this.posts.forEach(post => {
      const postElement = this.createPostElement(post);
      bibleFeed.appendChild(postElement);
    });
  }

  /**
   * Renderiza apenas posts novos (para load more)
   */
  renderNewPosts(newPosts) {
    const bibleFeed = document.getElementById('bibleFeed');
    if (!bibleFeed) return;
    
    newPosts.forEach(post => {
      const postElement = this.createPostElement(post);
      bibleFeed.appendChild(postElement);
    });
  }

  /**
   * Cria elemento HTML para um post
   */
  createPostElement(post) {
    const userInteraction = this.userInteractions.get(post.id);
    
    const article = document.createElement('article');
    article.className = 'bible-post-card';
    article.dataset.postId = post.id;
    
    // Ícone da categoria
    const categoryIcons = {
      sabedoria: 'lightbulb',
      amor: 'heart',
      fe: 'zap',
      oracao: 'hand',
      relacionamentos: 'users',
      trabalho: 'briefcase',
      familia: 'home',
      paz: 'leaf',
      perdao: 'handshake',
      crescimento: 'trending-up',
      gratidao: 'smile',
      esperanca: 'star'
    };
    
    const categoryIcon = categoryIcons[post.category] || 'book-open';
    
    article.innerHTML = `
      <div class="bible-post-header">
        <div class="bible-post-icon">
          <i data-lucide="${categoryIcon}"></i>
        </div>
        <div class="bible-post-title">
          <h3>${this.escapeHtml(post.title)}</h3>
          <div class="verse-reference">
            <i data-lucide="bookmark"></i>
            <span>${this.escapeHtml(post.verse_reference)}</span>
          </div>
        </div>
      </div>

      <div class="bible-post-content">
        
        <!-- Versículo Original -->
        <div class="bible-original-text">
          "${this.escapeHtml(post.original_text)}"
        </div>

        <!-- Contexto Histórico -->
        <div class="bible-section">
          <div class="bible-section-header">
            <i data-lucide="scroll" class="bible-section-icon"></i>
            <h4 class="bible-section-title">Contexto Histórico</h4>
          </div>
          <div class="bible-section-content bible-historical-context">
            ${this.formatText(post.historical_context)}
          </div>
        </div>

        <!-- Tradução Moderna -->
        <div class="bible-section">
          <div class="bible-section-header">
            <i data-lucide="refresh-cw" class="bible-section-icon"></i>
            <h4 class="bible-section-title">Em Linguagem Atual</h4>
          </div>
          <div class="bible-section-content bible-modern-translation">
            ${this.formatText(post.modern_translation)}
          </div>
        </div>

        <!-- Significado Prático -->
        <div class="bible-section">
          <div class="bible-section-header">
            <i data-lucide="lightbulb" class="bible-section-icon"></i>
            <h4 class="bible-section-title">O que realmente está dizendo</h4>
          </div>
          <div class="bible-section-content bible-practical-meaning">
            ${this.formatText(post.practical_meaning)}
          </div>
        </div>

        <!-- Aplicação Moderna -->
        <div class="bible-section">
          <div class="bible-section-header">
            <i data-lucide="target" class="bible-section-icon"></i>
            <h4 class="bible-section-title">Como aplicar hoje</h4>
          </div>
          <div class="bible-section-content bible-modern-application">
            ${this.formatText(post.modern_application)}
          </div>
        </div>

        ${post.curiosities ? `
        <!-- Curiosidades -->
        <div class="bible-section">
          <div class="bible-section-header">
            <i data-lucide="sparkles" class="bible-section-icon"></i>
            <h4 class="bible-section-title">Curiosidades</h4>
          </div>
          <div class="bible-section-content bible-curiosities">
            ${this.formatText(post.curiosities)}
          </div>
        </div>
        ` : ''}

      </div>

      <div class="bible-post-actions">
        <div class="bible-actions-left">
          <button class="bible-action-btn btn-like ${userInteraction === 'like' ? 'active' : ''}" 
                  data-action="like" data-post-id="${post.id}">
            <i data-lucide="heart"></i>
            <span>${post.likes_count || 0}</span>
          </button>
          
          <button class="bible-action-btn btn-amen ${userInteraction === 'amen' ? 'active' : ''}" 
                  data-action="amen" data-post-id="${post.id}" 
                  title="Já faço isso">
            <i data-lucide="check-circle"></i>
            <span>Amém ${post.amen_count || 0}</span>
          </button>
          
          <button class="bible-action-btn btn-ops ${userInteraction === 'ops' ? 'active' : ''}" 
                  data-action="ops" data-post-id="${post.id}" 
                  title="Ainda não faço isso">
            <i data-lucide="circle"></i>
            <span>Ops ${post.ops_count || 0}</span>
          </button>
          
          <button class="bible-action-btn btn-disagree ${userInteraction === 'disagree' ? 'active' : ''}" 
                  data-action="disagree" data-post-id="${post.id}"
                  title="Discordar da explicação">
            <i data-lucide="message-circle"></i>
            <span>Discordar</span>
          </button>
        </div>
        
        <div class="bible-actions-right">
          <div class="bible-category-badge">
            ${this.formatCategoryName(post.category)}
          </div>
        </div>
      </div>

      <div class="bible-post-meta">
        <div class="meta-item">
          <i data-lucide="eye"></i>
          <span>${post.views_count || 0} visualizações</span>
        </div>
        <div class="meta-item">
          <i data-lucide="calendar"></i>
          <span>${this.formatDate(post.created_at)}</span>
        </div>
      </div>
    `;
    
    // Inicializa ícones Lucide
    setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 0);
    
    return article;
  }

  /**
   * Lida com interações do usuário em posts
   */
  async handlePostInteraction(actionBtn) {
    const action = actionBtn.dataset.action;
    const postId = actionBtn.dataset.postId;
    
    console.log('📖 Interação:', { action, postId });
    
    // Verifica se usuário está logado
    if (!window.santooAuth?.isAuthenticated()) {
      this.showLoginPrompt();
      return;
    }
    
    // Previne múltiplas requisições
    if (actionBtn.classList.contains('loading')) return;
    
    try {
      actionBtn.classList.add('loading');
      actionBtn.disabled = true;
      
      if (action === 'disagree') {
        await this.handleDisagreeAction(postId);
      } else {
        await this.handleRegularInteraction(postId, action, actionBtn);
      }
      
    } catch (error) {
      console.error('❌ Erro na interação:', error);
      this.showError('Erro ao processar interação');
    } finally {
      actionBtn.classList.remove('loading');
      actionBtn.disabled = false;
    }
  }

  /**
   * Processa interações regulares (like, amém, ops)
   */
  async handleRegularInteraction(postId, action, actionBtn) {
    const isCurrentlyActive = actionBtn.classList.contains('active');
    const postCard = actionBtn.closest('.bible-post-card');
    
    try {
      if (isCurrentlyActive) {
        // Remove interação
        await window.SantooAPI.delete(`/api/bible-posts/${postId}/interact`);
        actionBtn.classList.remove('active');
        this.userInteractions.delete(postId);
      } else {
        // Adiciona interação
        await window.SantooAPI.post(`/api/bible-posts/${postId}/interact`, {
          type: action
        });
        
        // Remove active de outros botões do mesmo post
        const otherButtons = postCard.querySelectorAll('.bible-action-btn:not(.btn-disagree)');
        otherButtons.forEach(btn => btn.classList.remove('active'));
        
        // Ativa botão atual
        actionBtn.classList.add('active');
        this.userInteractions.set(postId, action);
      }
      
      // Atualiza contadores localmente (otimização - sem chamada à API)
      this.updatePostCountsLocal(postId, action, isCurrentlyActive);
      
    } catch (error) {
      console.error('❌ Erro na interação regular:', error);
      throw error;
    }
  }

  /**
   * Processa ação de discordância
   */
  async handleDisagreeAction(postId) {
    // Abre modal para discordância
    const reason = prompt('Por que você discorda desta explicação? (Opcional)');
    
    if (reason !== null) { // null = cancelou, string vazia = OK sem texto
      try {
        await window.SantooAPI.post(`/api/bible-posts/${postId}/disagree`, {
          reason: reason.trim() || 'Sem motivo especificado',
          description: reason.trim()
        });
        
        this.showSuccess('Discordância enviada! Será analisada pelos administradores.');
        
      } catch (error) {
        console.error('❌ Erro ao enviar discordância:', error);
        throw error;
      }
    }
  }

  /**
   * Atualiza contadores localmente sem chamada à API (OTIMIZADO)
   */
  updatePostCountsLocal(postId, action, wasActive) {
    try {
      const postCard = document.querySelector(`[data-post-id="${postId}"]`);
      if (!postCard) return;
      
      // Encontra o botão correspondente à ação
      const actionBtn = postCard.querySelector(`.btn-${action}`);
      if (!actionBtn) return;
      
      const counterSpan = actionBtn.querySelector('span');
      if (!counterSpan) return;
      
      // Extrai o número atual do texto
      let currentText = counterSpan.textContent;
      let currentCount = 0;
      
      if (action === 'like') {
        // Para like: span contém apenas o número
        currentCount = parseInt(currentText) || 0;
      } else {
        // Para amen/ops: span contém "Amém 5" ou "Ops 3"
        const match = currentText.match(/\d+/);
        currentCount = match ? parseInt(match[0]) : 0;
      }
      
      // Calcula novo valor
      const newCount = wasActive ? currentCount - 1 : currentCount + 1;
      
      // Atualiza o texto
      if (action === 'like') {
        counterSpan.textContent = Math.max(0, newCount);
      } else {
        const prefix = action === 'amen' ? 'Amém' : 'Ops';
        counterSpan.textContent = `${prefix} ${Math.max(0, newCount)}`;
      }
      
      console.log(`✅ Contador ${action} atualizado localmente: ${currentCount} → ${Math.max(0, newCount)}`);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar contador local:', error);
      // Não bloqueia a interação
    }
  }

  /**
   * Atualiza botão carregar mais
   */
  updateLoadMoreButton() {
    const loadMoreContainer = document.querySelector('.load-more-container');
    const loadMoreBtn = document.getElementById('loadMoreBiblePosts');
    
    if (loadMoreContainer && loadMoreBtn) {
      if (this.hasMore && this.posts.length > 0) {
        loadMoreContainer.style.display = 'block';
        loadMoreBtn.innerHTML = `
          <i data-lucide="plus-circle"></i>
          <span>Carregar mais posts</span>
        `;
        loadMoreBtn.disabled = false;
        
        // Reinicializa ícone
        if (window.lucide) {
          window.lucide.createIcons();
        }
      } else {
        loadMoreContainer.style.display = 'none';
      }
    }
  }

  /**
   * Mostra loading
   */
  showLoading() {
    const loadingElement = document.querySelector('.loading-bible-posts');
    const emptyState = document.getElementById('emptyBibleFeed');
    
    if (loadingElement) loadingElement.style.display = 'flex';
    if (emptyState) emptyState.style.display = 'none';
  }

  /**
   * Esconde loading
   */
  hideLoading() {
    const loadingElement = document.querySelector('.loading-bible-posts');
    if (loadingElement) loadingElement.style.display = 'none';
  }

  /**
   * Mostra estado vazio
   */
  showEmptyState() {
    const emptyState = document.getElementById('emptyBibleFeed');
    const bibleFeed = document.getElementById('bibleFeed');
    
    if (emptyState) emptyState.style.display = 'block';
    if (bibleFeed) bibleFeed.innerHTML = '';
  }

  /**
   * Mostra prompt de login
   */
  showLoginPrompt() {
    if (typeof window.showLoginModal === 'function') {
      window.showLoginModal();
    } else {
      console.warn('⚠️ showLoginModal não disponível, usando fallback');
      alert('Faça login para interagir com os posts da Bíblia.');
    }
  }

  /**
   * Mostra mensagem de erro
   */
  showError(message) {
    console.error('📖 Erro:', message);
    // Aqui poderia integrar com sistema de notificações existente
    alert(message);
  }

  /**
   * Mostra mensagem de sucesso
   */
  showSuccess(message) {
    console.log('📖 Sucesso:', message);
    // Aqui poderia integrar com sistema de notificações existente
    alert(message);
  }

  // === UTILIDADES ===

  /**
   * Escapa HTML para prevenir XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Formata texto com quebras de linha
   */
  formatText(text) {
    if (!text) return '';
    
    return this.escapeHtml(text)
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^(.+)$/, '<p>$1</p>');
  }

  /**
   * Formata nome da categoria
   */
  formatCategoryName(category) {
    const categoryNames = {
      sabedoria: '📚 Sabedoria',
      amor: '❤️ Amor',
      fe: '🙏 Fé',
      oracao: '🕊️ Oração',
      relacionamentos: '👥 Relacionamentos',
      trabalho: '💼 Trabalho',
      familia: '🏠 Família',
      paz: '☮️ Paz',
      perdao: '🤝 Perdão',
      crescimento: '🌱 Crescimento',
      gratidao: '🙏 Gratidão',
      esperanca: '✨ Esperança'
    };
    
    return categoryNames[category] || category;
  }

  /**
   * Formata data
   */
  formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    
    return date.toLocaleDateString('pt-BR');
  }
}

// === INICIALIZAÇÃO ===

// Declara globalmente para acesso de outros módulos
window.BibleExplainedManager = BibleExplainedManager;

// Inicializa quando página bible-explained estiver ativa
console.log('📖 Bible Explained script carregado');

// Hook para main.js - inicializa quando página é mostrada
document.addEventListener('pageChanged', (e) => {
  if (e.detail?.page === 'bible-explained') {
    console.log('📖 Página Bible Explained ativada');
    
    if (!window.bibleExplainedInstance) {
      window.bibleExplainedInstance = new BibleExplainedManager();
    }
  }
});

// Inicialização direta se página já estiver ativa
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  const currentPage = document.querySelector('.page.active');
  if (currentPage?.id === 'bibleExplainedPage') {
    console.log('📖 Inicialização direta - página já ativa');
    window.bibleExplainedInstance = new BibleExplainedManager();
  }
}