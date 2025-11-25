/**
 * MoodMash Biometric UI Components
 * User interface for biometric enrollment and authentication
 * Version: 1.0.0
 */

class BiometricUI {
  constructor() {
    this.biometric = window.biometricAuth;
    this.currentUser = null;
  }

  /**
   * Initialize biometric UI
   */
  async init(user = null) {
    this.currentUser = user;
    
    if (!this.biometric.isSupported) {
      console.log('[BiometricUI] Biometrics not supported on this device');
      return;
    }

    // Check if platform authenticator is available
    const available = await this.biometric.isPlatformAuthenticatorAvailable();
    if (!available) {
      console.log('[BiometricUI] Platform authenticator not available');
      return;
    }

    // Check if Passkeys (conditional mediation) are supported
    const passkeySupported = await this.biometric.isPasskeySupported();
    if (passkeySupported) {
      console.log('[BiometricUI] Passkeys supported - initializing conditional mediation');
      // Initialize conditional mediation for autofill
      await this.biometric.initConditionalMediation();
    }

    // Show biometric options in UI
    this.injectBiometricButtons();
  }

  /**
   * Inject biometric buttons into auth UI
   */
  injectBiometricButtons() {
    const authForm = document.getElementById('auth-form');
    if (!authForm) return;

    // Check if buttons already exist
    if (document.getElementById('biometric-login-btn')) return;

    // Create biometric login button
    const biometricSection = document.createElement('div');
    biometricSection.className = 'mt-6 pt-6 border-t border-purple-700/50';
    biometricSection.innerHTML = `
      <button
        type="button"
        id="biometric-login-btn"
        class="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-3"
        onclick="biometricUI.handleBiometricLogin()"
      >
        <i class="fas fa-key text-2xl"></i>
        <span id="biometric-btn-text">Sign in with a Passkey</span>
      </button>
      
      <div id="biometric-status" class="mt-4 text-center text-sm"></div>
    `;

    // Insert before the submit button
    const submitButton = authForm.querySelector('button[type="submit"]');
    if (submitButton && submitButton.parentNode) {
      submitButton.parentNode.insertBefore(biometricSection, submitButton);
    } else {
      authForm.appendChild(biometricSection);
    }
  }

  /**
   * Handle biometric login button click
   */
  async handleBiometricLogin() {
    const statusDiv = document.getElementById('biometric-status');
    const button = document.getElementById('biometric-login-btn');
    
    try {
      // Disable button and show loading state
      button.disabled = true;
      button.innerHTML = `
        <i class="fas fa-spinner fa-spin text-2xl"></i>
        <span>Authenticating...</span>
      `;

      // Show status message
      this.showStatus('Please authenticate with your biometrics', 'info');

      // Attempt biometric authentication
      const result = await this.biometric.authenticate();

      if (result.success) {
        this.showStatus('✓ Authentication successful! Redirecting...', 'success');
        
        // Wait a moment to show success message
        await this.sleep(1000);
        
        // Redirect to dashboard
        window.location.href = '/';
      } else {
        throw new Error('Authentication failed');
      }

    } catch (error) {
      console.error('[BiometricUI] Login error:', error);
      
      this.showStatus(error.message || 'Biometric authentication failed', 'error');
      
      // Reset button
      button.disabled = false;
      button.innerHTML = `
        <i class="fas fa-fingerprint text-2xl"></i>
        <span>Login with ${this.biometric.getAuthenticatorName()}</span>
      `;
    }
  }

