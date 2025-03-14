/**
 * WebAuthn Module
 * Main entry point for WebAuthn functionality
 * Re-exports all WebAuthn functionality from sub-modules
 */

// Export configuration
export {
  getExpectedOrigin, getRpID,
  rpName, supportedAlgorithmIDs, timeoutDuration
} from './webauthn-config';

// Export registration functions
export {
  generateWebAuthnRegistrationOptions,
  verifyWebAuthnRegistration
} from './webauthn-registration';

// Export authentication functions
export {
  generateWebAuthnAuthenticationOptions,
  verifyWebAuthnAuthentication
} from './webauthn-authentication';

// Export credential management functions
export {
  deleteWebAuthnCredential,
  getUserCredentials,
  updateCredentialFriendlyName
} from './webauthn-credentials';

