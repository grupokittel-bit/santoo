/**
 * SANTOO - Upload Module
 * Handles video upload, processing, and file management
 * INTEGRADO COM API REAL
 */

class UploadManager {
  constructor() {
    this.maxFileSize = 100 * 1024 * 1024; // 100MB
    this.allowedTypes = ['video/mp4', 'video/mov', 'video/webm', 'video/avi', 'video/mpeg'];
    this.currentUpload = null;
    
    this.init();
  }

  /**
   * Initialize upload manager
   */
  init() {
    this.setupEventListeners();
    console.log('📤 Upload Manager inicializado com API real');
  }

  /**
   * Setup event listeners for upload functionality
   */
  setupEventListeners() {
    // File input change
    const fileInput = document.getElementById('videoFileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.handleFileSelect(e.target.files[0]);
        }
      });
    }

    // Select video button
    const selectBtn = document.getElementById('selectVideoBtn');
    if (selectBtn) {
      selectBtn.addEventListener('click', () => {
        fileInput?.click();
      });
    }

    // Upload zone click
    const uploadZone = document.getElementById('uploadZone');
    if (uploadZone) {
      uploadZone.addEventListener('click', (e) => {
        if (e.target === uploadZone || uploadZone.contains(e.target)) {
          fileInput?.click();
        }
      });
    }
  }

  /**
   * Handle file selection
   */
  async handleFileSelect(file) {
    console.log('📁 Arquivo selecionado:', file.name);
    
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      this.showError(validation.message);
      return;
    }

    // Show loading
    this.showLoading('Processando vídeo...');
    
    try {
      // Process file
      await this.processFile(file);
      
      // Show upload form
      this.showUploadForm(file);
      
    } catch (error) {
      console.error('❌ Erro ao processar arquivo:', error);
      this.showError('Erro ao processar o vídeo. Tente novamente.');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Validate selected file
   */
  validateFile(file) {
    // Check if file exists
    if (!file) {
      return { valid: false, message: 'Nenhum arquivo selecionado' };
    }

    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        message: `Tipo de arquivo não suportado. Use: ${this.getAllowedTypesText()}` 
      };
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      const maxSizeMB = Math.round(this.maxFileSize / (1024 * 1024));
      return { 
        valid: false, 
        message: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB` 
      };
    }

    // Check file name
    if (file.name.length > 255) {
      return { valid: false, message: 'Nome do arquivo muito longo' };
    }

    return { valid: true, message: 'Arquivo válido' };
  }

  /**
   * Process selected file
   */
  async processFile(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      
      video.onloadedmetadata = () => {
        // Get video metadata
        const metadata = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          size: file.size,
          type: file.type,
          name: file.name
        };
        
        console.log('📊 Metadados do vídeo:', metadata);
        
        // Store metadata for upload
        this.currentUpload = {
          file: file,
          metadata: metadata,
          preview: URL.createObjectURL(file)
        };
        
        resolve(metadata);
      };
      
      video.onerror = () => {
        reject(new Error('Não foi possível ler o arquivo de vídeo'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Show upload form with file preview
   */
  showUploadForm(file) {
    const uploadForm = document.getElementById('uploadForm');
    const uploadZone = document.getElementById('uploadZone');
    
    if (!uploadForm || !this.currentUpload) return;

    // Hide upload zone
    if (uploadZone) {
      uploadZone.style.display = 'none';
    }

    // Show and populate upload form
    uploadForm.style.display = 'block';
    uploadForm.innerHTML = this.generateUploadFormHTML();
    
    // Setup form event listeners
    this.setupFormListeners();
    
    console.log('📝 Formulário de upload exibido');
  }

  /**
   * Generate upload form HTML with real categories
   */
  generateUploadFormHTML() {
    const { metadata, preview } = this.currentUpload;
    
    return `
      <div class="upload-preview">
        <video controls style="width: 100%; max-height: 300px; border-radius: 8px; background: #f0f0f0;">
          <source src="${preview}" type="${metadata.type}">
          Seu navegador não suporta o elemento video.
        </video>
        <div style="margin-top: 1rem; display: flex; justify-content: space-between; font-size: 0.9em; color: #666;">
          <span>📹 ${this.formatDuration(metadata.duration)}</span>
          <span>📏 ${metadata.width}x${metadata.height}</span>
          <span>💾 ${this.formatFileSize(metadata.size)}</span>
        </div>
      </div>
      
      <form data-type="upload" class="upload-details-form">
        <div class="form-group">
          <label class="form-label" for="videoTitle">Título do Vídeo *</label>
          <input 
            type="text" 
            id="videoTitle" 
            name="title" 
            class="form-input" 
            placeholder="Dê um título inspirador ao seu vídeo"
            maxlength="200"
            required
          >
          <small style="color: #666; font-size: 0.8em;">0/200 caracteres</small>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="videoDescription">Descrição</label>
          <textarea 
            id="videoDescription" 
            name="description" 
            class="form-input form-textarea" 
            placeholder="Descreva sua mensagem, adicione versículos ou contexto..."
            maxlength="2000"
            rows="4"
          ></textarea>
          <small style="color: #666; font-size: 0.8em;">0/2000 caracteres</small>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="videoCategory">Categoria *</label>
          <select id="videoCategory" name="categoryId" class="form-input form-select" required>
            <option value="">Selecione uma categoria</option>
            <option value="1">⛪ Pregação</option>
            <option value="2">🎵 Música</option>
            <option value="3">🙏 Testemunho</option>
            <option value="4">📖 Estudo Bíblico</option>
            <option value="5">🌟 Jovens</option>
            <option value="6">👶 Infantil</option>
            <option value="7">🔴 Live</option>
            <option value="8">🕊️ Devocional</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="videoTags">Tags</label>
          <input 
            type="text" 
            id="videoTags" 
            name="tags" 
            class="form-input" 
            placeholder="jesus, fé, esperança, amor (separadas por vírgula)"
          >
          <small style="color: #666; font-size: 0.8em;">Máximo 10 tags, separadas por vírgula</small>
        </div>
        
        <div class="form-group">
          <label class="form-label">Configurações</label>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: normal;">
              <input type="checkbox" name="isPublic" checked>
              <span>Vídeo público (todos podem ver)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: normal;">
              <input type="checkbox" name="allowComments" checked>
              <span>Permitir comentários</span>
            </label>
            <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: normal;">
              <input type="checkbox" name="allowDownload">
              <span>Permitir download</span>
            </label>
          </div>
        </div>
        
        <div class="form-group" style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <button type="button" class="btn btn-secondary" id="cancelUploadBtn">
            ❌ Cancelar
          </button>
          <button type="submit" class="btn btn-primary" id="publishBtn" style="flex: 1;">
            📤 Publicar Vídeo
          </button>
        </div>
      </form>
    `;
  }

  /**
   * Setup form event listeners
   */
  setupFormListeners() {
    // Character counters
    this.setupCharacterCounters();
    
    // Cancel button
    const cancelBtn = document.getElementById('cancelUploadBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.cancelUpload());
    }
    
    console.log('🎛️ Listeners do formulário configurados');
  }

  /**
   * Setup character counters for text inputs
   */
  setupCharacterCounters() {
    const titleInput = document.getElementById('videoTitle');
    const descriptionInput = document.getElementById('videoDescription');
    
    if (titleInput) {
      const updateTitleCounter = () => {
        const counter = titleInput.parentNode.querySelector('small');
        if (counter) {
          const count = titleInput.value.length;
          counter.textContent = `${count}/200 caracteres`;
          counter.style.color = count > 180 ? 'orange' : '#666';
        }
      };
      
      titleInput.addEventListener('input', updateTitleCounter);
      updateTitleCounter();
    }
    
    if (descriptionInput) {
      const updateDescCounter = () => {
        const counter = descriptionInput.parentNode.querySelector('small');
        if (counter) {
          const count = descriptionInput.value.length;
          counter.textContent = `${count}/2000 caracteres`;
          counter.style.color = count > 1800 ? 'orange' : '#666';
        }
      };
      
      descriptionInput.addEventListener('input', updateDescCounter);
      updateDescCounter();
    }
  }

  /**
   * Handle upload form submission with real API
   */
  async handleUpload(formData) {
    if (!this.currentUpload) {
      this.showError('Nenhum arquivo selecionado');
      return { success: false };
    }

    // Check authentication
    if (!santooAuth.isAuthenticated()) {
      this.showError('Você precisa estar logado para publicar vídeos');
      showLoginModal();
      return { success: false };
    }

    try {
      console.log('🚀 Iniciando upload para API...');
      
      // Show upload progress
      this.showLoading('Fazendo upload do vídeo...');
      
      // Create FormData for API
      const apiFormData = this.prepareAPIFormData(formData);
      
      // Upload to real API
      const result = await this.uploadToAPI(apiFormData);
      
      if (result && result.video) {
        this.showSuccess('Vídeo publicado com sucesso! 🎉');
        this.resetUploadForm();
        
        // Navigate to home to see new video
        if (window.santooApp) {
          window.santooApp.navigateTo('home');
          // Reload feed to show new video
          setTimeout(() => {
            window.santooApp.loadVideoFeed();
          }, 1000);
        }
        
        return { success: true, video: result.video };
      } else {
        throw new Error(result.error || 'Erro no upload');
      }
      
    } catch (error) {
      console.error('❌ Erro no upload:', error);
      this.showError('Erro ao publicar vídeo: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Prepare FormData for API upload
   */
  prepareAPIFormData(formData) {
    const apiFormData = new FormData();
    
    // Add video file
    apiFormData.append('video', this.currentUpload.file);
    
    // Add form fields
    apiFormData.append('title', formData.get('title'));
    apiFormData.append('description', formData.get('description') || '');
    apiFormData.append('categoryId', formData.get('categoryId'));
    apiFormData.append('tags', formData.get('tags') || '');
    
    // Add boolean fields
    apiFormData.append('isPublic', formData.get('isPublic') ? 'true' : 'false');
    apiFormData.append('allowComments', formData.get('allowComments') ? 'true' : 'false');
    apiFormData.append('allowDownload', formData.get('allowDownload') ? 'true' : 'false');
    
    // Add metadata as JSON
    apiFormData.append('metadata', JSON.stringify(this.currentUpload.metadata));
    
    console.log('📦 FormData preparado para API');
    return apiFormData;
  }

  /**
   * Upload to real Santoo API
   */
  async uploadToAPI(formData) {
    try {
      // Update loading message
      this.updateLoadingMessage('Validando vídeo...');
      await SantooUtils.sleep(500);
      
      this.updateLoadingMessage('Enviando para servidor...');
      
      // Use the real API
      const response = await SantooAPI.videos.upload(formData);
      
      this.updateLoadingMessage('Processando vídeo...');
      await SantooUtils.sleep(1000);
      
      this.updateLoadingMessage('Finalizando publicação...');
      await SantooUtils.sleep(500);
      
      return response;
      
    } catch (error) {
      console.error('💥 Erro na API de upload:', error);
      throw error;
    }
  }

  /**
   * Cancel upload and reset form
   */
  cancelUpload() {
    const confirmCancel = confirm('Tem certeza que deseja cancelar? O vídeo será perdido.');
    
    if (confirmCancel) {
      this.resetUploadForm();
      this.showInfo('Upload cancelado');
    }
  }

  /**
   * Reset upload form
   */
  resetUploadForm() {
    // Clear current upload
    if (this.currentUpload && this.currentUpload.preview) {
      URL.revokeObjectURL(this.currentUpload.preview);
    }
    this.currentUpload = null;
    
    // Reset UI
    const uploadZone = document.getElementById('uploadZone');
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('videoFileInput');
    
    if (uploadZone) uploadZone.style.display = 'block';
    if (uploadForm) uploadForm.style.display = 'none';
    if (fileInput) fileInput.value = '';
    
    console.log('🧹 Formulário de upload resetado');
  }

  /**
   * Get allowed file types as readable text
   */
  getAllowedTypesText() {
    return this.allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ');
  }

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    return SantooUtils ? SantooUtils.formatFileSize(bytes) : `${Math.round(bytes / 1024)} KB`;
  }

  /**
   * Format duration
   */
  formatDuration(seconds) {
    return SantooUtils ? SantooUtils.StringUtils.formatDuration(seconds) : `${Math.round(seconds)}s`;
  }

  // === UI HELPER FUNCTIONS ===

  showLoading(message) {
    // Create simple loading overlay if not exists
    if (!document.getElementById('uploadLoading')) {
      const loadingDiv = document.createElement('div');
      loadingDiv.id = 'uploadLoading';
      loadingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        color: white;
        font-size: 18px;
      `;
      document.body.appendChild(loadingDiv);
    }
    
    const loading = document.getElementById('uploadLoading');
    loading.innerHTML = `
      <div style="text-align: center;">
        <div style="margin-bottom: 20px;">⏳</div>
        <div id="loadingMessage">${message}</div>
      </div>
    `;
    loading.style.display = 'flex';
  }

  hideLoading() {
    const loading = document.getElementById('uploadLoading');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  updateLoadingMessage(message) {
    const messageDiv = document.getElementById('loadingMessage');
    if (messageDiv) {
      messageDiv.textContent = message;
    }
  }

  showError(message) {
    alert('❌ ' + message);
  }

  showSuccess(message) {
    alert('✅ ' + message);
  }

  showInfo(message) {
    alert('ℹ️ ' + message);
  }
}

// Create global upload manager instance
window.santooUpload = new UploadManager();

console.log('📤 Santoo Upload carregado com API REAL');