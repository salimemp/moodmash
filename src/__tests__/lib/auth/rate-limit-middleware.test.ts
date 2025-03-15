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
      expire: vi.fn()
    }
  };
});

// Mock console.error to avoid test output noise
vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock rate limit configs
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
  },
}));

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
  
  it('should allow requests below the rate limit', async () => {
    // Current count is below the limit
    vi.mocked(rateLimitStorage.get).mockResolvedValue(3);
    vi.mocked(rateLimitStorage.increment).mockResolvedValue(4);
    
    const type: RateLimitType = 'general';
    const result = await rateLimit(mockReq, mockRes, type);
    
    // Should return true to allow the request
    expect(result).toBe(true);
    
    // Should set rate limit headers
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', rateLimits[type].max);
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', rateLimits[type].max - 4);
    
    // Should not set status or return JSON response
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });
  
  it('should block requests that exceed the rate limit', async () => {
    // Current count equals the limit
    const type: RateLimitType = 'auth';
    const limit = rateLimits[type].max;
    
    vi.mocked(rateLimitStorage.get).mockResolvedValue(limit);
    
    const result = await rateLimit(mockReq, mockRes, type);
    
    // Should return false to block the request
    expect(result).toBe(false);
    
    // Should set the retry-after header
    expect(mockRes.setHeader).toHaveBeenCalledWith('Retry-After', rateLimits[type].window);
    
    // Should set status and return JSON response
    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({ message: rateLimits[type].message });
  });
  
  it('should use custom identifier if provided', async () => {
    const type: RateLimitType = 'login';
    const identifier = 'test@example.com';
    
    await rateLimit(mockReq, mockRes, type, identifier);
    
    // Should generate key with the identifier and not IP
    const keyArg = vi.mocked(rateLimitStorage.get).mock.calls[0][0];
    expect(keyArg).toContain(identifier);
    expect(keyArg).not.toContain('127.0.0.1');
  });
  
  it('should use IP address as identifier if none provided', async () => {
    const type: RateLimitType = 'login';
    
    await rateLimit(mockReq, mockRes, type);
    
    // Should generate key with the IP
    const keyArg = vi.mocked(rateLimitStorage.get).mock.calls[0][0];
    expect(keyArg).toContain('127.0.0.1');
  });
  
  it('should set expiry if first request', async () => {
    // Current count is 0 indicating first request
    vi.mocked(rateLimitStorage.get).mockResolvedValue(0);
    
    const type: RateLimitType = 'general';
    await rateLimit(mockReq, mockRes, type);
    
    // Should set expiry
    expect(rateLimitStorage.expire).toHaveBeenCalled();
    expect(vi.mocked(rateLimitStorage.expire).mock.calls[0][1]).toBe(rateLimits[type].window);
  });
  
  it('should not set expiry if not first request', async () => {
    // Current count is non-zero indicating not first request
    vi.mocked(rateLimitStorage.get).mockResolvedValue(1);
    
    await rateLimit(mockReq, mockRes, 'general');
    
    // Should not set expiry
    expect(rateLimitStorage.expire).not.toHaveBeenCalled();
  });
  
  it('should use general type as default if none provided', async () => {
    // Call without specifying type
    await rateLimit(mockReq, mockRes);
    
    // Should use general limit
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', rateLimits['general'].max);
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
}); 