/**
 * Debug utility - Only logs in development mode
 * Reduces console noise in production
 */
window.debug = {
  // Check if development mode (localhost or explicit flag)
  isDev: () => {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           localStorage.getItem('DEBUG_MODE') === 'true';
  },
  
  log: function(tag, ...args) {
    if (this.isDev()) {
      console.log(`[${tag}]`, ...args);
    }
  },
  
  warn: function(tag, ...args) {
    // Warnings always show
    console.warn(`[${tag}]`, ...args);
  },
  
  error: function(tag, ...args) {
    // Errors always show
    console.error(`[${tag}]`, ...args);
  },
  
  info: function(tag, ...args) {
    if (this.isDev()) {
      console.info(`[${tag}]`, ...args);
    }
  }
};
