/**
 * Sentry Browser Integration for MoodMash
 * Tracks frontend errors and user interactions
 */

(function() {
  'use strict';

  // Configuration (will be injected by backend)
  const SENTRY_CONFIG = {
    dsn: window.SENTRY_DSN || null, // Injected from backend
    environment: window.SENTRY_ENVIRONMENT || 'production',
    release: window.SENTRY_RELEASE || 'moodmash@1.0.0',
  };

  // Initialize Sentry Browser SDK
  if (SENTRY_CONFIG.dsn && typeof Sentry !== 'undefined') {
    try {
      Sentry.init({
        dsn: SENTRY_CONFIG.dsn,
        environment: SENTRY_CONFIG.environment,
        release: SENTRY_CONFIG.release,
        
        // Performance monitoring
        tracesSampleRate: 0.1, // 10% of transactions
        
        // Error sampling
        sampleRate: 1.0, // 100% of errors
        
        // Integrations
        integrations: [
          new Sentry.BrowserTracing({
            // Track navigation
            tracingOrigins: ['localhost', 'moodmash.win', /^\//],
            
            // Track user interactions
            trackUserInteractions: true,
          }),
          new Sentry.Replay({
            // Session replay for debugging
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        
        // Replay settings
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
        
        // Before send hook - scrub sensitive data
        beforeSend(event, hint) {
          // Remove sensitive data from forms
          if (event.request && event.request.data) {
            const data = event.request.data;
            if (typeof data === 'object') {
              if (data.password) data.password = '[REDACTED]';
              if (data.token) data.token = '[REDACTED]';
              if (data.api_key) data.api_key = '[REDACTED]';
            }
          }
          
          // Hash email addresses
          if (event.user && event.user.email) {
            event.user.email = hashEmail(event.user.email);
          }
          
          return event;
        },
        
        // Breadcrumbs
        beforeBreadcrumb(breadcrumb) {
          // Don't log sensitive URLs
          if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
            if (breadcrumb.data && breadcrumb.data.url) {
              const url = breadcrumb.data.url;
              if (url.includes('password') || url.includes('token')) {
                breadcrumb.data.url = '[REDACTED]';
              }
            }
          }
          return breadcrumb;
        },
      });

      console.log('[Sentry] Browser tracking initialized');
      
      // Set user context if logged in
      checkAuthAndSetUser();
      
    } catch (error) {
      console.error('[Sentry] Failed to initialize:', error);
    }
  } else if (!SENTRY_CONFIG.dsn) {
    console.log('[Sentry] Not configured (SENTRY_DSN not set)');
  } else if (typeof Sentry === 'undefined') {
    console.error('[Sentry] SDK not loaded. Please include Sentry browser bundle.');
  }

  /**
   * Hash email for privacy
   */
  function hashEmail(email) {
    const [username, domain] = email.split('@');
    if (!domain) return email;
    
    const visible = username.substring(0, 2);
    const hash = simpleHash(username);
    return `${visible}***${hash}@${domain}`;
  }

  /**
   * Simple hash function
   */
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 6);
  }

  /**
   * Check authentication and set Sentry user
   */
  async function checkAuthAndSetUser() {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.user && typeof Sentry !== 'undefined') {
          Sentry.setUser({
            id: data.user.id.toString(),
            username: data.user.username,
            email: hashEmail(data.user.email),
          });
          
          console.log('[Sentry] User context set');
        }
      }
    } catch (error) {
      // Ignore auth check errors
      console.debug('[Sentry] Could not fetch user context');
    }
  }

  /**
   * Track page view
   */
  function trackPageView(pageName) {
    if (typeof Sentry !== 'undefined') {
      Sentry.addBreadcrumb({
        category: 'navigation',
        message: `Page view: ${pageName}`,
        level: 'info',
      });
    }
  }

  /**
   * Track user action
   */
  function trackAction(action, data = {}) {
    if (typeof Sentry !== 'undefined') {
      Sentry.addBreadcrumb({
        category: 'user-action',
        message: action,
        data: data,
        level: 'info',
      });
    }
  }

  /**
   * Capture frontend error
   */
  function captureError(error, context = {}) {
    if (typeof Sentry !== 'undefined') {
      Sentry.captureException(error, {
        tags: context.tags || {},
        extra: context.extra || {},
      });
    } else {
      console.error('[Sentry] Cannot capture error - SDK not initialized', error);
    }
  }

  /**
   * Track API call performance
   */
  function trackAPICall(endpoint, method, duration, status) {
    if (typeof Sentry !== 'undefined') {
      Sentry.addBreadcrumb({
        category: 'api',
        message: `${method} ${endpoint}`,
        data: {
          duration_ms: duration,
          status_code: status,
        },
        level: status >= 400 ? 'error' : 'info',
      });
    }
  }

  // Expose functions globally
  window.MoodMashSentry = {
    trackPageView,
    trackAction,
    captureError,
    trackAPICall,
  };

  // Track initial page load
  if (typeof Sentry !== 'undefined') {
    const pageName = document.title || window.location.pathname;
    trackPageView(pageName);
  }

  // Listen for navigation events
  window.addEventListener('popstate', function() {
    const pageName = document.title || window.location.pathname;
    trackPageView(pageName);
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    if (typeof Sentry !== 'undefined') {
      Sentry.captureException(event.reason, {
        tags: {
          type: 'unhandled_rejection',
        },
      });
    }
  });

  // Track successful logins
  document.addEventListener('moodmash:login', function(event) {
    const user = event.detail;
    if (user && typeof Sentry !== 'undefined') {
      Sentry.setUser({
        id: user.id.toString(),
        username: user.username,
        email: hashEmail(user.email),
      });
      
      Sentry.addBreadcrumb({
        category: 'auth',
        message: 'User logged in',
        level: 'info',
      });
    }
  });

  // Track logouts
  document.addEventListener('moodmash:logout', function() {
    if (typeof Sentry !== 'undefined') {
      Sentry.setUser(null);
      
      Sentry.addBreadcrumb({
        category: 'auth',
        message: 'User logged out',
        level: 'info',
      });
    }
  });

})();
