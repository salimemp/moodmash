import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromReq } from '@/lib/auth/utils';
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
    const session = await getSessionFromReq(req, res);
    
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get the user's moods
    const moods = await db.mood.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            moodLikes: true,
            moodComments: true,
          },
        },
      },
    });

    // Get the total count of user's moods
    const totalMoods = await db.mood.count({
      where: { userId: session.user.id },
    });

    return res.status(200).json({
      moods,
      pagination: {
        total: totalMoods,
        pages: Math.ceil(totalMoods / limit),
        currentPage: page,
        limit,
      }
    });
  } catch (error) {
    console.error('Error fetching user moods:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 
