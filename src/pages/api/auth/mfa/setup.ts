import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromReq } from '@/lib/auth/utils';
import { db } from '@/lib/db/prisma';
import { generateMfaSecret } from '@/lib/auth/mfa';
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

    // Get user email
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, mfaEnabled: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.email) {
      return res.status(400).json({ message: 'User email is missing' });
    }

    if (user.mfaEnabled) {
      return res.status(400).json({ message: 'MFA is already enabled for this account' });
    }

    // Generate MFA secret, QR code URL, and backup codes
    const mfaData = await generateMfaSecret(userId, user.email);

    return res.status(200).json({
      secret: mfaData.secret,
      qrCodeUrl: mfaData.qrCodeUrl,
      backupCodes: mfaData.backupCodes,
    });
  } catch (error) {
    console.error('Error setting up MFA:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
