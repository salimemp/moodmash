// MoodMash Auth0 Authentication Manager

class AuthManager {
    constructor() {
        this.user = null;
        this.token = null;
        this.isAuthenticated = false;
        
        // Auth0 configuration (these should be environment variables in production)
        this.config = {
            domain: 'YOUR_AUTH0_DOMAIN.auth0.com',
            clientId: 'YOUR_AUTH0_CLIENT_ID',
            redirectUri: window.location.origin,
            audience: 'YOUR_AUTH0_API_AUDIENCE'
        };
        
        // Initialize from localStorage
        this.loadFromStorage();
    }
    
    async initialize() {
        // Check if we have a valid token
        if (this.token) {
            try {
                await this.validateToken();
            } catch (error) {
                console.error('Token validation failed:', error);
                this.logout();
            }
        }
        
        // Check for Auth0 callback
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('code')) {
            await this.handleCallback();
        }
    }
    
    async login() {
        // For MVP, we'll use a mock login
        // In production, this would redirect to Auth0
        
        const useMockAuth = true; // Set to false when Auth0 is configured
        
        if (useMockAuth) {
            this.mockLogin();
            return;
        }
        
        // Real Auth0 login
        const authUrl = `https://${this.config.domain}/authorize?` + new URLSearchParams({
            response_type: 'code',
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            scope: 'openid profile email',
            audience: this.config.audience
        });
        
        window.location.href = authUrl;
    }
    
    mockLogin() {
        // Mock authentication for MVP
        this.user = {
            id: 'mock_user_' + Date.now(),
            email: 'demo@moodmash.com',
            name: 'Demo User',
            picture: '👤',
            tier: 'free' // or 'premium'
        };
        
        this.token = 'mock_token_' + Math.random().toString(36).substr(2);
        this.isAuthenticated = true;
        
        this.saveToStorage();
        this.renderUserProfile();
        
        // Show welcome message
        this.showNotification(i18n.t('auth_login_success') || 'Welcome back!');
    }
    
    async handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) return;
        
        try {
            // Exchange code for token
            const response = await fetch(`https://${this.config.domain}/oauth/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grant_type: 'authorization_code',
                    client_id: this.config.clientId,
                    code: code,
                    redirect_uri: this.config.redirectUri
                })
            });
            
            const data = await response.json();
            
            if (data.access_token) {
                this.token = data.access_token;
                await this.getUserInfo();
                this.saveToStorage();
                
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
                this.renderUserProfile();
            }
        } catch (error) {
            console.error('Auth callback error:', error);
            this.showNotification(i18n.t('auth_error') || 'Authentication failed');
        }
    }
    
    async getUserInfo() {
        try {
            const response = await fetch(`https://${this.config.domain}/userinfo`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            this.user = await response.json();
            this.isAuthenticated = true;
            
            // Check if user has premium subscription
            this.user.tier = this.user.premium ? 'premium' : 'free';
            
        } catch (error) {
            console.error('Get user info error:', error);
            throw error;
        }
    }
    
    async validateToken() {
        // Simple token validation
        if (!this.token) return false;
        
        // In mock mode, always valid
        if (this.token.startsWith('mock_token_')) {
            this.isAuthenticated = true;
            return true;
        }
        
        try {
            await this.getUserInfo();
            return true;
        } catch (error) {
            return false;
        }
    }
    
    logout() {
        this.user = null;
        this.token = null;
        this.isAuthenticated = false;
        
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
        
        this.renderUserProfile();
        this.showNotification(i18n.t('auth_logout_success') || 'Logged out successfully');
        
        // Optionally redirect to home
        if (window.location.pathname !== '/') {
            window.location.href = '/';
        }
    }
    
    saveToStorage() {
        if (this.user) {
            localStorage.setItem('auth_user', JSON.stringify(this.user));
        }
        if (this.token) {
            localStorage.setItem('auth_token', this.token);
        }
    }
    
    loadFromStorage() {
        try {
            const userStr = localStorage.getItem('auth_user');
            const token = localStorage.getItem('auth_token');
            
            if (userStr && token) {
                this.user = JSON.parse(userStr);
                this.token = token;
                this.isAuthenticated = true;
            }
        } catch (error) {
            console.error('Load auth from storage error:', error);
        }
    }
    
    renderUserProfile() {
        const container = document.getElementById('user-profile-container');
        if (!container) return;
        
        if (this.isAuthenticated && this.user) {
            container.innerHTML = `
                <div class="flex items-center space-x-3">
                    ${this.user.tier === 'premium' ? '<span class="premium-badge">⭐ Premium</span>' : ''}
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                            ${this.user.picture || this.user.name?.charAt(0) || '👤'}
                        </div>
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:inline">
                            ${this.user.name || this.user.email}
                        </span>
                    </div>
                    <button onclick="authManager.showUserMenu()" 
                            class="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                            aria-label="${i18n.t('auth_user_menu') || 'User menu'}">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <button onclick="authManager.login()" 
                        class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 font-medium"
                        aria-label="${i18n.t('auth_login') || 'Login'}">
                    <i class="fas fa-sign-in-alt mr-2"></i>
                    ${i18n.t('auth_login') || 'Login'}
                </button>
            `;
        }
    }
    
    showUserMenu() {
        const menu = document.createElement('div');
        menu.id = 'user-menu';
        menu.className = 'fixed top-16 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 min-w-[200px]';
        menu.innerHTML = `
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                <p class="text-sm font-semibold text-gray-800 dark:text-white">${this.user.name}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">${this.user.email}</p>
                ${this.user.tier === 'premium' ? '<span class="premium-badge mt-2 inline-block">⭐ Premium</span>' : ''}
            </div>
            <div class="py-2">
                ${this.user.tier !== 'premium' ? `
                    <button onclick="authManager.upgradeToPremium(); authManager.closeUserMenu();" 
                            class="w-full px-4 py-2 text-left text-sm text-purple-600 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center">
                        <i class="fas fa-crown mr-3"></i>
                        ${i18n.t('auth_upgrade_premium') || 'Upgrade to Premium'}
                    </button>
                ` : ''}
                <button onclick="window.location.href='/profile'; authManager.closeUserMenu();" 
                        class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center">
                    <i class="fas fa-user mr-3"></i>
                    ${i18n.t('auth_profile') || 'Profile'}
                </button>
                <button onclick="window.location.href='/settings'; authManager.closeUserMenu();" 
                        class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center">
                    <i class="fas fa-cog mr-3"></i>
                    ${i18n.t('auth_settings') || 'Settings'}
                </button>
                <hr class="my-2 border-gray-200 dark:border-gray-700">
                <button onclick="authManager.logout(); authManager.closeUserMenu();" 
                        class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center">
                    <i class="fas fa-sign-out-alt mr-3"></i>
                    ${i18n.t('auth_logout') || 'Logout'}
                </button>
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Close on click outside
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target)) {
                    this.closeUserMenu();
                }
            }, { once: true });
        }, 100);
    }
    
    closeUserMenu() {
        const menu = document.getElementById('user-menu');
        if (menu) menu.remove();
    }
    
    upgradeToPremium() {
        // For MVP, show alert
        alert(i18n.t('onboarding_premium_coming_soon') || 'Premium features coming soon! Stay tuned.');
        
        // In production, redirect to payment page
        // window.location.href = '/upgrade';
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center animate-slideInUp';
        notification.innerHTML = `
            <i class="fas fa-check-circle mr-3 text-xl"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    requireAuth() {
        if (!this.isAuthenticated) {
            this.showNotification(i18n.t('auth_required') || 'Please login to continue');
            this.login();
            return false;
        }
        return true;
    }
    
    requirePremium() {
        if (!this.isAuthenticated) {
            this.requireAuth();
            return false;
        }
        
        if (this.user.tier !== 'premium') {
            this.showNotification(i18n.t('auth_premium_required') || 'This feature requires Premium');
            this.upgradeToPremium();
            return false;
        }
        
        return true;
    }
}

// Global instance
const authManager = new AuthManager();

// Initialize auth after DOM loads
if (typeof window !== 'undefined') {
    window.addEventListener('load', async () => {
        await authManager.initialize();
        authManager.renderUserProfile();
    });
}
