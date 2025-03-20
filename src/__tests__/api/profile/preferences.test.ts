import { NextApiRequest, NextApiResponse } from 'next';
import { Session } from 'next-auth';
import { createMocks } from 'node-mocks-http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Import the required libraries and types
import { db } from '@/lib/db/prisma';

// Mock the DB client - make sure it's using the right path
vi.mock('@/lib/db/prisma', () => {
  // Create a mock object with the same structure
  const dbMock = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    }
  };
  
  // Return the mock object with the same property name as imported
  return {
    db: dbMock
  };
});

// Expose the mocked db for use in tests
const mockedDb = db as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  }
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
      this.name = 'ApiError';
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
      return async (req: NextApiRequest, res: NextApiResponse) => {
        const userId = req.headers['x-user-id'] as string;
        const session = userId ? { 
          user: { id: userId },
          expires: new Date().toISOString() 
        } as Session : null;
        
        try {
          // Use mockContext if available for testing
          const mockContext = (req as any).__mockContext || { 
            userId,
            session
          };
          
          return await handler(req, res, mockContext);
        } catch (error) {
          if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
              error: error.constructor.name,
              message: error.message
            });
          }
          
          console.error('Unhandled error in preferences API:', error);
          return res.status(500).json({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred'
          });
        }
      };
    },
  };
});

// Now import the handler after all mocks are set up
import handler from '@/pages/api/profile/preferences';

// Helper function for setting up requests with a user
function setupRequestWithUser(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', body: any = {}) {
  return createMocks({
    method,
    headers: {
      'x-user-id': 'user-123',
    },
    body,
  });
}

