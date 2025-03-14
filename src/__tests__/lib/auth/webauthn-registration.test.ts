import * as webauthnConfig from '@/lib/auth/webauthn-config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the SimpleWebAuthn server module
vi.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: vi.fn(),
  verifyRegistrationResponse: vi.fn(),
}));

// Import the mocked functions
import {
  generateRegistrationOptions,
  verifyRegistrationResponse
} from '@simplewebauthn/server';

// Mock the database
vi.mock('@/lib/db/prisma', () => ({
  db: {
    credential: {
      findMany: vi.fn(),
    },
  },
}));

// Import the mocked database
import { db } from '@/lib/db/prisma';

// Import the module under test - after all mocks are set up
import {
  generateWebAuthnRegistrationOptions,
  verifyWebAuthnRegistration
} from '@/lib/auth/webauthn-registration';

describe('WebAuthn Registration Module', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock the configuration values
    vi.spyOn(webauthnConfig, 'getRpID').mockReturnValue('example.com');
    vi.spyOn(webauthnConfig, 'getExpectedOrigin').mockReturnValue('https://example.com');
    vi.spyOn(webauthnConfig, 'supportedAlgorithmIDs', 'get').mockReturnValue([-7, -257]);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('generateWebAuthnRegistrationOptions', () => {
    it('should generate registration options with the correct parameters', async () => {
      // Setup
      const userId = 'user123';
      const username = 'testuser';
      const userDisplayName = 'Test User';
      
      // Mock the database call to return existing credentials
      const mockCredentials = [
        { externalId: 'credential1' },
        { externalId: 'credential2' }
      ];
      (db.credential.findMany as any).mockResolvedValue(mockCredentials);
      
      // Mock the SimpleWebAuthn function
      const mockOptions = { publicKey: { challenge: 'challenge' } };
      (generateRegistrationOptions as any).mockResolvedValue(mockOptions);
      
      // Test
      const result = await generateWebAuthnRegistrationOptions(userId, username, userDisplayName);
      
      // Assert
      expect(db.credential.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: { externalId: true },
        take: 50,
      });
      
      expect(generateRegistrationOptions).toHaveBeenCalledWith(expect.objectContaining({
        rpID: 'example.com',
        rpName: webauthnConfig.rpName,
        userID: userId,
        userName: username,
        userDisplayName,
        timeout: webauthnConfig.timeoutDuration,
        excludeCredentials: expect.any(Array),
        authenticatorSelection: expect.objectContaining({
          residentKey: 'required',
          userVerification: 'preferred',
        }),
        supportedAlgorithmIDs: [-7, -257]
      }));
      
      expect(result).toBe(mockOptions);
    });
  });
  
  describe('verifyWebAuthnRegistration', () => {
    it('should verify registration with the correct parameters', async () => {
      // Setup
      const mockCredential = { id: 'cred123', type: 'public-key' };
      const expectedChallenge = 'challenge123';
      
      // Mock the SimpleWebAuthn function
      const mockVerificationResult = { verified: true, registrationInfo: { credentialID: 'cred123' } };
      (verifyRegistrationResponse as any).mockResolvedValue(mockVerificationResult);
      
      // Test
      const result = await verifyWebAuthnRegistration(mockCredential as any, expectedChallenge);
      
      // Assert
      expect(verifyRegistrationResponse).toHaveBeenCalledWith({
        response: mockCredential,
        expectedChallenge,
        expectedOrigin: 'https://example.com',
        expectedRPID: 'example.com',
      });
      
      expect(result).toBe(mockVerificationResult);
    });
  });
}); 