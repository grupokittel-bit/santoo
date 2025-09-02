/**
 * SANTOO - UI Components
 * Reusable UI components and widgets
 */

/**
 * Toast Notification Component
 */
class Toast {
  constructor() {
    this.container = this.createContainer();
  }

  createContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 9999;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
      box-shadow: var(--shadow-dark-lg);
      border-left: 4px solid var(--color-${type === 'success' ? 'success' : type === 'error' ? 'error' : 'accent'});
      pointer-events: auto;
      cursor: pointer;
      animation: slideInRight 300ms ease-out;
      opacity: 1;
      transition: opacity 200ms ease-in-out;
    `;

    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span style="margin-right: 0.5rem;">${icon}</span>${message}`;

    // Click to dismiss
    toast.addEventListener('click', () => this.dismiss(toast));

    this.container.appendChild(toast);

    // Auto dismiss
    setTimeout(() => this.dismiss(toast), duration);

    return toast;
  }

  dismiss(toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 200);
  }

  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

/**
 * Video Player Component
 */
class VideoPlayer {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      autoplay: false,
      controls: true,
      muted: false,
      loop: false,
      ...options
    };
    
    this.init();
  }

  init() {
    this.createPlayer();
    this.setupControls();
    this.setupEvents();
  }

  createPlayer() {
    this.video = document.createElement('video');
    this.video.className = 'video-player';
    this.video.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
      background: var(--color-bg-primary);
      border-radius: var(--radius-lg);
    `;
    
    if (this.options.autoplay) this.video.autoplay = true;
    if (this.options.muted) this.video.muted = true;
    if (this.options.loop) this.video.loop = true;
    
    this.container.appendChild(this.video);
  }

  setupControls() {
    if (!this.options.controls) return;

    this.controls = document.createElement('div');
    this.controls.className = 'video-controls';
    this.controls.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.7));
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      opacity: 0;
      transition: opacity 200ms ease-in-out;
    `;

    // Play/Pause button
    this.playBtn = document.createElement('button');
    this.playBtn.innerHTML = '▶️';
    this.playBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 1.2rem;
    `;

    // Progress bar
    this.progressBar = document.createElement('input');
    this.progressBar.type = 'range';
    this.progressBar.min = 0;
    this.progressBar.max = 100;
    this.progressBar.value = 0;
    this.progressBar.style.cssText = `
      flex: 1;
      height: 4px;
      background: rgba(255,255,255,0.3);
      outline: none;
      border-radius: 2px;
    `;

    // Time display
    this.timeDisplay = document.createElement('span');
    this.timeDisplay.textContent = '0:00 / 0:00';
    this.timeDisplay.style.cssText = `
      color: white;
      font-size: 0.8rem;
      min-width: 5rem;
    `;

    this.controls.appendChild(this.playBtn);
    this.controls.appendChild(this.progressBar);
    this.controls.appendChild(this.timeDisplay);
    this.container.appendChild(this.controls);
  }

  setupEvents() {
    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => this.togglePlay());
    }

    if (this.progressBar) {
      this.progressBar.addEventListener('input', (e) => {
        const time = (e.target.value / 100) * this.video.duration;
        this.video.currentTime = time;
      });
    }

    this.video.addEventListener('timeupdate', () => this.updateProgress());
    this.video.addEventListener('loadedmetadata', () => this.updateDuration());
    
    // Show/hide controls on hover
    if (this.controls) {
      this.container.addEventListener('mouseenter', () => {
        this.controls.style.opacity = '1';
      });
      
      this.container.addEventListener('mouseleave', () => {
        this.controls.style.opacity = '0';
      });
    }
  }

  togglePlay() {
    if (this.video.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  play() {
    this.video.play();
    if (this.playBtn) this.playBtn.innerHTML = '⏸️';
  }

  pause() {
    this.video.pause();
    if (this.playBtn) this.playBtn.innerHTML = '▶️';
  }

  updateProgress() {
    if (!this.progressBar || !this.video.duration) return;
    
    const progress = (this.video.currentTime / this.video.duration) * 100;
    this.progressBar.value = progress;
    
    this.updateTimeDisplay();
  }

  updateDuration() {
    this.updateTimeDisplay();
  }

  updateTimeDisplay() {
    if (!this.timeDisplay) return;
    
    const current = this.formatTime(this.video.currentTime || 0);
    const duration = this.formatTime(this.video.duration || 0);
    this.timeDisplay.textContent = `${current} / ${duration}`;
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  loadVideo(src) {
    this.video.src = src;
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

/**
 * Loading Overlay Component
 */
class LoadingOverlay {
  constructor(container = document.body) {
    this.container = container;
    this.overlay = null;
  }

  show(message = 'Carregando...') {
    this.hide(); // Remove existing overlay
    
    this.overlay = document.createElement('div');
    this.overlay.className = 'loading-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(26, 26, 26, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9998;
      backdrop-filter: blur(4px);
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      color: white;
      text-align: center;
    `;

    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    
    const text = document.createElement('p');
    text.textContent = message;
    text.style.cssText = `
      margin: 0;
      font-size: 1rem;
      color: var(--color-text-primary);
    `;

    content.appendChild(spinner);
    content.appendChild(text);
    this.overlay.appendChild(content);
    
    this.container.appendChild(this.overlay);
    
    return this.overlay;
  }

  hide() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
      this.overlay = null;
    }
  }

  updateMessage(message) {
    if (this.overlay) {
      const text = this.overlay.querySelector('p');
      if (text) {
        text.textContent = message;
      }
    }
  }
}

/**
 * Confirm Dialog Component
 */
class ConfirmDialog {
  static show(message, title = 'Confirmar', options = {}) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(4px);
      `;

      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: var(--color-bg-secondary);
        border-radius: var(--radius-xl);
        padding: 2rem;
        max-width: 400px;
        width: 90%;
        box-shadow: var(--shadow-dark-xl);
      `;

      dialog.innerHTML = `
        <h3 style="margin: 0 0 1rem 0; color: var(--color-text-primary); font-size: 1.25rem;">${title}</h3>
        <p style="margin: 0 0 2rem 0; color: var(--color-text-secondary); line-height: 1.5;">${message}</p>
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
          <button class="btn btn-secondary" data-action="cancel">Cancelar</button>
          <button class="btn btn-primary" data-action="confirm">Confirmar</button>
        </div>
      `;

      const cleanup = (result) => {
        document.body.removeChild(overlay);
        resolve(result);
      };

      // Handle button clicks
      dialog.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (action === 'confirm') {
          cleanup(true);
        } else if (action === 'cancel') {
          cleanup(false);
        }
      });

      // Handle escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', handleEscape);
          cleanup(false);
        }
      };
      document.addEventListener('keydown', handleEscape);

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      // Focus confirm button
      setTimeout(() => {
        const confirmBtn = dialog.querySelector('[data-action="confirm"]');
        if (confirmBtn) confirmBtn.focus();
      }, 100);
    });
  }
}

// Create global instances
window.santooToast = new Toast();
window.santooLoading = new LoadingOverlay();
window.SantooComponents = {
  Toast,
  VideoPlayer,
  LoadingOverlay,
  ConfirmDialog
};

console.log('🧩 Santoo Components carregados');