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
  const userId = 'user-123';
  const credentialId = 'credential-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('deleteWebAuthnCredential', () => {
    it('should call db.credential.deleteMany with the correct parameters', async () => {
      // Setup
      (db.credential.deleteMany as any).mockResolvedValue({ count: 1 });

      // Execute
      await deleteWebAuthnCredential(userId, credentialId);

      // Verify
      expect(db.credential.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          externalId: credentialId,
        },
      });
    });

    it('should return true when deletion is successful', async () => {
      // Setup
      (db.credential.deleteMany as any).mockResolvedValue({ count: 1 });

      // Execute
      const result = await deleteWebAuthnCredential(userId, credentialId);

      // Verify
      expect(result).toBe(true);
    });

    it('should return false when an error occurs', async () => {
      // Setup
      const error = new Error('Deletion failed');
      (db.credential.deleteMany as any).mockRejectedValue(error);

      // Execute
      const result = await deleteWebAuthnCredential(userId, credentialId);

      // Verify
      expect(result).toBe(false);
    });

    it('should log the error when an error occurs', async () => {
      // Setup
      const error = new Error('Deletion failed');
      (db.credential.deleteMany as any).mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Execute
      await deleteWebAuthnCredential(userId, credentialId);

      // Verify
      expect(consoleSpy).toHaveBeenCalledWith('Error deleting WebAuthn credential:', error);
    });
  });
  
  describe('getUserCredentials', () => {
    const mockCredentials = [
      {
        id: 'db-id-1',
        externalId: 'credential-1',
        deviceType: 'platform',
        backupState: false,
        friendlyName: 'My Device',
        createdAt: new Date()
      },
      {
        id: 'db-id-2',
        externalId: 'credential-2',
        deviceType: 'cross-platform',
        backupState: true,
        friendlyName: 'Security Key',
        createdAt: new Date()
      }
    ];

    it('should call db.credential.findMany with the correct parameters', async () => {
      // Setup
      (db.credential.findMany as any).mockResolvedValue(mockCredentials);

      // Execute
      await getUserCredentials(userId);

      // Verify
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
    });

    it('should return the credentials from the database', async () => {
      // Setup
      (db.credential.findMany as any).mockResolvedValue(mockCredentials);

      // Execute
      const result = await getUserCredentials(userId);

      // Verify
      expect(result).toEqual(mockCredentials);
    });
  });
  
  describe('updateCredentialFriendlyName', () => {
    const dbCredentialId = 'db-id-1';
    const friendlyName = 'My New Device Name';
    const mockUpdatedCredential = {
      id: dbCredentialId,
      externalId: 'credential-1',
      deviceType: 'platform',
      backupState: false,
      friendlyName,
      createdAt: new Date()
    };

    it('should call db.credential.update with the correct parameters', async () => {
      // Setup
      (db.credential.update as any).mockResolvedValue(mockUpdatedCredential);

      // Execute
      await updateCredentialFriendlyName(dbCredentialId, friendlyName);

      // Verify
      expect(db.credential.update).toHaveBeenCalledWith({
        where: { id: dbCredentialId },
        data: { friendlyName },
      });
    });

    it('should return the updated credential', async () => {
      // Setup
      (db.credential.update as any).mockResolvedValue(mockUpdatedCredential);

      // Execute
      const result = await updateCredentialFriendlyName(dbCredentialId, friendlyName);

      // Verify
      expect(result).toEqual(mockUpdatedCredential);
    });

    it('should throw an error when update fails', async () => {
      // Setup
      const error = new Error('Update failed');
      (db.credential.update as any).mockRejectedValue(error);

      // Execute & Verify
      await expect(updateCredentialFriendlyName(dbCredentialId, friendlyName))
        .rejects.toThrow('Update failed');
    });

    it.skip('should log the error when update fails', async () => {
      // Setup
      const error = new Error('Update failed');
      (db.credential.update as any).mockRejectedValue(error);
      
      // Spy on console.error before the function is called
      const consoleSpy = vi.spyOn(console, 'error');
      
      // Execute & Verify
      try {
        await updateCredentialFriendlyName(dbCredentialId, friendlyName);
        // Should not reach here
        expect(true).toBe(false);
      } catch (err) {
        // Verify error logging happens before the error is thrown
        expect(consoleSpy).toHaveBeenCalledWith('Error updating credential friendly name:', error);
      }
    });
  });
}); 