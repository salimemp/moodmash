/**
 * MoodMash Dynamic Script Loader
 * Implements lazy loading with priority-based loading strategy
 * 
 * Priority Levels:
 * - critical: Load immediately (core functionality)
 * - high: Load after initial render (important features)
 * - medium: Load on user interaction (optional features)
 * - low: Load when visible or on-demand (below-the-fold content)
 */

const ScriptLoader = (function() {
  'use strict';

  // Script registry with priority levels
  const SCRIPTS = {
    // Critical - Load immediately
    critical: [
      { id: 'utils', src: '/static/utils.js' },
      { id: 'i18n-loader', src: '/static/i18n-loader.js' },
      { id: 'dark-mode', src: '/static/dark-mode.js' }
    ],
    
    // High - Load after initial render
    high: [
      { id: 'auth', src: '/static/auth.js' },
      { id: 'app', src: '/static/app.js' },
      { id: 'bottom-nav', src: '/static/bottom-nav.js' }
    ],
    
    // Medium - Load on first user interaction
    medium: [
      { id: 'chatbot', src: '/static/chatbot.js' },
      { id: 'accessibility', src: '/static/accessibility.js' },
      { id: 'cookie-consent', src: '/static/cookie-consent.js' },
      { id: 'touch-gestures', src: '/static/touch-gestures.js' },
      { id: 'onboarding', src: '/static/onboarding.js' }
    ],
    
    // Low - Load on-demand or when visible
    low: [
      { id: 'onboarding-v2', src: '/static/onboarding-v2.js' },
      { id: 'biometric-ui', src: '/static/biometric-ui.js' },
      { id: 'pwa-advanced', src: '/static/pwa-advanced.js' },
      { id: 'emergency-fix-v2', src: '/static/emergency-fix-v2.js' }
    ]
  };

  // Page-specific scripts (loaded based on current page)
  const PAGE_SCRIPTS = {
    '/': ['insights', 'mood-calendar', 'quick-select'],
    '/log': ['log', 'voice-input', 'quick-select'],
    '/activities': ['activities', 'wellness-tips', 'gamification'],
    '/login': ['totp-login', 'magic-link'],
    '/register': ['totp-login'],
    '/profile': ['subscription', 'data-export-import', 'totp-ui'],
    '/insights': ['insights', 'ai-insights'],
    '/ai-chat': ['ai-chat', 'chatbot'],
    '/ar-dashboard': ['ar-dashboard', 'ar-emotions', 'ar-mood-cards', '3d-avatar'],
    '/voice-journal': ['voice-journal', 'voice-input'],
    '/social-network': ['social-network', 'social-feed', 'mood-groups'],
    '/gamification': ['gamification', 'challenges'],
    '/biometrics': ['biometrics', 'biometric-ui', 'health-dashboard'],
    '/3d-avatar': ['3d-avatar'],
    '/mood-calendar': ['mood-calendar'],
    '/privacy-center': ['privacy-center', 'privacy-education', 'ccpa-rights'],
    '/hipaa': ['hipaa-compliance'],
    '/research-center': ['research-center'],
    '/security-monitoring': ['security-monitoring', 'monitoring'],
    '/express': ['express'],
    '/color-psychology': ['color-psychology'],
    '/landing': ['landing']
  };

  // Track loaded scripts
  const loadedScripts = new Set();
  const loadingScripts = new Map();
  let interactionTriggered = false;
  let visibilityObserver = null;

  /**
   * Load a single script
   */
  function loadScript(id, src, options = {}) {
    return new Promise((resolve, reject) => {
      // Already loaded
      if (loadedScripts.has(id)) {
        resolve({ id, cached: true });
        return;
      }

      // Currently loading
      if (loadingScripts.has(id)) {
        loadingScripts.get(id).then(resolve).catch(reject);
        return;
      }

      const promise = new Promise((res, rej) => {
        const script = document.createElement('script');
        script.id = `script-${id}`;
        script.src = src;
        script.async = options.async !== false;
        
        if (options.defer) {
          script.defer = true;
        }

        script.onload = () => {
          loadedScripts.add(id);
          loadingScripts.delete(id);
          console.log(`[ScriptLoader] Loaded: ${id}`);
          res({ id, src });
        };

        script.onerror = () => {
          loadingScripts.delete(id);
          console.error(`[ScriptLoader] Failed to load: ${id}`);
          rej(new Error(`Failed to load script: ${src}`));
        };

        document.body.appendChild(script);
      });

      loadingScripts.set(id, promise);
      promise.then(resolve).catch(reject);
    });
  }

  /**
   * Load multiple scripts in parallel
   */
  function loadScripts(scripts, options = {}) {
    return Promise.all(
      scripts.map(s => loadScript(s.id, s.src, options))
    );
  }

  /**
   * Load scripts by priority level
   */
  async function loadByPriority(priority) {
    const scripts = SCRIPTS[priority];
    if (!scripts || scripts.length === 0) return [];
    
    console.log(`[ScriptLoader] Loading ${priority} priority scripts...`);
    return loadScripts(scripts);
  }

  /**
   * Load page-specific scripts
   */
  function loadPageScripts(path) {
    const pageScriptIds = PAGE_SCRIPTS[path] || [];
    if (pageScriptIds.length === 0) return Promise.resolve([]);

    const scriptsToLoad = pageScriptIds
      .filter(id => !loadedScripts.has(id))
      .map(id => ({ id, src: `/static/${id}.js` }));

    if (scriptsToLoad.length === 0) return Promise.resolve([]);

    console.log(`[ScriptLoader] Loading page scripts for ${path}:`, scriptsToLoad.map(s => s.id));
    return loadScripts(scriptsToLoad);
  }

  /**
   * Setup first interaction listener for medium priority scripts
   */
  function setupInteractionListener() {
    if (interactionTriggered) return;

    const triggerLoad = () => {
      if (interactionTriggered) return;
      interactionTriggered = true;

      // Remove listeners
      ['click', 'touchstart', 'keydown', 'scroll', 'mousemove'].forEach(event => {
        document.removeEventListener(event, triggerLoad, { passive: true });
      });

      // Load medium priority scripts
      loadByPriority('medium').catch(err => {
        console.warn('[ScriptLoader] Error loading medium priority scripts:', err);
      });
    };

    // Listen for first interaction
    ['click', 'touchstart', 'keydown', 'scroll', 'mousemove'].forEach(event => {
      document.addEventListener(event, triggerLoad, { passive: true, once: true });
    });

    // Also load after 5 seconds if no interaction
    setTimeout(triggerLoad, 5000);
  }

  /**
   * Setup intersection observer for visibility-based loading
   */
  function setupVisibilityObserver() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: load low priority after delay
      setTimeout(() => loadByPriority('low'), 10000);
      return;
    }

    visibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const scriptId = entry.target.dataset.loadScript;
          if (scriptId && !loadedScripts.has(scriptId)) {
            loadScript(scriptId, `/static/${scriptId}.js`);
          }
          visibilityObserver.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '100px',
      threshold: 0.01
    });

    // Observe elements with data-load-script attribute
    document.querySelectorAll('[data-load-script]').forEach(el => {
      visibilityObserver.observe(el);
    });
  }

  /**
   * Preload scripts for likely navigation
   */
  function preloadForNavigation(paths) {
    if (!('requestIdleCallback' in window)) return;

    requestIdleCallback(() => {
      paths.forEach(path => {
        const scriptIds = PAGE_SCRIPTS[path] || [];
        scriptIds.forEach(id => {
          if (!loadedScripts.has(id)) {
            // Create preload link
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = `/static/${id}.js`;
            link.as = 'script';
            document.head.appendChild(link);
          }
        });
      });
    });
  }

  /**
   * Check if a script is loaded
   */
  function isLoaded(id) {
    return loadedScripts.has(id);
  }

  /**
   * Get loading statistics
   */
  function getStats() {
    return {
      loaded: loadedScripts.size,
      loading: loadingScripts.size,
      scripts: Array.from(loadedScripts)
    };
  }

  /**
   * Initialize the script loader
   */
  async function init() {
    const startTime = performance.now();
    
    try {
      // 1. Load critical scripts immediately
      await loadByPriority('critical');
      
      // 2. Load high priority scripts after DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          loadByPriority('high');
          loadPageScripts(window.location.pathname);
        });
      } else {
        await loadByPriority('high');
        await loadPageScripts(window.location.pathname);
      }
      
      // 3. Setup interaction listener for medium priority
      setupInteractionListener();
      
      // 4. Setup visibility observer for low priority
      if (document.readyState === 'complete') {
        setupVisibilityObserver();
      } else {
        window.addEventListener('load', setupVisibilityObserver);
      }
      
      // 5. Preload scripts for common navigation paths
      preloadForNavigation(['/', '/log', '/activities']);
      
      const loadTime = performance.now() - startTime;
      console.log(`[ScriptLoader] Initialized in ${loadTime.toFixed(2)}ms`);
      
      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('scriptsReady', {
        detail: { loadTime, stats: getStats() }
      }));
      
    } catch (error) {
      console.error('[ScriptLoader] Initialization error:', error);
    }
  }

  // Public API
  return {
    init,
    loadScript,
    loadScripts,
    loadByPriority,
    loadPageScripts,
    preloadForNavigation,
    isLoaded,
    getStats,
    SCRIPTS,
    PAGE_SCRIPTS
  };
})();

// Auto-initialize
ScriptLoader.init();

// Expose globally
if (typeof window !== 'undefined') {
  window.ScriptLoader = ScriptLoader;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScriptLoader;
}
