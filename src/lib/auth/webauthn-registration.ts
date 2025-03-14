/**
 * WebAuthn Registration Module
 * Handles credential registration functionality
 */

import { db } from '@/lib/db/prisma';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type GenerateRegistrationOptionsOpts,
  type VerifiedRegistrationResponse,
  type VerifyRegistrationResponseOpts,
} from '@simplewebauthn/server';
import type {
  AttestationConveyancePreference,
  AuthenticatorTransportFuture,
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
  UserVerificationRequirement,
} from '@simplewebauthn/types';
import { getExpectedOrigin, getRpID, rpName, supportedAlgorithmIDs, timeoutDuration } from './webauthn-config';

/**
 * Generate WebAuthn registration options for a user
 * 
 * @param userId - The ID of the user
 * @param username - The username of the user
 * @param userDisplayName - The display name of the user
 * @returns WebAuthn registration options
 */
export async function generateWebAuthnRegistrationOptions(
  userId: string,
  username: string,
  userDisplayName: string
): Promise<PublicKeyCredentialCreationOptionsJSON> {
  // Get existing authenticators for user to exclude them
  const existingCredentials = await db.credential.findMany({
    where: { userId },
    select: { externalId: true },
    take: 50, // Limit the number of credentials to prevent performance issues
  });

  const options: GenerateRegistrationOptionsOpts = {
    rpID: getRpID(),
    rpName,
    userID: userId,
    userName: username,
    userDisplayName,
    timeout: timeoutDuration,
    attestationType: 'none' as AttestationConveyancePreference,
    excludeCredentials: existingCredentials.map((cred: { externalId: string }) => ({
      id: Buffer.from(cred.externalId, 'base64url'),
      type: 'public-key',
      transports: ['internal', 'usb', 'ble', 'nfc', 'hybrid'] as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'preferred' as UserVerificationRequirement,
    },
    supportedAlgorithmIDs,
  };

  return generateRegistrationOptions(options);
}

/**
 * Verify WebAuthn registration
 * 
 * @param credential - The registration credential response from the client
 * @param expectedChallenge - The expected challenge that was generated earlier
 * @returns Verification result
 */
export async function verifyWebAuthnRegistration(
  credential: RegistrationResponseJSON,
  expectedChallenge: string
): Promise<VerifiedRegistrationResponse> {
  const options: VerifyRegistrationResponseOpts = {
    response: credential,
    expectedChallenge: expectedChallenge,
    expectedOrigin: getExpectedOrigin(),
    expectedRPID: getRpID(),
  };

  return verifyRegistrationResponse(options);
} 