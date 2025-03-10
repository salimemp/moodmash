import { NextApiRequest, NextApiResponse } from 'next';
import { createApiHandler } from '@/lib/api/handlers';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';
import { EncryptedData } from '@/lib/encryption/crypto';

// Define interface to match ApiContext
interface ApiContext {
  session: Session | null;
  userId: string | null;
}

/**
 * @swagger
 * /api/profile/encrypted-preferences:
 *   get:
 *     summary: Get encrypted user preferences
 *     description: Retrieves the user's encrypted preferences
 *     tags:
 *       - Profile
 *     responses:
 *       200:
 *         description: Encrypted preferences retrieved successfully
 *       404:
 *         description: Encrypted preferences not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update encrypted user preferences
 *     description: Updates the user's encrypted preferences
 *     tags:
 *       - Profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ciphertext
 *               - nonce
 *             properties:
 *               ciphertext:
 *                 type: string
 *                 description: The encrypted preferences data
 *               nonce:
 *                 type: string
 *                 description: The nonce used for encryption
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

const handler = async (req: NextApiRequest, res: NextApiResponse, context: ApiContext) => {
  const { userId } = context;

  if (!userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource'
    });
  }

  // GET endpoint to retrieve encrypted preferences
  if (req.method === 'GET') {
    try {
      // Check if user has encryption set up
      const encryptionKey = await prisma.encryptionKey.findUnique({
        where: { userId }
      });

      if (!encryptionKey) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Encryption not set up for this user'
        });
      }

      // Get user's encrypted preferences
      const encryptedPrefs = await prisma.encryptedPreferences.findUnique({
        where: { userId }
      });

      if (!encryptedPrefs) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'No encrypted preferences found'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          ciphertext: encryptedPrefs.ciphertext,
          nonce: encryptedPrefs.nonce,
          updatedAt: encryptedPrefs.updatedAt
        }
      });
    } catch (error) {
      console.error('Error retrieving encrypted preferences:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve encrypted preferences'
      });
    }
  }
  // PUT endpoint to update encrypted preferences
  else if (req.method === 'PUT') {
    try {
      const { ciphertext, nonce } = req.body as EncryptedData;

      if (!ciphertext || !nonce) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Ciphertext and nonce are required'
        });
      }

      // Verify user has encryption set up
      const encryptionKey = await prisma.encryptionKey.findUnique({
        where: { userId }
      });

      if (!encryptionKey) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'You must set up encryption before saving preferences'
        });
      }

      // Check if preferences already exist
      const existingPrefs = await prisma.encryptedPreferences.findUnique({
        where: { userId }
      });

      let updatedPrefs;

      if (existingPrefs) {
        // Update existing preferences
        updatedPrefs = await prisma.encryptedPreferences.update({
          where: { userId },
          data: {
            ciphertext,
            nonce,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new preferences
        updatedPrefs = await prisma.encryptedPreferences.create({
          data: {
            userId,
            ciphertext,
            nonce,
            user: { connect: { id: userId } }
          }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Preferences updated successfully',
        data: {
          updatedAt: updatedPrefs.updatedAt
        }
      });
    } catch (error) {
      console.error('Error updating encrypted preferences:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update encrypted preferences'
      });
    }
  } else {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: `The ${req.method} method is not allowed for this endpoint`
    });
  }
};

export default createApiHandler({
  methods: ['GET', 'PUT'],
  requireAuth: true
}, handler); 