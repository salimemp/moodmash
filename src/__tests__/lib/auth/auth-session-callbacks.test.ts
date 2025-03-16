import { authOptions } from '@/lib/auth/auth-options';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Auth Session Callbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('session callback', () => {
    it('should add user id to session from token', async () => {
      // Skip test if callback is not defined
      if (!authOptions.callbacks?.session) {
        expect.assertions(0);
        return;
      }

      const mockSession = {
        user: {
          name: 'Test User',
          email: 'test@example.com',
        },
      };
      const mockToken = { sub: 'user-123' };

      const sessionCallback = authOptions.callbacks.session;
      const result = await sessionCallback({ session: mockSession, token: mockToken } as any);

      expect(result.user).toHaveProperty('id', 'user-123');
    });

    it('should return unmodified session if token is missing', async () => {
      if (!authOptions.callbacks?.session) {
        expect.assertions(0);
        return;
      }

      const mockSession = {
        user: {
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      const sessionCallback = authOptions.callbacks.session;
      const result = await sessionCallback({ session: mockSession } as any);

      expect(result).toEqual(mockSession);
      expect(result.user).not.toHaveProperty('id');
    });

    it('should return unmodified session if user is missing', async () => {
      if (!authOptions.callbacks?.session) {
        expect.assertions(0);
        return;
      }

      const mockSession = {};
      const mockToken = { sub: 'user-123' };

      const sessionCallback = authOptions.callbacks.session;
      const result = await sessionCallback({ session: mockSession, token: mockToken } as any);

      expect(result).toEqual(mockSession);
    });
  });

  describe('jwt callback', () => {
    it('should add user id to token', async () => {
      if (!authOptions.callbacks?.jwt) {
        expect.assertions(0);
        return;
      }

      const mockToken = {};
      const mockUser = { id: 'user-123' };

      const jwtCallback = authOptions.callbacks.jwt;
      const result = await jwtCallback({ token: mockToken, user: mockUser } as any);

      expect(result).toHaveProperty('sub', 'user-123');
    });

    it('should preserve existing token if user is missing', async () => {
      if (!authOptions.callbacks?.jwt) {
        expect.assertions(0);
        return;
      }

      const mockToken = { sub: 'existing-user-id' };

      const jwtCallback = authOptions.callbacks.jwt;
      const result = await jwtCallback({ token: mockToken } as any);

      expect(result).toEqual(mockToken);
      expect(result).toHaveProperty('sub', 'existing-user-id');
    });
  });

  describe('session configuration', () => {
    it('should use JWT strategy', () => {
      expect(authOptions.session).toHaveProperty('strategy', 'jwt');
    });

    it('should have 30 days expiry', () => {
      const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
      expect(authOptions.session).toHaveProperty('maxAge', thirtyDaysInSeconds);
    });
  });

  describe('session validation', () => {
    it('should have session validation configuration', () => {
      // Test that session object exists with necessary properties
      expect(authOptions).toHaveProperty('session');
      expect(authOptions.session).toHaveProperty('strategy');
      expect(authOptions.session).toHaveProperty('maxAge');
    });

    it('should have secure session configuration', () => {
      const maxAgeInSeconds = authOptions.session?.maxAge || 0;
      
      // Session should have a reasonable expiry time (not too long or too short)
      expect(maxAgeInSeconds).toBeGreaterThan(24 * 60 * 60); // At least 1 day
      expect(maxAgeInSeconds).toBeLessThanOrEqual(90 * 24 * 60 * 60); // Max 90 days
    });
  });
}); 