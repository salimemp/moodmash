import { decryptAsymmetric, encryptAsymmetric } from './asymmetric';
import { EncryptedMessage, MetadataValue } from './types';

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
  metadata?: { type: string; [key: string]: MetadataValue }
): EncryptedMessage {
  const encrypted = encryptAsymmetric(message, recipientPublicKey, senderKeys.secretKey);

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
): unknown {
  const decrypted = decryptAsymmetric(encryptedMessage, recipientSecretKey);

  if (!decrypted) return null;

  try {
    // Try to parse as JSON
    return JSON.parse(decrypted);
  } catch {
    // Return as string if not valid JSON
    return decrypted;
  }
} 