/**
 * TOTP Login Integration
 * Handles 2FA verification during login process
 */

class TOTPLogin {
  constructor() {
    this.apiBase = '/api/2fa';
    this.authBase = '/api/auth';
    this.pendingUserId = null;
    this.pendingSessionToken = null;
  }

  /**
   * Check if user needs 2FA verification after login
   * Call this after successful username/password login
   */
  async check2FARequired(userId) {
    try {
      const response = await fetch(`${this.apiBase}/status`, {
        method: 'GET',
        headers: {
          'X-User-ID': userId // Temp header for pre-auth check
        },
        credentials: 'include'
      });

      if (!response.ok) {
        return false; // 2FA not required
      }

      const data = await response.json();
      return data.totpEnabled === true;
    } catch (error) {
      console.error('[2FA Login] Check error:', error);
      return false;
    }
  }

  /**
   * Show 2FA verification modal
   */
  show2FAModal(userId, sessionToken = null) {
    this.pendingUserId = userId;
    this.pendingSessionToken = sessionToken;

    const modal = document.createElement('div');
    modal.id = 'totp-login-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-shield-alt mr-2"></i>
          Two-Factor Authentication
        </h2>

        <p class="text-gray-600 mb-6">
          Enter the 6-digit code from your authenticator app or a backup code.
        </p>

        <!-- Code Input -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Authentication Code
          </label>
          <input 
            type="text" 
            id="totp-login-code"
            placeholder="000000" 
            maxlength="12"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
            autocomplete="off"
            autofocus>
          <p class="text-xs text-gray-500 mt-2 text-center">
            6-digit code or backup code (XXXX-XXXX)
          </p>
        </div>

        <!-- Error message -->
        <div id="totp-login-error" class="hidden mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-700 text-sm"></p>
        </div>

        <!-- Help text -->
        <div class="mb-6">
          <details class="text-sm">
            <summary class="text-blue-600 cursor-pointer hover:text-blue-700">
              <i class="fas fa-question-circle mr-1"></i>
              Need help?
            </summary>
            <div class="mt-2 p-3 bg-gray-50 rounded">
              <p class="text-gray-600 mb-2">If you don't have access to your authenticator:</p>
              <ul class="list-disc list-inside text-gray-600 text-xs space-y-1">
                <li>Use one of your backup codes</li>
                <li>Contact support if you've lost both</li>
              </ul>
            </div>
          </details>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button 
            onclick="totpLogin.cancelLogin()"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button 
            onclick="totpLogin.verify2FACode()"
            id="totp-verify-btn"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <i class="fas fa-check mr-2"></i>
            Verify
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Attach event listeners
    this.attachModalListeners();
  }

