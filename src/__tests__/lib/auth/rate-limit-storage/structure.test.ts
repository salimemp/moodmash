import { RedisRateLimitStorage, rateLimitStorage } from '@/lib/auth/rate-limit-storage';
import { describe, expect, it, vi } from 'vitest';

// Mock Redis with a simple implementation
vi.mock('@upstash/redis', () => {
  return {
    Redis: vi.fn().mockImplementation(() => ({
      incr: vi.fn().mockResolvedValue(1),
      get: vi.fn().mockResolvedValue('1'),
      expire: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue('OK')
    }))
  };
});

describe('RedisRateLimitStorage Structure', () => {
  it('should have the required methods', () => {
    const storage = new RedisRateLimitStorage();
    
    // Check that the class has the expected methods
    expect(typeof storage.increment).toBe('function');
    expect(typeof storage.get).toBe('function');
    expect(typeof storage.expire).toBe('function');
    expect(typeof storage.reset).toBe('function');
  });

  it('should export a singleton instance of RedisRateLimitStorage', () => {
    expect(rateLimitStorage).toBeInstanceOf(RedisRateLimitStorage);
  });
}); 