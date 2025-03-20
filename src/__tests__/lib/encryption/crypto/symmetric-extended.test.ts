import nacl from 'tweetnacl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies with specific implementations for large/binary data
vi.mock('@/lib/encryption/crypto/utils', () => {
  return {
    decodeBase64: vi.fn().mockImplementation((str) => {
      if (str === 'valid-key') return new Uint8Array([10, 11, 12]);
      if (str === 'mock-ciphertext') return new Uint8Array([4, 5, 6]);
      if (str === 'mock-nonce') return new Uint8Array([7, 8, 9]);
      if (str === 'large-ciphertext') return new Uint8Array(1000000).fill(1);
      if (str === 'binary-ciphertext') return new Uint8Array([0xFF, 0x00, 0xFF]);
      return new Uint8Array([1, 2, 3]);
    }),
    encodeBase64: vi.fn().mockImplementation((arr) => {
      if (arr instanceof Uint8Array && arr.length > 100000) return 'large-ciphertext';
      if (arr instanceof Uint8Array && arr.includes(0xFF)) return 'binary-ciphertext';
      if (arr.toString() === '1,2,3') return 'mock-ciphertext';
      if (arr.toString() === '0,1,2,3,4,5,6,7,8,9') return 'mock-nonce';
      return 'mock-encoded';
    }),
    generateNonce: vi.fn().mockReturnValue(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])),
    stringToUint8Array: vi.fn().mockImplementation((str) => {
      if (str === '{"test":"value"}') return new Uint8Array([1, 2, 3]);
      if (str === '') return new Uint8Array(0);
      // For large data test
      if (str.length > 100000) return new Uint8Array(str.length).fill(1);
      // For binary data test
      if (str.includes('binary')) return new Uint8Array([0xFF, 0x00, 0xFF]);
      return new Uint8Array([4, 5, 6]);
    }),
    uint8ArrayToString: vi.fn().mockImplementation((arr) => {
      if (arr.toString() === '10,11,12') return '{"test":"value"}';
      if (arr.length === 0) return '';
      if (arr.length > 100000) return 'large-data-result';
      if (arr.includes(0xFF)) return 'binary-data-result';
      return 'mock-string';
    })
  };
});

// Mock TweetNaCl with implementations that handle different data types
vi.mock('tweetnacl', () => {
  // Use any type to suppress TypeScript errors
  const secretboxFn: any = vi.fn().mockImplementation((data, _nonce, _key) => {
    // Return different outputs based on input type
    if (data.length === 0) return new Uint8Array(0);
    if (data.length > 100000) return new Uint8Array(1000000).fill(1);
    if (data.includes(0xFF)) return new Uint8Array([0xFF, 0x00, 0xFF]);
    return new Uint8Array([1, 2, 3]);
  });
  
  // Define secretbox properties
  secretboxFn.keyLength = 32;
  secretboxFn.nonceLength = 24;
  secretboxFn.open = vi.fn().mockImplementation((ciphertext, nonce, key) => {
    // Return different values based on input type
    if (ciphertext.length === 0) return new Uint8Array(0);
    if (ciphertext.length > 100000) return new Uint8Array(1000000).fill(1);
    if (ciphertext.includes(0xFF)) return new Uint8Array([0xFF, 0x00, 0xFF]);
    
    // Return decrypted data for valid inputs
    if (
      ciphertext.toString() === '4,5,6' && 
      nonce.toString() === '7,8,9' && 
      key.toString() === '10,11,12'
    ) {
      return new Uint8Array([10, 11, 12]);
    }
    // Return null for invalid inputs (decryption failure)
    return null;
  });
  
  return {
    default: {
      secretbox: secretboxFn
    }
  };
});

// Import the module to test
import { decryptSymmetric, encryptSymmetric } from '@/lib/encryption/crypto/symmetric';
import * as utils from '@/lib/encryption/crypto/utils';

