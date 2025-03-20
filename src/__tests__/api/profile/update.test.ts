import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/auth/utils', () => ({
  getSessionFromReq: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  db: {
    user: {
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

// Import mocked dependencies
import { rateLimit } from '@/lib/auth/rate-limit';
import { getSessionFromReq } from '@/lib/auth/utils';
import { db } from '@/lib/db/prisma';

// Import the API handler
import handler from '@/pages/api/profile/update';

describe('Profile Update API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (rateLimit as any).mockResolvedValue(true);
  });

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

    expect(res._getStatusCode()).toBe(405);
    expect(res._getJSONData()).toEqual({ message: 'Method not allowed' });
  });

  it('should return 401 when user is not authenticated', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    (getSessionFromReq as any).mockResolvedValueOnce({ user: null });

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

    expect(getSessionFromReq).toHaveBeenCalledWith(req, res);
    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toEqual({ message: 'Unauthorized' });
  });

  it('should return 400 if bio exceeds 160 characters', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        bio: 'a'.repeat(161), // Bio exceeding 160 characters
      },
    });

    (getSessionFromReq as any).mockResolvedValueOnce({
      user: { id: 'user-123' },
    });

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'Bio cannot exceed 160 characters' });
  });

  it('should update user profile successfully', async () => {
    const profileData = {
      name: 'Test User',
      bio: 'This is a test bio',
      image: 'https://example.com/image.jpg',
    };

    const { req, res } = createMocks({
      method: 'POST',
      body: profileData,
    });

    const mockUser = {
      id: 'user-123',
      ...profileData,
      email: 'test@example.com',
    };

    (getSessionFromReq as any).mockResolvedValueOnce({
      user: { id: 'user-123' },
    });

    (db.user.update as any).mockResolvedValueOnce(mockUser);

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: {
        name: profileData.name,
        bio: profileData.bio,
        image: profileData.image,
        updatedAt: expect.any(Date),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
      },
    });

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      message: 'Profile updated successfully',
      user: mockUser,
    });
  });

  it('should handle null values correctly', async () => {
    const profileData = {
      name: null,
      bio: null,
      image: null,
    };

    const { req, res } = createMocks({
      method: 'POST',
      body: profileData,
    });

    const mockUser = {
      id: 'user-123',
      ...profileData,
      email: 'test@example.com',
    };

    (getSessionFromReq as any).mockResolvedValueOnce({
      user: { id: 'user-123' },
    });

    (db.user.update as any).mockResolvedValueOnce(mockUser);

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: {
        name: null,
        bio: null,
        image: null,
        updatedAt: expect.any(Date),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
      },
    });

    expect(res._getStatusCode()).toBe(200);
  });

  it('should handle server errors', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'Test User',
      },
    });

    (getSessionFromReq as any).mockResolvedValueOnce({
      user: { id: 'user-123' },
    });

    // Mock a database error
    const error = new Error('Database error');
    (db.user.update as any).mockRejectedValueOnce(error);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

    expect(consoleSpy).toHaveBeenCalledWith('Error updating profile:', error);
    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({ message: 'Internal server error' });

    consoleSpy.mockRestore();
  });

  it('should respect rate limiting', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    // Simulate rate limit being exceeded
    (rateLimit as any).mockResolvedValueOnce(false);

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

    expect(rateLimit).toHaveBeenCalledWith(req, res, 'general');
    // No assertions needed for response, as it's handled by the rate limit function
  });
}); 