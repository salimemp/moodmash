import { NextApiRequest, NextApiResponse } from 'next';
import { Session } from 'next-auth';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the required libraries and types
import { prisma } from '@/lib/prisma';

// Create transaction client mock functions - use more direct mocking approach
const encryptionKeyMock = {
  findUnique: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
};

const encryptedPreferencesMock = {
  findUnique: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
};

// Mock Prisma client
vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      $transaction: vi.fn((callback) => {
        const txClient = {
          encryptionKey: encryptionKeyMock,
          encryptedPreferences: encryptedPreferencesMock,
        };
        return Promise.resolve(callback(txClient));
      }),
    },
  };
});

// Import handler after mocks are set up
import handler from '@/pages/api/profile/setup-encryption';

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
        
        // Extract context from req.__mockContext if available for testing
        const mockContext = (req as any).__mockContext || { 
          session,
          userId: session?.user?.id 
        };
        
        return handler(req, res, mockContext);
      };
    },
    rateLimit: vi.fn(() => Promise.resolve({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000,
    })),
  };
});

// Replace headers with mock context approach with x-user-id header
function setupRequestWithUser(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', body: any = {}) {
  return createMocks({
    method,
    headers: {
      'x-user-id': 'user-123',
    },
    body,
  });
}

describe('Setup Encryption API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mocks before each test
    encryptionKeyMock.findUnique.mockReset();
    encryptionKeyMock.update.mockReset();
    encryptionKeyMock.create.mockReset();
    encryptedPreferencesMock.findUnique.mockReset();
    encryptedPreferencesMock.update.mockReset();
    encryptedPreferencesMock.create.mockReset();
  });

  describe('Authentication and Method Validation', () => {
    it('should return 401 if userId is not provided', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        // No x-user-id header = unauthorized
      });
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(401);
      expect(res._getJSONData()).toEqual({
        error: 'Unauthorized',
        message: 'You must be logged in to perform this action',
      });
    });

    it('should return 405 for non-POST methods', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          'x-user-id': 'user-123',
        },
      });
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(405);
      expect(res._getJSONData()).toEqual({
        error: 'Method Not Allowed',
        message: 'The GET method is not allowed for this endpoint',
      });
    });
  });

  describe('Input Validation', () => {
    it('should return 400 if publicKey or salt is missing', async () => {
      const { req, res } = createMocks({
        method: 'POST',
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
        message: 'Public key and salt are required',
      });
    });

    it('should return 400 if only publicKey is provided', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-user-id': 'user-123',
        },
        body: {
          publicKey: 'test-public-key',
          // Missing salt
        },
      });
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({
        error: 'Bad Request',
        message: 'Public key and salt are required',
      });
    });
  });

  describe('Creating New Encryption Setup', () => {
    it('should create new encryption setup', async () => {
      const { req, res } = setupRequestWithUser('POST', {
        publicKey: 'test-public-key',
        salt: 'test-salt',
      });
      
      // Mock that user doesn't have existing encryption key
      encryptionKeyMock.findUnique.mockResolvedValueOnce(null);
      
      // Mock successful creation
      const createdKey = {
        id: 'key-123',
        userId: 'user-123',
        publicKey: 'test-public-key',
        salt: 'test-salt',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      encryptionKeyMock.create.mockResolvedValueOnce(createdKey);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(encryptionKeyMock.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
      
      expect(encryptionKeyMock.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          publicKey: 'test-public-key',
          salt: 'test-salt',
          user: { connect: { id: 'user-123' } },
        },
      });
      
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        success: true,
        message: 'Encryption set up successfully',
        data: {
          userId: 'user-123',
          publicKey: 'test-public-key',
          created: true,
        },
      });
    });

    it('should create new encryption setup with preferences', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          publicKey: 'test-public-key',
          salt: 'test-salt',
          preferences: {
            ciphertext: 'encrypted-preferences',
            nonce: 'test-nonce',
          },
        },
      });
      
      req.__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      // Mock that user doesn't have existing encryption key
      encryptionKeyMock.findUnique.mockResolvedValueOnce(null);
      
      // Mock successful creation
      const createdKey = {
        id: 'key-123',
        userId: 'user-123',
        publicKey: 'test-public-key',
        salt: 'test-salt',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      encryptionKeyMock.create.mockResolvedValueOnce(createdKey);
      
      // Mock preferences creation
      const createdPreferences = {
        id: 'prefs-123',
        userId: 'user-123',
        ciphertext: 'encrypted-preferences',
        nonce: 'test-nonce',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      encryptedPreferencesMock.create.mockResolvedValueOnce(createdPreferences);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(encryptionKeyMock.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          publicKey: 'test-public-key',
          salt: 'test-salt',
          user: { connect: { id: 'user-123' } },
        },
      });
      
      expect(encryptedPreferencesMock.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          ciphertext: 'encrypted-preferences',
          nonce: 'test-nonce',
          user: { connect: { id: 'user-123' } },
        },
      });
      
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        success: true,
        message: 'Encryption set up successfully',
        data: {
          userId: 'user-123',
          publicKey: 'test-public-key',
          created: true,
        },
      });
    });
  });

  describe('Updating Existing Encryption Setup', () => {
    it('should update existing encryption setup', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          publicKey: 'updated-public-key',
          salt: 'updated-salt',
        },
      });
      
      req.__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      // Mock that user has existing encryption key
      const existingKey = {
        id: 'key-123',
        userId: 'user-123',
        publicKey: 'old-public-key',
        salt: 'old-salt',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      encryptionKeyMock.findUnique.mockResolvedValueOnce(existingKey);
      
      // Mock successful update
      const updatedKey = {
        ...existingKey,
        publicKey: 'updated-public-key',
        salt: 'updated-salt',
        updatedAt: new Date(),
      };
      
      encryptionKeyMock.update.mockResolvedValueOnce(updatedKey);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(encryptionKeyMock.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
      
      expect(encryptionKeyMock.update).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: {
          publicKey: 'updated-public-key',
          salt: 'updated-salt',
          updatedAt: expect.any(Date),
        },
      });
      
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        success: true,
        message: 'Encryption settings updated successfully',
        data: {
          userId: 'user-123',
          publicKey: 'updated-public-key',
          created: false,
          updated: true,
        },
      });
    });

    it('should update existing encryption setup and create new preferences', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          publicKey: 'updated-public-key',
          salt: 'updated-salt',
          preferences: {
            ciphertext: 'new-encrypted-preferences',
            nonce: 'new-nonce',
          },
        },
      });
      
      req.__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      // Mock that user has existing encryption key
      const existingKey = {
        id: 'key-123',
        userId: 'user-123',
        publicKey: 'old-public-key',
        salt: 'old-salt',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      encryptionKeyMock.findUnique.mockResolvedValueOnce(existingKey);
      
      // Mock successful update
      const updatedKey = {
        ...existingKey,
        publicKey: 'updated-public-key',
        salt: 'updated-salt',
        updatedAt: new Date(),
      };
      
      encryptionKeyMock.update.mockResolvedValueOnce(updatedKey);
      
      // Mock that user doesn't have existing preferences
      encryptedPreferencesMock.findUnique.mockResolvedValueOnce(null);
      
      // Mock preferences creation
      const createdPreferences = {
        id: 'prefs-123',
        userId: 'user-123',
        ciphertext: 'new-encrypted-preferences',
        nonce: 'new-nonce',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      encryptedPreferencesMock.create.mockResolvedValueOnce(createdPreferences);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(encryptionKeyMock.update).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: {
          publicKey: 'updated-public-key',
          salt: 'updated-salt',
          updatedAt: expect.any(Date),
        },
      });
      
      expect(encryptedPreferencesMock.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
      
      expect(encryptedPreferencesMock.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          ciphertext: 'new-encrypted-preferences',
          nonce: 'new-nonce',
        },
      });
      
      expect(res._getStatusCode()).toBe(200);
    });

    it('should update existing encryption setup and update existing preferences', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          publicKey: 'updated-public-key',
          salt: 'updated-salt',
          preferences: {
            ciphertext: 'updated-encrypted-preferences',
            nonce: 'updated-nonce',
          },
        },
      });
      
      req.__mockContext = {
        session: { user: { id: 'user-123' }, expires: new Date().toISOString() } as Session,
        userId: 'user-123',
      };
      
      // Mock that user has existing encryption key
      const existingKey = {
        id: 'key-123',
        userId: 'user-123',
        publicKey: 'old-public-key',
        salt: 'old-salt',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      encryptionKeyMock.findUnique.mockResolvedValueOnce(existingKey);
      
      // Mock successful update
      const updatedKey = {
        ...existingKey,
        publicKey: 'updated-public-key',
        salt: 'updated-salt',
        updatedAt: new Date(),
      };
      
      encryptionKeyMock.update.mockResolvedValueOnce(updatedKey);
      
      // Mock that user has existing preferences
      const existingPreferences = {
        id: 'prefs-123',
        userId: 'user-123',
        ciphertext: 'old-encrypted-preferences',
        nonce: 'old-nonce',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      encryptedPreferencesMock.findUnique.mockResolvedValueOnce(existingPreferences);
      
      // Mock preferences update
      const updatedPreferences = {
        ...existingPreferences,
        ciphertext: 'updated-encrypted-preferences',
        nonce: 'updated-nonce',
        updatedAt: new Date(),
      };
      
      encryptedPreferencesMock.update.mockResolvedValueOnce(updatedPreferences);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(encryptedPreferencesMock.update).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: {
          ciphertext: 'updated-encrypted-preferences',
          nonce: 'updated-nonce',
          updatedAt: expect.any(Date),
        },
      });
      
      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-user-id': 'user-123',
        },
        body: {
          publicKey: 'test-public-key',
          salt: 'test-salt',
        },
      });
      
      // Mock a database error
      const error = new Error('Database error');
      // Mock transaction rejection
      vi.mocked(prisma.$transaction).mockRejectedValueOnce(error);
      
      // Avoid actually logging errors during tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      // Just check that console.error was called, don't check specific arguments
      expect(consoleSpy).toHaveBeenCalled();
      expect(res._getStatusCode()).toBe(500);
      expect(res._getJSONData()).toEqual({
        error: 'Internal Server Error',
        message: 'Failed to set up encryption',
      });
      
      consoleSpy.mockRestore();
    });
  });
}); 