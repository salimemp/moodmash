import { NextApiRequest, NextApiResponse } from 'next';
import { Session } from 'next-auth';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the required libraries and types
import { prisma } from '@/lib/prisma';

// Mock the Prisma client - make sure it's using the right path
vi.mock('@/lib/prisma', () => {
  // Create a mock object with the same structure as prisma
  const prismaMock = {
    encryptedPreferences: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    encryptionKey: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  };
  
  // Return the mock object with the same property name as imported
  return {
    prisma: prismaMock
  };
});

// Expose the mocked prisma for use in tests
const mockedPrisma = prisma as unknown as {
  encryptedPreferences: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  encryptionKey: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  user: {
    findUnique: ReturnType<typeof vi.fn>;
  };
};

// Define types for the API handler
type ApiConfig = {
  methods: string[];
  requireAuth: boolean;
  rateLimitType?: string;
};

type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  context: { userId?: string; session?: Session | null }
) => Promise<void>;

// Mock the API context handler
vi.mock('@/lib/api/handlers', () => {
  const original = vi.importActual('@/lib/api/handlers');
  
  // Create a proper ApiError class for instanceof checks
  class ApiError extends Error {
    statusCode: number;
    
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
    
    static badRequest(message: string) {
      return new ApiError(message, 400);
    }
    
    static unauthorized(message: string) {
      return new ApiError(message, 401);
    }
    
    static notFound(message: string) {
      return new ApiError(message, 404);
    }
    
    static methodNotAllowed(message: string) {
      return new ApiError(message, 405);
    }
    
    static serverError(message: string) {
      return new ApiError(message, 500);
    }
  }
  
  return {
    ...original,
    ApiError,
    createApiHandler: (_config: ApiConfig, handler: ApiHandler) => {
      return (req: NextApiRequest, res: NextApiResponse) => {
        const userId = req.headers['x-user-id'] as string;
        // Create a properly typed session object
        const session = userId ? { 
          user: { id: userId },
          expires: new Date().toISOString() 
        } as Session : null;
        return handler(req, res, { userId, session });
      };
    },
  };
});

// Import the API handler
import handler from '@/pages/api/profile/encrypted-preferences';

