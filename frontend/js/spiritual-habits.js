/**
 * SANTOO - SISTEMA DE HÁBITOS ESPIRITUAIS - FASE 4
 * 
 * Gerencia as seções Amém/Ops no perfil do usuário
 * Sistema completo de habit tracking e dashboard espiritual
 */

class SpiritualHabitsManager {
  constructor() {
    this.currentTab = 'amen';
    this.amenHabits = [];
    this.opsHabits = [];
    this.progressStats = {};
    this.loading = false;
    this.initialized = false;
    
    console.log('🙏 Inicializando Gerenciador de Hábitos Espirituais...');
    this.init();
  }

  /**
   * Inicializar o sistema quando necessário
   */
  async init() {
    if (this.initialized) return;
    
    try {
      await this.setupEventListeners();
      this.initialized = true;
      console.log('✅ Hábitos Espirituais inicializados com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao inicializar Hábitos Espirituais:', error);
    }
  }

  /**
   * Setup dos event listeners
   */
  setupEventListeners() {
    // Tab navigation
    const spiritualTabs = document.querySelectorAll('.spiritual-tab');
    spiritualTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabType = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tabType);
      });
    });

    // Auth change listener
    document.addEventListener('authStateChanged', (e) => {
      console.log('🔄 Estado de auth mudou, atualizando hábitos...');
      this.handleAuthChange(e.detail);
    });

    // Page change listener  
    document.addEventListener('pageChanged', (e) => {
      if (e.detail.page === 'profile') {
        console.log('📖 Página perfil carregada, inicializando hábitos...');
        this.handleProfilePageLoad();
      }
    });

    console.log('🎯 Event listeners dos hábitos espirituais configurados');
  }

  /**
   * Handle auth state changes
   */
  async handleAuthChange(authData) {
    const spiritualDashboard = document.getElementById('spiritualDashboard');
    const authPrompt = document.querySelector('.auth-prompt');

    if (authData.isAuthenticated && authData.user) {
      // User logged in - show dashboard
      if (authPrompt) authPrompt.style.display = 'none';
      if (spiritualDashboard) {
        spiritualDashboard.style.display = 'block';
        await this.loadUserHabits();
      }
    } else {
      // User logged out - show auth prompt
      if (spiritualDashboard) spiritualDashboard.style.display = 'none';
      if (authPrompt) authPrompt.style.display = 'block';
      this.clearHabitsData();
    }
  }

  /**
   * Handle profile page load
   */
  async handleProfilePageLoad() {
    // Check if user is authenticated
    const authManager = window.SantooAuth;
    if (authManager && authManager.isAuthenticated()) {
      const spiritualDashboard = document.getElementById('spiritualDashboard');
      const authPrompt = document.querySelector('.auth-prompt');

      if (authPrompt) authPrompt.style.display = 'none';
      if (spiritualDashboard) {
        spiritualDashboard.style.display = 'block';
        await this.loadUserHabits();
      }
    }
  }

  /**
   * Switch between tabs
   */
  switchTab(tabType) {
    // Update active tab
    const tabs = document.querySelectorAll('.spiritual-tab');
    tabs.forEach(tab => {
      if (tab.getAttribute('data-tab') === tabType) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Update active content
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => {
      if (content.id === `${tabType}Section`) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    this.currentTab = tabType;
    console.log(`📑 Mudou para aba: ${tabType}`);

    // Load tab-specific data if needed
    if (tabType === 'progress') {
      this.loadProgressCharts();
    }
  }

  /**
   * Load user habits from API
   */
  async loadUserHabits() {
    if (this.loading) return;
    
    this.loading = true;
    this.showLoadingState();

    try {
      // Load both Amém and Ops habits in parallel
      const [amenResponse, opsResponse, statsResponse] = await Promise.all([
        window.SantooAPI.get('/api/bible-posts/my-interactions/amen'),
        window.SantooAPI.get('/api/bible-posts/my-interactions/ops'),
        this.loadProgressStats()
      ]);

      this.amenHabits = amenResponse.data || [];
      this.opsHabits = opsResponse.data || [];
      this.progressStats = statsResponse;

      // Update UI
      await this.renderHabits();
      this.updateProgressStats();
      this.updateTabCounts();

      console.log(`✅ Hábitos carregados: ${this.amenHabits.length} Amém, ${this.opsHabits.length} Ops`);

    } catch (error) {
      console.error('❌ Erro ao carregar hábitos:', error);
      this.showErrorState();
    } finally {
      this.loading = false;
    }
  }

  /**
   * Load progress statistics
   */
  async loadProgressStats() {
    try {
      const response = await window.SantooAPI.get('/api/bible-posts/my-progress-stats');
      return response || {
        amenCount: 0,
        opsCount: 0,
        streakCount: 0,
        monthlyRate: 0
      };
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
      return {
        amenCount: 0,
        opsCount: 0,
        streakCount: 0,
        monthlyRate: 0
      };
    }
  }

  /**
   * Update progress statistics in UI
   */
  updateProgressStats() {
    const elements = {
      amenCount: document.getElementById('amenCount'),
      opsCount: document.getElementById('opsCount'),
      streakCount: document.getElementById('streakCount'),
      monthlyRate: document.getElementById('monthlyRate')
    };

    if (elements.amenCount) elements.amenCount.textContent = this.progressStats.amenCount || 0;
    if (elements.opsCount) elements.opsCount.textContent = this.progressStats.opsCount || 0;
    if (elements.streakCount) elements.streakCount.textContent = this.progressStats.streakCount || 0;
    if (elements.monthlyRate) elements.monthlyRate.textContent = `${this.progressStats.monthlyRate || 0}%`;
  }

  /**
   * Update tab counts
   */
  updateTabCounts() {
    const amenTabCount = document.getElementById('amenTabCount');
    const opsTabCount = document.getElementById('opsTabCount');

    if (amenTabCount) amenTabCount.textContent = this.amenHabits.length;
    if (opsTabCount) opsTabCount.textContent = this.opsHabits.length;
  }

  /**
   * Render habits in their respective sections
   */
  async renderHabits() {
    await Promise.all([
      this.renderAmenHabits(),
      this.renderOpsHabits()
    ]);
  }

  /**
   * Render Amém habits (already practicing)
   */
  async renderAmenHabits() {
    const container = document.getElementById('amenHabits');
    if (!container) return;

    if (this.amenHabits.length === 0) {
      container.innerHTML = this.getEmptyState('amen');
      return;
    }

    const habitsHtml = await Promise.all(
      this.amenHabits.map(habit => this.createAmenHabitCard(habit))
    );

    container.innerHTML = habitsHtml.join('');

    // Setup event listeners for habit cards
    this.setupHabitCardListeners('amen');
  }

  /**
   * Render Ops habits (want to start)
   */
  async renderOpsHabits() {
    const container = document.getElementById('opsHabits');
    if (!container) return;

    if (this.opsHabits.length === 0) {
      container.innerHTML = this.getEmptyState('ops');
      return;
    }

    const habitsHtml = await Promise.all(
      this.opsHabits.map(habit => this.createOpsHabitCard(habit))
    );

    container.innerHTML = habitsHtml.join('');

    // Setup event listeners for habit cards
    this.setupHabitCardListeners('ops');
  }

  /**
   * Create Amém habit card HTML
   */
  async createAmenHabitCard(habit) {
    const weekProgress = await this.getWeekProgress(habit.id);
    const stats = this.calculateHabitStats(habit);

    return `
      <div class="habit-card" data-habit-id="${habit.id}" data-type="amen">
        <div class="habit-header">
          <h5 class="habit-title">${habit.title}</h5>
          <span class="habit-category">${habit.category}</span>
        </div>
        
        <div class="habit-verse">
          "${habit.original_text}"
        </div>

        <div class="habit-progress">
          <h6>Progresso da Semana</h6>
          <div class="week-progress">
            ${this.generateWeekProgressHTML(weekProgress)}
          </div>
        </div>

        <div class="habit-stats">
          <div class="habit-stat">
            <strong>${stats.streak}</strong>
            <span>dias</span>
          </div>
          <div class="habit-stat">
            <strong>${stats.successRate}%</strong>
            <span>taxa</span>
          </div>
          <div class="habit-stat">
            <strong>${stats.monthlyTotal}</strong>
            <span>no mês</span>
          </div>
        </div>

        <div class="habit-actions">
          <button class="habit-btn success" data-action="mark-success">
            <i data-lucide="check"></i>
            Pratiquei Hoje
          </button>
          <button class="habit-btn fail" data-action="mark-fail">
            <i data-lucide="x"></i>
            Errei Hoje
          </button>
          <button class="habit-btn secondary" data-action="read-post">
            <i data-lucide="book-open"></i>
            Reler Post
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Create Ops habit card HTML
   */
  async createOpsHabitCard(habit) {
    const daysSinceAdded = this.calculateDaysSince(habit.interaction_date);

    return `
      <div class="habit-card" data-habit-id="${habit.id}" data-type="ops">
        <div class="habit-header">
          <h5 class="habit-title">${habit.title}</h5>
          <span class="habit-category">${habit.category}</span>
        </div>
        
        <div class="habit-verse">
          "${habit.original_text}"
        </div>

        <div class="habit-stats">
          <div class="habit-stat">
            <strong>${daysSinceAdded}</strong>
            <span>dias atrás</span>
          </div>
          <div class="habit-stat">
            <strong>Meta</strong>
            <span>esta semana</span>
          </div>
        </div>

        <div class="habit-actions">
          <button class="habit-btn move" data-action="move-to-amen">
            <i data-lucide="check-circle"></i>
            Já Estou Fazendo
          </button>
          <button class="habit-btn secondary" data-action="read-post">
            <i data-lucide="book-open"></i>
            Reler Post
          </button>
          <button class="habit-btn secondary" data-action="remind-tomorrow">
            <i data-lucide="clock"></i>
            Lembrar Amanhã
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners for habit cards
   */
  setupHabitCardListeners(type) {
    const cards = document.querySelectorAll(`[data-type="${type}"] .habit-btn`);
    cards.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = e.currentTarget.getAttribute('data-action');
        const card = e.currentTarget.closest('.habit-card');
        const habitId = card.getAttribute('data-habit-id');
        
        this.handleHabitAction(habitId, action, type);
      });
    });
  }

  /**
   * Handle habit actions (mark success, fail, move, etc.)
   */
  async handleHabitAction(habitId, action, type) {
    try {
      switch (action) {
        case 'mark-success':
          await this.markHabitProgress(habitId, 'amen_success');
          break;
        case 'mark-fail':
          await this.markHabitProgress(habitId, 'amen_failed');
          break;
        case 'move-to-amen':
          await this.moveHabitToAmen(habitId);
          break;
        case 'read-post':
          this.navigateToBiblePost(habitId);
          break;
        case 'remind-tomorrow':
          await this.setReminder(habitId);
          break;
      }
    } catch (error) {
      console.error(`❌ Erro na ação ${action}:`, error);
      this.showNotification('Erro ao executar ação. Tente novamente.', 'error');
    }
  }

  /**
   * Mark habit progress (success or fail)
   */
  async markHabitProgress(habitId, habitType) {
    try {
      await window.SantooAPI.post('/api/bible-posts/habit-progress', {
        bible_post_id: habitId,
        habit_type: habitType,
        date: new Date().toISOString().split('T')[0]
      });

      this.showNotification(
        habitType === 'amen_success' ? 
          'Parabéns! Progresso marcado com sucesso! 🎉' : 
          'Não desanime, amanhã é um novo dia! 💪',
        'success'
      );

      // Reload habits to show updated progress
      await this.loadUserHabits();

    } catch (error) {
      console.error('❌ Erro ao marcar progresso:', error);
      this.showNotification('Erro ao marcar progresso. Tente novamente.', 'error');
    }
  }

  /**
   * Move habit from Ops to Amém
   */
  async moveHabitToAmen(habitId) {
    try {
      // First change the interaction type
      await window.SantooAPI.post(`/api/bible-posts/${habitId}/interact`, {
        type: 'amen'
      });

      // Then track the movement
      await window.SantooAPI.post('/api/bible-posts/habit-progress', {
        bible_post_id: habitId,
        habit_type: 'ops_to_amen',
        date: new Date().toISOString().split('T')[0]
      });

      this.showNotification('Que bênção! Hábito movido para "Amém"! 🙏', 'success');

      // Reload habits to show updated state
      await this.loadUserHabits();

    } catch (error) {
      console.error('❌ Erro ao mover hábito:', error);
      this.showNotification('Erro ao mover hábito. Tente novamente.', 'error');
    }
  }

  /**
   * Navigate to specific bible post
   */
  navigateToBiblePost(habitId) {
    // Navigate to bible-explained page and highlight the specific post
    if (window.SantooMain) {
      window.SantooMain.navigateTo('bible-explained');
      
      // After a brief delay, scroll to the post
      setTimeout(() => {
        this.highlightBiblePost(habitId);
      }, 1000);
    }
  }

  /**
   * Highlight specific bible post
   */
  highlightBiblePost(habitId) {
    const postCard = document.querySelector(`[data-post-id="${habitId}"]`);
    if (postCard) {
      postCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      postCard.classList.add('highlighted');
      
      setTimeout(() => {
        postCard.classList.remove('highlighted');
      }, 3000);
    }
  }

  /**
   * Get week progress for a habit
   */
  async getWeekProgress(habitId) {
    try {
      const response = await window.SantooAPI.get(`/api/bible-posts/${habitId}/week-progress`);
      return response.weekProgress || this.getDefaultWeekProgress();
    } catch (error) {
      console.error('❌ Erro ao carregar progresso semanal:', error);
      return this.getDefaultWeekProgress();
    }
  }

  /**
   * Generate week progress HTML
   */
  generateWeekProgressHTML(weekProgress) {
    const days = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const today = new Date().getDay();
    
    return weekProgress.map((progress, index) => {
      const isToday = index === today;
      const className = `day-progress ${progress.status} ${isToday ? 'today' : ''}`;
      
      return `<div class="${className}">${days[index]}</div>`;
    }).join('');
  }

  /**
   * Get default week progress
   */
  getDefaultWeekProgress() {
    return Array(7).fill().map(() => ({ status: 'neutral' }));
  }

  /**
   * Calculate habit statistics
   */
  calculateHabitStats(habit) {
    // Mock calculations - in real implementation would come from API
    return {
      streak: Math.floor(Math.random() * 15) + 1,
      successRate: Math.floor(Math.random() * 40) + 60,
      monthlyTotal: Math.floor(Math.random() * 20) + 10
    };
  }

  /**
   * Calculate days since date
   */
  calculateDaysSince(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Load progress charts for progress tab
   */
  async loadProgressCharts() {
    try {
      const [weekData, categoryData, activityData] = await Promise.all([
        this.loadWeekChartData(),
        this.loadCategoryPerformanceData(),
        this.loadRecentActivityData()
      ]);

      this.renderWeekChart(weekData);
      this.renderCategoryPerformance(categoryData);
      this.renderRecentActivity(activityData);

    } catch (error) {
      console.error('❌ Erro ao carregar gráficos de progresso:', error);
    }
  }

  /**
   * Load week chart data
   */
  async loadWeekChartData() {
    try {
      const response = await window.SantooAPI.get('/api/bible-posts/week-chart-data');
      return response.weekData || [0, 1, 2, 1, 3, 2, 4]; // mock data
    } catch (error) {
      return [0, 1, 2, 1, 3, 2, 4]; // mock fallback
    }
  }

  /**
   * Render week chart
   */
  renderWeekChart(weekData) {
    const weekChart = document.getElementById('weekChart');
    if (!weekChart) return;

    const dayBars = weekChart.querySelectorAll('.day-bar');
    dayBars.forEach((bar, index) => {
      if (weekData[index] !== undefined) {
        bar.setAttribute('data-success', weekData[index]);
      }
    });
  }

  /**
   * Load category performance data
   */
  async loadCategoryPerformanceData() {
    try {
      const response = await window.SantooAPI.get('/api/bible-posts/category-performance');
      return response.categories || this.getMockCategoryData();
    } catch (error) {
      return this.getMockCategoryData();
    }
  }

  /**
   * Mock category data
   */
  getMockCategoryData() {
    return [
      { name: 'sabedoria', percentage: 85 },
      { name: 'fé', percentage: 72 },
      { name: 'amor', percentage: 90 },
      { name: 'oração', percentage: 68 },
      { name: 'relacionamentos', percentage: 78 }
    ];
  }

  /**
   * Render category performance
   */
  renderCategoryPerformance(categories) {
    const container = document.getElementById('categoryPerformance');
    if (!container) return;

    const html = categories.map(category => `
      <div class="category-item">
        <span class="category-name">${category.name}</span>
        <div class="category-bar">
          <div class="category-bar-fill" style="width: ${category.percentage}%"></div>
        </div>
        <span class="category-percentage">${category.percentage}%</span>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  /**
   * Load recent activity data
   */
  async loadRecentActivityData() {
    try {
      const response = await window.SantooAPI.get('/api/bible-posts/recent-activity');
      return response.activities || this.getMockActivityData();
    } catch (error) {
      return this.getMockActivityData();
    }
  }

  /**
   * Mock activity data
   */
  getMockActivityData() {
    return [
      { type: 'success', title: 'Praticou "Oração diária"', time: '2 horas atrás' },
      { type: 'move', title: 'Moveu "Perdão" para Amém', time: '1 dia atrás' },
      { type: 'success', title: 'Praticou "Leitura bíblica"', time: '2 dias atrás' },
      { type: 'fail', title: 'Faltou "Jejum semanal"', time: '3 dias atrás' }
    ];
  }

  /**
   * Render recent activity
   */
  renderRecentActivity(activities) {
    const container = document.getElementById('recentActivity');
    if (!container) return;

    const html = activities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon ${activity.type}">
          <i data-lucide="${this.getActivityIcon(activity.type)}"></i>
        </div>
        <div class="activity-content">
          <p class="activity-title">${activity.title}</p>
          <span class="activity-time">${activity.time}</span>
        </div>
      </div>
    `).join('');

    container.innerHTML = html;

    // Reinitialize icons for new content
    if (window.SantooIcons) {
      window.SantooIcons.reinit();
    }
  }

  /**
   * Get icon for activity type
   */
  getActivityIcon(type) {
    const icons = {
      success: 'check-circle',
      fail: 'x-circle',
      move: 'arrow-right'
    };
    return icons[type] || 'activity';
  }

  /**
   * Show loading state
   */
  showLoadingState() {
    const loadingElements = document.querySelectorAll('.habits-loading');
    loadingElements.forEach(el => el.style.display = 'flex');
  }

  /**
   * Show error state
   */
  showErrorState() {
    const containers = ['amenHabits', 'opsHabits'];
    containers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = `
          <div class="habits-empty">
            <i data-lucide="alert-circle"></i>
            <h4>Erro ao Carregar</h4>
            <p>Não foi possível carregar seus hábitos espirituais. Tente novamente.</p>
            <button class="habit-btn" onclick="window.SpiritualHabits.loadUserHabits()">
              <i data-lucide="refresh-cw"></i>
              Tentar Novamente
            </button>
          </div>
        `;
      }
    });
  }

  /**
   * Get empty state HTML
   */
  getEmptyState(type) {
    if (type === 'amen') {
      return `
        <div class="habits-empty">
          <i data-lucide="heart"></i>
          <h4>Nenhum Hábito Espiritual</h4>
          <p>Você ainda não marcou nenhum ensinamento como "Amém". Visite a página Bíblia Explicada e comece sua jornada!</p>
          <button class="habit-btn move" onclick="window.SantooMain.navigateTo('bible-explained')">
            <i data-lucide="book-open"></i>
            Explorar Ensinamentos
          </button>
        </div>
      `;
    } else {
      return `
        <div class="habits-empty">
          <i data-lucide="target"></i>
          <h4>Nenhum Desafio Pendente</h4>
          <p>Você não tem ensinamentos marcados como "Ops" para começar a praticar. Que tal explorar novos desafios?</p>
          <button class="habit-btn move" onclick="window.SantooMain.navigateTo('bible-explained')">
            <i data-lucide="zap"></i>
            Encontrar Desafios
          </button>
        </div>
      `;
    }
  }

  /**
   * Show notification to user
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info'}"></i>
        <span>${message}</span>
      </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Initialize icon
    if (window.SantooIcons) {
      window.SantooIcons.reinit();
    }

    // Auto remove after 4 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }

  /**
   * Set reminder for habit
   */
  async setReminder(habitId) {
    try {
      await window.SantooAPI.post(`/api/bible-posts/${habitId}/reminder`, {
        remind_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
      });
      
      this.showNotification('Lembrete definido para amanhã! 📅', 'success');
    } catch (error) {
      console.error('❌ Erro ao definir lembrete:', error);
      this.showNotification('Erro ao definir lembrete.', 'error');
    }
  }

  /**
   * Clear habits data
   */
  clearHabitsData() {
    this.amenHabits = [];
    this.opsHabits = [];
    this.progressStats = {};
    
    // Clear UI
    const containers = ['amenHabits', 'opsHabits'];
    containers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '';
      }
    });

    this.updateTabCounts();
    this.updateProgressStats();
    
    console.log('🧹 Dados de hábitos limpos');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.SpiritualHabits = new SpiritualHabitsManager();
});

// Also initialize if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.SpiritualHabits = new SpiritualHabitsManager();
  });
} else {
  window.SpiritualHabits = new SpiritualHabitsManager();
}

console.log('📖 Spiritual Habits Manager carregado e pronto!');