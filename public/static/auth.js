/**
 * MoodMash Authentication System
 * Complete authentication flow with multiple methods
 * Version: 5.0.0
 */

class MoodMashAuth {
  constructor() {
    this.currentView = window.initialAuthView || 'register'; // register or login
    // Wait for i18n to be available
    this.i18n = typeof i18n !== 'undefined' ? i18n : null;
    this.init();
  }

  async init() {
    await this.checkSession();
    await this.waitForI18n();
    this.render();
    this.attachEventListeners();
    this.renderTurnstile();
  }

  async waitForI18n() {
    // Wait for i18n to be fully loaded
    return new Promise((resolve) => {
      const check = () => {
        if (typeof i18n !== 'undefined' && i18n.translations) {
          this.i18n = i18n;
          console.log('[AUTH] i18n loaded successfully, test translation:', i18n.t('auth_welcome_back'));
          resolve();
        } else {
          console.log('[AUTH] Waiting for i18n...', typeof i18n, typeof window.i18n);
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  async checkSession() {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const user = await response.json();
        if (user && user.id) {
          // User is already authenticated, redirect to dashboard
          window.location.href = '/';
          return;
        }
      }
    } catch (error) {
      console.log('No active session');
    }
  }

  render() {
    const container = document.getElementById('auth-container');
    if (!container) return;

    // Check for OAuth error in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const provider = urlParams.get('provider');
    
    let errorMessage = '';
    if (error === 'oauth_not_configured' && provider) {
      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
      errorMessage = `
        <div class="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div class="flex items-start">
            <i class="fas fa-info-circle text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3"></i>
            <div>
              <h3 class="font-semibold text-yellow-800 dark:text-yellow-400 mb-1">
                ${providerName} OAuth Not Configured
              </h3>
              <p class="text-sm text-yellow-700 dark:text-yellow-500">
                ${providerName} sign-in is not yet available. Please use email/password or choose another sign-in method.
              </p>
            </div>
          </div>
        </div>
      `;
    } else if (error === 'oauth_failed') {
      errorMessage = `
        <div class="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div class="flex items-start">
            <i class="fas fa-exclamation-circle text-red-600 dark:text-red-400 mt-0.5 mr-3"></i>
            <div>
              <h3 class="font-semibold text-red-800 dark:text-red-400 mb-1">
                Sign-In Failed
              </h3>
              <p class="text-sm text-red-700 dark:text-red-500">
                There was an error during sign-in. Please try again or use a different method.
              </p>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div class="w-full max-w-md">
          <!-- Logo and Title -->
          <div class="text-center mb-8">
            <div class="flex items-center justify-center mb-4">
              <div class="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <i class="fas fa-heart text-4xl text-white"></i>
              </div>
            </div>
            <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2" id="auth-title">
              MoodMash
            </h1>
            <p class="text-lg text-gray-600 dark:text-gray-400 mb-1" id="auth-subtitle">
              ${this.currentView === 'register' ? this.t('auth_create_account') : this.t('auth_welcome_back')}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-500">
              ${this.currentView === 'register' ? this.t('auth_start_tracking') : this.t('auth_sign_in_continue')}
            </p>
          </div>

          <!-- OAuth Error Message -->
          ${errorMessage}

          <!-- Main Auth Card -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
            
            <!-- Tab Switcher -->
            <div class="flex mb-8 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button 
                id="tab-login" 
                class="flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${this.currentView === 'login' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}"
                onclick="authManager.switchView('login')"
              >
                ${this.t('auth_login')}
              </button>
              <button 
                id="tab-register" 
                class="flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${this.currentView === 'register' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}"
                onclick="authManager.switchView('register')"
              >
                ${this.t('auth_register')}
              </button>
            </div>

            <!-- Auth Form -->
            <form id="auth-form" onsubmit="authManager.handleSubmit(event)">
              <div id="form-fields">
                ${this.renderFormFields()}
              </div>

              <!-- Password Strength Meter (Register only) -->
              ${this.currentView === 'register' ? `
                <div id="password-strength" class="hidden mb-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Password Strength:</span>
                    <span id="strength-text" class="text-sm font-semibold"></span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div id="strength-bar" class="h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                  </div>
                  <div id="strength-errors" class="mt-2 text-sm text-red-600 dark:text-red-400"></div>
                </div>
              ` : ''}

              <!-- Cloudflare Turnstile (Bot Protection) -->
              <div class="mt-6 mb-4">
                <div class="cf-turnstile" 
                     data-sitekey="0x4AAAAAACGcDquzRPgpJm9K" 
                     data-theme="auto"
                     data-size="normal"
                     id="turnstile-widget">
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center justify-center">
                  <i class="fas fa-shield-alt mr-1"></i>
                  Protected by Cloudflare Turnstile
                </p>
              </div>

              <!-- Submit Button -->
              <button 
                type="submit" 
                class="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 mt-6"
                id="submit-btn"
              >
                <i class="fas ${this.currentView === 'register' ? 'fa-user-plus' : 'fa-sign-in-alt'}"></i>
                <span>${this.currentView === 'register' ? this.t('auth_create_account') : this.t('auth_sign_in')}</span>
              </button>
            </form>

            <!-- Divider -->
            <div class="flex items-center my-6">
              <div class="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
              <span class="px-4 text-gray-500 dark:text-gray-400 text-sm uppercase">${this.t('auth_or_continue_with')}</span>
              <div class="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            </div>

            <!-- OAuth Providers -->
            <div class="grid grid-cols-2 gap-3 mb-6">
              ${this.renderOAuthProviders()}
            </div>

            <!-- Alternative Auth Methods -->
            <div class="space-y-3">
              <button 
                onclick="authManager.signInWithKey()" 
                class="w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 border border-gray-300 dark:border-gray-600"
              >
                <i class="fas fa-key"></i>
                <span>${this.t('auth_sign_in_key')}</span>
              </button>

              <button 
                onclick="authManager.useBiometrics()" 
                class="w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 border border-gray-300 dark:border-gray-600"
              >
                <i class="fas fa-fingerprint"></i>
                <span>${this.t('auth_use_biometrics')}</span>
              </button>
            </div>

            <!-- Security Notice -->
            <div class="mt-6 text-center">
              <p class="text-gray-500 dark:text-gray-400 text-sm flex items-center justify-center space-x-2">
                <i class="fas fa-lock"></i>
                <span>${this.t('auth_protected_encryption')}</span>
              </p>
            </div>
          </div>

          <!-- Error/Success Messages -->
          <div id="auth-message" class="mt-4 hidden"></div>
        </div>
      </div>
    `;
  }

  renderFormFields() {
    if (this.currentView === 'register') {
      return `
        <!-- Username -->
        <div class="mb-4">
          <label class="block text-white font-medium mb-2">${this.t('auth_username')}</label>
          <input 
            type="text" 
            id="username" 
            name="username"
            placeholder="${this.t('auth_username_placeholder')}"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
            required
            autocomplete="username"
          >
        </div>

        <!-- Email -->
        <div class="mb-4">
          <label class="block text-white font-medium mb-2">${this.t('auth_email')}</label>
          <input 
            type="email" 
            id="email" 
            name="email"
            placeholder="${this.t('auth_email_placeholder')}"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
            required
            autocomplete="email"
          >
        </div>

        <!-- Password -->
        <div class="mb-4 relative">
          <label class="block text-gray-700 dark:text-gray-300 font-medium mb-2">${this.t('auth_password')}</label>
          <input 
            type="password" 
            id="password" 
            name="password"
            placeholder="${this.t('auth_password_placeholder')}"
            class="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
            required
            autocomplete="new-password"
            oninput="authManager.checkPasswordStrength()"
          >
          <button 
            type="button" 
            onclick="authManager.togglePassword('password')"
            class="absolute right-4 top-11 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <i class="fas fa-eye" id="password-toggle"></i>
          </button>
        </div>

        <!-- Confirm Password -->
        <div class="mb-4 relative">
          <label class="block text-gray-700 dark:text-gray-300 font-medium mb-2">${this.t('auth_confirm_password')}</label>
          <input 
            type="password" 
            id="confirm-password" 
            name="confirm-password"
            placeholder="${this.t('auth_confirm_password_placeholder')}"
            class="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
            required
            autocomplete="new-password"
          >
          <button 
            type="button" 
            onclick="authManager.togglePassword('confirm-password')"
            class="absolute right-4 top-11 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <i class="fas fa-eye" id="confirm-password-toggle"></i>
          </button>
        </div>
      `;
    } else {
      return `
        <!-- Username -->
        <div class="mb-4">
          <label class="block text-gray-700 dark:text-gray-300 font-medium mb-2">${this.t('auth_username')}</label>
          <input 
            type="text" 
            id="username" 
            name="username"
            placeholder="${this.t('auth_username_login_placeholder')}"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
            required
            autocomplete="username"
          >
        </div>

        <!-- Password -->
        <div class="mb-4 relative">
          <label class="block text-gray-700 dark:text-gray-300 font-medium mb-2">${this.t('auth_password')}</label>
          <input 
            type="password" 
            id="password" 
            name="password"
            placeholder="${this.t('auth_password_login_placeholder')}"
            class="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
            required
            autocomplete="current-password"
          >
          <button 
            type="button" 
            onclick="authManager.togglePassword('password')"
            class="absolute right-4 top-11 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <i class="fas fa-eye" id="password-toggle"></i>
          </button>
        </div>

        <!-- Trust Device -->
        <div class="mb-4 flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="trust-device" 
            name="trust-device"
            class="w-5 h-5 rounded border-purple-700 bg-black/40 text-purple-600 focus:ring-purple-500"
          >
          <label for="trust-device" class="text-white">
            <span class="font-medium">${this.t('auth_trust_device')}</span>
            <span class="block text-sm text-purple-300">${this.t('auth_trust_device_desc')}</span>
          </label>
        </div>

        <!-- Forgot Password & Magic Link -->
        <div class="mb-4 flex justify-between items-center">
          <a href="#" onclick="authManager.useMagicLink(); return false;" class="text-purple-300 hover:text-purple-200 text-sm">
            <i class="fas fa-magic mr-1"></i>
            ${this.t('auth_magic_link')}
          </a>
          <a href="#" onclick="authManager.forgotPassword(); return false;" class="text-purple-300 hover:text-purple-200 text-sm">
            ${this.t('auth_forgot_password')}
          </a>
        </div>
      `;
    }
  }

  renderOAuthProviders() {
    const providers = [
      { 
        id: 'google',
        svg: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z" fill="#4285F4"/>
          <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
          <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
          <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
        </svg>`,
        bgColor: 'bg-white hover:bg-gray-50',
        textColor: 'text-gray-700',
        border: 'border-gray-300'
      },
      { 
        id: 'github',
        svg: `<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.163 20 14.418 20 10c0-5.523-4.477-10-10-10z"/>
        </svg>`,
        bgColor: 'bg-gray-900 hover:bg-gray-800',
        textColor: 'text-white',
        border: 'border-gray-900'
      }
    ];

    return providers.map(provider => `
      <button 
        type="button"
        onclick="authManager.oauthLogin('${provider.id}')" 
        class="w-full py-3 ${provider.bgColor} rounded-lg flex items-center justify-center ${provider.textColor} text-sm font-medium transition-all duration-300 hover:shadow-lg border ${provider.border} space-x-3"
        title="${this.t('auth_continue_with')} ${provider.id.charAt(0).toUpperCase() + provider.id.slice(1)}"
      >
        <span class="flex-shrink-0">${provider.svg}</span>
        <span>Continue with ${provider.id.charAt(0).toUpperCase() + provider.id.slice(1)}</span>
      </button>
    `).join('');
  }

  switchView(view) {
    this.currentView = view;
    this.render();
    this.attachEventListeners();
    this.renderTurnstile();
  }

  attachEventListeners() {
    // Form is handled by inline onsubmit
  }

  renderTurnstile() {
    // Wait for Turnstile script to load
    if (typeof window.turnstile !== 'undefined') {
      const container = document.getElementById('turnstile-widget');
      if (container && !container.hasAttribute('data-rendered')) {
        try {
          window.turnstile.render('#turnstile-widget', {
            sitekey: '0x4AAAAAACGcDquzRPgpJm9K', // Production key
            theme: 'auto', // Auto detect light/dark mode
            callback: function(token) {
              console.log('[Turnstile] Verification successful', token ? 'Token received' : 'No token');
            },
            'error-callback': function() {
              console.error('[Turnstile] Verification failed');
            },
            'expired-callback': function() {
              console.warn('[Turnstile] Token expired, please refresh');
            }
          });
          container.setAttribute('data-rendered', 'true');
          console.log('[Turnstile] Widget rendered successfully');
        } catch (error) {
          console.error('[Turnstile] Failed to render widget:', error);
        }
      }
    } else {
      // Retry after a short delay (max 10 seconds)
      const retryCount = (this.turnstileRetries || 0) + 1;
      if (retryCount < 100) { // 100 * 100ms = 10 seconds max
        this.turnstileRetries = retryCount;
        setTimeout(() => this.renderTurnstile(), 100);
      } else {
        console.error('[Turnstile] Script failed to load after 10 seconds');
      }
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    // Get Turnstile token
    const turnstileToken = window.turnstile?.getResponse();
    if (!turnstileToken) {
      this.showMessage('Please complete the bot verification', 'error');
      return;
    }
    
    const formData = new FormData(event.target);
    const data = {
      username: formData.get('username'),
      password: formData.get('password'),
      turnstileToken: turnstileToken, // Add Turnstile token
    };

    if (this.currentView === 'register') {
      data.email = formData.get('email');
      data.confirmPassword = formData.get('confirm-password');

      if (data.password !== data.confirmPassword) {
        this.showMessage(this.t('auth_passwords_not_match'), 'error');
        return;
      }
    } else {
      data.trustDevice = formData.get('trust-device') === 'on';
    }

    try {
      const endpoint = this.currentView === 'register' ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        this.showMessage(
          this.currentView === 'register' 
            ? this.t('auth_account_created') 
            : this.t('auth_login_success'),
          'success'
        );
        
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        this.showMessage(result.error || this.t('auth_error_occurred'), 'error');
      }
    } catch (error) {
      console.error('Auth error:', error);
      this.showMessage(this.t('auth_error_occurred'), 'error');
    }
  }

  async checkPasswordStrength() {
    const passwordInput = document.getElementById('password');
    const strengthContainer = document.getElementById('password-strength');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    const strengthErrors = document.getElementById('strength-errors');
    
    if (!passwordInput || !strengthContainer) return;
    
    const password = passwordInput.value;
    
    if (!password || password.length === 0) {
      strengthContainer.classList.add('hidden');
      return;
    }
    
    strengthContainer.classList.remove('hidden');
    
    try {
      // Call API to check password strength
      const response = await fetch('/api/auth/check-password-strength', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const result = await response.json();
      
      // Update strength bar
      const score = result.score || 0;
      const strength = result.strength || 'weak';
      
      strengthBar.style.width = `${score}%`;
      
      // Color based on strength
      const colors = {
        weak: 'bg-red-500',
        medium: 'bg-yellow-500',
        strong: 'bg-blue-500',
        very_strong: 'bg-green-500'
      };
      
      const textColors = {
        weak: 'text-red-600 dark:text-red-400',
        medium: 'text-yellow-600 dark:text-yellow-400',
        strong: 'text-blue-600 dark:text-blue-400',
        very_strong: 'text-green-600 dark:text-green-400'
      };
      
      // Remove all color classes
      strengthBar.className = 'h-2 rounded-full transition-all duration-300 ' + (colors[strength] || 'bg-gray-500');
      strengthText.className = 'text-sm font-semibold ' + (textColors[strength] || 'text-gray-600');
      strengthText.textContent = strength.replace('_', ' ').toUpperCase();
      
      // Show errors if any
      if (result.errors && result.errors.length > 0) {
        strengthErrors.innerHTML = result.errors.map(err => 
          `<div class="flex items-start space-x-1 mt-1">
            <i class="fas fa-exclamation-circle mt-0.5"></i>
            <span>${err}</span>
          </div>`
        ).join('');
      } else if (result.breached) {
        strengthErrors.innerHTML = `
          <div class="flex items-start space-x-1 mt-1">
            <i class="fas fa-exclamation-triangle mt-0.5"></i>
            <span>This password has been found in data breaches. Please choose a different one.</span>
          </div>`;
      } else {
        strengthErrors.innerHTML = '';
      }
    } catch (error) {
      console.error('Password strength check error:', error);
    }
  }

  togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(`${inputId}-toggle`);
    
    if (input.type === 'password') {
      input.type = 'text';
      toggle.classList.remove('fa-eye');
      toggle.classList.add('fa-eye-slash');
    } else {
      input.type = 'password';
      toggle.classList.remove('fa-eye-slash');
      toggle.classList.add('fa-eye');
    }
  }

  async oauthLogin(provider) {
    this.showMessage(this.t('auth_redirecting_provider').replace('{provider}', provider), 'info');
    
    // Redirect to OAuth flow (direct routes, not /api/auth/oauth/)
    window.location.href = `/auth/${provider}`;
  }

  async signInWithKey() {
    if (!window.PublicKeyCredential) {
      this.showMessage(this.t('auth_webauthn_not_supported'), 'error');
      return;
    }

    try {
      this.showMessage(this.t('auth_preparing_webauthn'), 'info');
      
      // Get challenge from server
      const challengeResponse = await fetch('/api/auth/webauthn/login/challenge');
      const challengeData = await challengeResponse.json();

      // Request authentication
      const credential = await navigator.credentials.get({
        publicKey: challengeData.publicKey
      });

      // Verify with server
      const verifyResponse = await fetch('/api/auth/webauthn/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: {
            id: credential.id,
            rawId: this.arrayBufferToBase64(credential.rawId),
            response: {
              authenticatorData: this.arrayBufferToBase64(credential.response.authenticatorData),
              clientDataJSON: this.arrayBufferToBase64(credential.response.clientDataJSON),
              signature: this.arrayBufferToBase64(credential.response.signature),
              userHandle: credential.response.userHandle ? this.arrayBufferToBase64(credential.response.userHandle) : null
            },
            type: credential.type
          }
        })
      });

      if (verifyResponse.ok) {
        this.showMessage(this.t('auth_webauthn_success'), 'success');
        setTimeout(() => window.location.href = '/', 1000);
      } else {
        this.showMessage(this.t('auth_webauthn_failed'), 'error');
      }
    } catch (error) {
      console.error('WebAuthn error:', error);
      this.showMessage(this.t('auth_webauthn_error'), 'error');
    }
  }

  async useBiometrics() {
    if (!window.PublicKeyCredential) {
      this.showMessage(this.t('auth_biometrics_not_supported'), 'error');
      return;
    }

    // Use same WebAuthn flow but with platform authenticator
    await this.signInWithKey();
  }

  async useMagicLink() {
    const email = prompt(this.t('auth_magic_link_prompt'));
    if (!email) return;

    try {
      this.showMessage(this.t('auth_magic_link_sending'), 'info');
      
      const response = await fetch('/api/auth/magic-link/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        this.showMessage(this.t('auth_magic_link_sent'), 'success');
        
        // In development, show debug info
        if (data.debug) {
          console.log('Magic Link:', data.debug.link);
          console.log('Token:', data.debug.token);
          console.log('Expires in:', data.debug.expires_in_minutes, 'minutes');
          
          // Show clickable link in development
          setTimeout(() => {
            this.showMessage(
              `Development: Click here to login → <a href="${data.debug.link}" class="underline">Magic Link</a>`, 
              'info'
            );
          }, 1000);
        }
      } else {
        this.showMessage(data.error || this.t('auth_magic_link_failed'), 'error');
      }
    } catch (error) {
      console.error('Magic link error:', error);
      this.showMessage(this.t('auth_error_occurred'), 'error');
    }
  }

  async forgotPassword() {
    const email = prompt(this.t('auth_forgot_password_prompt'));
    if (!email) return;

    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        this.showMessage(this.t('auth_password_reset_sent'), 'success');
      } else {
        this.showMessage(this.t('auth_password_reset_failed'), 'error');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      this.showMessage(this.t('auth_error_occurred'), 'error');
    }
  }

  showMessage(message, type = 'info') {
    const messageEl = document.getElementById('auth-message');
    if (!messageEl) return;

    const colors = {
      success: 'bg-green-500/20 border-green-500 text-green-200',
      error: 'bg-red-500/20 border-red-500 text-red-200',
      info: 'bg-blue-500/20 border-blue-500 text-blue-200'
    };

    messageEl.className = `mt-4 p-4 rounded-xl border ${colors[type]}`;
    messageEl.innerHTML = message; // Use innerHTML to support HTML links
    messageEl.classList.remove('hidden');

    setTimeout(() => {
      messageEl.classList.add('hidden');
    }, 8000); // Longer timeout for magic links
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  t(key) {
    // Try to get i18n if not set yet
    if (!this.i18n && typeof i18n !== 'undefined') {
      this.i18n = i18n;
    }
    
    // Debug logging
    if (!this.i18n) {
      console.error('[AUTH] t() called but i18n not available!', key);
      return key;
    }
    
    const result = this.i18n.t(key);
    if (result === key) {
      console.warn('[AUTH] Translation failed for:', key, '- i18n available:', !!this.i18n);
    }
    
    return result;
  }
}

// Initialize auth manager
let authManager;
document.addEventListener('DOMContentLoaded', () => {
  authManager = new MoodMashAuth();
});

/**
 * iOS Keyboard Input Fix
 * Fixes keyboard not appearing on iOS devices
 */
function iosInputFix() {
  // Detect iOS device
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  
  if (!isIOS) {
    console.log('[iOS Fix] Not an iOS device, skipping');
    return;
  }
  
  console.log('[iOS Fix] Applying iOS keyboard fixes');
  
  // Fix 1: Remove readonly attribute on touch/focus
  const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="tel"], textarea');
  
  inputs.forEach(input => {
    // Remove readonly on touchstart
    input.addEventListener('touchstart', function() {
      if (this.hasAttribute('readonly')) {
        console.log('[iOS Fix] Removing readonly from', this.id || this.name);
        this.removeAttribute('readonly');
      }
    });
    
    // Remove readonly on focus
    input.addEventListener('focus', function() {
      if (this.hasAttribute('readonly')) {
        console.log('[iOS Fix] Removing readonly on focus from', this.id || this.name);
        this.removeAttribute('readonly');
      }
    });
    
    // Ensure font-size is at least 16px to prevent zoom
    const computedStyle = window.getComputedStyle(input);
    const fontSize = parseFloat(computedStyle.fontSize);
    if (fontSize < 16) {
      console.log('[iOS Fix] Increasing font size for', this.id || this.name);
      input.style.fontSize = '16px';
    }
  });
  
  // Fix 2: Ensure inputs are properly focused
  inputs.forEach(input => {
    input.addEventListener('click', function(e) {
      e.preventDefault();
      this.focus();
      console.log('[iOS Fix] Input clicked and focused:', this.id || this.name);
    });
  });
  
  // Fix 3: Prevent viewport zoom on input focus
  const viewport = document.querySelector('meta[name=viewport]');
  if (viewport) {
    const content = viewport.getAttribute('content');
    if (!content.includes('user-scalable')) {
      // Note: We want to keep user-scalable=yes for accessibility
      // Just ensuring it's not set to 'no'
      console.log('[iOS Fix] Viewport allows user scaling (good for accessibility)');
    }
  }
  
  console.log('[iOS Fix] Applied fixes to', inputs.length, 'input fields');
}

// Apply iOS fixes after DOM is loaded
document.addEventListener('DOMContentLoaded', iosInputFix);

// Also apply after auth forms are rendered (they're dynamic)
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      iosInputFix();
    }
  });
});

// Start observing auth container for changes
document.addEventListener('DOMContentLoaded', () => {
  const authContainer = document.getElementById('app');
  if (authContainer) {
    observer.observe(authContainer, {
      childList: true,
      subtree: true
    });
  }
});
