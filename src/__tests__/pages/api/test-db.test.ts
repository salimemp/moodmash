import type { NextApiRequest, NextApiResponse } from 'next';
import type { MockResponse } from 'node-mocks-http';
import { createMocks } from 'node-mocks-http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the database module
vi.mock('@/lib/db/prisma', () => ({
  db: {
    user: {
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    mood: {
      count: vi.fn(),
    },
    moodLike: {
      count: vi.fn(),
    },
    moodComment: {
      count: vi.fn(),
    },
    achievement: {
      count: vi.fn(),
    },
    moodMash: {
      count: vi.fn(),
    },
  },
}));

// Import after mocking
import { db } from '@/lib/db/prisma';
import handler from '@/pages/api/test-db';

describe('Database Test API Endpoint', () => {
  let req: NextApiRequest;
  let res: MockResponse<NextApiResponse>;
  let mockConsoleError: any;

  beforeEach(() => {
    // Create fresh mocks for each test
    const mocks = createMocks<NextApiRequest, NextApiResponse>();
    req = mocks.req;
    res = mocks.res as MockResponse<NextApiResponse>;

    // Mock console.error to prevent actual console output during tests
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Reset all mocks
    vi.resetAllMocks();
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
  });

  it('should return 200 and database information on successful connection', async () => {
    // Mock database counts
    vi.mocked(db.user.count).mockResolvedValue(10);
    vi.mocked(db.mood.count).mockResolvedValue(100);
    vi.mocked(db.moodLike.count).mockResolvedValue(500);
    vi.mocked(db.moodComment.count).mockResolvedValue(300);
    vi.mocked(db.achievement.count).mockResolvedValue(20);
    vi.mocked(db.moodMash.count).mockResolvedValue(50);

    // Mock sample user
    const mockSampleUser = {
      id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
      moods: [{ id: 'mood1' }, { id: 'mood2' }],
      moodLikes: [{ id: 'like1' }],
      moodComments: [{ id: 'comment1' }, { id: 'comment2' }, { id: 'comment3' }],
      achievements: [
        {
          achievement: {
            name: 'First Mood',
            description: 'Posted your first mood',
            icon: 'smile',
          },
        },
      ],
    };
    
    vi.mocked(db.user.findFirst).mockResolvedValue(mockSampleUser as any);

    // Call the handler
    await handler(req, res);

    // Check the response
    expect(res._getStatusCode()).toBe(200);
    
    const responseData = JSON.parse(res._getData());
    expect(responseData.status).toBe('Database connection successful');
    
    // Check counts
    expect(responseData.counts).toEqual({
      users: 10,
      moods: 100,
      likes: 500,
      comments: 300,
      achievements: 20,
      moodMashes: 50,
    });

    // Check sample user
    expect(responseData.sampleUser).toEqual({
      id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
      moodCount: 2,
      likeCount: 1,
      commentCount: 3,
      achievements: [
        {
          name: 'First Mood',
          description: 'Posted your first mood',
          icon: 'smile',
        },
      ],
    });

    // Verify that the database methods were called
    expect(db.user.count).toHaveBeenCalledTimes(1);
    expect(db.mood.count).toHaveBeenCalledTimes(1);
    expect(db.moodLike.count).toHaveBeenCalledTimes(1);
    expect(db.moodComment.count).toHaveBeenCalledTimes(1);
    expect(db.achievement.count).toHaveBeenCalledTimes(1);
    expect(db.moodMash.count).toHaveBeenCalledTimes(1);
    expect(db.user.findFirst).toHaveBeenCalledTimes(1);
    
    // Verify include options for findFirst
    expect(db.user.findFirst).toHaveBeenCalledWith({
      include: {
        moods: true,
        moodLikes: true,
        moodComments: true,
        achievements: {
          include: {
            achievement: true,
          },
        },
      },
    });
  });

  it('should handle null user result', async () => {
    // Mock database counts
    vi.mocked(db.user.count).mockResolvedValue(0);
    vi.mocked(db.mood.count).mockResolvedValue(0);
    vi.mocked(db.moodLike.count).mockResolvedValue(0);
    vi.mocked(db.moodComment.count).mockResolvedValue(0);
    vi.mocked(db.achievement.count).mockResolvedValue(0);
    vi.mocked(db.moodMash.count).mockResolvedValue(0);

    // Mock empty database (no users)
    vi.mocked(db.user.findFirst).mockResolvedValue(null);

    // Call the handler
    await handler(req, res);

    // Check the response
    expect(res._getStatusCode()).toBe(200);
    
    const responseData = JSON.parse(res._getData());
    expect(responseData.status).toBe('Database connection successful');
    
    // Check counts
    expect(responseData.counts).toEqual({
      users: 0,
      moods: 0,
      likes: 0,
      comments: 0,
      achievements: 0,
      moodMashes: 0,
    });

    // Check sample user with null values
    expect(responseData.sampleUser).toEqual({
      id: undefined,
      name: undefined,
      email: undefined,
      moodCount: undefined,
      likeCount: undefined,
      commentCount: undefined,
      achievements: undefined,
    });
  });

  it('should return 500 on database error', async () => {
    // Mock database error
    const mockError = new Error('Database connection failed');
    vi.mocked(db.user.count).mockRejectedValue(mockError);

    // Call the handler
    await handler(req, res);

    // Check the response
    expect(res._getStatusCode()).toBe(500);
    
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({
      status: 'error',
      message: 'Database connection error',
      error: expect.any(Object),
    });

    // Verify console.error was called with the error
    expect(mockConsoleError).toHaveBeenCalledWith('Database test error:', mockError);
  });
}); 