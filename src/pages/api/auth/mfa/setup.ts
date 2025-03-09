import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@/lib/auth/auth';
import { generateMfaSecret } from '@/lib/auth/mfa';
import { db } from '@/lib/db/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the current user session
    const session = await auth();

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = session.user.id;
    
    // Get user email
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, mfaEnabled: true },
    });

    if (!user || !user.email) {
      return res.status(404).json({ message: 'User not found or email missing' });
    }

    // Check if MFA is already enabled
    if (user.mfaEnabled) {
      return res.status(400).json({ message: 'MFA is already enabled for this account' });
    }

    // Generate MFA secret, QR code URL, and backup codes
    const mfaData = await generateMfaSecret(userId, user.email);

    return res.status(200).json({
      qrCodeUrl: mfaData.qrCodeUrl,
      backupCodes: mfaData.backupCodes,
      message: 'MFA setup initiated. Please verify with a code before MFA is enabled.',
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 