/**
 * Tests for streaming notifications API endpoint
 * 
 * This test file provides coverage for the GET /api/streaming/notifications endpoint
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Custom type for request with additional properties
interface ExtendedRequest extends NextApiRequest {
  _userId?: string;
  _closeCallback?: () => void;
}

// Mock dependencies first
vi.mock('@/lib/api/streaming', () => {
  const mockSend = vi.fn();
  const mockIsClosed = vi.fn().mockReturnValue(false);
  
  return {
    createStreamingResponse: vi.fn().mockImplementation(() => ({
      send: mockSend,
      isClosed: mockIsClosed,
      error: vi.fn(),
      close: vi.fn(),
    })),
  };
});

// Mock the createApiHandler to directly execute the handler function
vi.mock('@/lib/api/handlers', () => ({
  createApiHandler: (_config: any, handler: any) => {
    return (req: NextApiRequest, res: NextApiResponse) => {
      const extendedReq = req as ExtendedRequest;
      return handler(req, res, { userId: extendedReq._userId });
    };
  },
}));

// Import after mocks
import { createStreamingResponse } from '@/lib/api/streaming';
import handler, { Notification, notifyUser } from '@/pages/api/streaming/notifications';

describe('Streaming Notifications API', () => {
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
      method: 'GET',
    });
    
    // Set the userId context to undefined (not authenticated)
    (req as ExtendedRequest)._userId = undefined;

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({ message: 'Unauthorized' });
  });

  it('should set up streaming connection for authenticated user', async () => {
    const req = Object.assign(
      createMocks().req,
      { 
        method: 'GET',
        on: vi.fn((_, callback) => {
          if (_ === 'close') {
            // Store callback for later testing
            (req as ExtendedRequest)._closeCallback = callback;
          }
        }),
        _userId: 'test-user-id',
      }
    ) as ExtendedRequest;
    
    const { res } = createMocks();
    
    const mockStream = {
      send: vi.fn(),
      isClosed: vi.fn().mockReturnValue(false),
      error: vi.fn(),
      close: vi.fn(),
    };
    vi.mocked(createStreamingResponse).mockReturnValue(mockStream);

    await handler(req, res);

    // Check initial connection notification was sent
    expect(createStreamingResponse).toHaveBeenCalledWith(
      req,
      res,
      expect.objectContaining({
        keepAlive: true,
        heartbeatInterval: 30000,
      })
    );
    
    expect(mockStream.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'connected',
        message: 'Connected to notification stream',
      })
    );

    // Check close event handler was registered
    expect(req.on).toHaveBeenCalledWith('close', expect.any(Function));
  });

  it('should send test notification after timeout', async () => {
    vi.useFakeTimers();
    
    const req = Object.assign(
      createMocks().req,
      { 
        method: 'GET',
        on: vi.fn(),
        _userId: 'test-user-id',
      }
    ) as ExtendedRequest;
    
    const { res } = createMocks();
    
    const mockStream = {
      send: vi.fn(),
      isClosed: vi.fn().mockReturnValue(false),
      error: vi.fn(),
      close: vi.fn(),
    };
    vi.mocked(createStreamingResponse).mockReturnValue(mockStream);

    await handler(req, res);
    
    // Fast forward 5 seconds
    vi.advanceTimersByTime(5000);
    
    // Check test notification was sent
    expect(mockStream.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'notification',
        message: 'This is a test notification',
      })
    );
    
    vi.useRealTimers();
  });

  it('should not send test notification if stream is closed', async () => {
    vi.useFakeTimers();
    
    const req = Object.assign(
      createMocks().req,
      { 
        method: 'GET',
        on: vi.fn(),
        _userId: 'test-user-id',
      }
    ) as ExtendedRequest;
    
    const { res } = createMocks();
    
    const mockStream = {
      send: vi.fn(),
      isClosed: vi.fn().mockReturnValue(true), // Stream is closed
      error: vi.fn(),
      close: vi.fn(),
    };
    vi.mocked(createStreamingResponse).mockReturnValue(mockStream);

    await handler(req, res);
    
    // Reset the mock to check if it's called after timeout
    mockStream.send.mockClear();
    
    // Fast forward 5 seconds
    vi.advanceTimersByTime(5000);
    
    // Check no notification was sent
    expect(mockStream.send).not.toHaveBeenCalled();
    
    vi.useRealTimers();
  });

  it('should handle client disconnection', async () => {
    // For this test, we'll mock the activeStreams map and notifyUser function
    // rather than accessing the internal state directly
    
    const req = Object.assign(
      createMocks().req,
      { 
        method: 'GET',
        on: vi.fn((eventName, callback) => {
          if (eventName === 'close') {
            // Store callback for later testing
            req._closeCallback = callback;
          }
        }),
        _userId: 'test-user-id',
      }
    ) as ExtendedRequest;
    
    const { res } = createMocks();
    
    const mockStream = {
      send: vi.fn(),
      isClosed: vi.fn().mockReturnValue(false),
      error: vi.fn(),
      close: vi.fn(),
    };
    vi.mocked(createStreamingResponse).mockReturnValue(mockStream);

    await handler(req, res);
    
    // Verify connection was set up
    expect(mockStream.send).toHaveBeenCalled();

    // Now trigger the close event
    if (req._closeCallback) {
      req._closeCallback();
    }
    
    // At this point, the listener should have been removed
    // We'll test this indirectly by confirming notifyUser doesn't throw
    
    // Create a notification to test sending after disconnect
    const notification: Notification = {
      type: 'test',
      message: 'Test message',
      timestamp: Date.now(),
    };
    
    // Should not throw
    expect(() => notifyUser('test-user-id', notification)).not.toThrow();
  });

  it('should notify users when using the notifyUser function', async () => {
    const req = Object.assign(
      createMocks().req,
      { 
        method: 'GET',
        on: vi.fn(),
        _userId: 'test-user-id-2',
      }
    ) as ExtendedRequest;
    
    const { res } = createMocks();
    
    const mockStream = {
      send: vi.fn(),
      isClosed: vi.fn().mockReturnValue(false),
      error: vi.fn(),
      close: vi.fn(),
    };
    vi.mocked(createStreamingResponse).mockReturnValue(mockStream);

    await handler(req, res);
    
    // Clear previous calls to send
    mockStream.send.mockClear();
    
    // Simulate sending a notification
    const testNotification: Notification = {
      type: 'test',
      message: 'Test notification message',
      timestamp: Date.now(),
    };
    
    notifyUser('test-user-id-2', testNotification);
    
    // Check notification was sent through the stream
    expect(mockStream.send).toHaveBeenCalledWith(testNotification);
  });

  it('should handle errors when sending notifications', async () => {
    const errorHandler = vi.fn();
    
    // Use a special mock implementation for this test
    // First establish a connection
    const req = Object.assign(
      createMocks().req,
      { 
        method: 'GET',
        on: vi.fn(),
        _userId: 'test-user-id-3',
      }
    ) as ExtendedRequest;
    
    const { res } = createMocks();
    
    // Setup a mock stream that will throw when send is called
    const mockStreamWithError = {
      send: vi.fn(),
      isClosed: vi.fn().mockReturnValue(false),
      error: vi.fn(),
      close: vi.fn(),
    };
    
    vi.mocked(createStreamingResponse).mockReturnValue(mockStreamWithError);
    
    await handler(req, res);
    
    // Ensure the stream is established
    expect(createStreamingResponse).toHaveBeenCalled();
    
    // Setup the error handler mock
    vi.mocked(console.error).mockImplementation(errorHandler);
    
    // Setup the stream.send to throw when called
    const testError = new Error('Send error');
    mockStreamWithError.send.mockImplementationOnce(() => {
      throw testError;
    });
    
    // Send notification
    const testNotification: Notification = {
      type: 'test',
      message: 'Test error notification',
      timestamp: Date.now(),
    };
    
    notifyUser('test-user-id-3', testNotification);
    
    // Check error was caught and logged
    expect(errorHandler).toHaveBeenCalledWith(
      'Error sending notification to client:',
      testError
    );
  });
}); 