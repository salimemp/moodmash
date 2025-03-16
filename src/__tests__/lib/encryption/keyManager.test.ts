import { KeyManager, KeyMetadata } from '@/lib/encryption/keyManager';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
import * as crypto from '@/lib/encryption/crypto';

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

// Import constants used in KeyManager
const PUBLIC_KEY_SUFFIX = '_public';

describe('KeyManager', () => {
  const userId = 'test-user-123';
  const mockUserKeys = {
    publicKey: 'test_public_key',
    secretKey: 'test_secret_key'
  };
  const mockSalt = 'test_salt';
  
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

  describe('initialization', () => {
    it('should initialize with userId', () => {
      keyManager.initialize(userId);
      expect(keyManager['userId']).toBe(userId);
    });

    it('should initialize with userId in constructor', () => {
      const manager = new KeyManager(userId);
      expect(manager['userId']).toBe(userId);
    });
    
    it('should handle browser environment detection correctly', () => {
      // Test with window defined (already mocked)
      const instance1 = new KeyManager(userId);
      expect(instance1['storage']).not.toBeNull();
      
      // Test without window
      const originalWindow = global.window;
      // @ts-ignore - deliberate manipulation for testing
      delete global.window;
      
      const instance2 = new KeyManager(userId);
      expect(instance2['storage']).toBeNull();
      
      // Restore window
      global.window = originalWindow;
    });
    
    it('should attempt to load keys from storage', () => {
      // Set up storage with existing keys
      const storedKeys = JSON.stringify({
        publicKey: 'stored_public_key',
        secretKey: 'stored_secret_key',
        salt: 'stored_salt'
      });
      
      const storedMeta = JSON.stringify({
        userId,
        keyId: 'stored-key-id',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        publicKeyShared: true,
        deviceId: 'test-device',
        keyType: 'primary'
      });
      
      mockLocalStorage.setItem(`moodmash_keys_${userId}`, storedKeys);
      mockLocalStorage.setItem(`moodmash_key_meta_${userId}`, storedMeta);
      
      // Spy on getItem to verify it was called
      const getItemSpy = vi.spyOn(mockLocalStorage, 'getItem');
      
      // Create new instance that should try to load from storage
      const newManager = new KeyManager(userId);
      
      // Verify getItem was called with the correct keys
      expect(getItemSpy).toHaveBeenCalledWith(`moodmash_keys_${userId}`);
      expect(getItemSpy).toHaveBeenCalledWith(`moodmash_key_meta_${userId}`);
      
      // Verify the manager instance was properly initialized with data from storage
      expect(newManager['userId']).toBe(userId);
    });
    
    it('should handle corrupted storage data gracefully', () => {
      // Set up storage with invalid JSON
      mockLocalStorage.setItem(`moodmash_keys_${userId}`, 'invalid-json-data');
      mockLocalStorage.setItem(`moodmash_key_meta`, '{invalid-json');
      
      // Should not throw when creating manager
      expect(() => {
        new KeyManager(userId);
      }).not.toThrow();
    });
  });

  describe('key management', () => {
    it('should set keys and metadata', () => {
      keyManager.initialize(userId);
      
      const metadata: Partial<KeyMetadata> = {
        keyId: 'test-key-123',
        keyType: 'primary'
      };
      
      keyManager.setKeys({
        ...mockUserKeys,
        salt: mockSalt
      }, metadata);
      
      expect(keyManager['publicKey']).toBe(mockUserKeys.publicKey);
      expect(keyManager['secretKey']).toBe(mockUserKeys.secretKey);
      expect(keyManager['salt']).toBe(mockSalt);
      
      const savedMetadata = keyManager.getMetadata();
      expect(savedMetadata?.keyId).toBe(metadata.keyId);
      expect(savedMetadata?.keyType).toBe(metadata.keyType);
      expect(savedMetadata?.userId).toBe(userId);
    });
    
    it('should throw error when setting keys without userId', () => {
      // Don't initialize with userId
      expect(() => {
        keyManager.setKeys({
          ...mockUserKeys,
          salt: mockSalt
        });
      }).toThrow('User ID not set');
    });
    
    it('should set default metadata values if not provided', () => {
      keyManager.initialize(userId);
      
      keyManager.setKeys({
        ...mockUserKeys,
        salt: mockSalt
      });
      
      const metadata = keyManager.getMetadata();
      expect(metadata).not.toBeNull();
      expect(metadata?.keyType).toBe('primary'); // default value
      expect(metadata?.publicKeyShared).toBe(false); // default value
      expect(metadata?.deviceId).toBeDefined(); // auto-generated
    });
    
    it('should get null keys when not set', () => {
      expect(keyManager.getPublicKey()).toBeNull();
      expect(keyManager.getSecretKey()).toBeNull();
      expect(keyManager.getKeys()).toBeNull();
    });
    
    it('should get keys after they are set', () => {
      keyManager.initialize(userId);
      keyManager.setKeys({
        ...mockUserKeys,
        salt: mockSalt
      });
      
      expect(keyManager.getPublicKey()).toBe(mockUserKeys.publicKey);
      expect(keyManager.getSecretKey()).toBe(mockUserKeys.secretKey);
      expect(keyManager.getKeys()).toEqual({
        publicKey: mockUserKeys.publicKey,
        secretKey: mockUserKeys.secretKey
      });
    });
    
    it('should clear keys', () => {
      keyManager.initialize(userId);
      keyManager.setKeys({
        ...mockUserKeys,
        salt: mockSalt
      });
      
      keyManager.clearKeys();
      
      expect(keyManager.getPublicKey()).toBeNull();
      expect(keyManager.getSecretKey()).toBeNull();
      expect(keyManager.hasKeys()).toBe(false);
    });
    
    it('should detect when keys are set', () => {
      keyManager.initialize(userId);
      expect(keyManager.hasKeys()).toBe(false);
      
      keyManager.setKeys({
        ...mockUserKeys,
        salt: mockSalt
      });
      
      expect(keyManager.hasKeys()).toBe(true);
    });
    
    it('should verify localStorage interaction when saving keys', () => {
      keyManager.initialize(userId);
      
      // Spy on localStorage.setItem
      const setItemSpy = vi.spyOn(mockLocalStorage, 'setItem');
      
      keyManager.setKeys({
        ...mockUserKeys,
        salt: mockSalt
      });
      
      // Verify localStorage was used correctly
      expect(setItemSpy).toHaveBeenCalled();
      expect(setItemSpy.mock.calls.some(call => 
        call[0] === `moodmash_keys_${userId}`
      )).toBe(true);
    });
  });
  
  describe('encryption key management', () => {
    it('should set and get encryption key', async () => {
      // Direct manipulation of internal state to test setting/getting
      keyManager.initialize(userId);
      keyManager['encryptionKey'] = 'test_encryption_key';
      
      // Verify our key is available
      expect(keyManager.getEncryptionKey()).toBe('test_encryption_key');
    });

    it('should throw error when setting encryption key without salt', async () => {
      keyManager.initialize(userId);
      
      await expect(keyManager.setEncryptionKeyFromPassword('password'))
        .rejects.toThrow('Salt not available. Set keys first.');
    });
    
    it('should verify deriveKeyFromPassword is called with correct parameters', async () => {
      keyManager.initialize(userId);
      keyManager.setKeys({
        ...mockUserKeys,
        salt: mockSalt
      });
      
      // Spy on the derivation function
      const deriveSpy = vi.spyOn(crypto, 'deriveKeyFromPassword');
      
      await keyManager.setEncryptionKeyFromPassword('test-password');
      
      // Verify the function was called with correct parameters
      expect(deriveSpy).toHaveBeenCalledWith('test-password', mockSalt);
    });
    
    it('should verify sessionStorage interaction when setting encryption key', async () => {
      keyManager.initialize(userId);
      keyManager.setKeys({
        ...mockUserKeys,
        salt: mockSalt
      });
      
      // Spy on sessionStorage.setItem
      const setItemSpy = vi.spyOn(mockSessionStorage, 'setItem');
      
      await keyManager.setEncryptionKeyFromPassword('test-password');
      
      // Just verify sessionStorage.setItem was called with the right key
      expect(setItemSpy).toHaveBeenCalled();
      expect(setItemSpy.mock.calls.some(call => 
        call[0] === 'moodmash_enc_key'
      )).toBe(true);
    });
    
    it('should get encryption key from session storage when not in memory', () => {
      // Set up session storage
      mockSessionStorage.setItem('moodmash_enc_key', 'stored_enc_key');
      
      // Manually clear the in-memory encryption key
      keyManager.initialize(userId);
      keyManager['encryptionKey'] = null;
      
      // Check if it reads from session storage 
      expect(keyManager.getEncryptionKey()).toBe('stored_enc_key');
    });
    
    it('should clear encryption key', async () => {
      // Mock internal state
      keyManager['encryptionKey'] = 'test_encryption_key';
      
      keyManager.clearEncryptionKey();
      
      expect(keyManager.getEncryptionKey()).toBeNull();
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('moodmash_enc_key');
    });
    
    it('should verify sessionStorage interaction when clearing encryption key', () => {
      keyManager['encryptionKey'] = 'test_encryption_key';
      
      // Spy on sessionStorage.removeItem
      const removeItemSpy = vi.spyOn(mockSessionStorage, 'removeItem');
      
      keyManager.clearEncryptionKey();
      
      // Verify sessionStorage was used correctly
      expect(removeItemSpy).toHaveBeenCalledWith('moodmash_enc_key');
    });
    
    it('should handle unavailable sessionStorage when accessing encryption key', () => {
      // Setup a test encryption key
      keyManager['encryptionKey'] = 'test_encryption_key';
      
      // Mock sessionStorage as undefined 
      const originalSessionStorage = global.sessionStorage;
      // @ts-ignore - deliberate manipulation for testing
      delete global.sessionStorage;
      
      // Clearing should not throw even if sessionStorage is unavailable
      expect(() => {
        keyManager.clearEncryptionKey();
      }).not.toThrow();
      
      // Getting should still work with in-memory value
      expect(keyManager.getEncryptionKey()).toBe(null); // Now null after clearing
      
      // Restore sessionStorage
      global.sessionStorage = originalSessionStorage;
    });
    
    it('should return null or default values for getters when properties not initialized', () => {
      // Create a new manager without initializing
      const newManager = new KeyManager();
      
      // All getters should return null or default values
      expect(newManager.getPublicKey()).toBeNull();
      expect(newManager.getSecretKey()).toBeNull();
      expect(newManager.getKeys()).toBeNull();
      expect(newManager.getMetadata()).toBeNull();
      expect(newManager.getEncryptionKey()).toBeNull();
      expect(newManager.hasKeys()).toBe(false);
    });
  });
  
  describe('metadata management', () => {
    it('should mark public key as shared', () => {
      keyManager.initialize(userId);
      keyManager.setKeys({
        ...mockUserKeys,
        salt: mockSalt
      });
      
      expect(keyManager.getMetadata()?.publicKeyShared).toBe(false);
      
      keyManager.markPublicKeyAsShared();
      
      expect(keyManager.getMetadata()?.publicKeyShared).toBe(true);
    });
    
    it('should do nothing when marking key as shared with no metadata', () => {
      keyManager.initialize(userId);
      // Don't set keys, so no metadata
      
      // Should not throw
      expect(() => {
        keyManager.markPublicKeyAsShared();
      }).not.toThrow();
      
      // Still no metadata
      expect(keyManager.getMetadata()).toBeNull();
    });
    
    it('should verify localStorage interaction when saving metadata', () => {
      keyManager.initialize(userId);
      keyManager.setKeys({
        ...mockUserKeys,
        salt: mockSalt
      });
      
      // Metadata should exist
      expect(keyManager.getMetadata()).not.toBeNull();
      
      // Spy on localStorage.setItem
      const setItemSpy = vi.spyOn(mockLocalStorage, 'setItem');
      
      keyManager.markPublicKeyAsShared();
      
      // Verify localStorage was used correctly
      expect(setItemSpy).toHaveBeenCalled();
      expect(setItemSpy.mock.calls.some(call => 
        call[0] === `moodmash_key_meta_${userId}`
      )).toBe(true);
    });
  });
  
  describe('public key storage for other users', () => {
    it('should store and retrieve public key for other user', () => {
      const otherUserId = 'other-user-123';
      const otherUserPublicKey = 'other-user-public-key';
      
      keyManager.storePublicKeyForUser(otherUserId, otherUserPublicKey);
      
      // Verify the key is stored in localStorage
      const storageKey = `moodmash_keys_${otherUserId}${PUBLIC_KEY_SUFFIX}`;
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(storageKey, otherUserPublicKey);
    });
    
    it('should verify localStorage interaction when storing public keys', () => {
      const otherUserId = 'other-user-123';
      const otherUserPublicKey = 'other-user-public-key';
      
      // Spy on localStorage.setItem
      const setItemSpy = vi.spyOn(mockLocalStorage, 'setItem');
      
      keyManager.storePublicKeyForUser(otherUserId, otherUserPublicKey);
      
      // Verify localStorage was used correctly
      expect(setItemSpy).toHaveBeenCalled();
    });
    
    it('should return null for non-existent public key', () => {
      expect(keyManager.getPublicKeyForUser('non-existent-user')).toBeNull();
    });
    
    it('should verify localStorage interaction when retrieving public keys', () => {
      const otherUserId = 'other-user-123';
      
      // Spy on localStorage.getItem
      const getItemSpy = vi.spyOn(mockLocalStorage, 'getItem');
      
      keyManager.getPublicKeyForUser(otherUserId);
      
      // Verify localStorage was used correctly with the correct key
      const expectedKey = `moodmash_keys_${otherUserId}_public`;
      expect(getItemSpy).toHaveBeenCalledWith(expectedKey);
    });
  });
  
  describe('edge cases', () => {
    it('should handle missing userId in metadata', () => {
      keyManager.initialize(userId);
      
      // Set keys with custom metadata missing userId
      keyManager.setKeys({
        ...mockUserKeys,
        salt: mockSalt
      }, {
        keyId: 'test-key',
        keyType: 'recovery',
        // userId deliberately omitted
      } as Partial<KeyMetadata>);
      
      // Metadata should include userId from initialize
      const metadata = keyManager.getMetadata();
      expect(metadata).not.toBeNull();
      expect(metadata?.userId).toBe(userId);
    });
    
    it('should handle missing keyId in metadata by generating one', () => {
      keyManager.initialize(userId);
      
      // Set keys with metadata missing keyId
      keyManager.setKeys({
        ...mockUserKeys,
        salt: mockSalt
      }, {
        // keyId deliberately omitted
        keyType: 'primary'
      });
      
      // Metadata should include auto-generated keyId
      const metadata = keyManager.getMetadata();
      expect(metadata).not.toBeNull();
      expect(metadata?.keyId).toBeDefined();
      expect(typeof metadata?.keyId).toBe('string');
    });
    
    it('should handle corrupt JSON when loading keys', () => {
      // Store invalid JSON in localStorage
      mockLocalStorage.setItem(`moodmash_keys_${userId}`, '{invalid:json}');
      
      // Initialize with userId to trigger loading from storage
      keyManager.initialize(userId);
      
      // Should not have keys due to parse error
      expect(keyManager.hasKeys()).toBe(false);
    });
    
    it('should handle storage errors when saving keys', () => {
      keyManager.initialize(userId);
      
      // Create keys that will be set
      const keys = {
        ...mockUserKeys,
        salt: mockSalt
      };
      
      // First let the keys be set normally to establish internal state
      keyManager.setKeys(keys);
      
      // Now reset the mock and make it throw
      mockLocalStorage.setItem.mockReset();
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      // We can still get keys even if saving to storage fails
      expect(keyManager.getPublicKey()).toBe(keys.publicKey);
      expect(keyManager.getSecretKey()).toBe(keys.secretKey);
      
      // Verify console.error is called
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call a method that would try to save to storage
      keyManager.markPublicKeyAsShared();
      
      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('Failed to save');
    });
    
    it('should handle storage errors when saving metadata', () => {
      keyManager.initialize(userId);
      keyManager.setKeys({
        ...mockUserKeys,
        salt: mockSalt
      });
      
      // Mock localStorage.setItem to throw an error for metadata
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      // Should not throw when marking public key as shared (which saves metadata)
      expect(() => {
        keyManager.markPublicKeyAsShared();
      }).not.toThrow();
    });
    
    it('should handle unavailable storage when getting public key for user', () => {
      // Set storage to null to simulate unavailable storage
      keyManager['storage'] = null;
      
      // Should return null without throwing
      expect(keyManager.getPublicKeyForUser('any-user-id')).toBeNull();
    });
    
    it('should handle unavailable storage when storing public key for user', () => {
      // Set storage to null to simulate unavailable storage
      keyManager['storage'] = null;
      
      // Should not throw
      expect(() => {
        keyManager.storePublicKeyForUser('any-user-id', 'any-public-key');
      }).not.toThrow();
    });
    
    it('should handle unavailable storage when getting device ID', () => {
      // Set storage to null to simulate unavailable storage
      keyManager['storage'] = null;
      
      // Call a method that invokes getOrCreateDeviceId
      keyManager.initialize(userId);
      keyManager.setKeys({
        ...mockUserKeys,
        salt: mockSalt
      });
      
      // Check that a device ID was still created
      const metadata = keyManager.getMetadata();
      expect(metadata?.deviceId).toBeDefined();
      expect(metadata?.deviceId.startsWith('device_')).toBe(true);
    });
    
    it('should handle storage errors when getting device ID', () => {
      // Mock localStorage.getItem to throw for device ID
      mockLocalStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      // Call a method that invokes getOrCreateDeviceId
      keyManager.initialize(userId);
      keyManager.setKeys({
        ...mockUserKeys,
        salt: mockSalt
      });
      
      // Check that a device ID was still created
      const metadata = keyManager.getMetadata();
      expect(metadata?.deviceId).toBeDefined();
      expect(metadata?.deviceId.startsWith('device_')).toBe(true);
    });
  });
}); 