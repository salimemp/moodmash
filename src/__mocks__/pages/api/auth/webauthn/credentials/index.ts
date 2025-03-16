import { rateLimit } from '@/lib/auth/rate-limit';
import { getSessionFromReq } from '@/lib/auth/utils';
import { db } from '@/lib/db/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Mock implementation of the WebAuthn credentials index API handler
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Mock implementation that will be used by tests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Apply rate limiting
  const rateLimitPassed = await rateLimit(req, res, 'general');
  if (!rateLimitPassed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    const session = await getSessionFromReq(req);
    
    if (!session?.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const credentials = await db.credential.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        deviceType: true,
        friendlyName: true,
        createdAt: true,
        lastUsed: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.status(200).json({ credentials });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default handler; 