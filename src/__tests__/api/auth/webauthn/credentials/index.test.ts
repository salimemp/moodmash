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

// Import the handler
import handler from '@/pages/api/auth/webauthn/credentials/index';

// Import mocked modules
import { rateLimit } from '@/lib/auth/rate-limit';
import { getSessionFromReq } from '@/lib/auth/utils';
import { db } from '@/lib/db/prisma';

describe('WebAuthn Credentials Index API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('should return 405 for non-GET requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed',
    });
  });

  it.skip('should apply rate limiting', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    vi.mocked(rateLimit).mockResolvedValueOnce(false);

    await handler(req, res);

    expect(rateLimit).toHaveBeenCalledWith(req, res, 'webauthn_credentials_get');
    expect(getSessionFromReq).not.toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(429);
  });

  it.skip('should return 401 if user is not authenticated', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    vi.mocked(rateLimit).mockResolvedValueOnce(true);
    vi.mocked(getSessionFromReq).mockResolvedValueOnce(null);

    await handler(req, res);

    expect(getSessionFromReq).toHaveBeenCalledWith(req);
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Unauthorized',
    });
  });

  it.skip('should return credentials for authenticated user', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    const mockSession = {
      expires: new Date().toISOString(),
      user: {
        id: 'user123',
        email: 'user@example.com',
      },
    };

    const mockCredentials = [
      {
        id: 'cred1',
        externalId: 'external1',
        friendlyName: 'Device 1',
        lastUsed: new Date('2023-01-01'),
        createdAt: new Date('2022-12-01'),
      },
      {
        id: 'cred2',
        externalId: 'external2',
        friendlyName: null,
        lastUsed: new Date('2023-01-02'),
        createdAt: new Date('2022-12-02'),
      },
    ];

    vi.mocked(rateLimit).mockResolvedValueOnce(true);
    vi.mocked(getSessionFromReq).mockResolvedValueOnce(mockSession);
    vi.mocked(db.credential.findMany).mockResolvedValueOnce(mockCredentials);

    await handler(req, res);

    expect(db.credential.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user123',
      },
      select: {
        id: true,
        externalId: true,
        friendlyName: true,
        lastUsed: true,
        createdAt: true,
      },
      orderBy: {
        lastUsed: 'desc',
      },
    });

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      credentials: mockCredentials,
    });
  });

  it.skip('should handle server errors gracefully', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    const mockSession = {
      expires: new Date().toISOString(),
      user: {
        id: 'user123',
        email: 'user@example.com',
      },
    };

    vi.mocked(rateLimit).mockResolvedValueOnce(true);
    vi.mocked(getSessionFromReq).mockResolvedValueOnce(mockSession);
    vi.mocked(db.credential.findMany).mockRejectedValueOnce(new Error('Database error'));

    // Mock console.error to avoid polluting test output
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Internal server error',
    });

    consoleErrorSpy.mockRestore();
  });
}); 