import type { NextApiRequest, NextApiResponse } from 'next';
import { generateWebAuthnRegistrationOptions } from '@/lib/auth/webauthn';
import { getSessionFromReq } from '@/lib/auth/utils';
import { rateLimit } from '@/lib/auth/rate-limit';
import { randomUUID } from 'crypto';

// In-memory store for registration challenges
// In production, use a persistent store like Redis
export const registrationChallengeStore: Record<string, string> = {};

// Set challenge expiration time (15 minutes)
const CHALLENGE_TIMEOUT_MS = 15 * 60 * 1000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Apply rate limiting
  const rateLimitPassed = await rateLimit(req, res, 'general');
  if (!rateLimitPassed) return;

  try {
    // Get the current user session
    const session = await getSessionFromReq(req, res);

    if (!session?.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id, email, name } = session.user;

    if (!id || !email) {
      return res.status(400).json({ message: 'User ID and email are required' });
    }

    // Generate registration options
    const options = await generateWebAuthnRegistrationOptions(id, email, name || email);

    // Store the challenge with a unique ID
    const challengeId = randomUUID();
    registrationChallengeStore[challengeId] = options.challenge;

    // Set timeout to remove the challenge after 15 minutes
    setTimeout(() => {
      delete registrationChallengeStore[challengeId];
    }, CHALLENGE_TIMEOUT_MS);

    // Return the options and challenge ID
    return res.status(200).json({
      options,
      challengeId,
    });
  } catch (error) {
    console.error('WebAuthn registration options error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
