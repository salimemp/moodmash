/**
 * Tests for dashboard stats API endpoint
 * 
 * This test file provides coverage for the GET /api/dashboard/stats endpoint
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock ApiError and createApiHandler before imports
vi.mock('@/lib/api/handlers', () => {
  // Create a mock ApiError class
  class MockApiError extends Error {
    statusCode: number;
    
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
    
    static unauthorized(message: string) {
      return new MockApiError(message, 401);
    }
  }
  
  return {
    ApiError: MockApiError,
    createApiHandler: (config: any, handler: any) => {
      // Return a function that will be our API handler
      return async (req: NextApiRequest, res: NextApiResponse) => {
        // Extract userId from the request context (added by our tests)
        const userId = (req as any)._userId;
        
        // Call the original handler with our context
        return handler(req, res, { userId });
      };
    },
  };
});

// Mock the database
vi.mock('@/lib/db/prisma', () => ({
  db: {
    $transaction: vi.fn(),
    mood: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    moodLike: {
      count: vi.fn(),
    },
    moodComment: {
      count: vi.fn(),
    },
  },
}));

// Import after mocking
import { db } from '@/lib/db/prisma';
import handler from '@/pages/api/dashboard/stats';

// Custom type for request with additional properties
interface ExtendedRequest extends NextApiRequest {
  _userId?: string;
}

describe('Dashboard Stats API', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  
  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset mocks
    vi.resetAllMocks();
  });
  
  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });
  
  it('should return 401 if user is not authenticated', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });
    
    // Set the userId context to undefined (not authenticated)
    (req as ExtendedRequest)._userId = undefined;
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({ message: 'User ID is required' });
  });
  
  it('should return formatted dashboard stats for authenticated user', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });
    
    // Set the userId context
    (req as ExtendedRequest)._userId = 'test-user-id';
    
    // Current time for testing
    const now = new Date();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    
    // Mock the database response
    const mockActivityData = [
      {
        id: 'mood1',
        emoji: '😀',
        text: 'Feeling great',
        gradientColors: ['#FF5733', '#FFC300'],
        createdAt: new Date(),
        _count: {
          moodLikes: 5,
          moodComments: 2,
        },
      },
      {
        id: 'mood2',
        emoji: '😊',
        text: 'Happy day',
        gradientColors: ['#C70039', '#581845'],
        createdAt: new Date(),
        _count: {
          moodLikes: 3,
          moodComments: 1,
        },
      },
    ];
    
    // Mock transaction response
    vi.mocked(db.$transaction).mockResolvedValueOnce([
      10, // moodCount
      20, // likesReceived
      5,  // commentsReceived
      mockActivityData, // recentActivity
    ]);
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({
      moodCount: 10,
      likesReceived: 20,
      commentsReceived: 5,
      recentActivity: [
        {
          id: 'mood1',
          emoji: '😀',
          text: 'Feeling great',
          colors: ['#FF5733', '#FFC300'],
          createdAt: expect.any(String),
          likes: 5,
          comments: 2,
        },
        {
          id: 'mood2',
          emoji: '😊',
          text: 'Happy day',
          colors: ['#C70039', '#581845'],
          createdAt: expect.any(String),
          likes: 3,
          comments: 1,
        },
      ],
      lastUpdated: expect.any(String),
    });
    
    // Verify database was called with correct parameters
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    
    vi.useRealTimers();
  });
  
  it('should handle empty activity list properly', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });
    
    // Set the userId context
    (req as ExtendedRequest)._userId = 'test-user-id';
    
    // Mock transaction response with empty activity
    vi.mocked(db.$transaction).mockResolvedValueOnce([
      0, // moodCount
      0, // likesReceived
      0, // commentsReceived
      [], // recentActivity (empty)
    ]);
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({
      moodCount: 0,
      likesReceived: 0,
      commentsReceived: 0,
      recentActivity: [],
      lastUpdated: expect.any(String),
    });
  });
  
  it('should handle database transaction errors', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });
    
    // Set the userId context
    (req as ExtendedRequest)._userId = 'test-user-id';
    
    // Mock database error
    const dbError = new Error('Database connection failed');
    (dbError as any).code = 'P2002'; // Prisma error code
    
    vi.mocked(db.$transaction).mockRejectedValueOnce(dbError);
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Database error',
      code: 'P2002',
    });
    
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
  
  it('should handle generic errors', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });
    
    // Set the userId context
    (req as ExtendedRequest)._userId = 'test-user-id';
    
    // Mock a generic error
    const genericError = new Error('Something went wrong');
    
    vi.mocked(db.$transaction).mockRejectedValueOnce(genericError);
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Internal server error',
    });
    
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
  
  it('should handle validation errors', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });
    
    // Set the userId context
    (req as ExtendedRequest)._userId = 'test-user-id';
    
    // Mock invalid data that would cause a validation error
    vi.mocked(db.$transaction).mockResolvedValueOnce([
      "invalid" as any, // moodCount should be a number
      20,
      5,
      [], // empty activity list
    ]);
    
    // Spy on console.error to check if validation error is logged
    const validationErrorSpy = vi.spyOn(console, 'error');
    
    await handler(req, res);
    
    // We should still get a 200 response as the original handler
    // continues even after validation errors
    expect(res._getStatusCode()).toBe(200);
    
    // Validation error should be logged
    expect(validationErrorSpy).toHaveBeenCalledWith(
      'Invalid stats data structure:',
      expect.anything()
    );
    
    validationErrorSpy.mockRestore();
  });
}); 