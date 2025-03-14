/**
 * Storage adapters for rate limiting
 * 
 * This module contains the implementation of storage mechanisms
 * for rate limiting, such as Redis integration.
 */

import { Redis } from '@upstash/redis';
import { RateLimitType, generateRateLimitKey } from './rate-limit-config';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * Interface for rate limit storage interactions
 */
export interface RateLimitStorage {
  increment(key: string): Promise<number>;
  get(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  reset(key: string): Promise<void>;
}

/**
 * Redis implementation of the rate limit storage interface
 */
export class RedisRateLimitStorage implements RateLimitStorage {
  async increment(key: string): Promise<number> {
    try {
      return (await redis.incr(key)) || 0;
    } catch (error) {
      console.error('Redis increment error:', error);
      return 0;
    }
  }

  async get(key: string): Promise<number> {
    try {
      return (await redis.get<number>(key)) || 0;
    } catch (error) {
      console.error('Redis get error:', error);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await redis.expire(key, seconds);
    } catch (error) {
      console.error('Redis expire error:', error);
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }
}

// Create and export a singleton instance of the storage adapter
export const rateLimitStorage = new RedisRateLimitStorage();

/**
 * Convenience methods for rate limit operations
 */

/**
 * Reset rate limit for a specific identifier
 */
export async function resetRateLimit(type: RateLimitType, identifier: string): Promise<void> {
  const key = generateRateLimitKey(type, identifier);
  await rateLimitStorage.reset(key);
}

/**
 * Increment failed attempt counter for login brute force protection
 */
export async function incrementFailedLoginAttempts(identifier: string): Promise<number> {
  const key = generateRateLimitKey('login', identifier);
  const current = await rateLimitStorage.increment(key);

  if (current === 1) {
    await rateLimitStorage.expire(key, 60);
  }

  return current;
} 