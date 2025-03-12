import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Mock dependencies before importing the modules to be tested
 * This ensures that we can control the behavior of external dependencies
 */

// Mock Prisma client for database access
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock PrismaAdapter for NextAuth
vi.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: (prisma: any) => {
    return { prisma };
  }
}));

// Mock password comparison utility
vi.mock('@/lib/auth/password', () => ({
  comparePasswords: vi.fn(),
}));

// Mock the credentials provider for authentication
vi.mock('next-auth/providers/credentials', () => {
  return {
    default: vi.fn().mockImplementation((config) => ({
      id: 'credentials',
      type: 'credentials',
      ...config
    })),
  };
});

// Mock the email provider for authentication
vi.mock('next-auth/providers/email', () => {
  return {
    default: vi.fn().mockImplementation((config) => ({
      id: 'email',
      type: 'email',
      ...config
    })),
  };
});

// Import after mocking
import { authOptions } from '@/lib/auth/auth-options';
import { comparePasswords } from '@/lib/auth/password';
import { prisma } from '@/lib/db';

/**
 * Tests for the NextAuth configuration options
 * These tests verify that the authentication system is properly configured
 */
describe('Auth Options', () => {
  // Sample user for testing
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
  };

  // Reset all mocks before each test to ensure test isolation
  beforeEach(() => {
    vi.resetAllMocks();
  });

  /**
   * Tests for the core NextAuth configuration
   * Verifies adapter setup, session strategy, custom pages, providers, and callbacks
   */
  describe('NextAuth Configuration', () => {
    /**
     * Verifies that the Prisma adapter is correctly configured
     * This ensures database operations for authentication will work correctly
     */
    it('should configure the adapter with prisma', () => {
      expect(authOptions.adapter).toBeDefined();
      expect(authOptions.adapter).toHaveProperty('prisma');
    });

    /**
     * Verifies JWT session strategy and timeout settings
     * Ensures sessions are correctly maintained and expire after 30 days
     */
    it('should have JWT session strategy with correct maxAge', () => {
      expect(authOptions.session).toEqual({
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    });

    /**
     * Verifies custom authentication pages are configured
     * Ensures users are redirected to the right pages during auth flows
     */
    it('should define custom pages for authentication flows', () => {
      expect(authOptions.pages).toEqual({
        signIn: '/auth/signin',
        signOut: '/auth/signout',
        error: '/auth/error',
        verifyRequest: '/auth/verify-request',
        newUser: '/auth/register',
      });
    });

    /**
     * Verifies the email provider is correctly configured
     * This provider enables magic link authentication
     */
    it('should include EmailProvider with correct configuration', () => {
      const emailProvider = authOptions.providers.find(p => p.id === 'email');
      expect(emailProvider).toBeDefined();
      expect(emailProvider?.type).toBe('email');
    });

    /**
     * Verifies the credentials provider is correctly configured
     * This provider enables username/password authentication
     */
    it('should include CredentialsProvider with correct configuration', () => {
      const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials') as any;
      expect(credentialsProvider).toBeDefined();
      expect(credentialsProvider?.type).toBe('credentials');
      expect(credentialsProvider?.credentials).toEqual({
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      });
    });

    /**
     * Verifies that session and JWT callbacks are defined
     * These callbacks are essential for maintaining authentication state
     */
    it('should have session and jwt callbacks', () => {
      expect(typeof authOptions.callbacks?.session).toBe('function');
      expect(typeof authOptions.callbacks?.jwt).toBe('function');
    });
  });

  /**
   * Tests for the CredentialsProvider authorization function
   * Verifies credential validation and user lookup behavior
   */
  describe('CredentialsProvider Authorization', () => {
    let authorize: Function | undefined;
    
    // Extract the authorize function before each test
    beforeEach(() => {
      const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials');
      authorize = (credentialsProvider as any)?.authorize;
      expect(authorize).toBeDefined();
    });

    /**
     * Verifies that missing credentials result in authentication failure
     * This prevents authentication attempts with incomplete information
     */
    it('should return null when credentials are missing', async () => {
      const result = await (authorize as Function)({});
      expect(result).toBeNull();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    /**
     * Verifies that non-existent users cannot authenticate
     * This confirms database lookups are working correctly
     */
    it('should return null when user is not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      
      const result = await (authorize as Function)({
        email: 'nonexistent@example.com',
        password: 'password123',
      });
      
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
      
      expect(result).toBeNull();
    });

    /**
     * Verifies that invalid passwords result in authentication failure
     * This ensures password validation works correctly
     */
    it('should return null when password is invalid', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (comparePasswords as any).mockResolvedValue(false);
      
      const result = await (authorize as Function)({
        email: 'test@example.com',
        password: 'wrong-password',
      });
      
      expect(comparePasswords).toHaveBeenCalledWith('wrong-password', 'hashed-password');
      expect(result).toBeNull();
    });

    /**
     * Verifies successful authentication with valid credentials
     * This confirms the happy path works as expected
     */
    it('should return user data when credentials are valid', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (comparePasswords as any).mockResolvedValue(true);
      
      const result = await (authorize as Function)({
        email: 'test@example.com',
        password: 'correct-password',
      });
      
      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      });
    });
  });

  /**
   * Tests for the session callback
   * Verifies user information is correctly enriched in the session
   */
  describe('Session Callback', () => {
    /**
     * Verifies that the user ID from the token is added to the session
     * This ensures the session contains the necessary user identity
     */
    it('should add user id from token to session', async () => {
      const session = { user: {}, expires: new Date().toISOString() } as any;
      const token = { sub: 'user-123' };
      
      const result = await (authOptions.callbacks?.session as any)({
        session,
        token,
        user: { id: 'user-123', email: 'test@example.com' } as any,
        newSession: null,
        trigger: 'update'
      });
      
      expect(result.user).toHaveProperty('id', 'user-123');
    });

    /**
     * Verifies that the session is not modified if the user is not present
     * This handles edge cases in the session management
     */
    it('should not modify session if user is not present', async () => {
      const session = { 
        user: undefined, 
        expires: new Date().toISOString() 
      } as any;
      const token = { sub: 'user-123' };
      
      const result = await (authOptions.callbacks?.session as any)({
        session,
        token,
        user: { id: 'user-123', email: 'test@example.com' } as any,
        newSession: null,
        trigger: 'update'
      });
      
      expect(result).toBe(session);
    });
  });

  /**
   * Tests for the JWT callback
   * Verifies token manipulation during authentication
   */
  describe('JWT Callback', () => {
    /**
     * Verifies that the user ID is added to the token when a user is provided
     * This ensures the JWT contains the correct user identity
     */
    it('should add user id to token when user is provided', async () => {
      const token = {};
      const user = { id: 'user-123', email: 'test@example.com' } as any;
      
      const result = await (authOptions.callbacks?.jwt as any)({
        token,
        user,
        account: null,
        profile: undefined,
        trigger: 'signIn',
      });
      
      expect(result).toHaveProperty('sub', 'user-123');
    });

    /**
     * Verifies that the token is unchanged when no user is provided
     * This ensures token integrity during token refresh operations
     */
    it('should return token unchanged when user is not provided', async () => {
      const token = { sub: 'existing-sub' };
      
      const result = await (authOptions.callbacks?.jwt as any)({
        token,
        user: null,
        account: null,
        profile: undefined,
        trigger: 'update',
      });
      
      expect(result).toBe(token);
      expect(result.sub).toBe('existing-sub');
    });
  });
}); 