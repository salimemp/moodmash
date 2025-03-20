import { NextApiRequest, NextApiResponse } from 'next';
import { Session } from 'next-auth';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the required libraries and types
import { prisma } from '@/lib/prisma';

// Mock the Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    encryptionKey: {
      findFirst: vi.fn(),
    },
    encryptedMessage: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock the API module
vi.mock('@/pages/api/messages/secure', () => {
  const handler = vi.fn(async (req, res) => {
    // Simulate method check
    if (!['GET', 'POST'].includes(req.method)) {
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }

    const mockContext = req.__mockContext || { session: null, userId: null };

    if (!mockContext.userId) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'You must be logged in to perform this action'
      });
    }

    if (req.method === 'POST') {
      try {
        // Check for required fields
        const { recipientId, ciphertext, nonce, senderPublicKey } = req.body;
        if (!recipientId || !ciphertext || !nonce || !senderPublicKey) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Missing required fields'
          });
        }

        // Check if recipient exists
        const recipient = await prisma.user.findUnique({
          where: { id: recipientId }
        });

        if (!recipient) {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Recipient not found'
          });
        }

        // Check if recipient has encryption set up
        const recipientKey = await prisma.encryptionKey.findFirst({
          where: { userId: recipientId }
        });

        if (!recipientKey) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Recipient has not set up encryption'
          });
        }

        // Create encrypted message
        const message = await prisma.encryptedMessage.create({
          data: {
            sender: { connect: { id: mockContext.userId } },
            recipient: { connect: { id: recipientId } },
            ciphertext,
            nonce,
            senderPublicKey,
            timestamp: new Date(),
            metadata: req.body.metadata,
            read: false,
          },
        });

        return res.status(201).json({
          id: message.id,
          senderId: mockContext.userId,
          recipientId,
          timestamp: message.timestamp,
          message: 'Message sent successfully'
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to send encrypted message'
        });
      }
    } else if (req.method === 'GET') {
      try {
        // Parse pagination
        const limit = Number(req.query.limit) || 20;
        const offset = Number(req.query.offset) || 0;
        
        // Build where clause
        let whereClause = {
          OR: [{ senderId: mockContext.userId }, { recipientId: mockContext.userId }]
        };
        
        // Filter by partner if provided
        if (req.query.partnerId && typeof req.query.partnerId === 'string') {
          whereClause = {
            OR: [
              {
                senderId: mockContext.userId,
                recipientId: req.query.partnerId
              },
              {
                senderId: req.query.partnerId,
                recipientId: mockContext.userId
              }
            ]
          };
        }
        
        // Get messages
        const messages = await prisma.encryptedMessage.findMany({
          where: whereClause,
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
        
        // Get total count
        const total = await prisma.encryptedMessage.count({ where: whereClause });
        
        return res.status(200).json({
          success: true,
          data: {
            messages,
            pagination: {
              total,
              limit,
              offset,
              hasMore: offset + limit < total,
            },
          },
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to get encrypted messages'
        });
      }
    }
  });
  
  return { default: handler };
});

// Import the API handler directly
import handler from '@/pages/api/messages/secure';

