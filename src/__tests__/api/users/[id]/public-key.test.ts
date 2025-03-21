/**
 * Tests for user public key API endpoint
 * 
 * This test file provides coverage for the GET /api/users/[id]/public-key endpoint
 */

import { createMocks } from 'node-mocks-http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    encryptionKey: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock the createApiHandler to directly execute the handler function
vi.mock('@/lib/api/handlers', () => ({
  createApiHandler: vi.fn((_, handler) => handler),
}));

// Import after mocks
import { prisma } from '@/lib/prisma';
import handler from '@/pages/api/users/[id]/public-key';

describe('User Public Key API', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('should return 400 if user ID is missing', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {},
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Bad Request',
      message: 'User ID is required',
    });
  });

  it('should return 404 if user does not exist', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: 'non-existent-user' },
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    await handler(req, res);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'non-existent-user' },
    });
    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Not Found',
      message: 'User not found',
    });
  });

  it('should return 404 if public key does not exist', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: 'user-without-key' },
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'user-without-key',
      email: 'test@example.com',
      name: 'Test User',
    } as any);

    vi.mocked(prisma.encryptionKey.findUnique).mockResolvedValueOnce(null);

    await handler(req, res);

    expect(prisma.encryptionKey.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-without-key' },
      select: {
        publicKey: true,
        userId: true,
        createdAt: true,
      },
    });
    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Not Found',
      message: 'Public key not found for this user',
    });
  });

  it('should return 200 with public key data', async () => {
    const mockDate = new Date();
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: 'user-with-key' },
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'user-with-key',
      email: 'test@example.com',
      name: 'Test User',
    } as any);

    vi.mocked(prisma.encryptionKey.findUnique).mockResolvedValueOnce({
      publicKey: 'test-public-key-data',
      userId: 'user-with-key',
      createdAt: mockDate,
    } as any);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      publicKey: 'test-public-key-data',
      userId: 'user-with-key',
      createdAt: mockDate.toISOString(),
    });
  });

  it('should return 500 on server error', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: 'error-user' },
    });

    const mockError = new Error('Database error');
    vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(mockError);

    await handler(req, res);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user public key:', mockError);
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Internal Server Error',
      message: 'Failed to fetch user public key',
    });
  });
}); 