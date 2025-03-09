import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@/lib/auth/auth';
import { verifyTOTP, enableMfa, verifyBackupCode } from '@/lib/auth/mfa';
import { db } from '@/lib/db/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code, isBackupCode = false } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Verification code is required' });
  }

  try {
    // Get the current user session
    const session = await auth();

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = session.user.id;
    
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

    // Check if MFA is already enabled
    if (user.mfaEnabled) {
      return res.status(400).json({ message: 'MFA is already enabled for this account' });
    }

    // Verify the code based on type
    let isValid = false;
    
    if (isBackupCode) {
      // Verify backup code
      isValid = await verifyBackupCode(userId, code);
    } else {
      // Verify TOTP code
      if (!user.mfaSecret) {
        return res.status(400).json({ message: 'MFA setup not initiated' });
      }
      
      isValid = verifyTOTP(user.mfaSecret, code);
    }

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Enable MFA for the user
    await enableMfa(userId);

    return res.status(200).json({
      message: 'MFA has been successfully enabled for your account',
    });
  } catch (error) {
    console.error('MFA verification error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 