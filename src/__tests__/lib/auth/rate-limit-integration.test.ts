import { RateLimitType, rateLimits } from '@/lib/auth/rate-limit-config';
import { rateLimit } from '@/lib/auth/rate-limit-middleware';
import { rateLimitStorage } from '@/lib/auth/rate-limit-storage';
import { NextApiRequest, NextApiResponse } from 'next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the rate-limit-storage module
vi.mock('@/lib/auth/rate-limit-storage', () => {
  return {
    rateLimitStorage: {
      get: vi.fn(),
      increment: vi.fn(),
      expire: vi.fn(),
      reset: vi.fn()
    }
  };
});

// Mock the rate-limit-client module
vi.mock('@/lib/auth/rate-limit-client', () => {
  const throttleMock = vi.fn((fn, _options) => {
    // Simple implementation for testing
    return async (...args: any[]) => {
      return fn(...args);
    };
  });

  const withBackoffMock = vi.fn((fn, options) => {
    // Simple implementation for testing - will retry once
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return async (...args: any[]) => {
      try {
        return await fn(...args);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error.status === 429 || error.statusCode === 429) {
          // Call onRetry if provided
          if (options?.onRetry) {
            options.onRetry(1, error);
          }
          // For testing, allow second call to succeed
          return { success: true };
        }
        throw error;
      }
    };
  });

  return {
    throttle: throttleMock,
    withBackoff: withBackoffMock
  };
});

// Mock Next.js response methods
const createMockResponse = () => {
  const statusSpy = vi.fn().mockReturnThis();
  return {
    status: statusSpy,
    setHeader: vi.fn(),
    json: vi.fn(),
    // Add a helper property to check what status was set
    get statusCode() {
      return statusSpy.mock.calls.length > 0 ? statusSpy.mock.calls[0][0] : 0;
    }
  } as unknown as NextApiResponse & { statusCode: number };
};

