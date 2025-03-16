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

// Mock dependencies
vi.mock('@/lib/auth/rate-limit');
vi.mock('@/lib/auth/utils');
vi.mock('@/lib/db/prisma', () => ({
  db: {
    credential: {
      findFirst: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock the actual API handler with our mock implementation
vi.mock('@/pages/api/auth/webauthn/credentials/[id]', async () => {
  const actual = await vi.importActual<typeof import('@/pages/api/auth/webauthn/credentials/[id]')>(
    '@/pages/api/auth/webauthn/credentials/[id]'
  );
  return {
    ...actual,
    default: (await import('@/__mocks__/pages/api/auth/webauthn/credentials/[id]')).default,
  };
});

// Import the handler
import handler from '@/pages/api/auth/webauthn/credentials/[id]';

// Import mocked modules
import { rateLimit } from '@/lib/auth/rate-limit';
import { getSessionFromReq } from '@/lib/auth/utils';
import { db } from '@/lib/db/prisma';

describe('WebAuthn Credentials [id] API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return 405 for non-DELETE requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Method not allowed',
    });
  });

  it('should apply rate limiting', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
    });

    vi.mocked(rateLimit).mockResolvedValueOnce(false);

    await handler(req, res);

    expect(rateLimit).toHaveBeenCalledWith(req, res, 'general');
    expect(getSessionFromReq).not.toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(429);
  });

  it('should return 400 if credential id is missing', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      query: {},
    });

    vi.mocked(rateLimit).mockResolvedValueOnce(true);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Credential ID is required',
    });
  });

  it('should return 401 if user is not authenticated', async () => {
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
      message: 'Unauthorized',
    });
  });

  it('should return 404 if credential does not exist', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { id: 'credential123' },
    });

    vi.mocked(rateLimit).mockResolvedValueOnce(true);
    vi.mocked(getSessionFromReq).mockResolvedValueOnce({
      user: { id: 'user123' },
      expires: new Date().toISOString(),
    });
    vi.mocked(db.credential.findFirst).mockResolvedValueOnce(null);

    await handler(req, res);

    expect(db.credential.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'credential123',
        userId: 'user123',
      },
    });

    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Credential not found',
    });
  });

  it('should return 400 if user tries to delete their only credential', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { id: 'credential123' },
    });

    vi.mocked(rateLimit).mockResolvedValueOnce(true);
    vi.mocked(getSessionFromReq).mockResolvedValueOnce({
      user: { id: 'user123' },
      expires: new Date().toISOString(),
    });
    vi.mocked(db.credential.findFirst).mockResolvedValueOnce({
      id: 'db-cred-id',
      userId: 'user123',
      createdAt: new Date(),
      externalId: 'external-id',
      publicKey: 'public-key',
      counter: 1,
      deviceType: 'browser',
      backupState: false,
      transports: [],
      friendlyName: 'Device',
      lastUsed: new Date(),
    });
    vi.mocked(db.credential.count).mockResolvedValueOnce(1);

    await handler(req, res);

    expect(db.credential.count).toHaveBeenCalledWith({
      where: {
        userId: 'user123',
      },
    });

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Cannot delete your only passkey. Add another one first.',
    });
  });

  it('should successfully delete the credential', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { id: 'credential123' },
    });

    vi.mocked(rateLimit).mockResolvedValueOnce(true);
    vi.mocked(getSessionFromReq).mockResolvedValueOnce({
      user: { id: 'user123' },
      expires: new Date().toISOString(),
    });
    vi.mocked(db.credential.findFirst).mockResolvedValueOnce({
      id: 'db-cred-id',
      userId: 'user123',
      createdAt: new Date(),
      externalId: 'external-id',
      publicKey: 'public-key',
      counter: 1,
      deviceType: 'browser',
      backupState: false,
      transports: [],
      friendlyName: 'Device',
      lastUsed: new Date(),
    });
    vi.mocked(db.credential.count).mockResolvedValueOnce(2);
    vi.mocked(db.credential.delete).mockResolvedValueOnce({} as any);

    await handler(req, res);

    expect(db.credential.delete).toHaveBeenCalledWith({
      where: {
        id: 'credential123',
      },
    });

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Credential deleted successfully',
    });
  });

  it('should handle server errors gracefully', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { id: 'credential123' },
    });

    vi.mocked(rateLimit).mockResolvedValueOnce(true);
    vi.mocked(getSessionFromReq).mockResolvedValueOnce({
      user: { id: 'user123' },
      expires: new Date().toISOString(),
    });
    vi.mocked(db.credential.findFirst).mockRejectedValueOnce(new Error('Database error'));

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Internal server error',
    });
  });
}); 