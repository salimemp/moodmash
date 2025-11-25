/**
 * Two-Factor Authentication UI (TOTP/HOTP)
 * Handles app-generated (Google Authenticator) and hardware-generated 2FA codes
 */

class TwoFactorAuth {
  constructor() {
    this.apiBase = '/api/2fa';
    this.qrCode = null;
    this.secret = null;
    this.backupCodes = [];
  }

  /**
   * Initialize 2FA management UI
   */
  async init() {
    try {
      const status = await this.getStatus();
      this.renderUI(status);
    } catch (error) {
      console.error('[2FA] Initialization error:', error);
      this.showError('Failed to load 2FA settings');
    }
  }

  /**
   * Get 2FA status
   */
  async getStatus() {
    const response = await fetch(`${this.apiBase}/status`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Render 2FA management UI
   */
  renderUI(status) {
    const container = document.getElementById('two-factor-auth-container');
    if (!container) return;

    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-shield-alt mr-2"></i>
            Two-Factor Authentication (2FA)
          </h2>
          ${status.totpEnabled ? '<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"><i class="fas fa-check-circle mr-1"></i> Enabled</span>' : '<span class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium"><i class="fas fa-times-circle mr-1"></i> Disabled</span>'}
        </div>

        <p class="text-gray-600 mb-6">
          Two-factor authentication adds an extra layer of security to your account by requiring a code from your phone or hardware token.
        </p>

        ${status.totpEnabled ? this.renderEnabledUI(status) : this.renderDisabledUI()}
      </div>
    `;

    this.attachEventListeners(status);
  }

  /**
   * Render UI when 2FA is disabled
   */
  renderDisabledUI() {
    return `
      <div class="space-y-6">
        <!-- App-based Authenticator -->
        <div class="border border-gray-200 rounded-lg p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <i class="fas fa-mobile-alt text-blue-600 text-xl"></i>
              </div>
            </div>
            <div class="ml-4 flex-1">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">Authenticator App</h3>
              <p class="text-gray-600 mb-4">
                Use apps like Google Authenticator, Authy, or Microsoft Authenticator to generate codes.
              </p>
              <button 
                onclick="twoFactorAuth.startEnrollment('totp')" 
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <i class="fas fa-plus mr-2"></i>
                Set Up Authenticator
              </button>
            </div>
          </div>
        </div>

        <!-- Hardware Token -->
        <div class="border border-gray-200 rounded-lg p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <i class="fas fa-key text-purple-600 text-xl"></i>
              </div>
            </div>
            <div class="ml-4 flex-1">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">Hardware Token</h3>
              <p class="text-gray-600 mb-4">
                Use physical security keys like YubiKey or other HOTP-compatible devices.
              </p>
              <button 
                onclick="twoFactorAuth.startEnrollment('hardware')" 
                class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <i class="fas fa-plus mr-2"></i>
                Register Hardware Token
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render UI when 2FA is enabled
   */
  renderEnabledUI(status) {
    return `
      <div class="space-y-6">
        <!-- Status Info -->
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-center">
            <i class="fas fa-check-circle text-green-600 text-2xl mr-3"></i>
            <div>
              <h3 class="font-semibold text-green-800">2FA is Active</h3>
              <p class="text-green-700 text-sm">Your account is protected with two-factor authentication.</p>
            </div>
          </div>
        </div>

        <!-- Backup Codes -->
        <div class="border border-gray-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold text-gray-800">
              <i class="fas fa-life-ring mr-2"></i>
              Backup Codes
            </h3>
            <span class="text-sm text-gray-600">${status.backupCodesCount} remaining</span>
          </div>
          <p class="text-gray-600 text-sm mb-3">
            Backup codes can be used if you lose access to your authenticator device.
          </p>
          <button 
            onclick="twoFactorAuth.regenerateBackupCodes()" 
            class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm">
            <i class="fas fa-sync mr-2"></i>
            Regenerate Backup Codes
          </button>
        </div>

        <!-- Hardware Tokens -->
        ${status.hardwareTokensCount > 0 ? `
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="font-semibold text-gray-800 mb-2">
              <i class="fas fa-key mr-2"></i>
              Hardware Tokens
            </h3>
            <p class="text-sm text-gray-600">${status.hardwareTokensCount} hardware token(s) registered</p>
          </div>
        ` : ''}

        <!-- Disable 2FA -->
        <div class="border border-red-200 rounded-lg p-4 bg-red-50">
          <h3 class="font-semibold text-red-800 mb-2">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            Disable Two-Factor Authentication
          </h3>
          <p class="text-red-700 text-sm mb-3">
            Disabling 2FA will make your account less secure.
          </p>
          <button 
            onclick="twoFactorAuth.disable2FA()" 
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
            <i class="fas fa-times mr-2"></i>
            Disable 2FA
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Start TOTP enrollment
   */
  async startEnrollment(type = 'totp') {
    if (type === 'hardware') {
      this.showHardwareTokenEnrollment();
      return;
    }

    try {
      const response = await fetch(`${this.apiBase}/enroll/start`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.secret = data.secret;
      this.showQRCodeModal(data);
    } catch (error) {
      console.error('[2FA] Enrollment start error:', error);
      this.showError('Failed to start 2FA enrollment');
    }
  }

  /**
   * Show QR code enrollment modal
   */
  showQRCodeModal(data) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-qrcode mr-2"></i>
          Set Up Authenticator
        </h2>

        <!-- Step 1: Download App -->
        <div class="mb-6">
          <h3 class="font-semibold text-gray-800 mb-2">Step 1: Download Authenticator App</h3>
          <p class="text-gray-600 text-sm mb-2">Download and install one of these apps:</p>
          <ul class="text-sm text-gray-600 list-disc list-inside">
            <li>Google Authenticator (iOS, Android)</li>
            <li>Microsoft Authenticator (iOS, Android)</li>
            <li>Authy (iOS, Android, Desktop)</li>
          </ul>
        </div>

        <!-- Step 2: Scan QR Code -->
        <div class="mb-6">
          <h3 class="font-semibold text-gray-800 mb-2">Step 2: Scan QR Code</h3>
          <div class="bg-gray-100 p-4 rounded-lg flex flex-col items-center">
            <div id="qr-code-container" class="mb-3">
              <div class="w-48 h-48 bg-white border-2 border-gray-300 rounded flex items-center justify-center">
                <i class="fas fa-spinner fa-spin text-gray-400 text-3xl"></i>
              </div>
            </div>
            <p class="text-sm text-gray-600 text-center mb-2">Scan this QR code with your authenticator app</p>
            <details class="w-full">
              <summary class="text-sm text-blue-600 cursor-pointer hover:text-blue-700">Can't scan? Enter manually</summary>
              <div class="mt-2 p-3 bg-white rounded border border-gray-200">
                <p class="text-xs text-gray-600 mb-1">Secret Key:</p>
                <code class="text-xs font-mono break-all">${data.secret}</code>
                <p class="text-xs text-gray-600 mt-2">Account: ${data.account}</p>
              </div>
            </details>
          </div>
        </div>

        <!-- Step 3: Verify Code -->
        <div class="mb-6">
          <h3 class="font-semibold text-gray-800 mb-2">Step 3: Enter 6-Digit Code</h3>
          <input 
            type="text" 
            id="totp-verify-code"
            placeholder="000000" 
            maxlength="6"
            pattern="[0-9]{6}"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
            autocomplete="off">
          <p class="text-sm text-gray-500 mt-2 text-center">Enter the code from your authenticator app</p>
        </div>

        <!-- Error message -->
        <div id="totp-verify-error" class="hidden mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-700 text-sm"></p>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button 
            onclick="twoFactorAuth.closeModal()"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button 
            onclick="twoFactorAuth.verifyEnrollment()"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <i class="fas fa-check mr-2"></i>
            Verify
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Generate QR code
    this.generateQRCode(data.qrCodeUri);

    // Auto-focus input
    setTimeout(() => {
      document.getElementById('totp-verify-code')?.focus();
    }, 100);
  }

  /**
   * Generate QR code using QRCode.js (via CDN)
   */
  async generateQRCode(uri) {
    const container = document.getElementById('qr-code-container');
    if (!container) return;

    // Load QRCode.js from CDN if not already loaded
    if (typeof QRCode === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
      script.onload = () => this.renderQRCode(uri, container);
      document.head.appendChild(script);
    } else {
      this.renderQRCode(uri, container);
    }
  }

  /**
   * Render QR code
   */
  renderQRCode(uri, container) {
    container.innerHTML = '';
    
    if (typeof QRCode !== 'undefined') {
      new QRCode(container, {
        text: uri,
        width: 192,
        height: 192,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      // Fallback: show manual entry
      container.innerHTML = '<p class="text-sm text-gray-600 text-center">Please use manual entry below</p>';
    }
  }

  /**
   * Verify enrollment code
   */
  async verifyEnrollment() {
    const codeInput = document.getElementById('totp-verify-code');
    const errorDiv = document.getElementById('totp-verify-error');
    const code = codeInput?.value?.trim();

    if (!code || code.length !== 6) {
      this.showVerifyError('Please enter a 6-digit code');
      return;
    }

    try {
      const response = await fetch(`${this.apiBase}/enroll/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Verification failed');
      }

      const data = await response.json();
      this.showBackupCodes(data.backupCodes);
    } catch (error) {
      console.error('[2FA] Verification error:', error);
      this.showVerifyError(error.message || 'Invalid code. Please try again.');
    }
  }

  /**
   * Show verification error
   */
  showVerifyError(message) {
    const errorDiv = document.getElementById('totp-verify-error');
    if (errorDiv) {
      errorDiv.classList.remove('hidden');
      errorDiv.querySelector('p').textContent = message;
      
      setTimeout(() => {
        errorDiv.classList.add('hidden');
      }, 5000);
    }
  }

  /**
   * Show backup codes modal
   */
  showBackupCodes(codes) {
    this.closeModal();
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-check-circle text-green-600 mr-2"></i>
          2FA Enabled Successfully!
        </h2>

        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 class="font-semibold text-yellow-800 mb-2">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            Save These Backup Codes
          </h3>
          <p class="text-yellow-700 text-sm mb-3">
            Keep these codes in a safe place. You can use them to access your account if you lose your authenticator device.
          </p>
          <div class="bg-white rounded p-4 font-mono text-sm grid grid-cols-2 gap-2">
            ${codes.map(code => `<div class="text-gray-800">${code}</div>`).join('')}
          </div>
        </div>

        <div class="flex gap-3">
          <button 
            onclick="twoFactorAuth.copyBackupCodes(${JSON.stringify(codes).replace(/"/g, '&quot;')})"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <i class="fas fa-copy mr-2"></i>
            Copy Codes
          </button>
          <button 
            onclick="twoFactorAuth.downloadBackupCodes(${JSON.stringify(codes).replace(/"/g, '&quot;')})"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <i class="fas fa-download mr-2"></i>
            Download
          </button>
        </div>

        <button 
          onclick="twoFactorAuth.closeModalAndRefresh()"
          class="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          I've Saved My Backup Codes
        </button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  /**
   * Copy backup codes to clipboard
   */
  async copyBackupCodes(codes) {
    const text = codes.join('\n');
    
    try {
      await navigator.clipboard.writeText(text);
      this.showSuccess('Backup codes copied to clipboard');
    } catch (error) {
      console.error('[2FA] Copy error:', error);
      this.showError('Failed to copy backup codes');
    }
  }

  /**
   * Download backup codes as text file
   */
  downloadBackupCodes(codes) {
    const text = `MoodMash 2FA Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${codes.join('\n')}\n\nKeep these codes safe!`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `moodmash-backup-codes-${Date.now()}.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.showSuccess('Backup codes downloaded');
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes() {
    const code = prompt('Enter your 6-digit authenticator code to regenerate backup codes:');
    if (!code) return;

    try {
      const response = await fetch(`${this.apiBase}/backup-codes/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate backup codes');
      }

      const data = await response.json();
      this.showBackupCodes(data.backupCodes);
    } catch (error) {
      console.error('[2FA] Regenerate error:', error);
      this.showError('Failed to regenerate backup codes. Check your code and try again.');
    }
  }

  /**
   * Disable 2FA
   */
  async disable2FA() {
    const code = prompt('Enter your 6-digit authenticator code or a backup code to disable 2FA:');
    if (!code) return;

    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return;
    }

    try {
      const response = await fetch(`${this.apiBase}/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        throw new Error('Failed to disable 2FA');
      }

      this.showSuccess('2FA disabled successfully');
      this.init(); // Refresh UI
    } catch (error) {
      console.error('[2FA] Disable error:', error);
      this.showError('Failed to disable 2FA. Check your code and try again.');
    }
  }

  /**
   * Show hardware token enrollment
   */
  showHardwareTokenEnrollment() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-key mr-2"></i>
          Register Hardware Token
        </h2>

        <p class="text-gray-600 mb-6">
          Hardware tokens like YubiKey use HOTP (counter-based) codes for authentication.
        </p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Token Name</label>
            <input 
              type="text" 
              id="hardware-token-name"
              placeholder="My YubiKey"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Secret (Base32)</label>
            <input 
              type="text" 
              id="hardware-token-secret"
              placeholder="ABCDEFGHIJKLMNOP"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-purple-500">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Initial Code (Counter 0)</label>
            <input 
              type="text" 
              id="hardware-token-code"
              placeholder="000000"
              maxlength="6"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500">
          </div>
        </div>

        <div id="hardware-token-error" class="hidden mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-700 text-sm"></p>
        </div>

        <div class="flex gap-3 mt-6">
          <button 
            onclick="twoFactorAuth.closeModal()"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button 
            onclick="twoFactorAuth.registerHardwareToken()"
            class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <i class="fas fa-check mr-2"></i>
            Register
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  /**
   * Register hardware token
   */
  async registerHardwareToken() {
    const name = document.getElementById('hardware-token-name')?.value?.trim();
    const secret = document.getElementById('hardware-token-secret')?.value?.trim();
    const code = document.getElementById('hardware-token-code')?.value?.trim();

    if (!name || !secret || !code) {
      this.showHardwareTokenError('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(`${this.apiBase}/hardware/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tokenName: name, secret, initialCode: code })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      this.showSuccess('Hardware token registered successfully');
      this.closeModalAndRefresh();
    } catch (error) {
      console.error('[2FA] Hardware token registration error:', error);
      this.showHardwareTokenError(error.message || 'Registration failed');
    }
  }

  /**
   * Show hardware token error
   */
  showHardwareTokenError(message) {
    const errorDiv = document.getElementById('hardware-token-error');
    if (errorDiv) {
      errorDiv.classList.remove('hidden');
      errorDiv.querySelector('p').textContent = message;
    }
  }

  /**
   * Close modal
   */
  closeModal() {
    const modals = document.querySelectorAll('.fixed.inset-0.bg-black');
    modals.forEach(modal => modal.remove());
  }

  /**
   * Close modal and refresh
   */
  closeModalAndRefresh() {
    this.closeModal();
    this.init();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners(status) {
    // Handle enter key in code inputs
    const codeInput = document.getElementById('totp-verify-code');
    if (codeInput) {
      codeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.verifyEnrollment();
        }
      });

      // Auto-submit when 6 digits entered
      codeInput.addEventListener('input', (e) => {
        if (e.target.value.length === 6) {
          setTimeout(() => this.verifyEnrollment(), 300);
        }
      });
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    console.log('[2FA] Success:', message);
    // Integrate with app's notification system if available
    if (window.showNotification) {
      window.showNotification(message, 'success');
    } else {
      alert(message);
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    console.error('[2FA] Error:', message);
    // Integrate with app's notification system if available
    if (window.showNotification) {
      window.showNotification(message, 'error');
    } else {
      alert(message);
    }
  }
}

// Global instance
const twoFactorAuth = new TwoFactorAuth();

// Auto-initialize if container exists
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('two-factor-auth-container')) {
      twoFactorAuth.init();
    }
  });
} else {
  if (document.getElementById('two-factor-auth-container')) {
    twoFactorAuth.init();
  }
}
