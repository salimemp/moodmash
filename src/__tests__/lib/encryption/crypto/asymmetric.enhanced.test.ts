/**
 * Enhanced Test Suite for Asymmetric Encryption
 * 
 * These tests provide additional coverage for the asymmetric encryption module
 * by testing real encryption/decryption without mocks and verifying cryptographic
 * properties that are essential for security.
 */

import {
    decryptAsymmetric,
    encryptAsymmetric,
    generateKeyPair
} from '@/lib/encryption/crypto/asymmetric';
import { EncryptedData } from '@/lib/encryption/crypto/types';
import { encodeBase64 } from '@/lib/encryption/crypto/utils';
import { describe, expect, it } from 'vitest';

describe('Asymmetric Encryption (Enhanced Tests)', () => {
  /**
   * This section tests real encryption/decryption without mocks
   * to ensure the actual cryptographic operations work as expected
   */
  describe('Real Encryption and Decryption', () => {
    it('should successfully encrypt and decrypt data with generated keys', () => {
      // Generate key pairs for both parties
      const aliceKeys = generateKeyPair();
      const bobKeys = generateKeyPair();
      
      // Data to encrypt
      const originalData = { message: 'Secret message', timestamp: Date.now() };
      
      // Alice encrypts message for Bob
      const encrypted = encryptAsymmetric(
        originalData,
        bobKeys.publicKey,  // Bob's public key (recipient)
        aliceKeys.secretKey // Alice's secret key (sender)
      );
      
      // Verify the encrypted data structure
      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('nonce');
      expect(encrypted).toHaveProperty('publicKey');
      
      // Bob decrypts message from Alice
      const decrypted = decryptAsymmetric(
        encrypted,
        bobKeys.secretKey,  // Bob's secret key (recipient)
        // Alice's public key is included in the encrypted data
      );
      
      // Parse the decrypted JSON string back to an object
      const decryptedObj = JSON.parse(decrypted as string);
      
      // Verify the decryption worked correctly
      expect(decryptedObj).toEqual(originalData);
    });

    it('should handle string format keys for real encryption/decryption', () => {
      // Generate key pairs
      const senderKeys = generateKeyPair();
      const recipientKeys = generateKeyPair();
      
      // Convert keys to Base64 strings
      const senderSecretKeyBase64 = encodeBase64(senderKeys.secretKey);
      const recipientPublicKeyBase64 = encodeBase64(recipientKeys.publicKey);
      const recipientSecretKeyBase64 = encodeBase64(recipientKeys.secretKey);
      
      // Encrypt data using string format keys
      const data = "This is a test message";
      const encrypted = encryptAsymmetric(
        data,
        recipientPublicKeyBase64,
        senderSecretKeyBase64
      );
      
      // Decrypt data using string format keys
      const decrypted = decryptAsymmetric(
        encrypted,
        recipientSecretKeyBase64
      );
      
      // Verify original data is recovered
      expect(decrypted).toBe(data);
    });

    it('should fail to decrypt with wrong recipient key', () => {
      // Generate key pairs
      const senderKeys = generateKeyPair();
      const correctRecipientKeys = generateKeyPair();
      const wrongRecipientKeys = generateKeyPair();
      
      // Encrypt data for the correct recipient
      const data = "Secret data";
      const encrypted = encryptAsymmetric(
        data,
        correctRecipientKeys.publicKey,
        senderKeys.secretKey
      );
      
      // Try to decrypt with wrong recipient's private key
      const decrypted = decryptAsymmetric(
        encrypted,
        wrongRecipientKeys.secretKey
      );
      
      // Decryption should fail
      expect(decrypted).toBeNull();
    });

    it('should handle decryption with Uint8Array public key parameter', () => {
      // Generate key pairs
      const senderKeys = generateKeyPair();
      const recipientKeys = generateKeyPair();
      
      // Encrypt data with predefined keys
      const data = "Test with Uint8Array public key";
      
      // Create an encrypted data object without the public key in it
      const encrypted = encryptAsymmetric(data, recipientKeys.publicKey, senderKeys.secretKey);
      const encryptedWithoutPublicKey: EncryptedData = {
        ciphertext: encrypted.ciphertext,
        nonce: encrypted.nonce
        // Deliberately omit publicKey
      };
      
      // Decrypt with the sender's public key as a Uint8Array
      const decrypted = decryptAsymmetric(
        encryptedWithoutPublicKey,
        recipientKeys.secretKey,
        senderKeys.publicKey // Pass as Uint8Array
      );
      
      // Verify original data is recovered
      expect(decrypted).toBe(data);
    });
  });

  /**
   * This section tests cryptographic properties essential for security
   */
  describe('Cryptographic Properties', () => {
    it('should generate unique key pairs each time', () => {
      // Generate multiple key pairs
      const keyPair1 = generateKeyPair();
      const keyPair2 = generateKeyPair();
      const keyPair3 = generateKeyPair();
      
      // Ensure public keys are different
      expect(encodeBase64(keyPair1.publicKey)).not.toBe(encodeBase64(keyPair2.publicKey));
      expect(encodeBase64(keyPair1.publicKey)).not.toBe(encodeBase64(keyPair3.publicKey));
      expect(encodeBase64(keyPair2.publicKey)).not.toBe(encodeBase64(keyPair3.publicKey));
      
      // Ensure secret keys are different
      expect(encodeBase64(keyPair1.secretKey)).not.toBe(encodeBase64(keyPair2.secretKey));
      expect(encodeBase64(keyPair1.secretKey)).not.toBe(encodeBase64(keyPair3.secretKey));
      expect(encodeBase64(keyPair2.secretKey)).not.toBe(encodeBase64(keyPair3.secretKey));
    });

    it('should generate different ciphertexts for same plaintext with different nonces', () => {
      // Generate keys
      const senderKeys = generateKeyPair();
      const recipientKeys = generateKeyPair();
      
      // Encrypt the same data twice
      const data = "Same plaintext";
      const encrypted1 = encryptAsymmetric(
        data,
        recipientKeys.publicKey,
        senderKeys.secretKey
      );
      
      const encrypted2 = encryptAsymmetric(
        data,
        recipientKeys.publicKey,
        senderKeys.secretKey
      );
      
      // Verify ciphertexts are different
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      // Verify nonces are different
      expect(encrypted1.nonce).not.toBe(encrypted2.nonce);
    });

    it('should generate keys with correct lengths', () => {
      const keyPair = generateKeyPair();
      
      // Verify key lengths (32 bytes for both public and secret keys in NaCl box)
      expect(keyPair.publicKey.length).toBe(32);
      expect(keyPair.secretKey.length).toBe(32);
    });
  });

  /**
   * This section tests error handling and edge cases
   */
  describe('Error Handling and Edge Cases', () => {
    it('should handle encryption of very large data', () => {
      // Generate a large string (100KB)
      const largeData = 'A'.repeat(100 * 1024);
      
      // Generate keys
      const senderKeys = generateKeyPair();
      const recipientKeys = generateKeyPair();
      
      // Encrypt large data
      const encrypted = encryptAsymmetric(
        largeData,
        recipientKeys.publicKey,
        senderKeys.secretKey
      );
      
      // Decrypt large data
      const decrypted = decryptAsymmetric(
        encrypted,
        recipientKeys.secretKey
      );
      
      // Verify original data is recovered
      expect(decrypted).toBe(largeData);
    });

    it('should handle special characters in data', () => {
      // Data with special characters
      const specialData = '!@#$%^&*()_+{}[]|:;"\'<>,.?/éñçßàüö中文日本語한국어';
      
      // Generate keys
      const senderKeys = generateKeyPair();
      const recipientKeys = generateKeyPair();
      
      // Encrypt data with special characters
      const encrypted = encryptAsymmetric(
        specialData,
        recipientKeys.publicKey,
        senderKeys.secretKey
      );
      
      // Decrypt data
      const decrypted = decryptAsymmetric(
        encrypted,
        recipientKeys.secretKey
      );
      
      // Verify original data is recovered
      expect(decrypted).toBe(specialData);
    });

    it('should handle missing fields in encrypted data object gracefully', () => {
      // Create incomplete encrypted data objects
      const missingCiphertext: Partial<EncryptedData> = {
        nonce: 'some-nonce',
        publicKey: 'some-public-key'
      };
      
      const missingNonce: Partial<EncryptedData> = {
        ciphertext: 'some-ciphertext',
        publicKey: 'some-public-key'
      };
      
      // Generate keys
      const recipientKeys = generateKeyPair();
      
      // Attempt to decrypt with missing ciphertext
      expect(() => {
        decryptAsymmetric(
          missingCiphertext as EncryptedData,
          recipientKeys.secretKey
        );
      }).toThrow();
      
      // Attempt to decrypt with missing nonce
      expect(() => {
        decryptAsymmetric(
          missingNonce as EncryptedData,
          recipientKeys.secretKey
        );
      }).toThrow();
    });

    it('should handle malformed keys gracefully', () => {
      // Create valid encrypted data
      const senderKeys = generateKeyPair();
      const recipientKeys = generateKeyPair();
      
      const data = "Test message";
      const encrypted = encryptAsymmetric(
        data,
        recipientKeys.publicKey,
        senderKeys.secretKey
      );
      
      // Create truncated key
      const truncatedKey = recipientKeys.secretKey.slice(0, 16);
      
      // Attempt to decrypt with truncated key
      expect(() => {
        decryptAsymmetric(
          encrypted,
          truncatedKey
        );
      }).toThrow();
    });
  });
}); 