import { createApiHandler } from '@/lib/api/handlers';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { Session } from 'next-auth';

// Define interface to match ApiContext
interface ApiContext {
  session: Session | null;
  userId: string | null;
}

/**
 * @swagger
 * /api/messages/secure:
 *   post:
 *     summary: Send encrypted message
 *     description: Sends an encrypted message to another user
 *     tags:
 *       - Messages
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - ciphertext
 *               - nonce
 *               - senderPublicKey
 *             properties:
 *               recipientId:
 *                 type: string
 *                 description: The recipient's user ID
 *               ciphertext:
 *                 type: string
 *                 description: The encrypted message content
 *               nonce:
 *                 type: string
 *                 description: The nonce used for encryption
 *               senderPublicKey:
 *                 type: string
 *                 description: The sender's public key
 *               metadata:
 *                 type: string
 *                 description: Optional metadata for the message
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *   get:
 *     summary: Get encrypted messages
 *     description: Retrieves encrypted messages for the authenticated user
 *     tags:
 *       - Messages
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of messages to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of messages to skip
 *       - in: query
 *         name: partnerId
 *         schema:
 *           type: string
 *         description: Filter messages to/from a specific user
 *     responses:
 *       200:
 *         description: Retrieved messages successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

// Handler for sending and receiving encrypted messages
const handler = async (req: NextApiRequest, res: NextApiResponse, context: ApiContext) => {
  const { userId } = context;

  if (!userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to perform this action',
    });
  }

  if (req.method === 'POST') {
    // Parse request body
    const { recipientId, ciphertext, nonce, senderPublicKey, metadata } = req.body;

    if (!recipientId || !ciphertext || !nonce || !senderPublicKey) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields',
      });
    }

    try {
      // Verify recipient exists
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
      });

      if (!recipient) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Recipient not found',
        });
      }

      // Get recipient public key to verify they have encryption set up
      const recipientPublicKey = await prisma.encryptionKey.findFirst({
        where: { userId: recipientId },
      });

      if (!recipientPublicKey) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Recipient has not set up encryption',
        });
      }

      // Store encrypted message
      const message = await prisma.encryptedMessage.create({
        data: {
          sender: { connect: { id: userId } },
          recipient: { connect: { id: recipientId } },
          ciphertext,
          nonce,
          senderPublicKey,
          timestamp: new Date(),
          metadata: metadata || null,
          read: false,
        },
      });

      return res.status(201).json({
        id: message.id,
        senderId: userId,
        recipientId,
        timestamp: message.timestamp,
        message: 'Message sent successfully',
      });
    } catch (error) {
      console.error('Error sending encrypted message:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to send encrypted message',
      });
    }
  } else if (req.method === 'GET') {
    try {
      // Get query parameters with defaults
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const partnerId = req.query.partnerId as string | undefined;

      // Build where conditions
      const whereCondition: Prisma.EncryptedMessageWhereInput = {
        OR: [{ senderId: userId }, { recipientId: userId }],
      };

      // If partnerId is provided, filter messages to/from that user
      if (partnerId) {
        whereCondition.OR = [
          {
            senderId: userId,
            recipientId: partnerId,
          },
          {
            senderId: partnerId,
            recipientId: userId,
          },
        ];
      }

      // Get messages
      const messages = await prisma.encryptedMessage.findMany({
        where: whereCondition,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          recipient: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: limit,
        skip: offset,
      });

      // Get total count for pagination
      const totalCount = await prisma.encryptedMessage.count({
        where: whereCondition,
      });

      return res.status(200).json({
        success: true,
        data: {
          messages,
          pagination: {
            total: totalCount,
            limit,
            offset,
            hasMore: offset + messages.length < totalCount,
          },
        },
      });
    } catch (error) {
      console.error('Error getting encrypted messages:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get encrypted messages',
      });
    }
  }
};

export default createApiHandler(
  {
    methods: ['GET', 'POST'],
    requireAuth: true,
  },
  handler
);
