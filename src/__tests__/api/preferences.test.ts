import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import preferencesHandler from '@/pages/api/profile/preferences';
import { getSessionFromReq } from '@/lib/auth/utils';
import { db } from '@/lib/db/prisma';

// Mock the auth and DB dependencies
jest.mock('@/lib/auth/utils', () => ({
  getSessionFromReq: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockSession = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
  },
  expires: '2099-01-01T00:00:00.000Z',
};

describe('/api/profile/preferences', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Set up default session
    (getSessionFromReq as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('GET /api/profile/preferences', () => {
    it('returns default preferences for new users', async () => {
      // Mock DB response for a user with no settings
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        settings: null,
      });

      // Mock the request and response
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      });

      // Call the handler
      await preferencesHandler(req, res);

      // Check the response
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      // Verify default preferences were returned
      expect(responseData).toEqual({
        theme: 'system',
        emailNotifications: true,
        pushNotifications: true,
        weeklyDigest: true,
        language: 'en',
        timezone: 'UTC',
      });
    });

    it('returns stored preferences for existing users', async () => {
      // Mock DB response for a user with settings
      const storedPreferences = {
        theme: 'dark',
        emailNotifications: false,
        pushNotifications: true,
        weeklyDigest: false,
        language: 'fr',
        timezone: 'Europe/Paris',
      };
      
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        settings: JSON.stringify(storedPreferences),
      });

      // Mock the request and response
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      });

      // Call the handler
      await preferencesHandler(req, res);

      // Check the response
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      // Verify stored preferences were returned
      expect(responseData).toEqual(storedPreferences);
    });

    it('handles invalid JSON gracefully', async () => {
      // Mock DB response with invalid JSON
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        settings: '{invalid-json',
      });

      // Mock the request and response
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      });

      // Call the handler
      await preferencesHandler(req, res);

      // Check the response
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      // Verify default preferences were returned
      expect(responseData).toHaveProperty('theme', 'system');
    });

    it('returns 401 when user is not authenticated', async () => {
      // Mock no session
      (getSessionFromReq as jest.Mock).mockResolvedValue(null);

      // Mock the request and response
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      });

      // Call the handler
      await preferencesHandler(req, res);

      // Check the response
      expect(res._getStatusCode()).toBe(401);
    });

    it('returns 404 when user is not found', async () => {
      // Mock DB response for user not found
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Mock the request and response
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      });

      // Call the handler
      await preferencesHandler(req, res);

      // Check the response
      expect(res._getStatusCode()).toBe(404);
    });
  });

  describe('PATCH /api/profile/preferences', () => {
    it('updates preferences partially', async () => {
      // Mock existing user with settings
      const existingSettings = {
        theme: 'light',
        emailNotifications: true,
        pushNotifications: true,
        weeklyDigest: true,
        language: 'en',
        timezone: 'UTC',
      };
      
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        settings: JSON.stringify(existingSettings),
      });
      
      (db.user.update as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
      });

      // Prepare the update payload
      const updatePayload = {
        theme: 'dark',
        emailNotifications: false,
      };

      // Mock the request and response
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'PATCH',
        body: updatePayload,
      });

      // Call the handler
      await preferencesHandler(req, res);

      // Check the response
      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      // Verify response message
      expect(responseData).toHaveProperty('message', 'Preferences updated successfully');
      expect(responseData).toHaveProperty('preferences');
      
      // Verify DB was called with merged preferences
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: {
          settings: expect.any(String),
        },
      });
      
      // Parse the saved settings to verify correct merging
      const updatedSettings = JSON.parse(
        (db.user.update as jest.Mock).mock.calls[0][0].data.settings
      );
      
      expect(updatedSettings).toEqual({
        ...existingSettings,
        ...updatePayload,
      });
    });

    it('handles empty update', async () => {
      // Mock the request and response with empty body
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'PATCH',
        body: {},
      });

      // Call the handler
      await preferencesHandler(req, res);

      // Check the response
      expect(res._getStatusCode()).toBe(400);
      expect(db.user.update).not.toHaveBeenCalled();
    });

    it('validates input schema', async () => {
      // Mock the request with invalid data
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'PATCH',
        body: {
          theme: 'invalid-theme',
        },
      });

      // Call the handler
      await preferencesHandler(req, res);

      // Check the response
      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toHaveProperty('message');
      expect(db.user.update).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/profile/preferences', () => {
    it('replaces all preferences', async () => {
      // Mock existing user
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        settings: JSON.stringify({
          theme: 'light',
          emailNotifications: true,
          pushNotifications: true,
          weeklyDigest: true,
          language: 'en',
          timezone: 'UTC',
        }),
      });
      
      (db.user.update as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
      });

      // Prepare the new preferences
      const newPreferences = {
        theme: 'dark',
        emailNotifications: false,
        pushNotifications: false,
      };

      // Mock the request and response
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'PUT',
        body: newPreferences,
      });

      // Call the handler
      await preferencesHandler(req, res);

      // Check the response
      expect(res._getStatusCode()).toBe(200);
      
      // Verify DB was called with just the new preferences
      const savedPreferences = JSON.parse(
        (db.user.update as jest.Mock).mock.calls[0][0].data.settings
      );
      
      // Should only contain the new preferences, not merged with old ones
      expect(savedPreferences).toEqual(newPreferences);
      expect(savedPreferences).not.toHaveProperty('weeklyDigest');
    });
  });
}); 