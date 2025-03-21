import type { NextApiRequest, NextApiResponse } from 'next';
import type { MockResponse } from 'node-mocks-http';
import { createMocks } from 'node-mocks-http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the database module
vi.mock('@/lib/db/prisma', () => ({
  db: {
    $queryRaw: vi.fn(),
  },
}));

// Mock environment variables
const originalEnv = { ...process.env };

// Import after mocking
import { db } from '@/lib/db/prisma';
import handler from '@/pages/api/health';

describe('Health API Endpoint', () => {
  let req: NextApiRequest;
  let res: MockResponse<NextApiResponse>;
  let mockConsoleError: any;

  beforeEach(() => {
    // Create fresh mocks for each test
    const mocks = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });
    req = mocks.req;
    res = mocks.res as MockResponse<NextApiResponse>;

    // Mock console.error to prevent actual console output during tests
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Reset all mocks
    vi.resetAllMocks();
    
    // Mock Date.now for consistent timestamps in tests
    const mockDate = new Date('2023-01-01T12:00:00.000Z');
    vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it('should return 200 and healthy status when database is connected', async () => {
    // Mock successful database query
    vi.mocked(db.$queryRaw).mockResolvedValue([{ '1': 1 }]);
    
    // Set environment variables for testing
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('npm_package_version', '1.0.0');

    // Call the handler
    await handler(req, res);

    // Check the response
    expect(res._getStatusCode()).toBe(200);
    
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({
      status: 'healthy',
      timestamp: '2023-01-01T12:00:00.000Z',
      environment: 'test',
      version: '1.0.0',
    });

    // Verify that the database query was called
    expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    expect(db.$queryRaw).toHaveBeenCalledWith(expect.any(Object)); // SQL template literal
  });

  it('should use default values when environment variables are not set', async () => {
    // Mock successful database query
    vi.mocked(db.$queryRaw).mockResolvedValue([{ '1': 1 }]);
    
    // Mock missing environment variables by providing empty values
    vi.stubEnv('NODE_ENV', '');
    vi.stubEnv('npm_package_version', '');

    // Call the handler
    await handler(req, res);

    // Check the response
    expect(res._getStatusCode()).toBe(200);
    
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({
      status: 'healthy',
      timestamp: '2023-01-01T12:00:00.000Z',
      environment: 'development',
      version: '0.1.0',
    });
  });

  it('should return 503 when database connection fails', async () => {
    // Mock database error
    const mockError = new Error('Database connection failed');
    vi.mocked(db.$queryRaw).mockRejectedValue(mockError);

    // Call the handler
    await handler(req, res);

    // Check the response
    expect(res._getStatusCode()).toBe(503);
    
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({
      status: 'unhealthy',
      message: 'Database connection failed',
      timestamp: '2023-01-01T12:00:00.000Z',
    });

    // Verify console.error was called with the error
    expect(mockConsoleError).toHaveBeenCalledWith('Health check failed:', mockError);
  });

  it('should return 405 for non-GET methods', async () => {
    // Create a POST request
    const mocks = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    });
    req = mocks.req;
    res = mocks.res as MockResponse<NextApiResponse>;

    // Call the handler
    await handler(req, res);

    // Check the response
    expect(res._getStatusCode()).toBe(405);
    
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({
      message: 'Method not allowed',
    });

    // Verify that the database query was not called
    expect(db.$queryRaw).not.toHaveBeenCalled();
  });
}); 