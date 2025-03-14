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
    vi.resetAllMocks();
    
    // Mock the configuration values
    vi.spyOn(webauthnConfig, 'getRpID').mockReturnValue('example.com');
    vi.spyOn(webauthnConfig, 'getExpectedOrigin').mockReturnValue('https://example.com');
    vi.spyOn(webauthnConfig, 'timeoutDuration', 'get').mockReturnValue(60000);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('generateWebAuthnAuthenticationOptions', () => {
    it('should generate authentication options with credentials when userId is provided', async () => {
      // Setup
      const userId = 'user123';
      
      // Mock the database call to return user credentials
      const mockCredentials = [
        { externalId: 'credential1' },
        { externalId: 'credential2' }
      ];
      (db.credential.findMany as any).mockResolvedValue(mockCredentials);
      
      // Mock the SimpleWebAuthn function
      const mockOptions = { publicKey: { challenge: 'challenge' } };
      (generateAuthenticationOptions as any).mockResolvedValue(mockOptions);
      
      // Test
      const result = await generateWebAuthnAuthenticationOptions(userId);
      
      // Assert
      expect(db.credential.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: { externalId: true },
        take: 50,
      });
      
      expect(generateAuthenticationOptions).toHaveBeenCalledWith(expect.objectContaining({
        rpID: 'example.com',
        timeout: 60000,
        allowCredentials: expect.any(Array),
        userVerification: 'preferred',
      }));
      
      expect(result).toBe(mockOptions);
    });
    
    it('should generate authentication options without credentials when userId is not provided', async () => {
      // Mock the SimpleWebAuthn function
      const mockOptions = { publicKey: { challenge: 'challenge' } };
      (generateAuthenticationOptions as any).mockResolvedValue(mockOptions);
      
      // Test
      const result = await generateWebAuthnAuthenticationOptions();
      
      // Assert
      expect(db.credential.findMany).not.toHaveBeenCalled();
      
      expect(generateAuthenticationOptions).toHaveBeenCalledWith(expect.objectContaining({
        rpID: 'example.com',
        timeout: 60000,
        allowCredentials: undefined,
        userVerification: 'preferred',
      }));
      
      expect(result).toBe(mockOptions);
    });
  });
  
  describe('verifyWebAuthnAuthentication', () => {
    it('should verify authentication and update counter when successful', async () => {
      // Setup
      const mockCredential = { id: 'cred123', type: 'public-key' };
      const expectedChallenge = 'challenge123';
      
      // Mock the database calls
      const mockDbCredential = {
        id: 'db-cred-id',
        externalId: 'cred123',
        publicKey: 'public-key-data',
        counter: 5,
        user: {
          id: 'user123',
          email: 'user@example.com',
        },
      };
      (db.credential.findUnique as any).mockResolvedValue(mockDbCredential);
      (db.credential.update as any).mockResolvedValue({ ...mockDbCredential, counter: 6 });
      
      // Mock the SimpleWebAuthn function
      const mockVerificationResult = { 
        verified: true, 
        authenticationInfo: { newCounter: 6 } 
      };
      (verifyAuthenticationResponse as any).mockResolvedValue(mockVerificationResult);
      
      // Test
      const result = await verifyWebAuthnAuthentication(mockCredential as any, expectedChallenge);
      
      // Assert
      expect(db.credential.findUnique).toHaveBeenCalledWith({
        where: {
          externalId: 'cred123',
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
        user: mockDbCredential.user,
      });
    });
    
    it('should throw an error when credential is not found', async () => {
      // Setup
      const mockCredential = { id: 'cred123', type: 'public-key' };
      const expectedChallenge = 'challenge123';
      
      // Mock the database call to return no credential
      (db.credential.findUnique as any).mockResolvedValue(null);
      
      // Test & Assert
      await expect(verifyWebAuthnAuthentication(mockCredential as any, expectedChallenge))
        .rejects.toThrow('Authenticator not registered with this site');
      
      expect(db.credential.findUnique).toHaveBeenCalledWith({
        where: {
          externalId: 'cred123',
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
  });
}); 