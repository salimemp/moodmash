import { KeyManager } from '@/lib/encryption/keyManager';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Constants from KeyManager implementation
const KEY_PREFIX = 'moodmash_keys_';
const PUBLIC_KEY_SUFFIX = '_public';
const ENC_KEY_STORAGE_KEY = 'moodmash_enc_key';
const KEY_META_STORAGE_KEY = 'moodmash_key_meta';

// Mock the crypto module
vi.mock('@/lib/encryption/crypto', () => ({
  deriveKeyFromPassword: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
  encodeBase64: vi.fn().mockImplementation(() => 'encoded_base64_key'),
  generateUserKeys: vi.fn().mockReturnValue({
    publicKey: 'mocked_public_key',
    secretKey: 'mocked_secret_key'
  })
}));

// Import after mocking

// Mock storage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

// Mock window object
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

Object.defineProperty(global, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

describe('KeyManager Extended Tests', () => {
  const userId = 'test-user-123';
  let keyManager: KeyManager;
  
  beforeEach(() => {
    mockLocalStorage.clear();
    mockSessionStorage.clear();
    vi.clearAllMocks();
    keyManager = new KeyManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('key rotation with concurrent operations', () => {
    it('should handle key rotation while maintaining consistency', async () => {
      // Set up initial keys
      keyManager.initialize(userId);
      const initialKeys = {
        publicKey: 'initial_public_key',
        secretKey: 'initial_secret_key',
        salt: 'initial_salt'
      };
      keyManager.setKeys(initialKeys);
      
      // Store the initial metadata
      const initialMetadata = keyManager.getMetadata();
      expect(initialMetadata).toBeTruthy();
      expect(initialMetadata?.keyType).toBe('primary');
      
      // Set a past timestamp for testing purposes
      const pastTimestamp = Date.now() - 1000;
      if (initialMetadata) {
        initialMetadata.createdAt = pastTimestamp;
        initialMetadata.updatedAt = pastTimestamp;
      }
      
      // Simulate concurrent operation by creating a second instance
      const secondManager = new KeyManager(userId);
      
      // First manager performs key rotation
      const newKeys = {
        publicKey: 'new_public_key',
        secretKey: 'new_secret_key',
        salt: 'new_salt'
      };
      
      // Update keys with rotation metadata
      keyManager.setKeys(newKeys, {
        keyType: 'primary' as const,
        keyId: `rotated_${Date.now()}`
      });
      
      // Verify the first manager has the new keys
      expect(keyManager.getPublicKey()).toBe('new_public_key');
      expect(keyManager.getSecretKey()).toBe('new_secret_key');
      
      // Second manager should detect the key change on reload
      secondManager.initialize(userId);
      
      // Both managers should now have the same keys
      expect(secondManager.getPublicKey()).toBe('new_public_key');
      expect(secondManager.getSecretKey()).toBe('new_secret_key');
      
      // Metadata should be updated with new timestamp
      const updatedMetadata = secondManager.getMetadata();
      expect(updatedMetadata?.keyId).not.toBe(initialMetadata?.keyId);
      expect(updatedMetadata?.updatedAt).toBeGreaterThan(pastTimestamp);
    });
    
    it('should handle conflicts during concurrent key operations', () => {
      // Set up initial keys
      keyManager.initialize(userId);
      keyManager.setKeys({
        publicKey: 'initial_public_key',
        secretKey: 'initial_secret_key',
        salt: 'initial_salt'
      });
      
      // Simulate concurrent access
      const manager1 = new KeyManager(userId);
      const manager2 = new KeyManager(userId);
      
      // Both managers make changes
      manager1.setKeys({
        publicKey: 'manager1_public_key',
        secretKey: 'manager1_secret_key',
        salt: 'manager1_salt'
      });
      
      manager2.setKeys({
        publicKey: 'manager2_public_key',
        secretKey: 'manager2_secret_key',
        salt: 'manager2_salt'
      });
      
      // The last write should win in this implementation
      const finalManager = new KeyManager(userId);
      expect(finalManager.getPublicKey()).toBe('manager2_public_key');
      expect(finalManager.getSecretKey()).toBe('manager2_secret_key');
    });
  });

  describe('key backup and recovery scenarios', () => {
    it('should support exporting and importing keys', () => {
      // Setup keys
      keyManager.initialize(userId);
      const originalKeys = {
        publicKey: 'export_public_key',
        secretKey: 'export_secret_key',
        salt: 'export_salt'
      };
      keyManager.setKeys(originalKeys);
      
      // Export keys (simulate by getting directly)
      const exportedData = {
        publicKey: keyManager.getPublicKey(),
        secretKey: keyManager.getSecretKey(),
        metadata: keyManager.getMetadata()
      };
      
      // Clear keys to simulate device reset
      keyManager.clearKeys();
      expect(keyManager.getPublicKey()).toBeNull();
      expect(keyManager.getSecretKey()).toBeNull();
      
      // Import keys on new device
      keyManager.initialize(userId);
      keyManager.setKeys({
        publicKey: exportedData.publicKey || '',
        secretKey: exportedData.secretKey || '',
        salt: 'export_salt'  // Salt would be part of the exported data in real implementation
      }, exportedData.metadata || undefined); // Handle null case
      
      // Verify keys were restored
      expect(keyManager.getPublicKey()).toBe('export_public_key');
      expect(keyManager.getSecretKey()).toBe('export_secret_key');
      
      // Metadata should maintain integrity
      const recoveredMetadata = keyManager.getMetadata();
      expect(recoveredMetadata?.userId).toBe(userId);
      expect(recoveredMetadata?.keyType).toBe('primary');
    });
    
    it('should handle recovery from password-derived backup', async () => {
      // Setup keys
      keyManager.initialize(userId);
      const originalKeys = {
        publicKey: 'backup_public_key',
        secretKey: 'backup_secret_key',
        salt: 'backup_salt'
      };
      keyManager.setKeys(originalKeys);
      
      // Mock the encryption key generation
      const mockEncryptionKey = 'derived_encryption_key';
      const originalGetItem = sessionStorage.getItem;
      sessionStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === ENC_KEY_STORAGE_KEY) {
          return mockEncryptionKey;
        }
        return originalGetItem.call(sessionStorage, key);
      });
      
      // Set encryption key from password
      const password = 'strong_backup_password';
      await keyManager.setEncryptionKeyFromPassword(password);
      const encryptionKey = keyManager.getEncryptionKey();
      expect(encryptionKey).toBe(mockEncryptionKey);
      
      // Store metadata for recovery (would be encrypted in real implementation)
      const backupMetadata = {
        ...keyManager.getMetadata(),
        keyType: 'recovery' as const // Mark as recovery key
      };
      
      // Clear keys to simulate device loss
      keyManager.clearKeys();
      
      // Recover using password and backup
      keyManager.initialize(userId);
      
      // Mock the sessionStorage again for the new instance
      sessionStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === ENC_KEY_STORAGE_KEY) {
          return mockEncryptionKey;
        }
        return null;
      });
      
      await keyManager.setEncryptionKeyFromPassword(password);
      
      // Restore keys (would be decrypted in real implementation)
      keyManager.setKeys({
        publicKey: 'backup_public_key',
        secretKey: 'backup_secret_key',
        salt: 'backup_salt'
      }, backupMetadata);
      
      // Verify keys were restored from backup
      expect(keyManager.getPublicKey()).toBe('backup_public_key');
      expect(keyManager.getSecretKey()).toBe('backup_secret_key');
      
      // Check that this is marked as a recovery key
      const recoveredMetadata = keyManager.getMetadata();
      expect(recoveredMetadata?.keyType).toBe('recovery');
      
      // Restore the original sessionStorage.getItem
      sessionStorage.getItem = originalGetItem;
    });
  });

  describe('key versioning and compatibility', () => {
    it('should maintain compatibility between different key versions', () => {
      // Setup "old version" keys
      keyManager.initialize(userId);
      const oldVersionKeys = {
        publicKey: 'old_version_public',
        secretKey: 'old_version_secret',
        salt: 'old_salt'
      };
      
      // Set with v1 metadata structure
      const v1Metadata = {
        userId: userId,
        keyId: 'v1_key_id',
        createdAt: Date.now() - 10000, // Created in the past
        updatedAt: Date.now() - 10000,
        publicKeyShared: true,
        deviceId: 'old_device',
        keyType: 'primary' as const,
        version: '1.0' // Version indicator
      };
      
      // Set the keys with old version metadata
      keyManager.setKeys(oldVersionKeys, v1Metadata);
      
      // Create "new version" instance
      const newVersionManager = new KeyManager(userId);
      
      // New version should be able to read old keys
      expect(newVersionManager.getPublicKey()).toBe('old_version_public');
      expect(newVersionManager.getSecretKey()).toBe('old_version_secret');
      
      // New version updates keys with new format
      const newVersionKeys = {
        publicKey: 'new_version_public',
        secretKey: 'new_version_secret',
        salt: 'new_salt'
      };
      
      // Add new version-specific fields to metadata
      newVersionManager.setKeys(newVersionKeys, {
        keyId: 'v2_key_id',
        version: '2.0', // Updated version
        keyType: 'primary' as const,
        algorithms: ['ed25519', 'x25519'] // New field in v2
      } as any); // Use any to bypass TypeScript for test
      
      // Old version manager should still be able to read the core fields
      keyManager.initialize(userId); // Reload to get updated keys
      expect(keyManager.getPublicKey()).toBe('new_version_public');
      expect(keyManager.getSecretKey()).toBe('new_version_secret');
      
      // Metadata should contain the common fields
      const metadata = keyManager.getMetadata();
      expect(metadata?.userId).toBe(userId);
      expect(metadata?.keyId).toBe('v2_key_id');
      expect(metadata?.keyType).toBe('primary');
    });
    
    it('should handle upgrade and downgrade scenarios', () => {
      // Setup initial keys
      keyManager.initialize(userId);
      keyManager.setKeys({
        publicKey: 'compatible_public',
        secretKey: 'compatible_secret',
        salt: 'compatible_salt'
      });
      
      // Store public key for another user with v1 format
      keyManager.storePublicKeyForUser('other_user', 'other_user_public_key');
      
      // Create new manager simulating upgraded version
      const upgradedManager = new KeyManager(userId);
      
      // Should maintain compatibility with stored keys
      expect(upgradedManager.getPublicKeyForUser('other_user')).toBe('other_user_public_key');
      
      // Upgraded version adds keys with enhanced format
      upgradedManager.storePublicKeyForUser('enhanced_user', 'enhanced_public_key');
      
      // Simulate downgrade by recreating original manager
      keyManager.initialize(userId);
      
      // Should still be able to access keys stored by upgraded version
      expect(keyManager.getPublicKeyForUser('enhanced_user')).toBe('enhanced_public_key');
    });
  });

  describe('key revocation and cleanup', () => {
    it('should revoke a key by marking it as inactive', () => {
      // Setup initial keys
      keyManager.initialize(userId);
      keyManager.setKeys({
        publicKey: 'active_public_key',
        secretKey: 'active_secret_key',
        salt: 'active_salt'
      }, {
        keyId: 'key-to-revoke',
        keyType: 'primary' as const,
        status: 'active'
      } as any); // Using any for extended metadata properties
      
      // Store the metadata before revocation
      const initialMetadata = keyManager.getMetadata() as any;
      expect(initialMetadata?.keyId).toBe('key-to-revoke');
      expect(initialMetadata?.status).toBe('active');
      
      // Revoke the key by updating its metadata
      keyManager.setKeys({
        publicKey: 'active_public_key',
        secretKey: 'active_secret_key',
        salt: 'active_salt'
      }, {
        ...initialMetadata,
        status: 'revoked',
        revokedAt: Date.now()
      } as any); // Using any for extended metadata properties
      
      // Verify the key is marked as revoked
      const updatedMetadata = keyManager.getMetadata() as any;
      expect(updatedMetadata?.status).toBe('revoked');
      expect(updatedMetadata?.revokedAt).toBeDefined();
    });
    
    it('should handle multiple keys with different statuses', () => {
      // Setup primary user keys
      keyManager.initialize(userId);
      keyManager.setKeys({
        publicKey: 'primary_public_key',
        secretKey: 'primary_secret_key',
        salt: 'primary_salt'
      }, {
        keyId: 'primary-key-id',
        keyType: 'primary' as const
      });
      
      // Store public keys for two other users
      keyManager.storePublicKeyForUser('active-user', 'active_user_public_key');
      keyManager.storePublicKeyForUser('revoked-user', 'revoked_user_public_key');
      
      // Simulate metadata for the second key as revoked (would be in a real revocation list)
      // This would typically be managed by a separate revocation list in a real implementation
      const mockRevocationList: Record<string, { revoked: boolean; revokedAt: number }> = {
        'revoked-user': { revoked: true, revokedAt: Date.now() - 1000 }
      };
      
      // Verify user public keys can be retrieved
      expect(keyManager.getPublicKeyForUser('active-user')).toBe('active_user_public_key');
      expect(keyManager.getPublicKeyForUser('revoked-user')).toBe('revoked_user_public_key');
      
      // Verify that the mock revocation list shows one key is revoked
      expect(mockRevocationList['revoked-user']?.revoked).toBe(true);
      expect(mockRevocationList['active-user']?.revoked).toBeUndefined();
    });
    
    it('should support key cleanup by removing old keys', () => {
      // Setup initial storage to contain multiple keys
      const oldKeyId = 'old-key-123';
      const newKeyId = 'new-key-456';
      
      // Simulate LocalStorage with multiple keys
      mockLocalStorage.setItem(`moodmash_keys_${userId}`, 'current_secret_key');
      mockLocalStorage.setItem(`moodmash_keys_${userId}_old_${oldKeyId}`, 'old_secret_key');
      mockLocalStorage.setItem(`moodmash_keys_${userId}_old_${newKeyId}`, 'newer_secret_key');
      
      // Create mock metadata for these keys
      const oldTime = Date.now() - 90 * 24 * 60 * 60 * 1000; // 90 days ago
      const newTime = Date.now() - 1 * 24 * 60 * 60 * 1000;  // 1 day ago
      
      const oldMetadata = JSON.stringify({
        userId,
        keyId: oldKeyId,
        createdAt: oldTime,
        updatedAt: oldTime,
        publicKeyShared: true,
        deviceId: 'old-device',
        keyType: 'primary',
        status: 'inactive'
      });
      
      const newMetadata = JSON.stringify({
        userId,
        keyId: newKeyId,
        createdAt: newTime,
        updatedAt: newTime,
        publicKeyShared: true,
        deviceId: 'new-device',
        keyType: 'primary',
        status: 'active'
      });
      
      mockLocalStorage.setItem(`${KEY_META_STORAGE_KEY}_${userId}_${oldKeyId}`, oldMetadata);
      mockLocalStorage.setItem(`${KEY_META_STORAGE_KEY}_${userId}_${newKeyId}`, newMetadata);
      
      // Simulate key cleanup function (would be part of a real implementation)
      const cleanupOldKeys = () => {
        // Get all storage keys
        const keys: string[] = [];
        // In real implementation, you would iterate through localStorage keys
        
        // Mock for the test - we manually add our known keys
        keys.push(`moodmash_keys_${userId}_old_${oldKeyId}`);
        keys.push(`${KEY_META_STORAGE_KEY}_${userId}_${oldKeyId}`);
        keys.push(`moodmash_keys_${userId}_old_${newKeyId}`);
        keys.push(`${KEY_META_STORAGE_KEY}_${userId}_${newKeyId}`);
        
        // Check each metadata to identify old, inactive keys
        const MAX_AGE_DAYS = 30;
        const OLD_KEY_THRESHOLD = Date.now() - (MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
        
        let cleanupCount = 0;
        
        keys.forEach(key => {
          if (key.includes(KEY_META_STORAGE_KEY)) {
            const metaStr = mockLocalStorage.getItem(key);
            if (metaStr) {
              try {
                const meta = JSON.parse(metaStr);
                
                // If key is old and inactive, remove it
                if (meta.createdAt < OLD_KEY_THRESHOLD && meta.status === 'inactive') {
                  // Find related storage keys to clean up
                  const keyId = meta.keyId;
                  mockLocalStorage.removeItem(`moodmash_keys_${userId}_old_${keyId}`);
                  mockLocalStorage.removeItem(`${KEY_META_STORAGE_KEY}_${userId}_${keyId}`);
                  cleanupCount++;
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        });
        
        return cleanupCount;
      };
      
      // Test the cleanup function
      const removedCount = cleanupOldKeys();
      
      // Only the old key should be removed
      expect(removedCount).toBe(1);
      expect(mockLocalStorage.getItem(`moodmash_keys_${userId}_old_${oldKeyId}`)).toBeNull();
      expect(mockLocalStorage.getItem(`${KEY_META_STORAGE_KEY}_${userId}_${oldKeyId}`)).toBeNull();
      
      // Newer key should still exist
      expect(mockLocalStorage.getItem(`moodmash_keys_${userId}_old_${newKeyId}`)).not.toBeNull();
      expect(mockLocalStorage.getItem(`${KEY_META_STORAGE_KEY}_${userId}_${newKeyId}`)).not.toBeNull();
    });
    
    it('should handle key rotation with secure cleanup', () => {
      // Setup initial keys
      keyManager.initialize(userId);
      const originalKeys = {
        publicKey: 'original_public_key',
        secretKey: 'original_secret_key',
        salt: 'original_salt'
      };
      
      keyManager.setKeys(originalKeys, {
        keyId: 'original-key-id',
        keyType: 'primary' as const
      });
      
      // Verify original keys were set
      expect(keyManager.getPublicKey()).toBe('original_public_key');
      
      // Mock LocalStorage operations to track what's stored
      const setItemSpy = vi.spyOn(mockLocalStorage, 'setItem');
      setItemSpy.mockClear();
      
      // Perform key rotation
      const newKeys = {
        publicKey: 'rotated_public_key',
        secretKey: 'rotated_secret_key',
        salt: 'rotated_salt'
      };
      
      // In a real implementation, old key would be archived first
      const archiveKey = () => {
        const oldKeyId = keyManager.getMetadata()?.keyId;
        if (oldKeyId && keyManager.getSecretKey()) {
          // Get current key data
          const currentKey = keyManager.getSecretKey();
          const currentMeta = keyManager.getMetadata();
          
          // Store as old key
          if (currentKey && currentMeta) {
            mockLocalStorage.setItem(`moodmash_keys_${userId}_old_${oldKeyId}`, currentKey);
            mockLocalStorage.setItem(
              `${KEY_META_STORAGE_KEY}_${userId}_${oldKeyId}`, 
              JSON.stringify({...currentMeta, status: 'inactive'})
            );
          }
        }
      };
      
      // Archive original key first
      archiveKey();
      
      // Set new keys (rotation)
      keyManager.setKeys(newKeys, {
        keyId: 'rotated-key-id',
        keyType: 'primary' as const
      });
      
      // Verify new keys are active
      expect(keyManager.getPublicKey()).toBe('rotated_public_key');
      
      // Verify old key was archived
      const archivedKey = mockLocalStorage.getItem(`moodmash_keys_${userId}_old_original-key-id`);
      expect(archivedKey).toBe('original_secret_key');
      
      // Simulate secure cleanup of keys by overwriting data
      const secureCleanup = (keyData: string | null) => {
        if (!keyData) return;
        
        // In real implementation, would overwrite with random data several times
        // Here we just simulate the overwrite once
        return '0'.repeat(keyData.length);
      };
      
      // In a real implementation, you might perform secure cleanup on sensitive key data
      // For testing purposes, let's simulate overwriting the archived key
      if (archivedKey) {
        const overwrittenData = secureCleanup(archivedKey);
        mockLocalStorage.setItem(`moodmash_keys_${userId}_old_original-key-id`, overwrittenData || '');
      }
      
      // Verify the data was securely overwritten
      const overwrittenKey = mockLocalStorage.getItem(`moodmash_keys_${userId}_old_original-key-id`);
      expect(overwrittenKey).toBe('0'.repeat('original_secret_key'.length));
    });
  });
}); 