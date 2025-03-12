import { createApiHandler } from '@/lib/api/handlers';
import { prisma } from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

/**
 * @swagger
 * /api/users/{id}/public-key:
 *   get:
 *     summary: Get user's public key
 *     description: Retrieves the public key for a specific user
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: Public key retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 publicKey:
 *                   type: string
 *                   description: The user's public key
 *                 userId:
 *                   type: string
 *                   description: The user ID
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: When the key was created
 *       404:
 *         description: User or public key not found
 *       500:
 *         description: Server error
 */

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Extract user ID from the URL params
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'User ID is required',
    });
  }

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    // Retrieve the user's public key
    const encryptionKey = await prisma.encryptionKey.findUnique({
      where: { userId: id },
      select: {
        publicKey: true,
        userId: true,
        createdAt: true,
      },
    });

    if (!encryptionKey) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Public key not found for this user',
      });
    }

    return res.status(200).json({
      publicKey: encryptionKey.publicKey,
      userId: encryptionKey.userId,
      createdAt: encryptionKey.createdAt,
    });
  } catch (error) {
    console.error('Error fetching user public key:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user public key',
    });
  }
};

export default createApiHandler(
  {
    methods: ['GET'],
    requireAuth: true,
  },
  handler
);
