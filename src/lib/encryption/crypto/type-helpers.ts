import type {
    EncryptedData,
    EncryptedMessage,
    MetadataValue,
    UserKeys,
    UserPreferences
} from './types';

/**
 * Helper functions to create instances of types
 * These exist purely to make the types testable for coverage purposes
 */

// MetadataValue validator
export function validateMetadataValue(value: unknown): value is MetadataValue {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(item => validateMetadataValue(item));
  }

  if (typeof value === 'object' && value !== null) {
    return Object.values(value).every(item => validateMetadataValue(item));
  }

  return false;
}

// Create a user preferences object
export function createUserPreferences(data: Partial<UserPreferences> = {}): UserPreferences {
  return {
    theme: data.theme || 'light',
    language: data.language || 'en',
    notifications: data.notifications !== undefined ? data.notifications : true,
    privacy: data.privacy || {
      profileVisibility: 'public',
      messagePrivacy: 'friends'
    },
    ...data
  };
}

// Create encrypted data
export function createEncryptedData(data: Partial<EncryptedData> = {}): EncryptedData {
  return {
    ciphertext: data.ciphertext || 'base64encodedciphertext',
    nonce: data.nonce || 'base64encodednonce',
    publicKey: data.publicKey
  };
}

// Create user keys
export function createUserKeys(data: Partial<UserKeys> = {}): UserKeys {
  return {
    publicKey: data.publicKey || 'base64encodedpublickey',
    secretKey: data.secretKey || 'base64encodedsecretkey',
    salt: data.salt || 'base64encodedsalt'
  };
}

// Create encrypted message
export function createEncryptedMessage(data: Partial<EncryptedMessage> = {}): EncryptedMessage {
  const baseData = createEncryptedData({
    ciphertext: data.ciphertext,
    nonce: data.nonce,
    publicKey: data.publicKey
  });
  
  return {
    ...baseData,
    sender: data.sender || 'user1',
    recipient: data.recipient || 'user2',
    timestamp: data.timestamp || Date.now(),
    metadata: data.metadata
  };
}

// Validate if an object conforms to UserPreferences interface
export function isValidUserPreferences(obj: unknown): obj is UserPreferences {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const prefs = obj as Record<string, unknown>;
  
  // Check optional known properties are of correct type
  if (prefs.theme !== undefined && typeof prefs.theme !== 'string') return false;
  if (prefs.language !== undefined && typeof prefs.language !== 'string') return false;
  if (prefs.notifications !== undefined && typeof prefs.notifications !== 'boolean') return false;
  
  // Check privacy object if it exists
  if (prefs.privacy !== undefined) {
    if (typeof prefs.privacy !== 'object' || prefs.privacy === null) return false;
    
    const privacy = prefs.privacy as Record<string, unknown>;
    
    const validProfileVisibilities = ['public', 'private', 'friends'];
    if (
      privacy.profileVisibility !== undefined && 
      (typeof privacy.profileVisibility !== 'string' || 
       !validProfileVisibilities.includes(privacy.profileVisibility))
    ) {
      return false;
    }
    
    const validMessagePrivacies = ['anyone', 'friends', 'none'];
    if (
      privacy.messagePrivacy !== undefined && 
      (typeof privacy.messagePrivacy !== 'string' || 
       !validMessagePrivacies.includes(privacy.messagePrivacy))
    ) {
      return false;
    }
  }
  
  // All custom properties should be valid MetadataValues
  const knownProps = ['theme', 'language', 'notifications', 'privacy'];
  for (const [key, value] of Object.entries(prefs)) {
    if (!knownProps.includes(key) && !validateMetadataValue(value)) {
      return false;
    }
  }
  
  return true;
} 