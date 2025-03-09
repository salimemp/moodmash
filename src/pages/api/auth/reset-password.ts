import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token and password are required' });
  }

  // Password validation
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  try {
    // Find the token in the database
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

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update user's password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete the used token
    await db.verificationToken.delete({
      where: { token },
    });

    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 