  /**
   * Attach modal event listeners
   */
  attachModalListeners() {
    const codeInput = document.getElementById('totp-login-code');
    if (codeInput) {
      // Handle enter key
      codeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.verify2FACode();
        }
      });

      // Auto-format backup codes (add hyphen)
      codeInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^A-Z0-9]/gi, '');
        
        // If 4 characters and no hyphen, add hyphen for backup code format
        if (value.length === 4 && !e.target.value.includes('-')) {
          e.target.value = value + '-';
        }
        
        // Auto-submit when 6 digits entered (TOTP) or 9 chars (backup code with hyphen)
        if (value.length === 6 || (value.length === 8 && e.target.value.includes('-'))) {
          setTimeout(() => this.verify2FACode(), 300);
        }
      });
    }
  }

  /**
   * Verify 2FA code
   */
  async verify2FACode() {
    const codeInput = document.getElementById('totp-login-code');
    const verifyBtn = document.getElementById('totp-verify-btn');
    const code = codeInput?.value?.trim().toUpperCase();

    if (!code) {
      this.showLoginError('Please enter a code');
      return;
    }

    // Validate format
    const isTOTP = /^\d{6}$/.test(code);
    const isBackupCode = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code);

    if (!isTOTP && !isBackupCode) {
      this.showLoginError('Invalid code format');
      return;
    }

    // Disable button
    if (verifyBtn) {
      verifyBtn.disabled = true;
      verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verifying...';
    }

    try {
      const response = await fetch(`${this.apiBase}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: this.pendingUserId,
          code: code
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Verification failed');
      }

      const data = await response.json();

      // Check if backup code was used
      if (data.backupCodeUsed && data.remainingBackupCodes !== undefined) {
        this.showBackupCodeWarning(data.remainingBackupCodes);
      }

      // Successfully verified - complete login
      this.completeLogin();

    } catch (error) {
      console.error('[2FA Login] Verification error:', error);
      this.showLoginError(error.message || 'Invalid code. Please try again.');
      
      // Re-enable button
      if (verifyBtn) {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Verify';
      }
    }
  }

  /**
   * Show backup code warning
   */
  showBackupCodeWarning(remaining) {
    if (remaining <= 3) {
      const warning = document.createElement('div');
      warning.className = 'mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg';
      warning.innerHTML = `
        <p class="text-yellow-800 text-sm">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          Warning: You have only ${remaining} backup code${remaining !== 1 ? 's' : ''} remaining. 
          Consider regenerating them in your account settings.
        </p>
      `;

      const errorDiv = document.getElementById('totp-login-error');
      errorDiv?.parentNode?.insertBefore(warning, errorDiv);
    }
  }

  /**
   * Show login error
   */
  showLoginError(message) {
    const errorDiv = document.getElementById('totp-login-error');
    if (errorDiv) {
      errorDiv.classList.remove('hidden');
      errorDiv.querySelector('p').textContent = message;
      
      // Clear input
      const codeInput = document.getElementById('totp-login-code');
      if (codeInput) {
        codeInput.value = '';
        codeInput.focus();
      }
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        errorDiv.classList.add('hidden');
      }, 5000);
    }
  }

  /**
   * Complete login (redirect to dashboard)
   */
  completeLogin() {
    // Close modal
    this.closeModal();

    // Redirect to dashboard or callback
    if (window.onTOTPLoginSuccess) {
      window.onTOTPLoginSuccess();
    } else {
      window.location.href = '/';
    }
  }

  /**
   * Cancel login
   */
  cancelLogin() {
    this.closeModal();
    
    // Logout the partial session
    if (this.pendingSessionToken) {
      fetch(`${this.authBase}/logout`, {
        method: 'POST',
        credentials: 'include'
      }).catch(console.error);
    }

    // Redirect to login page
    if (window.onTOTPLoginCancel) {
      window.onTOTPLoginCancel();
    } else {
      window.location.href = '/login';
    }
  }

  /**
   * Close modal
   */
  closeModal() {
    const modal = document.getElementById('totp-login-modal');
    if (modal) {
      modal.remove();
    }
  }
}

// Global instance
const totpLogin = new TOTPLogin();

/**
 * Helper function to integrate 2FA into existing login flow
 * 
 * Usage after successful username/password login:
 * 
 * const loginResponse = await fetch('/api/auth/login', {
 *   method: 'POST',
 *   body: JSON.stringify({ username, password })
 * });
 * 
 * if (loginResponse.ok) {
 *   const data = await loginResponse.json();
 *   
 *   // Check if 2FA is enabled
 *   const needs2FA = await handle2FALogin(data.user.id, data.sessionToken);
 *   
 *   if (!needs2FA) {
 *     // Login complete, redirect to dashboard
 *     window.location.href = '/';
 *   }
 *   // If needs2FA, the modal will be shown automatically
 * }
 */
async function handle2FALogin(userId, sessionToken) {
  const needs2FA = await totpLogin.check2FARequired(userId);
  
  if (needs2FA) {
    totpLogin.show2FAModal(userId, sessionToken);
    return true;
  }
  
  return false;
}
