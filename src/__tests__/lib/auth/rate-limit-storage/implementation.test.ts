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

describe('RedisRateLimitStorage', () => {
  let storage: RedisRateLimitStorage;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    storage = new RedisRateLimitStorage();
  });

  describe('increment method', () => {
    it('should increment a key successfully', async () => {
      mockRedisClient.incr.mockResolvedValue(5);
      
      const result = await storage.increment('test-key');
      
      expect(mockRedisClient.incr).toHaveBeenCalledWith('test-key');
      expect(result).toBe(5);
    });

    it('should return 0 on error', async () => {
      mockRedisClient.incr.mockRejectedValue(new Error('Redis error'));
      
      const result = await storage.increment('test-key');
      
      expect(mockRedisClient.incr).toHaveBeenCalledWith('test-key');
      expect(result).toBe(0);
    });
  });

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

    it('should return 0 on error', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));
      
      const result = await storage.get('test-key');
      
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe(0);
    });
  });

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
  });
}); 