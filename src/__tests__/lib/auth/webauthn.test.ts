import * as webauthn from '@/lib/auth/webauthn';
import * as webauthnAuthentication from '@/lib/auth/webauthn-authentication';
import {
  generateWebAuthnAuthenticationOptions,
  verifyWebAuthnAuthentication
} from '@/lib/auth/webauthn-authentication';
import * as webauthnConfig from '@/lib/auth/webauthn-config';
import {
  getRpID,
  rpName
} from '@/lib/auth/webauthn-config';
import * as webauthnCredentials from '@/lib/auth/webauthn-credentials';
import {
  deleteWebAuthnCredential
} from '@/lib/auth/webauthn-credentials';
import * as webauthnRegistration from '@/lib/auth/webauthn-registration';
import {
  generateWebAuthnRegistrationOptions,
  verifyWebAuthnRegistration
} from '@/lib/auth/webauthn-registration';
import type {
  VerifiedAuthenticationResponse,
  VerifiedRegistrationResponse
} from '@simplewebauthn/server';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON
} from '@simplewebauthn/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Create mock type for credential from database
type MockCredential = {
    id: string;
    userId: string;
    createdAt: Date;
    externalId: string;
    publicKey: string;
    counter: number;
    deviceType: string | null;
    backupState: boolean | null;
    transports: string[];
    friendlyName: string | null;
    lastUsed: Date;
};

// Create helper function for mock credentials
function createMockCredential(overrides: Partial<MockCredential> = {}): MockCredential {
    return {
        id: 'cred-id',
        userId: 'user123',
        createdAt: new Date(),
        externalId: 'external-id',
        publicKey: 'mock-public-key',
        counter: 0,
        deviceType: 'singleDevice',
        backupState: false,
        transports: ['internal'],
        friendlyName: 'Test Credential',
        lastUsed: new Date(),
        ...overrides
    };
}

// Mock the SimpleWebAuthn library
vi.mock('@simplewebauthn/server', () => ({
  generateAuthenticationOptions: vi.fn().mockImplementation(() => {
    return {
      challenge: 'challenge',
      rpId: 'example.com',
      timeout: 60000,
      allowCredentials: undefined,
      userVerification: 'preferred',
    };
  }),
  generateRegistrationOptions: vi.fn().mockImplementation(() => {
    return {
      challenge: 'challenge',
      rp: { id: 'example.com', name: 'MoodMash' },
      user: { id: 'user123', name: 'user@example.com', displayName: 'Test User' },
      pubKeyCredParams: [],
      timeout: 60000,
      excludeCredentials: [],
      authenticatorSelection: {},
      extensions: {}
    };
  }),
  verifyAuthenticationResponse: vi.fn(),
  verifyRegistrationResponse: vi.fn(),
}));

// Mock URL constructor for environment testing
class MockURL {
  hostname: string;
  
  constructor(url: string) {
    this.hostname = url.includes('test-domain.com') ? 'test-domain.com' : 'example.com';
  }
  
  static canParse() { return true; }
  static createObjectURL() { return ''; }
  static parse() { return null; }
  static revokeObjectURL() { }
}

// @ts-ignore - mock URL for testing
global.URL = MockURL;

