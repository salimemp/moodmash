// Import vitest testing utilities
import { describe, expect, it, vi } from 'vitest';

// First, mock all necessary modules properly
vi.mock('@/lib/auth/rate-limit-config');
vi.mock('@/lib/auth/rate-limit-storage');
vi.mock('@/lib/auth/rate-limit-middleware');
vi.mock('@/lib/auth/rate-limit-client');

// Important: unmock the module we're testing to get the real exports
vi.mock('@/lib/auth/rate-limit', async (importOriginal) => {
  const actual = await importOriginal();
  return actual;
});

// Import the modules after mocking
import * as rateLimitModule from '@/lib/auth/rate-limit';
import * as rateLimitClientModule from '@/lib/auth/rate-limit-client';
import * as rateLimitConfigModule from '@/lib/auth/rate-limit-config';
import * as rateLimitMiddlewareModule from '@/lib/auth/rate-limit-middleware';
import * as rateLimitStorageModule from '@/lib/auth/rate-limit-storage';

// Tests for Rate Limit module
describe('Rate Limit Module', () => {
  // Test for module existence
  it('should be properly defined', () => {
    expect(rateLimitModule).toBeDefined();
    expect(typeof rateLimitModule.rateLimit).toBe('function');
  });

  // Test that the module exists and re-exports functions
  it('should re-export rate limiting functions', () => {
    // Verify that main rate-limit module exports include the expected functions
    expect(typeof rateLimitModule.generateRateLimitKey).toBe('function');
    expect(typeof rateLimitModule.generateIPRateLimitKey).toBe('function');
    expect(typeof rateLimitModule.rateLimit).toBe('function');
    expect(typeof rateLimitModule.throttle).toBe('function');
    expect(typeof rateLimitModule.withBackoff).toBe('function');
    expect(typeof rateLimitModule.resetRateLimit).toBe('function');
    expect(typeof rateLimitModule.incrementFailedLoginAttempts).toBe('function');
    expect(rateLimitModule.rateLimits).toBeDefined();
    expect(rateLimitModule.rateLimitStorage).toBeDefined();
  });

  // Test for config exports
  it('should re-export functions from rate-limit-config', () => {
    expect(rateLimitModule.generateIPRateLimitKey).toBe(rateLimitConfigModule.generateIPRateLimitKey);
    expect(rateLimitModule.generateRateLimitKey).toBe(rateLimitConfigModule.generateRateLimitKey);
    expect(rateLimitModule.rateLimits).toBe(rateLimitConfigModule.rateLimits);
  });

  // Test for storage exports
  it('should re-export functions from rate-limit-storage', () => {
    expect(rateLimitModule.incrementFailedLoginAttempts).toBe(rateLimitStorageModule.incrementFailedLoginAttempts);
    expect(rateLimitModule.rateLimitStorage).toBe(rateLimitStorageModule.rateLimitStorage);
    expect(rateLimitModule.resetRateLimit).toBe(rateLimitStorageModule.resetRateLimit);
  });

  // Test for middleware exports
  it('should re-export functions from rate-limit-middleware', () => {
    expect(rateLimitModule.rateLimit).toBe(rateLimitMiddlewareModule.rateLimit);
  });

  // Test for client exports
  it('should re-export functions from rate-limit-client', () => {
    expect(rateLimitModule.throttle).toBe(rateLimitClientModule.throttle);
    expect(rateLimitModule.withBackoff).toBe(rateLimitClientModule.withBackoff);
  });
}); 