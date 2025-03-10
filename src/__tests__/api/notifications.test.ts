import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromReq } from '@/lib/auth/utils';
import { notifyUser } from '@/pages/api/streaming/notifications';
import testNotificationHandler from '@/pages/api/test/notification';

// Mock the auth dependencies
jest.mock('@/lib/auth/utils', () => ({
  getSessionFromReq: jest.fn(),
}));

// Mock the notifyUser function
jest.mock('@/pages/api/streaming/notifications', () => ({
  notifyUser: jest.fn(),
}));

// Sample user for tests
const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
};

// Sample session for tests
const mockSession = {
  user: mockUser,
  expires: '2099-01-01T00:00:00.000Z',
};

describe('/api/test/notification', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Set up default session
    (getSessionFromReq as jest.Mock).mockResolvedValue(mockSession);
    // Set up default notifyUser behavior
    (notifyUser as jest.Mock).mockReturnValue(true);
  });

  it('sends a notification successfully', async () => {
    // Create a test notification message
    const testMessage = 'Test notification message';
    
    // Mock the request with the test message
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        message: testMessage,
      },
    });

    // Call the handler
    await testNotificationHandler(req, res);

    // Check the response
    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    
    // Verify success response
    expect(responseData.success).toBe(true);
    expect(responseData.delivered).toBe(true);
    expect(responseData.notification).toBeDefined();
    expect(responseData.notification.message).toBe(testMessage);
    
    // Verify notifyUser was called with correct params
    expect(notifyUser).toHaveBeenCalledWith(
      mockUser.id,
      expect.objectContaining({
        type: 'notification',
        message: testMessage,
      })
    );
  });

  it('requires authentication', async () => {
    // Mock no session
    (getSessionFromReq as jest.Mock).mockResolvedValue(null);
    
    // Mock the request
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        message: 'Test message',
      },
    });

    // Call the handler
    await testNotificationHandler(req, res);

    // Check for unauthorized response
    expect(res._getStatusCode()).toBe(401);
    
    // Verify notifyUser was NOT called
    expect(notifyUser).not.toHaveBeenCalled();
  });

  it('requires a message', async () => {
    // Mock the request with no message
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {},
    });

    // Call the handler
    await testNotificationHandler(req, res);

    // Check for bad request response
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData()).message).toBe('Message is required');
    
    // Verify notifyUser was NOT called
    expect(notifyUser).not.toHaveBeenCalled();
  });

  it('handles notification delivery failure', async () => {
    // Mock notifyUser to indicate failure (no active streams)
    (notifyUser as jest.Mock).mockReturnValue(false);
    
    // Mock the request
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        message: 'Test message',
      },
    });

    // Call the handler
    await testNotificationHandler(req, res);

    // Response should still be 200 but indicate no delivery
    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.success).toBe(true);
    expect(responseData.delivered).toBe(false);
  });

  it('only accepts POST method', async () => {
    // Mock GET request
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    // Call the handler
    await testNotificationHandler(req, res);

    // Check for method not allowed response
    expect(res._getStatusCode()).toBe(405);
  });
}); 