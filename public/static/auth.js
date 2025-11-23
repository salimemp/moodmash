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
    this.render();
    this.attachEventListeners();
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
      <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
        <div class="w-full max-w-md">
          <!-- Logo and Title -->
          <div class="text-center mb-8">
            <div class="flex items-center justify-center mb-4">
              <div class="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                <i class="fas fa-smile text-3xl text-white"></i>
              </div>
            </div>
            <h1 class="text-3xl font-bold text-white mb-2" id="auth-title">
              ${this.currentView === 'register' ? this.t('auth_create_account') : this.t('auth_welcome_back')}
            </h1>
            <p class="text-purple-200" id="auth-subtitle">
              ${this.currentView === 'register' ? this.t('auth_start_tracking') : this.t('auth_sign_in_continue')}
            </p>
          </div>

          <!-- Main Auth Card -->
          <div class="bg-gradient-to-br from-purple-800/50 to-purple-900/50 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-purple-700/50">
            
            <!-- Tab Switcher -->
            <div class="flex mb-8 bg-black/30 rounded-full p-1">
              <button 
                id="tab-login" 
                class="flex-1 py-3 px-6 rounded-full font-semibold transition-all duration-300 ${this.currentView === 'login' ? 'bg-purple-600 text-white shadow-lg' : 'text-purple-300 hover:text-white'}"
                onclick="authManager.switchView('login')"
              >
                ${this.t('auth_login')}
              </button>
              <button 
                id="tab-register" 
                class="flex-1 py-3 px-6 rounded-full font-semibold transition-all duration-300 ${this.currentView === 'register' ? 'bg-purple-600 text-white shadow-lg' : 'text-purple-300 hover:text-white'}"
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

              <!-- Submit Button -->
              <button 
                type="submit" 
                class="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 mt-6"
                id="submit-btn"
              >
                <i class="fas ${this.currentView === 'register' ? 'fa-user-plus' : 'fa-sign-in-alt'}"></i>
                <span>${this.currentView === 'register' ? this.t('auth_create_account') : this.t('auth_sign_in')}</span>
              </button>
            </form>

            <!-- Divider -->
            <div class="flex items-center my-6">
              <div class="flex-1 border-t border-purple-600"></div>
              <span class="px-4 text-purple-300 text-sm uppercase">${this.t('auth_or_continue_with')}</span>
              <div class="flex-1 border-t border-purple-600"></div>
            </div>

            <!-- OAuth Providers -->
            <div class="grid grid-cols-5 gap-3 mb-6">
              ${this.renderOAuthProviders()}
            </div>

            <!-- Alternative Auth Methods -->
            <div class="space-y-3">
              <button 
                onclick="authManager.signInWithKey()" 
                class="w-full py-3 bg-black/40 hover:bg-black/60 text-white rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 border border-purple-700/50"
              >
                <i class="fas fa-key"></i>
                <span>${this.t('auth_sign_in_key')}</span>
              </button>

              <button 
                onclick="authManager.useBiometrics()" 
                class="w-full py-3 bg-black/40 hover:bg-black/60 text-white rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 border border-purple-700/50"
              >
                <i class="fas fa-fingerprint"></i>
                <span>${this.t('auth_use_biometrics')}</span>
              </button>
            </div>

            <!-- Security Notice -->
            <div class="mt-6 text-center">
              <p class="text-purple-300 text-sm flex items-center justify-center space-x-2">
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
            class="w-full px-4 py-3 bg-black/40 border border-purple-700/50 rounded-xl text-white placeholder-purple-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
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
            class="w-full px-4 py-3 bg-black/40 border border-purple-700/50 rounded-xl text-white placeholder-purple-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
            required
            autocomplete="email"
          >
        </div>

        <!-- Password -->
        <div class="mb-4 relative">
          <label class="block text-white font-medium mb-2">${this.t('auth_password')}</label>
          <input 
            type="password" 
            id="password" 
            name="password"
            placeholder="${this.t('auth_password_placeholder')}"
            class="w-full px-4 py-3 pr-12 bg-black/40 border border-purple-700/50 rounded-xl text-white placeholder-purple-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
            required
            autocomplete="new-password"
          >
          <button 
            type="button" 
            onclick="authManager.togglePassword('password')"
            class="absolute right-4 top-11 text-purple-400 hover:text-purple-300"
          >
            <i class="fas fa-eye" id="password-toggle"></i>
          </button>
        </div>

        <!-- Confirm Password -->
        <div class="mb-4 relative">
          <label class="block text-white font-medium mb-2">${this.t('auth_confirm_password')}</label>
          <input 
            type="password" 
            id="confirm-password" 
            name="confirm-password"
            placeholder="${this.t('auth_confirm_password_placeholder')}"
            class="w-full px-4 py-3 pr-12 bg-black/40 border border-purple-700/50 rounded-xl text-white placeholder-purple-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
            required
            autocomplete="new-password"
          >
          <button 
            type="button" 
            onclick="authManager.togglePassword('confirm-password')"
            class="absolute right-4 top-11 text-purple-400 hover:text-purple-300"
          >
            <i class="fas fa-eye" id="confirm-password-toggle"></i>
          </button>
        </div>
      `;
    } else {
      return `
        <!-- Username -->
        <div class="mb-4">
          <label class="block text-white font-medium mb-2">${this.t('auth_username')}</label>
          <input 
            type="text" 
            id="username" 
            name="username"
            placeholder="${this.t('auth_username_login_placeholder')}"
            class="w-full px-4 py-3 bg-black/40 border border-purple-700/50 rounded-xl text-white placeholder-purple-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
            required
            autocomplete="username"
          >
        </div>

        <!-- Password -->
        <div class="mb-4 relative">
          <label class="block text-white font-medium mb-2">${this.t('auth_password')}</label>
          <input 
            type="password" 
            id="password" 
            name="password"
            placeholder="${this.t('auth_password_login_placeholder')}"
            class="w-full px-4 py-3 pr-12 bg-black/40 border border-purple-700/50 rounded-xl text-white placeholder-purple-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
            required
            autocomplete="current-password"
          >
          <button 
            type="button" 
            onclick="authManager.togglePassword('password')"
            class="absolute right-4 top-11 text-purple-400 hover:text-purple-300"
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
    return this.i18n?.t(key) || key;
  }
}

// Initialize auth manager
let authManager;
document.addEventListener('DOMContentLoaded', () => {
  authManager = new MoodMashAuth();
});
