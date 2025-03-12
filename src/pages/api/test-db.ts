import { db } from '@/lib/db/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get counts of various entities
    const [userCount, moodCount, likeCount, commentCount, achievementCount, moodMashCount] =
      await Promise.all([
        db.user.count(),
        db.mood.count(),
        db.moodLike.count(),
        db.moodComment.count(),
        db.achievement.count(),
        db.moodMash.count(),
      ]);

    // Get a sample user with their moods
    const sampleUser = await db.user.findFirst({
      include: {
        moods: true,
        moodLikes: true,
        moodComments: true,
        achievements: {
          include: {
            achievement: true,
          },
        },
      },
    });

    res.status(200).json({
      status: 'Database connection successful',
      counts: {
        users: userCount,
        moods: moodCount,
        likes: likeCount,
        comments: commentCount,
        achievements: achievementCount,
        moodMashes: moodMashCount,
      },
      sampleUser: {
        id: sampleUser?.id,
        name: sampleUser?.name,
        email: sampleUser?.email,
        moodCount: sampleUser?.moods.length,
        likeCount: sampleUser?.moodLikes.length,
        commentCount: sampleUser?.moodComments.length,
        achievements: sampleUser?.achievements.map(
          (a: { achievement: { name: string; description: string; icon: string } }) => ({
            name: a.achievement.name,
            description: a.achievement.description,
            icon: a.achievement.icon,
          })
        ),
      },
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ status: 'error', message: 'Database connection error', error });
  }
}
