import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromReq } from '@/lib/auth/utils';
import { db } from '@/lib/db/prisma';
import { verifyTOTP, verifyBackupCode } from '@/lib/auth/mfa';
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
    const { code, isBackupCode = false } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Verification code is required' });
    }

    // Get user's MFA information
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { 
        mfaEnabled: true,
        mfaSecret: true,
        mfaBackupCodes: true
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.mfaEnabled) {
      return res.status(400).json({ message: 'MFA is not enabled for this account' });
    }

    // Verify the code based on type
    let isValid = false;
    
    if (isBackupCode) {
      // Verify backup code
      isValid = await verifyBackupCode(userId, code);
    } else {
      // Verify TOTP code
      if (!user.mfaSecret) {
        return res.status(400).json({ message: 'MFA secret not found' });
      }
      
      isValid = verifyTOTP(code, user.mfaSecret);
    }

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Disable MFA for the user
    await db.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: [],
      },
    });

    return res.status(200).json({ message: 'MFA has been successfully disabled' });
  } catch (error) {
    console.error('Error disabling MFA:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 