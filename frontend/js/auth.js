/**
 * SANTOO - Authentication Module
 * Handles user authentication, registration, and session management
 */

class AuthManager {
  constructor() {
    this.user = null;
    this.token = null;
    this.refreshToken = null;
    this.apiBaseUrl = '/api'; // Will be configured later
    
    this.init();
  }

  /**
   * Initialize authentication manager
   */
  init() {
    this.loadStoredAuth();
    console.log('🔐 Auth Manager inicializado');
  }

  /**
   * Load authentication data from storage
   */
  loadStoredAuth() {
    try {
      const storedUser = localStorage.getItem('santoo_user');
      const storedToken = localStorage.getItem('santoo_token');
      const storedRefreshToken = localStorage.getItem('santoo_refresh_token');

      if (storedUser && storedToken) {
        this.user = JSON.parse(storedUser);
        this.token = storedToken;
        this.refreshToken = storedRefreshToken;
        
        // Validate token expiry (basic check)
        if (this.isTokenExpired(this.token)) {
          console.log('Token expirado, fazendo logout...');
          this.logout();
        } else {
          console.log('Sessão restaurada para:', this.user.name);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar autenticação:', error);
      this.clearStoredAuth();
    }
  }

  /**
   * Check if token is expired (basic JWT check)
   */
  isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));\n      const now = Date.now() / 1000;\n      return payload.exp < now;\n    } catch (error) {\n      console.error('Erro ao validar token:', error);\n      return true;\n    }\n  }\n\n  /**\n   * Login user with email and password\n   */\n  async login(email, password) {\n    try {\n      console.log('Tentando fazer login...', email);\n      \n      // Simulate API call for development\n      await this.delay(1000);\n      \n      // Mock successful response\n      const response = {\n        success: true,\n        user: {\n          id: Date.now(),\n          name: email.split('@')[0],\n          email: email,\n          avatar: 'assets/images/default-avatar.svg',\n          verified: false,\n          createdAt: new Date().toISOString()\n        },\n        token: this.generateMockToken(),\n        refreshToken: this.generateMockRefreshToken()\n      };\n\n      if (response.success) {\n        this.user = response.user;\n        this.token = response.token;\n        this.refreshToken = response.refreshToken;\n        \n        this.storeAuth();\n        this.notifyAuthChange('login');\n        \n        return { success: true, user: this.user };\n      } else {\n        throw new Error(response.message || 'Erro no login');\n      }\n      \n    } catch (error) {\n      console.error('Erro no login:', error);\n      return { success: false, error: error.message };\n    }\n  }\n\n  /**\n   * Register new user\n   */\n  async register(userData) {\n    try {\n      console.log('Tentando registrar usuário...', userData.email);\n      \n      // Validate input\n      const validation = this.validateRegistrationData(userData);\n      if (!validation.valid) {\n        return { success: false, error: validation.message };\n      }\n      \n      // Simulate API call\n      await this.delay(1000);\n      \n      // Mock successful response\n      const response = {\n        success: true,\n        user: {\n          id: Date.now(),\n          name: userData.name,\n          email: userData.email,\n          avatar: 'assets/images/default-avatar.svg',\n          verified: false,\n          createdAt: new Date().toISOString()\n        },\n        token: this.generateMockToken(),\n        refreshToken: this.generateMockRefreshToken()\n      };\n\n      if (response.success) {\n        this.user = response.user;\n        this.token = response.token;\n        this.refreshToken = response.refreshToken;\n        \n        this.storeAuth();\n        this.notifyAuthChange('register');\n        \n        return { success: true, user: this.user };\n      } else {\n        throw new Error(response.message || 'Erro no registro');\n      }\n      \n    } catch (error) {\n      console.error('Erro no registro:', error);\n      return { success: false, error: error.message };\n    }\n  }\n\n  /**\n   * Logout current user\n   */\n  async logout() {\n    try {\n      console.log('Fazendo logout...');\n      \n      // Clear local state\n      this.user = null;\n      this.token = null;\n      this.refreshToken = null;\n      \n      // Clear storage\n      this.clearStoredAuth();\n      \n      // Notify app of auth change\n      this.notifyAuthChange('logout');\n      \n      return { success: true };\n      \n    } catch (error) {\n      console.error('Erro no logout:', error);\n      return { success: false, error: error.message };\n    }\n  }\n\n  /**\n   * Refresh authentication token\n   */\n  async refreshAuthToken() {\n    if (!this.refreshToken) {\n      throw new Error('No refresh token available');\n    }\n\n    try {\n      // Simulate API call\n      await this.delay(500);\n      \n      const response = {\n        success: true,\n        token: this.generateMockToken(),\n        refreshToken: this.generateMockRefreshToken()\n      };\n\n      if (response.success) {\n        this.token = response.token;\n        this.refreshToken = response.refreshToken;\n        this.storeAuth();\n        \n        return { success: true, token: this.token };\n      } else {\n        throw new Error('Failed to refresh token');\n      }\n      \n    } catch (error) {\n      console.error('Token refresh failed:', error);\n      this.logout(); // Force logout on refresh failure\n      throw error;\n    }\n  }\n\n  /**\n   * Update user profile\n   */\n  async updateProfile(updates) {\n    if (!this.isAuthenticated()) {\n      return { success: false, error: 'Usuário não autenticado' };\n    }\n\n    try {\n      console.log('Atualizando perfil...', updates);\n      \n      // Simulate API call\n      await this.delay(800);\n      \n      // Update local user object\n      this.user = { ...this.user, ...updates };\n      this.storeAuth();\n      \n      this.notifyAuthChange('profileUpdate');\n      \n      return { success: true, user: this.user };\n      \n    } catch (error) {\n      console.error('Erro ao atualizar perfil:', error);\n      return { success: false, error: error.message };\n    }\n  }\n\n  /**\n   * Change user password\n   */\n  async changePassword(currentPassword, newPassword) {\n    if (!this.isAuthenticated()) {\n      return { success: false, error: 'Usuário não autenticado' };\n    }\n\n    try {\n      console.log('Alterando senha...');\n      \n      // Validate new password\n      const validation = window.SantooUtils.ValidationUtils.password(newPassword);\n      if (!validation.valid) {\n        return { success: false, error: validation.message };\n      }\n      \n      // Simulate API call\n      await this.delay(1000);\n      \n      return { success: true, message: 'Senha alterada com sucesso' };\n      \n    } catch (error) {\n      console.error('Erro ao alterar senha:', error);\n      return { success: false, error: error.message };\n    }\n  }\n\n  /**\n   * Request password reset\n   */\n  async requestPasswordReset(email) {\n    try {\n      console.log('Solicitando reset de senha para:', email);\n      \n      // Validate email\n      if (!window.SantooUtils.ValidationUtils.email(email)) {\n        return { success: false, error: 'Email inválido' };\n      }\n      \n      // Simulate API call\n      await this.delay(1000);\n      \n      return { \n        success: true, \n        message: 'Instruções de recuperação enviadas para seu email' \n      };\n      \n    } catch (error) {\n      console.error('Erro ao solicitar reset:', error);\n      return { success: false, error: error.message };\n    }\n  }\n\n  /**\n   * Store authentication data in localStorage\n   */\n  storeAuth() {\n    try {\n      if (this.user) {\n        localStorage.setItem('santoo_user', JSON.stringify(this.user));\n      }\n      if (this.token) {\n        localStorage.setItem('santoo_token', this.token);\n      }\n      if (this.refreshToken) {\n        localStorage.setItem('santoo_refresh_token', this.refreshToken);\n      }\n    } catch (error) {\n      console.error('Erro ao salvar autenticação:', error);\n    }\n  }\n\n  /**\n   * Clear stored authentication data\n   */\n  clearStoredAuth() {\n    localStorage.removeItem('santoo_user');\n    localStorage.removeItem('santoo_token');\n    localStorage.removeItem('santoo_refresh_token');\n  }\n\n  /**\n   * Check if user is authenticated\n   */\n  isAuthenticated() {\n    return !!(this.user && this.token && !this.isTokenExpired(this.token));\n  }\n\n  /**\n   * Get current user\n   */\n  getCurrentUser() {\n    return this.user;\n  }\n\n  /**\n   * Get authentication token\n   */\n  getToken() {\n    return this.token;\n  }\n\n  /**\n   * Get authorization header for API requests\n   */\n  getAuthHeader() {\n    return this.token ? `Bearer ${this.token}` : null;\n  }\n\n  /**\n   * Validate registration data\n   */\n  validateRegistrationData(data) {\n    // Validate name\n    const nameValidation = window.SantooUtils.ValidationUtils.username(data.name);\n    if (!nameValidation.valid) {\n      return nameValidation;\n    }\n\n    // Validate email\n    if (!window.SantooUtils.ValidationUtils.email(data.email)) {\n      return { valid: false, message: 'Email inválido' };\n    }\n\n    // Validate password\n    const passwordValidation = window.SantooUtils.ValidationUtils.password(data.password);\n    if (!passwordValidation.valid) {\n      return passwordValidation;\n    }\n\n    return { valid: true };\n  }\n\n  /**\n   * Notify application of authentication changes\n   */\n  notifyAuthChange(event) {\n    // Dispatch custom event\n    window.dispatchEvent(new CustomEvent('santooAuthChange', {\n      detail: { event, user: this.user, isAuthenticated: this.isAuthenticated() }\n    }));\n    \n    // Update app UI if santooApp exists\n    if (window.santooApp && typeof window.santooApp.updateUserUI === 'function') {\n      window.santooApp.updateUserUI();\n    }\n  }\n\n  /**\n   * Generate mock JWT token for development\n   */\n  generateMockToken() {\n    const header = { alg: 'HS256', typ: 'JWT' };\n    const payload = {\n      sub: this.user?.id || Date.now(),\n      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours\n      iat: Math.floor(Date.now() / 1000)\n    };\n    \n    // This is just for development - in production, tokens come from server\n    return btoa(JSON.stringify(header)) + '.' + \n           btoa(JSON.stringify(payload)) + '.' + \n           btoa('mock-signature');\n  }\n\n  /**\n   * Generate mock refresh token\n   */\n  generateMockRefreshToken() {\n    return btoa(Date.now() + '-' + Math.random().toString(36));\n  }\n\n  /**\n   * Utility delay function\n   */\n  delay(ms) {\n    return new Promise(resolve => setTimeout(resolve, ms));\n  }\n}\n\n// Create global auth manager instance\nwindow.santooAuth = new AuthManager();\n\nconsole.log('🔐 Santoo Auth carregado');"