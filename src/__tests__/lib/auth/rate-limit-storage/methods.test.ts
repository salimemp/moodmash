import { RateLimitType, generateRateLimitKey } from '@/lib/auth/rate-limit-config';
import { describe, expect, it } from 'vitest';

describe('Rate Limit Storage Utility Functions', () => {
  describe('Rate Limit Key Generation', () => {
    it('should generate rate limit keys correctly', () => {
      const ip = '127.0.0.1';
      const path = '/api/test';
      const token = 'user-token';
      
      // Use string literals for types since RateLimitType is a string union type
      const ipKey = generateRateLimitKey('general' as RateLimitType, ip);
      const pathKey = generateRateLimitKey('api' as RateLimitType, path);
      const tokenKey = generateRateLimitKey('auth' as RateLimitType, token);
      
      expect(ipKey).toBe('ratelimit:general:127.0.0.1');
      expect(pathKey).toBe('ratelimit:api:/api/test');
      expect(tokenKey).toBe('ratelimit:auth:user-token');
    });
  });
}); 