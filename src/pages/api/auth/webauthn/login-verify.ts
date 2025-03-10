import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyWebAuthnAuthentication } from '@/lib/auth/webauthn';
import { authenticationChallengeStore } from './login-options';
import { rateLimit, resetRateLimit } from '@/lib/auth/rate-limit';
import { db } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Apply rate limiting
  const rateLimitPassed = await rateLimit(req, res, 'general');
  if (!rateLimitPassed) return;

  try {
    const { credential, requestId } = req.body;

    if (!credential || !requestId) {
      return res.status(400).json({ message: 'Credential and requestId are required' });
    }

    // Get the challenge from the store
    const expectedChallenge = authenticationChallengeStore[requestId];
    if (!expectedChallenge) {
      return res.status(400).json({ 
        message: 'Authentication challenge not found or expired. Please try again.' 
      });
    }

    // Verify the authentication
    const verification = await verifyWebAuthnAuthentication(
      credential,
      expectedChallenge,
    );

    // Remove the challenge from the store
    delete authenticationChallengeStore[requestId];

    if (!verification.verified || !verification.user) {
      return res.status(400).json({ message: 'Authentication failed' });
    }

    // Reset login rate limit for this user
    if (verification.user.email) {
      await resetRateLimit('login', verification.user.email);
    }

    // Create a custom JWT token for the user
    const session = await getServerSession(req, res, authConfig);
    
    if (!session) {
      // If no session exists, return the user info for client-side sign-in
      return res.status(200).json({
        message: 'Authentication successful',
        user: {
          id: verification.user.id,
          email: verification.user.email,
        },
      });
    }

    // If a session already exists, update it
    return res.status(200).json({
      message: 'Authentication successful',
      user: {
        id: verification.user.id,
        email: verification.user.email,
      },
    });
  } catch (error) {
    console.error('WebAuthn authentication verification error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 