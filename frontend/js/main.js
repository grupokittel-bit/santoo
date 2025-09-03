/**
 * SANTOO - Main JavaScript Application
 * Manages app initialization, routing, and core functionality
 */

class SantooApp {
  constructor() {
    this.currentPage = 'home';
    this.user = null;
    this.isLoading = true;
    
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log('🙏 Inicializando Santoo...');
    
    // Show loading screen
    this.showLoading();
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
    } else {
      this.onDOMReady();
    }
  }

  /**
   * Handle DOM ready state
   */
  async onDOMReady() {
    try {
      // Initialize components
      this.setupEventListeners();
      this.setupNavigation();
      this.setupModals();
      
      // Check for saved user session
      await this.checkUserSession();
      
      // CRITICAL FIX: Sync with AuthManager at startup
      this.syncUserFromAuthManager();
      
      // Initialize profile submenu
      this.updateProfileSubmenu();
      
      // Initialize current page
      this.initCurrentPage();
      
      // Hide loading screen
      await this.hideLoading();
      
      console.log('✅ Santoo inicializado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao inicializar Santoo:', error);
      this.showError('Erro ao carregar a aplicação. Tente recarregar a página.');
    }
  }

  /**
   * Show loading screen
   */
  showLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    const app = document.getElementById('app');
    
    if (loadingScreen) {
      loadingScreen.style.display = 'flex';
    }
    
    if (app) {
      app.style.display = 'none';
    }
  }

  /**
   * Hide loading screen with animation
   */
  async hideLoading() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        const app = document.getElementById('app');
        
        if (loadingScreen) {
          loadingScreen.style.opacity = '0';
          setTimeout(() => {
            loadingScreen.style.display = 'none';
          }, 300);
        }
        
        if (app) {
          app.style.display = 'flex';
          app.style.opacity = '0';
          app.style.animation = 'fadeIn 500ms ease-in-out forwards';
        }
        
        resolve();
      }, 1500); // Show loading for at least 1.5s for smooth experience
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Navigation clicks
    document.addEventListener('click', (e) => this.handleClick(e));
    
    // Form submissions
    document.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Window events
    window.addEventListener('popstate', (e) => this.handlePopState(e));
    window.addEventListener('resize', () => this.handleResize());
    
    // CRITICAL FIX: Auth change events
    window.addEventListener('santooAuthChange', (e) => {
      console.log('🔔 SantooApp recebeu evento de mudança de auth:', e.detail.event);
      this.updateUserUI();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    
    // Upload drag and drop
    this.setupDragAndDrop();
    
    // DIRECT BUTTON LISTENERS - FIX for modal not opening
    console.log('🔧 Configurando listeners diretos para botões auth...');
    
    // Wait for DOM and scripts to be ready
    setTimeout(() => {
      const registerBtn = document.getElementById('registerBtn');
      const loginBtn = document.getElementById('loginBtn');
      
      if (registerBtn) {
        registerBtn.addEventListener('click', (e) => {
          console.log('🎯 DIRECT RegisterBtn click listener ativado!');
          e.preventDefault();
          e.stopPropagation();
          
          if (typeof showRegisterModal === 'function') {
            console.log('✅ Chamando showRegisterModal() diretamente...');
            showRegisterModal();
          } else {
            console.log('⚠️ showRegisterModal não disponível! Aguardando carregamento...');
            // Tentar várias vezes com delays crescentes
            let attempts = 0;
            const maxAttempts = 10;
            
            const tryShowModal = () => {
              attempts++;
              if (typeof showRegisterModal === 'function') {
                console.log('✅ showRegisterModal agora disponível, chamando...');
                showRegisterModal();
              } else if (attempts < maxAttempts) {
                console.log(`🔄 Tentativa ${attempts}/${maxAttempts} - aguardando mais um pouco...`);
                setTimeout(tryShowModal, attempts * 50); // delay crescente: 50ms, 100ms, 150ms...
              } else {
                console.error('❌ showRegisterModal ainda não disponível após todas as tentativas');
                console.error('🔧 Tentando forçar carregamento do auth.js...');
              }
            };
            
            setTimeout(tryShowModal, 50);
          }
        }, true); // Use capturing to ensure it runs first
        console.log('✅ Direct listener adicionado ao registerBtn');
      } else {
        console.warn('❌ registerBtn não encontrado para listener direto');
      }
      
      if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
          console.log('🎯 DIRECT LoginBtn click listener ativado!');
          e.preventDefault();
          e.stopPropagation();
          
          if (typeof showLoginModal === 'function') {
            console.log('✅ Chamando showLoginModal() diretamente...');
            showLoginModal();
          } else {
            console.log('⚠️ showLoginModal não disponível! Aguardando carregamento...');
            // Tentar novamente após pequeno delay para aguardar carregamento
            setTimeout(() => {
              if (typeof showLoginModal === 'function') {
                console.log('✅ showLoginModal agora disponível, chamando...');
                showLoginModal();
              } else {
                console.error('❌ showLoginModal ainda não disponível após delay');
              }
            }, 100);
          }
        }, true); // Use capturing to ensure it runs first
        console.log('✅ Direct listener adicionado ao loginBtn');
      } else {
        console.warn('❌ loginBtn não encontrado para listener direto');
      }
    }, 2000); // Wait 2 seconds for all scripts to load

    console.log('📱 Event listeners configurados');
  }

  /**
   * Handle click events
   */
  handleClick(e) {
    // DEBUG: Log all clicks to help diagnose issues
    console.log('🖱️ Click detectado em:', e.target.tagName, e.target.id, e.target.className);
    
    // Handle profile dropdown toggle - apenas para a setinha
    const dropdownArrow = e.target.closest('.dropdown-arrow');
    if (dropdownArrow && e.target.closest('#profileMenuBtn')) {
      e.preventDefault();
      console.log('📋 Profile dropdown arrow clicado');
      this.toggleDropdown('profileSubmenu');
      return;
    }
    
    // Handle modal triggers
    const modalTrigger = e.target.closest('[data-modal]');
    if (modalTrigger) {
      e.preventDefault();
      const modalId = modalTrigger.dataset.modal;
      this.openModal(modalId);
      return;
    }
    
    // Handle page navigation - DEPOIS do dropdown
    const target = e.target.closest('[data-page]');
    if (target) {
      e.preventDefault();
      const page = target.dataset.page;
      this.navigateTo(page);
      return;
    }
    
    // Handle auth buttons - DEBUG ENHANCED
    if (e.target.matches('#loginBtn')) {
      console.log('🚀 LoginBtn clicado!');
      // Use the professional auth functions from auth.js
      if (typeof showLoginModal === 'function') {
        console.log('✅ showLoginModal está disponível, chamando...');
        showLoginModal();
      } else {
        console.log('⚠️ showLoginModal não disponível! Aguardando carregamento...');
        // Tentar novamente após pequeno delay para aguardar carregamento
        setTimeout(() => {
          if (typeof showLoginModal === 'function') {
            console.log('✅ showLoginModal agora disponível, chamando...');
            showLoginModal();
          } else {
            console.error('❌ showLoginModal ainda não disponível após delay');
          }
        }, 100);
      }
    } else if (e.target.matches('#registerBtn')) {
      console.log('🚀 RegisterBtn clicado!');
      console.log('🔍 Verificando showRegisterModal:', typeof showRegisterModal);
      // Use the professional auth functions from auth.js  
      if (typeof showRegisterModal === 'function') {
        console.log('✅ showRegisterModal está disponível, chamando...');
        showRegisterModal();
      } else {
        console.log('⚠️ showRegisterModal não disponível! Aguardando carregamento...');
        // Tentar várias vezes com delays crescentes
        let attempts = 0;
        const maxAttempts = 10;
        
        const tryShowModal = () => {
          attempts++;
          if (typeof showRegisterModal === 'function') {
            console.log('✅ showRegisterModal agora disponível, chamando...');
            showRegisterModal();
          } else if (attempts < maxAttempts) {
            console.log(`🔄 Tentativa ${attempts}/${maxAttempts} - aguardando mais um pouco...`);
            setTimeout(tryShowModal, attempts * 50); // delay crescente: 50ms, 100ms, 150ms...
          } else {
            console.error('❌ showRegisterModal ainda não disponível após todas as tentativas');
          }
        };
        
        setTimeout(tryShowModal, 50);
      }
    } else if (e.target.matches('#logoutBtn')) {
      this.logout();
    }
    
    // Handle filter buttons
    const filterBtn = e.target.closest('.filter-btn');
    if (filterBtn) {
      this.handleFilterClick(filterBtn);
      return;
    }
    
    // Close dropdowns when clicking outside
    if (!e.target.closest('.dropdown')) {
      this.closeAllDropdowns();
    }
  }

  /**
   * Handle form submissions
   */
  handleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formType = form.dataset.type;
    
    switch (formType) {
      case 'login':
        this.handleLogin(form);
        break;
      case 'register':
        this.handleRegister(form);
        break;
      case 'upload':
        this.handleUpload(form);
        break;
      default:
        console.log('Formulário não reconhecido:', formType);
    }
  }

  /**
   * Setup navigation
   */
  setupNavigation() {
    // Update nav link states
    this.updateNavigation();
    
    // Handle hash changes
    const hash = window.location.hash.replace('#', '');
    if (hash && this.isValidPage(hash)) {
      this.currentPage = hash;
    }
    
    console.log('🧭 Navegação configurada');
  }

  /**
   * Navigate to page
   */
  navigateTo(page) {
    if (!this.isValidPage(page)) {
      console.error('Página inválida:', page);
      return;
    }
    
    // Update current page
    this.currentPage = page;
    
    // Update URL
    window.history.pushState({ page }, '', `#${page}`);
    
    // Update navigation
    this.updateNavigation();
    
    // Show page
    this.showPage(page);
    
    console.log(`📄 Navegando para: ${page}`);
  }

  /**
   * Update navigation state
   */
  updateNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      const page = link.dataset.page;
      if (page === this.currentPage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * Show specific page
   */
  showPage(page) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => {
      p.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(`${page}Page`);
    if (targetPage) {
      targetPage.classList.add('active');
      this.initCurrentPage();
    }
  }

  /**
   * Initialize current page
   */
  initCurrentPage() {
    switch (this.currentPage) {
      case 'home':
        this.initHomePage();
        break;
      case 'discover':
        this.initDiscoverPage();
        break;
      case 'upload':
        this.initUploadPage();
        break;
      case 'live':
        this.initLivePage();
        break;
      case 'profile':
        this.initProfilePage();
        break;
      default:
        this.initHomePage();
    }
  }

  /**
   * Initialize home page
   */
  async initHomePage() {
    console.log('🏠 Inicializando página inicial');
    
    try {
      // Load video feed
      await this.loadVideoFeed();
      
    } catch (error) {
      console.error('Erro ao carregar feed:', error);
      this.showError('Erro ao carregar vídeos');
    }
  }

  /**
   * Load video feed from API
   */
  async loadVideoFeed(filters = {}) {
    const videoFeed = document.getElementById('videoFeed');
    if (!videoFeed) return;
    
    try {
      console.log('📹 Carregando feed de vídeos da API...');
      
      // Show loading
      videoFeed.innerHTML = this.getLoadingHTML();
      
      // SAFETY CHECK: Aguarda SantooAPI estar disponível
      console.log('🔍 DEBUG: Verificando window.SantooAPI:', {
        windowSantooAPIExists: !!window.SantooAPI,
        videosExists: !!window.SantooAPI?.videos,
        getFeedExists: typeof window.SantooAPI?.videos?.getFeed
      });
      
      if (!window.SantooAPI || !window.SantooAPI.videos) {
        console.log('⏳ Aguardando SantooAPI estar disponível...');
        await this.waitForSantooAPI();
        console.log('✅ SantooAPI agora está disponível!');
      }
      
      // Get videos from API
      console.log('🔍 DEBUG: Fazendo chamada para API:', {
        apiBaseURL: window.SantooAPI.baseURL,
        hasToken: !!window.SantooAPI.token,
        filters
      });
      
      const response = await window.SantooAPI.videos.getFeed({
        page: 1,
        limit: 10,
        ...filters
      });
      
      console.log('🔍 DEBUG: Resposta da API recebida:', {
        responseType: typeof response,
        hasVideos: !!response?.videos,
        videoCount: response?.videos?.length || 0
      });
      
      if (response && response.videos) {
        if (response.videos.length === 0) {
          videoFeed.innerHTML = this.getEmptyStateHTML();
        } else {
          videoFeed.innerHTML = response.videos.map(video => this.createVideoCard(video)).join('');
          this.setupVideoInteractions();
        }
        
        console.log(`✅ ${response.videos.length} vídeos carregados`);
      } else {
        throw new Error('Resposta inválida da API');
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar feed:', error);
      videoFeed.innerHTML = this.getErrorStateHTML(error.message);
    }
  }

  /**
   * Generate demo videos for development
   */
  generateDemoVideos() {
    const demoVideos = [
      {
        id: 1,
        title: 'Mensagem de Esperança - Salmo 23',
        author: 'Pastor João',
        avatar: 'assets/images/default-avatar.svg',
        thumbnail: 'assets/images/video-thumb-1.jpg',
        duration: '3:45',
        views: 1234,
        likes: 89,
        category: 'pregação'
      },
      {
        id: 2,
        title: 'Hino: Como é Grande o Meu Deus',
        author: 'Coral Santoo',
        avatar: 'assets/images/default-avatar.svg',
        thumbnail: 'assets/images/video-thumb-2.jpg',
        duration: '4:12',
        views: 2567,
        likes: 156,
        category: 'musica'
      },
      {
        id: 3,
        title: 'Testemunho: Deus Mudou Minha Vida',
        author: 'Maria Santos',
        avatar: 'assets/images/default-avatar.svg',
        thumbnail: 'assets/images/video-thumb-3.jpg',
        duration: '2:33',
        views: 891,
        likes: 67,
        category: 'testemunho'
      }
    ];
    
    return demoVideos.map(video => this.createVideoCard(video)).join('');
  }

  /**
   * Create video card HTML with API data
   */
  createVideoCard(video) {
    // Format duration from seconds to MM:SS
    const duration = video.duration ? SantooUtils.StringUtils.formatDuration(video.duration) : '0:00';
    
    // Get thumbnail URL or fallback
    const thumbnailUrl = video.thumbnailUrl 
      ? `${window.SantooAPI?.baseURL || 'http://localhost:3001'}${video.thumbnailUrl}` 
      : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMyMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMjAwIiBmaWxsPSIjM0EzQTNBIi8+CjxwYXRoIGQ9Ik0xMzAgODBMMTkwIDEyMEwxMzAgMTYwVjgwWiIgZmlsbD0iIzRBOTBFMiIvPgo8L3N2Zz4K';
    
    // Get avatar URL or fallback
    const avatarUrl = video.User?.avatar 
      ? `${window.SantooAPI?.baseURL || 'http://localhost:3001'}${video.User.avatar}` 
      : 'assets/images/default-avatar.svg';
    
    return `
      <div class="video-card" data-video-id="${video.id}" onclick="playVideo('${video.id}')">
        <div class="video-thumbnail">
          <img src="${thumbnailUrl}" alt="${SantooUtils.StringUtils.escapeHtml(video.title)}" 
               onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMyMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMjAwIiBmaWxsPSIjM0EzQTNBIi8+CjxwYXRoIGQ9Ik0xMzAgODBMMTkwIDEyMEwxMzAgMTYwVjgwWiIgZmlsbD0iIzRBOTBFMiIvPgo8L3N2Zz4K'">
          <div class="video-duration">${duration}</div>
          <div class="video-play-btn">▶️</div>
        </div>
        
        <div class="video-info">
          <h3 class="video-title" title="${SantooUtils.StringUtils.escapeHtml(video.title)}">
            ${SantooUtils.StringUtils.truncate(video.title, 50)}
          </h3>
          
          <div class="video-author" onclick="event.stopPropagation(); this.viewProfile('${video.User?.username}')">
            <div class="avatar avatar-sm">
              <img src="${avatarUrl}" alt="${SantooUtils.StringUtils.escapeHtml(video.User?.displayName)}" 
                   onerror="this.src='assets/images/default-avatar.svg'">
              ${video.User?.isVerified ? '<div class="verified-badge">✓</div>' : ''}
            </div>
            <span>${SantooUtils.StringUtils.escapeHtml(video.User?.displayName || 'Usuário')}</span>
          </div>
          
          <div class="video-stats">
            <div class="video-stat" title="Visualizações">
              <span>👁️</span>
              <span>${SantooUtils.NumberUtils.format(video.viewsCount || 0)}</span>
            </div>
            <div class="video-stat like-stat" title="Curtidas" 
                 onclick="event.stopPropagation(); this.toggleLike('${video.id}')"
                 data-liked="${video.userLiked || false}">
              <span class="like-icon">${video.userLiked ? '❤️' : '🤍'}</span>
              <span class="like-count">${SantooUtils.NumberUtils.format(video.likesCount || 0)}</span>
            </div>
            <div class="video-stat">
              <span class="badge category-badge" style="background-color: ${video.Category?.color || '#6B7280'}" 
                    title="${video.Category?.name}">
                ${video.Category?.icon || '📹'} ${video.Category?.name || 'Vídeo'}
              </span>
            </div>
          </div>
          
          <div class="video-meta">
            <span class="video-date" title="${SantooUtils.DateUtils.format(video.createdAt)}">
              ${SantooUtils.DateUtils.getRelativeTime(video.createdAt)}
            </span>
            ${video.commentsCount > 0 ? `
              <span class="video-comments" title="Comentários">
                💬 ${SantooUtils.NumberUtils.format(video.commentsCount)}
              </span>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Initialize upload page
   */
  initUploadPage() {
    console.log('📤 Inicializando página de upload');
    // Upload functionality will be handled by upload.js
  }

  /**
   * Initialize profile page
   */
  initProfilePage() {
    console.log('👤 Inicializando página de perfil');
    this.updateProfileDisplay();
  }

  /**
   * Update profile display based on user state
   */
  updateProfileDisplay() {
    const profilePage = document.getElementById('profilePage');
    if (!profilePage) return;
    
    const authPrompt = document.querySelector('.auth-prompt');
    
    if (this.user) {
      // Show user profile
      console.log('👤 Usuário logado - exibindo perfil de:', this.user.displayName);
      this.showUserProfile();
    } else {
      // Show auth prompt for non-logged users
      console.log('👥 Usuário não logado - mostrando prompt de autenticação');
      
      if (authPrompt) {
        authPrompt.style.display = 'block';
      }
      
      // Reset profile to default state
      const profileName = document.querySelector('.profile-name');
      const profileBio = document.querySelector('.profile-bio');
      const profileAvatar = document.querySelector('.profile-avatar img');
      
      if (profileName) {
        profileName.textContent = 'Usuário Convidado';
      }
      
      if (profileBio) {
        profileBio.textContent = 'Bem-vindo ao Santoo! Faça login para personalizar seu perfil.';
      }
      
      if (profileAvatar) {
        profileAvatar.src = 'assets/images/default-avatar.svg';
        profileAvatar.alt = 'Avatar do usuário';
      }
      
      // Reset stats
      const stats = document.querySelectorAll('.profile-stats .stat strong');
      if (stats.length >= 3) {
        stats[0].textContent = '0'; // Seguidores
        stats[1].textContent = '0'; // Seguindo  
        stats[2].textContent = '0'; // Vídeos
      }
    }
  }

  /**
   * Show authenticated user profile
   */
  showUserProfile() {
    if (!this.user) return;
    
    console.log('👤 Mostrando perfil do usuário:', this.user.displayName);
    
    // Esconder prompt de autenticação
    const authPrompt = document.querySelector('.auth-prompt');
    if (authPrompt) {
      authPrompt.style.display = 'none';
    }
    
    // Atualizar informações do perfil
    const profileName = document.querySelector('.profile-name');
    const profileBio = document.querySelector('.profile-bio'); 
    const profileAvatar = document.querySelector('.profile-avatar img');
    
    if (profileName) {
      profileName.textContent = this.user.displayName || this.user.username;
    }
    
    if (profileBio) {
      profileBio.textContent = this.user.bio || 'Membro da comunidade Santoo';
    }
    
    if (profileAvatar) {
      profileAvatar.src = this.user.avatar || 'assets/images/default-avatar.svg';
      profileAvatar.alt = `Avatar de ${this.user.displayName || this.user.username}`;
    }
    
    // Atualizar estatísticas
    const stats = document.querySelectorAll('.profile-stats .stat strong');
    if (stats.length >= 3) {
      stats[0].textContent = this.user.followersCount || 0; // Seguidores
      stats[1].textContent = this.user.followingCount || 0; // Seguindo  
      stats[2].textContent = this.user.videosCount || 0;    // Vídeos
    }
    
    // Mostrar conteúdo de perfil do usuário logado
    // TODO: Implementar lista de vídeos do usuário
  }

  /**
   * Setup modals
   */
  setupModals() {
    // Close modal when clicking overlay
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          this.closeAllModals();
        }
      });
    }
    
    // Close modal buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('.btn-close') || e.target.closest('.btn-close')) {
        this.closeAllModals();
      }
    });
    
    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
    
    console.log('🔲 Modais configurados');
  }

  /**
   * Open authentication modal (DEPRECATED - usar showLoginModal/showRegisterModal do auth.js)
   * MANTIDO APENAS PARA COMPATIBILIDADE LEGADA
   */
  openAuthModal(type = 'login') {
    console.warn('⚠️ openAuthModal() é DEPRECATED! Use showLoginModal() ou showRegisterModal() do auth.js');
    
    // Redirecionar para funções profissionais do auth.js
    if (type === 'login' && typeof showLoginModal === 'function') {
      console.log('🔄 Redirecionando para showLoginModal()...');
      showLoginModal();
      return;
    } else if (type === 'register' && typeof showRegisterModal === 'function') {
      console.log('🔄 Redirecionando para showRegisterModal()...');
      showRegisterModal();
      return;
    }
    
    console.error('❌ Funções profissionais de auth não disponíveis. Modal antigo não será exibido.');
  }

  /**
   * Get authentication form HTML (DEPRECATED - usar auth.js)
   * REMOVIDO para evitar confusão com modais profissionais
   */
  getAuthFormHTML(type) {
    console.warn('⚠️ getAuthFormHTML() é DEPRECATED! Use as funções do auth.js');
    return '<p>Modal antigo removido. Use showLoginModal() ou showRegisterModal().</p>';
  }

  /**
   * Handle login
   */
  async handleLogin(form) {
    const formData = new FormData(form);
    const email = formData.get('email') || form.querySelector('#loginEmail').value;
    const password = formData.get('password') || form.querySelector('#loginPassword').value;
    
    console.log('🔐 Tentativa de login:', email);
    
    try {
      // Simulate API call
      await this.delay(1000);
      
      // Mock successful login
      this.user = {
        id: 1,
        name: 'Usuário Teste',
        email: email,
        avatar: 'assets/images/default-avatar.svg'
      };
      
      // Save to localStorage
      localStorage.setItem('santoo_user', JSON.stringify(this.user));
      
      // Close modal
      this.closeAllModals();
      
      // Update UI
      this.updateUserUI();
      
      console.log('✅ Login realizado com sucesso');
      this.showSuccess('Login realizado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro no login:', error);
      this.showError('Erro ao fazer login. Tente novamente.');
    }
  }

  /**
   * Handle register
   */
  async handleRegister(form) {
    const formData = new FormData(form);
    const name = formData.get('name') || form.querySelector('#registerName').value;
    const email = formData.get('email') || form.querySelector('#registerEmail').value;
    const password = formData.get('password') || form.querySelector('#registerPassword').value;
    
    console.log('📝 Tentativa de registro:', email);
    
    try {
      // Simulate API call
      await this.delay(1000);
      
      // Mock successful registration
      this.user = {
        id: Date.now(),
        name: name,
        email: email,
        avatar: 'assets/images/default-avatar.svg'
      };
      
      // Save to localStorage
      localStorage.setItem('santoo_user', JSON.stringify(this.user));
      
      // Close modal
      this.closeAllModals();
      
      // Update UI
      this.updateUserUI();
      
      console.log('✅ Registro realizado com sucesso');
      this.showSuccess('Conta criada com sucesso! Bem-vindo ao Santoo!');
      
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      this.showError('Erro ao criar conta. Tente novamente.');
    }
  }

  /**
   * Logout user
   */
  logout() {
    this.user = null;
    localStorage.removeItem('santoo_user');
    this.updateUserUI();
    console.log('👋 Usuário desconectado');
    this.showSuccess('Você foi desconectado');
  }

  /**
   * Check for saved user session
   */
  async checkUserSession() {
    try {
      const savedUser = localStorage.getItem('santoo_user');
      if (savedUser) {
        this.user = JSON.parse(savedUser);
        console.log('👤 Sessão de usuário restaurada:', this.user.name);
      }
    } catch (error) {
      console.error('Erro ao restaurar sessão:', error);
      localStorage.removeItem('santoo_user');
    }
  }

  /**
   * Update user interface based on auth state
   */
  updateUserUI() {
    // CRITICAL FIX: Sync this.user with authManager.user BEFORE updating UI
    this.syncUserFromAuthManager();
    
    // Update profile dropdown submenu based on auth state
    this.updateProfileSubmenu();
    
    // Update profile page if currently viewing
    if (this.currentPage === 'profile') {
      this.updateProfileDisplay();
    }
  }

  /**
   * Sync this.user with window.authManager.user
   * CRITICAL for UI updates after login/register
   */
  syncUserFromAuthManager() {
    if (window.authManager) {
      const authUser = window.authManager.user;
      const isAuthenticated = window.authManager.isAuthenticated();
      
      if (isAuthenticated && authUser) {
        this.user = authUser;
        console.log('🔄 User sincronizado do AuthManager:', this.user.displayName || this.user.username);
      } else {
        this.user = null;
        console.log('🔄 User limpo (logout ou não autenticado)');
      }
    } else {
      console.warn('⚠️ AuthManager não disponível para sincronização');
    }
  }

  /**
   * Update profile submenu based on authentication state
   */
  updateProfileSubmenu() {
    const profileSubmenu = document.getElementById('profileSubmenu');
    if (!profileSubmenu) return;

    console.log('📋 Atualizando submenu do perfil. User:', !!this.user);

    if (this.user) {
      // User is logged in - show logout option
      profileSubmenu.innerHTML = `
        <button class="dropdown-item" id="submenuLogout">
          <i class="nav-icon" data-lucide="log-out" style="width: 16px; height: 16px; margin-right: var(--space-2);"></i>
          Sair
        </button>
      `;
    } else {
      // User is not logged in - show login and register options
      profileSubmenu.innerHTML = `
        <button class="dropdown-item" id="submenuLogin">
          <i class="nav-icon" data-lucide="log-in" style="width: 16px; height: 16px; margin-right: var(--space-2);"></i>
          Entrar
        </button>
        <hr class="dropdown-divider">
        <button class="dropdown-item" id="submenuRegister">
          <i class="nav-icon" data-lucide="user-plus" style="width: 16px; height: 16px; margin-right: var(--space-2);"></i>
          Criar Conta
        </button>
      `;
    }

    // Re-initialize Lucide icons for the new content
    if (window.lucide) {
      lucide.createIcons();
    }

    // Add event listeners to submenu items
    this.bindSubmenuEvents();
  }

  /**
   * Bind event listeners to submenu items
   */
  bindSubmenuEvents() {
    const submenuLogin = document.getElementById('submenuLogin');
    const submenuRegister = document.getElementById('submenuRegister');
    const submenuLogout = document.getElementById('submenuLogout');

    if (submenuLogin) {
      submenuLogin.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🔑 Submenu Login clicado');
        this.closeAllDropdowns();
        if (typeof showLoginModal === 'function') {
          showLoginModal();
        }
      });
    }

    if (submenuRegister) {
      submenuRegister.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('👤 Submenu Register clicado');
        this.closeAllDropdowns();
        if (typeof showRegisterModal === 'function') {
          showRegisterModal();
        }
      });
    }

    if (submenuLogout) {
      submenuLogout.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🚪 Submenu Logout clicado');
        this.closeAllDropdowns();
        this.handleLogout();
      });
    }
  }

  /**
   * Handle logout from submenu
   */
  async handleLogout() {
    try {
      console.log('🔓 Fazendo logout...');
      
      // Call logout from auth manager (handles API + storage cleanup)
      if (window.authManager && typeof window.authManager.logout === 'function') {
        await window.authManager.logout();
      }
      
      // Clear local user state IN MEMORY
      this.user = null;
      
      // SAFETY: Also clear any localStorage directly (double-check)
      localStorage.removeItem('santoo_user');
      localStorage.removeItem('santoo_token');
      
      // Update UI
      this.updateUserUI();
      
      // Redirect to home if on profile page
      if (this.currentPage === 'profile') {
        this.navigateTo('home');
      }
      
      console.log('✅ Logout realizado com sucesso - sessão completamente limpa');
      this.showSuccess('Logout realizado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      
      // FALLBACK: Clear everything manually in case of error
      this.user = null;
      localStorage.removeItem('santoo_user');
      localStorage.removeItem('santoo_token');
      this.updateUserUI();
      
      this.showError('Erro ao fazer logout. Sessão limpa localmente.');
    }
  }

  /**
   * Utility functions
   */
  openModal(modalId) {
    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById(modalId);
    
    if (overlay && modal) {
      overlay.classList.add('active');
      modal.style.display = 'block';
    }
  }

  closeAllModals() {
    const overlay = document.getElementById('modalOverlay');
    const modals = overlay.querySelectorAll('.modal');
    
    if (overlay) {
      overlay.classList.remove('active');
      modals.forEach(modal => {
        modal.style.display = 'none';
      });
    }
  }

  toggleDropdown(dropdownId) {
    console.log('🔽 toggleDropdown chamado para:', dropdownId);
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
      console.log('✅ Dropdown encontrado, classes antes:', dropdown.className);
      dropdown.classList.toggle('active');
      console.log('✅ Dropdown classes depois:', dropdown.className);
    } else {
      console.error('❌ Dropdown não encontrado:', dropdownId);
    }
  }

  closeAllDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-menu');
    dropdowns.forEach(dropdown => {
      dropdown.classList.remove('active');
    });
  }

  handleFilterClick(filterBtn) {
    // Remove active class from all filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    filterBtn.classList.add('active');
    
    const filter = filterBtn.dataset.filter;
    console.log('🔍 Filtro selecionado:', filter);
    
    // Here you would filter the video feed
    // For now, just log the filter
  }

  setupDragAndDrop() {
    const uploadZone = document.getElementById('uploadZone');
    if (!uploadZone) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
      uploadZone.addEventListener(eventName, () => {
        uploadZone.classList.add('drag-over');
      });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      uploadZone.addEventListener(eventName, () => {
        uploadZone.classList.remove('drag-over');
      });
    });
    
    uploadZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileSelect(files[0]);
      }
    });
  }

  handleFileSelect(file) {
    console.log('📁 Arquivo selecionado:', file.name);
    // File handling will be implemented in upload.js
  }

  // Utility methods
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  isValidPage(page) {
    const validPages = ['home', 'discover', 'upload', 'live', 'profile'];
    return validPages.includes(page);
  }

  showSuccess(message) {
    console.log('✅ Sucesso:', message);
    // Toast notification implementation would go here
  }

  showError(message) {
    console.error('❌ Erro:', message);
    // Toast notification implementation would go here
  }

  handlePopState(e) {
    const state = e.state;
    if (state && state.page) {
      this.currentPage = state.page;
      this.showPage(state.page);
      this.updateNavigation();
    }
  }

  handleResize() {
    // Handle responsive behavior
    console.log('📐 Redimensionamento detectado');
  }

  handleKeyboard(e) {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case '/':
          e.preventDefault();
          // Focus search
          break;
        case 'u':
          e.preventDefault();
          this.navigateTo('upload');
          break;
      }
    }
  }

  // === VIDEO FEED HELPER FUNCTIONS ===

  /**
   * Get loading state HTML
   */
  getLoadingHTML() {
    return `
      <div class="feed-loading">
        <div class="loading-spinner"></div>
        <p>Carregando vídeos...</p>
      </div>
    `;
  }

  /**
   * Get empty state HTML
   */
  getEmptyStateHTML() {
    return `
      <div class="feed-empty-state">
        <div class="empty-icon">📹</div>
        <h3>Nenhum vídeo encontrado</h3>
        <p>Seja o primeiro a compartilhar conteúdo inspirador!</p>
        <button class="btn-primary" onclick="santooApp.navigateTo('upload')">
          Postar Vídeo
        </button>
      </div>
    `;
  }

  /**
   * Get error state HTML
   */
  getErrorStateHTML(errorMessage) {
    return `
      <div class="feed-error-state">
        <div class="error-icon">⚠️</div>
        <h3>Erro ao carregar vídeos</h3>
        <p>${SantooUtils.StringUtils.escapeHtml(errorMessage)}</p>
        <button class="btn-secondary" onclick="santooApp.loadVideoFeed()">
          Tentar Novamente
        </button>
      </div>
    `;
  }

  /**
   * Setup video interactions (play, like, etc.)
   */
  setupVideoInteractions() {
    // Add play video functionality  
    const self = this;
    window.playVideo = async (videoId) => {
      console.log('▶️ Reproduzindo vídeo:', videoId);
      
      try {
        // SAFETY CHECK: Aguarda SantooAPI estar disponível
        if (!window.SantooAPI || !window.SantooAPI.videos) {
          await self.waitForSantooAPI();
        }
        
        // TODO: Implement video player modal
        const response = await window.SantooAPI.videos.getById(videoId);
        
        if (response && response.video) {
          self.openVideoModal(response.video);
          
          // Increment views
          setTimeout(() => {
            self.incrementVideoViews(videoId);
          }, 5000); // After 5 seconds of viewing
        }
      } catch (error) {
        console.error('❌ Erro ao carregar vídeo:', error);
        this.showError('Erro ao carregar vídeo');
      }
    };

    // Add profile view functionality
    window.viewProfile = (username) => {
      console.log('👤 Visualizando perfil:', username);
      // TODO: Navigate to user profile
      this.navigateTo(`profile/${username}`);
    };

    // Add like toggle functionality
    window.toggleLike = async (videoId) => {
      if (!santooAuth.isAuthenticated()) {
        self.showLoginModal();
        return;
      }

      try {
        // SAFETY CHECK: Aguarda SantooAPI estar disponível
        if (!window.SantooAPI || !window.SantooAPI.videos) {
          await self.waitForSantooAPI();
        }
        
        const likeButton = document.querySelector(`[onclick="toggleLike('${videoId}')"]`);
        if (!likeButton) return;

        const likeIcon = likeButton.querySelector('.like-icon');
        const likeCount = likeButton.querySelector('.like-count');
        const isCurrentlyLiked = likeButton.dataset.liked === 'true';

        // Optimistic update
        likeButton.dataset.liked = !isCurrentlyLiked;
        likeIcon.textContent = !isCurrentlyLiked ? '❤️' : '🤍';
        
        const response = await window.SantooAPI.videos.toggleLike(videoId);
        
        if (response && response.success) {
          likeCount.textContent = SantooUtils.NumberUtils.format(response.likes || 0);
          console.log('👍 Like atualizado:', response.message);
        }
      } catch (error) {
        console.error('❌ Erro ao curtir vídeo:', error);
        
        // Revert optimistic update on error
        const likeButton = document.querySelector(`[onclick="toggleLike('${videoId}')"]`);
        if (likeButton) {
          const isCurrentlyLiked = likeButton.dataset.liked === 'true';
          likeButton.dataset.liked = !isCurrentlyLiked;
          const likeIcon = likeButton.querySelector('.like-icon');
          likeIcon.textContent = !isCurrentlyLiked ? '❤️' : '🤍';
        }
      }
    };
  }

  /**
   * Open video player modal
   */
  openVideoModal(video) {
    // TODO: Implement full video player modal
    const videoUrl = video.videoUrl ? `${window.SantooAPI?.baseURL || 'http://localhost:3001'}${video.videoUrl}` : null;
    
    if (!videoUrl) {
      this.showError('URL do vídeo não encontrada');
      return;
    }

    // Simple video modal for now
    const modalHTML = `
      <div class="modal video-modal">
        <div class="modal-content video-modal-content">
          <div class="modal-header">
            <h3>${SantooUtils.StringUtils.escapeHtml(video.title)}</h3>
            <button class="btn-close" onclick="santooApp.closeAllModals()">
              <i data-lucide="x" class="close-icon"></i>
            </button>
          </div>
          <div class="modal-body">
            <video 
              controls 
              autoplay 
              style="width: 100%; height: auto; max-height: 70vh;"
              poster="${video.thumbnailUrl ? (window.SantooAPI?.baseURL || 'http://localhost:3001') + video.thumbnailUrl : ''}"
            >
              <source src="${videoUrl}" type="video/mp4">
              <source src="${videoUrl}" type="video/webm">
              Seu navegador não suporta reprodução de vídeo.
            </video>
            
            <div class="video-details" style="padding: 15px 0;">
              <div class="video-author">
                <img src="${video.User?.avatar ? (window.SantooAPI?.baseURL || 'http://localhost:3001') + video.User.avatar : 'assets/images/default-avatar.svg'}" 
                     alt="${video.User?.displayName}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;">
                <div>
                  <strong>${SantooUtils.StringUtils.escapeHtml(video.User?.displayName || 'Usuário')}</strong>
                  <div style="font-size: 0.9em; color: #666;">
                    ${SantooUtils.NumberUtils.format(video.viewsCount || 0)} visualizações • 
                    ${SantooUtils.DateUtils.getRelativeTime(video.createdAt)}
                  </div>
                </div>
              </div>
              
              ${video.description ? `
                <div style="margin-top: 15px; line-height: 1.5;">
                  ${SantooUtils.StringUtils.escapeHtml(video.description).replace(/\n/g, '<br>')}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    const overlay = document.getElementById('modalOverlay');
    overlay.innerHTML = modalHTML;
    overlay.style.display = 'flex';
  }

  /**
   * Increment video views
   */
  async incrementVideoViews(videoId) {
    try {
      // In a real app, this would be handled by the video player
      // For now, we'll assume the API handles view counting
      console.log('📈 Incrementando visualizações do vídeo:', videoId);
    } catch (error) {
      console.error('❌ Erro ao incrementar visualizações:', error);
    }
  }

  /**
   * Handle filter button clicks with API integration
   */
  handleFilterClick(filterBtn) {
    // Remove active class from all filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    filterBtn.classList.add('active');
    
    const filter = filterBtn.dataset.filter;
    console.log('🔍 Aplicando filtro:', filter);
    
    // Load filtered feed
    const filters = {};
    
    if (filter && filter !== 'all') {
      // Map frontend filter names to API category IDs
      const categoryMap = {
        'pregacao': 1,
        'musica': 2, 
        'testemunho': 3,
        'estudo': 4,
        'jovens': 5,
        'infantil': 6,
        'live': 7,
        'devocional': 8
      };
      
      if (categoryMap[filter]) {
        filters.category = categoryMap[filter];
      }
    }
    
    this.loadVideoFeed(filters);
  }

  // Initialize other pages (stubs for now)
  initDiscoverPage() {
    console.log('🔍 Inicializando página de descoberta');
  }

  initLivePage() {
    console.log('🔴 Inicializando página de lives');
  }

  /**
   * Aguarda SantooAPI estar completamente disponível
   */
  async waitForSantooAPI(maxAttempts = 50, delay = 100) {
    console.log('🔄 DEBUG: Iniciando waitForSantooAPI - max tentativas:', maxAttempts);
    
    for (let i = 0; i < maxAttempts; i++) {
      console.log(`🔍 DEBUG: Tentativa ${i + 1}/${maxAttempts}:`, {
        windowSantooAPI: !!window.SantooAPI,
        videos: !!window.SantooAPI?.videos,
        getFeedType: typeof window.SantooAPI?.videos?.getFeed
      });
      
      if (window.SantooAPI && window.SantooAPI.videos && typeof window.SantooAPI.videos.getFeed === 'function') {
        console.log('✅ SantooAPI disponível após', i * delay, 'ms');
        return true;
      }
      
      // Aguarda delay em milissegundos
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    console.error('❌ DEBUG: waitForSantooAPI FALHOU após', maxAttempts * delay, 'ms');
    throw new Error('❌ Timeout: SantooAPI não ficou disponível após ' + (maxAttempts * delay) + 'ms');
  }
}

// Initialize app when script loads
const santooApp = new SantooApp();

// Make app globally accessible for debugging
window.santooApp = santooApp;