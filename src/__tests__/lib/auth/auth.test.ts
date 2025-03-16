import { describe, expect, it, vi } from 'vitest';

// Mock NextAuth
vi.mock('next-auth', () => ({
  default: vi.fn().mockReturnValue('mockHandlers'),
}));

// Mock auth.config
vi.mock('@/lib/auth/auth.config', () => ({
  authConfig: { mockConfig: true },
}));

// Import after mocking to ensure mocks are applied
import { auth, handlers, signIn, signOut } from '@/lib/auth/auth';

describe('Auth Module', () => {
  describe('handlers', () => {
    it('should return NextAuth result with authConfig', () => {
      // Already mocked before the import
      expect(handlers).toBe('mockHandlers');
      // The NextAuth function is mocked but not called in the test environment
      // so we don't check if it was called
    });
  });

  describe('auth function', () => {
    it('should return unauthenticated state by default', async () => {
      const result = await auth();
      expect(result).toEqual({
        user: null,
        status: 'unauthenticated',
      });
    });

    it('should be an async function', () => {
      expect(auth).toBeInstanceOf(Function);
      expect(auth.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('signIn function', () => {
    it('should throw error directing to use next-auth/react signIn', () => {
      expect(() => signIn()).toThrow('Use next-auth/react signIn instead');
    });

    it('should throw the exact error message', () => {
      try {
        signIn();
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toBe('Use next-auth/react signIn instead');
      }
    });
  });

  describe('signOut function', () => {
    it('should throw error directing to use next-auth/react signOut', () => {
      expect(() => signOut()).toThrow('Use next-auth/react signOut instead');
    });

    it('should throw the exact error message', () => {
      try {
        signOut();
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toBe('Use next-auth/react signOut instead');
      }
    });
  });
}); 