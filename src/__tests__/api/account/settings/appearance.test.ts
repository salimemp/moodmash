import { rateLimit } from '@/lib/auth/rate-limit';
import { getSessionFromReq } from '@/lib/auth/utils';
import { db } from '@/lib/db/prisma';
import handler from '@/pages/api/account/settings/appearance';
import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the dependencies
vi.mock('@/lib/auth/utils', () => ({
  getSessionFromReq: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

describe('Account Settings API - Appearance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks for successful path
    (getSessionFromReq as any).mockResolvedValue({ user: { id: 'user-123' } });
    (rateLimit as any).mockResolvedValue(true);
    (db.user.findUnique as any).mockResolvedValue({
      id: 'user-123',
      settings: JSON.stringify({
        notifications: {
          emailNotifications: true,
          moodComments: true,
        },
        appearance: {
          theme: 'light',
          reducedMotion: false,
          highContrast: false,
        },
      }),
    });
    (db.user.update as any).mockResolvedValue({
      id: 'user-123',
      settings: JSON.stringify({
        notifications: {
          emailNotifications: true,
          moodComments: true,
        },
        appearance: {
          theme: 'dark',
          reducedMotion: true,
          highContrast: false,
        },
      }),
    });
  });

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res.statusCode).toBe(405);
    expect(res._getJSONData()).toEqual({ message: 'Method not allowed' });
  });

  it('should apply rate limiting', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    (rateLimit as any).mockResolvedValue(false);

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(rateLimit).toHaveBeenCalledWith(req, res, 'general');
  });

  it('should return 401 if no user session', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    (getSessionFromReq as any).mockResolvedValue({ user: null });

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual({ message: 'Unauthorized' });
  });

  it('should validate appearance settings object', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: 'not-an-object' as any,
    });

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'Invalid appearance settings' });
  });

  it('should validate theme value', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        theme: 'invalid-theme',
      },
    });

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'Invalid theme value' });
  });

  it('should return 404 if user not found', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        theme: 'dark',
      },
    });

    (db.user.findUnique as any).mockResolvedValue(null);

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res.statusCode).toBe(404);
    expect(res._getJSONData()).toEqual({ message: 'User not found' });
  });

  it('should update appearance settings successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        theme: 'dark',
        reducedMotion: true,
      },
    });

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({
      message: 'Appearance settings updated successfully',
      appearance: {
        theme: 'dark',
        reducedMotion: true,
        highContrast: false,
      },
    });

    // Verify the update was called with correct values
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: expect.objectContaining({
        settings: expect.any(String),
        updatedAt: expect.any(Date),
      }),
    });

    // Verify the stringified settings contain correct values
    const updateCall = (db.user.update as any).mock.calls[0][0];
    const parsedSettings = JSON.parse(updateCall.data.settings);
    expect(parsedSettings).toEqual({
      notifications: {
        emailNotifications: true,
        moodComments: true,
      },
      appearance: {
        theme: 'dark',
        reducedMotion: true,
        highContrast: false,
      },
    });
  });

  it('should handle parsing errors gracefully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        theme: 'dark',
      },
    });

    (db.user.findUnique as any).mockResolvedValue({
      id: 'user-123',
      settings: '{invalid-json}',
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res.statusCode).toBe(200);
    expect(consoleSpy).toHaveBeenCalled();
    expect(db.user.update).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle server errors', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        theme: 'dark',
      },
    });

    (db.user.update as any).mockRejectedValue(new Error('Database error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({ message: 'Internal server error' });
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
}); 