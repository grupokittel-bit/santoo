/**
 * SANTOO - Utility Functions
 * Helper functions and utilities used throughout the app
 */

/**
 * DOM Utilities
 */
const DOM = {
  /**
   * Safely query a single element
   */
  query(selector, context = document) {
    try {
      return context.querySelector(selector);
    } catch (error) {
      console.error('Invalid selector:', selector, error);
      return null;
    }
  },

  /**
   * Safely query multiple elements
   */
  queryAll(selector, context = document) {
    try {
      return Array.from(context.querySelectorAll(selector));
    } catch (error) {
      console.error('Invalid selector:', selector, error);
      return [];
    }
  },

  /**
   * Create element with attributes and content
   */
  create(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else if (key === 'textContent') {
        element.textContent = value;
      } else {
        element.setAttribute(key, value);
      }
    });
    
    if (content) {
      element.textContent = content;
    }
    
    return element;
  },

  /**
   * Add event listener with error handling
   */
  on(element, event, handler, options = {}) {
    if (!element || typeof handler !== 'function') {
      console.error('Invalid element or handler for event:', event);
      return;
    }
    
    element.addEventListener(event, (e) => {
      try {
        handler(e);
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    }, options);
  }
};

/**
 * String Utilities
 */
const StringUtils = {
  /**
   * Capitalize first letter
   */
  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  /**
   * Create URL-friendly slug
   */
  slugify(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens
      .trim('-'); // Remove leading/trailing hyphens
  },

  /**
   * Truncate text with ellipsis
   */
  truncate(str, length = 100) {
    if (!str || str.length <= length) return str;
    return str.substring(0, length).trim() + '...';
  },

  /**
   * Escape HTML characters
   */
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Format time duration (seconds to MM:SS)
   */
  formatDuration(seconds) {
    if (!seconds || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
};

/**
 * Number Utilities
 */
const NumberUtils = {
  /**
   * Format large numbers (1.2K, 1.5M, etc.)
   */
  format(num) {
    if (!num || isNaN(num)) return '0';
    
    const absNum = Math.abs(num);
    
    if (absNum >= 1000000000) {
      return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    } else if (absNum >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (absNum >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    
    return num.toString();
  },

  /**
   * Clamp number between min and max
   */
  clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  },

  /**
   * Generate random number between min and max
   */
  random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};

/**
 * Date Utilities
 */
const DateUtils = {
  /**
   * Format date to readable string
   */
  format(date, options = {}) {
    if (!date) return '';
    
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return 'Data inválida';
    
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return d.toLocaleDateString('pt-BR', { ...defaultOptions, ...options });
  },

  /**
   * Get relative time (e.g., "2 hours ago")
   */
  getRelativeTime(date) {
    if (!date) return '';
    
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return 'Data inválida';
    
    const now = new Date();
    const diffMs = now - d;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffMonth / 12);
    
    if (diffYear > 0) {
      return diffYear === 1 ? 'há 1 ano' : `há ${diffYear} anos`;
    } else if (diffMonth > 0) {
      return diffMonth === 1 ? 'há 1 mês' : `há ${diffMonth} meses`;
    } else if (diffDay > 0) {
      return diffDay === 1 ? 'há 1 dia' : `há ${diffDay} dias`;
    } else if (diffHour > 0) {
      return diffHour === 1 ? 'há 1 hora' : `há ${diffHour} horas`;
    } else if (diffMin > 0) {
      return diffMin === 1 ? 'há 1 minuto' : `há ${diffMin} minutos`;
    } else {
      return 'agora mesmo';
    }
  },

  /**
   * Check if date is today
   */
  isToday(date) {
    if (!date) return false;
    
    const d = date instanceof Date ? date : new Date(date);
    const today = new Date();
    
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  }
};

/**
 * Storage Utilities
 */
const StorageUtils = {
  /**
   * Safely get item from localStorage
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error getting from localStorage:', error);
      return defaultValue;
    }
  },

  /**
   * Safely set item in localStorage
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error setting to localStorage:', error);
      return false;
    }
  },

  /**
   * Remove item from localStorage
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },

  /**
   * Clear all localStorage
   */
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

/**
 * Validation Utilities
 */
const ValidationUtils = {
  /**
   * Validate email format
   */
  email(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  /**
   * Validate password strength
   */
  password(password) {
    if (!password) return { valid: false, message: 'Senha é obrigatória' };
    
    if (password.length < 6) {
      return { valid: false, message: 'Senha deve ter pelo menos 6 caracteres' };
    }
    
    if (password.length < 8) {
      return { valid: true, message: 'Senha fraca - recomendado 8+ caracteres' };
    }
    
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    
    const strength = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (strength >= 3) {
      return { valid: true, message: 'Senha forte' };
    } else if (strength >= 2) {
      return { valid: true, message: 'Senha média' };
    } else {
      return { valid: true, message: 'Senha fraca' };
    }
  },

  /**
   * Validate file type and size
   */
  file(file, options = {}) {
    if (!file) return { valid: false, message: 'Arquivo é obrigatório' };
    
    const {
      maxSize = 100 * 1024 * 1024, // 100MB default
      allowedTypes = ['video/mp4', 'video/mov', 'video/webm']
    } = options;
    
    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return { 
        valid: false, 
        message: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB` 
      };
    }
    
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        message: `Tipo de arquivo não permitido. Aceitos: ${allowedTypes.join(', ')}` 
      };
    }
    
    return { valid: true, message: 'Arquivo válido' };
  },

  /**
   * Validate username
   */
  username(username) {
    if (!username) return { valid: false, message: 'Nome de usuário é obrigatório' };
    
    if (username.length < 3) {
      return { valid: false, message: 'Nome deve ter pelo menos 3 caracteres' };
    }
    
    if (username.length > 30) {
      return { valid: false, message: 'Nome não pode ter mais que 30 caracteres' };
    }
    
    const regex = /^[a-zA-Z0-9\s]+$/;
    if (!regex.test(username)) {
      return { valid: false, message: 'Nome pode conter apenas letras, números e espaços' };
    }
    
    return { valid: true, message: 'Nome válido' };
  }
};

/**
 * URL Utilities
 */
const UrlUtils = {
  /**
   * Get URL parameters
   */
  getParams() {
    return new URLSearchParams(window.location.search);
  },

  /**
   * Get specific parameter value
   */
  getParam(name) {
    return this.getParams().get(name);
  },

  /**
   * Build URL with parameters
   */
  build(base, params = {}) {
    const url = new URL(base, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
  }
};

/**
 * Debounce function
 */
function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
}

/**
 * Throttle function
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Deep clone object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
  return obj;
}

/**
 * Generate unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if user is on mobile device
 */
function isMobile() {
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy text: ', error);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackError) {
      console.error('Fallback copy failed: ', fallbackError);
      document.body.removeChild(textArea);
      return false;
    }
  }
}

/**
 * Sleep/delay function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if element is in viewport
 */
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Export utilities for use in other files
window.SantooUtils = {
  DOM,
  StringUtils,
  NumberUtils,
  DateUtils,
  StorageUtils,
  ValidationUtils,
  UrlUtils,
  debounce,
  throttle,
  deepClone,
  generateId,
  formatFileSize,
  isMobile,
  copyToClipboard,
  sleep,
  isInViewport
};

console.log('🛠️ Santoo Utils carregados');