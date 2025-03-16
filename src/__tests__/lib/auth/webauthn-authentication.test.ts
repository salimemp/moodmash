import * as webauthnConfig from '@/lib/auth/webauthn-config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the SimpleWebAuthn server module
vi.mock('@simplewebauthn/server', () => ({
  generateAuthenticationOptions: vi.fn(),
  verifyAuthenticationResponse: vi.fn(),
}));

// Import the mocked functions
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';

// Mock the database
vi.mock('@/lib/db/prisma', () => ({
  db: {
    credential: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Import the mocked database
import { db } from '@/lib/db/prisma';

// Import the module under test - after all mocks are set up
import {
  generateWebAuthnAuthenticationOptions,
  verifyWebAuthnAuthentication
} from '@/lib/auth/webauthn-authentication';

describe('WebAuthn Authentication Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the configuration values
    vi.spyOn(webauthnConfig, 'getRpID').mockReturnValue('localhost');
    vi.spyOn(webauthnConfig, 'getExpectedOrigin').mockReturnValue('http://localhost:3000');
    vi.spyOn(webauthnConfig, 'timeoutDuration', 'get').mockReturnValue(60000);
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('generateWebAuthnAuthenticationOptions', () => {
    const userId = 'user-123';
    
    const mockUserCredentials = [
      { externalId: 'credential-1' },
      { externalId: 'credential-2' }
    ];
    
    const mockAuthenticationOptions = {
      challenge: 'challenge-123',
      timeout: 60000,
      rpID: 'localhost',
      allowCredentials: [
        { id: Buffer.from('credential-1', 'base64url'), type: 'public-key', transports: ['internal', 'usb', 'ble', 'nfc', 'hybrid'] },
        { id: Buffer.from('credential-2', 'base64url'), type: 'public-key', transports: ['internal', 'usb', 'ble', 'nfc', 'hybrid'] }
      ],
      userVerification: 'preferred'
    };

    it('should call db.credential.findMany with the correct parameters when userId is provided', async () => {
      // Setup
      (db.credential.findMany as any).mockResolvedValue(mockUserCredentials);
      (generateAuthenticationOptions as any).mockReturnValue(mockAuthenticationOptions);

      // Execute
      await generateWebAuthnAuthenticationOptions(userId);

      // Verify
      expect(db.credential.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: { externalId: true },
        take: 50,
      });
    });

    it('should call generateAuthenticationOptions with the correct parameters when userId is provided', async () => {
      // Setup
      (db.credential.findMany as any).mockResolvedValue(mockUserCredentials);
      (generateAuthenticationOptions as any).mockReturnValue(mockAuthenticationOptions);

      // Execute
      await generateWebAuthnAuthenticationOptions(userId);

      // Verify
      expect(generateAuthenticationOptions).toHaveBeenCalledWith({
        rpID: 'localhost',
        timeout: 60000,
        allowCredentials: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Buffer),
            type: 'public-key',
            transports: ['internal', 'usb', 'ble', 'nfc', 'hybrid']
          })
        ]),
        userVerification: 'preferred'
      });
    });

    it('should call generateAuthenticationOptions without allowCredentials when userId is not provided', async () => {
      // Setup
      (generateAuthenticationOptions as any).mockReturnValue(mockAuthenticationOptions);

      // Execute
      await generateWebAuthnAuthenticationOptions();

      // Verify
      expect(db.credential.findMany).not.toHaveBeenCalled();
      expect(generateAuthenticationOptions).toHaveBeenCalledWith({
        rpID: 'localhost',
        timeout: 60000,
        allowCredentials: undefined,
        userVerification: 'preferred'
      });
    });

    it('should return the authentication options from generateAuthenticationOptions', async () => {
      // Setup
      (db.credential.findMany as any).mockResolvedValue(mockUserCredentials);
      (generateAuthenticationOptions as any).mockReturnValue(mockAuthenticationOptions);

      // Execute
      const result = await generateWebAuthnAuthenticationOptions(userId);

      // Verify
      expect(result).toEqual(mockAuthenticationOptions);
    });

    it('should handle empty credentials array', async () => {
      // Setup
      (db.credential.findMany as any).mockResolvedValue([]);
      (generateAuthenticationOptions as any).mockReturnValue(mockAuthenticationOptions);

      // Execute
      await generateWebAuthnAuthenticationOptions(userId);

      // Verify
      expect(generateAuthenticationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          allowCredentials: []
        })
      );
    });
  });
  
  describe('verifyWebAuthnAuthentication', () => {
    const mockCredential = {
      id: 'credential-id',
      rawId: 'raw-id',
      response: {
        clientDataJSON: 'client-data',
        authenticatorData: 'authenticator-data',
        signature: 'signature',
        userHandle: 'user-handle'
      },
      type: 'public-key',
      clientExtensionResults: {}
    };
    
    const expectedChallenge = 'challenge-123';
    
    const mockDbCredential = {
      id: 'db-credential-id',
      externalId: 'credential-id',
      publicKey: 'public-key-base64url',
      counter: 0,
      user: {
        id: 'user-123',
        email: 'user@example.com'
      }
    };
    
    const mockVerificationResult = {
      verified: true,
      authenticationInfo: {
        credentialID: Buffer.from('credential-id'),
        newCounter: 1
      }
    };

    it('should call db.credential.findUnique with the correct parameters', async () => {
      // Setup
      (db.credential.findUnique as any).mockResolvedValue(mockDbCredential);
      (verifyAuthenticationResponse as any).mockResolvedValue(mockVerificationResult);

      // Execute
      await verifyWebAuthnAuthentication(mockCredential as any, expectedChallenge);

      // Verify
      expect(db.credential.findUnique).toHaveBeenCalledWith({
        where: {
          externalId: 'credential-id',
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
    });

    it('should throw an error if the credential is not found', async () => {
      // Setup
      (db.credential.findUnique as any).mockResolvedValue(null);

      // Execute & Verify
      await expect(verifyWebAuthnAuthentication(mockCredential as any, expectedChallenge))
        .rejects.toThrow('Authenticator not registered with this site');
    });

    it('should call verifyAuthenticationResponse with the correct parameters', async () => {
      // Setup
      (db.credential.findUnique as any).mockResolvedValue(mockDbCredential);
      (verifyAuthenticationResponse as any).mockResolvedValue(mockVerificationResult);

      // Execute
      await verifyWebAuthnAuthentication(mockCredential as any, expectedChallenge);

      // Verify
      expect(verifyAuthenticationResponse).toHaveBeenCalledWith({
        response: mockCredential,
        expectedChallenge,
        expectedOrigin: 'http://localhost:3000',
        expectedRPID: 'localhost',
        authenticator: {
          credentialID: expect.any(Buffer),
          credentialPublicKey: expect.any(Buffer),
          counter: 0,
        },
      });
    });

    it('should update the counter if verification is successful', async () => {
      // Setup
      (db.credential.findUnique as any).mockResolvedValue(mockDbCredential);
      (verifyAuthenticationResponse as any).mockResolvedValue(mockVerificationResult);

      // Execute
      await verifyWebAuthnAuthentication(mockCredential as any, expectedChallenge);

      // Verify
      expect(db.credential.update).toHaveBeenCalledWith({
        where: { id: 'db-credential-id' },
        data: { counter: 1 },
      });
    });

    it('should not update the counter if verification fails', async () => {
      // Setup
      (db.credential.findUnique as any).mockResolvedValue(mockDbCredential);
      (verifyAuthenticationResponse as any).mockResolvedValue({ verified: false });

      // Execute
      await verifyWebAuthnAuthentication(mockCredential as any, expectedChallenge);

      // Verify
      expect(db.credential.update).not.toHaveBeenCalled();
    });

    it('should return the verification result with user information', async () => {
      // Setup
      (db.credential.findUnique as any).mockResolvedValue(mockDbCredential);
      (verifyAuthenticationResponse as any).mockResolvedValue(mockVerificationResult);

      // Execute
      const result = await verifyWebAuthnAuthentication(mockCredential as any, expectedChallenge);

      // Verify
      expect(result).toEqual({
        ...mockVerificationResult,
        user: mockDbCredential.user,
      });
    });

    it('should throw an error if verification fails with an error', async () => {
      // Setup
      (db.credential.findUnique as any).mockResolvedValue(mockDbCredential);
      const error = new Error('Verification failed');
      (verifyAuthenticationResponse as any).mockRejectedValue(error);

      // Execute & Verify
      await expect(verifyWebAuthnAuthentication(mockCredential as any, expectedChallenge))
        .rejects.toThrow('Verification failed');
    });
  });
}); 