// MoodMash Utility Functions

// Theme Manager
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.applyTheme();
    }
    
    applyTheme() {
        if (this.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
    
    toggle() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    }
    
    isDark() {
        return this.theme === 'dark';
    }
}

// PWA Manager
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.init();
    }
    
    init() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });
        
        // Listen for app installed
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.deferredPrompt = null;
            this.hideInstallPrompt();
        });
        
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('PWA is running in standalone mode');
        }
    }
    
    showInstallPrompt() {
        // Don't show if already dismissed or installed
        if (localStorage.getItem('pwa-dismissed') === 'true') return;
        if (this.isInstalled()) return;
        
        const promptHtml = `
            <div id="pwa-install-prompt" class="pwa-install-prompt bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex items-center space-x-4">
                <i class="fas fa-mobile-alt text-primary text-3xl"></i>
                <div class="flex-1">
                    <h3 class="font-semibold text-gray-800 dark:text-white">${i18n.t('pwa_install_title')}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-300">${i18n.t('pwa_install_desc')}</p>
                </div>
                <div class="flex space-x-2">
                    <button onclick="pwaManager.install()" class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                        ${i18n.t('pwa_install_btn')}
                    </button>
                    <button onclick="pwaManager.dismissPrompt()" class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                        ${i18n.t('pwa_install_later')}
                    </button>
                </div>
            </div>
        `;
        
        // Add prompt to body after a delay
        setTimeout(() => {
            const existingPrompt = document.getElementById('pwa-install-prompt');
            if (!existingPrompt) {
                document.body.insertAdjacentHTML('beforeend', promptHtml);
            }
        }, 3000); // Show after 3 seconds
    }
    
    hideInstallPrompt() {
        const prompt = document.getElementById('pwa-install-prompt');
        if (prompt) {
            prompt.remove();
        }
    }
    
    async install() {
        if (!this.deferredPrompt) return;
        
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        console.log(`User response to install prompt: ${outcome}`);
        
        if (outcome === 'accepted') {
            this.hideInstallPrompt();
        }
        
        this.deferredPrompt = null;
    }
    
    dismissPrompt() {
        localStorage.setItem('pwa-dismissed', 'true');
        this.hideInstallPrompt();
    }
    
    isInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
    }
}

// Navigation Component
// Global user state
let currentUser = null;

async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
            currentUser = await response.json();
            return true;
        }
    } catch (error) {
        console.log('[Auth] Not authenticated');
    }
    currentUser = null;
    return false;
}

