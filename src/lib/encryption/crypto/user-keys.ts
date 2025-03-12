import SRP from 'secure-remote-password/client';
import nacl from 'tweetnacl';
import { UserKeys } from './types';
import { deriveKeyFromPassword, encodeBase64, generateSalt } from './utils';

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
 * Generate encryption keys from user credentials
 * @param password User's password
 * @returns Promise resolving to user keys
 */
export async function generateUserKeys(password: string): Promise<UserKeys> {
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