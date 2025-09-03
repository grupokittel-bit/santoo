/**
 * SANTOO - Authentication Module  
 * Handles user authentication, registration, and session management
 * INTEGRADO COM API REAL
 */

class AuthManager {
  constructor() {
    this.user = null;
    this.token = null;
    
    this.init();
  }

  /**
   * Initialize authentication manager
   */
  init() {
    this.loadStoredAuth();
    console.log('🔐 Auth Manager inicializado com API real');
  }

  /**
   * Load authentication data from storage
   */
  loadStoredAuth() {
    try {
      const storedUser = SantooUtils.StorageUtils.get('santoo_user');
      const storedToken = SantooUtils.StorageUtils.get('santoo_token');

      if (storedUser && storedToken) {
        this.user = storedUser;
        this.token = storedToken;
        
        // Validate token by testing API
        this.validateStoredAuth();
      }
    } catch (error) {
      console.error('Erro ao carregar autenticação:', error);
      this.clearStoredAuth();
    }
  }

  /**
   * Validate stored authentication with API
   */
  async validateStoredAuth() {
    try {
      // Test if token is still valid by getting current user
      const response = await SantooAPI.users.getMe();
      
      if (response && response.user) {
        this.user = response.user;
        console.log('✅ Sessão restaurada para:', this.user.displayName);
        this.notifyAuthChange('restored');
      }
    } catch (error) {
      console.log('🔄 Token expirado, fazendo logout...');
      this.logout();
    }
  }