function renderNavigation(currentPage = '') {
    const theme = themeManager.isDark() ? 'dark' : 'light';
    const languages = i18n.getAvailableLanguages();
    const currentLang = languages.find(l => l.code === i18n.currentLanguage);
    
    // Auth buttons or user profile
    const authSection = currentUser ? `
        <!-- User Profile Menu -->
        <div class="relative ml-4 pl-4 border-l border-gray-200 dark:border-gray-700">
            <button onclick="toggleUserMenu()" class="flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-primary rounded-md text-sm font-medium transition-colors">
                <div class="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                    ${(currentUser.username || currentUser.email || 'U').charAt(0).toUpperCase()}
                </div>
                <span class="hidden sm:inline">${currentUser.username || currentUser.email || 'User'}</span>
                <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div id="user-menu" class="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div class="p-3 border-b border-gray-200 dark:border-gray-700">
                    <p class="text-sm font-semibold text-gray-800 dark:text-white">${currentUser.username || 'User'}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${currentUser.email || ''}</p>
                </div>
                <div class="py-2">
                    <a href="/profile" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <i class="fas fa-user mr-2"></i>Profile
                    </a>
                    <a href="/settings" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <i class="fas fa-cog mr-2"></i>Settings
                    </a>
                    <button onclick="handleLogout()" class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <i class="fas fa-sign-out-alt mr-2"></i>Logout
                    </button>
                </div>
            </div>
        </div>
    ` : `
        <!-- Auth Buttons -->
        <div class="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200 dark:border-gray-700">
            <a href="/login" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors">
                <i class="fas fa-sign-in-alt mr-1"></i>
                <span class="hidden sm:inline">Login</span>
            </a>
            <a href="/register" class="px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md">
                <i class="fas fa-user-plus mr-1"></i>
                <span class="hidden sm:inline">Sign Up</span>
            </a>
        </div>
    `;
    
    return `
        <nav class="bg-white dark:bg-gray-800 shadow-sm">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <i class="fas fa-brain text-primary text-2xl mr-3"></i>
                        <span class="text-2xl font-bold text-gray-800 dark:text-white">${i18n.t('dashboard_title')}</span>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/" class="text-gray-700 dark:text-gray-300 hover:text-primary px-3 py-2 rounded-md text-sm font-medium ${currentPage === 'dashboard' ? 'border-b-2 border-primary' : ''}">
                            ${i18n.t('nav_dashboard')}
                        </a>
                        <a href="/log" class="text-gray-700 dark:text-gray-300 hover:text-primary px-3 py-2 rounded-md text-sm font-medium ${currentPage === 'log' ? 'border-b-2 border-primary' : ''}">
                            ${i18n.t('nav_log_mood')}
                        </a>
                        <a href="/activities" class="text-gray-700 dark:text-gray-300 hover:text-primary px-3 py-2 rounded-md text-sm font-medium ${currentPage === 'activities' ? 'border-b-2 border-primary' : ''}">
                            ${i18n.t('nav_activities')}
                        </a>
                        <a href="/about" class="text-gray-700 dark:text-gray-300 hover:text-primary px-3 py-2 rounded-md text-sm font-medium ${currentPage === 'about' ? 'border-b-2 border-primary' : ''}">
                            ${i18n.t('nav_about')}
                        </a>
                        
                        <!-- Language Selector -->
                        <div class="language-selector relative">
                            <button onclick="toggleLanguageDropdown()" class="flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-primary rounded-md text-sm">
                                <span>${currentLang.flag}</span>
                                <span class="hidden md:inline">${currentLang.code.toUpperCase()}</span>
                                <i class="fas fa-chevron-down text-xs"></i>
                            </button>
                            <div id="language-dropdown" class="language-dropdown hidden">
                                ${languages.map(lang => `
                                    <div onclick="changeLanguage('${lang.code}')" 
                                         class="language-option ${lang.code === i18n.currentLanguage ? 'active' : ''}">
                                        <span class="mr-2">${lang.flag}</span>
                                        <span>${lang.name}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <!-- Theme Toggle -->
                        <button onclick="themeManager.toggle()" class="theme-toggle" title="${theme === 'dark' ? i18n.t('theme_light') : i18n.t('theme_dark')}">
                            <div class="theme-toggle-thumb">
                                <i class="fas ${theme === 'dark' ? 'fa-moon' : 'fa-sun'} text-xs"></i>
                            </div>
                        </button>
                        
                        ${authSection}
                    </div>
                </div>
            </div>
        </nav>
    `;
}

// User menu toggle
function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// Logout handler
async function handleLogout() {
    try {
        await fetch('/auth/logout', { method: 'POST' });
        currentUser = null;
        window.location.href = '/login';
    } catch (error) {
        console.error('[Logout] Error:', error);
        window.location.href = '/login';
    }
}

// Language dropdown toggle
function toggleLanguageDropdown() {
    const dropdown = document.getElementById('language-dropdown');
    dropdown.classList.toggle('hidden');
}

// Change language
function changeLanguage(langCode) {
    i18n.setLanguage(langCode);
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('language-dropdown');
    const selector = document.querySelector('.language-selector');
    
    if (dropdown && !selector?.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
    
    // Close user menu when clicking outside
    const userMenu = document.getElementById('user-menu');
    const userMenuButton = e.target.closest('button[onclick="toggleUserMenu()"]');
    
    if (userMenu && !userMenuButton && !userMenu.contains(e.target)) {
        userMenu.classList.add('hidden');
    }
});

// Initialize managers
const themeManager = new ThemeManager();
const pwaManager = new PWAManager();

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// Detect iOS and show install instructions
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isInStandaloneMode() {
    return ('standalone' in window.navigator) && window.navigator.standalone;
}

// Show iOS install instructions
if (isIOS() && !isInStandaloneMode()) {
    setTimeout(() => {
        const dismissed = localStorage.getItem('ios-install-dismissed');
        if (!dismissed) {
            showIOSInstallInstructions();
        }
    }, 5000);
}

function showIOSInstallInstructions() {
    const instructionsHtml = `
        <div id="ios-install-instructions" class="pwa-install-prompt bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md">
            <div class="flex items-start justify-between mb-4">
                <h3 class="font-bold text-gray-800 dark:text-white text-lg">${i18n.t('pwa_install_title')}</h3>
                <button onclick="dismissIOSInstructions()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <p>To install MoodMash on your iOS device:</p>
                <ol class="list-decimal list-inside space-y-2">
                    <li>Tap the <i class="fas fa-share"></i> Share button</li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" in the top right corner</li>
                </ol>
            </div>
            <button onclick="dismissIOSInstructions()" class="mt-4 w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700">
                Got it!
            </button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', instructionsHtml);
}

function dismissIOSInstructions() {
    localStorage.setItem('ios-install-dismissed', 'true');
    const instructions = document.getElementById('ios-install-instructions');
    if (instructions) {
        instructions.remove();
    }
}

// Offline detection
window.addEventListener('online', () => {
    console.log('App is online');
    showToast('Back online!', 'success');
});

window.addEventListener('offline', () => {
    console.log('App is offline');
    showToast('You are offline. Some features may be limited.', 'warning');
});

// Toast notification
function showToast(message, type = 'info') {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
