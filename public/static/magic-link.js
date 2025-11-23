/**
 * MoodMash Magic Link Verification
 * Handles passwordless authentication via email magic links
 */

class MagicLinkVerifier {
  constructor() {
    this.i18n = window.i18n || window.i18nManager;
    this.init();
  }

  async init() {
    this.render();
    await this.verifyToken();
  }

  render() {
    const container = document.getElementById('magic-link-container');
    if (!container) return;

    container.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
        <div class="w-full max-w-md">
          <div class="bg-gradient-to-br from-purple-800/50 to-purple-900/50 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-purple-700/50 text-center">
            
            <!-- Logo -->
            <div class="flex items-center justify-center mb-6">
              <div class="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                <i class="fas fa-magic text-3xl text-white"></i>
              </div>
            </div>

            <!-- Loading State -->
            <div id="loading-state">
              <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
              <h1 class="text-2xl font-bold text-white mb-2">${this.t('magic_link_verifying')}</h1>
              <p class="text-purple-200">${this.t('magic_link_please_wait')}</p>
            </div>

            <!-- Success State -->
            <div id="success-state" class="hidden">
              <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-check text-3xl text-white"></i>
              </div>
              <h1 class="text-2xl font-bold text-white mb-2">${this.t('magic_link_success')}</h1>
              <p class="text-purple-200 mb-6">${this.t('magic_link_redirecting')}</p>
            </div>

            <!-- Error State -->
            <div id="error-state" class="hidden">
              <div class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-times text-3xl text-white"></i>
              </div>
              <h1 class="text-2xl font-bold text-white mb-2">${this.t('magic_link_error')}</h1>
              <p class="text-purple-200 mb-6" id="error-message"></p>
              <a href="/login" class="inline-block bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300">
                ${this.t('magic_link_back_to_login')}
              </a>
            </div>

          </div>
        </div>
      </div>
    `;
  }

  async verifyToken() {
    try {
      // Get token from URL
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        this.showError(this.t('magic_link_no_token'));
        return;
      }

      // Verify token with backend
      const response = await fetch(`/api/auth/magic-link/verify?token=${token}`);
      const data = await response.json();

      if (response.ok && data.success) {
        // Store session token
        localStorage.setItem('sessionToken', data.sessionToken);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Show success and redirect
        this.showSuccess();
        
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        this.showError(data.error || this.t('magic_link_invalid'));
      }
    } catch (error) {
      console.error('Magic link verification error:', error);
      this.showError(this.t('magic_link_network_error'));
    }
  }

  showSuccess() {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('error-state').classList.add('hidden');
    document.getElementById('success-state').classList.remove('hidden');
  }

  showError(message) {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('success-state').classList.add('hidden');
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-state').classList.remove('hidden');
  }

  t(key) {
    return this.i18n?.t(key) || key;
  }
}

// Initialize verifier
document.addEventListener('DOMContentLoaded', () => {
  new MagicLinkVerifier();
});
