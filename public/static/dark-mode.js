/**
 * Dark Mode Manager (v2.0)
 * 
 * Features:
 * - System preference detection
 * - Smooth transitions
 * - Persistent user preference
 * - No flash on page load
 * - Custom theme colors
 * - Auto-switch based on time
 */

class DarkModeManager {
  constructor() {
    this.STORAGE_KEY = 'moodmash-theme'
    this.THEME_OPTIONS = {
      LIGHT: 'light',
      DARK: 'dark',
      AUTO: 'auto',
    }
    
    // Initialize immediately to prevent flash
    this.init()
  }

  /**
   * Initialize dark mode
   */
  init() {
    // Apply theme before page renders
    const theme = this.getTheme()
    this.applyTheme(theme, false) // No transition on init
    
    // Set up system preference listener
    this.setupMediaQueryListener()
    
    // Set up auto-switch based on time (if enabled)
    this.setupAutoSwitch()
  }

  /**
   * Get current theme preference
   */
  getTheme() {
    const stored = localStorage.getItem(this.STORAGE_KEY)
    
    if (stored && Object.values(this.THEME_OPTIONS).includes(stored)) {
      return stored
    }
    
    // Default to auto (follow system)
    return this.THEME_OPTIONS.AUTO
  }

  /**
   * Set theme preference
   */
  setTheme(theme, withTransition = true) {
    if (!Object.values(this.THEME_OPTIONS).includes(theme)) {
      console.error('Invalid theme:', theme)
      return
    }
    
    localStorage.setItem(this.STORAGE_KEY, theme)
    this.applyTheme(theme, withTransition)
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }))
  }

  /**
   * Apply theme to document
   */
  applyTheme(theme, withTransition = true) {
    const isDark = this.shouldUseDarkMode(theme)
    
    // Add transition class
    if (withTransition) {
      document.documentElement.classList.add('theme-transition')
    }
    
    // Apply theme
    if (isDark) {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    }
    
    // Update meta theme-color
    this.updateMetaThemeColor(isDark)
    
    // Remove transition class after animation
    if (withTransition) {
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition')
      }, 300)
    }
  }

  /**
   * Check if dark mode should be active
   */
  shouldUseDarkMode(theme) {
    if (theme === this.THEME_OPTIONS.DARK) {
      return true
    }
    
    if (theme === this.THEME_OPTIONS.LIGHT) {
      return false
    }
    
    // Auto mode - check system preference
    if (theme === this.THEME_OPTIONS.AUTO) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    
    return false
  }

  /**
   * Toggle between light and dark
   */
  toggle() {
    const currentTheme = this.getTheme()
    const isDark = this.shouldUseDarkMode(currentTheme)
    
    // Toggle to opposite
    this.setTheme(isDark ? this.THEME_OPTIONS.LIGHT : this.THEME_OPTIONS.DARK, true)
  }

  /**
   * Update meta theme-color
   */
  updateMetaThemeColor(isDark) {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#1f2937' : '#6366f1')
    }
  }

  /**
   * Set up media query listener for system preference changes
   */
  setupMediaQueryListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    mediaQuery.addEventListener('change', (e) => {
      const theme = this.getTheme()
      
      // Only apply if in auto mode
      if (theme === this.THEME_OPTIONS.AUTO) {
        this.applyTheme(theme, true)
      }
    })
  }

  /**
   * Set up auto-switch based on time of day
   */
  setupAutoSwitch() {
    // Check every minute if auto-switch is enabled
    setInterval(() => {
      const theme = this.getTheme()
      
      if (theme === 'auto-time') {
        const hour = new Date().getHours()
        const shouldBeDark = hour < 6 || hour >= 18 // Dark between 6pm and 6am
        
        const currentlyDark = document.documentElement.classList.contains('dark')
        
        if (shouldBeDark !== currentlyDark) {
          this.applyTheme('auto-time', true)
        }
      }
    }, 60000) // Check every minute
  }

  /**
   * Get all available themes
   */
  getAvailableThemes() {
    return [
      { value: this.THEME_OPTIONS.LIGHT, label: 'Light', icon: '☀️' },
      { value: this.THEME_OPTIONS.DARK, label: 'Dark', icon: '🌙' },
      { value: this.THEME_OPTIONS.AUTO, label: 'Auto (System)', icon: '🔄' },
    ]
  }

  /**
   * Get current theme info
   */
  getCurrentThemeInfo() {
    const theme = this.getTheme()
    const isDark = this.shouldUseDarkMode(theme)
    const themes = this.getAvailableThemes()
    
    return {
      theme,
      isDark,
      label: themes.find(t => t.value === theme)?.label || 'Unknown',
      icon: themes.find(t => t.value === theme)?.icon || '❓',
    }
  }
}

// Initialize dark mode manager immediately
const darkModeManager = new DarkModeManager()

// Expose to window for global access
window.darkModeManager = darkModeManager

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DarkModeManager
}

// Add CSS for smooth transitions
const style = document.createElement('style')
style.textContent = `
  /* Smooth theme transitions */
  .theme-transition,
  .theme-transition *,
  .theme-transition *::before,
  .theme-transition *::after {
    transition: background-color 0.3s ease, 
                color 0.3s ease, 
                border-color 0.3s ease,
                box-shadow 0.3s ease !important;
  }
  
  /* Dark mode styles */
  .dark {
    color-scheme: dark;
  }
  
  .dark body {
    background-color: #111827;
    color: #f3f4f6;
  }
  
  .dark .bg-white {
    background-color: #1f2937 !important;
  }
  
  .dark .bg-gray-50 {
    background-color: #111827 !important;
  }
  
  .dark .bg-gray-100 {
    background-color: #1f2937 !important;
  }
  
  .dark .bg-gray-200 {
    background-color: #374151 !important;
  }
  
  .dark .text-gray-900 {
    color: #f3f4f6 !important;
  }
  
  .dark .text-gray-800 {
    color: #e5e7eb !important;
  }
  
  .dark .text-gray-700 {
    color: #d1d5db !important;
  }
  
  .dark .text-gray-600 {
    color: #9ca3af !important;
  }
  
  .dark .border-gray-200 {
    border-color: #374151 !important;
  }
  
  .dark .border-gray-300 {
    border-color: #4b5563 !important;
  }
  
  .dark input,
  .dark textarea,
  .dark select {
    background-color: #374151;
    color: #f3f4f6;
    border-color: #4b5563;
  }
  
  .dark input::placeholder,
  .dark textarea::placeholder {
    color: #9ca3af;
  }
  
  .dark .shadow {
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.5),
                0 1px 2px 0 rgba(0, 0, 0, 0.3);
  }
  
  .dark .shadow-lg {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5),
                0 4px 6px -2px rgba(0, 0, 0, 0.3);
  }
  
  /* Theme toggle button */
  .theme-toggle {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    background: var(--theme-toggle-bg, #6366f1);
    color: white;
    border: none;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .theme-toggle:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }
  
  .theme-toggle:active {
    transform: scale(0.95);
  }
  
  .dark .theme-toggle {
    --theme-toggle-bg: #4b5563;
  }
`
document.head.appendChild(style)

console.log('[DarkMode] Dark Mode Manager v2.0 initialized')
