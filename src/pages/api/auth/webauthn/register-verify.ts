import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromReq } from '@/lib/auth/utils';
import { verifyWebAuthnRegistration } from '@/lib/auth/webauthn';
import { db } from '@/lib/db/prisma';
import { registrationChallengeStore } from './register-options';
import { rateLimit } from '@/lib/auth/rate-limit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Apply rate limiting
  const rateLimitPassed = await rateLimit(req, res, 'general');
  if (!rateLimitPassed) return;

  try {
    // Get the current user session
    const session = await getSessionFromReq(req, res);
    
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { credential, challengeId } = req.body;

    if (!credential || !challengeId) {
      return res.status(400).json({ message: 'Credential and challengeId are required' });
    }

    // Get the expected challenge from the store
    const expectedChallenge = registrationChallengeStore[challengeId];
    if (!expectedChallenge) {
      return res.status(400).json({ 
        message: 'Registration challenge not found or expired. Please try again.' 
      });
    }

    // Verify the registration
    const verification = await verifyWebAuthnRegistration(
      credential,
      expectedChallenge,
    );

    // Remove the challenge from the store
    delete registrationChallengeStore[challengeId];

    if (!verification.verified) {
      return res.status(400).json({ message: 'Verification failed' });
    }

    // Save the credential to the database
    if (!verification.registrationInfo) {
      return res.status(400).json({ message: 'Registration info missing' });
    }

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

    await db.credential.create({
      data: {
        userId: session.user.id,
        externalId: Buffer.from(credentialID).toString('base64url'),
        publicKey: Buffer.from(credentialPublicKey).toString('base64url'),
        counter,
        deviceType: credential.authenticatorAttachment || 'unknown',
        backupState: credential.clientExtensionResults?.credProps?.rk || false,
        transports: credential.response.transports || [],
        friendlyName: 'My passkey', // Default name, could be customizable
      },
    });

    // Count the number of credentials for this user
    const credentialCount = await db.credential.count({
      where: { userId: session.user.id },
    });

    return res.status(200).json({
      message: 'Registration successful',
      isFirstCredential: credentialCount === 1,
    });
  } catch (error) {
    console.error('WebAuthn registration verification error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 
