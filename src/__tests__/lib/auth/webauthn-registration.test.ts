import {
  generateWebAuthnRegistrationOptions,
  verifyWebAuthnRegistration
} from '@/lib/auth/webauthn-registration';
import { db } from '@/lib/db/prisma';
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the dependencies
vi.mock('@/lib/db/prisma', () => ({
  db: {
    credential: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: vi.fn(),
  verifyRegistrationResponse: vi.fn(),
}));

vi.mock('@/lib/auth/webauthn-config', () => ({
  getRpID: vi.fn(() => 'localhost'),
  rpName: 'MoodMash Test',
  timeoutDuration: 60000,
  supportedAlgorithmIDs: [-7, -257],
  getExpectedOrigin: vi.fn(() => 'http://localhost:3000'),
}));

describe('WebAuthn Registration Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('generateWebAuthnRegistrationOptions', () => {
    const userId = 'user-123';
    const username = 'testuser';
    const userDisplayName = 'Test User';
    
    const mockExistingCredentials = [
      { externalId: 'credential-1' },
      { externalId: 'credential-2' }
    ];
    
    const mockRegistrationOptions = {
      challenge: 'challenge-123',
      rp: {
        name: 'MoodMash Test',
        id: 'localhost'
      },
      user: {
        id: 'user-123',
        name: 'testuser',
        displayName: 'Test User'
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 }
      ],
      timeout: 60000,
      excludeCredentials: [
        { id: Buffer.from('credential-1', 'base64url'), type: 'public-key', transports: ['internal', 'usb', 'ble', 'nfc', 'hybrid'] },
        { id: Buffer.from('credential-2', 'base64url'), type: 'public-key', transports: ['internal', 'usb', 'ble', 'nfc', 'hybrid'] }
      ],
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred'
      },
      attestation: 'none'
    };

    it('should call db.credential.findMany with the correct parameters', async () => {
      // Setup
      (db.credential.findMany as any).mockResolvedValue(mockExistingCredentials);
      (generateRegistrationOptions as any).mockReturnValue(mockRegistrationOptions);

      // Execute
      await generateWebAuthnRegistrationOptions(userId, username, userDisplayName);

      // Verify
      expect(db.credential.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: { externalId: true },
        take: 50,
      });
    });

    it('should call generateRegistrationOptions with the correct parameters', async () => {
      // Setup
      (db.credential.findMany as any).mockResolvedValue(mockExistingCredentials);
      (generateRegistrationOptions as any).mockReturnValue(mockRegistrationOptions);

      // Execute
      await generateWebAuthnRegistrationOptions(userId, username, userDisplayName);

      // Verify
      expect(generateRegistrationOptions).toHaveBeenCalledWith({
        rpID: 'localhost',
        rpName: 'MoodMash Test',
        userID: userId,
        userName: username,
        userDisplayName,
        timeout: 60000,
        attestationType: 'none',
        excludeCredentials: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Buffer),
            type: 'public-key',
            transports: ['internal', 'usb', 'ble', 'nfc', 'hybrid']
          })
        ]),
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'preferred'
        },
        supportedAlgorithmIDs: [-7, -257],
      });
    });

    it('should return the registration options from generateRegistrationOptions', async () => {
      // Setup
      (db.credential.findMany as any).mockResolvedValue(mockExistingCredentials);
      (generateRegistrationOptions as any).mockReturnValue(mockRegistrationOptions);

      // Execute
      const result = await generateWebAuthnRegistrationOptions(userId, username, userDisplayName);

      // Verify
      expect(result).toEqual(mockRegistrationOptions);
    });

    it('should handle empty credentials array', async () => {
      // Setup
      (db.credential.findMany as any).mockResolvedValue([]);
      (generateRegistrationOptions as any).mockReturnValue(mockRegistrationOptions);

      // Execute
      await generateWebAuthnRegistrationOptions(userId, username, userDisplayName);

      // Verify
      expect(generateRegistrationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          excludeCredentials: []
        })
      );
    });
  });

  describe('verifyWebAuthnRegistration', () => {
    const mockCredential = {
      id: 'credential-id',
      rawId: 'raw-id',
      response: {
        clientDataJSON: 'client-data',
        attestationObject: 'attestation-object'
      },
      type: 'public-key',
      clientExtensionResults: {}
    };
    
    const expectedChallenge = 'challenge-123';
    
    const mockVerificationResult = {
      verified: true,
      registrationInfo: {
        credentialID: Buffer.from('credential-id'),
        credentialPublicKey: Buffer.from('public-key'),
        counter: 0
      }
    };

    it('should call verifyRegistrationResponse with the correct parameters', async () => {
      // Setup
      (verifyRegistrationResponse as any).mockResolvedValue(mockVerificationResult);

      // Execute
      await verifyWebAuthnRegistration(mockCredential as any, expectedChallenge);

      // Verify
      expect(verifyRegistrationResponse).toHaveBeenCalledWith({
        response: mockCredential,
        expectedChallenge,
        expectedOrigin: 'http://localhost:3000',
        expectedRPID: 'localhost'
      });
    });

    it('should return the verification result', async () => {
      // Setup
      (verifyRegistrationResponse as any).mockResolvedValue(mockVerificationResult);

      // Execute
      const result = await verifyWebAuthnRegistration(mockCredential as any, expectedChallenge);

      // Verify
      expect(result).toEqual(mockVerificationResult);
    });

    it('should throw an error if verification fails', async () => {
      // Setup
      const error = new Error('Verification failed');
      (verifyRegistrationResponse as any).mockRejectedValue(error);

      // Execute & Verify
      await expect(verifyWebAuthnRegistration(mockCredential as any, expectedChallenge))
        .rejects.toThrow('Verification failed');
    });
  });
}); 