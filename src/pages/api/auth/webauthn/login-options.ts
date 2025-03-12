import type { NextApiRequest, NextApiResponse } from 'next';
import { generateWebAuthnAuthenticationOptions } from '@/lib/auth/webauthn';
import { rateLimit } from '@/lib/auth/rate-limit';

// Store challenges in memory (in production, use Redis or another persistent store)
const authenticationChallengeStore: Record<string, string> = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Apply rate limiting
  const rateLimitPassed = await rateLimit(req, res, 'general');
  if (!rateLimitPassed) return;

  try {
    // Generate authentication options
    // We don't pass a userId because we want to allow any passkey to sign in
    const options = await generateWebAuthnAuthenticationOptions();

    // Generate a request ID to associate with this authentication attempt
    const requestId = Buffer.from(crypto.randomUUID()).toString('base64url');

    // Store the challenge to verify later
    authenticationChallengeStore[requestId] = options.challenge;

    // Set challenge expiry (15 minutes)
    setTimeout(
      () => {
        delete authenticationChallengeStore[requestId];
      },
      15 * 60 * 1000
    );

    // Send authentication options to client with the request ID
    return res.status(200).json({
      options,
      requestId,
    });
  } catch (error) {
    console.error('WebAuthn authentication options error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Export the challenge store for use in the verification endpoint
export { authenticationChallengeStore };
