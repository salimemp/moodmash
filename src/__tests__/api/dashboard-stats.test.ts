import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import dashboardStatsHandler from '@/pages/api/dashboard/stats';
import { getSessionFromReq } from '@/lib/auth/utils';
import { db } from '@/lib/db/prisma';

// Mock the dependencies
jest.mock('@/lib/auth/utils', () => ({
  getSessionFromReq: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => {
  const mockDb = {
    mood: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    moodLike: {
      count: jest.fn(),
    },
    moodComment: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  
  return { db: mockDb };
});

// Sample user for tests
const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
};

// Sample session for tests
const mockSession = {
  user: mockUser,
  expires: '2099-01-01T00:00:00.000Z',
};

// Sample mood data for tests
const mockMoods = [
  {
    id: 'mood1',
    emoji: '😀',
    text: 'Feeling good!',
    gradientColors: ['#ff0000', '#00ff00'],
    createdAt: new Date('2023-01-01'),
    _count: {
      moodLikes: 5,
      moodComments: 2,
    },
  },
  {
    id: 'mood2',
    emoji: '😢',
    text: 'Feeling sad',
    gradientColors: ['#0000ff', '#ff00ff'],
    createdAt: new Date('2023-01-02'),
    _count: {
      moodLikes: 3,
      moodComments: 1,
    },
  },
];

describe('/api/dashboard/stats', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Set up default session
    (getSessionFromReq as jest.Mock).mockResolvedValue(mockSession);
    
    // Set up $transaction mock to return an array of results
    (db.$transaction as jest.Mock).mockImplementation(async (queries) => {
      // Execute each query function to get its mock result
      const results = [];
      for (const query of queries) {
        const result = await query;
        results.push(result);
      }
      return results;
    });
    
    // Set up default mock return values
    (db.mood.count as jest.Mock).mockResolvedValue(10);
    (db.moodLike.count as jest.Mock).mockResolvedValue(25);
    (db.moodComment.count as jest.Mock).mockResolvedValue(15);
    (db.mood.findMany as jest.Mock).mockResolvedValue(mockMoods);
  });

  it('returns dashboard stats successfully', async () => {
    // Mock the request
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    // Call the handler
    await dashboardStatsHandler(req, res);

    // Check response
    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    
    // Check for expected properties
    expect(responseData).toHaveProperty('moodCount', 10);
    expect(responseData).toHaveProperty('likesReceived', 25);
    expect(responseData).toHaveProperty('commentsReceived', 15);
    expect(responseData).toHaveProperty('recentActivity');
    expect(responseData).toHaveProperty('lastUpdated');
    
    // Check that activity data is formatted correctly
    expect(responseData.recentActivity).toHaveLength(2);
    expect(responseData.recentActivity[0]).toHaveProperty('id', 'mood1');
    expect(responseData.recentActivity[0]).toHaveProperty('emoji', '😀');
    expect(responseData.recentActivity[0]).toHaveProperty('likes', 5);
    expect(responseData.recentActivity[0]).toHaveProperty('comments', 2);
    
    // Verify the transaction was called with the right queries
    expect(db.$transaction).toHaveBeenCalled();
    expect(db.mood.count).toHaveBeenCalledWith({
      where: { userId: mockUser.id },
    });
  });

  it('handles missing user authentication', async () => {
    // Mock no session
    (getSessionFromReq as jest.Mock).mockResolvedValue(null);
    
    // Mock the request
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    // Call the handler
    await dashboardStatsHandler(req, res);

    // Should return unauthorized
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toHaveProperty('message');
    
    // DB queries should not be called
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('handles database errors', async () => {
    // Mock a database error
    const dbError = new Error('Database error');
    (dbError as any).code = 'P2002'; // Simulate a Prisma error code
    (db.$transaction as jest.Mock).mockRejectedValue(dbError);
    
    // Mock the request
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    // Call the handler
    await dashboardStatsHandler(req, res);

    // Should return server error with Prisma code
    expect(res._getStatusCode()).toBe(500);
    const errorResponse = JSON.parse(res._getData());
    expect(errorResponse).toHaveProperty('message', 'Database error');
    expect(errorResponse).toHaveProperty('code', 'P2002');
  });

  it('handles zero counts correctly', async () => {
    // Mock empty counts and activity
    (db.mood.count as jest.Mock).mockResolvedValue(0);
    (db.moodLike.count as jest.Mock).mockResolvedValue(0);
    (db.moodComment.count as jest.Mock).mockResolvedValue(0);
    (db.mood.findMany as jest.Mock).mockResolvedValue([]);
    
    // Mock the request
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    // Call the handler
    await dashboardStatsHandler(req, res);

    // Check response
    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    
    // Check zero counts
    expect(responseData).toHaveProperty('moodCount', 0);
    expect(responseData).toHaveProperty('likesReceived', 0);
    expect(responseData).toHaveProperty('commentsReceived', 0);
    expect(responseData.recentActivity).toHaveLength(0);
  });
}); 