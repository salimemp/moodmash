/**
 * WebAuthn Authentication Module
 * Handles credential authentication functionality
 */

import { db } from '@/lib/db/prisma';
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type GenerateAuthenticationOptionsOpts,
  type VerifiedAuthenticationResponse,
  type VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  PublicKeyCredentialRequestOptionsJSON,
  UserVerificationRequirement,
} from '@simplewebauthn/types';
import { getExpectedOrigin, getRpID, timeoutDuration } from './webauthn-config';

/**
 * Generate WebAuthn authentication options
 * 
 * @param userId - Optional user ID to retrieve specific user credentials
 * @returns Authentication options for the WebAuthn client
 */
export async function generateWebAuthnAuthenticationOptions(
  userId?: string
): Promise<PublicKeyCredentialRequestOptionsJSON> {
  let allowCredentials;

  if (userId) {
    // For passwordless sign-in with a specific user account
    const userCredentials = await db.credential.findMany({
      where: { userId },
      select: { externalId: true },
      take: 50, // Limit the number of credentials to prevent performance issues
    });

    allowCredentials = userCredentials.map((cred: { externalId: string }) => ({
      id: Buffer.from(cred.externalId, 'base64url'),
      type: 'public-key' as const,
      transports: ['internal', 'usb', 'ble', 'nfc', 'hybrid'] as AuthenticatorTransportFuture[],
    }));
  }

  const options: GenerateAuthenticationOptionsOpts = {
    rpID: getRpID(),
    timeout: timeoutDuration,
    allowCredentials,
    userVerification: 'preferred' as UserVerificationRequirement,
  };

  return generateAuthenticationOptions(options);
}

/**
 * Verify WebAuthn authentication
 * 
 * @param credential - The authentication credential response from the client
 * @param expectedChallenge - The expected challenge that was generated earlier
 * @returns Verification result with user information if successful
 */
export async function verifyWebAuthnAuthentication(
  credential: AuthenticationResponseJSON,
  expectedChallenge: string
): Promise<VerifiedAuthenticationResponse & { user?: { id: string; email: string | null } }> {
  // Lookup the credential in the database
  const dbCredential = await db.credential.findUnique({
    where: {
      externalId: credential.id,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (!dbCredential) {
    throw new Error('Authenticator not registered with this site');
  }

  const options: VerifyAuthenticationResponseOpts = {
    response: credential,
    expectedChallenge: expectedChallenge,
    expectedOrigin: getExpectedOrigin(),
    expectedRPID: getRpID(),
    authenticator: {
      credentialID: Buffer.from(dbCredential.externalId, 'base64url'),
      credentialPublicKey: Buffer.from(dbCredential.publicKey, 'base64url'),
      counter: dbCredential.counter,
    },
  };

  const verification = await verifyAuthenticationResponse(options);

  // Update the counter in the database
  if (verification.verified) {
    await db.credential.update({
      where: { id: dbCredential.id },
      data: { counter: verification.authenticationInfo.newCounter },
    });
  }

  return { ...verification, user: dbCredential.user };
} 