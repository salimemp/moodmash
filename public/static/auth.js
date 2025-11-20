// MoodMash OAuth Authentication Manager

class AuthManager {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
    }
    
    async initialize() {
        // Check if user is authenticated
        await this.checkAuth();
        
        // Check for login success/error in URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('login') && urlParams.get('login') === 'success') {
            await this.checkAuth();
            this.showNotification(i18n.t('auth_login_success') || 'Welcome back!');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (urlParams.has('error')) {
            this.showNotification('Login failed. Please try again.', 'error');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        this.renderUserProfile();
    }
    
    async checkAuth() {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.isAuthenticated = data.authenticated;
                this.user = data.user;
            } else {
                this.isAuthenticated = false;
                this.user = null;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.isAuthenticated = false;
            this.user = null;
        }
    }
    
    loginWithGoogle() {
        window.location.href = '/auth/google';
    }
    
    loginWithGitHub() {
        window.location.href = '/auth/github';
    }
    
    loginWithFacebook() {
        window.location.href = '/auth/facebook';
    }
    
    async logout() {
        try {
            await fetch('/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            this.isAuthenticated = false;
            this.user = null;
            
            this.showNotification(i18n.t('auth_logout_success') || 'Logged out successfully');
            this.renderUserProfile();
            
            // Reload to clear any user-specific data
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }
    
    renderUserProfile() {
        const container = document.getElementById('user-profile-container');
        if (!container) return;
        
        if (this.isAuthenticated && this.user) {
            container.innerHTML = `
                <div class="relative">
                    <button 
                        onclick="authManager.toggleUserMenu()"
                        class="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                        aria-label="${i18n.t('auth_user_menu')}">
                        ${this.user.picture ? 
                            `<img src="${this.user.picture}" alt="${this.user.name}" class="w-8 h-8 rounded-full">` :
                            `<div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                                ${this.user.name.charAt(0).toUpperCase()}
                            </div>`
                        }
                        <span class="hidden md:inline text-sm font-medium">${this.user.name}</span>
                        ${this.user.isPremium ? '<span class="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full ml-1">PRO</span>' : ''}
                        <i class="fas fa-chevron-down text-xs"></i>
                    </button>
                    
                    <div id="user-menu" class="hidden absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                            <p class="text-sm font-semibold text-gray-900 dark:text-white">${this.user.name}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">${this.user.email}</p>
                            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                <i class="fab fa-${this.user.provider}"></i> ${this.user.provider.charAt(0).toUpperCase() + this.user.provider.slice(1)}
                            </p>
                        </div>
                        
                        <div class="p-2">
                            ${!this.user.isPremium ? `
                                <button onclick="authManager.showPremiumUpgrade()" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center">
                                    <i class="fas fa-star text-yellow-500 mr-2"></i>
                                    ${i18n.t('auth_upgrade_premium')}
                                </button>
                            ` : ''}
                            <button onclick="authManager.logout()" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center">
                                <i class="fas fa-sign-out-alt mr-2"></i>
                                ${i18n.t('auth_logout')}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <button 
                    onclick="authManager.showLoginModal()"
                    class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2">
                    <i class="fas fa-sign-in-alt"></i>
                    <span>${i18n.t('auth_login')}</span>
                </button>
            `;
        }
    }
    
    toggleUserMenu() {
        const menu = document.getElementById('user-menu');
        if (menu) {
            menu.classList.toggle('hidden');
        }
    }
    
    showLoginModal() {
        const modal = document.createElement('div');
        modal.id = 'login-modal';
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
        modal.onclick = (e) => {
            if (e.target === modal) this.closeLoginModal();
        };
        
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                        ${i18n.t('auth_login') || 'Sign In'}
                    </h2>
                    <button onclick="authManager.closeLoginModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <p class="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                    Continue with your preferred account
                </p>
                
                <div class="space-y-3">
                    <button 
                        onclick="authManager.loginWithGoogle()"
                        class="w-full flex items-center justify-center space-x-3 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <svg class="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span class="font-medium text-gray-700 dark:text-gray-300">Continue with Google</span>
                    </button>
                    
                    <button 
                        onclick="authManager.loginWithGitHub()"
                        class="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors">
                        <i class="fab fa-github text-xl"></i>
                        <span class="font-medium">Continue with GitHub</span>
                    </button>
                    
                    <button 
                        onclick="authManager.loginWithFacebook()"
                        class="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fab fa-facebook text-xl"></i>
                        <span class="font-medium">Continue with Facebook</span>
                    </button>
                </div>
                
                <p class="mt-6 text-xs text-center text-gray-500 dark:text-gray-400">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    closeLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.remove();
        }
    }
    
    showPremiumUpgrade() {
        this.toggleUserMenu();
        alert(i18n.t('onboarding_premium_coming_soon') || 'Premium features coming soon! Stay tuned.');
    }
    
    requirePremium(featureName) {
        if (!this.isAuthenticated) {
            this.showLoginModal();
            return false;
        }
        
        if (!this.user.isPremium) {
            this.showNotification(
                i18n.t('auth_premium_required') || `${featureName} requires Premium subscription`,
                'warning'
            );
            return false;
        }
        
        return true;
    }
    
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            type === 'error' ? 'bg-red-500' : 
            type === 'warning' ? 'bg-yellow-500' :
            'bg-green-500'
        } text-white`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Global instance
const authManager = new AuthManager();

// Initialize when DOM loads
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // Wait for i18n to load
        function waitForI18n(callback) {
            if (typeof i18n !== 'undefined' && i18n.translations) {
                callback();
            } else {
                setTimeout(() => waitForI18n(callback), 50);
            }
        }
        
        waitForI18n(() => {
            authManager.initialize();
        });
    });
    
    // Close user menu when clicking outside
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('user-menu');
        const profileContainer = document.getElementById('user-profile-container');
        if (menu && !menu.classList.contains('hidden') && 
            !profileContainer?.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });
}
