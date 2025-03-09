import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
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

    // Token is valid
    return res.status(200).json({ message: 'Token is valid' });
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 