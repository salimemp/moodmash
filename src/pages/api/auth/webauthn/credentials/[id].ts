import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db/prisma';
import { rateLimit } from '@/lib/auth/rate-limit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Apply rate limiting
  const rateLimitPassed = await rateLimit(req, res, 'general');
  if (!rateLimitPassed) return;

  try {
    // Get the current user session
    const session = await auth(req, res);
    
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const credentialId = req.query.id as string;
    
    if (!credentialId) {
      return res.status(400).json({ message: 'Credential ID is required' });
    }

    // Find the credential to ensure it belongs to the user
    const credential = await db.credential.findUnique({
      where: { id: credentialId },
      select: { userId: true },
    });

    if (!credential) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    if (credential.userId !== session.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Count the number of credentials for this user
    const credentialCount = await db.credential.count({
      where: { userId: session.user.id },
    });

    // Don't allow deleting the last credential if it's the only one
    if (credentialCount <= 1) {
      return res.status(400).json({ 
        message: 'Cannot delete your only passkey. Add another one first.' 
      });
    }

    // Delete the credential
    await db.credential.delete({
      where: { id: credentialId },
    });

    return res.status(200).json({
      message: 'Credential deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting WebAuthn credential:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 