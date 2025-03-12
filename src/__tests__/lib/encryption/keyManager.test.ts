import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock localStorage and sessionStorage
class MockStorage {
  private store: Record<string, string> = {};

  public getItem(key: string): string | null {
    return this.store[key] || null;
  }

  public setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  public removeItem(key: string): void {
    delete this.store[key];
  }

  public clear(): void {
    this.store = {};
  }
}

// Mock window.localStorage and sessionStorage
const mockLocalStorage = new MockStorage();
const mockSessionStorage = new MockStorage();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

// Mock the crypto module
vi.mock('@/lib/encryption/crypto', () => {
  return {
    deriveKeyFromPassword: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    encodeBase64: vi.fn().mockImplementation((data) => {
      if (data instanceof Uint8Array) {
        return `encoded-${Array.from(data).join('-')}`; 
      }
      return 'encoded-data';
    })
  };
});

// Import the module after mocking
import { deriveKeyFromPassword, encodeBase64 } from '@/lib/encryption/crypto';
import { KeyManager, keyManager } from '@/lib/encryption/keyManager';

// Tests for the encryption keyManager module
// Validates cryptographic operations and security properties
// Tests for keymanager functionality
// Validates expected behavior in various scenarios
describe('KeyManager', () => {
  let manager: KeyManager;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    mockSessionStorage.clear();
    
    // Create a new instance for each test
    manager = new KeyManager();
  });
  
  // Tests for initialize functionality
// Validates expected behavior in various scenarios
describe('initialize', () => {
    // Verifies should set the user id
// Ensures expected behavior in this scenario
it('should set the user ID', () => {
      manager.initialize('test-user-id');
      
      // Verify user ID is set (indirectly through other methods)
      expect(manager.hasKeys()).toBe(false); // Initially no keys
    });

    // Verifies should load keys from storage if they exist
// Ensures expected behavior in this scenario
it('should load keys from storage if they exist', () => {
      // First set keys for a user
      manager.initialize('test-user-id');
      manager.setKeys({
        publicKey: 'test-public-key',
        secretKey: 'test-secret-key',
        salt: 'test-salt'
      });
      
      // Create a new instance and initialize with same user ID
      const newManager = new KeyManager();
      newManager.initialize('test-user-id');
      
      // Verify keys were loaded
      expect(newManager.hasKeys()).toBe(true);
      expect(newManager.getPublicKey()).toBe('test-public-key');
      expect(newManager.getSecretKey()).toBe('test-secret-key');
    });
  });
  
  // Tests for setkeys functionality
// Validates expected behavior in various scenarios
describe('setKeys', () => {
    // Verifies should store keys and create metadata
// Ensures expected behavior in this scenario
it('should store keys and create metadata', () => {
      manager.initialize('test-user-id');
      
      manager.setKeys({
        publicKey: 'test-public-key',
        secretKey: 'test-secret-key',
        salt: 'test-salt'
      });
      
      // Verify keys are set
      expect(manager.hasKeys()).toBe(true);
      expect(manager.getPublicKey()).toBe('test-public-key');
      expect(manager.getSecretKey()).toBe('test-secret-key');
      
      // Verify metadata
      const metadata = manager.getMetadata();
      expect(metadata).not.toBeNull();
      if (metadata) {
        expect(metadata.userId).toBe('test-user-id');
        expect(metadata.keyType).toBe('primary');
        expect(metadata.publicKeyShared).toBe(false);
      }
    });
    
    // Verifies error handling behavior
// Ensures appropriate errors are thrown for invalid inputs
it('should throw error if user ID is not set', () => {
      // Don't initialize first
      
      expect(() => {
        manager.setKeys({
          publicKey: 'test-public-key',
          secretKey: 'test-secret-key',
          salt: 'test-salt'
        });
      }).toThrow('User ID not set');
    });
    
    // Verifies should overwrite existing keys
// Ensures expected behavior in this scenario
it('should overwrite existing keys', () => {
      manager.initialize('test-user-id');
      
      // Set initial keys
      manager.setKeys({
        publicKey: 'initial-public-key',
        secretKey: 'initial-secret-key',
        salt: 'initial-salt'
      });
      
      // Set new keys
      manager.setKeys({
        publicKey: 'new-public-key',
        secretKey: 'new-secret-key',
        salt: 'new-salt'
      });
      
      // Verify keys are updated
      expect(manager.getPublicKey()).toBe('new-public-key');
      expect(manager.getSecretKey()).toBe('new-secret-key');
    });
    
    // Verifies should accept custom metadata
// Ensures expected behavior in this scenario
it('should accept custom metadata', () => {
      manager.initialize('test-user-id');
      
      manager.setKeys({
        publicKey: 'test-public-key',
        secretKey: 'test-secret-key',
        salt: 'test-salt'
      }, {
        keyType: 'recovery',
        publicKeyShared: true
      });
      
      // Verify custom metadata
      const metadata = manager.getMetadata();
      expect(metadata).not.toBeNull();
      if (metadata) {
        expect(metadata.keyType).toBe('recovery');
        expect(metadata.publicKeyShared).toBe(true);
      }
    });
  });

  // Tests for getkeys functionality
