import { NextApiRequest, NextApiResponse } from 'next';
import { createApiHandler, ApiError } from '@/lib/api/handlers';
import { db } from '@/lib/db/prisma';
import { z } from 'zod';

/**
 * @swagger
 * /api/profile/preferences:
 *   get:
 *     tags: [Preferences]
 *     summary: Get user preferences
 *     description: Retrieves the current user's preferences
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User preferences
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 theme:
 *                   type: string
 *                   enum: [light, dark, system]
 *                   example: system
 *                 emailNotifications:
 *                   type: boolean
 *                   example: true
 *                 pushNotifications:
 *                   type: boolean
 *                   example: true
 *                 weeklyDigest:
 *                   type: boolean
 *                   example: true
 *                 language:
 *                   type: string
 *                   example: en
 *                 timezone:
 *                   type: string
 *                   example: UTC
 *       401:
 *         description: Unauthorized - User is not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *   put:
 *     tags: [Preferences]
 *     summary: Replace all user preferences
 *     description: Replaces all existing user preferences with new values
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: string
 *                 enum: [light, dark, system]
 *               emailNotifications:
 *                 type: boolean
 *               pushNotifications:
 *                 type: boolean
 *               weeklyDigest:
 *                 type: boolean
 *               language:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 5
 *               timezone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Preferences updated successfully
 *                 preferences:
 *                   $ref: '#/components/schemas/Preferences'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *   patch:
 *     tags: [Preferences]
 *     summary: Update specific user preferences
 *     description: Updates only the specified user preferences, leaving others unchanged
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: string
 *                 enum: [light, dark, system]
 *               emailNotifications:
 *                 type: boolean
 *               pushNotifications:
 *                 type: boolean
 *               weeklyDigest:
 *                 type: boolean
 *               language:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 5
 *               timezone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Preferences updated successfully
 *                 preferences:
 *                   $ref: '#/components/schemas/Preferences'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Preferences:
 *       type: object
 *       properties:
 *         theme:
 *           type: string
 *           enum: [light, dark, system]
 *           example: system
 *         emailNotifications:
 *           type: boolean
 *           example: true
 *         pushNotifications:
 *           type: boolean
 *           example: true
 *         weeklyDigest:
 *           type: boolean
 *           example: true
 *         language:
 *           type: string
 *           example: en
 *         timezone:
 *           type: string
 *           example: UTC
 */

// Validation schema for user preferences - matches client-side interface
const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  language: z.string().min(2).max(5).optional(),
  timezone: z.string().optional(),
});

type Preferences = z.infer<typeof preferencesSchema>;

// Default preferences when none exist
const defaultPreferences: Preferences = {
  theme: 'system',
  emailNotifications: true,
  pushNotifications: true,
  weeklyDigest: true,
  language: 'en',
  timezone: 'UTC',
};

/**
 * Safely parse JSON string to Preferences object
 * @param jsonString - JSON string to parse
 * @returns Parsed preferences or default preferences
 */
function parsePreferences(jsonString: string | null | undefined): Preferences {
  if (!jsonString) {
    return { ...defaultPreferences };
  }
  
  try {
    const parsed = JSON.parse(jsonString);
    // Validate the parsed data against our schema
    return preferencesSchema.parse(parsed);
  } catch (error) {
    // If JSON parsing fails or schema validation fails, return defaults
    console.error('Error parsing preferences:', error);
    return { ...defaultPreferences };
  }
}

export default createApiHandler(
  {
    methods: ['GET', 'PUT', 'PATCH'],
    requireAuth: true,
    rateLimitType: 'general',
  },
  async (req, res, { userId }) => {
    try {
      // Ensure userId is a string - ApiHandler should guarantee this when requireAuth is true
      if (!userId) {
        throw ApiError.unauthorized('User ID is required');
      }

      // GET: Retrieve user preferences
      if (req.method === 'GET') {
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { 
            settings: true,
          },
        });
        
        if (!user) {
          throw ApiError.notFound('User not found');
        }
        
        // Parse stored settings or return defaults
        const preferences = parsePreferences(user.settings);
        
        return res.status(200).json(preferences);
      }
      
      // PUT/PATCH: Update user preferences
      if (req.method === 'PUT' || req.method === 'PATCH') {
        try {
          // Validate incoming data
          const validatedData = preferencesSchema.parse(req.body);
          
          // Check if there's anything to update
          if (Object.keys(validatedData).length === 0) {
            return res.status(400).json({ 
              message: 'No valid preferences provided to update' 
            });
          }
          
          // Get current settings
          const user = await db.user.findUnique({
            where: { id: userId },
            select: { settings: true },
          });
          
          if (!user) {
            throw ApiError.notFound('User not found');
          }
          
          // Get current settings or defaults
          const currentSettings = parsePreferences(user.settings);
              
          // Determine updated settings based on request method
          const updatedSettings = req.method === 'PUT' 
            ? { ...validatedData } // Replace all settings (PUT)
            : { ...currentSettings, ...validatedData }; // Merge with existing (PATCH)
          
          // Save to database
          await db.user.update({
            where: { id: userId },
            data: {
              settings: JSON.stringify(updatedSettings),
            },
          });
          
          return res.status(200).json({
            message: 'Preferences updated successfully',
            preferences: updatedSettings,
          });
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw ApiError.badRequest(`Invalid preferences data: ${error.message}`);
          }
          throw error; // Re-throw other errors
        }
      }
      
      // This should never happen due to method validation in createApiHandler
      throw ApiError.methodNotAllowed();
      
    } catch (error) {
      // Handle all other errors not caught in nested try-catch blocks
      if (error instanceof z.ZodError) {
        throw ApiError.badRequest(`Invalid preferences data: ${error.message}`);
      }
      if (error instanceof ApiError) {
        throw error; // Re-throw ApiError instances as-is
      }
      // Convert unknown errors to server errors
      console.error('Unhandled error in preferences API:', error);
      throw ApiError.serverError('An unexpected error occurred');
    }
  }
); 