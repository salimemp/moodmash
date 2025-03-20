import { NextApiRequest, NextApiResponse } from 'next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the rate-limit-storage module
vi.mock('@/lib/auth/rate-limit-storage', () => {
  return {
    rateLimitStorage: {
      get: vi.fn(),
      increment: vi.fn(),
      expire: vi.fn()
    }
  };
});

// Import after mocks
import { rateLimit } from '@/lib/auth/rate-limit-middleware';
import { rateLimitStorage } from '@/lib/auth/rate-limit-storage';

// Mock console.error to avoid test output noise
vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock rate limit configs with all required types
vi.mock('@/lib/auth/rate-limit-config', () => ({
  generateIPRateLimitKey: vi.fn((type, ip) => `ratelimit:${type}:ip:${ip}`),
  generateRateLimitKey: vi.fn((type, identifier) => `ratelimit:${type}:${identifier}`),
  rateLimits: {
    general: {
      max: 60,
      window: 60,
      message: 'Too many requests',
    },
    auth: {
      max: 10,
      window: 60,
      message: 'Too many auth attempts',
    },
    login: {
      max: 5,
      window: 300,
      message: 'Too many login attempts',
    },
    api: {
      max: 100,
      window: 60,
      message: 'API rate limit exceeded',
    }
  },
}));

/**
 * Tests for the rate-limit-middleware module
 * 
 * These tests verify:
 * 1. Basic rate limiting functionality (allowing vs. blocking requests)
 * 2. Proper headers are set for rate-limited responses
 * 3. Both IP-based and custom identifier rate limiting
 * 4. Error handling and fallback behavior
 */
