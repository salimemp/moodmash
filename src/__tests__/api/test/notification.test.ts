/**
 * Tests for test notification API endpoint
 * 
 * This test file provides coverage for the POST /api/test/notification endpoint
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock API error and handler
vi.mock('@/lib/api/handlers', () => {
  // Create a mock ApiError class
  class MockApiError extends Error {
    statusCode: number;
    
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
    
    static unauthorized() {
      return new MockApiError('Unauthorized', 401);
    }
  }
  
  return {
    ApiError: MockApiError,
    createApiHandler: (_config: any, handler: any) => {
      return (req: NextApiRequest, res: NextApiResponse) => {
        const extendedReq = req as ExtendedRequest;
        return handler(req, res, { userId: extendedReq._userId });
      };
    },
  };
});

// Mock the notifyUser function from streaming notifications
vi.mock('@/pages/api/streaming/notifications', () => ({
  notifyUser: vi.fn().mockImplementation(() => undefined),
}));

// Import after mocking
import { notifyUser } from '@/pages/api/streaming/notifications';
import handler from '@/pages/api/test/notification';

// Custom type for request with additional properties
interface ExtendedRequest extends NextApiRequest {
  _userId?: string;
}

describe('Test Notification API', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  
  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.resetAllMocks();
  });
  
  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });
  
  it('should return 401 if user is not authenticated', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    });
    
    // Set the userId context to undefined (not authenticated)
    (req as ExtendedRequest)._userId = undefined;
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({ message: 'Unauthorized' });
  });
  
  it('should return 400 if message is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    });
    
    // Set the userId context
    (req as ExtendedRequest)._userId = 'test-user-id';
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({ message: 'Message is required' });
  });
  
  it('should send notification successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { message: 'Test message' },
    });
    
    // Set the userId context
    (req as ExtendedRequest)._userId = 'test-user-id';
    
    // Mock successful notification
    vi.mocked(notifyUser).mockReturnValueOnce(undefined);
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    
    // Only check the properties that we care about
    expect(responseData).toMatchObject({
      success: true,
      notification: {
        type: 'notification',
        message: 'Test message',
        timestamp: expect.any(Number),
      },
    });
    
    expect(notifyUser).toHaveBeenCalledWith('test-user-id', expect.objectContaining({
      type: 'notification',
      message: 'Test message',
    }));
  });
  
  it('should handle unexpected errors', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { message: 'Test message' },
    });
    
    // Set the userId context
    (req as ExtendedRequest)._userId = 'test-user-id';
    
    // Mock notifyUser to throw an error
    const testError = new Error('Test error');
    vi.mocked(notifyUser).mockImplementationOnce(() => {
      throw testError;
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({ message: 'Internal server error' });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending test notification:', testError);
  });
}); 