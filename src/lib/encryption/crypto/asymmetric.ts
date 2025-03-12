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
 * Generate a new key pair for asymmetric encryption
 */
export function generateKeyPair(): nacl.BoxKeyPair {
  return nacl.box.keyPair();
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
  const publicKeyArray =
    typeof recipientPublicKey === 'string' ? decodeBase64(recipientPublicKey) : recipientPublicKey;

  const secretKeyArray =
    typeof senderSecretKey === 'string' ? decodeBase64(senderSecretKey) : senderSecretKey;

  // Generate keypair from sender's secret key
  const keyPair = nacl.box.keyPair.fromSecretKey(secretKeyArray);

  // Convert data to string if it's an object
  const dataString = typeof data === 'object' ? JSON.stringify(data) : data;

  // Generate a random nonce
  const nonce = generateNonce();

  // Encrypt the data
  const dataUint8 = stringToUint8Array(dataString);
  const encrypted = nacl.box(dataUint8, nonce, publicKeyArray, secretKeyArray);

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
  const secretKeyArray =
    typeof recipientSecretKey === 'string' ? decodeBase64(recipientSecretKey) : recipientSecretKey;

  // Use sender's public key from encryptedData or provided parameter
  const publicKeyString = encryptedData.publicKey || (senderPublicKey as string);
  const publicKeyArray =
    typeof publicKeyString === 'string' ? decodeBase64(publicKeyString) : publicKeyString;

  // Decode the ciphertext and nonce
  const ciphertext = decodeBase64(encryptedData.ciphertext);
  const nonce = decodeBase64(encryptedData.nonce);

  // Decrypt the data
  const decrypted = nacl.box.open(ciphertext, nonce, publicKeyArray, secretKeyArray);

  // Return null if decryption failed
  if (!decrypted) return null;

  // Convert the decrypted data to a string
  return uint8ArrayToString(decrypted);
} 