import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticatorTransportFuture,
  AttestationConveyancePreference,
  UserVerificationRequirement,
} from '@simplewebauthn/types';
import type {
  VerifiedAuthenticationResponse,
  VerifiedRegistrationResponse,
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyRegistrationResponseOpts,
  VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';
import { db } from '@/lib/db/prisma';

// Your RP (Relying Party) ID should be the domain name of your app
// For local development, this works with domains like localhost or 127.0.0.1
export const rpID = process.env.NEXT_PUBLIC_APP_URL 
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname 
  : 'localhost';

// RP name is what the user will see during authentication
export const rpName = 'MoodMash';

// Generate WebAuthn registration options
export async function generateWebAuthnRegistrationOptions(
  userId: string,
  username: string,
  userDisplayName: string,
): Promise<PublicKeyCredentialCreationOptionsJSON> {
  // Get existing authenticators for user to exclude them
  const existingCredentials = await db.credential.findMany({
    where: { userId },
    select: { externalId: true },
  });

  const options: GenerateRegistrationOptionsOpts = {
    rpID,
    rpName,
    userID: userId,
    userName: username,
    userDisplayName,
    timeout: 60000, // 1 minute
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
    supportedAlgorithmIDs: [-7, -257], // ES256, RS256
  };

  return generateRegistrationOptions(options);
}

// Verify WebAuthn registration
export async function verifyWebAuthnRegistration(
  credential: RegistrationResponseJSON,
  expectedChallenge: string,
): Promise<VerifiedRegistrationResponse> {
  const options: VerifyRegistrationResponseOpts = {
    response: credential,
    expectedChallenge: expectedChallenge,
    expectedOrigin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    expectedRPID: rpID,
  };

  return verifyRegistrationResponse(options);
}

// Generate WebAuthn authentication options
export async function generateWebAuthnAuthenticationOptions(
  userId?: string,
): Promise<PublicKeyCredentialRequestOptionsJSON> {
  let allowCredentials;
  
  if (userId) {
    // For passwordless sign-in with a specific user account
    const userCredentials = await db.credential.findMany({
      where: { userId },
      select: { externalId: true },
    });
    
    allowCredentials = userCredentials.map((cred: { externalId: string }) => ({
      id: Buffer.from(cred.externalId, 'base64url'),
      type: 'public-key' as const,
      transports: ['internal', 'usb', 'ble', 'nfc', 'hybrid'] as AuthenticatorTransportFuture[],
    }));
  }

  const options: GenerateAuthenticationOptionsOpts = {
    rpID,
    timeout: 60000, // 1 minute
    allowCredentials,
    userVerification: 'preferred' as UserVerificationRequirement,
  };

  return generateAuthenticationOptions(options);
}

// Verify WebAuthn authentication
export async function verifyWebAuthnAuthentication(
  credential: AuthenticationResponseJSON,
  expectedChallenge: string,
): Promise<VerifiedAuthenticationResponse & { user?: { id: string; email: string | null } }> {
  // Lookup the credential in the database
  const dbCredential = await db.credential.findUnique({
    where: { 
      externalId: credential.id 
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
    expectedOrigin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    expectedRPID: rpID,
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

/**
 * Deletes a WebAuthn credential
 */
export async function deleteWebAuthnCredential(
  userId: string,
  credentialId: string,
): Promise<boolean> {
  try {
    await db.webAuthnCredential.deleteMany({
      where: {
        userId,
        credentialId,
      },
    });

    return true;
  } catch (error) {
    console.error('Error deleting WebAuthn credential:', error);
    return false;
  }
} 