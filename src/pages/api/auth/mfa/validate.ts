import type { NextApiRequest, NextApiResponse } from 'next';
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
    const { userId, code, isBackupCode = false } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ message: 'User ID and code are required' });
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

    return res.status(200).json({ 
      success: true,
      message: 'MFA validation successful' 
    });
  } catch (error) {
    console.error('Error validating MFA:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 