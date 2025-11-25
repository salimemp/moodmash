/**
 * MoodMash Biometric Authentication
 * Web Authentication API (WebAuthn) Implementation
 * Supports: Face ID, Touch ID, Fingerprint, Windows Hello
 * Version: 1.0.0
 */

class BiometricAuth {
  constructor() {
    this.isSupported = this.checkSupport();
    this.rpName = 'MoodMash';
    this.rpID = window.location.hostname;
    this.timeout = 60000; // 60 seconds
    this.debug = true; // Enable debug logging
  }

  /**
   * Check if WebAuthn is supported by the browser
   */
  checkSupport() {
    const supported = window.PublicKeyCredential !== undefined && 
                     navigator.credentials !== undefined &&
                     typeof navigator.credentials.create === 'function' &&
                     typeof navigator.credentials.get === 'function';
    
    if (this.debug) {
      console.log('[Biometrics] Support check:', {
        PublicKeyCredential: window.PublicKeyCredential !== undefined,
        navigatorCredentials: navigator.credentials !== undefined,
        supported
      });
    }
    
    return supported;
  }

  /**
   * Check if platform authenticator (Face ID, Touch ID, etc.) is available
   */
  async isPlatformAuthenticatorAvailable() {
    if (!this.isSupported) return false;
    
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (this.debug) {
        console.log('[Biometrics] Platform authenticator available:', available);
      }
      return available;
    } catch (error) {
      console.error('[Biometrics] Error checking platform authenticator:', error);
      return false;
    }
  }

  /**
   * Get user-friendly name for the authenticator type
   */
  getAuthenticatorName() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'Face ID or Touch ID';
    } else if (/macintosh/.test(userAgent)) {
      return 'Touch ID';
    } else if (/android/.test(userAgent)) {
      return 'Fingerprint';
    } else if (/windows/.test(userAgent)) {
      return 'Windows Hello';
    } else {
      return 'Biometric Authentication';
    }
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Register/Enroll biometric credential
   */
  async register(userId, username, displayName) {
    if (!this.isSupported) {
      throw new Error('Biometric authentication is not supported on this device');
    }

    try {
      if (this.debug) {
        console.log('[Biometrics] Starting registration for:', { userId, username, displayName });
      }

      // Get registration options from server
      const optionsResponse = await fetch('/api/biometrics/register/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, username, displayName })
      });

      if (!optionsResponse.ok) {
        throw new Error('Failed to get registration options from server');
      }

      const options = await optionsResponse.json();
      
      if (this.debug) {
        console.log('[Biometrics] Registration options received:', options);
      }

      // Convert base64 strings to ArrayBuffers
      options.challenge = this.base64ToArrayBuffer(options.challenge);
      options.user.id = this.base64ToArrayBuffer(options.user.id);
      
      if (options.excludeCredentials) {
        options.excludeCredentials = options.excludeCredentials.map(cred => ({
          ...cred,
          id: this.base64ToArrayBuffer(cred.id)
        }));
      }

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: options
      });

      if (this.debug) {
        console.log('[Biometrics] Credential created:', credential);
      }

      // Prepare credential data for server
      const credentialData = {
        id: credential.id,
        rawId: this.arrayBufferToBase64(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: this.arrayBufferToBase64(credential.response.clientDataJSON),
          attestationObject: this.arrayBufferToBase64(credential.response.attestationObject)
        }
      };

      // Send credential to server for verification and storage
      const verifyResponse = await fetch('/api/biometrics/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          credential: credentialData
        })
      });

      if (!verifyResponse.ok) {
        throw new Error('Failed to verify credential with server');
      }

      const result = await verifyResponse.json();
      
      if (this.debug) {
        console.log('[Biometrics] Registration complete:', result);
      }

      // Store credential ID locally for quick access
      this.storeCredentialId(userId, credential.id);

      return {
        success: true,
        credentialId: credential.id,
        authenticatorName: this.getAuthenticatorName()
      };

    } catch (error) {
      console.error('[Biometrics] Registration error:', error);
      
      // Handle specific errors
      if (error.name === 'NotAllowedError') {
        throw new Error('Biometric authentication was cancelled or not allowed');
      } else if (error.name === 'InvalidStateError') {
        throw new Error('This device is already registered for biometric authentication');
      } else {
        throw new Error(`Biometric registration failed: ${error.message}`);
      }
    }
  }

  /**
   * Authenticate using biometric credential
   */
  async authenticate(userId = null) {
    if (!this.isSupported) {
      throw new Error('Biometric authentication is not supported on this device');
    }

    try {
      if (this.debug) {
        console.log('[Biometrics] Starting authentication for userId:', userId);
      }

      // Get authentication options from server
      const optionsResponse = await fetch('/api/biometrics/authenticate/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!optionsResponse.ok) {
        throw new Error('Failed to get authentication options from server');
      }

      const options = await optionsResponse.json();
      
      if (this.debug) {
        console.log('[Biometrics] Authentication options received:', options);
      }

      // Convert base64 strings to ArrayBuffers
      options.challenge = this.base64ToArrayBuffer(options.challenge);
      
      if (options.allowCredentials) {
        options.allowCredentials = options.allowCredentials.map(cred => ({
          ...cred,
          id: this.base64ToArrayBuffer(cred.id)
        }));
      }

      // Get credential
      const assertion = await navigator.credentials.get({
        publicKey: options
      });

      if (this.debug) {
        console.log('[Biometrics] Assertion received:', assertion);
      }

      // Prepare assertion data for server
      const assertionData = {
        id: assertion.id,
        rawId: this.arrayBufferToBase64(assertion.rawId),
        type: assertion.type,
        response: {
          clientDataJSON: this.arrayBufferToBase64(assertion.response.clientDataJSON),
          authenticatorData: this.arrayBufferToBase64(assertion.response.authenticatorData),
          signature: this.arrayBufferToBase64(assertion.response.signature),
          userHandle: assertion.response.userHandle ? 
            this.arrayBufferToBase64(assertion.response.userHandle) : null
        }
      };

      // Send assertion to server for verification
      const verifyResponse = await fetch('/api/biometrics/authenticate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assertion: assertionData
        })
      });

      if (!verifyResponse.ok) {
        throw new Error('Biometric authentication failed');
      }

      const result = await verifyResponse.json();
      
      if (this.debug) {
        console.log('[Biometrics] Authentication complete:', result);
      }

      return {
        success: true,
        user: result.user,
        sessionToken: result.sessionToken
      };

    } catch (error) {
      console.error('[Biometrics] Authentication error:', error);
      
      // Handle specific errors
      if (error.name === 'NotAllowedError') {
        throw new Error('Biometric authentication was cancelled or not allowed');
      } else {
        throw new Error(`Biometric authentication failed: ${error.message}`);
      }
    }
  }

  /**
   * Check if user has enrolled biometrics
   */
  async isEnrolled(userId) {
    try {
      const response = await fetch(`/api/biometrics/enrolled?userId=${userId}`);
      if (!response.ok) return false;
      
      const data = await response.json();
      return data.enrolled || false;
    } catch (error) {
      console.error('[Biometrics] Error checking enrollment:', error);
      return false;
    }
  }

  /**
   * Remove biometric credential
   */
  async unenroll(userId) {
    try {
      const response = await fetch('/api/biometrics/unenroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('Failed to remove biometric credential');
      }

      // Remove stored credential ID
      this.removeCredentialId(userId);

      return { success: true };
    } catch (error) {
      console.error('[Biometrics] Unenroll error:', error);
      throw error;
    }
  }

  /**
   * Store credential ID in localStorage
   */
  storeCredentialId(userId, credentialId) {
    try {
      const stored = JSON.parse(localStorage.getItem('biometric_credentials') || '{}');
      stored[userId] = credentialId;
      localStorage.setItem('biometric_credentials', JSON.stringify(stored));
    } catch (error) {
      console.error('[Biometrics] Error storing credential ID:', error);
    }
  }

  /**
   * Get stored credential ID
   */
  getStoredCredentialId(userId) {
    try {
      const stored = JSON.parse(localStorage.getItem('biometric_credentials') || '{}');
      return stored[userId] || null;
    } catch (error) {
      console.error('[Biometrics] Error getting credential ID:', error);
      return null;
    }
  }

  /**
   * Remove stored credential ID
   */
  removeCredentialId(userId) {
    try {
      const stored = JSON.parse(localStorage.getItem('biometric_credentials') || '{}');
      delete stored[userId];
      localStorage.setItem('biometric_credentials', JSON.stringify(stored));
    } catch (error) {
      console.error('[Biometrics] Error removing credential ID:', error);
    }
  }

  /**
   * Show browser's native biometric prompt with custom message
   */
  async promptBiometric(message = 'Authenticate with biometrics') {
    // This is handled automatically by the browser during credential operations
    // We can't customize the native prompt, but we can show our own UI before it
    return true;
  }
}

// Global instance
window.biometricAuth = new BiometricAuth();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BiometricAuth;
}
