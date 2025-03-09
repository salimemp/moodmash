import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db/prisma';
import { rateLimit } from '@/lib/auth/rate-limit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    // Fetch credentials for the user
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
    });

    return res.status(200).json({
      credentials,
    });
  } catch (error) {
    console.error('Error fetching WebAuthn credentials:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 