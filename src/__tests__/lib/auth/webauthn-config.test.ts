import { getExpectedOrigin, getRpID, rpName, supportedAlgorithmIDs, timeoutDuration } from '@/lib/auth/webauthn-config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('WebAuthn Configuration Module', () => {
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    // Reset environment variables before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });
  
  afterEach(() => {
    // Restore original environment after each test
    process.env = originalEnv;
    vi.restoreAllMocks();
  });
  
  describe('getRpID', () => {
    it('should return hostname from NEXT_PUBLIC_APP_URL when available', () => {
      // Setup
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com/path';
      
      // Mock URL constructor
      const mockHostname = 'example.com';
      class MockURL {
        hostname: string;
        
        constructor(_url: string) {
          this.hostname = mockHostname;
        }
        
        // Add required static methods to satisfy TypeScript
        static canParse() { return true; }
        static createObjectURL() { return ''; }
        static parse() { return new URL('https://example.com'); }
        static revokeObjectURL() {}
      }
      
      global.URL = MockURL as any;
      
      // Test
      const result = getRpID();
      
      // Assert
      expect(result).toBe('example.com');
    });
    
    it('should return "localhost" when NEXT_PUBLIC_APP_URL is not available', () => {
      // Setup
      process.env.NEXT_PUBLIC_APP_URL = undefined;
      
      // Test
      const result = getRpID();
      
      // Assert
      expect(result).toBe('localhost');
    });
  });
  
  describe('getExpectedOrigin', () => {
    it('should return NEXT_PUBLIC_APP_URL when available', () => {
      // Setup
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
      
      // Test
      const result = getExpectedOrigin();
      
      // Assert
      expect(result).toBe('https://example.com');
    });
    
    it('should return localhost origin when NEXT_PUBLIC_APP_URL is not available', () => {
      // Setup
      process.env.NEXT_PUBLIC_APP_URL = undefined;
      
      // Test
      const result = getExpectedOrigin();
      
      // Assert
      expect(result).toBe('http://localhost:3000');
    });
  });
  
  describe('constants', () => {
    it('should export rpName as "MoodMash"', () => {
      expect(rpName).toBe('MoodMash');
    });
    
    it('should export timeoutDuration as 60000', () => {
      expect(timeoutDuration).toBe(60000);
    });
    
    it('should export supportedAlgorithmIDs with ES256 and RS256', () => {
      expect(supportedAlgorithmIDs).toEqual([-7, -257]);
    });
  });
}); 