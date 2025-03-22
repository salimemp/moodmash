/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests for user moods API endpoint
 * 
 * This test file provides coverage for the GET /api/moods/user endpoint
 */

import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Create module mocks
vi.mock('@/lib/auth/utils', () => ({
  getSessionFromReq: vi.fn()
}));

vi.mock('@/lib/auth/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(true)
}));

vi.mock('@/lib/db/prisma', () => ({
  db: {
    mood: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0)
    }
  }
}));

// Import after mocking
import { rateLimit } from '@/lib/auth/rate-limit';
import { getSessionFromReq } from '@/lib/auth/utils';
import { db } from '@/lib/db/prisma';
import handler from '@/pages/api/moods/user';

describe('User Moods API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject non-GET methods', async () => {
    // Create mock request and response for a POST request
    const { req, res } = createMocks({
      method: 'POST',
    });

    // Call the handler
    await handler(req, res);

    // Verify that the handler returns the correct response
    expect(res._getStatusCode()).toBe(405);
    expect(res._getJSONData()).toEqual({ message: 'Method not allowed' });
  });

  it('should require authentication', async () => {
    // Setup: Create mock request and response
    const { req, res } = createMocks({
      method: 'GET',
    });

    // Mock session to return null
    vi.mocked(getSessionFromReq).mockResolvedValueOnce(null);

    // Execute: Call the handler
    await handler(req, res);

    // Verify: Check responses
    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toEqual({ message: 'Unauthorized' });
  });

  it('should return user moods when authenticated', async () => {
    // Mock data
    const userId = 'user123';
    const mockMoods = [
      { id: 'mood1', title: 'Happy', userId },
      { id: 'mood2', title: 'Sad', userId }
    ];
    const totalCount = 2;

    // Mock database responses
    vi.mocked(db.mood.findMany).mockResolvedValueOnce(mockMoods as any);
    vi.mocked(db.mood.count).mockResolvedValueOnce(totalCount);

    // Mock authenticated session
    const mockSession: any = {
      user: { id: userId, name: 'Test User', email: 'test@example.com' },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    vi.mocked(getSessionFromReq).mockResolvedValueOnce(mockSession);

    // Create mock request and response
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        page: '1',
        limit: '10'
      }
    });

    // Call the handler
    await handler(req, res);

    // Verify successful response
    expect(res._getStatusCode()).toBe(200);
    
    // Check the pagination structure matches what we expect
    const responseData = res._getJSONData();
    expect(responseData).toHaveProperty('moods');
    expect(responseData).toHaveProperty('pagination');
    expect(responseData.pagination).toEqual({
      total: totalCount,
      pages: 1,
      currentPage: 1,
      limit: 10
    });
  });

  it('should handle pagination correctly', async () => {
    // Mock data
    const userId = 'user123';
    const mockMoods = [{ id: 'mood3', title: 'Excited', userId }];
    const totalCount = 21; // Enough for 3 pages with limit of 10

    // Mock database responses
    vi.mocked(db.mood.findMany).mockResolvedValueOnce(mockMoods as any);
    vi.mocked(db.mood.count).mockResolvedValueOnce(totalCount);

    // Mock authenticated session
    const mockSession: any = {
      user: { id: userId, name: 'Test User', email: 'test@example.com' },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    vi.mocked(getSessionFromReq).mockResolvedValueOnce(mockSession);

    // Create mock request and response with page 2
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        page: '2',
        limit: '10'
      }
    });

    // Call the handler
    await handler(req, res);

    // Verify successful response
    expect(res._getStatusCode()).toBe(200);
    
    // Check pagination parameters
    const responseData = res._getJSONData();
    expect(responseData.pagination).toEqual({
      total: totalCount,
      pages: 3,
      currentPage: 2,
      limit: 10
    });

    // Verify correct skip/take parameters were used
    expect(vi.mocked(db.mood.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10, // (2-1) * 10
        take: 10
      })
    );
  });

  it('should handle rate limiting failure', async () => {
    // Setup
    const { req, res } = createMocks({
      method: 'GET',
    });

    // Mock rate limiter to reject request
    vi.mocked(rateLimit).mockResolvedValueOnce(false);

    // Call the handler
    await handler(req, res);

    // Verify database is not called when rate limited
    expect(db.mood.findMany).not.toHaveBeenCalled();
    expect(db.mood.count).not.toHaveBeenCalled();
  });

  it('should handle database errors gracefully', async () => {
    // Setup
    const userId = 'user123';
    const mockSession: any = {
      user: { id: userId, name: 'Test User', email: 'test@example.com' },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    const { req, res } = createMocks({
      method: 'GET',
    });

    // Mock successful authentication but failed DB query
    vi.mocked(getSessionFromReq).mockResolvedValueOnce(mockSession);
    vi.mocked(db.mood.findMany).mockRejectedValueOnce(new Error('Database error'));

    // Call the handler
    await handler(req, res);

    // Verify error response
    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({ message: 'Internal server error' });
  });

  it('should use default pagination when not specified', async () => {
    // Mock data
    const userId = 'user123';
    const mockMoods = [{ id: 'mood1', title: 'Happy', userId }];
    const totalCount = 1;

    // Mock database responses
    vi.mocked(db.mood.findMany).mockResolvedValueOnce(mockMoods as any);
    vi.mocked(db.mood.count).mockResolvedValueOnce(totalCount);

    // Mock authenticated session
    const mockSession: any = {
      user: { id: userId, name: 'Test User', email: 'test@example.com' },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    vi.mocked(getSessionFromReq).mockResolvedValueOnce(mockSession);

    // Create mock request without pagination params
    const { req, res } = createMocks({
      method: 'GET',
      query: {}
    });

    // Call the handler
    await handler(req, res);

    // Verify default pagination was used
    expect(vi.mocked(db.mood.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10
      })
    );
    
    // Check pagination in response
    const responseData = res._getJSONData();
    expect(responseData.pagination.currentPage).toBe(1);
    expect(responseData.pagination.limit).toBe(10);
  });
}); 