describe('Rate Limiting System Integration', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Create a new console.error spy for each test
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Default mock implementations
    vi.mocked(rateLimitStorage.get).mockResolvedValue(0);
    vi.mocked(rateLimitStorage.increment).mockResolvedValue(1);
    vi.mocked(rateLimitStorage.expire).mockResolvedValue(undefined);
    vi.mocked(rateLimitStorage.reset).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Client-Server Integration', () => {
    it('should successfully make requests while under rate limit', async () => {
      const mockReq = {
        headers: { 'x-forwarded-for': '127.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' }
      } as unknown as NextApiRequest;
      
      const mockRes = createMockResponse();
      
      // Setup storage to simulate counts below the limit
      vi.mocked(rateLimitStorage.get).mockResolvedValue(2);
      vi.mocked(rateLimitStorage.increment).mockResolvedValue(3);
      
      // Mock API function for testing
      const apiCall = vi.fn().mockResolvedValue({ success: true, data: 'test' });
      
      // First API call should go through rate limit middleware
      const isAllowed = await rateLimit(mockReq, mockRes, 'general');
      expect(isAllowed).toBe(true);
      
      // Make API call
      const result = await apiCall();
      expect(apiCall).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ success: true, data: 'test' });
      
      // Verify storage interactions
      expect(rateLimitStorage.get).toHaveBeenCalled();
      expect(rateLimitStorage.increment).toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', rateLimits.general.max);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', rateLimits.general.max - 3);
    });
    
    it('should block requests when rate limit is exceeded', async () => {
      const mockReq = {
        headers: { 'x-forwarded-for': '127.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' }
      } as unknown as NextApiRequest;
      
      const mockRes = createMockResponse();
      
      // Setup storage to simulate rate limit exceeded
      const type: RateLimitType = 'login';
      const limit = rateLimits[type].max;
      vi.mocked(rateLimitStorage.get).mockResolvedValue(limit);
      
      // Check if request is rate limited
      const isAllowed = await rateLimit(mockReq, mockRes, type);
      expect(isAllowed).toBe(false);
      
      // Middleware should have set proper headers and status
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Retry-After', rateLimits[type].window);
      expect(mockRes.json).toHaveBeenCalledWith({ message: rateLimits[type].message });
    });
    
    it('should handle storage errors gracefully', async () => {
      const mockReq = {
        headers: { 'x-forwarded-for': '127.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' }
      } as unknown as NextApiRequest;
      
      const mockRes = createMockResponse();
      
      // Simulate Redis connection errors
      const error = new Error('Redis connection error');
      vi.mocked(rateLimitStorage.get).mockRejectedValue(error);
      
      // Even with storage errors, the middleware should allow requests
      const isAllowed = await rateLimit(mockReq, mockRes);
      expect(isAllowed).toBe(true);
      
      // Console error should have been called with the error
      expect(consoleErrorSpy).toHaveBeenCalledWith('Rate limit error:', error);
    });
  });
  
  describe('Different Rate Limit Types', () => {
    it('should apply different limits based on rate limit type', async () => {
      const mockReq = {
        headers: { 'x-forwarded-for': '127.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' }
      } as unknown as NextApiRequest;
      
      // Test with various rate limit types
      const typesToTest: RateLimitType[] = ['general', 'auth', 'login', 'mfa'];
      
      for (const type of typesToTest) {
        const mockRes = createMockResponse();
        vi.mocked(rateLimitStorage.get).mockResolvedValue(1);
        vi.mocked(rateLimitStorage.increment).mockResolvedValue(2);
        
        await rateLimit(mockReq, mockRes, type);
        
        // Should set correct limit headers for the type
        expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', rateLimits[type].max);
        expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', rateLimits[type].max - 2);
      }
    });
    
    it('should use custom identifier if provided', async () => {
      const mockReq = {
        headers: { 'x-forwarded-for': '127.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' }
      } as unknown as NextApiRequest;
      
      const mockRes = createMockResponse();
      const identifier = 'test@example.com';
      
      await rateLimit(mockReq, mockRes, 'login', identifier);
      
      // Check that the get call used the email identifier not IP
      const getCall = vi.mocked(rateLimitStorage.get).mock.calls[0][0];
      expect(getCall).toContain(identifier);
      expect(getCall).not.toContain('127.0.0.1');
    });
  });
  
  describe('End-to-End API Request Flow', () => {
    // Setup a simulated API endpoint that uses rate limiting
    const createApiEndpoint = (type: RateLimitType = 'general') => {
      return async (req: NextApiRequest, res: NextApiResponse) => {
        // Apply rate limiting
        const isAllowed = await rateLimit(req, res, type);
        
        if (!isAllowed) {
          // Response already set by middleware
          return;
        }
        
        // Process the request
        return res.status(200).json({ success: true });
      };
    };
    
    it('should successfully process requests under the limit', async () => {
      const mockReq = {
        headers: { 'x-forwarded-for': '127.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' }
      } as unknown as NextApiRequest;
      
      const mockRes = createMockResponse();
      const endpoint = createApiEndpoint('api');
      
      // Simulate counts below the limit
      vi.mocked(rateLimitStorage.get).mockResolvedValue(5);
      vi.mocked(rateLimitStorage.increment).mockResolvedValue(6);
      
      // Call the API endpoint
      await endpoint(mockReq, mockRes);
      
      // Should have set rate limit headers
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', rateLimits.api.max);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', rateLimits.api.max - 6);
      
      // Should have returned success
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });
    
    it('should block requests that exceed the limit', async () => {
      const mockReq = {
        headers: { 'x-forwarded-for': '127.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' }
      } as unknown as NextApiRequest;
      
      const mockRes = createMockResponse();
      const endpoint = createApiEndpoint('api');
      
      // Simulate rate limit exceeded
      vi.mocked(rateLimitStorage.get).mockResolvedValue(rateLimits.api.max);
      
      // Call the API endpoint
      await endpoint(mockReq, mockRes);
      
      // Should have set rate limit exceeded status and headers
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Retry-After', rateLimits.api.window);
      expect(mockRes.json).toHaveBeenCalledWith({ message: rateLimits.api.message });
    });
  });
});
