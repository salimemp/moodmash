import { rateLimit } from '@/lib/auth/rate-limit';
import { getSessionFromReq } from '@/lib/auth/utils';
import { db } from '@/lib/db/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Mock implementation of the WebAuthn credentials [id] API handler
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Apply rate limiting
  const rateLimitResult = await rateLimit(req, res, 'general');
  if (!rateLimitResult) {
    return;
  }

  // Check if credential ID is present
  const credentialId = req.query.id as string;
  if (!credentialId) {
    return res.status(400).json({ message: 'Credential ID is required' });
  }

  try {
    // Get user session
    const session = await getSessionFromReq(req);
    
    // Check if user is authenticated
    if (!session?.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get the credential
    const credential = await db.credential.findFirst({
      where: {
        id: credentialId,
        userId: session.user.id,
      },
    });

    // Check if credential exists
    if (!credential) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    // Check if this is the user's only credential
    const credentialCount = await db.credential.count({
      where: { userId: session.user.id },
    });

    if (credentialCount <= 1) {
      return res.status(400).json({
        message: 'Cannot delete your only passkey. Add another one first.',
      });
    }

    // Delete the credential
    await db.credential.delete({
      where: {
        id: credentialId,
      },
    });

    return res.status(200).json({ message: 'Credential deleted successfully' });
  } catch (error) {
    console.error('Error deleting credential:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default handler; 