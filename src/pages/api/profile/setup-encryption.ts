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
 * /api/profile/setup-encryption:
 *   post:
 *     summary: Set up user encryption
 *     description: Sets up user encryption keys and optionally encrypted preferences
 *     tags:
 *       - Profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publicKey
 *               - salt
 *             properties:
 *               publicKey:
 *                 type: string
 *                 description: The user's public key
 *               salt:
 *                 type: string
 *                 description: Salt used for key derivation
 *               preferences:
 *                 type: object
 *                 description: Optional encrypted preferences
 *                 properties:
 *                   ciphertext:
 *                     type: string
 *                   nonce:
 *                     type: string
 *     responses:
 *       200:
 *         description: Encryption set up successfully
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
      message: 'You must be logged in to perform this action'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: `The ${req.method} method is not allowed for this endpoint`
    });
  }

  // Validate request body
  const { publicKey, salt, preferences } = req.body;

  if (!publicKey || !salt) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Public key and salt are required'
    });
  }

  try {
    // Using a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Check if user already has encryption key
      const existingKey = await tx.encryptionKey.findUnique({
        where: { userId }
      });

      if (existingKey) {
        // Update existing key
        const updatedKey = await tx.encryptionKey.update({
          where: { userId },
          data: {
            publicKey,
            salt,
            updatedAt: new Date()
          }
        });

        // If preferences are provided, update them too
        if (preferences) {
          const { ciphertext, nonce } = preferences as EncryptedData;
          
          const existingPrefs = await tx.encryptedPreferences.findUnique({
            where: { userId }
          });

          if (existingPrefs) {
            await tx.encryptedPreferences.update({
              where: { userId },
              data: {
                ciphertext,
                nonce,
                updatedAt: new Date()
              }
            });
          } else {
            await tx.encryptedPreferences.create({
              data: {
                userId,
                ciphertext,
                nonce
              }
            });
          }
        }

        return { updated: true, key: updatedKey };
      } else {
        // Create new encryption key
        const newKey = await tx.encryptionKey.create({
          data: {
            userId,
            publicKey,
            salt,
            user: { connect: { id: userId } }
          }
        });

        // If preferences are provided, create them
        if (preferences) {
          const { ciphertext, nonce } = preferences as EncryptedData;
          
          await tx.encryptedPreferences.create({
            data: {
              userId,
              ciphertext,
              nonce,
              user: { connect: { id: userId } }
            }
          });
        }

        return { created: true, key: newKey };
      }
    });

    return res.status(200).json({
      success: true,
      message: result.updated 
        ? 'Encryption settings updated successfully' 
        : 'Encryption set up successfully',
      data: {
        userId,
        publicKey,
        created: !result.updated,
        updated: result.updated
      }
    });
  } catch (error) {
    console.error('Error setting up encryption:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to set up encryption'
    });
  }
};

export default createApiHandler({
  methods: ['POST'],
  requireAuth: true
}, handler); 