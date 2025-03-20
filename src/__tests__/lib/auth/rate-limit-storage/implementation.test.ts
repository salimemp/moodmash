import { RateLimitType } from '@/lib/auth/rate-limit-config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Use vi.hoisted to define mocks before imports are processed
const mockRedisClient = vi.hoisted(() => ({
  incr: vi.fn(),
  get: vi.fn(),
  expire: vi.fn(),
  del: vi.fn()
}));

// Mock Redis constructor to return our mock implementation
vi.mock('@upstash/redis', () => {
  return {
    Redis: vi.fn().mockImplementation(() => mockRedisClient)
  };
});

// Import after mocking
import { RedisRateLimitStorage, incrementFailedLoginAttempts, resetRateLimit } from '@/lib/auth/rate-limit-storage';

/**
 * Tests for the RedisRateLimitStorage class and related utility functions.
 * 
 * These tests validate:
 * 1. The core CRUD operations (increment, get, expire, reset)
 * 2. Error handling for all operations
 * 3. Edge cases like falsy return values
 * 4. The utility functions that use the storage
 */
describe('RedisRateLimitStorage', () => {
  let storage: RedisRateLimitStorage;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    storage = new RedisRateLimitStorage();
  });

  /**
   * Tests for the increment method, which increases a counter in Redis
   * and handles various edge cases and errors.
   */
  describe('increment method', () => {
    it('should increment a key successfully', async () => {
      mockRedisClient.incr.mockResolvedValue(5);
      
      const result = await storage.increment('test-key');
      
      expect(mockRedisClient.incr).toHaveBeenCalledWith('test-key');
      expect(result).toBe(5);
    });

    it('should handle falsy return values from redis.incr', async () => {
      // Test the case where redis.incr returns null, undefined, or 0
      mockRedisClient.incr.mockResolvedValue(null);
      
      const result = await storage.increment('test-key');
      
      expect(mockRedisClient.incr).toHaveBeenCalledWith('test-key');
      expect(result).toBe(0);

      // Also test with 0 as a return value
      mockRedisClient.incr.mockResolvedValue(0);
      
      const resultWithZero = await storage.increment('test-key');
      
      expect(mockRedisClient.incr).toHaveBeenCalledWith('test-key');
      expect(resultWithZero).toBe(0);
    });

    it('should return 0 on error', async () => {
      mockRedisClient.incr.mockRejectedValue(new Error('Redis error'));
      
      const result = await storage.increment('test-key');
      
      expect(mockRedisClient.incr).toHaveBeenCalledWith('test-key');
      expect(result).toBe(0);
    });
  });

  /**
   * Tests for the get method, which retrieves values from Redis
   * and handles various edge cases and errors.
   */
  describe('get method', () => {
    it('should get a key value successfully', async () => {
      mockRedisClient.get.mockResolvedValue(5);
      
      const result = await storage.get('test-key');
      
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe(5);
    });

    it('should handle null/undefined values', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      
      const result = await storage.get('test-key');
      
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe(0);
    });

    it('should handle zero return values from redis.get', async () => {
      // Test the case where redis.get returns 0 
      mockRedisClient.get.mockResolvedValue(0);
      
      const result = await storage.get('test-key');
      
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe(0);
    });

    it('should return 0 on error', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));
      
      const result = await storage.get('test-key');
      
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe(0);
    });
  });

  /**
   * Tests for the expire method, which sets a TTL on Redis keys
   * and handles errors gracefully.
   */
  describe('expire method', () => {
    it('should set expiration on a key successfully', async () => {
      mockRedisClient.expire.mockResolvedValue(1);
      
      await storage.expire('test-key', 60);
      
      expect(mockRedisClient.expire).toHaveBeenCalledWith('test-key', 60);
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.expire.mockRejectedValue(new Error('Redis error'));
      
      await storage.expire('test-key', 60);
      
      expect(mockRedisClient.expire).toHaveBeenCalledWith('test-key', 60);
    });
  });

  /**
   * Tests for the reset method, which deletes keys from Redis
   * and handles errors gracefully.
   */
  describe('reset method', () => {
    it('should delete a key successfully', async () => {
      mockRedisClient.del.mockResolvedValue(1);
      
      await storage.reset('test-key');
      
      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Redis error'));
      
      await storage.reset('test-key');
      
      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
    });
  });

  /**
   * Tests for the utility functions that build on top of the 
   * storage methods, including resetRateLimit and incrementFailedLoginAttempts.
   */
  describe('utility functions', () => {
    it('should reset rate limit correctly', async () => {
      mockRedisClient.del.mockResolvedValue(1);
      
      await resetRateLimit('login' as RateLimitType, '127.0.0.1');
      
      expect(mockRedisClient.del).toHaveBeenCalledWith('ratelimit:login:127.0.0.1');
    });

    it('should increment failed login attempts', async () => {
      mockRedisClient.incr.mockResolvedValue(1);
      
      const result = await incrementFailedLoginAttempts('user123');
      
      expect(mockRedisClient.incr).toHaveBeenCalledWith('ratelimit:login:user123');
      expect(result).toBe(1);

      // Test subsequent increment
      mockRedisClient.incr.mockResolvedValue(2);
      const result2 = await incrementFailedLoginAttempts('user123');
      expect(result2).toBe(2);
    });

    it('should only set expiration when counter is first incremented', async () => {
      // First attempt - should set expiration
      mockRedisClient.incr.mockResolvedValue(1);
      
      await incrementFailedLoginAttempts('user123');
      
      expect(mockRedisClient.incr).toHaveBeenCalledWith('ratelimit:login:user123');
      expect(mockRedisClient.expire).toHaveBeenCalledWith('ratelimit:login:user123', 60);
      
      // Reset mock call counts
      mockRedisClient.expire.mockClear();
      
      // Second attempt - should not set expiration
      mockRedisClient.incr.mockResolvedValue(2);
      
      await incrementFailedLoginAttempts('user123');
      
      expect(mockRedisClient.incr).toHaveBeenCalledWith('ratelimit:login:user123');
      expect(mockRedisClient.expire).not.toHaveBeenCalled();
      
      // Third attempt - should not set expiration
      mockRedisClient.incr.mockResolvedValue(3);
      
      await incrementFailedLoginAttempts('user123');
      
      expect(mockRedisClient.incr).toHaveBeenCalledWith('ratelimit:login:user123');
      expect(mockRedisClient.expire).not.toHaveBeenCalled();
    });
  });
}); 