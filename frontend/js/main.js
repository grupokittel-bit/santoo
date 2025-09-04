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
      this.setupModals();
      
      // Check for saved user session
      await this.checkUserSession();
      
      // CRITICAL FIX: Sync with AuthManager at startup
      this.syncUserFromAuthManager();
      
      // Initialize profile submenu
      this.updateProfileSubmenu();
      
      // 🎯 FIX F5 BUG: Verificar hash da URL ANTES de inicializar página
      const hash = window.location.hash.replace('#', '');
      if (hash && this.isValidPage(hash)) {
        this.currentPage = hash;
        console.log('🔄 Hash da URL detectado:', hash, '- definindo como página atual');
      } else {
        console.log('📍 Nenhum hash válido - mantendo página padrão:', this.currentPage);
      }
      
      // Setup navigation AFTER setting currentPage
      this.setupNavigation();
      
      // Initialize current page (now with correct currentPage from hash)
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
      // Minimum loading time for better UX (prevent flash)
      const minimumLoadTime = 1200;
      const startTime = Date.now();
      
      const performHideAnimation = () => {
        const loadingScreen = document.getElementById('loadingScreen');
        const app = document.getElementById('app');
        
        if (loadingScreen) {
          loadingScreen.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
          loadingScreen.style.opacity = '0';
          setTimeout(() => {
            loadingScreen.style.display = 'none';
            loadingScreen.setAttribute('aria-hidden', 'true');
          }, 400);
        }
        
        if (app) {
          app.style.display = 'flex';
          app.style.opacity = '0';
          app.style.transform = 'translateY(10px)';
          app.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
          
          // Force reflow for smooth animation
          app.offsetHeight;
          
          requestAnimationFrame(() => {
            app.style.opacity = '1';
            app.style.transform = 'translateY(0)';
          });
        }
        
        setTimeout(resolve, 500);
      };
      
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minimumLoadTime - elapsedTime);
      
      setTimeout(performHideAnimation, remainingTime);
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
      case 'bible-post':
        // Formulário da Bíblia é tratado pelo BibleAdminManager
        if (window.bibleAdmin && window.bibleAdmin.handlePostSubmit) {
          window.bibleAdmin.handlePostSubmit(e);
        } else {
          console.log('📖 BibleAdminManager não encontrado - formulário Bible Post');
        }
        break;
      default:
        console.log('Formulário não reconhecido:', formType);
    }
  }

  /**
   * Setup navigation
   */
  setupNavigation() {
    // Update nav link states based on currentPage (já definido no onDOMReady)
    this.updateNavigation();
    
    console.log('🧭 Navegação configurada para página:', this.currentPage);
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
   * 🔧 CORRIGIDO: Sincroniza desktop + mobile navigation
   */
  updateNavigation() {
    // Update desktop navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const page = link.dataset.page;
      if (page === this.currentPage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    
    // 🎯 Update mobile navigation
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    mobileNavItems.forEach(item => {
      const page = item.dataset.page;
      if (page === this.currentPage) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
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
    
    // CRITICAL FIX: Handle bible-admin page name inconsistency 
    let pageId;
    if (page === 'bible-admin') {
      pageId = 'bibleAdminPage'; // HTML usa camelCase
    } else if (page === 'bibleDisagreements') {
      pageId = 'bibleDisagreementsPage'; // HTML usa camelCase
    } else if (page === 'bible-explained') {
      pageId = 'bibleExplainedPage'; // HTML usa camelCase
    } else {
      pageId = `${page}Page`; // Outras páginas usam padrão normal
    }
    
    console.log(`🔍 DEBUG - Buscando página: ${page} → elemento: ${pageId}`);
    
    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      console.log(`✅ DEBUG - Página encontrada: ${pageId}`);
      targetPage.classList.add('active');
      this.initCurrentPage();
    } else {
      console.error(`❌ DEBUG - Página NÃO encontrada: ${pageId} para ${page}`);
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
      case 'bible-admin':
        this.initBibleAdminPage();
        break;
      case 'bibleDisagreements':
        this.initBibleDisagreementsPage();
        break;
      case 'bible-explained':
        this.initBibleExplainedPage();
        break;
      default:
        this.initHomePage();
    }
  }

  /**
   * Initialize home page
   */
  async initHomePage() {
    console.log('🏠 Inicializando página inicial com estilo TikTok');
    
    try {
      // Load video feed
      await this.loadVideoFeed();
      
      // Initialize TikTok-style interactions after videos are loaded
      setTimeout(() => {
        this.setupTikTokInteractions();
        console.log('🎬 Homepage TikTok inicializada!');
      }, 500); // Small delay to ensure DOM is ready
      
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
          // TikTok interactions will be setup in initHomePage with delay
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
  /**
   * Create TikTok-style video card HTML with auto-play video
   */
  createVideoCard(video) {
    // Get video URL with fallback
    const videoUrl = video.videoUrl 
      ? this.fixVideoUrl(video.videoUrl)
      : null;
      
    // Get avatar URL or fallback  
    const avatarUrl = video.User?.avatar 
      ? `${window.SantooAPI?.baseURL || 'http://localhost:3001'}${video.User.avatar}` 
      : 'assets/images/default-avatar.svg';
    
    return `
      <div class="video-card" data-video-id="${video.id}">
        <!-- TikTok-style video container -->
        <div class="video-thumbnail">
          ${videoUrl ? `
            <video 
              class="tiktok-video" 
              data-video-id="${video.id}"
              playsinline
              preload="metadata"
              poster="${video.thumbnailUrl ? `${window.SantooAPI?.baseURL || 'http://localhost:3001'}${video.thumbnailUrl}` : ''}"
            >
              <source src="${videoUrl}" type="video/mp4">
              Seu navegador não suporta reprodução de vídeo.
            </video>
          ` : `
            <div class="video-placeholder" style="width: 100%; height: 100%; background: #333; display: flex; align-items: center; justify-content: center; color: white;">
              <span>Vídeo não disponível</span>
            </div>
          `}
          
          <!-- Play/Pause overlay -->
          <div class="tiktok-play-overlay" data-video-id="${video.id}">
            <i data-lucide="play"></i>
          </div>
          
          <!-- Progress bar -->
          <div class="tiktok-progress">
            <div class="tiktok-progress-bar" data-video-id="${video.id}"></div>
          </div>
        </div>
        
        <!-- TikTok-style info overlay -->
        <div class="video-info">
          <div class="tiktok-info-container">
            <!-- Left side - Video details -->
            <div class="tiktok-video-details">
              <!-- Author info -->
              <div class="tiktok-author" onclick="event.stopPropagation(); window.viewProfile('${video.User?.username || ''}')">
                <img 
                  src="${avatarUrl}" 
                  alt="${SantooUtils.StringUtils.escapeHtml(video.User?.displayName || 'Usuário')}"
                  class="tiktok-avatar"
                  onerror="this.src='assets/images/default-avatar.svg'"
                >
                <span class="tiktok-username">@${SantooUtils.StringUtils.escapeHtml(video.User?.username || video.User?.displayName || 'usuario')}</span>
                ${video.User?.isVerified ? '<span style="color: #1da1f2; margin-left: 4px;">✓</span>' : ''}
              </div>
              
              <!-- Title and description -->
              <h3 class="tiktok-title">${SantooUtils.StringUtils.escapeHtml(video.title)}</h3>
              ${video.description ? `
                <p class="tiktok-description">${SantooUtils.StringUtils.escapeHtml(video.description).slice(0, 100)}${video.description.length > 100 ? '...' : ''}</p>
              ` : ''}
              
              <!-- Category tag -->
              ${video.Category ? `
                <div class="category-tag" style="display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-top: 8px;">
                  ${video.Category.icon || '📹'} ${video.Category.name}
                </div>
              ` : ''}
            </div>
            
            <!-- Right side - TikTok actions -->
            <div class="tiktok-actions">
              <!-- Like button -->
              <div class="tiktok-action-btn ${video.userLiked ? 'liked' : ''}" 
                   onclick="event.stopPropagation(); window.toggleTikTokLike('${video.id}')"
                   data-video-id="${video.id}">
                <i data-lucide="${video.userLiked ? 'heart' : 'heart'}" class="like-icon"></i>
                <div class="action-counter">${SantooUtils.NumberUtils.format(video.likesCount || 0)}</div>
              </div>
              
              <!-- Comment button -->
              <div class="tiktok-action-btn" onclick="event.stopPropagation(); window.showComments('${video.id}')">
                <i data-lucide="message-circle"></i>
                <div class="action-counter">${SantooUtils.NumberUtils.format(video.commentsCount || 0)}</div>
              </div>
              
              <!-- Share button -->
              <div class="tiktok-action-btn" onclick="event.stopPropagation(); window.shareVideo('${video.id}')">
                <i data-lucide="share"></i>
                <div class="action-counter">Share</div>
              </div>
              
              <!-- More options -->
              <div class="tiktok-action-btn" onclick="event.stopPropagation(); window.showVideoOptions('${video.id}')">
                <i data-lucide="more-horizontal"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Initialize upload page
   */
  async initUploadPage() {
    console.log('📤 Inicializando página de upload');
    
    // Load upload.js dynamically if not loaded
    if (!window.santooUpload) {
      try {
        await window.loadUpload();
        console.log('📦 Upload.js carregado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao carregar upload.js:', error);
      }
    }
    
    // Verify upload manager is available
    if (window.santooUpload) {
      console.log('✅ UploadManager disponível e pronto');
    } else {
      console.error('❌ UploadManager não encontrado');
    }
  }

  /**
   * Initialize profile page
   */
  initProfilePage() {
    console.log('👤 Inicializando página de perfil');
    this.updateProfileDisplay();
    
    // Load user videos if authenticated
    if (santooAuth.isAuthenticated()) {
      this.loadUserVideos();
    }
    
    // Setup tab switching for profile
    this.setupProfileTabs();
    
    // 🔧 [DEBUG FIX] Carregar sistema de hábitos espirituais
    console.log('📖 [DEBUG] Carregando sistema de hábitos espirituais...');
    if (window.loadSpiritualHabits) {
      window.loadSpiritualHabits().then(() => {
        console.log('✅ [DEBUG] Sistema de hábitos carregado, disparando eventos...');
        
        // Dispatch event to spiritual habits system for page change
        const pageEvent = new CustomEvent('pageChanged', {
          detail: { page: 'profile' }
        });
        document.dispatchEvent(pageEvent);
      }).catch(error => {
        console.error('❌ [DEBUG] Erro ao carregar hábitos espirituais:', error);
        
        // Dispatch event anyway
        const pageEvent = new CustomEvent('pageChanged', {
          detail: { page: 'profile' }
        });
        document.dispatchEvent(pageEvent);
      });
    } else {
      console.error('❌ [DEBUG] window.loadSpiritualHabits não encontrado!');
      
      // Dispatch event anyway
      const pageEvent = new CustomEvent('pageChanged', {
        detail: { page: 'profile' }
      });
      document.dispatchEvent(pageEvent);
    }
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
      
      // Hide auth prompt and show spiritual dashboard
      if (authPrompt) {
        authPrompt.style.display = 'none';
      }
      
      // Dispatch event to spiritual habits system
      const authEvent = new CustomEvent('authStateChanged', {
        detail: { 
          isAuthenticated: true, 
          user: this.user 
        }
      });
      document.dispatchEvent(authEvent);
      
    } else {
      // Show auth prompt for non-logged users
      console.log('👥 Usuário não logado - mostrando prompt de autenticação');
      
      if (authPrompt) {
        authPrompt.style.display = 'block';
      }
      
      // Hide spiritual dashboard
      const spiritualDashboard = document.getElementById('spiritualDashboard');
      if (spiritualDashboard) {
        spiritualDashboard.style.display = 'none';
      }
      
      // Dispatch event to spiritual habits system
      const authEvent = new CustomEvent('authStateChanged', {
        detail: { 
          isAuthenticated: false, 
          user: null 
        }
      });
      document.dispatchEvent(authEvent);
      
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
   * Sync this.user with window.santooAuth.user
   * CRITICAL for UI updates after login/register
   */
  syncUserFromAuthManager() {
    if (window.santooAuth) {
      const authUser = window.santooAuth.user;
      const isAuthenticated = window.santooAuth.isAuthenticated();
      
      if (isAuthenticated && authUser) {
        this.user = authUser;
        console.log('🔄 User sincronizado do SantooAuth:', this.user.displayName || this.user.username);
        
        // CRITICAL FIX: Recarregar conteúdo dependente de auth após login
        this.reloadAuthDependentContent();
      } else {
        this.user = null;
        console.log('🔄 User limpo (logout ou não autenticado)');
      }
    } else {
      console.warn('⚠️ SantooAuth não disponível para sincronização');
    }
  }

  /**
   * Recarrega todo conteúdo que depende do estado de autenticação
   * CRITICAL FIX: Garante que a UI seja completamente atualizada pós-login
   */
  reloadAuthDependentContent() {
    console.log('🔄 Recarregando conteúdo dependente de auth...');
    
    try {
      // 1. Atualizar visibilidade do Bible Admin link
      this.updateBibleAdminVisibility();
      
      // 2. Recarregar o feed de vídeos (pode mostrar conteúdo personalizado se logado)
      if (this.currentPage === 'home') {
        console.log('🏠 Recarregando feed da homepage...');
        this.loadVideoFeed();
      }
      
      // 3. Se estiver na página Bible Explained, recarregar posts
      if (this.currentPage === 'bible-explained') {
        console.log('📖 Recarregando posts da Bible Explained...');
        // Disparar evento para recarregar Bible Explained
        const event = new CustomEvent('authStateChanged', {
          detail: { 
            isAuthenticated: true, 
            user: this.user 
          }
        });
        document.dispatchEvent(event);
      }
      
      // 4. Atualizar página de perfil se estiver visualizando
      if (this.currentPage === 'profile') {
        console.log('👤 Atualizando página de perfil...');
        this.updateProfileDisplay();
      }
      
      // 5. Recarregar hábitos espirituais se disponível
      if (window.spiritualHabits && typeof window.spiritualHabits.loadUserData === 'function') {
        console.log('🙏 Recarregando hábitos espirituais...');
        window.spiritualHabits.loadUserData();
      }
      
      console.log('✅ Conteúdo dependente de auth recarregado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao recarregar conteúdo pós-login:', error);
    }
  }

  /**
   * Update profile submenu based on authentication state
   */
  updateProfileSubmenu() {
    const profileSubmenu = document.getElementById('profileSubmenu');
    if (!profileSubmenu) return;

    console.log('📋 Atualizando submenu do perfil. User:', !!this.user);
    
    // Update Bible Admin link visibility based on user role
    this.updateBibleAdminVisibility();

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
      if (window.santooAuth && typeof window.santooAuth.logout === 'function') {
        await window.santooAuth.logout();
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
    const modals = document.querySelectorAll('.modal');
    
    if (overlay) {
      // Remove active class
      overlay.classList.remove('active');
      
      // CRITICAL FIX: Remove any inline styles that might override CSS
      overlay.style.display = '';
      
      // Hide all modals
      modals.forEach(modal => {
        modal.style.display = 'none';
      });
      
      console.log('✅ Todos os modais fechados - overlay e estilos limpos');
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

  async handleFileSelect(file) {
    console.log('📁 Arquivo selecionado:', file.name);
    
    // Ensure upload.js is loaded
    if (!window.santooUpload) {
      console.log('🔄 Carregando upload.js...');
      try {
        await window.loadUpload();
      } catch (error) {
        console.error('❌ Erro ao carregar upload.js:', error);
        this.showError('Erro ao carregar sistema de upload');
        return;
      }
    }
    
    // Pass file to upload manager
    if (window.santooUpload && typeof window.santooUpload.handleFileSelect === 'function') {
      console.log('🔗 Delegando para UploadManager');
      window.santooUpload.handleFileSelect(file);
    } else {
      console.error('❌ UploadManager.handleFileSelect não encontrado');
      this.showError('Sistema de upload não disponível');
    }
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

  /**
   * Fix video URL to point to backend
   */
  fixVideoUrl(videoUrl) {
    if (!videoUrl) return '';
    
    if (videoUrl.startsWith('/uploads')) {
      return `http://localhost:3001${videoUrl}`;
    }
    
    return videoUrl;
  }

  isValidPage(page) {
    const validPages = ['home', 'discover', 'upload', 'live', 'profile', 'bible-explained', 'bible-admin', 'bibleDisagreements'];
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

  /**
   * Handle upload form submission
   */
  async handleUpload(form) {
    console.log('📤 Processando submissão do formulário de upload');
    
    // Ensure upload.js is loaded
    if (!window.santooUpload) {
      console.log('🔄 Carregando upload.js...');
      try {
        await window.loadUpload();
      } catch (error) {
        console.error('❌ Erro ao carregar upload.js:', error);
        this.showError('Erro ao carregar sistema de upload');
        return;
      }
    }
    
    // Pass form to upload manager
    if (window.santooUpload && typeof window.santooUpload.handleUpload === 'function') {
      console.log('🔗 Delegando submissão para UploadManager');
      const formData = new FormData(form);
      const result = await window.santooUpload.handleUpload(formData);
      
      if (result && result.success) {
        console.log('✅ Upload concluído com sucesso');
        // Refresh user videos in profile if it's the current page
        if (this.currentPage === 'profile') {
          this.loadUserVideos();
        }
      } else {
        console.error('❌ Falha no upload:', result?.error);
      }
    } else {
      console.error('❌ UploadManager.handleUpload não encontrado');
      this.showError('Sistema de upload não disponível');
    }
  }

  /**
   * Load user videos for profile page
   */
  async loadUserVideos() {
    console.log('🔧 DEBUG: loadUserVideos iniciado');
    const videosGrid = document.getElementById('userVideosGrid');
    const videosTabCount = document.getElementById('videosTabCount');
    
    console.log('🔧 DEBUG: videosGrid encontrado:', !!videosGrid, videosGrid);
    console.log('🔧 DEBUG: videosTabCount encontrado:', !!videosTabCount, videosTabCount);
    
    if (!videosGrid) {
      console.error('❌ DEBUG: userVideosGrid não encontrado no DOM!');
      return;
    }
    
    try {
      console.log('📹 Carregando vídeos do usuário...');
      
      // Show loading
      videosGrid.innerHTML = `
        <div class="videos-loading">
          <i data-lucide="loader"></i>
          <span>Carregando seus vídeos...</span>
        </div>
      `;
      
      // Get current user ID
      const user = santooAuth.getCurrentUser();
      if (!user) {
        videosGrid.innerHTML = '<p>Usuário não encontrado</p>';
        return;
      }
      
      // Fetch user videos
      console.log('🔍 Buscando vídeos para user ID:', user.id);
      const response = await window.SantooAPI.videos.getFeed({
        userId: user.id,
        limit: 20,
        sortBy: 'recent'
      });
      
      console.log('📡 Resposta da API:', response);
      const videos = response?.videos || [];
      console.log('🎬 Vídeos encontrados:', videos.length, videos);
      
      // Update tab count
      if (videosTabCount) {
        videosTabCount.textContent = videos.length;
      }
      
      if (videos.length === 0) {
        videosGrid.innerHTML = `
          <div class="empty-videos">
            <div class="empty-content">
              <i data-lucide="video" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
              <h4>Nenhum vídeo ainda</h4>
              <p>Você ainda não publicou nenhum vídeo. Que tal criar seu primeiro?</p>
              <button class="btn btn-primary" onclick="santooApp.navigateTo('upload')">
                <i data-lucide="plus-circle"></i>
                Publicar Vídeo
              </button>
            </div>
          </div>
        `;
        return;
      }
      
      // Generate videos grid
      console.log('🔧 DEBUG: Gerando HTML para', videos.length, 'vídeos');
      const videosHTML = videos.map(video => {
        console.log('🔧 DEBUG: Processando vídeo:', video.title, 'URL:', video.videoUrl);
        return `
          <div class="user-video-card" data-video-id="${video.id}" style="background-color: #2a2d3a; border-radius: 12px; overflow: hidden; cursor: pointer; min-height: 350px !important; height: auto !important; display: block !important;">
            <div class="video-thumbnail" style="position: relative; width: 100%; height: 200px !important; background-color: #1a1d26; overflow: hidden;">
              <div class="video-preview" style="width: 100%; height: 200px; background: linear-gradient(45deg, #1a1a2e, #16213e); display: flex; align-items: center; justify-content: center; border-radius: 8px; position: relative;">
                <i data-lucide="play-circle" style="width: 48px; height: 48px; color: rgba(255,255,255,0.8);"></i>
                <video style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; border-radius: 8px; opacity: 0.8;" preload="metadata">
                  <source src="${this.fixVideoUrl(video.videoUrl)}#t=1" type="video/mp4">
                </video>
              </div>
              <div class="video-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to bottom, transparent 0%, transparent 60%, rgba(0,0,0,0.8) 100%); display: flex; align-items: flex-end; padding: 12px;">
                <div class="video-stats" style="display: flex; align-items: center; gap: 16px; color: white; font-size: 14px; font-weight: 500;">
                  <span style="display: flex; align-items: center; gap: 4px;"><i data-lucide="eye" style="width: 16px; height: 16px;"></i> ${this.formatNumber(video.viewsCount || 0)}</span>
                  <span style="display: flex; align-items: center; gap: 4px;"><i data-lucide="heart" style="width: 16px; height: 16px;"></i> ${this.formatNumber(video.likesCount || 0)}</span>
                </div>
              </div>
            </div>
            <div class="video-info" style="padding: 16px;">
              <h5 class="video-title" style="font-size: 18px; font-weight: 600; color: #e2e8f0; margin: 0 0 8px 0; line-height: 1.4;">${video.title}</h5>
              <p class="video-date" style="color: #94a3b8; font-size: 14px; margin-bottom: 12px;">${new Date(video.createdAt).toLocaleDateString('pt-BR')}</p>
              <div class="video-actions" style="display: flex; gap: 8px; margin-top: 12px;">
                <button class="btn-small" onclick="santooApp.editVideo('${video.id}')" style="padding: 8px 12px; font-size: 14px; border-radius: 6px; border: 1px solid #475569; background-color: #1e293b; color: #e2e8f0; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                  <i data-lucide="edit" style="width: 16px; height: 16px;"></i> Editar
                </button>
                <button class="btn-small btn-danger" onclick="santooApp.deleteVideo('${video.id}')" style="padding: 8px 12px; font-size: 14px; border-radius: 6px; border: 1px solid #ef4444; color: #ef4444; background-color: #1e293b; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                  <i data-lucide="trash" style="width: 16px; height: 16px;"></i> Excluir
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
      
      console.log('🔧 DEBUG: HTML gerado:', videosHTML.length, 'caracteres');
      console.log('🔧 DEBUG: videosGrid elemento:', videosGrid, 'classes:', videosGrid?.className);
      
      // Force grid styling inline
      videosGrid.style.cssText = `
        display: grid !important;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important;
        gap: 24px !important;
        margin-top: 24px !important;
        min-height: 400px !important;
        width: 100% !important;
        padding: 20px 0 !important;
      `;
      
      videosGrid.innerHTML = videosHTML;
      
      console.log('🔧 DEBUG: HTML inserido. Conteúdo atual:', videosGrid.innerHTML.length, 'caracteres');
      console.log('🔧 DEBUG: Primeiros 200 caracteres:', videosGrid.innerHTML.substring(0, 200));
      
      // Check visibility immediately
      const videosSection = document.getElementById('videosSection');
      console.log('🔧 DEBUG: videosSection encontrada:', !!videosSection, videosSection?.className);
      console.log('🔧 DEBUG: videosSection display:', getComputedStyle(videosSection).display);
      console.log('🔧 DEBUG: videosGrid está visível:', videosGrid.offsetHeight > 0, 'height:', videosGrid.offsetHeight);
      console.log('🔧 DEBUG: videosGrid estilo display:', getComputedStyle(videosGrid).display);
      console.log('🔧 DEBUG: videosGrid parent:', videosGrid.parentElement?.id, videosGrid.parentElement?.className);
      
      // Re-initialize Lucide icons in the new content
      if (window.lucide) {
        window.lucide.createIcons();
      }
      
      // Check again after DOM settles
      setTimeout(() => {
        console.log('🔧 DEBUG DELAYED: videosGrid height após timeout:', videosGrid.offsetHeight);
        console.log('🔧 DEBUG DELAYED: videosSection display:', getComputedStyle(videosSection).display);
        console.log('🔧 DEBUG DELAYED: videosGrid computed style:', {
          display: getComputedStyle(videosGrid).display,
          visibility: getComputedStyle(videosGrid).visibility,
          opacity: getComputedStyle(videosGrid).opacity,
          height: getComputedStyle(videosGrid).height,
          minHeight: getComputedStyle(videosGrid).minHeight
        });
        
        // Check if videos section is actually visible
        const profilePage = document.getElementById('profilePage');
        const profileContent = document.querySelector('.profile-content');
        console.log('🔧 DEBUG DELAYED: profilePage display:', profilePage ? getComputedStyle(profilePage).display : 'not found');
        console.log('🔧 DEBUG DELAYED: profile-content display:', profileContent ? getComputedStyle(profileContent).display : 'not found');
        
        // Force visibility if needed
        if (videosGrid.offsetHeight === 0) {
          console.log('🚨 FORÇANDO VISIBILIDADE - height ainda é 0!');
          videosSection.style.display = 'block';
          videosSection.style.visibility = 'visible';
          videosGrid.style.visibility = 'visible';
          videosGrid.style.opacity = '1';
          
          // Force re-flow
          void videosGrid.offsetHeight;
          
          console.log('🔧 APÓS FORÇA: videosGrid height:', videosGrid.offsetHeight);
        }
      }, 100);
      
      console.log(`✅ Carregados ${videos.length} vídeos do usuário`);
      
    } catch (error) {
      console.error('❌ Erro ao carregar vídeos do usuário:', error);
      videosGrid.innerHTML = `
        <div class="error-videos">
          <p>Erro ao carregar vídeos. Tente novamente.</p>
          <button class="btn btn-secondary" onclick="santooApp.loadUserVideos()">
            <i data-lucide="refresh-cw"></i> Tentar novamente
          </button>
        </div>
      `;
    }
  }

  /**
   * Setup profile tabs functionality
   */
  setupProfileTabs() {
    const tabs = document.querySelectorAll('.spiritual-tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');
        
        // Remove active class from all tabs and contents
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        const targetContent = document.getElementById(`${targetTab}Section`);
        if (targetContent) {
          targetContent.classList.add('active');
        }
        
        console.log(`📑 Aba ativada: ${targetTab}`);
      });
    });
    
    console.log('📑 Tabs de perfil configuradas');
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
    const videoUrl = this.fixVideoUrl(video.videoUrl);
    
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

  initBibleAdminPage() {
    console.log('📖 Inicializando página de administração da Bíblia');
    
    // CRITICAL FIX: Sync user from AuthManager before checking permissions
    this.syncUserFromAuthManager();
    console.log('🔍 DEBUG - this.user após sync:', this.user?.displayName, 'role:', this.user?.role);
    
    // Check permissions
    if (!this.canAccessBibleAdmin()) {
      console.log('❌ DEBUG - canAccessBibleAdmin() returned false. User:', this.user, 'Role:', this.user?.role);
      this.showNotification('Acesso negado. Apenas administradores e pastores podem acessar esta área.', 'error');
      this.navigateTo('home');
      return;
    }
    
    console.log('✅ DEBUG - Acesso permitido para usuário:', this.user.displayName, 'role:', this.user.role);
    
    // Load Bible Admin script if not loaded yet
    if (typeof window.loadBibleAdmin === 'function' && !window.bibleAdmin) {
      console.log('🔄 Carregando bible-admin.js...');
      window.loadBibleAdmin().then(() => {
        console.log('✅ Bible Admin carregado com sucesso!');
        if (window.bibleAdmin) {
          window.bibleAdmin.updateStats();
          window.bibleAdmin.loadPosts();
        }
      }).catch(error => {
        console.error('❌ Erro ao carregar bible-admin.js:', error);
      });
    } else if (window.bibleAdmin) {
      // Initialize Bible Admin Manager if already available
      window.bibleAdmin.updateStats();
      window.bibleAdmin.loadPosts();
    }
  }

  initBibleDisagreementsPage() {
    console.log('💬 Inicializando página de moderação de discordâncias');
    
    // CRITICAL FIX: Sync user from AuthManager before checking permissions
    this.syncUserFromAuthManager();
    console.log('🔍 DEBUG - this.user após sync (disagreements):', this.user?.displayName, 'role:', this.user?.role);
    
    // Check permissions
    if (!this.canAccessBibleAdmin()) {
      console.log('❌ DEBUG - canAccessBibleAdmin() returned false (disagreements). User:', this.user, 'Role:', this.user?.role);
      this.showNotification('Acesso negado. Apenas administradores e pastores podem moderar discordâncias.', 'error');
      this.navigateTo('home');
      return;
    }
    
    console.log('✅ DEBUG - Acesso permitido para discordâncias:', this.user.displayName, 'role:', this.user.role);
    
    // Initialize Bible Admin Manager if available
    if (window.bibleAdmin) {
      window.bibleAdmin.loadDisagreements();
    }
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

  /**
   * Update Bible Admin link visibility based on user permissions
   */
  updateBibleAdminVisibility() {
    const bibleAdminLink = document.getElementById('bibleAdminLink');
    if (!bibleAdminLink) return;

    // Show Bible Admin link only for admin and pastor users
    if (this.user && (this.user.role === 'admin' || this.user.role === 'pastor')) {
      bibleAdminLink.style.display = 'flex';
      console.log('📖 Bible Admin link mostrado para usuário:', this.user.role);
    } else {
      bibleAdminLink.style.display = 'none';
      console.log('📖 Bible Admin link ocultado (usuário não é admin/pastor)');
    }
  }

  /**
   * Check if user can access Bible admin features
   */
  canAccessBibleAdmin() {
    return this.user && (this.user.role === 'admin' || this.user.role === 'pastor');
  }

  /**
   * Show Bible Admin page
   */
  showBibleAdmin() {
    if (!this.canAccessBibleAdmin()) {
      this.showNotification('Acesso negado. Apenas administradores e pastores podem acessar esta área.', 'error');
      return;
    }

    this.navigateTo('bible-admin');
  }

  /**
   * Show Bible Disagreements page  
   */
  showBibleDisagreements() {
    if (!this.canAccessBibleAdmin()) {
      this.showNotification('Acesso negado. Apenas administradores e pastores podem moderar discordâncias.', 'error');
      return;
    }

    this.navigateTo('bibleDisagreements');
  }

  /**
   * Initialize Bible Explained public page
   */
  initBibleExplainedPage() {
    console.log('📖 Inicializando página Bible Explained pública...');
    
    try {
      // 🔧 CORRIGIDO: Carregar bible-explained.js primeiro
      if (typeof window.loadBibleExplained === 'function') {
        window.loadBibleExplained().then(() => {
          console.log('✅ bible-explained.js carregado com sucesso!');
          // Dispatch event to initialize BibleExplainedManager
          const event = new CustomEvent('pageChanged', {
            detail: { page: 'bible-explained' }
          });
          document.dispatchEvent(event);
        }).catch(error => {
          console.error('❌ Erro ao carregar bible-explained.js:', error);
        });
      } else {
        console.error('❌ Função loadBibleExplained não encontrada!');
      }
      
    } catch (error) {
      console.error('❌ Erro ao inicializar página Bible Explained:', error);
    }
  }

  // === TIKTOK FUNCTIONALITY ===

  /**
   * Setup TikTok-style video interactions
   */
  setupTikTokInteractions() {
    console.log('🎬 Configurando interações TikTok...');
    
    // Setup Intersection Observer for auto-play
    this.setupVideoAutoPlay();
    
    // Setup video controls
    this.setupVideoControls();
    
    // Setup scroll snap navigation
    this.setupScrollNavigation();
    
    console.log('✅ Interações TikTok configuradas');
  }

  /**
   * Setup auto-play when video enters viewport
   */
  setupVideoAutoPlay() {
    const observerOptions = {
      root: null,
      threshold: 0.6, // 60% of video must be visible
      rootMargin: '0px 0px -10% 0px'
    };

    this.videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target.querySelector('.tiktok-video');
        const videoCard = entry.target;
        const playOverlay = videoCard.querySelector('.tiktok-play-overlay');
        
        if (video) {
          if (entry.isIntersecting) {
            // Auto-play video when in view
            this.playTikTokVideo(video, videoCard);
          } else {
            // Pause video when out of view
            this.pauseTikTokVideo(video, videoCard);
          }
        }
      });
    }, observerOptions);

    // Observe all video cards
    document.querySelectorAll('.video-card').forEach(card => {
      this.videoObserver.observe(card);
    });
  }

  /**
   * Play TikTok video with smooth handling
   */
  async playTikTokVideo(video, videoCard) {
    if (!video || video.paused === false) return;
    
    try {
      // Pause all other videos first
      this.pauseAllVideos(video);
      
      // Ensure video volume is on
      video.volume = 1.0;
      video.muted = false;
      
      await video.play();
      videoCard.classList.remove('paused');
      
      // Start progress tracking
      this.startProgressTracking(video);
      
      // Setup auto-advance to next video when current ends
      this.setupVideoAutoAdvance(video);
      
      console.log('▶️ TikTok video playing com som:', video.dataset.videoId);
    } catch (error) {
      console.warn('Autoplay pode estar bloqueado, tentando com mudo:', error);
      
      // Fallback: Try with muted if autoplay fails
      try {
        video.muted = true;
        await video.play();
        videoCard.classList.remove('paused');
        this.startProgressTracking(video);
        this.setupVideoAutoAdvance(video);
        
        console.log('▶️ TikTok video playing (mudo):', video.dataset.videoId);
        
        // Show professional sound notification
        this.showSoundNotification();
        
      } catch (mutedError) {
        console.error('Erro ao reproduzir vídeo:', mutedError);
        videoCard.classList.add('paused');
      }
    }
  }

  /**
   * Pause TikTok video
   */
  pauseTikTokVideo(video, videoCard) {
    if (!video || video.paused === true) return;
    
    video.pause();
    videoCard.classList.add('paused');
    
    // Stop progress tracking
    this.stopProgressTracking(video);
    
    console.log('⏸️ TikTok video paused:', video.dataset.videoId);
  }

  /**
   * Pause all videos except the current one
   */
  pauseAllVideos(currentVideo) {
    document.querySelectorAll('.tiktok-video').forEach(video => {
      if (video !== currentVideo && !video.paused) {
        const videoCard = video.closest('.video-card');
        this.pauseTikTokVideo(video, videoCard);
      }
    });
  }

  /**
   * Setup video controls (play/pause, progress)
   */
  setupVideoControls() {
    // Play/pause on video click or overlay click
    document.addEventListener('click', (e) => {
      const videoCard = e.target.closest('.video-card');
      const playOverlay = e.target.closest('.tiktok-play-overlay');
      
      if (videoCard && (e.target.classList.contains('tiktok-video') || playOverlay)) {
        e.preventDefault();
        e.stopPropagation();
        
        const video = videoCard.querySelector('.tiktok-video');
        if (video) {
          this.toggleTikTokVideo(video, videoCard);
        }
      }
    });
  }

  /**
   * Toggle video play/pause
   */
  toggleTikTokVideo(video, videoCard) {
    if (video.paused) {
      this.playTikTokVideo(video, videoCard);
    } else {
      this.pauseTikTokVideo(video, videoCard);
    }
    
    // If video is muted, unmute it on user interaction
    if (video.muted) {
      video.muted = false;
      video.volume = 1.0;
      console.log('🔊 Som ativado por interação do usuário');
    }
  }

  /**
   * Start progress bar tracking
   */
  startProgressTracking(video) {
    const progressBar = document.querySelector(`.tiktok-progress-bar[data-video-id="${video.dataset.videoId}"]`);
    if (!progressBar) return;

    const updateProgress = () => {
      if (!video.paused && video.duration) {
        const progress = (video.currentTime / video.duration) * 100;
        progressBar.style.width = `${progress}%`;
        
        // Continue tracking
        this.progressInterval = requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
  }

  /**
   * Stop progress bar tracking
   */
  stopProgressTracking(video) {
    if (this.progressInterval) {
      cancelAnimationFrame(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * Setup keyboard navigation for TikTok-style scrolling
   */
  setupScrollNavigation() {
    document.addEventListener('keydown', (e) => {
      if (this.currentPage !== 'home') return;
      
      switch (e.key) {
        case 'ArrowDown':
        case ' ': // Spacebar
          e.preventDefault();
          this.scrollToNextVideo();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.scrollToPrevVideo();
          break;
        case 'k':
        case 'K':
          e.preventDefault();
          this.toggleCurrentVideo();
          break;
      }
    });
  }

  /**
   * Scroll to next video (legacy - now handled by enhanced version below)
   */

  /**
   * Scroll to previous video
   */
  scrollToPrevVideo() {
    const currentVideo = this.getCurrentVisibleVideo();
    if (currentVideo) {
      const prevVideo = currentVideo.previousElementSibling;
      if (prevVideo && prevVideo.classList.contains('video-card')) {
        prevVideo.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  /**
   * Get currently visible video card
   */
  getCurrentVisibleVideo() {
    const videoCards = document.querySelectorAll('.video-card');
    const viewportHeight = window.innerHeight;
    
    for (let card of videoCards) {
      const rect = card.getBoundingClientRect();
      if (rect.top >= 0 && rect.top < viewportHeight * 0.5) {
        return card;
      }
    }
    
    return videoCards[0]; // Fallback to first video
  }

  /**
   * Toggle current visible video
   */
  toggleCurrentVideo() {
    const currentCard = this.getCurrentVisibleVideo();
    if (currentCard) {
      const video = currentCard.querySelector('.tiktok-video');
      if (video) {
        this.toggleTikTokVideo(video, currentCard);
      }
    }
  }

  /**
   * Override setupVideoInteractions to use TikTok style
   */
  setupVideoInteractions() {
    console.log('🎬 Configurando interações TikTok...');
    
    // Setup TikTok interactions instead of old modal system
    this.setupTikTokInteractions();
    
    // Global TikTok functions
    this.setupTikTokGlobalFunctions();
  }

  /**
   * Setup global TikTok functions
   */
  setupTikTokGlobalFunctions() {
    const self = this;

    // TikTok-style like toggle
    window.toggleTikTokLike = async (videoId) => {
      if (!santooAuth.isAuthenticated()) {
        if (typeof showLoginModal === 'function') {
          showLoginModal();
        }
        return;
      }

      try {
        const likeButton = document.querySelector(`.tiktok-action-btn[data-video-id="${videoId}"]`);
        if (!likeButton) return;

        const likeIcon = likeButton.querySelector('.like-icon');
        const likeCounter = likeButton.querySelector('.action-counter');
        const isCurrentlyLiked = likeButton.classList.contains('liked');

        // Optimistic update
        likeButton.classList.toggle('liked');
        
        // Update icon style (filled vs outline)
        if (isCurrentlyLiked) {
          likeButton.classList.remove('liked');
        } else {
          likeButton.classList.add('liked');
        }

        // Call API
        const response = await window.SantooAPI.videos.toggleLike(videoId);
        
        if (response && response.success) {
          likeCounter.textContent = SantooUtils.NumberUtils.format(response.likes || 0);
          console.log('💖 TikTok like updated:', response.message);
        }
      } catch (error) {
        console.error('❌ Erro ao curtir vídeo TikTok:', error);
        
        // Revert optimistic update on error
        const likeButton = document.querySelector(`.tiktok-action-btn[data-video-id="${videoId}"]`);
        if (likeButton) {
          likeButton.classList.toggle('liked');
        }
      }
    };

    // Show comments (placeholder)
    window.showComments = (videoId) => {
      console.log('💬 Mostrar comentários TikTok:', videoId);
      // TODO: Implement TikTok-style comments drawer
      this.showNotification('Comentários em breve!', 'info');
    };

    // Share video (placeholder)
    window.shareVideo = async (videoId) => {
      console.log('📤 Compartilhar vídeo TikTok:', videoId);
      
      try {
        if (navigator.share) {
          // Use native sharing if available
          await navigator.share({
            title: 'Vídeo do Santoo',
            text: 'Confira este vídeo incrível no Santoo!',
            url: `${window.location.origin}#home?video=${videoId}`
          });
        } else {
          // Fallback to clipboard
          await navigator.clipboard.writeText(`${window.location.origin}#home?video=${videoId}`);
          this.showNotification('Link copiado para a área de transferência!', 'success');
        }
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
        this.showNotification('Erro ao compartilhar vídeo', 'error');
      }
    };

    // Video options (placeholder)  
    window.showVideoOptions = (videoId) => {
      console.log('⚙️ Opções do vídeo TikTok:', videoId);
      // TODO: Implement options menu (report, not interested, etc.)
      this.showNotification('Opções em breve!', 'info');
    };
  }

  /**
   * Setup auto-advance to next video when current video ends
   */
  setupVideoAutoAdvance(video) {
    // Remove previous event listener if exists
    if (video._autoAdvanceHandler) {
      video.removeEventListener('ended', video._autoAdvanceHandler);
    }
    
    // Create new event handler
    video._autoAdvanceHandler = () => {
      console.log('🔄 Vídeo terminou, avançando para o próximo...');
      
      // Small delay before advancing (like TikTok)
      setTimeout(() => {
        this.scrollToNextVideo();
      }, 500);
    };
    
    // Add event listener for when video ends
    video.addEventListener('ended', video._autoAdvanceHandler);
  }

  /**
   * Enhanced scroll to next video with auto-play
   */
  scrollToNextVideo() {
    const videoFeed = document.getElementById('videoFeed');
    if (!videoFeed) return;

    const currentVideo = this.getCurrentVisibleVideo();
    if (currentVideo) {
      const nextVideo = currentVideo.nextElementSibling;
      if (nextVideo && nextVideo.classList.contains('video-card')) {
        // Scroll to next video
        nextVideo.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Auto-play next video after scroll completes
        setTimeout(() => {
          const nextVideoElement = nextVideo.querySelector('.tiktok-video');
          if (nextVideoElement) {
            this.playTikTokVideo(nextVideoElement, nextVideo);
          }
        }, 800); // Wait for scroll animation to complete
        
        console.log('📱 Avançando para próximo vídeo');
      } else {
        console.log('🔚 Último vídeo do feed alcançado');
        // Could implement infinite scroll here
        this.showNotification('Fim dos vídeos! 🎬', 'info');
      }
    }
  }

  /**
   * Professional notification system
   */
  showNotification(message, type = 'info', options = {}) {
    console.log(`🔔 ${type.toUpperCase()}: ${message}`);
    
    // Ensure toast container exists
    this.ensureToastContainer();
    
    // Create professional toast
    const toast = this.createProfessionalToast(message, type, options);
    
    // Add to container
    const container = document.querySelector('.toast-container');
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.animation = 'toastSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    }, 50);
    
    // Auto remove after duration
    const duration = options.duration || (type === 'error' ? 5000 : 4000);
    setTimeout(() => {
      this.removeToast(toast);
    }, duration);
    
    return toast;
  }

  /**
   * Special sound notification with enhanced design
   */
  showSoundNotification() {
    const soundToast = this.showNotification(
      'Toque no vídeo para ativar o som',
      'sound-notification',
      {
        title: 'Som Desabilitado',
        icon: '<i data-lucide="volume-2"></i>',
        duration: 5000,
        dismissible: true
      }
    );
    
    // Add special pulsing effect
    soundToast.classList.add('sound-notification');
    
    // Initialize Lucide icon
    setTimeout(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    }, 100);
    
    return soundToast;
  }

  /**
   * Ensure toast container exists
   */
  ensureToastContainer() {
    if (!document.querySelector('.toast-container')) {
      const container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
  }

  /**
   * Create professional toast element
   */
  createProfessionalToast(message, type, options = {}) {
    const toast = document.createElement('div');
    toast.className = `santoo-toast ${type}`;
    
    const { title, icon, dismissible = true } = options;
    
    toast.innerHTML = `
      ${icon ? `<div class="toast-icon">${icon}</div>` : ''}
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      ${dismissible ? `
        <button class="toast-close" onclick="event.preventDefault(); this.parentElement.parentElement.removeChild(this.parentElement);">
          ×
        </button>
      ` : ''}
      <div class="toast-progress">
        <div class="toast-progress-bar"></div>
      </div>
    `;
    
    // Add click to dismiss
    if (dismissible) {
      toast.addEventListener('click', () => {
        this.removeToast(toast);
      });
    }
    
    return toast;
  }

  /**
   * Remove toast with animation
   */
  removeToast(toast) {
    if (!toast || !toast.parentElement) return;
    
    toast.style.animation = 'toastSlideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 300);
  }
}

// Initialize app when script loads
const santooApp = new SantooApp();

// Make app globally accessible for debugging
window.santooApp = santooApp;