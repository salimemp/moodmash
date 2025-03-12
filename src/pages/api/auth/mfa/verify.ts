import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromReq } from '@/lib/auth/utils';
import { db } from '@/lib/db/prisma';
import { verifyTOTP } from '@/lib/auth/mfa';
import { rateLimit } from '@/lib/auth/rate-limit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Apply rate limiting
  const rateLimitPassed = await rateLimit(req, res, 'mfa');
  if (!rateLimitPassed) return;

  try {
    // Get the current user session
    const session = await getSessionFromReq(req, res);

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = session.user.id;
    const { code, secret } = req.body;

    if (!code || !secret) {
      return res.status(400).json({ message: 'Code and secret are required' });
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.mfaEnabled) {
      return res.status(400).json({ message: 'MFA is already enabled for this account' });
    }

    // Verify the TOTP code
    const isValid = verifyTOTP(code, secret);

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Enable MFA for the user and store the secret
    await db.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaSecret: secret,
      },
    });

    return res.status(200).json({ message: 'MFA has been successfully enabled' });
  } catch (error) {
    console.error('Error verifying MFA:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
