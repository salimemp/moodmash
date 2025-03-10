import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
import SRP from 'secure-remote-password/client';
import { Crypto } from '@peculiar/webcrypto';

// Polyfill for WebCrypto API in non-browser environments
if (typeof window === 'undefined' && !global.crypto) {
  global.crypto = new Crypto();
}

/**
 * Encryption utility functions for end-to-end encryption
 */

// Constants for encryption
const KEY_LENGTH = nacl.box.publicKeyLength;
const SECRET_LENGTH = nacl.box.secretKeyLength;
const NONCE_LENGTH = nacl.box.nonceLength;
const SALT_BYTES = 16;
const AUTH_KEY_LENGTH = 32;

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
    [key: string]: any;
  };
}

/**
 * Generate a random nonce for encryption
 */
export function generateNonce(): Uint8Array {
  return nacl.randomBytes(NONCE_LENGTH);
}

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(): Uint8Array {
  return nacl.randomBytes(SALT_BYTES);
}

/**
 * Generate a new key pair for asymmetric encryption
 */
export function generateKeyPair(): nacl.BoxKeyPair {
  return nacl.box.keyPair();
}

/**
 * Convert a string to Uint8Array
 */
export function stringToUint8Array(str: string): Uint8Array {
  return util.decodeUTF8(str);
}

/**
 * Convert Uint8Array to string
 */
export function uint8ArrayToString(arr: Uint8Array): string {
  return util.encodeUTF8(arr);
}

/**
 * Encode Uint8Array to Base64 string
 */
export function encodeBase64(arr: Uint8Array): string {
  return util.encodeBase64(arr);
}

/**
 * Decode Base64 string to Uint8Array
 */
export function decodeBase64(str: string): Uint8Array {
  return util.decodeBase64(str);
}

/**
 * Derive encryption key from password
 * @param password User password
 * @param salt Random salt (should be stored with user)
 * @returns Promise resolving to the derived key
 */
export async function deriveKeyFromPassword(
  password: string, 
  salt: Uint8Array | string
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = typeof salt === 'string' ? decodeBase64(salt) : salt;
  
  // Import the password as a key
  const passwordKey = await crypto.subtle.importKey(
    'raw', 
    passwordBuffer,
    { name: 'PBKDF2' }, 
    false, 
    ['deriveBits']
  );
  
  // Derive bits using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    256 // 32 bytes for NaCl box
  );
  
  return new Uint8Array(derivedBits);
}

/**
 * Encrypt data with symmetric encryption (secret key)
 * @param data Data to encrypt
 * @param key Secret key (Uint8Array or Base64 string)
 * @returns Encrypted data object with ciphertext and nonce
 */
export function encryptSymmetric(
  data: string | object, 
  key: Uint8Array | string
): EncryptedData {
  // Convert key if it's a string
  const keyArray = typeof key === 'string' ? decodeBase64(key) : key;
  
  // Convert data to string if it's an object
  const dataString = typeof data === 'object' ? JSON.stringify(data) : data;
  
  // Generate a random nonce
  const nonce = generateNonce();
  
  // Encrypt the data
  const dataUint8 = stringToUint8Array(dataString);
  const encrypted = nacl.secretbox(dataUint8, nonce, keyArray);
  
  return {
    ciphertext: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
  };
}

/**
 * Decrypt data with symmetric encryption (secret key)
 * @param encryptedData Object containing ciphertext and nonce
 * @param key Secret key (Uint8Array or Base64 string)
 * @returns Decrypted data string
 */
export function decryptSymmetric(
  encryptedData: EncryptedData,
  key: Uint8Array | string
): string | null {
  // Convert key if it's a string
  const keyArray = typeof key === 'string' ? decodeBase64(key) : key;
  
  // Decode the ciphertext and nonce
  const ciphertext = decodeBase64(encryptedData.ciphertext);
  const nonce = decodeBase64(encryptedData.nonce);
  
  // Decrypt the data
  const decrypted = nacl.secretbox.open(ciphertext, nonce, keyArray);
  
  // Return null if decryption failed
  if (!decrypted) return null;
  
  // Convert the decrypted data to a string
  return uint8ArrayToString(decrypted);
}

/**
 * Encrypt data with asymmetric encryption (public key)
 * @param data Data to encrypt
 * @param recipientPublicKey Recipient's public key (Uint8Array or Base64 string)
 * @param senderSecretKey Sender's secret key (Uint8Array or Base64 string)
 * @returns Encrypted data object with ciphertext, nonce, and sender's public key
 */
export function encryptAsymmetric(
  data: string | object,
  recipientPublicKey: Uint8Array | string,
  senderSecretKey: Uint8Array | string
): EncryptedData {
  // Convert keys if they're strings
  const publicKeyArray = typeof recipientPublicKey === 'string' 
    ? decodeBase64(recipientPublicKey) 
    : recipientPublicKey;
    
  const secretKeyArray = typeof senderSecretKey === 'string'
    ? decodeBase64(senderSecretKey)
    : senderSecretKey;
  
  // Generate keypair from sender's secret key
  const keyPair = nacl.box.keyPair.fromSecretKey(secretKeyArray);
  
  // Convert data to string if it's an object
  const dataString = typeof data === 'object' ? JSON.stringify(data) : data;
  
  // Generate a random nonce
  const nonce = generateNonce();
  
  // Encrypt the data
  const dataUint8 = stringToUint8Array(dataString);
  const encrypted = nacl.box(
    dataUint8,
    nonce,
    publicKeyArray,
    secretKeyArray
  );
  
  return {
    ciphertext: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
    publicKey: encodeBase64(keyPair.publicKey), // Sender's public key
  };
}

