/**
 * SANTOO - Video Player Module
 * Enhanced video player with custom controls and features
 */

class SantooVideoPlayer {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      autoplay: false,
      muted: false,
      loop: false,
      controls: true,
      pip: true, // Picture in Picture
      fullscreen: true,
      playbackSpeeds: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
      ...options
    };
    
    this.video = null;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
    this.volume = 1;
    this.playbackSpeed = 1;
    
    this.init();
  }

  /**
   * Initialize video player
   */
  init() {
    this.createPlayerStructure();
    this.setupEventListeners();
    console.log('🎬 Video Player inicializado');
  }

  /**
   * Create player HTML structure
   */
  createPlayerStructure() {
    this.container.className = 'santoo-video-player';
    this.container.style.cssText = `
      position: relative;
      width: 100%;
      background: var(--color-bg-primary);
      border-radius: var(--radius-lg);
      overflow: hidden;
    `;

    // Video element
    this.video = document.createElement('video');
    this.video.className = 'santoo-video';
    this.video.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #000;
    `;
    
    if (this.options.muted) this.video.muted = true;
    if (this.options.loop) this.video.loop = true;
    
    this.container.appendChild(this.video);

    // Create controls if enabled
    if (this.options.controls) {
      this.createControls();
    }

    // Create overlay elements
    this.createOverlays();
  }

  /**
   * Create video controls
   */
  createControls() {
    this.controls = document.createElement('div');
    this.controls.className = 'santoo-video-controls';
    this.controls.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      opacity: 0;
      transition: opacity 300ms ease-in-out;
      pointer-events: none;
    `;

    // Progress bar
    this.createProgressBar();
    
    // Control buttons row
    this.createControlButtons();
    
    this.container.appendChild(this.controls);
  }

  /**
   * Create progress bar
   */
  createProgressBar() {
    this.progressContainer = document.createElement('div');
    this.progressContainer.style.cssText = `
      position: relative;
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      cursor: pointer;
      pointer-events: auto;
    `;

    this.progressBar = document.createElement('div');
    this.progressBar.style.cssText = `
      height: 100%;
      background: var(--color-accent);
      border-radius: 2px;
      width: 0%;
      transition: width 100ms ease-out;
    `;

    this.progressContainer.appendChild(this.progressBar);
    this.controls.appendChild(this.progressContainer);
  }

  /**
   * Create control buttons
   */
  createControlButtons() {
    this.buttonsRow = document.createElement('div');
    this.buttonsRow.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      pointer-events: auto;
    `;

    // Left buttons group
    const leftButtons = document.createElement('div');
    leftButtons.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `;

    // Play/Pause button
    this.playButton = this.createButton('⏸️', 'Pausar');
    this.playButton.innerHTML = '▶️';
    
    // Volume button
    this.volumeButton = this.createButton('🔊', 'Volume');
    
    // Time display
    this.timeDisplay = document.createElement('span');
    this.timeDisplay.style.cssText = `
      color: white;
      font-size: 0.875rem;
      font-variant-numeric: tabular-nums;
    `;
    this.timeDisplay.textContent = '0:00 / 0:00';

    leftButtons.appendChild(this.playButton);
    leftButtons.appendChild(this.volumeButton);
    leftButtons.appendChild(this.timeDisplay);

    // Right buttons group
    const rightButtons = document.createElement('div');
    rightButtons.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `;

    // Speed button
    this.speedButton = this.createButton('1x', 'Velocidade');
    
    // Picture in Picture button
    if (this.options.pip && document.pictureInPictureEnabled) {
      this.pipButton = this.createButton('📺', 'Picture in Picture');
      rightButtons.appendChild(this.pipButton);
    }
    
    // Fullscreen button
    if (this.options.fullscreen) {
      this.fullscreenButton = this.createButton('⛶', 'Tela cheia');
      rightButtons.appendChild(this.fullscreenButton);
    }

    rightButtons.appendChild(this.speedButton);

    this.buttonsRow.appendChild(leftButtons);
    this.buttonsRow.appendChild(rightButtons);
    this.controls.appendChild(this.buttonsRow);
  }

  /**
   * Create control button
   */
  createButton(text, title) {
    const button = document.createElement('button');
    button.innerHTML = text;
    button.title = title;
    button.style.cssText = `
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: var(--radius-base);
      transition: background-color 200ms ease-in-out;
      font-size: 1rem;
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'transparent';
    });
    
    return button;
  }

  /**
   * Create overlay elements
   */
  createOverlays() {
    // Loading spinner
    this.loadingSpinner = document.createElement('div');
    this.loadingSpinner.className = 'loading-spinner';
    this.loadingSpinner.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: none;
    `;
    this.container.appendChild(this.loadingSpinner);

    // Play overlay (big play button)
    this.playOverlay = document.createElement('div');
    this.playOverlay.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 60px;
      height: 60px;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.5rem;
      color: white;
      transition: all 200ms ease-in-out;
    `;
    this.playOverlay.innerHTML = '▶️';
    this.container.appendChild(this.playOverlay);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Video events
    this.video.addEventListener('loadstart', () => this.onLoadStart());
    this.video.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
    this.video.addEventListener('canplay', () => this.onCanPlay());
    this.video.addEventListener('play', () => this.onPlay());
    this.video.addEventListener('pause', () => this.onPause());
    this.video.addEventListener('timeupdate', () => this.onTimeUpdate());
    this.video.addEventListener('ended', () => this.onEnded());
    this.video.addEventListener('error', (e) => this.onError(e));
    
    // Click to play/pause
    this.video.addEventListener('click', () => this.togglePlay());
    this.playOverlay.addEventListener('click', () => this.togglePlay());

    if (this.controls) {
      // Control button events
      this.playButton.addEventListener('click', () => this.togglePlay());
      this.volumeButton.addEventListener('click', () => this.toggleMute());
      
      if (this.speedButton) {
        this.speedButton.addEventListener('click', () => this.cycleSpeed());
      }
      
      if (this.pipButton) {
        this.pipButton.addEventListener('click', () => this.togglePictureInPicture());
      }
      
      if (this.fullscreenButton) {
        this.fullscreenButton.addEventListener('click', () => this.toggleFullscreen());
      }

      // Progress bar click
      this.progressContainer.addEventListener('click', (e) => {
        const rect = this.progressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickRatio = clickX / rect.width;
        this.seekTo(clickRatio * this.duration);
      });

      // Show/hide controls on hover
      this.container.addEventListener('mouseenter', () => this.showControls());
      this.container.addEventListener('mouseleave', () => this.hideControls());
      
      // Auto-hide controls after inactivity
      let hideTimer;
      this.container.addEventListener('mousemove', () => {
        this.showControls();
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => this.hideControls(), 3000);
      });
    }

    // Keyboard shortcuts
    this.container.addEventListener('keydown', (e) => this.handleKeyboard(e));
    this.container.tabIndex = 0; // Make container focusable
  }

  /**
   * Event handlers
   */
  onLoadStart() {
    this.showLoading();
  }

  onLoadedMetadata() {
    this.duration = this.video.duration;
    this.updateTimeDisplay();
  }

  onCanPlay() {
    this.hideLoading();
    if (this.options.autoplay) {
      this.play();
    }
  }

  onPlay() {
    this.isPlaying = true;
    this.playButton.innerHTML = '⏸️';
    this.playButton.title = 'Pausar';
    this.playOverlay.style.display = 'none';
  }

  onPause() {
    this.isPlaying = false;
    this.playButton.innerHTML = '▶️';
    this.playButton.title = 'Reproduzir';
    this.playOverlay.style.display = 'flex';
  }

  onTimeUpdate() {
    this.currentTime = this.video.currentTime;
    this.updateProgress();
    this.updateTimeDisplay();
  }

  onEnded() {
    this.isPlaying = false;
    this.playOverlay.style.display = 'flex';
    this.playOverlay.innerHTML = '🔄';
  }

  onError(e) {
    console.error('Erro no video player:', e);
    this.hideLoading();
    this.showError('Erro ao carregar o vídeo');
  }

  /**
   * Control methods
   */
  play() {
    if (this.video.paused) {
      this.video.play().catch(e => {
        console.error('Erro ao reproduzir:', e);
      });
    }
  }

  pause() {
    if (!this.video.paused) {
      this.video.pause();
    }
  }

  togglePlay() {
    if (this.video.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  seekTo(time) {
    this.video.currentTime = Math.max(0, Math.min(time, this.duration));
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.video.volume = this.volume;
    this.updateVolumeButton();
  }

  toggleMute() {
    this.video.muted = !this.video.muted;
    this.updateVolumeButton();
  }

  cycleSpeed() {
    const currentIndex = this.options.playbackSpeeds.indexOf(this.playbackSpeed);
    const nextIndex = (currentIndex + 1) % this.options.playbackSpeeds.length;
    this.playbackSpeed = this.options.playbackSpeeds[nextIndex];
    this.video.playbackRate = this.playbackSpeed;
    this.speedButton.textContent = `${this.playbackSpeed}x`;
  }

  async togglePictureInPicture() {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await this.video.requestPictureInPicture();
      }
    } catch (error) {
      console.error('Erro no Picture in Picture:', error);
    }
  }

  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.container.requestFullscreen().catch(err => {
        console.error('Erro ao entrar em tela cheia:', err);
      });
    }
  }

  /**
   * UI update methods
   */
  updateProgress() {
    if (this.progressBar && this.duration > 0) {
      const progress = (this.currentTime / this.duration) * 100;
      this.progressBar.style.width = `${progress}%`;
    }
  }

  updateTimeDisplay() {
    if (this.timeDisplay) {
      const current = this.formatTime(this.currentTime);
      const duration = this.formatTime(this.duration);
      this.timeDisplay.textContent = `${current} / ${duration}`;
    }
  }

  updateVolumeButton() {
    if (this.volumeButton) {
      if (this.video.muted || this.video.volume === 0) {
        this.volumeButton.innerHTML = '🔇';
        this.volumeButton.title = 'Ativar som';
      } else if (this.video.volume < 0.5) {
        this.volumeButton.innerHTML = '🔉';
        this.volumeButton.title = 'Volume';
      } else {
        this.volumeButton.innerHTML = '🔊';
        this.volumeButton.title = 'Volume';
      }
    }
  }

  showControls() {
    if (this.controls) {
      this.controls.style.opacity = '1';
    }
  }

  hideControls() {
    if (this.controls && this.isPlaying) {
      this.controls.style.opacity = '0';
    }
  }

  showLoading() {
    if (this.loadingSpinner) {
      this.loadingSpinner.style.display = 'block';
    }
  }

  hideLoading() {
    if (this.loadingSpinner) {
      this.loadingSpinner.style.display = 'none';
    }
  }

  showError(message) {
    // Create error overlay
    const errorOverlay = document.createElement('div');
    errorOverlay.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 1rem;
      border-radius: var(--radius-lg);
      text-align: center;
    `;
    errorOverlay.innerHTML = `
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚠️</div>
      <div>${message}</div>
    `;
    
    this.container.appendChild(errorOverlay);
    
    setTimeout(() => {
      if (errorOverlay.parentNode) {
        errorOverlay.parentNode.removeChild(errorOverlay);
      }
    }, 5000);
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboard(e) {
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        this.togglePlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.seekTo(this.currentTime - 10);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.seekTo(this.currentTime + 10);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.setVolume(this.volume + 0.1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.setVolume(this.volume - 0.1);
        break;
      case 'm':
        e.preventDefault();
        this.toggleMute();
        break;
      case 'f':
        e.preventDefault();
        this.toggleFullscreen();
        break;
    }
  }

  /**
   * Utility methods
   */
  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Load video source
   */
  loadVideo(src, poster = '') {
    this.video.src = src;
    if (poster) {
      this.video.poster = poster;
    }
    this.video.load();
  }

  /**
   * Destroy player and clean up
   */
  destroy() {
    if (this.video) {
      this.video.pause();
      this.video.src = '';
    }
    
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    console.log('🎬 Video Player destruído');
  }
}

// Export for global use
window.SantooVideoPlayer = SantooVideoPlayer;

console.log('🎬 Santoo Video Player carregado');