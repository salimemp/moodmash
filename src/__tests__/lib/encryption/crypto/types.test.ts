import {
    createEncryptedData,
    createEncryptedMessage,
    createUserKeys,
    createUserPreferences,
    isValidUserPreferences,
    validateMetadataValue
} from '@/lib/encryption/crypto/type-helpers';
import type {
    EncryptedData,
    EncryptedMessage,
    MetadataValue,
    UserKeys,
    UserPreferences
} from '@/lib/encryption/crypto/types';
import { describe, expect, it } from 'vitest';

describe('Crypto Types', () => {
  describe('MetadataValue', () => {
    it('should accept string values', () => {
      const value: MetadataValue = 'test string';
      expect(typeof value).toBe('string');
      expect(validateMetadataValue(value)).toBe(true);
    });

    it('should accept number values', () => {
      const value: MetadataValue = 42;
      expect(typeof value).toBe('number');
      expect(validateMetadataValue(value)).toBe(true);
    });

    it('should accept boolean values', () => {
      const value: MetadataValue = true;
      expect(typeof value).toBe('boolean');
      expect(validateMetadataValue(value)).toBe(true);
    });

    it('should accept null values', () => {
      const value: MetadataValue = null;
      expect(value).toBeNull();
      expect(validateMetadataValue(value)).toBe(true);
    });

    it('should accept object values with MetadataValue properties', () => {
      const value: MetadataValue = {
        string: 'test',
        number: 123,
        boolean: true,
        null: null,
        nested: {
          value: 'nested value'
        }
      };
      expect(value).toEqual({
        string: 'test',
        number: 123,
        boolean: true,
        null: null,
        nested: {
          value: 'nested value'
        }
      });
      expect(validateMetadataValue(value)).toBe(true);
    });

    it('should accept array values of MetadataValue', () => {
      const value: MetadataValue = ['test', 123, true, null, { key: 'value' }];
      expect(Array.isArray(value)).toBe(true);
      expect(value).toEqual(['test', 123, true, null, { key: 'value' }]);
      expect(validateMetadataValue(value)).toBe(true);
    });

    it('should reject values that are not valid MetadataValue', () => {
      expect(validateMetadataValue(undefined)).toBe(false);
      expect(validateMetadataValue(Symbol('test'))).toBe(false);
      expect(validateMetadataValue(function() {})).toBe(false);
      expect(validateMetadataValue(BigInt(123))).toBe(false);
    });

    it('should reject arrays containing invalid elements', () => {
      expect(validateMetadataValue(['valid', undefined])).toBe(false);
      expect(validateMetadataValue([123, function() {}])).toBe(false);
    });

    it('should reject objects containing invalid properties', () => {
      expect(validateMetadataValue({ valid: 'string', invalid: undefined })).toBe(false);
      expect(validateMetadataValue({ valid: 123, invalid: function() {} })).toBe(false);
    });
  });

  describe('UserPreferences', () => {
    it('should create valid user preferences', () => {
      const preferences: UserPreferences = {
        theme: 'dark',
        language: 'en',
        notifications: true,
        privacy: {
          profileVisibility: 'friends',
          messagePrivacy: 'anyone'
        },
        customSetting: 'custom value'
      };

      expect(preferences.theme).toBe('dark');
      expect(preferences.language).toBe('en');
      expect(preferences.notifications).toBe(true);
      expect(preferences.privacy?.profileVisibility).toBe('friends');
      expect(preferences.privacy?.messagePrivacy).toBe('anyone');
      expect(preferences.customSetting).toBe('custom value');
      expect(isValidUserPreferences(preferences)).toBe(true);
    });

    it('should allow partial preferences', () => {
      const preferences: UserPreferences = {
        theme: 'light'
      };
      
      expect(preferences.theme).toBe('light');
      expect(preferences.language).toBeUndefined();
      expect(preferences.notifications).toBeUndefined();
      expect(preferences.privacy).toBeUndefined();
      expect(isValidUserPreferences(preferences)).toBe(true);
    });

    it('should allow empty preferences', () => {
      const preferences: UserPreferences = {};
      expect(Object.keys(preferences).length).toBe(0);
      expect(isValidUserPreferences(preferences)).toBe(true);
    });

    it('should support nested complex MetadataValue', () => {
      const preferences: UserPreferences = {
        complexSetting: {
          array: [1, 2, 'three'],
          nested: {
            value: true
          }
        }
      };
      
      expect(preferences.complexSetting).toEqual({
        array: [1, 2, 'three'],
        nested: {
          value: true
        }
      });
      expect(isValidUserPreferences(preferences)).toBe(true);
    });

    it('should validate invalid user preferences', () => {
      expect(isValidUserPreferences(null)).toBe(false);
      expect(isValidUserPreferences('not an object')).toBe(false);
      expect(isValidUserPreferences({ theme: 123 })).toBe(false); // theme should be string
      expect(isValidUserPreferences({ notifications: 'yes' })).toBe(false); // notifications should be boolean
      expect(isValidUserPreferences({ privacy: 'public' })).toBe(false); // privacy should be object
      expect(isValidUserPreferences({ 
        privacy: { 
          profileVisibility: 'invalid' 
        } 
      })).toBe(false); // invalid profileVisibility
      expect(isValidUserPreferences({ 
        privacy: { 
          messagePrivacy: 'invalid' 
        } 
      })).toBe(false); // invalid messagePrivacy
      
      // Test custom property with invalid MetadataValue
      expect(isValidUserPreferences({
        customSetting: undefined // undefined is not a valid MetadataValue
      })).toBe(false);
    });

    it('should create user preferences with defaults using helper', () => {
      const preferences = createUserPreferences();
      expect(preferences.theme).toBe('light');
      expect(preferences.language).toBe('en');
      expect(preferences.notifications).toBe(true);
      expect(preferences.privacy?.profileVisibility).toBe('public');
      expect(preferences.privacy?.messagePrivacy).toBe('friends');
    });

    it('should override defaults in helper', () => {
      const preferences = createUserPreferences({
        theme: 'dark',
        notifications: false
      });
      expect(preferences.theme).toBe('dark');
      expect(preferences.language).toBe('en'); // default
      expect(preferences.notifications).toBe(false); // overridden
      expect(preferences.privacy?.profileVisibility).toBe('public'); // default
    });
  });

  describe('EncryptedData', () => {
    it('should create valid encrypted data', () => {
      const data: EncryptedData = {
        ciphertext: 'base64encodedstring',
        nonce: 'base64encodednonce'
      };
      
      expect(data.ciphertext).toBe('base64encodedstring');
      expect(data.nonce).toBe('base64encodednonce');
      expect(data.publicKey).toBeUndefined();
    });

    it('should allow optional publicKey', () => {
      const data: EncryptedData = {
        ciphertext: 'base64encodedstring',
        nonce: 'base64encodednonce',
        publicKey: 'base64encodedpublickey'
      };
      
      expect(data.ciphertext).toBe('base64encodedstring');
      expect(data.nonce).toBe('base64encodednonce');
      expect(data.publicKey).toBe('base64encodedpublickey');
    });

    it('should create encrypted data with defaults using helper', () => {
      const data = createEncryptedData();
      expect(data.ciphertext).toBe('base64encodedciphertext');
      expect(data.nonce).toBe('base64encodednonce');
      expect(data.publicKey).toBeUndefined();
    });

    it('should override defaults in helper', () => {
      const data = createEncryptedData({
        ciphertext: 'custom-ciphertext',
        publicKey: 'custom-publickey'
      });
      expect(data.ciphertext).toBe('custom-ciphertext');
      expect(data.nonce).toBe('base64encodednonce'); // default
      expect(data.publicKey).toBe('custom-publickey'); // overridden
    });
  });

  describe('UserKeys', () => {
    it('should create valid user keys', () => {
      const keys: UserKeys = {
        publicKey: 'base64encodedpublickey',
        secretKey: 'base64encodedsecretkey',
        salt: 'base64encodedsalt'
      };
      
      expect(keys.publicKey).toBe('base64encodedpublickey');
      expect(keys.secretKey).toBe('base64encodedsecretkey');
      expect(keys.salt).toBe('base64encodedsalt');
    });

    it('should create user keys with defaults using helper', () => {
      const keys = createUserKeys();
      expect(keys.publicKey).toBe('base64encodedpublickey');
      expect(keys.secretKey).toBe('base64encodedsecretkey');
      expect(keys.salt).toBe('base64encodedsalt');
    });

    it('should override defaults in helper', () => {
      const keys = createUserKeys({
        publicKey: 'custom-publickey',
        salt: 'custom-salt'
      });
      expect(keys.publicKey).toBe('custom-publickey');
      expect(keys.secretKey).toBe('base64encodedsecretkey'); // default
      expect(keys.salt).toBe('custom-salt'); // overridden
    });
  });

  describe('EncryptedMessage', () => {
    it('should create valid encrypted message', () => {
      const message: EncryptedMessage = {
        ciphertext: 'base64encodedstring',
        nonce: 'base64encodednonce',
        sender: 'user1',
        recipient: 'user2',
        timestamp: 1629301200000
      };
      
      expect(message.ciphertext).toBe('base64encodedstring');
      expect(message.nonce).toBe('base64encodednonce');
      expect(message.sender).toBe('user1');
      expect(message.recipient).toBe('user2');
      expect(message.timestamp).toBe(1629301200000);
      expect(message.metadata).toBeUndefined();
    });

    it('should allow metadata with type and additional fields', () => {
      const message: EncryptedMessage = {
        ciphertext: 'base64encodedstring',
        nonce: 'base64encodednonce',
        sender: 'user1',
        recipient: 'user2',
        timestamp: 1629301200000,
        metadata: {
          type: 'text',
          isRead: false,
          priority: 'high',
          attachments: [
            { name: 'file1.pdf', size: 1024 }
          ]
        }
      };
      
      expect(message.metadata?.type).toBe('text');
      expect(message.metadata?.isRead).toBe(false);
      expect(message.metadata?.priority).toBe('high');
      expect(message.metadata?.attachments).toEqual([
        { name: 'file1.pdf', size: 1024 }
      ]);
    });

    it('should inherit properties from EncryptedData', () => {
      const data: EncryptedData = {
        ciphertext: 'encrypted',
        nonce: 'nonce123',
        publicKey: 'pubkey123'
      };
      
      const message: EncryptedMessage = {
        ...data,
        sender: 'user1',
        recipient: 'user2',
        timestamp: 1629301200000
      };
      
      expect(message.ciphertext).toBe('encrypted');
      expect(message.nonce).toBe('nonce123');
      expect(message.publicKey).toBe('pubkey123');
    });

    it('should create encrypted message with defaults using helper', () => {
      const now = Date.now();
      const message = createEncryptedMessage();
      expect(message.ciphertext).toBe('base64encodedciphertext');
      expect(message.nonce).toBe('base64encodednonce');
      expect(message.sender).toBe('user1');
      expect(message.recipient).toBe('user2');
      expect(message.timestamp).toBeGreaterThanOrEqual(now);
      expect(message.metadata).toBeUndefined();
    });

    it('should override defaults in helper', () => {
      const message = createEncryptedMessage({
        ciphertext: 'custom-ciphertext',
        sender: 'custom-sender',
        timestamp: 123456789,
        metadata: {
          type: 'custom-type',
          priority: 'low'
        }
      });
      expect(message.ciphertext).toBe('custom-ciphertext');
      expect(message.nonce).toBe('base64encodednonce'); // default
      expect(message.sender).toBe('custom-sender'); // overridden
      expect(message.recipient).toBe('user2'); // default
      expect(message.timestamp).toBe(123456789); // overridden
      expect(message.metadata?.type).toBe('custom-type');
      expect(message.metadata?.priority).toBe('low');
    });
  });
}); 