// Validates expected behavior in various scenarios
describe('getKeys', () => {
    // Verifies the correct return value
// Ensures the function behaves as expected
it('should return null if no keys set', () => {
      manager.initialize('test-user-id');
      
      const keys = manager.getKeys();
      
      expect(keys).toBeNull();
    });
    
    // Verifies the correct return value
// Ensures the function behaves as expected
it('should return keys object when keys are set', () => {
      manager.initialize('test-user-id');
      
      manager.setKeys({
        publicKey: 'test-public-key',
        secretKey: 'test-secret-key',
        salt: 'test-salt'
      });
      
      const keys = manager.getKeys();
      
      expect(keys).not.toBeNull();
      expect(keys).toEqual({
        publicKey: 'test-public-key',
        secretKey: 'test-secret-key'
      });
    });
  });
  
  // Tests for password handling
// Verifies secure password operations
describe('setEncryptionKeyFromPassword', () => {
    // Verifies should derive key from password and salt
// Ensures expected behavior in this scenario
it('should derive key from password and salt', async () => {
      manager.initialize('test-user-id');
      
      manager.setKeys({
        publicKey: 'test-public-key',
        secretKey: 'test-secret-key',
        salt: 'test-salt'
      });
      
      const encryptionKey = await manager.setEncryptionKeyFromPassword('test-password');
      
      // Verify deriveKeyFromPassword was called
      expect(deriveKeyFromPassword).toHaveBeenCalledWith('test-password', 'test-salt');
      
      // Verify encodeBase64 was called with the derived key
      expect(encodeBase64).toHaveBeenCalledWith(expect.any(Uint8Array));
      
      // Verify the encryption key
      expect(encryptionKey).toBe('encoded-1-2-3');
    });
    
    // Verifies error handling behavior
// Ensures appropriate errors are thrown for invalid inputs
it('should throw error if salt is not available', async () => {
      manager.initialize('test-user-id');
      
      // Don't set keys
      
      await expect(manager.setEncryptionKeyFromPassword('test-password')).rejects.toThrow('Salt not available');
    });
    
    // Verifies should store encryption key in session storage
// Ensures expected behavior in this scenario
it('should store encryption key in session storage', async () => {
      manager.initialize('test-user-id');
      
      manager.setKeys({
        publicKey: 'test-public-key',
        secretKey: 'test-secret-key',
        salt: 'test-salt'
      });
      
      await manager.setEncryptionKeyFromPassword('test-password');
      
      // Check session storage
      const sessionStorageValue = sessionStorage.getItem('moodmash_enc_key');
      expect(sessionStorageValue).toBe('encoded-1-2-3');
    });
  });
  
  // Tests for getencryptionkey functionality
// Validates expected behavior in various scenarios
describe('getEncryptionKey', () => {
    // Verifies the correct return value
// Ensures the function behaves as expected
it('should return null if no encryption key is set', () => {
      manager.initialize('test-user-id');
      
      const encryptionKey = manager.getEncryptionKey();
      
      expect(encryptionKey).toBeNull();
    });
    
    // Verifies the correct return value
// Ensures the function behaves as expected
it('should return encryption key if set', async () => {
      manager.initialize('test-user-id');
      
      manager.setKeys({
        publicKey: 'test-public-key',
        secretKey: 'test-secret-key',
        salt: 'test-salt'
      });
      
      await manager.setEncryptionKeyFromPassword('test-password');
      
      const encryptionKey = manager.getEncryptionKey();
      
      expect(encryptionKey).toBe('encoded-1-2-3');
    });
    
    // Verifies should retrieve encryption key from session storage if not in memory
// Ensures expected behavior in this scenario
it('should retrieve encryption key from session storage if not in memory', async () => {
      manager.initialize('test-user-id');
      
      // Manually set in session storage
      sessionStorage.setItem('moodmash_enc_key', 'session-stored-key');
      
      const encryptionKey = manager.getEncryptionKey();
      
      expect(encryptionKey).toBe('session-stored-key');
    });
  });

  // Tests for clearencryptionkey functionality
