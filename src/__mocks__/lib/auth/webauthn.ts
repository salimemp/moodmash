import type { VerifiedAuthenticationResponse, VerifiedRegistrationResponse } from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON
} from '@simplewebauthn/types';
import { vi } from 'vitest';

// Mock implementation of WebAuthn library
export const rpID = 'example.com';
export const rpName = 'MoodMash';

// Mock implementation of WebAuthn functions
export const generateWebAuthnRegistrationOptions = vi.fn().mockImplementation(
  async (userId: string, username: string, userDisplayName: string): Promise<PublicKeyCredentialCreationOptionsJSON> => {
    return {
      challenge: 'challenge',
      rp: { id: 'example.com', name: 'MoodMash' },
      user: { id: userId, name: username, displayName: userDisplayName },
      pubKeyCredParams: [],
      timeout: 60000,
      excludeCredentials: [],
      authenticatorSelection: {},
      extensions: {}
    };
  }
);

export const verifyWebAuthnRegistration = vi.fn().mockImplementation(
  async (credential: RegistrationResponseJSON, expectedChallenge: string): Promise<VerifiedRegistrationResponse> => {
    console.log(`Verifying registration for credential ${credential.id} with challenge ${expectedChallenge}`);
    
    return {
      verified: true,
      registrationInfo: {
        credentialID: Buffer.from('credential-id'),
        credentialPublicKey: Buffer.from('public-key'),
        counter: 0,
        credentialDeviceType: 'singleDevice',
        credentialBackedUp: false,
        fmt: 'none',
        aaguid: 'mock-aaguid-string',
        credentialType: 'public-key',
        origin: 'https://example.com',
        attestationObject: Buffer.from('attestation'),
        userVerified: true
      }
    };
  }
);

export const generateWebAuthnAuthenticationOptions = vi.fn().mockImplementation(
  async (userId?: string): Promise<PublicKeyCredentialRequestOptionsJSON> => {
    return {
      challenge: 'challenge',
      rpId: 'example.com',
      timeout: 60000,
      allowCredentials: userId ? [] : undefined,
      userVerification: 'preferred'
    };
  }
);

export const verifyWebAuthnAuthentication = vi.fn().mockImplementation(
  async (credential: AuthenticationResponseJSON, expectedChallenge: string): Promise<VerifiedAuthenticationResponse & { user?: { id: string; email: string | null } }> => {
    console.log(`Verifying authentication with challenge ${expectedChallenge}`);
    
    if (credential.id === 'credential-not-found') {
      throw new Error('Authenticator not registered with this site');
    }
    
    return {
      verified: true,
      authenticationInfo: {
        credentialID: Buffer.from(credential.id) as unknown as Uint8Array,
        newCounter: 6,
        userVerified: true,
        credentialDeviceType: 'singleDevice',
        credentialBackedUp: false,
        origin: 'https://example.com',
        rpID: 'example.com'
      },
      user: {
        id: 'user123',
        email: 'user@example.com'
      }
    };
  }
);

export const deleteWebAuthnCredential = vi.fn().mockImplementation(
  async (userId: string, credentialId: string): Promise<boolean> => {
    console.log(`Deleting credential for user ${userId}`);
    
    if (credentialId === 'error-credential') {
      throw new Error('Database error');
    }
    return true;
  }
); 