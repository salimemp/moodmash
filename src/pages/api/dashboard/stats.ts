import { createApiHandler, ApiError } from '@/lib/api/handlers';
import { db } from '@/lib/db/prisma';
import { z } from 'zod';

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get user dashboard statistics
 *     description: Retrieves user-specific dashboard statistics including mood count, likes received, comments received, and recent activity
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 moodCount:
 *                   type: integer
 *                   description: Total number of moods created by the user
 *                   example: 25
 *                 likesReceived:
 *                   type: integer
 *                   description: Total number of likes received on user's moods
 *                   example: 42
 *                 commentsReceived:
 *                   type: integer
 *                   description: Total number of comments received on user's moods
 *                   example: 15
 *                 recentActivity:
 *                   type: array
 *                   description: List of recent mood activities
 *                   items:
 *                     $ref: '#/components/schemas/MoodActivity'
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp of when the stats were generated
 *                   example: '2023-01-01T12:00:00.000Z'
 *       401:
 *         description: Unauthorized - User is not authenticated
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MoodActivity:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique ID of the mood
 *           example: 'clq123abc456'
 *         emoji:
 *           type: string
 *           nullable: true
 *           description: Emoji representing the mood
 *           example: '😀'
 *         text:
 *           type: string
 *           nullable: true
 *           description: Text content of the mood
 *           example: 'Feeling great today!'
 *         colors:
 *           type: array
 *           description: Gradient colors of the mood
 *           items:
 *             type: string
 *             example: '#FF5733'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the mood was created
 *           example: '2023-01-01T10:30:00.000Z'
 *         likes:
 *           type: integer
 *           description: Number of likes on this mood
 *           example: 5
 *         comments:
 *           type: integer
 *           description: Number of comments on this mood
 *           example: 2
 */

// Define the schema for dashboard stats response
const statsResponseSchema = z.object({
  moodCount: z.number().int().nonnegative(),
  likesReceived: z.number().int().nonnegative(),
  commentsReceived: z.number().int().nonnegative(),
  recentActivity: z.array(
    z.object({
      id: z.string(),
      emoji: z.string().nullable(),
      text: z.string().nullable(),
      colors: z.array(z.string()),
      createdAt: z.string(),
      likes: z.number().int().nonnegative(),
      comments: z.number().int().nonnegative(),
    })
  ),
  lastUpdated: z.string(),
});

// Type definition based on the schema
type StatsResponse = z.infer<typeof statsResponseSchema>;

/**
 * Format recent activity data from database to a consistent structure
 */
function formatActivity(activity: any[]): StatsResponse['recentActivity'] {
  return activity.map(mood => ({
    id: mood.id,
    emoji: mood.emoji,
    text: mood.text,
    colors: mood.gradientColors,
    createdAt: mood.createdAt.toISOString(),
    likes: mood._count.moodLikes,
    comments: mood._count.moodComments,
  }));
}

export default createApiHandler(
  {
    methods: ['GET'],
    requireAuth: true,
    rateLimitType: 'general',
  },
  async (req, res, { userId }) => {
    try {
      // Ensure userId is a string
      if (!userId) {
        throw ApiError.unauthorized('User ID is required');
      }
      
      // Use a transaction to ensure data consistency across queries
      const [moodCount, likesReceived, commentsReceived, recentActivity] = await db.$transaction([
        // Get mood count
        db.mood.count({
          where: { userId },
        }),
        
        // Get likes received
        db.moodLike.count({
          where: {
            mood: {
              userId,
            },
          },
        }),
        
        // Get comments received
        db.moodComment.count({
          where: {
            mood: {
              userId,
            },
          },
        }),
        
        // Get recent activity with a single query
        db.mood.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            emoji: true,
            text: true,
            createdAt: true,
            gradientColors: true,
            _count: {
              select: {
                moodLikes: true,
                moodComments: true,
              },
            },
          },
        }),
      ]);
      
      // Format the data
      const formattedActivity = formatActivity(recentActivity);
      
      // Create the response object
      const statsData: StatsResponse = {
        moodCount,
        likesReceived,
        commentsReceived,
        recentActivity: formattedActivity,
        lastUpdated: new Date().toISOString(),
      };
      
      // Validate the response against our schema
      try {
        statsResponseSchema.parse(statsData);
      } catch (validationError) {
        console.error('Invalid stats data structure:', validationError);
        // If validation fails, we still return the data but log the error
        // This helps catch bugs in our formatting logic
      }
      
      // Return all stats
      return res.status(200).json(statsData);
    } catch (error: unknown) {
      console.error('Error fetching dashboard stats:', error);
      
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      
      // Handle database errors - check for Prisma-specific error structure
      const prismaError = error as { code?: string };
      if (prismaError.code && typeof prismaError.code === 'string' && prismaError.code.startsWith('P')) {
        // Prisma error codes start with P
        return res.status(500).json({ 
          message: 'Database error',
          code: prismaError.code 
        });
      }
      
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
); 