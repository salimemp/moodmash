import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the database
vi.mock('@/lib/db/prisma', () => {
  return {
    db: {
      credential: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: 'credential-123',
          userId: 'user-123',
          publicKey: 'mock-public-key',
          counter: 0,
          transports: ['usb'],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        update: vi.fn().mockResolvedValue({
          id: 'credential-123',
          userId: 'user-123',
          publicKey: 'mock-public-key',
          counter: 1,
          transports: ['usb'],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        deleteMany: vi.fn().mockResolvedValue({
          count: 1
        })
      },
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'user-123',
          email: 'user@example.com',
          name: 'Test User'
        })
      }
    }
  };
});

// Mock the SimpleWebAuthn library
vi.mock('@simplewebauthn/server', () => {
  return {
    generateRegistrationOptions: vi.fn().mockReturnValue({
      challenge: 'mock-challenge',
      rp: { name: 'MoodMash', id: 'localhost' },
      user: { id: 'user-123', name: 'Test User', displayName: 'Test User' },
      pubKeyCredParams: [],
      timeout: 60000,
      attestation: 'direct',
      excludeCredentials: [],
      authenticatorSelection: { userVerification: 'preferred' }
    }),
    verifyRegistrationResponse: vi.fn().mockResolvedValue({
      verified: true,
      registrationInfo: {
        credentialID: new Uint8Array([1, 2, 3]),
        credentialPublicKey: new Uint8Array([4, 5, 6]),
        counter: 0
      }
    }),
    generateAuthenticationOptions: vi.fn().mockReturnValue({
      challenge: 'mock-challenge',
      rpID: 'localhost',
      timeout: 60000,
      userVerification: 'preferred',
      allowCredentials: []
    }),
    verifyAuthenticationResponse: vi.fn().mockResolvedValue({
      verified: true,
      authenticationInfo: {
        credentialID: new Uint8Array([1, 2, 3]),
        newCounter: 1,
        userVerified: true,
        credentialDeviceType: 'platform' as any,
        credentialBackedUp: true,
        origin: 'https://example.com',
        rpID: 'example.com',
      }
    })
  };
});

// Import the module after mocking
import {
  deleteWebAuthnCredential,
  generateWebAuthnAuthenticationOptions,
  generateWebAuthnRegistrationOptions,
  verifyWebAuthnAuthentication,
  verifyWebAuthnRegistration
} from '@/lib/auth/webauthn';
import { db } from '@/lib/db/prisma';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse
} from '@simplewebauthn/server';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/types';

// Tests for Webauthn functionality
// Validates authentication behaviors and security properties

// Tests for the authentication webauthn module
// Validates security, functionality, and edge cases
// Tests for authorization functionality
// Validates security checks and access controls
describe('WebAuthn Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Tests for configuration and options
// Ensures settings are correctly applied and validated
describe('generateWebAuthnRegistrationOptions', () => {
    // Verifies generation functionality
// Ensures generated items meet expected criteria
it('should generate registration options for a user', async () => {
      const userId = 'user-123';
      const username = 'user@example.com';
      const displayName = 'Test User';

      const options = await generateWebAuthnRegistrationOptions(userId, username, displayName);

      // Verify db was queried for existing credentials
      expect(db.credential.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: { externalId: true },
        take: 50
      });

      // Verify the SimpleWebAuthn library was called
      expect(generateRegistrationOptions).toHaveBeenCalled();

      // Verify the challenge was returned
      expect(options).toHaveProperty('challenge', 'mock-challenge');
      expect(options).toHaveProperty('rp.name', 'MoodMash');
    });
  });

  // Tests for authorization functionality
// Validates security checks and access controls
describe('verifyWebAuthnRegistration', () => {
    // Verifies should verify registration and return the result
// Ensures expected behavior in this scenario
it('should verify registration and return the result', async () => {
      // Create a proper RegistrationResponseJSON object
      const credential: RegistrationResponseJSON = {
        id: 'credential-id',
        rawId: 'credential-raw-id',
        response: {
          clientDataJSON: 'client-data-json',
          attestationObject: 'attestation-object'
        },
        type: 'public-key',
        clientExtensionResults: {}
      };
      const expectedChallenge = 'mock-challenge';

      const result = await verifyWebAuthnRegistration(credential, expectedChallenge);

      // Verify the SimpleWebAuthn library was called
      expect(verifyRegistrationResponse).toHaveBeenCalled();

      // Verify the result was returned
      expect(result).toHaveProperty('verified', true);
    });
  });

  // Tests for configuration and options
