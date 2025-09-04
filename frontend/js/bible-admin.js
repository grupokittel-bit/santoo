/**
 * SANTOO - Bible Admin JavaScript
 * Manages Bible posts creation, editing and disagreements moderation
 */

class BibleAdminManager {
  constructor() {
    this.currentPost = null;
    this.posts = [];
    this.disagreements = [];
    this.currentSection = 'create';
    
    this.init();
  }

  /**
   * Initialize Bible Admin functionality
   */
  init() {
    console.log('📖 Inicializando Bíblia Admin Manager...');
    
    this.setupEventListeners();
    this.setupFormValidation();
    this.loadPosts();
    this.loadDisagreements();
    this.updateStats();
  }

  /**
   * Setup event listeners for admin interface
   */
  setupEventListeners() {
    // Admin navigation buttons
    const adminCreateBtn = document.getElementById('adminCreatePostBtn');
    const adminManageBtn = document.getElementById('adminManagePostsBtn');
    const adminDisagreementsBtn = document.getElementById('adminDisagreementsBtn');

    if (adminCreateBtn) {
      adminCreateBtn.addEventListener('click', () => this.showSection('create'));
    }
    
    if (adminManageBtn) {
      adminManageBtn.addEventListener('click', () => {
        this.showSection('manage');
        this.loadPosts();
      });
    }
    
    if (adminDisagreementsBtn) {
      adminDisagreementsBtn.addEventListener('click', () => {
        this.showPage('bibleDisagreements');
      });
    }

    // Form submission
    const biblePostForm = document.getElementById('biblePostForm');
    if (biblePostForm) {
      biblePostForm.addEventListener('submit', (e) => this.handlePostSubmit(e));
    }

    // Form action buttons
    const previewBtn = document.getElementById('previewPostBtn');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    
    if (previewBtn) {
      previewBtn.addEventListener('click', () => this.previewPost());
    }
    
    if (saveDraftBtn) {
      saveDraftBtn.addEventListener('click', () => this.saveDraft());
    }

    // Filter buttons for posts management
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-filter]')) {
        this.filterPosts(e.target.dataset.filter);
        this.updateFilterButtons(e.target);
      }
      
      if (e.target.matches('[data-status]')) {
        this.filterDisagreements(e.target.dataset.status);
        this.updateStatusButtons(e.target);
      }
    });

    // Real-time form validation
    const form = document.getElementById('biblePostForm');
    if (form) {
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        input.addEventListener('input', () => this.validateField(input));
        input.addEventListener('blur', () => this.validateField(input));
      });
    }
  }

  /**
   * Show specific admin section
   */
  showSection(section) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(sec => {
      sec.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(`admin${section.charAt(0).toUpperCase() + section.slice(1)}Section`);
    if (targetSection) {
      targetSection.classList.add('active');
    }
    
    // Update navigation buttons
    document.querySelectorAll('.admin-nav .nav-link').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`admin${section.charAt(0).toUpperCase() + section.slice(1)}${section === 'create' ? 'Post' : 'Posts'}Btn`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
    
    this.currentSection = section;
  }

  /**
   * Show Bible Disagreements page
   */
  showPage(page) {
    // This will be handled by main navigation system
    // Hide current page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Show target page
    const targetPage = document.getElementById(page + 'Page');
    if (targetPage) {
      targetPage.classList.add('active');
    }
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    if (page === 'bibleDisagreements') {
      this.loadDisagreements();
    }
  }

  /**
   * Setup form validation
   */
  setupFormValidation() {
    const form = document.getElementById('biblePostForm');
    if (!form) return;

    // Bible reference pattern validation
    const verseRefInput = document.getElementById('verseReference');
    if (verseRefInput) {
      verseRefInput.addEventListener('input', (e) => {
        const pattern = /^[A-Za-zÀ-ÿ\s0-9]+\s\d+:\d+(-\d+)?$/;
        const isValid = pattern.test(e.target.value);
        
        if (e.target.value && !isValid) {
          this.showFieldError(e.target, 'Formato inválido. Use: Livro Capítulo:Versículo (ex: João 3:16)');
        } else {
          this.clearFieldError(e.target);
        }
      });
    }

    // Character count for title
    const titleInput = document.getElementById('postTitle');
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        const remaining = 200 - e.target.value.length;
        let small = e.target.nextElementSibling;
        if (small && small.tagName === 'SMALL') {
          small.textContent = `Título que aparecerá no feed (${remaining} caracteres restantes)`;
          if (remaining < 20) {
            small.style.color = 'var(--color-warning)';
          } else {
            small.style.color = 'var(--color-text-tertiary)';
          }
        }
      });
    }
  }

  /**
   * Validate individual field
   */
  validateField(field) {
    const value = field.value.trim();
    const isRequired = field.hasAttribute('required');
    
    // Clear previous errors
    this.clearFieldError(field);
    
    // Check required fields
    if (isRequired && !value) {
      this.showFieldError(field, 'Este campo é obrigatório');
      return false;
    }
    
    // Specific validations
    if (field.id === 'verseReference' && value) {
      const pattern = /^[A-Za-zÀ-ÿ\s0-9]+\s\d+:\d+(-\d+)?$/;
      if (!pattern.test(value)) {
        this.showFieldError(field, 'Formato inválido. Use: Livro Capítulo:Versículo');
        return false;
      }
    }
    
    // Minimum length for textareas
    if (field.tagName === 'TEXTAREA' && isRequired && value.length < 10) {
      this.showFieldError(field, 'Texto muito curto. Mínimo 10 caracteres.');
      return false;
    }
    
    return true;
  }

  /**
   * Show field error
   */
  showFieldError(field, message) {
    field.style.borderColor = 'var(--color-error)';
    
    // Remove existing error
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
    
    // Add error message
    const errorEl = document.createElement('small');
    errorEl.className = 'field-error';
    errorEl.style.color = 'var(--color-error)';
    errorEl.textContent = message;
    field.parentNode.appendChild(errorEl);
  }

  /**
   * Clear field error
   */
  clearFieldError(field) {
    field.style.borderColor = 'var(--color-border-primary)';
    
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
  }

  /**
   * Handle form submission
   */
  async handlePostSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const submitBtn = document.getElementById('publishPostBtn');
    
    // Validate all fields
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });
    
    if (!isValid) {
      this.showAlert('Por favor, corrija os erros no formulário antes de continuar.', 'error');
      return;
    }
    
    // Show loading state
    this.setButtonLoading(submitBtn, true);
    
    try {
      // Prepare data for API
      const postData = {
        title: formData.get('title'),
        verse_reference: formData.get('verse_reference'),
        original_text: formData.get('original_text'),
        historical_context: formData.get('historical_context'),
        modern_translation: formData.get('modern_translation'),
        practical_meaning: formData.get('practical_meaning'),
        modern_application: formData.get('modern_application'),
        curiosities: formData.get('curiosities') || '',
        category: formData.get('category'),
        tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : [],
        is_active: formData.get('status') === 'published'
      };
      
      // Send to API
      const response = await API.post('/bible-posts', postData);
      
      if (response.success) {
        this.showAlert('Post criado com sucesso! 🎉', 'success');
        this.clearForm();
        this.loadPosts();
        this.updateStats();
        
        // If published, show success with engagement info
        if (postData.is_active) {
          setTimeout(() => {
            this.showAlert('Post publicado e já disponível no feed dos usuários!', 'success');
          }, 2000);
        }
      } else {
        throw new Error(response.message || 'Erro ao criar post');
      }
      
    } catch (error) {
      console.error('Erro ao criar post:', error);
      this.showAlert(`Erro ao criar post: ${error.message}`, 'error');
    } finally {
      this.setButtonLoading(submitBtn, false);
    }
  }

  /**
   * Preview post before publishing
   */
  previewPost() {
    const form = document.getElementById('biblePostForm');
    if (!form) return;
    
    // Get form data
    const formData = new FormData(form);
    const postData = {
      title: formData.get('title'),
      verse_reference: formData.get('verse_reference'),
      original_text: formData.get('original_text'),
      historical_context: formData.get('historical_context'),
      modern_translation: formData.get('modern_translation'),
      practical_meaning: formData.get('practical_meaning'),
      modern_application: formData.get('modern_application'),
      curiosities: formData.get('curiosities'),
      category: formData.get('category')
    };
    
    // Create preview modal
    this.showPreviewModal(postData);
  }

  /**
   * Save post as draft
   */
  async saveDraft() {
    const form = document.getElementById('biblePostForm');
    if (!form) return;
    
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    this.setButtonLoading(saveDraftBtn, true);
    
    try {
      const formData = new FormData(form);
      const postData = {
        title: formData.get('title'),
        verse_reference: formData.get('verse_reference'),
        original_text: formData.get('original_text'),
        historical_context: formData.get('historical_context'),
        modern_translation: formData.get('modern_translation'),
        practical_meaning: formData.get('practical_meaning'),
        modern_application: formData.get('modern_application'),
        curiosities: formData.get('curiosities') || '',
        category: formData.get('category'),
        tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : [],
        is_active: false // Always save as draft
      };
      
      const response = await API.post('/bible-posts', postData);
      
      if (response.success) {
        this.showAlert('Rascunho salvo com sucesso! 📝', 'success');
        this.loadPosts();
        this.updateStats();
      } else {
        throw new Error(response.message || 'Erro ao salvar rascunho');
      }
      
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
      this.showAlert(`Erro ao salvar rascunho: ${error.message}`, 'error');
    } finally {
      this.setButtonLoading(saveDraftBtn, false);
    }
  }

  /**
   * Load posts for management
   */
  async loadPosts() {
    const postsList = document.getElementById('postsList');
    if (!postsList) return;
    
    // Show loading state
    postsList.innerHTML = `
      <div class="loading-posts" style="text-align: center; padding: var(--space-8);">
        <i data-lucide="loader" class="loading-icon"></i>
        <p>Carregando posts...</p>
      </div>
    `;
    
    // Re-init lucide icons for the loading icon
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    try {
      const response = await API.get('/bible-posts?admin=true');
      
      if (response.success) {
        this.posts = response.posts || [];
        this.renderPostsList();
      } else {
        throw new Error('Erro ao carregar posts');
      }
      
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
      postsList.innerHTML = `
        <div class="error-state" style="text-align: center; padding: var(--space-8);">
          <i data-lucide="alert-circle" style="width: 48px; height: 48px; color: var(--color-error); margin-bottom: var(--space-4);"></i>
          <h3>Erro ao carregar posts</h3>
          <p>Tente novamente em alguns instantes.</p>
          <button class="nav-link" onclick="bibleAdmin.loadPosts()">
            <i class="nav-icon" data-lucide="refresh-cw"></i>
            <span class="nav-text">Tentar Novamente</span>
          </button>
        </div>
      `;
      
      // Re-init lucide icons
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  }

  /**
   * Render posts list
   */
  renderPostsList() {
    const postsList = document.getElementById('postsList');
    if (!postsList || !this.posts) return;
    
    if (this.posts.length === 0) {
      postsList.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: var(--space-8);">
          <i data-lucide="book-open" style="width: 48px; height: 48px; color: var(--color-text-tertiary); margin-bottom: var(--space-4);"></i>
          <h3>Nenhum post encontrado</h3>
          <p>Comece criando seu primeiro post da Bíblia Explicada!</p>
          <button class="nav-link active" onclick="bibleAdmin.showSection('create')">
            <i class="nav-icon" data-lucide="plus-circle"></i>
            <span class="nav-text">Criar Primeiro Post</span>
          </button>
        </div>
      `;
      
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      return;
    }
    
    const postsHtml = this.posts.map(post => this.renderPostItem(post)).join('');
    postsList.innerHTML = postsHtml;
    
    // Re-init lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  /**
   * Render individual post item
   */
  renderPostItem(post) {
    const createdDate = new Date(post.created_at).toLocaleDateString('pt-BR');
    const isPublished = post.is_active;
    const statusClass = isPublished ? 'published' : 'draft';
    const statusText = isPublished ? 'Publicado' : 'Rascunho';
    const statusIcon = isPublished ? 'check-circle' : 'edit';
    
    return `
      <div class="post-item" data-post-id="${post.id}">
        <div class="post-item-header">
          <h4 class="post-item-title">${post.title}</h4>
          <div class="status-badge ${statusClass}">
            <i data-lucide="${statusIcon}" style="width: 14px; height: 14px;"></i>
            ${statusText}
          </div>
        </div>
        
        <div class="post-item-meta">
          <span>📖 ${post.verse_reference}</span>
          <span>📅 ${createdDate}</span>
          <span>👁️ ${post.views_count || 0} visualizações</span>
          <span>🙏 ${post.amen_count || 0} amém</span>
        </div>
        
        <div class="post-item-excerpt">
          ${post.practical_meaning?.substring(0, 200)}...
        </div>
        
        <div class="post-item-actions">
          <button class="nav-link" onclick="bibleAdmin.editPost('${post.id}')">
            <i class="nav-icon" data-lucide="edit"></i>
            <span class="nav-text">Editar</span>
          </button>
          <button class="nav-link" onclick="bibleAdmin.viewPost('${post.id}')">
            <i class="nav-icon" data-lucide="eye"></i>
            <span class="nav-text">Visualizar</span>
          </button>
          ${isPublished ? 
            `<button class="nav-link" onclick="bibleAdmin.unpublishPost('${post.id}')">
              <i class="nav-icon" data-lucide="eye-off"></i>
              <span class="nav-text">Despublicar</span>
            </button>` :
            `<button class="nav-link active" onclick="bibleAdmin.publishPost('${post.id}')">
              <i class="nav-icon" data-lucide="send"></i>
              <span class="nav-text">Publicar</span>
            </button>`
          }
          <button class="nav-link" onclick="bibleAdmin.deletePost('${post.id}')" style="color: var(--color-error);">
            <i class="nav-icon" data-lucide="trash-2"></i>
            <span class="nav-text">Excluir</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Load disagreements for moderation
   */
  async loadDisagreements() {
    const disagreementsList = document.getElementById('disagreementsList');
    if (!disagreementsList) return;
    
    // Show loading state
    disagreementsList.innerHTML = `
      <div class="loading-disagreements" style="text-align: center; padding: var(--space-8);">
        <i data-lucide="loader" class="loading-icon"></i>
        <p>Carregando discordâncias...</p>
      </div>
    `;
    
    // Re-init lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    try {
      const response = await API.get('/bible-posts/admin/disagreements');
      
      if (response.success) {
        this.disagreements = response.disagreements || [];
        this.renderDisagreementsList();
        this.updateDisagreementsStats();
      } else {
        throw new Error('Erro ao carregar discordâncias');
      }
      
    } catch (error) {
      console.error('Erro ao carregar discordâncias:', error);
      disagreementsList.innerHTML = `
        <div class="error-state" style="text-align: center; padding: var(--space-8);">
          <i data-lucide="alert-circle" style="width: 48px; height: 48px; color: var(--color-error); margin-bottom: var(--space-4);"></i>
          <h3>Erro ao carregar discordâncias</h3>
          <p>Tente novamente em alguns instantes.</p>
          <button class="nav-link" onclick="bibleAdmin.loadDisagreements()">
            <i class="nav-icon" data-lucide="refresh-cw"></i>
            <span class="nav-text">Tentar Novamente</span>
          </button>
        </div>
      `;
      
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  }

  /**
   * Render disagreements list
   */
  renderDisagreementsList() {
    const disagreementsList = document.getElementById('disagreementsList');
    if (!disagreementsList || !this.disagreements) return;
    
    if (this.disagreements.length === 0) {
      disagreementsList.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: var(--space-8);">
          <i data-lucide="message-square" style="width: 48px; height: 48px; color: var(--color-text-tertiary); margin-bottom: var(--space-4);"></i>
          <h3>Nenhuma discordância encontrada</h3>
          <p>Quando usuários discordarem de explicações, aparecerão aqui para moderação.</p>
        </div>
      `;
      
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      return;
    }
    
    const disagreementsHtml = this.disagreements.map(disagreement => this.renderDisagreementItem(disagreement)).join('');
    disagreementsList.innerHTML = disagreementsHtml;
    
    // Re-init lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  /**
   * Render individual disagreement item
   */
  renderDisagreementItem(disagreement) {
    const createdDate = new Date(disagreement.created_at).toLocaleDateString('pt-BR');
    const statusClass = disagreement.status || 'pending';
    
    return `
      <div class="disagreement-item ${statusClass}" data-disagreement-id="${disagreement.id}">
        <div class="disagreement-header">
          <div class="disagreement-user">
            <i data-lucide="user" style="width: 16px; height: 16px;"></i>
            ${disagreement.User?.username || 'Usuário'}
          </div>
          <div class="disagreement-date">${createdDate}</div>
        </div>
        
        <div class="disagreement-post">
          <div class="disagreement-post-title">
            📖 ${disagreement.BiblePost?.title || 'Post não encontrado'}
          </div>
          <div style="font-size: var(--font-size-sm); color: var(--color-text-tertiary);">
            ${disagreement.BiblePost?.verse_reference}
          </div>
        </div>
        
        <div class="disagreement-reason">
          <strong>Motivo:</strong> "${disagreement.reason}"
        </div>
        
        ${disagreement.description ? `
          <div class="disagreement-description">
            "${disagreement.description}"
          </div>
        ` : ''}
        
        ${disagreement.admin_response ? `
          <div class="admin-response" style="background: var(--color-bg-primary); border: 1px solid var(--color-accent); border-radius: var(--radius-md); padding: var(--space-3); margin: var(--space-3) 0;">
            <div style="font-weight: 600; color: var(--color-accent); margin-bottom: var(--space-1);">
              <i data-lucide="message-circle" style="width: 14px; height: 14px;"></i>
              Resposta do Administrador:
            </div>
            <div>${disagreement.admin_response}</div>
          </div>
        ` : ''}
        
        <div class="disagreement-actions">
          ${disagreement.status === 'pending' ? `
            <button class="nav-link" onclick="bibleAdmin.viewOriginalPost('${disagreement.bible_post_id}')">
              <i class="nav-icon" data-lucide="eye"></i>
              <span class="nav-text">Ver Post Original</span>
            </button>
            <button class="nav-link" onclick="bibleAdmin.respondDisagreement('${disagreement.id}', 'accept')">
              <i class="nav-icon" data-lucide="check"></i>
              <span class="nav-text">Aceitar</span>
            </button>
            <button class="nav-link" onclick="bibleAdmin.respondDisagreement('${disagreement.id}', 'reject')">
              <i class="nav-icon" data-lucide="x"></i>
              <span class="nav-text">Rejeitar</span>
            </button>
            <button class="nav-link active" onclick="bibleAdmin.respondDisagreement('${disagreement.id}', 'respond')">
              <i class="nav-icon" data-lucide="message-circle"></i>
              <span class="nav-text">Responder</span>
            </button>
          ` : `
            <span class="status-badge ${statusClass}" style="margin-left: auto;">
              <i data-lucide="${disagreement.status === 'accepted' ? 'check-circle' : disagreement.status === 'rejected' ? 'x-circle' : 'clock'}" style="width: 14px; height: 14px;"></i>
              ${disagreement.status === 'accepted' ? 'Aceita' : disagreement.status === 'rejected' ? 'Rejeitada' : 'Revisada'}
            </span>
          `}
        </div>
      </div>
    `;
  }

  /**
   * Update statistics
   */
  async updateStats() {
    try {
      // Get posts stats
      const totalEl = document.getElementById('adminStatsTotal');
      const activeEl = document.getElementById('adminStatsActive');
      const draftsEl = document.getElementById('adminStatsDrafts');
      
      if (totalEl && this.posts) {
        const total = this.posts.length;
        const active = this.posts.filter(p => p.is_active).length;
        const drafts = total - active;
        
        totalEl.textContent = total;
        if (activeEl) activeEl.textContent = active;
        if (draftsEl) draftsEl.textContent = drafts;
      }
      
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    }
  }

  /**
   * Update disagreements statistics
   */
  updateDisagreementsStats() {
    const pendingEl = document.getElementById('disagreementsPending');
    const reviewedEl = document.getElementById('disagreementsReviewed');
    const acceptedEl = document.getElementById('disagreementsAccepted');
    
    if (this.disagreements) {
      const pending = this.disagreements.filter(d => d.status === 'pending').length;
      const reviewed = this.disagreements.filter(d => d.status === 'reviewed').length;
      const accepted = this.disagreements.filter(d => d.status === 'accepted').length;
      
      if (pendingEl) pendingEl.textContent = pending;
      if (reviewedEl) reviewedEl.textContent = reviewed;
      if (acceptedEl) acceptedEl.textContent = accepted;
    }
  }

  /**
   * Utility Functions
   */
  
  clearForm() {
    const form = document.getElementById('biblePostForm');
    if (form) {
      form.reset();
      
      // Clear any validation errors
      form.querySelectorAll('.field-error').forEach(error => error.remove());
      form.querySelectorAll('input, textarea, select').forEach(field => {
        field.style.borderColor = 'var(--color-border-primary)';
      });
    }
  }

  setButtonLoading(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
      button.disabled = true;
      button.classList.add('loading');
      
      const icon = button.querySelector('.nav-icon');
      if (icon) {
        icon.setAttribute('data-lucide', 'loader');
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }
    } else {
      button.disabled = false;
      button.classList.remove('loading');
      
      // Restore original icon based on button ID
      const icon = button.querySelector('.nav-icon');
      if (icon) {
        const originalIcon = button.id.includes('publish') ? 'send' : 
                           button.id.includes('save') ? 'save' : 
                           button.id.includes('preview') ? 'eye' : 'plus-circle';
        icon.setAttribute('data-lucide', originalIcon);
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }
    }
  }

  showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `admin-alert alert-${type}`;
    alert.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      z-index: 10000;
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-${type === 'error' ? 'error' : type === 'success' ? 'success' : 'info'});
      border-radius: var(--radius-lg);
      padding: var(--space-4) var(--space-5);
      color: var(--color-text-primary);
      font-family: var(--font-primary);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      max-width: 400px;
    `;
    
    alert.innerHTML = `
      <div style="display: flex; align-items: center; gap: var(--space-2);">
        <i data-lucide="${type === 'error' ? 'alert-circle' : type === 'success' ? 'check-circle' : 'info'}" 
           style="width: 20px; height: 20px; color: var(--color-${type === 'error' ? 'error' : type === 'success' ? 'success' : 'info'});"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: none; border: none; color: var(--color-text-tertiary); cursor: pointer; margin-left: auto;">
          <i data-lucide="x" style="width: 16px; height: 16px;"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(alert);
    
    // Re-init lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Animate in
    setTimeout(() => {
      alert.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (alert.parentElement) {
        alert.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (alert.parentElement) {
            alert.remove();
          }
        }, 300);
      }
    }, 5000);
  }

  // Placeholder methods for post management
  editPost(postId) {
    console.log('Edit post:', postId);
    // TODO: Implement edit functionality
  }

  viewPost(postId) {
    console.log('View post:', postId);
    // TODO: Implement view functionality
  }

  publishPost(postId) {
    console.log('Publish post:', postId);
    // TODO: Implement publish functionality
  }

  unpublishPost(postId) {
    console.log('Unpublish post:', postId);
    // TODO: Implement unpublish functionality
  }

  deletePost(postId) {
    console.log('Delete post:', postId);
    // TODO: Implement delete functionality
  }

  // Disagreement management methods
  viewOriginalPost(postId) {
    console.log('View original post:', postId);
    // TODO: Implement view original post
  }

  respondDisagreement(disagreementId, action) {
    console.log('Respond to disagreement:', disagreementId, action);
    // TODO: Implement disagreement response
  }

  // Filter methods
  filterPosts(filter) {
    console.log('Filter posts:', filter);
    // TODO: Implement post filtering
  }

  filterDisagreements(status) {
    console.log('Filter disagreements:', status);
    // TODO: Implement disagreement filtering
  }

  updateFilterButtons(activeBtn) {
    // Update button states
    activeBtn.parentElement.querySelectorAll('.nav-link').forEach(btn => {
      btn.classList.remove('active');
    });
    activeBtn.classList.add('active');
  }

  updateStatusButtons(activeBtn) {
    // Update button states
    activeBtn.parentElement.querySelectorAll('.nav-link').forEach(btn => {
      btn.classList.remove('active');
    });
    activeBtn.classList.add('active');
  }

  showPreviewModal(postData) {
    console.log('Show preview modal:', postData);
    // TODO: Implement preview modal
  }
}

// Initialize Bible Admin Manager when DOM is ready
let bibleAdmin;

// Initialize on DOM ready or immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bibleAdmin = new BibleAdminManager();
  });
} else {
  bibleAdmin = new BibleAdminManager();
}

// Export for global access
window.bibleAdmin = bibleAdmin;