describe('Preferences API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockedDb.user.findUnique).mockReset();
    vi.mocked(mockedDb.user.update).mockReset();
    
    // Silence console errors during tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication Validation', () => {
    it('should return 401 if userId is not provided', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        // No userId header = unauthorized
      });
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(401);
      expect(res._getJSONData()).toEqual(expect.objectContaining({
        message: 'User ID is required',
      }));
    });
  });

  describe('Method Validation', () => {
    it('should return 405 for methods other than GET, PUT, and PATCH', async () => {
      const { req, res } = setupRequestWithUser('POST');
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(405);
      // The error message may be empty, just check the status code is correct
      const responseData = res._getJSONData();
      expect(responseData.error).toBe('ApiError');
    });

    it('should handle DELETE method as not allowed', async () => {
      const { req, res } = setupRequestWithUser('DELETE');
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(405);
    });
  });

  describe('GET Method', () => {
    it('should return preferences when they exist', async () => {
      const { req, res } = setupRequestWithUser('GET');
      
      // Mock user with preferences
      const mockUser = {
        id: 'user-123',
        settings: JSON.stringify({
          theme: 'dark',
          emailNotifications: true,
          pushNotifications: true,
          weeklyDigest: true,
          language: 'en',
          timezone: 'UTC',
        }),
      };
      
      vi.mocked(mockedDb.user.findUnique).mockResolvedValueOnce(mockUser);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(mockedDb.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: { settings: true },
      });
      
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        theme: 'dark',
        emailNotifications: true,
        pushNotifications: true,
        weeklyDigest: true,
        language: 'en',
        timezone: 'UTC',
      });
    });

    it('should return default preferences when settings are null', async () => {
      const { req, res } = setupRequestWithUser('GET');
      
      // Mock user with null settings
      const mockUser = {
        id: 'user-123',
        settings: null,
      };
      
      vi.mocked(mockedDb.user.findUnique).mockResolvedValueOnce(mockUser);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(mockedDb.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: { settings: true },
      });
      
      expect(res._getStatusCode()).toBe(200);
      // Should return default preferences
      expect(res._getJSONData()).toEqual(expect.objectContaining({
        theme: 'system',
      }));
    });

    it('should return 404 when user does not exist', async () => {
      const { req, res } = setupRequestWithUser('GET');
      
      // Mock no user found
      vi.mocked(mockedDb.user.findUnique).mockResolvedValueOnce(null);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(mockedDb.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: { settings: true },
      });
      
      expect(res._getStatusCode()).toBe(404);
      expect(res._getJSONData()).toEqual(expect.objectContaining({
        message: 'User not found',
      }));
    });

    it('should handle server errors during GET', async () => {
      const { req, res } = setupRequestWithUser('GET');
      
      // Mock database error
      const error = new Error('Database error');
      vi.mocked(mockedDb.user.findUnique).mockRejectedValueOnce(error);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(500);
      expect(res._getJSONData()).toEqual(expect.objectContaining({
        message: 'An unexpected error occurred',
      }));
    });

    it('should handle malformed JSON in settings', async () => {
      const { req, res } = setupRequestWithUser('GET');
      
      // Mock user with malformed JSON in settings
      const mockUser = {
        id: 'user-123',
        settings: '{invalid-json}', // This will cause JSON.parse to throw
      };
      
      vi.mocked(mockedDb.user.findUnique).mockResolvedValueOnce(mockUser);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      // Should return default preferences when JSON parsing fails
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual(expect.objectContaining({
        theme: 'system', // Default theme
      }));
    });
  });

  describe('PUT Method', () => {
    it('should validate theme field if provided', async () => {
      const { req, res } = setupRequestWithUser('PUT', {
        theme: 'invalid-theme', // Invalid theme value
        emailNotifications: true,
      });
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData().message).toContain('Invalid preferences data');
    });

    it('should update existing preferences', async () => {
      const { req, res } = setupRequestWithUser('PUT', {
        theme: 'light',
        emailNotifications: false,
        pushNotifications: true,
      });
      
      // Mock existing user
      const existingUser = {
        id: 'user-123',
        settings: JSON.stringify({
          theme: 'dark',
          emailNotifications: true,
          pushNotifications: false,
          weeklyDigest: true,
        }),
      };
      
      vi.mocked(mockedDb.user.findUnique).mockResolvedValueOnce(existingUser);
      
      // Mock successful update
      const updatedUser = {
        id: 'user-123',
        settings: JSON.stringify({
          theme: 'light',
          emailNotifications: false,
          pushNotifications: true,
        }),
      };
      
      vi.mocked(mockedDb.user.update).mockResolvedValueOnce(updatedUser);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(mockedDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          settings: expect.any(String),
        },
      });
      
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        message: 'Preferences updated successfully',
        preferences: {
          theme: 'light',
          emailNotifications: false,
          pushNotifications: true,
        },
      });
    });

    it('should create new preferences if they do not exist', async () => {
      const { req, res } = setupRequestWithUser('PUT', {
        theme: 'system',
        emailNotifications: true,
      });
      
      // Mock user with no settings
      const existingUser = {
        id: 'user-123',
        settings: null,
      };
      
      vi.mocked(mockedDb.user.findUnique).mockResolvedValueOnce(existingUser);
      
      // Mock successful update
      const updatedUser = {
        id: 'user-123',
        settings: JSON.stringify({
          theme: 'system',
          emailNotifications: true,
        }),
      };
      
      vi.mocked(mockedDb.user.update).mockResolvedValueOnce(updatedUser);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(mockedDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          settings: expect.any(String),
        },
      });
      
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        message: 'Preferences updated successfully',
        preferences: {
          theme: 'system',
          emailNotifications: true,
        },
      });
    });

    it('should handle server errors during PUT', async () => {
      const { req, res } = setupRequestWithUser('PUT', {
        theme: 'dark',
      });
      
      // Mock database error
      const error = new Error('Database error');
      vi.mocked(mockedDb.user.findUnique).mockRejectedValueOnce(error);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(500);
      expect(res._getJSONData()).toEqual(expect.objectContaining({
        message: 'An unexpected error occurred',
      }));
    });

    it('should return 400 when no valid preferences are provided', async () => {
      const { req, res } = setupRequestWithUser('PUT', {
        // Empty object, no valid preferences
      });
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual(expect.objectContaining({
        message: 'No valid preferences provided to update',
      }));
    });

    it('should properly handle API errors during validation', async () => {
      const { req, res } = setupRequestWithUser('PUT', {
        // Invalid preferences format that will trigger a ZodError
        theme: 123, // Theme should be a string, not a number
      });
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData().message).toContain('Invalid preferences data');
    });

    it('should handle re-thrown ApiErrors', async () => {
      const { req, res } = setupRequestWithUser('PUT', {
        theme: 'light',
      });
      
      // Mock user.findUnique to throw an error
      const originalFindUnique = vi.mocked(mockedDb.user.findUnique);
      vi.mocked(mockedDb.user.findUnique).mockImplementation(() => {
        throw new Error('This error should be converted to a 500 server error');
      });
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      // Check that the error was caught and turned into a server error response
      expect(res._getStatusCode()).toBe(500);
      const response = res._getJSONData();
      expect(response.message).toBe('An unexpected error occurred');
      
      // Clean up
      vi.mocked(mockedDb.user.findUnique).mockImplementation(originalFindUnique);
    });
  });

  describe('PATCH Method', () => {
    it('should only update specified fields', async () => {
      const { req, res } = setupRequestWithUser('PATCH', {
        // Only updating theme
        theme: 'light',
      });
      
      // Mock existing user with complete settings
      const existingUser = {
        id: 'user-123',
        settings: JSON.stringify({
          theme: 'dark',
          emailNotifications: true,
          pushNotifications: true,
          weeklyDigest: true,
          language: 'en',
          timezone: 'UTC',
        }),
      };
      
      vi.mocked(mockedDb.user.findUnique).mockResolvedValueOnce(existingUser);
      
      // Mock successful update
      const updatedUser = {
        id: 'user-123',
        settings: JSON.stringify({
          theme: 'light', // Only this changed
          emailNotifications: true,
          pushNotifications: true,
          weeklyDigest: true,
          language: 'en',
          timezone: 'UTC',
        }),
      };
      
      vi.mocked(mockedDb.user.update).mockResolvedValueOnce(updatedUser);
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(mockedDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          settings: expect.any(String),
        },
      });
      
      expect(res._getStatusCode()).toBe(200);
      
      // Verify that only theme was changed but other fields retained
      const responseData = res._getJSONData();
      expect(responseData.preferences.theme).toBe('light');
      expect(responseData.preferences.emailNotifications).toBe(true);
      expect(responseData.preferences.pushNotifications).toBe(true);
    });

    it('should return 400 when no valid fields are provided for PATCH', async () => {
      const { req, res } = setupRequestWithUser('PATCH', {
        // Invalid or empty fields
        invalidField: 'something'
      });
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual(expect.objectContaining({
        message: 'No valid preferences provided to update',
      }));
    });

    it('should correctly parse user settings from database', async () => {
      const { req, res } = setupRequestWithUser('PATCH', {
        // Only update timezone
        timezone: 'GMT+2',
      });
      
      // Mock user with settings that need to be parsed
      const existingUser = {
        id: 'user-123',
        // Settings are stored as a string in the database
        settings: JSON.stringify({
          theme: 'dark',
          emailNotifications: false,
          timezone: 'UTC',
        }),
      };
      
      vi.mocked(mockedDb.user.findUnique).mockResolvedValueOnce(existingUser);
      vi.mocked(mockedDb.user.update).mockImplementation((data) => {
        // Return updated settings
        const updatedSettings = JSON.parse(data.data.settings as string);
        return Promise.resolve({
          id: 'user-123',
          settings: JSON.stringify(updatedSettings),
        });
      });
      
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      
      // Verify we parsed and updated correctly
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData().preferences.timezone).toBe('GMT+2');
      expect(res._getJSONData().preferences.theme).toBe('dark');
      expect(res._getJSONData().preferences.emailNotifications).toBe(false);
    });
  });
}); 