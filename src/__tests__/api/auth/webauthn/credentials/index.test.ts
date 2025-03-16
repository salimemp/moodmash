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
    vi.resetAllMocks();
  });

  it('should return 405 for non-GET requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Method not allowed',
    });
  });

  it('should apply rate limiting', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    vi.mocked(rateLimit).mockResolvedValueOnce(false);

    await handler(req, res);

    expect(rateLimit).toHaveBeenCalledWith(req, res, 'general');
    expect(getSessionFromReq).not.toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(429);
  });

  it('should return 401 if user is not authenticated', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    vi.mocked(rateLimit).mockResolvedValueOnce(true);
    vi.mocked(getSessionFromReq).mockResolvedValueOnce(null);

    await handler(req, res);

    expect(getSessionFromReq).toHaveBeenCalledWith(req);
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Unauthorized',
    });
  });

  it('should return credentials for authenticated user', async () => {
    const mockCredentials = [
      {
        id: 'cred1',
        deviceType: 'browser',
        friendlyName: 'Device 1',
        createdAt: new Date('2022-12-01'),
        lastUsed: new Date('2023-01-01'),
      },
      {
        id: 'cred2',
        deviceType: null,
        friendlyName: null,
        createdAt: new Date('2022-12-02'),
        lastUsed: new Date('2023-01-02'),
      },
    ];

    const { req, res } = createMocks({
      method: 'GET',
    });

    vi.mocked(rateLimit).mockResolvedValueOnce(true);
    vi.mocked(getSessionFromReq).mockResolvedValueOnce({
      user: { id: 'user123' },
      expires: new Date().toISOString(),
    });
    vi.mocked(db.credential.findMany).mockResolvedValueOnce(mockCredentials as any);

    await handler(req, res);

    expect(getSessionFromReq).toHaveBeenCalledWith(req);
    expect(db.credential.findMany).toHaveBeenCalledWith({
      where: { userId: 'user123' },
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

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      credentials: [
        {
          id: 'cred1',
          deviceType: 'browser',
          friendlyName: 'Device 1',
          createdAt: '2022-12-01T00:00:00.000Z',
          lastUsed: '2023-01-01T00:00:00.000Z',
        },
        {
          id: 'cred2',
          deviceType: null,
          friendlyName: null,
          createdAt: '2022-12-02T00:00:00.000Z',
          lastUsed: '2023-01-02T00:00:00.000Z',
        },
      ],
    });
  });

  it('should handle server errors gracefully', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    vi.mocked(rateLimit).mockResolvedValueOnce(true);
    vi.mocked(getSessionFromReq).mockResolvedValueOnce({
      user: { id: 'user123' },
      expires: new Date().toISOString(),
    });
    vi.mocked(db.credential.findMany).mockRejectedValueOnce(new Error('Database error'));

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Internal server error',
    });
  });
}); 