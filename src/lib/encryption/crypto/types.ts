/**
 * Common types for the crypto module
 */

// Define generic metadata type to replace any
export type MetadataValue = 
  | string 
  | number 
  | boolean 
  | null 
  | { [key: string]: MetadataValue } 
  | MetadataValue[];

// Define a type for user preferences
export interface UserPreferences {
  theme?: string;
  language?: string;
  notifications?: boolean;
  privacy?: {
    profileVisibility?: 'public' | 'private' | 'friends';
    messagePrivacy?: 'anyone' | 'friends' | 'none';
  };
  // Allow additional properties
  [key: string]: MetadataValue | undefined;
}

// Types for encryption
export interface EncryptedData {
  ciphertext: string; // Base64 encoded encrypted data
  nonce: string; // Base64 encoded nonce
  publicKey?: string; // Sender's public key if using asymmetric encryption
}

export interface UserKeys {
  publicKey: string; // Base64 encoded public key
  secretKey: string; // Base64 encoded secret key (never stored on server)
  salt: string; // Base64 encoded salt used for key derivation
}

export interface EncryptedMessage extends EncryptedData {
  sender: string; // User ID of sender
  recipient: string; // User ID of recipient
  timestamp: number; // Creation timestamp
  metadata?: {
    type: string;
    [key: string]: MetadataValue;
  };
} 