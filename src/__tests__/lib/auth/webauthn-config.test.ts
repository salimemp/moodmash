import { getExpectedOrigin, getRpID, rpName, supportedAlgorithmIDs, timeoutDuration } from '@/lib/auth/webauthn-config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('WebAuthn Configuration', () => {
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    vi.resetModules();
    // Clear env vars for testing
    delete process.env.NEXT_PUBLIC_APP_URL;
  });
  
  afterEach(() => {
    // Restore env vars
    process.env = { ...originalEnv };
  });
  
  describe('getRpID', () => {
    it('should return localhost when no NEXT_PUBLIC_APP_URL is set', () => {
      const rpID = getRpID();
      expect(rpID).toBe('localhost');
    });
    
    it('should extract hostname from NEXT_PUBLIC_APP_URL', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
      const rpID = getRpID();
      expect(rpID).toBe('example.com');
    });
    
    it('should handle URLs with ports correctly', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com:3000';
      const rpID = getRpID();
      expect(rpID).toBe('example.com');
    });
    
    it('should handle subdomains correctly', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com';
      const rpID = getRpID();
      expect(rpID).toBe('app.example.com');
    });
  });
  
  describe('rpName', () => {
    it('should be defined', () => {
      expect(rpName).toBeDefined();
      expect(typeof rpName).toBe('string');
      expect(rpName).toBe('MoodMash');
    });
  });
  
  describe('timeoutDuration', () => {
    it('should be defined', () => {
      expect(timeoutDuration).toBeDefined();
      expect(typeof timeoutDuration).toBe('number');
      expect(timeoutDuration).toBe(60000); // 1 minute in milliseconds
    });
  });
  
  describe('supportedAlgorithmIDs', () => {
    it('should be defined', () => {
      expect(supportedAlgorithmIDs).toBeDefined();
      expect(Array.isArray(supportedAlgorithmIDs)).toBe(true);
      expect(supportedAlgorithmIDs).toContain(-7); // ES256
      expect(supportedAlgorithmIDs).toContain(-257); // RS256
    });
  });
  
  describe('getExpectedOrigin', () => {
    it('should return localhost origin when no NEXT_PUBLIC_APP_URL is set', () => {
      const origin = getExpectedOrigin();
      expect(origin).toBe('http://localhost:3000');
    });
    
    it('should return the NEXT_PUBLIC_APP_URL when set', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
      const origin = getExpectedOrigin();
      expect(origin).toBe('https://example.com');
    });
  });
}); 