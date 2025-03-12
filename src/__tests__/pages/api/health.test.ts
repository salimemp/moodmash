import { db } from '@/lib/db/prisma';
import healthHandler from '@/pages/api/health';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db/prisma', () => ({
  db: {
    $queryRaw: vi.fn(),
  },
}));

// Tests for Health API
// Validates API health check functionality
describe('Health API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock environment variables
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('npm_package_version', '0.1.0');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // Verifies that the API rejects non-GET methods
  // Ensures correct HTTP method validation
  it('should return 405 for non-GET requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    await healthHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Method not allowed',
    });
  });

  // Verifies successful health check
  // Ensures the API returns healthy status when database is connected
  it('should return 200 and healthy status when database is connected', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    // Mock successful database query
    vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ '1': 1 }]);

    await healthHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({
      status: 'healthy',
      timestamp: expect.any(String),
      environment: 'test',
      version: '0.1.0',
    });
    
    // Verify timestamp is a valid ISO date string
    expect(() => new Date(responseData.timestamp)).not.toThrow();
    
    // Verify database was queried
    expect(db.$queryRaw).toHaveBeenCalled();
  });

  // Verifies unhealthy status when database connection fails
  // Ensures the API correctly reports database connectivity issues
  it('should return 503 when database connection fails', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    // Mock database error
    vi.mocked(db.$queryRaw).mockRejectedValueOnce(new Error('Database connection error'));

    // Mock console.error to prevent test output pollution
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await healthHandler(req, res);

    expect(res._getStatusCode()).toBe(503);
    
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({
      status: 'unhealthy',
      message: 'Database connection failed',
      timestamp: expect.any(String),
    });
    
    // Verify timestamp is a valid ISO date string
    expect(() => new Date(responseData.timestamp)).not.toThrow();
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
}); 