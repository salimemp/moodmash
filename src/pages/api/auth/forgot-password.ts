import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db/prisma';
import { sendPasswordResetEmail } from '@/lib/email/sendPasswordResetEmail';
import { rateLimit } from '@/lib/auth/rate-limit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Apply rate limiting
  const ipRateLimitPassed = await rateLimit(req, res, 'general');
  if (!ipRateLimitPassed) return;

  // Apply email-specific rate limiting
  const emailRateLimitPassed = await rateLimit(req, res, 'passwordReset', email);
  if (!emailRateLimitPassed) return;

  try {
    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    // For security reasons, don't reveal if a user exists or not
    // Return a success response regardless to prevent email enumeration attacks
    if (!user) {
      return res.status(200).json({
        message: 'If a user with that email exists, a password reset link has been sent.',
      });
    }

    // Generate protocol and host for the email
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = req.headers.host || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    // Send password reset email
    await sendPasswordResetEmail({
      email,
      userId: user.id,
      baseUrl,
    });

    return res.status(200).json({
      message: 'If a user with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 