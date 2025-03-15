import {
    generateIPRateLimitKey,
    generateRateLimitKey,
    rateLimits,
    RateLimitType
} from '@/lib/auth/rate-limit-config';
import { describe, expect, it } from 'vitest';

describe('Rate Limit Configuration', () => {
  describe('Rate Limit Types and Configs', () => {
    it('should define rate limit configurations for all rate limit types', () => {
      // Verify all rate limit types have configurations
      const rateTypes: RateLimitType[] = [
        'general', 'auth', 'mfa', 'api', 'login', 
        'passwordReset', 'emailVerification'
      ];
      
      rateTypes.forEach(type => {
        expect(rateLimits[type]).toBeDefined();
        expect(rateLimits[type]).toHaveProperty('max');
        expect(rateLimits[type]).toHaveProperty('window');
        expect(rateLimits[type]).toHaveProperty('message');
      });
    });
    
    it('should define stricter limits for auth operations', () => {
      // Auth operations should have stricter limits than general operations
      expect(rateLimits.auth.max).toBeLessThan(rateLimits.general.max);
      expect(rateLimits.mfa.max).toBeLessThan(rateLimits.general.max);
      expect(rateLimits.login.max).toBeLessThan(rateLimits.general.max);
    });
    
    it('should define longer windows for sensitive operations', () => {
      // Sensitive operations should have longer windows
      expect(rateLimits.login.window).toBeGreaterThan(rateLimits.general.window);
      expect(rateLimits.passwordReset.window).toBeGreaterThan(rateLimits.general.window);
    });
  });
  
  describe('Rate Limit Key Generation', () => {
    it('should generate a rate limit key with proper format', () => {
      const type: RateLimitType = 'login';
      const identifier = 'user123';
      
      const key = generateRateLimitKey(type, identifier);
      
      expect(key).toBe('ratelimit:login:user123');
    });
    
    it('should generate an IP-based rate limit key with proper format', () => {
      const type: RateLimitType = 'api';
      const ip = '192.168.1.1';
      
      const key = generateIPRateLimitKey(type, ip);
      
      expect(key).toBe('ratelimit:api:ip:192.168.1.1');
    });
    
    it('should generate different keys for different types with same identifier', () => {
      const identifier = 'user123';
      
      const loginKey = generateRateLimitKey('login', identifier);
      const mfaKey = generateRateLimitKey('mfa', identifier);
      
      expect(loginKey).not.toBe(mfaKey);
    });
    
    it('should generate different keys for different identifiers with same type', () => {
      const type: RateLimitType = 'login';
      
      const key1 = generateRateLimitKey(type, 'user1');
      const key2 = generateRateLimitKey(type, 'user2');
      
      expect(key1).not.toBe(key2);
    });
  });
}); 