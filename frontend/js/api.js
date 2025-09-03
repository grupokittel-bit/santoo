/**
 * SANTOO API CLIENT
 * Comunicação completa com o backend
 */

// === CONFIGURAÇÃO DA API ===

const API_CONFIG = {
  baseURL: 'http://localhost:3001',
  timeout: 30000, // 30 segundos
  maxRetries: 3
};

/**
 * API Client Class - Gerencia todas as requisições
 */
class SantooAPI {
  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
    this.token = null;
    
    // Carrega token salvo do localStorage
    this.loadAuthToken();
    
    // Define endpoints API com contexto correto
    this.setupAPIEndpoints();
  }

  // === MÉTODOS DE CONFIGURAÇÃO ===

  /**
   * Carrega token do localStorage
   */
  loadAuthToken() {
    const savedToken = SantooUtils.StorageUtils.get('santoo_token');
    if (savedToken) {
      this.token = savedToken;
    }
  }

  /**
   * Define token de autenticação
   */
  setAuthToken(token) {
    this.token = token;
    if (token) {
      SantooUtils.StorageUtils.set('santoo_token', token);
    } else {
      SantooUtils.StorageUtils.remove('santoo_token');
    }
  }

  /**
   * Limpa autenticação
   */
  clearAuth() {
    this.token = null;
    SantooUtils.StorageUtils.remove('santoo_token');
    SantooUtils.StorageUtils.remove('santoo_user');
  }

  // === MÉTODOS HTTP ===

  /**
   * Faz requisição HTTP genérica
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Configurações padrão
    const config = {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Adiciona token se disponível
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    // Remove Content-Type se for FormData
    if (config.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      console.log('🌐 API Request:', {
        method: config.method || 'GET',
        url,
        hasAuth: !!this.token
      });

      const response = await fetch(url, config);
      
      // Verifica se resposta é JSON
      const contentType = response.headers.get('content-type');
      const isJSON = contentType?.includes('application/json');
      
      let data;
      if (isJSON) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Trata erros HTTP
      if (!response.ok) {
        console.error('❌ API Error:', {
          status: response.status,
          statusText: response.statusText,
          data
        });

        // Token expirado
        if (response.status === 401) {
          this.clearAuth();
          throw new Error('Token expirado. Faça login novamente.');
        }

        // Erro do servidor
        const errorMessage = data?.error || data?.message || `Erro ${response.status}`;
        throw new Error(errorMessage);
      }

      console.log('✅ API Success:', {
        status: response.status,
        endpoint,
        dataType: typeof data
      });

      return data;

    } catch (error) {
      console.error('💥 API Request Failed:', {
        endpoint,
        error: error.message
      });

      // Erro de rede
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      }

      throw error;
    }
  }

  // === MÉTODOS DE CONVENIÊNCIA ===

  async get(endpoint, params = {}) {
    const url = new URL(endpoint, this.baseURL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, value);
      }
    });
    
    return this.request(url.pathname + url.search);
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data)
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }

  // === CONFIGURAÇÃO DOS ENDPOINTS API ===

  /**
   * Configura todos os endpoints da API com contexto correto
   */
  setupAPIEndpoints() {
    console.log('🔧 DEBUG: setupAPIEndpoints iniciado');
    const self = this;

    // 🔐 AUTENTICAÇÃO
    this.auth = {
      /**
       * Registrar novo usuário
       */
      register: async (userData) => {
        const result = await self.post('/api/auth/register', userData);
        
        if (result.token) {
          self.setAuthToken(result.token);
          SantooUtils.StorageUtils.set('santoo_user', result.user);
        }
        
        return result;
      },

      /**
       * Fazer login
       */
      login: async (credentials) => {
        const result = await self.post('/api/auth/login', credentials);
        
        if (result.token) {
          self.setAuthToken(result.token);
          SantooUtils.StorageUtils.set('santoo_user', result.user);
        }
        
        return result;
      },

      /**
       * Verificar token
       */
      verify: async (token) => {
        return self.post('/api/auth/verify', { token });
      },

      /**
       * Logout
       */
      logout: async () => {
        self.clearAuth();
        return { message: 'Logout realizado com sucesso' };
      }
    };

    // 👥 USUÁRIOS
    this.users = {
      /**
       * Listar usuários
       */
      list: async (filters = {}) => {
        return self.get('/api/users', filters);
      },

      /**
       * Perfil público de usuário
       */
      getProfile: async (username) => {
        return self.get(`/api/users/${username}`);
      },

      /**
       * Meu perfil (autenticado)
       */
      getMe: async () => {
        return self.get('/api/users/me');
      },

      /**
       * Atualizar meu perfil
       */
      updateProfile: async (formData) => {
        return self.put('/api/users/me', formData);
      },

      /**
       * Seguir/deixar de seguir usuário
       */
      toggleFollow: async (userId) => {
        return self.post(`/api/users/${userId}/follow`);
      },

      /**
       * Feed personalizado
       */
      getFeed: async (params = {}) => {
        return self.get('/api/users/me/feed', params);
      }
    };

    // 🎥 VÍDEOS
    this.videos = {
      /**
       * Feed de vídeos público
       */
      getFeed: async (filters = {}) => {
        return self.get('/api/videos', {
          page: 1,
          limit: 10,
          ...filters
        });
      },

      /**
       * Detalhes de um vídeo
       */
      getById: async (videoId) => {
        return self.get(`/api/videos/${videoId}`);
      },

      /**
       * Upload de novo vídeo
       */
      upload: async (formData, onProgress = null) => {
        // TODO: Implementar progress tracking se necessário
        return self.post('/api/videos', formData);
      },

      /**
       * Atualizar vídeo
       */
      update: async (videoId, data) => {
        return self.put(`/api/videos/${videoId}`, data);
      },

      /**
       * Deletar vídeo
       */
      delete: async (videoId) => {
        return self.delete(`/api/videos/${videoId}`);
      },

      /**
       * Curtir/descurtir vídeo
       */
      toggleLike: async (videoId) => {
        return self.post(`/api/videos/${videoId}/like`);
      }
    };
    console.log('🔧 DEBUG: this.videos criado:', this.videos);

    // 📂 CATEGORIAS
    this.categories = {
      /**
       * Listar todas as categorias
       */
      list: async (withStats = false) => {
        return self.get('/api/categories', { withStats });
      },

      /**
       * Vídeos de uma categoria
       */
      getVideos: async (categoryId, params = {}) => {
        return self.get(`/api/categories/${categoryId}`, params);
      },

      /**
       * Estatísticas das categorias
       */
      getStats: async () => {
        return self.get('/api/categories/stats/overview');
      },

      /**
       * Categorias em alta
       */
      getTrending: async (days = 7) => {
        return self.get('/api/categories/trending', { days });
      }
    };

    // 💬 COMENTÁRIOS
    this.comments = {
      /**
       * Comentários de um vídeo
       */
      getVideoComments: async (videoId, params = {}) => {
        return self.get(`/api/comments/video/${videoId}`, {
          page: 1,
          limit: 20,
          ...params
        });
      },

      /**
       * Adicionar comentário
       */
      add: async (commentData) => {
        return self.post('/api/comments', commentData);
      },

      /**
       * Editar comentário
       */
      update: async (commentId, data) => {
        return self.put(`/api/comments/${commentId}`, data);
      },

      /**
       * Deletar comentário
       */
      delete: async (commentId) => {
        return self.delete(`/api/comments/${commentId}`);
      },

      /**
       * Respostas de um comentário
       */
      getReplies: async (commentId, params = {}) => {
        return self.get(`/api/comments/${commentId}/replies`, params);
      }
    };
    console.log('🔧 DEBUG: setupAPIEndpoints concluído. SantooAPI possui:', Object.keys(this));
  }

  // === MÉTODOS UTILITÁRIOS ===

  /**
   * Verifica se usuário está logado
   */
  isAuthenticated() {
    return !!this.token;
  }

  /**
   * Obtém usuário atual
   */
  getCurrentUser() {
    return SantooUtils.StorageUtils.get('santoo_user');
  }

  /**
   * Testa conexão com a API
   */
  async testConnection() {
    try {
      await this.get('/health');
      return true;
    } catch (error) {
      console.error('❌ API Connection Test Failed:', error);
      return false;
    }
  }
}

// === INSTÂNCIA GLOBAL ===
console.log('🔧 DEBUG: Criando instância SantooAPI...');
const santooAPI = new SantooAPI();
console.log('🔧 DEBUG: Instância criada. Videos disponível:', !!santooAPI.videos);

// === FUNÇÕES DE CONVENIÊNCIA GLOBAIS ===

/**
 * Testa se API está online
 */
async function testAPI() {
  return await santooAPI.testConnection();
}

/**
 * Verifica se usuário está logado
 */
function isLoggedIn() {
  return santooAPI.isAuthenticated();
}

/**
 * Obtém usuário atual
 */
function getCurrentUser() {
  return santooAPI.getCurrentUser();
}

/**
 * Faz logout
 */
async function logout() {
  await santooAPI.auth.logout();
  // Recarrega página para limpar estado
  window.location.reload();
}

// Exporta para uso global
window.SantooAPI = santooAPI;
console.log('🔧 DEBUG: window.SantooAPI definido. Videos:', !!window.SantooAPI.videos);
window.testAPI = testAPI;
window.isLoggedIn = isLoggedIn;
window.getCurrentUser = getCurrentUser;
window.logout = logout;

console.log('🚀 Santoo API Client carregado - Conectado a:', API_CONFIG.baseURL);