/**
 * Decrypt data with asymmetric encryption (private key)
 * @param encryptedData Object containing ciphertext, nonce, and sender's public key
 * @param recipientSecretKey Recipient's secret key (Uint8Array or Base64 string)
 * @param senderPublicKey Sender's public key (Uint8Array or Base64 string) - if not in encryptedData
 * @returns Decrypted data string
 */
export function decryptAsymmetric(
  encryptedData: EncryptedData,
  recipientSecretKey: Uint8Array | string,
  senderPublicKey?: Uint8Array | string
): string | null {
  if (!encryptedData.publicKey && !senderPublicKey) {
    throw new Error('Sender public key is required for decryption');
  }
  
  // Convert key if it's a string
  const secretKeyArray = typeof recipientSecretKey === 'string'
    ? decodeBase64(recipientSecretKey)
    : recipientSecretKey;
    
  // Use sender's public key from encryptedData or provided parameter
  const publicKeyString = encryptedData.publicKey || senderPublicKey as string;
  const publicKeyArray = typeof publicKeyString === 'string'
    ? decodeBase64(publicKeyString)
    : publicKeyString;
  
  // Decode the ciphertext and nonce
  const ciphertext = decodeBase64(encryptedData.ciphertext);
  const nonce = decodeBase64(encryptedData.nonce);
  
  // Decrypt the data
  const decrypted = nacl.box.open(
    ciphertext,
    nonce,
    publicKeyArray,
    secretKeyArray
  );
  
  // Return null if decryption failed
  if (!decrypted) return null;
  
  // Convert the decrypted data to a string
  return uint8ArrayToString(decrypted);
}

/**
 * Generate a verifier and salt for Secure Remote Password protocol
 * @param username User's username
 * @param password User's password
 * @returns Object containing salt and verifier
 */
export function generateSrpCredentials(username: string, password: string) {
  const salt = SRP.generateSalt();
  const privateKey = SRP.derivePrivateKey(salt, username, password);
  const verifier = SRP.deriveVerifier(privateKey);
  
  return { salt, verifier };
}

/**
 * Create an encrypted message for secure communication
 * @param message Message content
 * @param senderKeys Sender's keys
 * @param recipientPublicKey Recipient's public key
 * @param metadata Optional metadata for the message
 * @returns Encrypted message object
 */
export function createEncryptedMessage(
  message: string | object,
  senderKeys: { secretKey: string; publicKey: string },
  recipientPublicKey: string,
  senderId: string,
  recipientId: string,
  metadata?: { type: string; [key: string]: any }
): EncryptedMessage {
  const encrypted = encryptAsymmetric(
    message,
    recipientPublicKey,
    senderKeys.secretKey
  );
  
  return {
    ...encrypted,
    sender: senderId,
    recipient: recipientId,
    timestamp: Date.now(),
    metadata,
  };
}

/**
 * Decrypt an encrypted message
 * @param encryptedMessage The encrypted message object
 * @param recipientSecretKey Recipient's secret key
 * @returns Decrypted message as string or parsed object
 */
export function decryptMessage(
  encryptedMessage: EncryptedMessage,
  recipientSecretKey: string
): any {
  const decrypted = decryptAsymmetric(
    encryptedMessage,
    recipientSecretKey
  );
  
  if (!decrypted) return null;
  
  try {
    // Try to parse as JSON
    return JSON.parse(decrypted);
  } catch (e) {
    // Return as string if not valid JSON
    return decrypted;
  }
}

/**
 * Generate encryption keys from user credentials
 * @param email User's email
 * @param password User's password
 * @returns Promise resolving to user keys
 */
export async function generateUserKeys(
  email: string,
  password: string
): Promise<UserKeys> {
  // Generate a salt
  const salt = generateSalt();
  
  // Derive a key from the password
  const derivedKey = await deriveKeyFromPassword(password, salt);
  
  // Generate a key pair from the derived key
  const keyPair = nacl.box.keyPair.fromSecretKey(derivedKey);
  
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey),
    salt: encodeBase64(salt),
  };
}

/**
 * Encrypt user preferences with symmetric encryption
 * @param preferences User preferences object
 * @param encryptionKey Encryption key
 * @returns Encrypted data object
 */
export function encryptPreferences(
  preferences: any,
  encryptionKey: string
): EncryptedData {
  return encryptSymmetric(preferences, encryptionKey);
}

/**
 * Decrypt user preferences
 * @param encryptedData Encrypted preferences data
 * @param encryptionKey Encryption key
 * @returns Decrypted preferences object or null
 */
export function decryptPreferences(
  encryptedData: EncryptedData,
  encryptionKey: string
): any {
  const decrypted = decryptSymmetric(encryptedData, encryptionKey);
  
  if (!decrypted) return null;
  
  try {
    return JSON.parse(decrypted);
  } catch (e) {
    console.error('Failed to parse decrypted preferences:', e);
    return null;
  }
} 