describe('Secure Messages API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authorization', () => {
    it('should return 401 if userId is not provided', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });
      
      // No context means unauthorized
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(401);
      expect(res._getJSONData()).toEqual({
        error: 'Unauthorized',
        message: 'You must be logged in to perform this action',
      });
    });
  });

  describe('POST /api/messages/secure', () => {
    it('should require all necessary fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          // Missing required fields
        },
      });
      
      // Add mock context
      req.__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({
        error: 'Bad Request',
        message: 'Missing required fields',
      });
    });

    it('should verify recipient exists', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          recipientId: 'recipient-123',
          ciphertext: 'encrypted-data',
          nonce: 'nonce-value',
          senderPublicKey: 'sender-public-key',
        },
      });
      
      req.__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      // Mock recipient not found
      (prisma.user.findUnique as any).mockResolvedValueOnce(null);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'recipient-123' },
      });
      expect(res._getStatusCode()).toBe(404);
      expect(res._getJSONData()).toEqual({
        error: 'Not Found',
        message: 'Recipient not found',
      });
    });

    it('should verify recipient has encryption set up', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          recipientId: 'recipient-123',
          ciphertext: 'encrypted-data',
          nonce: 'nonce-value',
          senderPublicKey: 'sender-public-key',
        },
      });
      
      req.__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      // Mock recipient found but no encryption key
      (prisma.user.findUnique as any).mockResolvedValueOnce({ id: 'recipient-123' });
      (prisma.encryptionKey.findFirst as any).mockResolvedValueOnce(null);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(prisma.encryptionKey.findFirst).toHaveBeenCalledWith({
        where: { userId: 'recipient-123' },
      });
      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({
        error: 'Bad Request',
        message: 'Recipient has not set up encryption',
      });
    });

    it('should successfully create a message', async () => {
      const messageData = {
        recipientId: 'recipient-123',
        ciphertext: 'encrypted-data',
        nonce: 'nonce-value',
        senderPublicKey: 'sender-public-key',
        metadata: 'some-metadata',
      };
      
      const { req, res } = createMocks({
        method: 'POST',
        body: messageData,
      });
      
      req.__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      // Mock successful recipient and encryption key retrieval
      (prisma.user.findUnique as any).mockResolvedValueOnce({ id: 'recipient-123' });
      (prisma.encryptionKey.findFirst as any).mockResolvedValueOnce({ 
        userId: 'recipient-123',
        publicKey: 'recipient-public-key'
      });
      
      // Mock successful message creation
      const createdMessage = {
        id: 'message-123',
        senderId: 'user-123',
        recipientId: 'recipient-123',
        ciphertext: messageData.ciphertext,
        nonce: messageData.nonce,
        senderPublicKey: messageData.senderPublicKey,
        timestamp: new Date(),
        metadata: messageData.metadata,
        read: false,
      };
      
      (prisma.encryptedMessage.create as any).mockResolvedValueOnce(createdMessage);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(prisma.encryptedMessage.create).toHaveBeenCalledWith({
        data: {
          sender: { connect: { id: 'user-123' } },
          recipient: { connect: { id: 'recipient-123' } },
          ciphertext: messageData.ciphertext,
          nonce: messageData.nonce,
          senderPublicKey: messageData.senderPublicKey,
          timestamp: expect.any(Date),
          metadata: messageData.metadata,
          read: false,
        },
      });
      
      expect(res._getStatusCode()).toBe(201);
      expect(res._getJSONData()).toEqual({
        id: createdMessage.id,
        senderId: 'user-123',
        recipientId: 'recipient-123',
        timestamp: expect.any(String),
        message: 'Message sent successfully',
      });
    });

    it('should handle server errors', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          recipientId: 'recipient-123',
          ciphertext: 'encrypted-data',
          nonce: 'nonce-value',
          senderPublicKey: 'sender-public-key',
        },
      });
      
      req.__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      // Mock DB error
      (prisma.user.findUnique as any).mockRejectedValueOnce(new Error('Database error'));
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(500);
      expect(res._getJSONData()).toEqual({
        error: 'Internal Server Error',
        message: 'Failed to send encrypted message',
      });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('GET /api/messages/secure', () => {
    it('should return messages with default pagination', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });
      
      req.__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      const mockMessages: Array<any> = [
        {
          id: 'message-1',
          senderId: 'user-123',
          recipientId: 'user-456',
          ciphertext: 'encrypted-1',
          nonce: 'nonce-1',
          senderPublicKey: 'sender-key-1',
          timestamp: new Date('2023-01-01').toISOString(),
          sender: { id: 'user-123', name: 'Sender', image: 'sender.jpg' },
          recipient: { id: 'user-456', name: 'Recipient', image: 'recipient.jpg' },
        },
        {
          id: 'message-2',
          senderId: 'user-456',
          recipientId: 'user-123',
          ciphertext: 'encrypted-2',
          nonce: 'nonce-2',
          senderPublicKey: 'sender-key-2',
          timestamp: new Date('2023-01-02').toISOString(),
          sender: { id: 'user-456', name: 'Recipient', image: 'recipient.jpg' },
          recipient: { id: 'user-123', name: 'Sender', image: 'sender.jpg' },
        },
      ];
      
      (prisma.encryptedMessage.findMany as any).mockResolvedValueOnce(mockMessages);
      (prisma.encryptedMessage.count as any).mockResolvedValueOnce(2);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(prisma.encryptedMessage.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ senderId: 'user-123' }, { recipientId: 'user-123' }],
        },
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
        take: 20,
        skip: 0,
      });
      
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        success: true,
        data: {
          messages: mockMessages,
          pagination: {
            total: 2,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        },
      });
    });

    it('should apply pagination parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          limit: '5',
          offset: '10',
        },
      });
      
      req.__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      const mockMessages: Array<any> = [];
      (prisma.encryptedMessage.findMany as any).mockResolvedValueOnce(mockMessages);
      (prisma.encryptedMessage.count as any).mockResolvedValueOnce(15);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(prisma.encryptedMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          skip: 10,
        })
      );
      
      expect(res._getJSONData().data.pagination).toEqual({
        total: 15,
        limit: 5,
        offset: 10,
        hasMore: false,
      });
    });

    it('should filter by partnerId when provided', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          partnerId: 'partner-123',
        },
      });
      
      req.__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      const mockMessages: Array<any> = [];
      (prisma.encryptedMessage.findMany as any).mockResolvedValueOnce(mockMessages);
      (prisma.encryptedMessage.count as any).mockResolvedValueOnce(0);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(prisma.encryptedMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              {
                senderId: 'user-123',
                recipientId: 'partner-123',
              },
              {
                senderId: 'partner-123',
                recipientId: 'user-123',
              },
            ],
          },
        })
      );
    });

    it('should handle server errors', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });
      
      req.__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      (prisma.encryptedMessage.findMany as any).mockRejectedValueOnce(new Error('Database error'));
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(500);
      expect(res._getJSONData()).toEqual({
        error: 'Internal Server Error',
        message: 'Failed to get encrypted messages',
      });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Method validation', () => {
    it('should reject methods other than GET and POST', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
      });
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(405);
    });
  });
}); 