// Validates expected behavior in various scenarios
describe('clearEncryptionKey', () => {
    // Verifies should clear encryption key from memory and session storage
// Ensures expected behavior in this scenario
it('should clear encryption key from memory and session storage', async () => {
      manager.initialize('test-user-id');
      
      manager.setKeys({
        publicKey: 'test-public-key',
        secretKey: 'test-secret-key',
        salt: 'test-salt'
      });
      
      await manager.setEncryptionKeyFromPassword('test-password');
      
      // Verify key is set
      expect(manager.getEncryptionKey()).toBe('encoded-1-2-3');
      
      // Clear the key
      manager.clearEncryptionKey();
      
      // Verify key is cleared from memory
      expect(manager.getEncryptionKey()).toBeNull();
      
      // Verify key is cleared from session storage
      expect(sessionStorage.getItem('moodmash_enc_key')).toBeNull();
    });
  });
  
  // Tests for markpublickeyasshared functionality
// Validates expected behavior in various scenarios
describe('markPublicKeyAsShared', () => {
    // Verifies should update metadata to mark key as shared
// Ensures expected behavior in this scenario
it('should update metadata to mark key as shared', () => {
      manager.initialize('test-user-id');
      
      manager.setKeys({
        publicKey: 'test-public-key',
        secretKey: 'test-secret-key',
        salt: 'test-salt'
      });
      
      // Initially not shared
      expect(manager.getMetadata()?.publicKeyShared).toBe(false);
      
      // Mark as shared
      manager.markPublicKeyAsShared();
      
      // Verify it's now marked as shared
      expect(manager.getMetadata()?.publicKeyShared).toBe(true);
    });
    
    // Verifies should do nothing if no metadata exists
// Ensures expected behavior in this scenario
it('should do nothing if no metadata exists', () => {
      manager.initialize('test-user-id');
      
      // Don't set keys, so no metadata
      
      // Call the method
      manager.markPublicKeyAsShared();
      
      // No error should be thrown
    });
  });

  // Tests for clearkeys functionality
// Validates expected behavior in various scenarios
describe('clearKeys', () => {
    // Verifies should clear all keys and metadata from memory and storage
// Ensures expected behavior in this scenario
it('should clear all keys and metadata from memory and storage', async () => {
      manager.initialize('test-user-id');
      
      manager.setKeys({
        publicKey: 'test-public-key',
        secretKey: 'test-secret-key',
        salt: 'test-salt'
      });
      
      await manager.setEncryptionKeyFromPassword('test-password');
      
      // Verify keys and metadata are set
      expect(manager.hasKeys()).toBe(true);
      expect(manager.getMetadata()).not.toBeNull();
      expect(manager.getEncryptionKey()).not.toBeNull();
      
      // Clear the keys
      manager.clearKeys();
      
      // Verify everything is cleared
      expect(manager.hasKeys()).toBe(false);
      expect(manager.getPublicKey()).toBeNull();
      expect(manager.getSecretKey()).toBeNull();
      expect(manager.getMetadata()).toBeNull();
      expect(manager.getEncryptionKey()).toBeNull();
      
      // Verify storage is cleared
      expect(localStorage.getItem('moodmash_keys_test-user-id')).toBeNull();
      expect(sessionStorage.getItem('moodmash_enc_key')).toBeNull();
    });
  });
  
  // Tests for keymanager singleton functionality
// Validates expected behavior in various scenarios
describe('keyManager singleton', () => {
    // Verifies should be defined in browser environment
// Ensures expected behavior in this scenario
it('should be defined in browser environment', () => {
      // Since we're in a browser environment (or mocked one)
      expect(keyManager).not.toBeNull();
    });
  });
  
  // Tests for storepublickeyforuser functionality
// Validates expected behavior in various scenarios
describe('storePublicKeyForUser', () => {
    it('should store another user\'s public key', () => {
      manager.initialize('test-user-id');
      
      manager.storePublicKeyForUser('other-user-id', 'other-user-public-key');
      
      // Verify it's stored
      expect(manager.getPublicKeyForUser('other-user-id')).toBe('other-user-public-key');
    });
  });
  
  // Tests for getpublickeyforuser functionality
// Validates expected behavior in various scenarios
describe('getPublicKeyForUser', () => {
    // Verifies the correct return value
// Ensures the function behaves as expected
it('should return null if no key is stored for user', () => {
      manager.initialize('test-user-id');
      
      expect(manager.getPublicKeyForUser('unknown-user-id')).toBeNull();
    });
    
    // Verifies the correct return value
// Ensures the function behaves as expected
it('should return stored public key for user', () => {
      manager.initialize('test-user-id');
      
      manager.storePublicKeyForUser('other-user-id', 'other-user-public-key');
      
      expect(manager.getPublicKeyForUser('other-user-id')).toBe('other-user-public-key');
    });
  });
}); 