describe('Encrypted Preferences API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Validation', () => {
    it('should return 401 if userId is not provided', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        // No x-user-id header = unauthorized
      });
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(401);
      expect(res._getJSONData()).toEqual({
        error: 'Unauthorized',
        message: 'You must be logged in to access this resource',
      });
    });
  });

  describe('Method Validation', () => {
    it('should return 405 for methods other than GET and PUT', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-user-id': 'user-123',
        },
      });
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(405);
      expect(res._getJSONData()).toEqual({
        error: 'Method Not Allowed',
        message: 'The POST method is not allowed for this endpoint',
      });
    });

    it('should handle DELETE method as not allowed', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        headers: {
          'x-user-id': 'user-123',
        },
      });
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(405);
    });
  });

  describe('GET Method', () => {
    it('should return encrypted preferences when they exist', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          'x-user-id': 'user-123',
        },
      });
      
      // Mock an encryption key exists for the user
      const mockEncryptionKey = {
        id: 'key-123',
        userId: 'user-123',
        publicKey: 'test-public-key',
        salt: 'test-salt',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(mockedPrisma.encryptionKey.findUnique).mockResolvedValueOnce(mockEncryptionKey);
      
      // Mock encrypted preferences
      const mockPreferences = {
        id: 'prefs-123',
        userId: 'user-123',
        ciphertext: 'encrypted-data',
        nonce: 'test-nonce',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(mockedPrisma.encryptedPreferences.findUnique).mockResolvedValueOnce(mockPreferences);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(mockedPrisma.encryptionKey.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
      
      expect(mockedPrisma.encryptedPreferences.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
      
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toMatchObject({
        success: true,
        data: {
          ciphertext: 'encrypted-data',
          nonce: 'test-nonce',
        },
      });
    });

    it('should return 404 when encrypted preferences do not exist', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          'x-user-id': 'user-123',
        },
      });
      
      // Mock encryption key exists
      vi.mocked(mockedPrisma.encryptionKey.findUnique).mockResolvedValueOnce({
        id: 'key-123',
        userId: 'user-123',
        publicKey: 'test-public-key',
        salt: 'test-salt',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Mock no preferences found
      vi.mocked(mockedPrisma.encryptedPreferences.findUnique).mockResolvedValueOnce(null);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(mockedPrisma.encryptionKey.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
      
      expect(mockedPrisma.encryptedPreferences.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
      
      expect(res._getStatusCode()).toBe(404);
      expect(res._getJSONData()).toEqual({
        error: 'Not Found',
        message: 'No encrypted preferences found',
      });
    });

    it('should handle server errors during GET', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          'x-user-id': 'user-123',
        },
      });
      
      // Mock encryption key exists
      vi.mocked(mockedPrisma.encryptionKey.findUnique).mockResolvedValueOnce({
        id: 'key-123',
        userId: 'user-123',
        publicKey: 'test-public-key',
        salt: 'test-salt',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Mock database error
      const error = new Error('Database error');
      vi.mocked(mockedPrisma.encryptedPreferences.findUnique).mockRejectedValueOnce(error);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(500);
      expect(res._getJSONData()).toEqual({
        error: 'Internal Server Error',
        message: 'Failed to retrieve encrypted preferences',
      });
    });

    it('should return 404 when user has not set up encryption', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          'x-user-id': 'user-123',
        },
      });
      
      // Mock that user exists but has no encryption key
      vi.mocked(mockedPrisma.encryptionKey.findUnique).mockResolvedValueOnce(null);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(mockedPrisma.encryptionKey.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
      
      expect(res._getStatusCode()).toBe(404);
      expect(res._getJSONData()).toEqual(expect.objectContaining({
        message: 'Encryption not set up for this user',
      }));
    });
  });

  describe('PUT Method', () => {
    it('should validate required fields', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        headers: {
          'x-user-id': 'user-123',
        },
        body: {
          // Missing required fields
        },
      });
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({
        error: 'Bad Request',
        message: 'Ciphertext and nonce are required',
      });
    });

    it('should update existing preferences', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        headers: {
          'x-user-id': 'user-123',
        },
        body: {
          ciphertext: 'updated-encrypted-data',
          nonce: 'updated-nonce',
        },
      });
      
      // Mock encryption key exists
      vi.mocked(mockedPrisma.encryptionKey.findUnique).mockResolvedValueOnce({
        id: 'key-123',
        userId: 'user-123',
        publicKey: 'test-public-key',
        salt: 'test-salt',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Mock existing preferences
      const existingPreferences = {
        id: 'prefs-123',
        userId: 'user-123',
        ciphertext: 'old-encrypted-data',
        nonce: 'old-nonce',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(mockedPrisma.encryptedPreferences.findUnique).mockResolvedValueOnce(existingPreferences);
      
      // Mock successful update
      const updatedPreferences = {
        ...existingPreferences,
        ciphertext: 'updated-encrypted-data',
        nonce: 'updated-nonce',
        updatedAt: new Date(),
      };
      
      vi.mocked(mockedPrisma.encryptedPreferences.update).mockResolvedValueOnce(updatedPreferences);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(mockedPrisma.encryptedPreferences.update).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: {
          ciphertext: 'updated-encrypted-data',
          nonce: 'updated-nonce',
          updatedAt: expect.any(Date),
        },
      });
      
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Preferences updated successfully',
      });
    });

    it('should create new preferences if they do not exist', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        headers: {
          'x-user-id': 'user-123',
        },
        body: {
          ciphertext: 'new-encrypted-data',
          nonce: 'new-nonce',
        },
      });
      
      // Mock encryption key exists
      vi.mocked(mockedPrisma.encryptionKey.findUnique).mockResolvedValueOnce({
        id: 'key-123',
        userId: 'user-123',
        publicKey: 'test-public-key',
        salt: 'test-salt',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Mock no existing preferences
      vi.mocked(mockedPrisma.encryptedPreferences.findUnique).mockResolvedValueOnce(null);
      
      // Mock successful creation
      const createdPreferences = {
        id: 'prefs-123',
        userId: 'user-123',
        ciphertext: 'new-encrypted-data',
        nonce: 'new-nonce',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(mockedPrisma.encryptedPreferences.create).mockResolvedValueOnce(createdPreferences);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(mockedPrisma.encryptedPreferences.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          ciphertext: 'new-encrypted-data',
          nonce: 'new-nonce',
        },
      });
      
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Preferences updated successfully',
      });
    });

    it('should handle server errors during PUT', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        headers: {
          'x-user-id': 'user-123',
        },
        body: {
          ciphertext: 'test-encrypted-data',
          nonce: 'test-nonce',
        },
      });
      
      // Mock encryption key exists
      vi.mocked(mockedPrisma.encryptionKey.findUnique).mockResolvedValueOnce({
        id: 'key-123',
        userId: 'user-123',
        publicKey: 'test-public-key',
        salt: 'test-salt',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Mock database error
      const error = new Error('Database error');
      vi.mocked(mockedPrisma.encryptedPreferences.findUnique).mockRejectedValueOnce(error);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(500);
      expect(res._getJSONData()).toEqual({
        error: 'Internal Server Error',
        message: 'Failed to update encrypted preferences',
      });
    });

    it('should return 400 when user has not set up encryption', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        headers: {
          'x-user-id': 'user-123',
        },
        body: {
          ciphertext: 'encrypted-data',
          nonce: 'test-nonce',
        },
      });
      
      // Mock that user has no encryption key
      vi.mocked(mockedPrisma.encryptionKey.findUnique).mockResolvedValueOnce(null);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(mockedPrisma.encryptionKey.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
      
      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual(expect.objectContaining({
        message: 'You must set up encryption before saving preferences',
      }));
    });
  });
}); 