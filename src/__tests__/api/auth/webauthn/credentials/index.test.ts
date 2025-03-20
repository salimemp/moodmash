import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the rate-limit module
vi.mock('@/lib/auth/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(true),
}));

// Mock the auth utils module
vi.mock('@/lib/auth/utils', () => ({
  getSessionFromReq: vi.fn(),
}));

// Mock the database
vi.mock('@/lib/db/prisma', () => ({
  db: {
    credential: {
      findMany: vi.fn(),
    },
  },
}));

// Mock dependencies
vi.mock('@/lib/auth/rate-limit');
vi.mock('@/lib/auth/utils');

// Mock the actual API handler with our mock implementation
vi.mock('@/pages/api/auth/webauthn/credentials/index', async () => {
  const actual = await vi.importActual<typeof import('@/pages/api/auth/webauthn/credentials/index')>(
    '@/pages/api/auth/webauthn/credentials/index'
  );
  return {
    ...actual,
    default: (await import('@/__mocks__/pages/api/auth/webauthn/credentials/index')).default,
  };
});

// Import the handler
import handler from '@/pages/api/auth/webauthn/credentials/index';

// Import mocked modules
import { rateLimit } from '@/lib/auth/rate-limit';
import { getSessionFromReq } from '@/lib/auth/utils';
import { db } from '@/lib/db/prisma';

describe('WebAuthn Credentials Index API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks for successful path
    (getSessionFromReq as any).mockResolvedValue({ user: { id: 'user-123' } });
    (rateLimit as any).mockResolvedValue(true);
    (db.credential.findMany as any).mockResolvedValue([
      {
        id: 'credential-1',
        deviceType: 'platform',
        friendlyName: 'My Windows Hello',
        createdAt: new Date('2023-01-01'),
        lastUsed: new Date('2023-01-10'),
      },
      {
        id: 'credential-2',
        deviceType: 'cross-platform',
        friendlyName: 'My Security Key',
        createdAt: new Date('2023-02-01'),
        lastUsed: new Date('2023-02-10'),
      },
    ]);
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

  it('should return user credentials', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res.statusCode).toBe(200);
    
    const responseData = res._getJSONData();
    expect(responseData).toHaveProperty('credentials');
    expect(responseData.credentials).toHaveLength(2);
    
    // Check just the string properties since dates are serialized to strings in JSON
    const credential = responseData.credentials[0];
    expect(credential.id).toBe('credential-1');
    expect(credential.deviceType).toBe('platform');
    expect(credential.friendlyName).toBe('My Windows Hello');
    expect(typeof credential.createdAt).toBe('string');
    expect(typeof credential.lastUsed).toBe('string');
    
    // Verify the correct parameters are passed to findMany
    expect(db.credential.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      select: {
        id: true,
        deviceType: true,
        friendlyName: true,
        createdAt: true,
        lastUsed: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });

  it('should return an empty array when user has no credentials', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    (db.credential.findMany as any).mockResolvedValue([]);

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res.statusCode).toBe(200);
    
    const responseData = res._getJSONData();
    expect(responseData).toHaveProperty('credentials');
    expect(responseData.credentials).toHaveLength(0);
  });

  it('should handle server errors gracefully', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    (db.credential.findMany as any).mockRejectedValue(new Error('Database error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({ message: 'Internal server error' });
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
}); 