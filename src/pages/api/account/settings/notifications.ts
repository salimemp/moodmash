import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromReq } from '@/lib/auth/utils';
import { db } from '@/lib/db/prisma';
import { rateLimit } from '@/lib/auth/rate-limit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

    // Get the notification settings from the request body
    const notificationSettings = req.body;

    // Validate notification settings
    if (typeof notificationSettings !== 'object') {
      return res.status(400).json({ message: 'Invalid notification settings' });
    }

    // Get the user's current settings
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

    // Parse current settings or create default
    let currentSettings = {
      notifications: {},
      appearance: {
        theme: 'system',
        reducedMotion: false,
        highContrast: false,
      },
    };

    if (user.settings) {
      try {
        currentSettings =
          typeof user.settings === 'string' ? JSON.parse(user.settings) : user.settings;
      } catch (e) {
        console.error('Error parsing user settings:', e);
      }
    }

    // Update notification settings
    const updatedSettings = {
      ...currentSettings,
      notifications: {
        ...currentSettings.notifications,
        ...notificationSettings,
      },
    };

    // Save the updated settings
    await db.user.update({
      where: { id: session.user.id },
      data: {
        settings: JSON.stringify(updatedSettings),
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({
      message: 'Notification settings updated successfully',
      notifications: updatedSettings.notifications,
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
