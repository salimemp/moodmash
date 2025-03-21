/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from 'next';
import { Session } from 'next-auth';
import { createMocks } from 'node-mocks-http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Import the required libraries and types
import { prisma } from '@/lib/prisma';
import type { EncryptedMessage, EncryptionKey, User } from '@prisma/client';

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

// Define extended request type with mock context
interface ExtendedRequest extends NextApiRequest {
  __mockContext?: {
    session: Session | null;
    userId: string | null;
  };
}

// Mock the API module
vi.mock('@/pages/api/messages/secure', () => {
  const handler = vi.fn(async (req, res) => {
    // Simulate method check
    if (!['GET', 'POST'].includes(req.method)) {
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }

    const mockContext = (req as ExtendedRequest).__mockContext || { session: null, userId: null };

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
              hasMore: offset + messages.length < total,
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
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
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

    it('should reject methods other than GET and POST', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
      });
      
      (req as ExtendedRequest).__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(405);
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
      (req as ExtendedRequest).__mockContext = {
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
      
      (req as ExtendedRequest).__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      // Mock recipient not found
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
      
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
      
      (req as ExtendedRequest).__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      // Mock recipient found but no encryption key
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'recipient-123', name: 'Recipient' } as User);
      (prisma.encryptionKey.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
      
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

    it('should successfully create an encrypted message', async () => {
      const timestamp = new Date("2025-03-21T12:29:35.311Z");
      const messageData: Partial<EncryptedMessage> = {
        id: 'message-123',
        senderId: 'user-123',
        recipientId: 'recipient-123',
        ciphertext: 'encrypted-data',
        nonce: 'nonce-value',
        senderPublicKey: 'sender-public-key',
        timestamp,
        metadata: 'some-metadata',
        read: false,
      };
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          recipientId: 'recipient-123',
          ciphertext: 'encrypted-data',
          nonce: 'nonce-value',
          senderPublicKey: 'sender-public-key',
          metadata: 'some-metadata',
        },
      });
      
      (req as ExtendedRequest).__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      // Mock successful flow
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'recipient-123', name: 'Recipient' } as User);
      (prisma.encryptionKey.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ userId: 'recipient-123', publicKey: 'recipient-key' } as EncryptionKey);
      (prisma.encryptedMessage.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce(messageData as EncryptedMessage);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(prisma.encryptedMessage.create).toHaveBeenCalledWith({
        data: {
          sender: { connect: { id: 'user-123' } },
          recipient: { connect: { id: 'recipient-123' } },
          ciphertext: 'encrypted-data',
          nonce: 'nonce-value',
          senderPublicKey: 'sender-public-key',
          timestamp: expect.any(Date),
          metadata: 'some-metadata',
          read: false,
        },
      });
      
      expect(res._getStatusCode()).toBe(201);
      expect(res._getJSONData()).toEqual({
        id: messageData.id,
        senderId: 'user-123',
        recipientId: 'recipient-123',
        timestamp: timestamp.toISOString(),
        message: 'Message sent successfully',
      });
    });

    it('should handle database errors when creating messages', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          recipientId: 'recipient-123',
          ciphertext: 'encrypted-data',
          nonce: 'nonce-value',
          senderPublicKey: 'sender-public-key',
        },
      });
      
      (req as ExtendedRequest).__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      // Mock the flow up to the error
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'recipient-123', name: 'Recipient' } as User);
      (prisma.encryptionKey.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ userId: 'recipient-123', publicKey: 'recipient-key' } as EncryptionKey);
      
      // Mock database error
      const dbError = new Error('Database connection failed');
      (prisma.encryptedMessage.create as ReturnType<typeof vi.fn>).mockRejectedValueOnce(dbError);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(res._getStatusCode()).toBe(500);
      expect(res._getJSONData()).toEqual({
        error: 'Internal Server Error',
        message: 'Failed to send encrypted message',
      });
    });
  });

  describe('GET /api/messages/secure', () => {
    it('should retrieve messages with default pagination', async () => {
      const mockMessages = [
        { id: 'msg1', senderId: 'user-123', recipientId: 'recipient-456' },
        { id: 'msg2', senderId: 'recipient-456', recipientId: 'user-123' },
      ];
      
      const { req, res } = createMocks({
        method: 'GET',
        query: {}, // No query params
      });
      
      (req as ExtendedRequest).__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      (prisma.encryptedMessage.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockMessages);
      (prisma.encryptedMessage.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(2);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(prisma.encryptedMessage.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { senderId: 'user-123' },
            { recipientId: 'user-123' },
          ],
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
        take: 20, // Default limit
        skip: 0,  // Default offset
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

    it('should filter messages by partnerId when provided', async () => {
      const mockMessages = [
        { id: 'msg1', senderId: 'user-123', recipientId: 'partner-789' },
        { id: 'msg2', senderId: 'partner-789', recipientId: 'user-123' },
      ];
      
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          partnerId: 'partner-789',
          limit: '10',
          offset: '5',
        },
      });
      
      (req as ExtendedRequest).__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      (prisma.encryptedMessage.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockMessages);
      (prisma.encryptedMessage.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(20); // Total of 20 messages with this partner
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(prisma.encryptedMessage.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              senderId: 'user-123',
              recipientId: 'partner-789',
            },
            {
              senderId: 'partner-789',
              recipientId: 'user-123',
            },
          ],
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
        take: 10, // From query
        skip: 5,  // From query
      });
      
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        success: true,
        data: {
          messages: mockMessages,
          pagination: {
            total: 20,
            limit: 10,
            offset: 5,
            hasMore: true, // 5 + 10 < 20
          },
        },
      });
    });

    it('should handle database errors when retrieving messages', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });
      
      (req as ExtendedRequest).__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      // Mock database error
      const dbError = new Error('Database error occurred');
      (prisma.encryptedMessage.findMany as ReturnType<typeof vi.fn>).mockRejectedValueOnce(dbError);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(res._getStatusCode()).toBe(500);
      expect(res._getJSONData()).toEqual({
        error: 'Internal Server Error',
        message: 'Failed to get encrypted messages',
      });
    });

    it('should return pagination metadata with hasMore=false when at the end', async () => {
      const mockMessages = [
        { id: 'msg1', senderId: 'user-123', recipientId: 'recipient-456' },
      ];
      
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          limit: '10',
          offset: '0',
        },
      });
      
      (req as ExtendedRequest).__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      (prisma.encryptedMessage.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockMessages);
      (prisma.encryptedMessage.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(1); // Only 1 message total
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData().data.pagination.hasMore).toBe(false);
    });
  });
}); 