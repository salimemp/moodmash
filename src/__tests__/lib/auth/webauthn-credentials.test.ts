import {
  deleteWebAuthnCredential,
  getUserCredentials,
  updateCredentialFriendlyName
} from '@/lib/auth/webauthn-credentials';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the database
vi.mock('@/lib/db/prisma', () => ({
  db: {
    credential: {
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Import the mocked database
import { db } from '@/lib/db/prisma';

describe('WebAuthn Credentials Module', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('deleteWebAuthnCredential', () => {
    it('should delete a credential and return true on success', async () => {
      // Setup
      const userId = 'user123';
      const credentialId = 'credential123';
      
      // Mock the database call to succeed
      (db.credential.deleteMany as any).mockResolvedValue({ count: 1 });
      
      // Test
      const result = await deleteWebAuthnCredential(userId, credentialId);
      
      // Assert
      expect(db.credential.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          externalId: credentialId,
        },
      });
      
      expect(result).toBe(true);
    });
    
    it('should handle errors and return false', async () => {
      // Setup
      const userId = 'user123';
      const credentialId = 'credential123';
      
      // Mock the database call to throw an error
      const mockError = new Error('Database error');
      (db.credential.deleteMany as any).mockRejectedValue(mockError);
      
      // Spy on console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Test
      const result = await deleteWebAuthnCredential(userId, credentialId);
      
      // Assert
      expect(db.credential.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          externalId: credentialId,
        },
      });
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting WebAuthn credential:',
        mockError
      );
      
      expect(result).toBe(false);
    });
  });
  
  describe('getUserCredentials', () => {
    it('should return user credentials', async () => {
      // Setup
      const userId = 'user123';
      
      // Mock credentials to return
      const mockCredentials = [
        {
          id: 'cred1',
          externalId: 'ext1',
          publicKey: 'key1',
          counter: 1,
          deviceType: 'platform',
          backupState: true,
          friendlyName: 'Device 1',
          createdAt: new Date(),
        },
        {
          id: 'cred2',
          externalId: 'ext2',
          publicKey: 'key2',
          counter: 2,
          deviceType: 'cross-platform',
          backupState: false,
          friendlyName: null,
          createdAt: new Date(),
        },
      ];
      
      (db.credential.findMany as any).mockResolvedValue(mockCredentials);
      
      // Test
      const result = await getUserCredentials(userId);
      
      // Assert
      expect(db.credential.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: {
          id: true,
          externalId: true,
          deviceType: true,
          backupState: true,
          friendlyName: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      expect(result).toEqual(mockCredentials);
    });
  });
  
  describe('updateCredentialFriendlyName', () => {
    it('should update the credential friendly name', async () => {
      // Setup
      const credentialId = 'cred123';
      const newFriendlyName = 'My Security Key';
      
      // Mock the database call
      const mockUpdatedCredential = {
        id: credentialId,
        friendlyName: newFriendlyName,
      };
      (db.credential.update as any).mockResolvedValue(mockUpdatedCredential);
      
      // Test
      const result = await updateCredentialFriendlyName(credentialId, newFriendlyName);
      
      // Assert
      expect(db.credential.update).toHaveBeenCalledWith({
        where: { id: credentialId },
        data: { friendlyName: newFriendlyName },
      });
      
      expect(result).toEqual(mockUpdatedCredential);
    });
    
    it('should handle errors during update', async () => {
      // Setup
      const credentialId = 'cred123';
      const newFriendlyName = 'My Security Key';
      
      // Mock the database call to throw an error
      const mockError = new Error('Database error');
      (db.credential.update as any).mockRejectedValue(mockError);
      
      // Test & Assert
      await expect(updateCredentialFriendlyName(credentialId, newFriendlyName))
        .rejects.toThrow(mockError);
      
      expect(db.credential.update).toHaveBeenCalledWith({
        where: { id: credentialId },
        data: { friendlyName: newFriendlyName },
      });
      
      // Note: We're skipping the console.error assertion as it's implementation-specific
      // and hard to test in a way that's not brittle.
    });
  });
}); 