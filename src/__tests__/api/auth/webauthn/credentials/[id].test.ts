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
      findFirst: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Import the handler
import handler from '@/pages/api/auth/webauthn/credentials/[id]';

// Import mocked modules
import { rateLimit } from '@/lib/auth/rate-limit';
import { getSessionFromReq } from '@/lib/auth/utils';
import { db } from '@/lib/db/prisma';

describe('WebAuthn Credentials [id] API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('should return 405 for non-DELETE requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed',
    });
  });

  it.skip('should apply rate limiting', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
    });

    vi.mocked(rateLimit).mockResolvedValueOnce(false);

    await handler(req, res);

    expect(rateLimit).toHaveBeenCalledWith(req, res, 'webauthn_credentials_delete');
    expect(getSessionFromReq).not.toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(429);
  });

  it.skip('should return 400 if credential id is missing', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      query: {},
    });

    vi.mocked(rateLimit).mockResolvedValueOnce(true);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Missing credential ID',
    });
  });

  it.skip('should return 401 if user is not authenticated', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { id: 'credential123' },
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

  it.skip('should return 404 if credential does not exist', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { id: 'credential123' },
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
    vi.mocked(db.credential.findFirst).mockResolvedValueOnce(null);

    await handler(req, res);

    expect(db.credential.findFirst).toHaveBeenCalledWith({
      where: {
        externalId: 'credential123',
        userId: 'user123',
      },
    });

    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Credential not found',
    });
  });

  it.skip('should return 400 if user tries to delete their only credential', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { id: 'credential123' },
    });

    const mockSession = {
      expires: new Date().toISOString(),
      user: {
        id: 'user123',
        email: 'user@example.com',
      },
    };

    const mockCredential = {
      id: 'db-cred-id',
      externalId: 'credential123',
      userId: 'user123',
    };

    vi.mocked(rateLimit).mockResolvedValueOnce(true);
    vi.mocked(getSessionFromReq).mockResolvedValueOnce(mockSession);
    vi.mocked(db.credential.findFirst).mockResolvedValueOnce(mockCredential);
    vi.mocked(db.credential.count).mockResolvedValueOnce(1);

    await handler(req, res);

    expect(db.credential.count).toHaveBeenCalledWith({
      where: {
        userId: 'user123',
      },
    });

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Cannot delete your only credential',
    });
  });

  it.skip('should successfully delete the credential', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { id: 'credential123' },
    });

    const mockSession = {
      expires: new Date().toISOString(),
      user: {
        id: 'user123',
        email: 'user@example.com',
      },
    };

    const mockCredential = {
      id: 'db-cred-id',
      externalId: 'credential123',
      userId: 'user123',
    };

    vi.mocked(rateLimit).mockResolvedValueOnce(true);
    vi.mocked(getSessionFromReq).mockResolvedValueOnce(mockSession);
    vi.mocked(db.credential.findFirst).mockResolvedValueOnce(mockCredential);
    vi.mocked(db.credential.count).mockResolvedValueOnce(2);
    vi.mocked(db.credential.delete).mockResolvedValueOnce(mockCredential);

    await handler(req, res);

    expect(db.credential.delete).toHaveBeenCalledWith({
      where: {
        id: 'db-cred-id',
      },
    });

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
    });
  });

  it.skip('should handle server errors gracefully', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { id: 'credential123' },
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
    vi.mocked(db.credential.findFirst).mockRejectedValueOnce(new Error('Database error'));

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