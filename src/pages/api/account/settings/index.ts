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

    // Get the user's settings
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        settings: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Parse settings or return defaults
    let settings = {
      notifications: {
        emailNotifications: true,
        moodComments: true,
        moodLikes: true,
        newFollowers: true,
        productUpdates: false,
      },
      appearance: {
        theme: 'system',
        reducedMotion: false,
        highContrast: false,
      },
    };

    if (user.settings) {
      try {
        const parsedSettings = typeof user.settings === 'string' 
          ? JSON.parse(user.settings) 
          : user.settings;
        
        settings = {
          notifications: {
            ...settings.notifications,
            ...parsedSettings.notifications,
          },
          appearance: {
            ...settings.appearance,
            ...parsedSettings.appearance,
          },
        };
      } catch (e) {
        console.error('Error parsing user settings:', e);
      }
    }

    return res.status(200).json(settings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 