describe('Rate Limit Middleware', () => {
  let mockReq: NextApiRequest;
  let mockRes: NextApiResponse;
  let originalConsoleError: typeof console.error;
  
  beforeEach(() => {
    // Save original console.error
    originalConsoleError = console.error;
    
    // Reset all mocks
    vi.resetAllMocks();
    
    // Setup mock request and response
    mockReq = {
      headers: {
        'x-forwarded-for': '127.0.0.1',
      },
      socket: {
        remoteAddress: '127.0.0.1'
      }
    } as unknown as NextApiRequest;
    
    mockRes = {
      status: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      json: vi.fn(),
    } as unknown as NextApiResponse;
    
    // Setup default mock implementations
    vi.mocked(rateLimitStorage.get).mockResolvedValue(0);
    vi.mocked(rateLimitStorage.increment).mockResolvedValue(1);
    vi.mocked(rateLimitStorage.expire).mockResolvedValue(undefined);
  });
  
  afterEach(() => {
    // Restore original console.error
    console.error = originalConsoleError;
  });

  /**
   * Tests for successful rate limiting scenarios where 
   * requests are allowed because they are below the limit
   */
  describe('allowing requests', () => {
    it('should allow first request', async () => {
      // Count starts at 0, increments to 1
      vi.mocked(rateLimitStorage.get).mockResolvedValue(0);
      vi.mocked(rateLimitStorage.increment).mockResolvedValue(1);
      
      const result = await rateLimit(mockReq, mockRes, 'general');
      
      expect(result).toBe(true);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 60);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 59);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow requests below the rate limit', async () => {
      // Current count is below the limit
      vi.mocked(rateLimitStorage.get).mockResolvedValue(3);
      vi.mocked(rateLimitStorage.increment).mockResolvedValue(4);
      
      const result = await rateLimit(mockReq, mockRes, 'general');
      
      // Should return true to allow the request
      expect(result).toBe(true);
      
      // Should set rate limit headers
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 60);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 56);
      
      // Should not set status or return JSON response
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
    
    it('should allow request at exactly one below the limit', async () => {
      // Count is one below the max
      vi.mocked(rateLimitStorage.get).mockResolvedValue(9);
      vi.mocked(rateLimitStorage.increment).mockResolvedValue(10);
      
      const result = await rateLimit(mockReq, mockRes, 'auth');
      
      expect(result).toBe(true);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 0);
    });

    it('should use general type as default if none provided', async () => {
      // Call without specifying type
      await rateLimit(mockReq, mockRes);
      
      // Should use general limit
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 60);
    });
  });

  /**
   * Tests for rate limiting scenarios where requests are blocked
   * because they exceed the configured limits
   */
  describe('blocking requests', () => {
    it('should block requests that equal the rate limit', async () => {
      // Current count equals the limit
      const type = 'auth';
      const limit = 10; // Using auth limit from mock
      
      vi.mocked(rateLimitStorage.get).mockResolvedValue(limit);
      
      const result = await rateLimit(mockReq, mockRes, type);
      
      // Should return false to block the request
      expect(result).toBe(false);
      
      // Should set the retry-after header
      expect(mockRes.setHeader).toHaveBeenCalledWith('Retry-After', 60);
      
      // Should set status and return JSON response
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Too many auth attempts' });
    });

    it('should block requests that exceed the rate limit', async () => {
      // Current count exceeds the limit
      vi.mocked(rateLimitStorage.get).mockResolvedValue(11);
      
      const result = await rateLimit(mockReq, mockRes, 'auth');
      
      expect(result).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(429);
    });
  });

  /**
   * Tests for identifier handling in rate limiting
   */
  describe('identifier handling', () => {
    it('should use custom identifier if provided', async () => {
      const identifier = 'test@example.com';
      
      await rateLimit(mockReq, mockRes, 'login', identifier);
      
      // Should generate key with the identifier and not IP
      const keyArg = vi.mocked(rateLimitStorage.get).mock.calls[0][0];
      expect(keyArg).toContain(identifier);
      expect(keyArg).not.toContain('127.0.0.1');
    });
    
    it('should use IP address as identifier if none provided', async () => {
      await rateLimit(mockReq, mockRes, 'login');
      
      // Should generate key with the IP
      const keyArg = vi.mocked(rateLimitStorage.get).mock.calls[0][0];
      expect(keyArg).toContain('127.0.0.1');
    });
    
    it('should fallback to "unknown" IP if no IP address found', async () => {
      // Create request with no IP information
      const reqWithNoIP = {
        headers: {},
        socket: {}
      } as unknown as NextApiRequest;
      
      await rateLimit(reqWithNoIP, mockRes);
      
      // Should use "unknown" in the key
      const keyArg = vi.mocked(rateLimitStorage.get).mock.calls[0][0];
      expect(keyArg).toContain('unknown');
    });
  });

  /**
   * Tests for expiry settings in rate limiting
   */
  describe('expiry handling', () => {
    it('should set expiry if first request', async () => {
      // Current count is 0 indicating first request
      vi.mocked(rateLimitStorage.get).mockResolvedValue(0);
      
      await rateLimit(mockReq, mockRes, 'general');
      
      // Should set expiry
      expect(rateLimitStorage.expire).toHaveBeenCalled();
      expect(vi.mocked(rateLimitStorage.expire).mock.calls[0][1]).toBe(60);
    });
    
    it('should not set expiry if not first request', async () => {
      // Current count is non-zero indicating not first request
      vi.mocked(rateLimitStorage.get).mockResolvedValue(1);
      
      await rateLimit(mockReq, mockRes, 'general');
      
      // Should not set expiry
      expect(rateLimitStorage.expire).not.toHaveBeenCalled();
    });
  });

  /**
   * Tests for error handling in rate limiting
   */
  describe('error handling', () => {
    it('should allow requests if rate limiting fails', async () => {
      // Mock a storage error
      vi.mocked(rateLimitStorage.get).mockRejectedValue(new Error('Storage error'));
      
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      const result = await rateLimit(mockReq, mockRes);
      
      // Should allow the request despite the error
      expect(result).toBe(true);
      
      // Should log the error
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
    
    it('should properly handle error in increment', async () => {
      // Normal get, but error on increment
      vi.mocked(rateLimitStorage.get).mockResolvedValue(1);
      vi.mocked(rateLimitStorage.increment).mockRejectedValue(new Error('Increment error'));
      
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      const result = await rateLimit(mockReq, mockRes);
      
      // Should still allow the request
      expect(result).toBe(true);
      
      // Should log the error
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle error in expire', async () => {
      // Configure a failure in the expire call
      vi.mocked(rateLimitStorage.get).mockResolvedValue(0);
      vi.mocked(rateLimitStorage.increment).mockResolvedValue(1);
      vi.mocked(rateLimitStorage.expire).mockRejectedValue(new Error('Expire error'));
      
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      const result = await rateLimit(mockReq, mockRes);
      
      // Should still allow the request
      expect(result).toBe(true);
      
      // Should log the error
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
}); 