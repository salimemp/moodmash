import { Crypto } from '@peculiar/webcrypto';
import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

// Polyfill for WebCrypto API in non-browser environments
if (typeof window === 'undefined' && !global.crypto) {
  global.crypto = new Crypto();
}

// Constants for encryption
export const NONCE_LENGTH = nacl.box.nonceLength;
export const SALT_BYTES = 16;

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