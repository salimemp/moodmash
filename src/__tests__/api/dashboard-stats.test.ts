import dashboardStatsHandler from '@/pages/api/dashboard/stats';
import { createMocks } from 'node-mocks-http';
import { describe, expect, it, vi } from 'vitest';

// Mock the auth dependencies
vi.mock('@/lib/auth/utils', () => ({
  getSessionFromReq: vi.fn(),
}));

// Mock the database
vi.mock('@/lib/db/prisma', () => ({
  db: {
    mood: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    moodLike: {
      count: vi.fn(),
    },
    moodComment: {
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock Redis client for rate limiting
vi.mock('@/lib/redis', () => ({
  redisClient: {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn(),
    del: vi.fn(),
    url: 'redis://fake',
    token: 'fake-token'
  },
}));

// Mock rate limiter
vi.mock('@/lib/auth/rate-limit', () => ({
  rateLimit: vi.fn().mockImplementation(() => Promise.resolve({
    success: true,
    limit: 10,
    remaining: 9,
    reset: Date.now() + 60000,
  })),
}));

describe('Dashboard Stats API', () => {
  it('handles method not allowed', async () => {
    // Mock the request
    const { req, res } = createMocks({
      method: 'POST',
    });

    // Call the handler
    await dashboardStatsHandler(req, res);

    // Check for method not allowed response
    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toHaveProperty('message');
  });
});
