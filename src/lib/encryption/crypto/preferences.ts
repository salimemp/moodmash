import { decryptSymmetric, encryptSymmetric } from './symmetric';
import { EncryptedData, UserPreferences } from './types';

/**
 * Encrypt user preferences with symmetric encryption
 * @param preferences User preferences object
 * @param encryptionKey Encryption key
 * @returns Encrypted data object
 */
export function encryptPreferences(preferences: UserPreferences, encryptionKey: string): EncryptedData {
  return encryptSymmetric(preferences, encryptionKey);
}

/**
 * Decrypt user preferences
 * @param encryptedData Encrypted preferences data
 * @param encryptionKey Encryption key
 * @returns Decrypted preferences object or null
 */
export function decryptPreferences(encryptedData: EncryptedData, encryptionKey: string): UserPreferences | null {
  const decrypted = decryptSymmetric(encryptedData, encryptionKey);
  
  if (!decrypted) return null;
  
  try {
    return JSON.parse(decrypted) as UserPreferences;
  } catch {
    return null;
  }
} 