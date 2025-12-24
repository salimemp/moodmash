import { describe, it, expect } from 'vitest';
import { generateSessionToken } from '../../src/auth';

describe('Auth Utilities', () => {
  describe('generateSessionToken', () => {
    it('should generate a valid session token', () => {
      const token = generateSessionToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(40); // 20 bytes * 2 hex chars
    });

    it('should generate unique tokens', () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();
      expect(token1).not.toBe(token2);
    });

    it('should only contain hex characters', () => {
      const token = generateSessionToken();
      expect(token).toMatch(/^[0-9a-f]+$/);
    });
  });
});
