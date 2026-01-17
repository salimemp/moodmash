// Cookie Consent Banner
(function() {
  'use strict';
  
  const CONSENT_KEY = 'moodmash_cookie_consent';
  
  function init() {
    // Check if consent already given
    const consent = localStorage.getItem(CONSENT_KEY);
    if (consent) return;
    
    // Create banner
    const banner = document.createElement('div');
    banner.id = 'cookie-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'cookie-consent-title');
    banner.setAttribute('aria-describedby', 'cookie-consent-description');
    banner.className = 'fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 z-50 shadow-lg';
    
    banner.innerHTML = `
      <div class="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex-1">
          <h2 id="cookie-consent-title" class="font-semibold text-lg mb-1">Welcome to MoodMash! 🌟</h2>
          <p id="cookie-consent-description" class="text-gray-300 text-sm">
            We use cookies to make your experience better and keep your data safe. 
            By continuing, you agree to our use of cookies. 
            <a href="/legal/privacy" class="text-purple-400 hover:underline">Learn more in our Privacy Policy</a>.
          </p>
        </div>
        <div class="flex gap-3 flex-shrink-0">
          <button id="cookie-decline" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors" aria-label="Decline cookies">
            Decline
          </button>
          <button id="cookie-accept" class="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors" aria-label="Accept cookies">
            Accept
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(banner);
    
    // Event listeners
    document.getElementById('cookie-accept').addEventListener('click', () => acceptCookies());
    document.getElementById('cookie-decline').addEventListener('click', () => declineCookies());
    
    // Focus first button for accessibility
    setTimeout(() => {
      document.getElementById('cookie-accept').focus();
    }, 100);
  }
  
  async function acceptCookies() {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      accepted: true,
      analytics: true,
      functional: true,
      timestamp: new Date().toISOString()
    }));
    
    // Record consent on server
    try {
      await fetch('/api/legal/cookie-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accepted: true,
          analytics: true,
          marketing: false,
          functional: true,
          sessionId: getSessionId()
        })
      });
    } catch (error) {
      console.error('Failed to record consent:', error);
    }
    
    removeBanner();
  }
  
  function declineCookies() {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      accepted: false,
      analytics: false,
      functional: true,
      timestamp: new Date().toISOString()
    }));
    
    // Record decline on server
    try {
      fetch('/api/legal/cookie-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accepted: false,
          analytics: false,
          marketing: false,
          functional: true,
          sessionId: getSessionId()
        })
      });
    } catch (error) {
      console.error('Failed to record consent:', error);
    }
    
    removeBanner();
  }
  
  function removeBanner() {
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) {
      banner.classList.add('transition-transform', 'duration-300', 'transform', 'translate-y-full');
      setTimeout(() => banner.remove(), 300);
    }
  }
  
  function getSessionId() {
    let sessionId = sessionStorage.getItem('moodmash_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('moodmash_session_id', sessionId);
    }
    return sessionId;
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