// Mock the database
vi.mock('@/lib/db/prisma', () => ({
  db: {
    credential: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

// Import mocked modules
import { db } from '@/lib/db/prisma';

describe('WebAuthn Module', () => {
  describe('Configuration exports', () => {
    it('should export getExpectedOrigin from webauthn-config', () => {
      expect(webauthn.getExpectedOrigin).toBe(webauthnConfig.getExpectedOrigin);
    });

    it('should export getRpID from webauthn-config', () => {
      expect(webauthn.getRpID).toBe(webauthnConfig.getRpID);
    });

    it('should export rpName from webauthn-config', () => {
      expect(webauthn.rpName).toBe(webauthnConfig.rpName);
    });

    it('should export supportedAlgorithmIDs from webauthn-config', () => {
      expect(webauthn.supportedAlgorithmIDs).toBe(webauthnConfig.supportedAlgorithmIDs);
    });

    it('should export timeoutDuration from webauthn-config', () => {
      expect(webauthn.timeoutDuration).toBe(webauthnConfig.timeoutDuration);
    });
  });

  describe('Registration exports', () => {
    it('should export generateWebAuthnRegistrationOptions from webauthn-registration', () => {
      expect(webauthn.generateWebAuthnRegistrationOptions).toBe(webauthnRegistration.generateWebAuthnRegistrationOptions);
    });

    it('should export verifyWebAuthnRegistration from webauthn-registration', () => {
      expect(webauthn.verifyWebAuthnRegistration).toBe(webauthnRegistration.verifyWebAuthnRegistration);
    });
  });

  describe('Authentication exports', () => {
    it('should export generateWebAuthnAuthenticationOptions from webauthn-authentication', () => {
      expect(webauthn.generateWebAuthnAuthenticationOptions).toBe(webauthnAuthentication.generateWebAuthnAuthenticationOptions);
    });

    it('should export verifyWebAuthnAuthentication from webauthn-authentication', () => {
      expect(webauthn.verifyWebAuthnAuthentication).toBe(webauthnAuthentication.verifyWebAuthnAuthentication);
    });
  });

  describe('Credential management exports', () => {
    it('should export deleteWebAuthnCredential from webauthn-credentials', () => {
      expect(webauthn.deleteWebAuthnCredential).toBe(webauthnCredentials.deleteWebAuthnCredential);
    });

    it('should export getUserCredentials from webauthn-credentials', () => {
      expect(webauthn.getUserCredentials).toBe(webauthnCredentials.getUserCredentials);
    });

    it('should export updateCredentialFriendlyName from webauthn-credentials', () => {
      expect(webauthn.updateCredentialFriendlyName).toBe(webauthnCredentials.updateCredentialFriendlyName);
    });
  });

  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
  
  describe('RP Configuration', () => {
    it('should use the domain from NEXT_PUBLIC_APP_URL for rpID', () => {
      // Store original value
      const originalUrl = process.env.NEXT_PUBLIC_APP_URL;
      
      // Set test value
      process.env.NEXT_PUBLIC_APP_URL = 'https://test-domain.com';
      
      // Call the function directly
      expect(getRpID()).toBe('test-domain.com');
      
      // Restore original value
      process.env.NEXT_PUBLIC_APP_URL = originalUrl;
    });
    
    it('should fallback to localhost for rpID if NEXT_PUBLIC_APP_URL is not set', () => {
      // Store original value
      const originalUrl = process.env.NEXT_PUBLIC_APP_URL;
      
      // Remove env variable
      delete process.env.NEXT_PUBLIC_APP_URL;
      
      // Call the function directly
      expect(getRpID()).toBe('localhost');
      
      // Restore original value
      process.env.NEXT_PUBLIC_APP_URL = originalUrl;
    });
    
    it('should use MoodMash as rpName', () => {
      expect(rpName).toBe('MoodMash');
    });
  });
  
  describe('generateWebAuthnRegistrationOptions', () => {
    it('should fetch existing credentials and exclude them', async () => {
      const userId = 'user123';
      const username = 'user@example.com';
      const userDisplayName = 'Test User';
      
      const mockCredentials = [
        createMockCredential({ externalId: 'cred1' }),
        createMockCredential({ externalId: 'cred2' }),
      ];
      
      vi.mocked(db.credential.findMany).mockResolvedValue(mockCredentials);
      
      await generateWebAuthnRegistrationOptions(userId, username, userDisplayName);
      
      expect(db.credential.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: { externalId: true },
        take: 50,
      });
      
      expect(generateRegistrationOptions).toHaveBeenCalledWith(expect.objectContaining({
        rpID: 'example.com',
        rpName: 'MoodMash',
        userID: userId,
        userName: username,
        userDisplayName,
        timeout: 60000,
        attestationType: 'none',
        excludeCredentials: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Buffer),
            type: 'public-key',
          }),
        ]),
      }));
    });
  });
  
  describe('verifyWebAuthnRegistration', () => {
    it('should verify registration with the correct parameters', async () => {
      const mockCredential: RegistrationResponseJSON = {
        id: 'credential-id',
        type: 'public-key',
        rawId: 'raw-id',
        response: {
          clientDataJSON: 'client-data',
          attestationObject: 'attestation-object',
          transports: ['internal'] as AuthenticatorTransportFuture[],
        },
        clientExtensionResults: {},
      };
      
      const expectedChallenge = 'challenge123';
      
      const mockVerificationResult: VerifiedRegistrationResponse = {
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
          userVerified: true,
        },
      };
      
      vi.mocked(verifyRegistrationResponse).mockResolvedValue(mockVerificationResult);
      
      const result = await verifyWebAuthnRegistration(mockCredential, expectedChallenge);
      
      expect(verifyRegistrationResponse).toHaveBeenCalledWith({
        response: mockCredential,
        expectedChallenge,
        expectedOrigin: 'https://example.com',
        expectedRPID: 'example.com',
      });
      
      expect(result).toEqual(mockVerificationResult);
    });
  });
  
  describe('generateWebAuthnAuthenticationOptions', () => {
    it('should generate authentication options without userId', async () => {
      const mockAuthOptions = {
        challenge: 'challenge',
        rpId: 'example.com',
        timeout: 60000,
        allowCredentials: undefined,
        userVerification: 'preferred',
      } as unknown as PublicKeyCredentialRequestOptionsJSON;
      
      vi.mocked(generateAuthenticationOptions).mockReturnValue(Promise.resolve(mockAuthOptions));
      
      const result = await generateWebAuthnAuthenticationOptions();
      
      expect(db.credential.findMany).not.toHaveBeenCalled();
      expect(generateAuthenticationOptions).toHaveBeenCalledWith({
        rpID: 'example.com',
        timeout: 60000,
        allowCredentials: undefined,
        userVerification: 'preferred',
      });
      
      expect(result).toEqual(mockAuthOptions);
    });
    
    it('should generate authentication options with userId', async () => {
      const userId = 'user123';
      const mockCredentials = [
        createMockCredential({ externalId: 'cred1' }),
        createMockCredential({ externalId: 'cred2' }),
      ];
      
      vi.mocked(db.credential.findMany).mockResolvedValue(mockCredentials);
      
      const mockAuthOptions = {
        challenge: 'challenge',
        rpId: 'example.com',
        timeout: 60000,
        allowCredentials: [],
        userVerification: 'preferred',
      } as unknown as PublicKeyCredentialRequestOptionsJSON;
      
      vi.mocked(generateAuthenticationOptions).mockReturnValue(Promise.resolve(mockAuthOptions));
      
      await generateWebAuthnAuthenticationOptions(userId);
      
      expect(db.credential.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: { externalId: true },
        take: 50,
      });
      
      expect(generateAuthenticationOptions).toHaveBeenCalledWith(expect.objectContaining({
        rpID: 'example.com',
        timeout: 60000,
        allowCredentials: expect.any(Array),
      }));
    });
  });
  
  describe('verifyWebAuthnAuthentication', () => {
    it('should throw an error if credential is not found', async () => {
      const mockCredential: AuthenticationResponseJSON = {
        id: 'credential-id',
        rawId: 'raw-id',
        type: 'public-key',
        response: {
          clientDataJSON: 'client-data',
          authenticatorData: 'auth-data',
          signature: 'signature',
          userHandle: 'user-handle',
        },
        clientExtensionResults: {},
      };
      
      const expectedChallenge = 'challenge123';
      
      vi.mocked(db.credential.findUnique).mockResolvedValue(null);
      
      await expect(verifyWebAuthnAuthentication(mockCredential, expectedChallenge))
        .rejects.toThrow('Authenticator not registered with this site');
    });
    
    it('should verify authentication and update counter on success', async () => {
      const credentialId = 'credential-id';
      const mockCredential: AuthenticationResponseJSON = {
        id: credentialId,
        rawId: 'raw-id',
        type: 'public-key',
        response: {
          clientDataJSON: 'client-data',
          authenticatorData: 'auth-data',
          signature: 'signature',
          userHandle: 'user-handle',
        },
        clientExtensionResults: {},
      };
      
      const expectedChallenge = 'challenge123';
      
      const mockDbCredential = createMockCredential({
        id: 'db-cred-id',
        externalId: credentialId,
        publicKey: 'public-key',
        counter: 5,
      });
      
      // Add user property manually for the test
      const mockDbCredentialWithUser = {
        ...mockDbCredential,
        user: {
          id: 'user123',
          email: 'user@example.com',
        }
      };
      
      const mockVerificationResult: VerifiedAuthenticationResponse = {
        verified: true,
        authenticationInfo: {
          credentialID: Buffer.from(credentialId) as unknown as Uint8Array,
          newCounter: 6,
          userVerified: true,
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
          origin: 'https://example.com',
          rpID: 'example.com',
        },
      };
      
      vi.mocked(db.credential.findUnique).mockResolvedValue(mockDbCredentialWithUser as any);
      vi.mocked(verifyAuthenticationResponse).mockResolvedValue(mockVerificationResult);
      
      const result = await verifyWebAuthnAuthentication(mockCredential, expectedChallenge);
      
      expect(db.credential.findUnique).toHaveBeenCalledWith({
        where: {
          externalId: credentialId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });
      
      expect(verifyAuthenticationResponse).toHaveBeenCalledWith({
        response: mockCredential,
        expectedChallenge,
        expectedOrigin: 'https://example.com',
        expectedRPID: 'example.com',
        authenticator: {
          credentialID: expect.any(Buffer),
          credentialPublicKey: expect.any(Buffer),
          counter: 5,
        },
      });
      
      expect(db.credential.update).toHaveBeenCalledWith({
        where: { id: 'db-cred-id' },
        data: { counter: 6 },
      });
      
      expect(result).toEqual({
        ...mockVerificationResult,
        user: mockDbCredentialWithUser.user,
      });
    });
  });
  
  describe('deleteWebAuthnCredential', () => {
    it('should delete credentials and return true on success', async () => {
      const userId = 'user123';
      const credentialId = 'cred123';
      
      vi.mocked(db.credential.deleteMany).mockResolvedValue({ count: 1 });
      
      const result = await deleteWebAuthnCredential(userId, credentialId);
      
      expect(db.credential.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          externalId: credentialId,
        },
      });
      
      expect(result).toBe(true);
    });
    
    it('should handle errors and return false', async () => {
      const userId = 'user123';
      const credentialId = 'cred123';
      
      vi.mocked(db.credential.deleteMany).mockRejectedValue(new Error('Database error'));
      
      // Mock console.error to avoid polluting test output
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await deleteWebAuthnCredential(userId, credentialId);
      
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });
});