  /**
   * Show enrollment prompt after successful registration
   */
  async showEnrollmentPrompt(user) {
    // Check if already enrolled
    const enrolled = await this.biometric.isEnrolled(user.id);
    if (enrolled) {
      console.log('[BiometricUI] User already enrolled');
      return;
    }

    // Create enrollment modal
    const modal = this.createEnrollmentModal(user);
    document.body.appendChild(modal);

    // Show modal with animation
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      modal.querySelector('.modal-content').classList.remove('scale-95');
    }, 10);
  }

  /**
   * Create enrollment modal
   */
  createEnrollmentModal(user) {
    const modal = document.createElement('div');
    modal.id = 'biometric-enrollment-modal';
    modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 opacity-0 transition-opacity duration-300';
    
    const authenticatorName = this.biometric.getAuthenticatorName();
    
    modal.innerHTML = `
      <div class="modal-content bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-purple-700/50 scale-95 transition-transform duration-300">
        <!-- Icon -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-4">
            <i class="fas fa-fingerprint text-4xl text-white"></i>
          </div>
          <h2 class="text-2xl font-bold text-white mb-2">
            Create a Passkey
          </h2>
          <p class="text-purple-200">
            Sign in instantly with ${authenticatorName} - your Passkey syncs across all your devices
          </p>
        </div>

        <!-- Benefits -->
        <div class="space-y-3 mb-6">
          <div class="flex items-start space-x-3 text-white">
            <i class="fas fa-check-circle text-green-400 mt-1"></i>
            <div>
              <p class="font-semibold">Passwordless Login</p>
              <p class="text-sm text-purple-200">Sign in instantly with just a tap</p>
            </div>
          </div>
          <div class="flex items-start space-x-3 text-white">
            <i class="fas fa-shield-alt text-blue-400 mt-1"></i>
            <div>
              <p class="font-semibold">Phishing-Resistant</p>
              <p class="text-sm text-purple-200">Impossible to steal or phish</p>
            </div>
          </div>
          <div class="flex items-start space-x-3 text-white">
            <i class="fas fa-sync-alt text-purple-400 mt-1"></i>
            <div>
              <p class="font-semibold">Syncs Across Devices</p>
              <p class="text-sm text-purple-200">Use on all your Apple or Google devices</p>
            </div>
          </div>
        </div>

        <!-- Status -->
        <div id="enrollment-status" class="mb-6 text-center text-sm"></div>

        <!-- Buttons -->
        <div class="space-y-3">
          <button
            id="enable-biometric-btn"
            class="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            onclick="biometricUI.handleEnrollment('${user.id}', '${user.email}', '${user.name || user.email}')"
          >
            Create Passkey
          </button>
          
          <button
            class="w-full py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
            onclick="biometricUI.closeEnrollmentModal()"
          >
            Maybe Later
          </button>
        </div>

        <!-- Privacy Note -->
        <p class="text-xs text-purple-300 text-center mt-4">
          <i class="fas fa-lock mr-1"></i>
          Your biometric data never leaves your device
        </p>
      </div>
    `;

    return modal;
  }

  /**
   * Handle biometric enrollment
   */
  async handleEnrollment(userId, username, displayName) {
    const statusDiv = document.getElementById('enrollment-status');
    const button = document.getElementById('enable-biometric-btn');
    
    try {
      // Disable button and show loading state
      button.disabled = true;
      button.innerHTML = `
        <i class="fas fa-spinner fa-spin mr-2"></i>
        Setting up...
      `;

      // Show status message
      this.showEnrollmentStatus('Please authenticate with your biometrics', 'info');

      // Perform enrollment
      const result = await this.biometric.register(userId, username, displayName);

      if (result.success) {
        this.showEnrollmentStatus(
          `✓ ${result.authenticatorName} enabled successfully!`, 
          'success'
        );
        
        // Wait a moment to show success message
        await this.sleep(1500);
        
        // Close modal
        this.closeEnrollmentModal();
      } else {
        throw new Error('Enrollment failed');
      }

    } catch (error) {
      console.error('[BiometricUI] Enrollment error:', error);
      
      this.showEnrollmentStatus(error.message || 'Failed to enable biometrics', 'error');
      
      // Reset button
      button.disabled = false;
      button.innerHTML = `Enable ${this.biometric.getAuthenticatorName()}`;
    }
  }

  /**
   * Close enrollment modal
   */
  closeEnrollmentModal() {
    const modal = document.getElementById('biometric-enrollment-modal');
    if (modal) {
      modal.classList.add('opacity-0');
      modal.querySelector('.modal-content').classList.add('scale-95');
      setTimeout(() => modal.remove(), 300);
    }
  }

  /**
   * Show biometric settings in user settings page
   */
  renderSettingsSection(user) {
    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <i class="fas fa-key text-2xl text-purple-600"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
                Passkeys
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Passwordless sign-in with ${this.biometric.getAuthenticatorName()}
              </p>
            </div>
          </div>
          <div id="biometric-toggle-container"></div>
        </div>

        <div class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div class="flex items-start space-x-2">
            <i class="fas fa-bolt mt-1 text-yellow-500"></i>
            <p>Sign in instantly without passwords - faster and more secure</p>
          </div>
          <div class="flex items-start space-x-2">
            <i class="fas fa-shield-alt mt-1 text-green-500"></i>
            <p>Passkeys are phishing-resistant and can't be stolen or guessed</p>
          </div>
          <div class="flex items-start space-x-2">
            <i class="fas fa-sync-alt mt-1 text-blue-500"></i>
            <p>Your Passkey syncs securely across all your devices via iCloud or Google</p>
          </div>
        </div>

        <div id="biometric-settings-status" class="mt-4"></div>
      </div>
    `;
  }

  /**
   * Initialize biometric toggle in settings
   */
  async initSettingsToggle(user) {
    const container = document.getElementById('biometric-toggle-container');
    if (!container) return;

    // Check if enrolled
    const enrolled = await this.biometric.isEnrolled(user.id);

    // Create toggle
    container.innerHTML = `
      <label class="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          id="biometric-toggle"
          class="sr-only peer"
          ${enrolled ? 'checked' : ''}
          onchange="biometricUI.handleToggle('${user.id}', '${user.email}', '${user.name || user.email}')"
        >
        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
        <span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
          ${enrolled ? 'Enabled' : 'Disabled'}
        </span>
      </label>
    `;
  }

  /**
   * Handle toggle in settings
   */
  async handleToggle(userId, username, displayName) {
    const toggle = document.getElementById('biometric-toggle');
    const statusDiv = document.getElementById('biometric-settings-status');
    
    try {
      if (toggle.checked) {
        // Enable biometrics
        this.showSettingsStatus('Setting up biometric authentication...', 'info');
        
        const result = await this.biometric.register(userId, username, displayName);
        
        if (result.success) {
          this.showSettingsStatus(
            `✓ ${result.authenticatorName} enabled successfully!`, 
            'success'
          );
        }
      } else {
        // Disable biometrics
        this.showSettingsStatus('Removing biometric authentication...', 'info');
        
        await this.biometric.unenroll(userId);
        
        this.showSettingsStatus('✓ Biometric authentication removed', 'success');
      }
    } catch (error) {
      console.error('[BiometricUI] Toggle error:', error);
      
      // Revert toggle
      toggle.checked = !toggle.checked;
      
      this.showSettingsStatus(error.message || 'Failed to update biometric settings', 'error');
    }
  }

  /**
   * Show status message in login form
   */
  showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('biometric-status');
    if (!statusDiv) return;

    const colors = {
      info: 'text-blue-300',
      success: 'text-green-300',
      error: 'text-red-300'
    };

    const icons = {
      info: 'fa-info-circle',
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle'
    };

    statusDiv.className = `mt-4 text-center text-sm ${colors[type]}`;
    statusDiv.innerHTML = `
      <i class="fas ${icons[type]} mr-2"></i>
      ${message}
    `;

    // Auto-hide after 5 seconds for non-error messages
    if (type !== 'error') {
      setTimeout(() => {
        statusDiv.innerHTML = '';
      }, 5000);
    }
  }

  /**
   * Show status message in enrollment modal
   */
  showEnrollmentStatus(message, type = 'info') {
    const statusDiv = document.getElementById('enrollment-status');
    if (!statusDiv) return;

    const colors = {
      info: 'text-blue-300',
      success: 'text-green-300',
      error: 'text-red-300'
    };

    const icons = {
      info: 'fa-info-circle',
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle'
    };

    statusDiv.className = `mb-6 text-center text-sm ${colors[type]}`;
    statusDiv.innerHTML = `
      <i class="fas ${icons[type]} mr-2"></i>
      ${message}
    `;
  }

  /**
   * Show status message in settings
   */
  showSettingsStatus(message, type = 'info') {
    const statusDiv = document.getElementById('biometric-settings-status');
    if (!statusDiv) return;

    const colors = {
      info: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      success: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      error: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    };

    const icons = {
      info: 'fa-info-circle',
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle'
    };

    statusDiv.className = `mt-4 p-3 rounded-lg ${colors[type]} text-sm`;
    statusDiv.innerHTML = `
      <i class="fas ${icons[type]} mr-2"></i>
      ${message}
    `;

    // Auto-hide after 5 seconds
    setTimeout(() => {
      statusDiv.innerHTML = '';
      statusDiv.className = '';
    }, 5000);
  }

  /**
   * Utility: Sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global instance
window.biometricUI = new BiometricUI();

// Auto-initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.biometricUI.init();
  });
} else {
  window.biometricUI.init();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BiometricUI;
}
