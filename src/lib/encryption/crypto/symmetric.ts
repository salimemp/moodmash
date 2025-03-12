import nacl from 'tweetnacl';
import { EncryptedData } from './types';
import {
    decodeBase64,
    encodeBase64,
    generateNonce,
    stringToUint8Array,
    uint8ArrayToString
} from './utils';

/**
 * Encrypt data with symmetric encryption (secret key)
 * @param data Data to encrypt
 * @param key Secret key (Uint8Array or Base64 string)
 * @returns Encrypted data object with ciphertext and nonce
 */
export function encryptSymmetric(data: string | object, key: Uint8Array | string): EncryptedData {
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
 * @returns Decrypted data string or null if decryption fails
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