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
            <div class="grid grid-cols-5 gap-3 mb-6">
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
      { id: 'google', icon: 'fab fa-google', color: 'hover:bg-red-500' },
      { id: 'apple', icon: 'fab fa-apple', color: 'hover:bg-gray-800' },
      { id: 'facebook', icon: 'fab fa-facebook-f', color: 'hover:bg-blue-600' },
      { id: 'x', icon: 'fab fa-x-twitter', color: 'hover:bg-black' },
      { id: 'github', icon: 'fab fa-github', color: 'hover:bg-gray-700' }
    ];

    return providers.map(provider => `
      <button 
        type="button"
        onclick="authManager.oauthLogin('${provider.id}')" 
        class="w-full aspect-square bg-black/40 ${provider.color} rounded-xl flex items-center justify-center text-white text-xl transition-all duration-300 hover:scale-105 border border-purple-700/50"
        title="${this.t('auth_continue_with')} ${provider.id}"
      >
        <i class="${provider.icon}"></i>
      </button>
    `).join('');
  }

  switchView(view) {
    this.currentView = view;
    this.render();
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Form is handled by inline onsubmit
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
      username: formData.get('username'),
      password: formData.get('password'),
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
    
    // In production, this would redirect to OAuth flow
    window.location.href = `/api/auth/oauth/${provider}`;
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