  /**
   * Login user with identifier and password
   */
  async login(identifier, password) {
    try {
      console.log('🔐 Tentando fazer login...', identifier);
      
      const response = await SantooAPI.auth.login({
        identifier, // username ou email
        password
      });

      if (response && response.user && response.token) {
        this.user = response.user;
        this.token = response.token;
        
        this.notifyAuthChange('login');
        
        console.log('✅ Login realizado com sucesso:', this.user.displayName);
        return { success: true, user: this.user, message: response.message };
      } else {
        throw new Error(response.error || 'Erro no login');
      }
      
    } catch (error) {
      console.error('❌ Erro no login:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Register new user
   */
  async register(userData) {
    try {
      console.log('📝 Tentando registrar usuário...', userData.email);
      
      // Validate input locally first
      const validation = this.validateRegistrationData(userData);
      if (!validation.valid) {
        return { success: false, error: validation.message };
      }
      
      const response = await SantooAPI.auth.register({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        bio: userData.bio || ''
      });

      if (response && response.user && response.token) {
        this.user = response.user;
        this.token = response.token;
        
        this.notifyAuthChange('register');
        
        console.log('✅ Registro realizado com sucesso:', this.user.displayName);
        return { success: true, user: this.user, message: response.message };
      } else {
        throw new Error(response.error || 'Erro no registro');
      }
      
    } catch (error) {
      console.error('❌ Erro no registro:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Logout current user
   */
  async logout() {
    try {
      console.log('🔓 Fazendo logout...');
      
      // Call API logout to invalidate token server-side
      await SantooAPI.auth.logout();
      
      // Clear local state
      this.user = null;
      this.token = null;
      
      this.notifyAuthChange('logout');
      
      console.log('✅ Logout realizado com sucesso');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      
      // Clear local state anyway
      this.user = null;
      this.token = null;
      this.notifyAuthChange('logout');
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates) {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      console.log('👤 Atualizando perfil...', Object.keys(updates));
      
      // Se updates contém arquivo, usa FormData
      let formData;
      if (updates.image) {
        formData = new FormData();
        Object.entries(updates).forEach(([key, value]) => {
          formData.append(key, value);
        });
      } else {
        formData = updates;
      }
      
      const response = await SantooAPI.users.updateProfile(formData);
      
      if (response && response.user) {
        this.user = response.user;
        // Atualiza localStorage também
        SantooUtils.StorageUtils.set('santoo_user', this.user);
        
        this.notifyAuthChange('profileUpdate');
        
        console.log('✅ Perfil atualizado com sucesso');
        return { success: true, user: this.user, message: response.message };
      } else {
        throw new Error(response.error || 'Erro ao atualizar perfil');
      }
      
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Follow/unfollow user
   */
  async toggleFollow(userId) {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      const response = await SantooAPI.users.toggleFollow(userId);
      
      console.log('👥 Toggle follow:', response.message);
      return { 
        success: true, 
        following: response.following, 
        message: response.message 
      };
      
    } catch (error) {
      console.error('❌ Erro ao seguir usuário:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user feed (videos from followed users)
   */
  async getUserFeed(params = {}) {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      const response = await SantooAPI.users.getFeed(params);
      
      return { success: true, ...response };
      
    } catch (error) {
      console.error('❌ Erro ao carregar feed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword, newPassword) {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      console.log('🔒 Alterando senha...');
      
      // Validate new password locally
      const validation = SantooUtils.ValidationUtils.password(newPassword);
      if (!validation.valid) {
        return { success: false, error: validation.message };
      }
      
      // TODO: Implement password change API when available
      await SantooUtils.sleep(1000); // Temporary delay
      
      console.log('✅ Senha alterada com sucesso (simulado)');
      return { success: true, message: 'Senha alterada com sucesso' };
      
    } catch (error) {
      console.error('❌ Erro ao alterar senha:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    try {
      console.log('📧 Solicitando reset de senha para:', email);
      
      // Validate email
      if (!SantooUtils.ValidationUtils.email(email)) {
        return { success: false, error: 'Email inválido' };
      }
      
      // TODO: Implement password reset API when available
      await SantooUtils.sleep(1000); // Temporary delay
      
      return { 
        success: true, 
        message: 'Se esse email existir, você receberá instruções de recuperação' 
      };
      
    } catch (error) {
      console.error('❌ Erro ao solicitar reset:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!(this.user && this.token);
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Get authentication token
   */
  getToken() {
    return this.token;
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader() {
    return this.token ? `Bearer ${this.token}` : null;
  }

  /**
   * Validate registration data
   */
  validateRegistrationData(data) {
    // Validate username
    if (!data.username || data.username.length < 3) {
      return { valid: false, message: 'Nome de usuário deve ter pelo menos 3 caracteres' };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
      return { valid: false, message: 'Nome de usuário deve conter apenas letras, números e underscore' };
    }

    // Validate display name
    const nameValidation = SantooUtils.ValidationUtils.username(data.displayName);
    if (!nameValidation.valid) {
      return nameValidation;
    }

    // Validate email
    if (!SantooUtils.ValidationUtils.email(data.email)) {
      return { valid: false, message: 'Email inválido' };
    }

    // Validate password
    const passwordValidation = SantooUtils.ValidationUtils.password(data.password);
    if (!passwordValidation.valid) {
      return passwordValidation;
    }

    return { valid: true };
  }

  /**
   * Notify application of authentication changes
   */
  notifyAuthChange(event) {
    console.log('📢 Auth Event:', event, this.isAuthenticated() ? this.user?.displayName : 'sem usuário');
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('santooAuthChange', {
      detail: { 
        event, 
        user: this.user, 
        isAuthenticated: this.isAuthenticated() 
      }
    }));
    
    // Update app UI if available
    if (window.santooApp && typeof window.santooApp.updateUserUI === 'function') {
      window.santooApp.updateUserUI();
    }

    // Update video components if available
    if (window.VideoComponents && typeof window.VideoComponents.updateAuthState === 'function') {
      window.VideoComponents.updateAuthState(this.isAuthenticated(), this.user);
    }
  }

  /**
   * Clear stored authentication data
   */
  clearStoredAuth() {
    SantooUtils.StorageUtils.remove('santoo_user');
    SantooUtils.StorageUtils.remove('santoo_token');
  }
}

// === AUTH UI HELPERS ===

/**
 * Show login modal
 */
function showLoginModal() {
  const modal = document.getElementById('authModal');
  const modalTitle = document.getElementById('authModalTitle');
  const modalBody = modal.querySelector('.modal-body');
  
  modalTitle.textContent = 'Bem-vindo de volta!';
  modalBody.innerHTML = `
    <!-- Professional Auth Prompt Header -->
    <div class="auth-modal-header">
      <div class="auth-prompt-header">
        <i class="auth-prompt-icon" data-lucide="log-in"></i>
        <h3>Entrar</h3>
      </div>
      <p class="auth-prompt-description">
        Entre na sua conta para continuar sua jornada de fé no Santoo.
      </p>
    </div>

    <!-- Professional Form -->
    <form id="loginForm" class="auth-form professional-form">
      <div class="form-group">
        <label for="loginIdentifier" class="form-label">
          <i class="label-icon" data-lucide="at-sign"></i>
          Email ou Nome de Usuário
        </label>
        <input 
          type="text" 
          id="loginIdentifier" 
          name="identifier"
          class="form-input"
          placeholder="Digite seu email ou @usuario"
          required
          autocomplete="username"
        >
      </div>
      
      <div class="form-group">
        <label for="loginPassword" class="form-label">
          <i class="label-icon" data-lucide="lock"></i>
          Senha
        </label>
        <input 
          type="password" 
          id="loginPassword" 
          name="password"
          class="form-input"
          placeholder="Digite sua senha"
          required
          autocomplete="current-password"
        >
      </div>
      
      <!-- Professional Action Buttons -->
      <div class="auth-modal-actions">
        <button type="submit" class="nav-link active professional-btn" id="loginSubmitBtn">
          <i class="nav-icon" data-lucide="log-in"></i>
          <span class="nav-text">Entrar</span>
          <span class="btn-loading" style="display: none;">
            <i class="loading-icon" data-lucide="loader-2"></i>
            Entrando...
          </span>
        </button>
      </div>
      
      <!-- Professional Footer -->
      <div class="form-footer auth-footer">
        <p>Não tem conta? 
          <button type="button" class="nav-link link-btn" onclick="showRegisterModal()">
            <i class="nav-icon" data-lucide="user-plus"></i>
            <span class="nav-text">Criar conta</span>
          </button>
        </p>
        <button type="button" class="nav-link link-btn" onclick="showPasswordResetModal()" style="margin-top: var(--space-2);">
          <i class="nav-icon" data-lucide="key"></i>
          <span class="nav-text">Esqueci a senha</span>
        </button>
      </div>
      
      <div id="loginError" class="error-message" style="display: none;"></div>
      <div id="loginSuccess" class="success-message" style="display: none;"></div>
    </form>

    <!-- Professional Features Section -->
    <div class="auth-modal-features">
      <div class="auth-feature">
        <i class="feature-icon" data-lucide="shield-check"></i>
        <span>Login seguro</span>
      </div>
      <div class="auth-feature">
        <i class="feature-icon" data-lucide="smartphone"></i>
        <span>Acesso multiplataforma</span>
      </div>
      <div class="auth-feature">
        <i class="feature-icon" data-lucide="users"></i>
        <span>Comunidade ativa</span>
      </div>
    </div>
  `;
  
  // Show modal
  document.getElementById('modalOverlay').style.display = 'flex';
  
  // Reinitialize Lucide icons for new modal content
  if (window.SantooIcons) {
    window.SantooIcons.reinit();
  }
  
  // Bind form events
  bindLoginForm();
}

/**
 * Show register modal
 */
function showRegisterModal() {
  const modal = document.getElementById('authModal');
  const modalTitle = document.getElementById('authModalTitle');
  const modalBody = modal.querySelector('.modal-body');
  
  modalTitle.textContent = 'Junte-se à comunidade Santoo';
  modalBody.innerHTML = `
    <!-- Professional Auth Prompt Header -->
    <div class="auth-modal-header">
      <div class="auth-prompt-header">
        <i class="auth-prompt-icon" data-lucide="user-plus"></i>
        <h3>Criar Conta</h3>
      </div>
      <p class="auth-prompt-description">
        Crie sua conta para começar a compartilhar sua jornada de fé com milhares de pessoas.
      </p>
    </div>

    <!-- Professional Form -->
    <form id="registerForm" class="auth-form professional-form">
      <div class="form-row">
        <div class="form-group">
          <label for="registerUsername" class="form-label">
            <i class="label-icon" data-lucide="at-sign"></i>
            Nome de Usuário
          </label>
          <input 
            type="text" 
            id="registerUsername" 
            name="username"
            class="form-input"
            placeholder="seunomeunico"
            required
            autocomplete="username"
          >
          <small class="form-hint">Apenas letras, números e underscore</small>
        </div>
        
        <div class="form-group">
          <label for="registerDisplayName" class="form-label">
            <i class="label-icon" data-lucide="user"></i>
            Nome de Exibição
          </label>
          <input 
            type="text" 
            id="registerDisplayName" 
            name="displayName"
            class="form-input"
            placeholder="Seu Nome Completo"
            required
            autocomplete="name"
          >
        </div>
      </div>
      
      <div class="form-group">
        <label for="registerEmail" class="form-label">
          <i class="label-icon" data-lucide="mail"></i>
          Email
        </label>
        <input 
          type="email" 
          id="registerEmail" 
          name="email"
          class="form-input"
          placeholder="seu@email.com"
          required
          autocomplete="email"
        >
      </div>
      
      <div class="form-group">
        <label for="registerPassword" class="form-label">
          <i class="label-icon" data-lucide="lock"></i>
          Senha
        </label>
        <input 
          type="password" 
          id="registerPassword" 
          name="password"
          class="form-input"
          placeholder="Mínimo 6 caracteres"
          required
          autocomplete="new-password"
        >
      </div>
      
      <div class="form-group">
        <label for="registerBio" class="form-label">
          <i class="label-icon" data-lucide="message-circle"></i>
          Bio (opcional)
        </label>
        <textarea 
          id="registerBio" 
          name="bio"
          class="form-input form-textarea"
          placeholder="Conte um pouco sobre você e sua jornada de fé..."
          maxlength="500"
          rows="3"
        ></textarea>
      </div>
      
      <!-- Professional Action Buttons -->
      <div class="auth-modal-actions">
        <button type="submit" class="nav-link active professional-btn" id="registerSubmitBtn">
          <i class="nav-icon" data-lucide="user-plus"></i>
          <span class="nav-text">Criar Conta</span>
          <span class="btn-loading" style="display: none;">
            <i class="loading-icon" data-lucide="loader-2"></i>
            Criando...
          </span>
        </button>
      </div>
      
      <!-- Professional Footer -->
      <div class="form-footer auth-footer">
        <p>Já tem conta? 
          <button type="button" class="nav-link link-btn" onclick="showLoginModal()">
            <i class="nav-icon" data-lucide="log-in"></i>
            <span class="nav-text">Entrar</span>
          </button>
        </p>
      </div>
      
      <div id="registerError" class="error-message" style="display: none;"></div>
      <div id="registerSuccess" class="success-message" style="display: none;"></div>
    </form>

    <!-- Professional Features Section -->
    <div class="auth-modal-features">
      <div class="auth-feature">
        <i class="feature-icon" data-lucide="video"></i>
        <span>Publique vídeos inspiradores</span>
      </div>
      <div class="auth-feature">
        <i class="feature-icon" data-lucide="heart"></i>
        <span>Interaja com a comunidade</span>
      </div>
      <div class="auth-feature">
        <i class="feature-icon" data-lucide="radio"></i>
        <span>Transmita ao vivo</span>
      </div>
    </div>
  `;
  
  // Show modal
  document.getElementById('modalOverlay').style.display = 'flex';
  
  // Reinitialize Lucide icons for new modal content
  if (window.SantooIcons) {
    window.SantooIcons.reinit();
  }
  
  // Bind form events
  bindRegisterForm();
}

/**
 * Show password reset modal
 */
function showPasswordResetModal() {
  const modal = document.getElementById('authModal');
  const modalTitle = document.getElementById('authModalTitle');
  const modalBody = modal.querySelector('.modal-body');
  
  modalTitle.textContent = 'Recuperar Senha';
  modalBody.innerHTML = `
    <form id="resetForm" class="auth-form">
      <p>Digite seu email para receber instruções de recuperação:</p>
      
      <div class="form-group">
        <label for="resetEmail">Email</label>
        <input 
          type="email" 
          id="resetEmail" 
          name="email"
          placeholder="seu@email.com"
          required
          autocomplete="email"
        >
      </div>
      
      <div class="form-actions">
        <button type="submit" class="nav-link active professional-btn" id="resetSubmitBtn">
          <i class="nav-icon" data-lucide="mail"></i>
          <span class="nav-text">Enviar Instruções</span>
          <span class="btn-loading" style="display: none;">
            <i class="loading-icon" data-lucide="loader-2"></i>
            Enviando...
          </span>
        </button>
      </div>
      
      <div class="form-footer">
        <button type="button" class="link-btn" onclick="showLoginModal()">Voltar ao Login</button>
      </div>
      
      <div id="resetError" class="error-message" style="display: none;"></div>
      <div id="resetSuccess" class="success-message" style="display: none;"></div>
    </form>
  `;
  
  // Show modal
  document.getElementById('modalOverlay').style.display = 'flex';
  
  // Bind form events
  bindResetForm();
}

/**
 * Hide auth modal
 */
function hideAuthModal() {
  document.getElementById('modalOverlay').style.display = 'none';
}

/**
 * Bind login form events
 */
function bindLoginForm() {
  const form = document.getElementById('loginForm');
  const submitBtn = document.getElementById('loginSubmitBtn');
  const errorDiv = document.getElementById('loginError');
  const successDiv = document.getElementById('loginSuccess');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    const identifier = formData.get('identifier').trim();
    const password = formData.get('password');
    
    // Clear previous messages
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    // Show loading
    submitBtn.disabled = true;
    const textElement = submitBtn.querySelector('.nav-text');
    const loadingElement = submitBtn.querySelector('.btn-loading');
    
    if (textElement) textElement.style.display = 'none';
    if (loadingElement) loadingElement.style.display = 'inline';
    
    try {
      const result = await santooAuth.login(identifier, password);
      
      if (result.success) {
        successDiv.textContent = result.message || 'Login realizado com sucesso!';
        successDiv.style.display = 'block';
        
        // Close modal after delay
        setTimeout(() => {
          hideAuthModal();
        }, 1500);
      } else {
        errorDiv.textContent = result.error;
        errorDiv.style.display = 'block';
      }
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
    }
    
    // Hide loading
    submitBtn.disabled = false;
    const textElement = submitBtn.querySelector('.nav-text');
    const loadingElement = submitBtn.querySelector('.btn-loading');
    
    if (textElement) textElement.style.display = 'inline';
    if (loadingElement) loadingElement.style.display = 'none';
  });
}

/**
 * Bind register form events
 */
function bindRegisterForm() {
  const form = document.getElementById('registerForm');
  const submitBtn = document.getElementById('registerSubmitBtn');
  const errorDiv = document.getElementById('registerError');
  const successDiv = document.getElementById('registerSuccess');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    const userData = {
      username: formData.get('username').trim(),
      displayName: formData.get('displayName').trim(),
      email: formData.get('email').trim(),
      password: formData.get('password'),
      bio: formData.get('bio').trim()
    };
    
    // Clear previous messages
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    // Show loading
    submitBtn.disabled = true;
    const textElement = submitBtn.querySelector('.nav-text');
    const loadingElement = submitBtn.querySelector('.btn-loading');
    
    if (textElement) textElement.style.display = 'none';
    if (loadingElement) loadingElement.style.display = 'inline';
    
    try {
      const result = await santooAuth.register(userData);
      
      if (result.success) {
        successDiv.textContent = result.message || 'Conta criada com sucesso!';
        successDiv.style.display = 'block';
        
        // Close modal after delay
        setTimeout(() => {
          hideAuthModal();
        }, 1500);
      } else {
        errorDiv.textContent = result.error;
        errorDiv.style.display = 'block';
      }
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
    }
    
    // Hide loading
    submitBtn.disabled = false;
    const textElement = submitBtn.querySelector('.nav-text');
    const loadingElement = submitBtn.querySelector('.btn-loading');
    
    if (textElement) textElement.style.display = 'inline';
    if (loadingElement) loadingElement.style.display = 'none';
  });
}

/**
 * Bind reset form events
 */
function bindResetForm() {
  const form = document.getElementById('resetForm');
  const submitBtn = document.getElementById('resetSubmitBtn');
  const errorDiv = document.getElementById('resetError');
  const successDiv = document.getElementById('resetSuccess');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    const email = formData.get('email').trim();
    
    // Clear previous messages
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    // Show loading
    submitBtn.disabled = true;
    const textElement = submitBtn.querySelector('.nav-text');
    const loadingElement = submitBtn.querySelector('.btn-loading');
    
    if (textElement) textElement.style.display = 'none';
    if (loadingElement) loadingElement.style.display = 'inline';
    
    try {
      const result = await santooAuth.requestPasswordReset(email);
      
      if (result.success) {
        successDiv.textContent = result.message;
        successDiv.style.display = 'block';
        
        // Clear form
        form.reset();
      } else {
        errorDiv.textContent = result.error;
        errorDiv.style.display = 'block';
      }
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
    }
    
    // Hide loading
    submitBtn.disabled = false;
    const textElement = submitBtn.querySelector('.nav-text');
    const loadingElement = submitBtn.querySelector('.btn-loading');
    
    if (textElement) textElement.style.display = 'inline';
    if (loadingElement) loadingElement.style.display = 'none';
  });
}

// Create global auth manager instance
window.santooAuth = new AuthManager();

// Export helper functions
console.log('📤 Exportando funções de autenticação para window...');
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.showPasswordResetModal = showPasswordResetModal;
window.hideAuthModal = hideAuthModal;

console.log('✅ Funções exportadas:', {
  showLoginModal: typeof window.showLoginModal,
  showRegisterModal: typeof window.showRegisterModal,
  showPasswordResetModal: typeof window.showPasswordResetModal,
  hideAuthModal: typeof window.hideAuthModal
});

console.log('🔧 auth.js carregado completamente!');

console.log('🔐 Santoo Auth carregado com API REAL');