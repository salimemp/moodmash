import { rateLimit } from '@/lib/auth/rate-limit';
import { getSessionFromReq } from '@/lib/auth/utils';
import { db } from '@/lib/db/prisma';
import handler from '@/pages/api/account/settings/index';
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
    },
  },
}));

vi.mock('@/lib/auth/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

describe('Account Settings API - GET', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks for successful path
    (getSessionFromReq as any).mockResolvedValue({ user: { id: 'user-123' } });
    (rateLimit as any).mockResolvedValue(true);
    (db.user.findUnique as any).mockResolvedValue({
      id: 'user-123',
      settings: JSON.stringify({
        notifications: {
          emailNotifications: false,
          moodComments: false,
        },
        appearance: {
          theme: 'dark',
        },
      }),
    });
  });

  it('should return 405 for non-GET requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res.statusCode).toBe(405);
    expect(res._getJSONData()).toEqual({ message: 'Method not allowed' });
  });

  it('should apply rate limiting', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    (rateLimit as any).mockResolvedValue(false);

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(rateLimit).toHaveBeenCalledWith(req, res, 'general');
  });

  it('should return 401 if no user session', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    (getSessionFromReq as any).mockResolvedValue({ user: null });

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual({ message: 'Unauthorized' });
  });

  it('should return 404 if user not found', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    (db.user.findUnique as any).mockResolvedValue(null);

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res.statusCode).toBe(404);
    expect(res._getJSONData()).toEqual({ message: 'User not found' });
  });

  it('should return merged settings with defaults when settings exist', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({
      notifications: {
        emailNotifications: false, // Overridden
        moodComments: false, // Overridden
        moodLikes: true, // Default preserved
        newFollowers: true, // Default preserved
        productUpdates: false, // Default preserved
      },
      appearance: {
        theme: 'dark', // Overridden
        reducedMotion: false, // Default preserved
        highContrast: false, // Default preserved
      },
    });
  });

  it('should return default settings if user has no settings', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    (db.user.findUnique as any).mockResolvedValue({
      id: 'user-123',
      settings: null,
    });

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({
      notifications: {
        emailNotifications: true,
        moodComments: true,
        moodLikes: true,
        newFollowers: true,
        productUpdates: false,
      },
      appearance: {
        theme: 'system',
        reducedMotion: false,
        highContrast: false,
      },
    });
  });

  it('should handle parsing errors gracefully', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    (db.user.findUnique as any).mockResolvedValue({
      id: 'user-123',
      settings: '{invalid-json}',
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res.statusCode).toBe(200);
    expect(consoleSpy).toHaveBeenCalled();
    expect(res._getJSONData()).toEqual({
      notifications: {
        emailNotifications: true,
        moodComments: true,
        moodLikes: true,
        newFollowers: true,
        productUpdates: false,
      },
      appearance: {
        theme: 'system',
        reducedMotion: false,
        highContrast: false,
      },
    });

    consoleSpy.mockRestore();
  });

  it('should handle server errors', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    (db.user.findUnique as any).mockRejectedValue(new Error('Database error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({ message: 'Internal server error' });
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
}); 