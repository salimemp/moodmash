import updateHandler from '@/pages/api/profile/update';
import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

// Import mocked modules
import { rateLimit } from '@/lib/auth/rate-limit';
import { getSessionFromReq } from '@/lib/auth/utils';
import { db } from '@/lib/db/prisma';

describe('Profile Update API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    await updateHandler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res._getJSONData()).toEqual({ message: 'Method not allowed' });
  });

  it('should return 401 if no session user is found', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        name: 'Test User',
        bio: 'Test bio',
      },
    });

    // Mock rate limit to pass
    (rateLimit as any).mockResolvedValue(true);
    
    // Mock session with no user
    (getSessionFromReq as any).mockResolvedValue({ user: null });

    await updateHandler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual({ message: 'Unauthorized' });
  });

  it('should return 400 if bio exceeds 160 characters', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        name: 'Test User',
        bio: 'a'.repeat(161), // Bio longer than 160 characters
      },
    });

    // Mock rate limit to pass
    (rateLimit as any).mockResolvedValue(true);
    
    // Mock session with valid user
    (getSessionFromReq as any).mockResolvedValue({
      user: { id: 'user-123' }
    });

    await updateHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'Bio cannot exceed 160 characters' });
  });

  it('should successfully update the user profile', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'Updated Name',
      email: 'test@example.com',
      bio: 'Updated bio',
      image: 'updated-image.jpg',
    };

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        name: mockUser.name,
        bio: mockUser.bio,
        image: mockUser.image,
      },
    });

    // Mock rate limit to pass
    (rateLimit as any).mockResolvedValue(true);
    
    // Mock session with valid user
    (getSessionFromReq as any).mockResolvedValue({
      user: { id: mockUser.id }
    });

    // Mock successful user update
    (db.user.update as any).mockResolvedValue(mockUser);

    await updateHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({
      message: 'Profile updated successfully',
      user: mockUser,
    });
    
    // Verify the user update was called with correct data
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: {
        name: mockUser.name,
        bio: mockUser.bio,
        image: mockUser.image,
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
  });

  it('should handle server errors', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        name: 'Test User',
      },
    });

    // Mock rate limit to pass
    (rateLimit as any).mockResolvedValue(true);
    
    // Mock session with valid user
    (getSessionFromReq as any).mockResolvedValue({
      user: { id: 'user-123' }
    });

    // Mock an error during user update
    (db.user.update as any).mockRejectedValue(new Error('Database error'));

    // Mock console.error to prevent test output noise
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    await updateHandler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({ message: 'Internal server error' });
    
    // Verify error was logged
    expect(consoleErrorMock).toHaveBeenCalled();
    
    // Restore console.error
    consoleErrorMock.mockRestore();
  });
}); 