// Ensures settings are correctly applied and validated
describe('generateWebAuthnAuthenticationOptions', () => {
    // Verifies generation functionality
// Ensures generated items meet expected criteria
it('should generate authentication options', async () => {
      const options = await generateWebAuthnAuthenticationOptions();

      // Verify the SimpleWebAuthn library was called
      expect(generateAuthenticationOptions).toHaveBeenCalled();

      // Verify the challenge was returned
      expect(options).toHaveProperty('challenge', 'mock-challenge');
      expect(options).toHaveProperty('rpID', 'localhost');
    });

    // Verifies should include user-specific credentials when userid is provided
// Ensures expected behavior in this scenario
it('should include user-specific credentials when userId is provided', async () => {
      // Mock credentials for a specific user
      vi.mocked(db.credential.findMany).mockResolvedValueOnce([
        {
          id: 'credential-id-123',
          userId: 'user-123',
          externalId: 'credential-id-123',
          publicKey: 'mock-public-key',
          counter: 0,
          transports: ['usb', 'nfc'],
          createdAt: new Date(),
          deviceType: 'platform',
          backupState: false,
          friendlyName: 'My Device',
          lastUsed: new Date()
        }
      ]);

      const userId = 'user-123';
      await generateWebAuthnAuthenticationOptions(userId);

      // Use objectContaining for a more flexible assertion
      expect(db.credential.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          take: 50
        })
      );

      // Verify the SimpleWebAuthn library was called
      expect(generateAuthenticationOptions).toHaveBeenCalled();
    });
  });

  // Tests for authorization functionality
