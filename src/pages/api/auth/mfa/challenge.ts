import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyTOTP, verifyBackupCode } from '@/lib/auth/mfa';
import { db } from '@/lib/db/prisma';
import { rateLimit, incrementFailedLoginAttempts } from '@/lib/auth/rate-limit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, code, isBackupCode = false } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and verification code are required' });
  }

  // Apply rate limiting
  const ipRateLimitPassed = await rateLimit(req, res, 'general');
  if (!ipRateLimitPassed) return;

  // Apply MFA-specific rate limiting
  const mfaRateLimitPassed = await rateLimit(req, res, 'mfa', email);
  if (!mfaRateLimitPassed) return;

  try {
    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        mfaEnabled: true,
        mfaSecret: true,
        mfaBackupCodes: true,
      },
    });

    if (!user) {
      // For security, don't reveal if user exists
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify the user has MFA enabled
    if (!user.mfaEnabled) {
      return res.status(400).json({ message: 'MFA is not enabled for this account' });
    }

    // Verify the code based on type
    let isValid = false;

    if (isBackupCode) {
      // Verify backup code
      isValid = await verifyBackupCode(user.id, code);
    } else {
      // Verify TOTP code
      if (!user.mfaSecret) {
        return res.status(400).json({ message: 'MFA configuration is invalid' });
      }

      isValid = verifyTOTP(user.mfaSecret, code);
    }

    if (!isValid) {
      // Increment failed attempts counter
      await incrementFailedLoginAttempts(email);
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // MFA verification successful
    return res.status(200).json({
      success: true,
      message: 'MFA verification successful',
    });
  } catch (error) {
    console.error('MFA challenge error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
