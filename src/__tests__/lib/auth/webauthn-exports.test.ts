import { describe, expect, it } from 'vitest';

import * as WebAuthnExports from '@/lib/auth/webauthn';
import * as WebAuthnAuthentication from '@/lib/auth/webauthn-authentication';
import * as WebAuthnConfig from '@/lib/auth/webauthn-config';
import * as WebAuthnCredentials from '@/lib/auth/webauthn-credentials';
import * as WebAuthnRegistration from '@/lib/auth/webauthn-registration';

describe('WebAuthn Module Exports', () => {
  it('should export configuration items correctly', () => {
    // Config exports
    expect(WebAuthnExports.getExpectedOrigin).toBe(WebAuthnConfig.getExpectedOrigin);
    expect(WebAuthnExports.getRpID).toBe(WebAuthnConfig.getRpID);
    expect(WebAuthnExports.rpName).toBe(WebAuthnConfig.rpName);
    expect(WebAuthnExports.supportedAlgorithmIDs).toBe(WebAuthnConfig.supportedAlgorithmIDs);
    expect(WebAuthnExports.timeoutDuration).toBe(WebAuthnConfig.timeoutDuration);
  });

  it('should export registration functions correctly', () => {
    // Registration exports
    expect(WebAuthnExports.generateWebAuthnRegistrationOptions).toBe(WebAuthnRegistration.generateWebAuthnRegistrationOptions);
    expect(WebAuthnExports.verifyWebAuthnRegistration).toBe(WebAuthnRegistration.verifyWebAuthnRegistration);
  });

  it('should export authentication functions correctly', () => {
    // Authentication exports
    expect(WebAuthnExports.generateWebAuthnAuthenticationOptions).toBe(WebAuthnAuthentication.generateWebAuthnAuthenticationOptions);
    expect(WebAuthnExports.verifyWebAuthnAuthentication).toBe(WebAuthnAuthentication.verifyWebAuthnAuthentication);
  });

  it('should export credential management functions correctly', () => {
    // Credential management exports
    expect(WebAuthnExports.deleteWebAuthnCredential).toBe(WebAuthnCredentials.deleteWebAuthnCredential);
    expect(WebAuthnExports.getUserCredentials).toBe(WebAuthnCredentials.getUserCredentials);
    expect(WebAuthnExports.updateCredentialFriendlyName).toBe(WebAuthnCredentials.updateCredentialFriendlyName);
  });
}); 