// Validates security checks and access controls
describe('verifyWebAuthnAuthentication', () => {
    // Verifies should verify authentication and return the result with user
// Ensures expected behavior in this scenario
it('should verify authentication and return the result with user', async () => {
      // Mock a credential and user
      vi.mocked(db.credential.findUnique).mockResolvedValueOnce({
        id: 'credential-123',
        userId: 'user-123',
        externalId: 'mock-external-id',
        publicKey: 'mock-public-key',
        counter: 0,
        transports: ['usb'],
        createdAt: new Date(),
        deviceType: 'platform',
        backupState: false,
        friendlyName: 'Security Key',
        lastUsed: new Date(),
        user: {
          id: 'user-123',
          email: 'user@example.com'
        }
      } as any); // Use type assertion to handle the user property

      // Create a proper AuthenticationResponseJSON object
      const credential: AuthenticationResponseJSON = {
        id: 'credential-id',
        rawId: 'credential-raw-id',
        response: {
          clientDataJSON: 'client-data-json',
          authenticatorData: 'authenticator-data',
          signature: 'signature',
          userHandle: 'user-handle'
        },
        type: 'public-key',
        clientExtensionResults: {}
      };
      const expectedChallenge = 'mock-challenge';

      const result = await verifyWebAuthnAuthentication(credential, expectedChallenge);

      // Verify the credential was looked up
      expect(db.credential.findUnique).toHaveBeenCalled();

      // Verify the SimpleWebAuthn library was called
      expect(verifyAuthenticationResponse).toHaveBeenCalled();

      // Verify the counter was updated
      expect(db.credential.update).toHaveBeenCalled();

      // Verify the result was returned with user
      expect(result).toHaveProperty('verified', true);
      expect(result).toHaveProperty('user.id', 'user-123');
    });

    // Verifies the correct return value
// Ensures the function behaves as expected
it('should return authentication failed if verification fails', async () => {
      // Mock a credential without user information
      vi.mocked(db.credential.findUnique).mockResolvedValueOnce({
        id: 'credential-123',
        userId: 'user-123',
        externalId: 'mock-external-id',
        publicKey: 'mock-public-key',
        counter: 0,
        transports: ['usb'],
        createdAt: new Date(),
        deviceType: 'platform',
        backupState: false,
        friendlyName: 'Security Key',
        lastUsed: new Date()
      });

      // Mock verification failure with a resolved value instead of rejection
      vi.mocked(verifyAuthenticationResponse).mockResolvedValueOnce({
        verified: false,
        authenticationInfo: {
          credentialID: new Uint8Array([1, 2, 3]),
          newCounter: 1,
          userVerified: true,
          credentialDeviceType: 'platform' as any,
          credentialBackedUp: true,
          origin: 'https://example.com',
          rpID: 'example.com',
        }
      });

      const mockCredential = {
        id: 'mock-credential-id',
        type: 'public-key',
        response: {
          clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiY2hhbGxlbmdlIiwib3JpZ2luIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwIn0=',
          authenticatorData: 'authenticator-data',
          signature: 'signature',
          userHandle: 'user-handle'
        }
      } as any;

      const result = await verifyWebAuthnAuthentication(mockCredential, 'challenge');
      expect(result.verified).toBe(false);
    });

    // Test for credential not found error in verifyWebAuthnAuthentication
    // Verifies error handling behavior
// Ensures appropriate errors are thrown for invalid inputs
it('should throw an error if credential is not found', async () => {
      // Mock credential not found
      vi.mocked(db.credential.findUnique).mockResolvedValueOnce(null);

      const mockCredential = {
        id: 'non-existent-credential',
        type: 'public-key',
        response: {
          clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiY2hhbGxlbmdlIiwib3JpZ2luIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwIn0=',
          authenticatorData: 'authenticator-data',
          signature: 'signature',
          userHandle: 'user-handle'
        }
      } as any;

      await expect(verifyWebAuthnAuthentication(mockCredential, 'challenge'))
        .rejects.toThrow('Authenticator not registered with this site');
    });

    // Test for error in verifyWebAuthnRegistration
    // Verifies should handle errors during registration verification
// Ensures expected behavior in this scenario
it('should handle errors during registration verification', async () => {
      // Create a proper RegistrationResponseJSON object with invalid data that will trigger an error
      const credential: RegistrationResponseJSON = {
        id: 'invalid-credential-id',
        rawId: 'invalid-raw-id',
        response: {
          clientDataJSON: 'invalid-json-that-will-cause-error',
          attestationObject: 'invalid-attestation'
        },
        type: 'public-key',
        clientExtensionResults: {}
      };
      
      // Mock verification error
      vi.mocked(verifyRegistrationResponse).mockImplementationOnce(() => {
        throw new Error('Registration verification failed');
      });

      try {
        await verifyWebAuthnRegistration(credential, 'challenge');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toBe('Registration verification failed');
      }
    });

    // Test for rpID fallback
    // Verifies should use localhost as fallback when next_public_app_url is not available
// Ensures expected behavior in this scenario
it('should use localhost as fallback when NEXT_PUBLIC_APP_URL is not available', async () => {
      // Save original env var
      const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
      
      // Delete the env var to test fallback
      delete process.env.NEXT_PUBLIC_APP_URL;
      
      // Import the module again to trigger the rpID calculation
      vi.resetModules();
      const { rpID } = await import('@/lib/auth/webauthn');
      
      // Check if fallback is used
      expect(rpID).toBe('localhost');
      
      // Restore env var
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    });
  });

  // Tests for authorization functionality
// Validates security checks and access controls
describe('deleteWebAuthnCredential', () => {
    // Verifies should delete a credential and return true on success
// Ensures expected behavior in this scenario
it('should delete a credential and return true on success', async () => {
      const userId = 'user-123';
      const credentialId = 'credential-123';

      const result = await deleteWebAuthnCredential(userId, credentialId);

      // Verify the credential was deleted
      expect(db.credential.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          externalId: credentialId,
        }
      });

      // Verify success was returned
      expect(result).toBe(true);
    });

    // Verifies should handle deletion errors and return false
// Ensures expected behavior in this scenario
it('should handle deletion errors and return false', async () => {
      const userId = 'user-123';
      const credentialId = 'credential-123';

      // Mock deletion error
      vi.mocked(db.credential.deleteMany).mockRejectedValueOnce(new Error('Deletion failed'));

      const result = await deleteWebAuthnCredential(userId, credentialId);

      // Verify the credential deletion was attempted
      expect(db.credential.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          externalId: credentialId,
        }
      });

      // Verify failure was returned
      expect(result).toBe(false);
    });
  });
}); 