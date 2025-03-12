import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db/prisma';
import { rateLimit } from '@/lib/auth/rate-limit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Missing token' });
  }

  // Apply rate limiting
  const rateLimitPassed = await rateLimit(req, res, 'emailVerification');
  if (!rateLimitPassed) return;

  try {
    // Find the verification token
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    // Check if token is expired
    if (new Date() > verificationToken.expires) {
      // Delete expired token
      await db.verificationToken.delete({
        where: { token },
      });
      return res.status(400).json({ message: 'Token has expired' });
    }

    // Find user by email identifier
    const user = await db.user.findFirst({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user's email verification status
    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // Delete the used token
    await db.verificationToken.delete({
      where: { token },
    });

    return res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