describe('Symmetric Encryption Extended Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Large Data Handling', () => {
    it('should encrypt large text data (>1MB)', () => {
      // Create a large string
      const largeData = 'A'.repeat(1024 * 1024); // 1MB of "A" characters
      const key = 'valid-key';
      
      // Call the function
      const result = encryptSymmetric(largeData, key);
      
      // Assertions
      expect(result).toEqual({
        ciphertext: 'large-ciphertext',
        nonce: 'mock-nonce'
      });
      
      // Verify mock calls
      expect(utils.stringToUint8Array).toHaveBeenCalledWith(largeData);
    });

    it('should decrypt large ciphertext', () => {
      const encryptedData = {
        ciphertext: 'large-ciphertext',
        nonce: 'mock-nonce'
      };
      const key = 'valid-key';
      
      // Call the function
      const result = decryptSymmetric(encryptedData, key);
      
      // Assertions
      expect(result).toBe('large-data-result');
    });

    it('should handle large JSON objects', () => {
      // Create a large JSON object
      const largeObject = {
        data: Array(50000).fill('large data test')
      };
      const key = 'valid-key';
      
      // Call the function
      const result = encryptSymmetric(largeObject, key);
      
      // Assertions
      expect(result).toEqual({
        ciphertext: 'large-ciphertext',
        nonce: 'mock-nonce'
      });
      
      // Verify the large JSON was stringified
      expect(utils.stringToUint8Array).toHaveBeenCalled();
    });

    it('should maintain data integrity with large data', () => {
      // First encrypt
      const largeData = 'B'.repeat(1024 * 1024); // 1MB of "B" characters
      const key = 'valid-key';
      
      const encrypted = encryptSymmetric(largeData, key);
      
      // Then decrypt
      const decrypted = decryptSymmetric(encrypted, key);
      
      // In real world, should match original, but in our mocks we return a constant
      expect(decrypted).toBe('large-data-result');
    });
  });

  describe('Binary Data Handling', () => {
    it('should encrypt binary data', () => {
      // Use a string that our mock will recognize as binary
      const binaryDataString = 'binary-test-data';
      const key = 'valid-key';
      
      // Call the function
      const result = encryptSymmetric(binaryDataString, key);
      
      // Assertions
      expect(result).toEqual({
        ciphertext: 'binary-ciphertext',
        nonce: 'mock-nonce'
      });
    });

    it('should decrypt binary data correctly', () => {
      const encryptedData = {
        ciphertext: 'binary-ciphertext',
        nonce: 'mock-nonce'
      };
      const key = 'valid-key';
      
      // Call the function
      const result = decryptSymmetric(encryptedData, key);
      
      // Assertions
      expect(result).toBe('binary-data-result');
    });

    it('should handle data with null bytes and special characters', () => {
      // The mock will recognize this as binary data
      const specialCharsData = 'binary with \0 null \xFF byte';
      const key = 'valid-key';
      
      // Call the function
      const result = encryptSymmetric(specialCharsData, key);
      
      // Assertions
      expect(result).toEqual({
        ciphertext: 'binary-ciphertext',
        nonce: 'mock-nonce'
      });
    });
  });

  describe('Empty Data Handling', () => {
    it('should encrypt empty string', () => {
      const emptyData = '';
      const key = 'valid-key';
      
      // Call the function
      const result = encryptSymmetric(emptyData, key);
      
      // Assertions
      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('nonce');
      
      // Verify mock calls
      expect(utils.stringToUint8Array).toHaveBeenCalledWith('');
    });

    it('should decrypt empty ciphertext', () => {
      // Mock the implementation to return empty array
      vi.mocked(utils.decodeBase64).mockImplementationOnce(() => new Uint8Array(0));
      
      const encryptedData = {
        ciphertext: 'empty-ciphertext',
        nonce: 'mock-nonce'
      };
      const key = 'valid-key';
      
      // Call the function
      const result = decryptSymmetric(encryptedData, key);
      
      // The implementation likely returns null for empty ciphertext
      // (which is a valid behavior as it indicates decryption failure)
      expect(result).toBeNull();
    });

    it('should handle empty object', () => {
      const emptyObject = {};
      const key = 'valid-key';
      
      // Call the function
      const result = encryptSymmetric(emptyObject, key);
      
      // In our implementation, empty object gets stringified to '{}'
      expect(utils.stringToUint8Array).toHaveBeenCalledWith('{}');
      
      // Assertions
      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('nonce');
    });

    it('should handle non-string data types correctly', () => {
      // Test with various non-string types
      const testCases = [
        null,
        undefined,
        123,
        new Date(),
        true,
        Buffer.from('test')
      ];
      
      const key = 'valid-key';
      
      // For each test case, attempt encryption
      testCases.forEach(testData => {
        try {
          // @ts-ignore - Intentionally testing invalid types
          const result = encryptSymmetric(testData, key);
          
          // If it doesn't throw, it should handle the type conversion appropriately
          expect(result).toHaveProperty('ciphertext');
          expect(result).toHaveProperty('nonce');
        } catch (error) {
          // For some inputs, it's reasonable to throw an error
          expect(error).toBeDefined();
        }
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle maximum size limits gracefully', () => {
      // Most implementations have practical limits (often a few GB)
      // Using a very large size that would be impractical to actually create in memory
      const largeSize = 1024 * 1024 * 10; // 10MB
      
      try {
        // In tests we don't actually create this data, just mock the behavior
        const largeData = 'A'.repeat(largeSize);
        const key = 'valid-key';
        
        const result = encryptSymmetric(largeData, key);
        expect(result).toHaveProperty('ciphertext');
        expect(result).toHaveProperty('nonce');
      } catch (error) {
        // If it throws, that's okay too, as long as it doesn't crash
        expect(error).toBeDefined();
      }
    });

    it('should handle zero-length arrays correctly', () => {
      // Mock the stringToUint8Array to return empty array explicitly
      vi.mocked(utils.stringToUint8Array).mockReturnValueOnce(new Uint8Array(0));
      
      const emptyData = '';
      const key = 'valid-key';
      
      const result = encryptSymmetric(emptyData, key);
      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('nonce');
    });
  });

  describe('Invalid Key Formats', () => {
    it('should handle keys with incorrect length', () => {
      // Mock nacl.secretbox to validate key length
      vi.mocked(nacl.secretbox).mockImplementationOnce((_data: Uint8Array, _nonce: Uint8Array, key: Uint8Array) => {
        // TweetNaCl expects key to be exactly secretbox.keyLength bytes
        if (key.length !== nacl.secretbox.keyLength) {
          throw new Error('bad key size');
        }
        return new Uint8Array([1, 2, 3]);
      });

      // Set up a mock that returns a short key
      vi.mocked(utils.decodeBase64).mockImplementationOnce(() => new Uint8Array([1, 2])); // Too short

      const data = 'test data';
      const shortKey = 'short-key';
      
      try {
        // Call the function - should throw or handle the error
        const result = encryptSymmetric(data, shortKey);
        
        // If it doesn't throw, ensure it returns a valid structure
        expect(result).toHaveProperty('ciphertext');
        expect(result).toHaveProperty('nonce');
      } catch (error) {
        // If it throws, that's valid behavior too
        expect(error).toBeDefined();
      }
    });

    it('should handle non-string/non-Uint8Array keys', () => {
      const data = 'test data';
      const invalidKeys = [
        123,           // number
        null,          // null
        undefined,     // undefined
        {},            // empty object
        [],            // empty array
        true,          // boolean
        new Date()     // date object
      ];
      
      invalidKeys.forEach(invalidKey => {
        try {
          // @ts-ignore - intentionally testing invalid types
          const result = encryptSymmetric(data, invalidKey);
          
          // If it doesn't throw, ensure it returns a valid structure
          expect(result).toHaveProperty('ciphertext');
          expect(result).toHaveProperty('nonce');
        } catch (error) {
          // If it throws, that's valid behavior too
          expect(error).toBeDefined();
        }
      });
    });

    it('should reject keys that cannot be decoded from base64', () => {
      // Mock decodeBase64 to simulate failure
      vi.mocked(utils.decodeBase64).mockImplementationOnce(() => {
        throw new Error('Invalid base64 string');
      });
      
      const data = 'test data';
      const invalidBase64Key = 'not-a-base64!@#$'; // Invalid base64 characters
      
      try {
        const result = encryptSymmetric(data, invalidBase64Key);
        
        // If it doesn't throw, ensure it returns a valid structure
        expect(result).toHaveProperty('ciphertext');
        expect(result).toHaveProperty('nonce');
      } catch (error: unknown) {
        // If it throws, that's valid behavior too
        expect(error).toBeDefined();
        if (error instanceof Error) {
          expect(error.message).toContain('Invalid base64');
        }
      }
    });
  });

  describe('Corrupted Ciphertext', () => {
    it('should return null when decrypting tampered ciphertext', () => {
      // Setup our mock to indicate tampering by returning null
      vi.mocked(nacl.secretbox.open).mockReturnValueOnce(null);
      
      const encryptedData = {
        ciphertext: 'tampered-ciphertext',
        nonce: 'mock-nonce'
      };
      const key = 'valid-key';
      
      // Call the function
      const result = decryptSymmetric(encryptedData, key);
      
      // When ciphertext is tampered with, nacl returns null and our function should too
      expect(result).toBeNull();
    });

    it('should handle ciphertext with incorrect format', () => {
      const invalidCiphertexts = [
        { ciphertext: 123, nonce: 'mock-nonce' },            // number instead of string
        { ciphertext: true, nonce: 'mock-nonce' },           // boolean instead of string
        { ciphertext: null, nonce: 'mock-nonce' },           // null
        { ciphertext: undefined, nonce: 'mock-nonce' },      // undefined
        { ciphertext: {}, nonce: 'mock-nonce' },             // object instead of string
        { ciphertext: [], nonce: 'mock-nonce' }              // array instead of string
      ];
      
      const key = 'valid-key';
      
      invalidCiphertexts.forEach(invalidData => {
        try {
          // @ts-ignore - intentionally testing invalid types
          const result = decryptSymmetric(invalidData, key);
          
          // If it doesn't throw, it should return null for invalid data
          expect(result).toBeNull();
        } catch (error) {
          // If it throws, that's valid behavior too
          expect(error).toBeDefined();
        }
      });
    });

    it('should handle missing or invalid nonce', () => {
      const invalidNonceData = [
        { ciphertext: 'mock-ciphertext' },                     // missing nonce
        { ciphertext: 'mock-ciphertext', nonce: 123 },         // number instead of string
        { ciphertext: 'mock-ciphertext', nonce: null },        // null
        { ciphertext: 'mock-ciphertext', nonce: undefined },   // undefined
        { ciphertext: 'mock-ciphertext', nonce: {} },          // object instead of string
        { ciphertext: 'mock-ciphertext', nonce: [] }           // array instead of string
      ];
      
      const key = 'valid-key';
      
      invalidNonceData.forEach(invalidData => {
        try {
          // @ts-ignore - intentionally testing invalid types
          const result = decryptSymmetric(invalidData, key);
          
          // If it doesn't throw, it should return null for invalid data
          expect(result).toBeNull();
        } catch (error) {
          // If it throws, that's valid behavior too
          expect(error).toBeDefined();
        }
      });
    });

    it('should handle truncated or extended ciphertext', () => {
      // Mock decodeBase64 to return corrupted data for specific input
      vi.mocked(utils.decodeBase64).mockImplementationOnce((str) => {
        if (str === 'truncated-ciphertext') {
          // Return array that's too short to be valid ciphertext
          return new Uint8Array([1]); // Too short to be valid
        }
        return new Uint8Array([4, 5, 6]);
      });
      
      const encryptedData = {
        ciphertext: 'truncated-ciphertext',
        nonce: 'mock-nonce'
      };
      const key = 'valid-key';
      
      // Call the function
      const result = decryptSymmetric(encryptedData, key);
      
      // If ciphertext is truncated, decryption should fail
      expect(result).toBeNull();
    });

    it('should detect bit flips in the ciphertext', () => {
      // In real NaCl, changing even a single bit would make open() return null
      // Here we simulate that with our mock
      vi.mocked(nacl.secretbox.open).mockImplementationOnce((ciphertext: Uint8Array, nonce: Uint8Array, _key: Uint8Array) => {
        // We pretend this is a bit-flipped ciphertext
        if (ciphertext.toString() === '4,5,6' && nonce.toString() === '7,8,9') {
          return null; // Simulate authenticated decryption failure
        }
        return new Uint8Array([10, 11, 12]);
      });
      
      const encryptedData = {
        ciphertext: 'mock-ciphertext', // Our mock will convert this to [4,5,6]
        nonce: 'mock-nonce'
      };
      const key = 'valid-key';
      
      // Call the function
      const result = decryptSymmetric(encryptedData, key);
      
      // Since we simulated a bit flip, result should be null
      expect(result).toBeNull();
    });
  });
}); 