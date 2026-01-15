/**
 * MoodMash Lazy-Loading i18n System
 * Loads translations on-demand based on user language preference
 * Reduces initial bundle from 316KB to ~17KB per language
 */

const I18n = (function() {
  const SUPPORTED_LANGUAGES = ['en', 'es', 'zh', 'fr', 'de', 'it', 'ar', 'hi', 'bn', 'ta', 'ja', 'ko', 'ms'];
  const DEFAULT_LANGUAGE = 'en';
  const CACHE_KEY = 'moodmash_i18n_cache';
  const CACHE_VERSION = '1.0';
  
  let currentLanguage = DEFAULT_LANGUAGE;
  let translations = {};
  let loadedLanguages = new Set();
  let loadingPromises = {};
  
  /**
   * Get the user's preferred language
   */
  function detectLanguage() {
    // Check stored preference
    const stored = localStorage.getItem('moodmash_language');
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
      return stored;
    }
    
    // Check browser language
    const browserLang = navigator.language?.substring(0, 2) || 'en';
    if (SUPPORTED_LANGUAGES.includes(browserLang)) {
      return browserLang;
    }
    
    return DEFAULT_LANGUAGE;
  }
  
  /**
   * Load translations for a specific language
   */
  async function loadLanguage(lang) {
    if (loadedLanguages.has(lang)) {
      return translations[lang];
    }
    
    // Prevent duplicate loads
    if (loadingPromises[lang]) {
      return loadingPromises[lang];
    }
    
    loadingPromises[lang] = (async () => {
      try {
        // Check cache first
        const cached = getCachedTranslations(lang);
        if (cached) {
          translations[lang] = cached;
          loadedLanguages.add(lang);
          return cached;
        }
        
        // Fetch translations
        const response = await fetch(`/static/i18n/${lang}.json`);
        if (!response.ok) {
          throw new Error(`Failed to load ${lang} translations`);
        }
        
        const data = await response.json();
        translations[lang] = data;
        loadedLanguages.add(lang);
        
        // Cache translations
        cacheTranslations(lang, data);
        
        return data;
      } catch (error) {
        console.error(`Error loading ${lang} translations:`, error);
        // Fall back to English if available
        if (lang !== DEFAULT_LANGUAGE && loadedLanguages.has(DEFAULT_LANGUAGE)) {
          return translations[DEFAULT_LANGUAGE];
        }
        return {};
      } finally {
        delete loadingPromises[lang];
      }
    })();
    
    return loadingPromises[lang];
  }
  
  /**
   * Get cached translations
   */
  function getCachedTranslations(lang) {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      if (cache.version === CACHE_VERSION && cache[lang]) {
        return cache[lang];
      }
    } catch {
      // Cache corrupted, ignore
    }
    return null;
  }
  
  /**
   * Cache translations in localStorage
   */
  function cacheTranslations(lang, data) {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      cache.version = CACHE_VERSION;
      cache[lang] = data;
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
      // localStorage full or not available, ignore
    }
  }
  
  /**
   * Initialize the i18n system
   */
  async function init() {
    currentLanguage = detectLanguage();
    await loadLanguage(currentLanguage);
    
    // Also preload English as fallback if not current
    if (currentLanguage !== DEFAULT_LANGUAGE) {
      loadLanguage(DEFAULT_LANGUAGE).catch(() => {});
    }
    
    // Update document language attribute
    document.documentElement.lang = currentLanguage;
    
    // Dispatch event for components to react
    window.dispatchEvent(new CustomEvent('i18n:ready', { detail: { language: currentLanguage } }));
    
    return currentLanguage;
  }
  
  /**
   * Get a translation by key
   */
  function t(key, params = {}) {
    let text = translations[currentLanguage]?.[key] 
            || translations[DEFAULT_LANGUAGE]?.[key] 
            || key;
    
    // Replace placeholders
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    
    return text;
  }
  
  /**
   * Change the current language
   */
  async function setLanguage(lang) {
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      console.warn(`Language ${lang} not supported`);
      return false;
    }
    
    try {
      await loadLanguage(lang);
      currentLanguage = lang;
      localStorage.setItem('moodmash_language', lang);
      document.documentElement.lang = lang;
      
      // Set text direction for RTL languages
      if (['ar', 'he'].includes(lang)) {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }
      
      // Update the language display in the UI
      const langDisplay = document.getElementById('current-language');
      const langInfo = getAvailableLanguages().find(l => l.code === lang);
      if (langDisplay && langInfo) {
        langDisplay.textContent = `${langInfo.flag} ${lang.toUpperCase()}`;
      }
      
      // Dispatch event for components to update
      window.dispatchEvent(new CustomEvent('i18n:languageChanged', { detail: { language: lang } }));
      
      console.log(`[i18n] Language changed to ${lang}`);
      return true;
    } catch (error) {
      console.error(`[i18n] Failed to change language to ${lang}:`, error);
      return false;
    }
  }
  
  /**
   * Get current language
   */
  function getLanguage() {
    return currentLanguage;
  }
  
  /**
   * Get list of supported languages
   */
  function getSupportedLanguages() {
    return [...SUPPORTED_LANGUAGES];
  }
  
  /**
   * Check if a language is loaded
   */
  function isLanguageLoaded(lang) {
    return loadedLanguages.has(lang);
  }
  
  /**
   * Get available languages with metadata
   */
  function getAvailableLanguages() {
    return [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'zh', name: '中文', flag: '🇨🇳' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'it', name: 'Italiano', flag: '🇮🇹' },
      { code: 'ar', name: 'العربية', flag: '🇸🇦' },
      { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
      { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
      { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
      { code: 'ja', name: '日本語', flag: '🇯🇵' },
      { code: 'ko', name: '한국어', flag: '🇰🇷' },
      { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' }
    ];
  }

  // Public API
  return {
    init,
    t,
    setLanguage,
    changeLanguage: setLanguage, // Alias for compatibility
    getLanguage,
    getSupportedLanguages,
    getAvailableLanguages,
    isLanguageLoaded,
    loadLanguage,
    get currentLanguage() { return currentLanguage; }
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => I18n.init());
} else {
  I18n.init();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18n;
}

// CRITICAL FIX: Expose both I18n and i18n (lowercase) for compatibility
// Some scripts check for i18n (lowercase) but this module exports I18n (capital I)
window.I18n = I18n;
window.i18n = I18n;
