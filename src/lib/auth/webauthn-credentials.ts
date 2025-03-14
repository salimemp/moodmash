/**
 * WebAuthn Credentials Module
 * Handles credential management operations
 */

import { db } from '@/lib/db/prisma';

/**
 * Deletes a WebAuthn credential
 * 
 * @param userId - The ID of the user who owns the credential
 * @param credentialId - The external ID of the credential to delete
 * @returns True if deletion was successful, false otherwise
 */
export async function deleteWebAuthnCredential(
  userId: string,
  credentialId: string
): Promise<boolean> {
  try {
    await db.credential.deleteMany({
      where: {
        userId,
        externalId: credentialId,
      },
    });

    return true;
  } catch (error) {
    console.error('Error deleting WebAuthn credential:', error);
    return false;
  }
}

/**
 * Retrieves all credentials for a user
 * 
 * @param userId - The ID of the user
 * @returns Array of credential objects with selected fields
 */
export async function getUserCredentials(userId: string) {
  return db.credential.findMany({
    where: { userId },
    select: {
      id: true,
      externalId: true,
      deviceType: true,
      backupState: true,
      friendlyName: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Updates the friendly name of a credential
 * 
 * @param credentialId - The ID of the credential in the database
 * @param friendlyName - The new friendly name to set
 * @returns The updated credential
 */
export async function updateCredentialFriendlyName(
  credentialId: string,
  friendlyName: string
) {
  try {
    return db.credential.update({
      where: { id: credentialId },
      data: { friendlyName },
    });
  } catch (error) {
    console.error('Error updating credential friendly name:', error);
    throw error;
  }
} 