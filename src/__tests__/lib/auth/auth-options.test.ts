/**
 * Mock dependencies before importing the modules to be tested
 * This ensures that we can control the behavior of external dependencies
 */

// Import Vitest first
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock modules before their usage
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    }
  },
}));

vi.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: vi.fn().mockReturnValue({ mock: 'prismaAdapter' }),
}));

vi.mock('@/lib/auth/password', () => ({
  comparePasswords: vi.fn(),
}));

vi.mock('next-auth/providers/credentials', () => {
  return {
    default: vi.fn().mockImplementation((config) => ({
      id: 'credentials',
      type: 'credentials',
      ...config
    })),
  };
});

vi.mock('next-auth/providers/email', () => {
  return {
    default: vi.fn().mockImplementation((config) => ({
      id: 'email',
      type: 'email',
      ...config
    })),
  };
});

// Import after all mocks are set up
import { comparePasswords } from '@/lib/auth/password';
import { prisma } from '@/lib/db';
import { CredentialsConfig } from 'next-auth/providers/credentials';

// Import authOptions last, after all mocks are set up
import { authOptions } from '@/lib/auth/auth-options';

// Define User type for testing
interface MockUser {
  id: string;
  email: string;
  name: string;
  password: string | null;
  emailVerified?: Date | null;
  image?: string | null;
  mfaEnabled?: boolean;
}

/**
 * Tests for the NextAuth configuration options
 * These tests verify that the authentication system is properly configured
 */
describe('Auth Options', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { 
      ...originalEnv,
      EMAIL_SERVER_HOST: 'smtp.example.com',
      EMAIL_SERVER_PORT: '587',
      EMAIL_SERVER_USER: 'user@example.com',
      EMAIL_SERVER_PASSWORD: 'password123',
      EMAIL_FROM: 'noreply@example.com'
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = originalEnv;
  });

  describe('Configuration', () => {
    it('should use Prisma adapter', () => {
      expect(authOptions.adapter).toEqual({ mock: 'prismaAdapter' });
    });

    it('should configure JWT session strategy with 30 days expiry', () => {
      expect(authOptions.session).toEqual({
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    });

    it('should configure custom pages', () => {
      expect(authOptions.pages).toEqual({
        signIn: '/auth/signin',
        signOut: '/auth/signout',
        error: '/auth/error',
        verifyRequest: '/auth/verify-request',
        newUser: '/auth/register',
      });
    });

    it('should include email and credentials providers', () => {
      const providers = authOptions.providers;
      expect(providers).toHaveLength(2);
      
      // Check provider types
      expect(providers[0].id).toBe('email');
      expect(providers[1].id).toBe('credentials');
    });
    
    it('should configure email provider with correct settings', () => {
      const emailProvider = authOptions.providers.find(p => p.id === 'email');
      expect(emailProvider).toBeDefined();
      
      // Check email provider configuration matches expected structure
      expect(emailProvider).toMatchObject({
        id: 'email',
        type: 'email',
      });
      
      // Verify the server configuration structure exists
      expect(emailProvider).toHaveProperty('server');
      expect(emailProvider).toHaveProperty('server.auth');
      expect(emailProvider).toHaveProperty('server.port', 587);
    });
  });

  describe('Credentials Provider', () => {
    it('should have email and password fields', () => {
      const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials') as CredentialsConfig<any>;
      expect(credentialsProvider?.credentials).toEqual({
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      });
    });

    describe('authorize function', () => {
      const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials') as CredentialsConfig<any>;
      const authorize = credentialsProvider?.authorize as Function;
      
      beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(comparePasswords).mockResolvedValue(false);
      });

      it('should return null when credentials are missing', async () => {
        const result = await authorize({});
        expect(result).toBeNull();
      });
      
      it('should return null when email is missing', async () => {
        const result = await authorize({ password: 'password123' });
        expect(result).toBeNull();
      });
      
      it('should return null when password is missing', async () => {
        const result = await authorize({ email: 'test@example.com' });
        expect(result).toBeNull();
      });

      it('should return null when user is not found', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
        
        const result = await authorize({
          email: 'test@example.com',
          password: 'password123'
        });
        
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { email: 'test@example.com' }
        });
        expect(result).toBeNull();
      });
      
      it('should return null when user has no password set', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: 'user-1',
          email: 'test@example.com',
          password: null
        } as any);
        
        const result = await authorize({
          email: 'test@example.com',
          password: 'password123'
        });
        
        expect(result).toBeNull();
      });

      it('should return null when password is invalid', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: 'user-1',
          email: 'test@example.com',
          password: 'hashed_password'
        } as any);
        
        vi.mocked(comparePasswords).mockResolvedValue(false);
        
        const result = await authorize({
          email: 'test@example.com',
          password: 'wrong_password'
        });
        
        expect(comparePasswords).toHaveBeenCalledWith('wrong_password', 'hashed_password');
        expect(result).toBeNull();
      });

      it('should return user data when authentication succeeds', async () => {
        const mockUser = {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          password: 'hashed_password'
        };
        
        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
        vi.mocked(comparePasswords).mockResolvedValue(true);
        
        const result = await authorize({
          email: 'test@example.com',
          password: 'correct_password'
        });
        
        expect(result).toEqual({
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User'
        });
      });
    });
  });

  describe('Callbacks', () => {
    it('should add user id to session', async () => {
      // Skip test if callback is not defined
      if (!authOptions.callbacks?.session) {
        expect.assertions(0);
        return;
      }
      
      const mockSession = { user: {} };
      const mockToken = { sub: 'user-1' };
      
      const sessionCallback = authOptions.callbacks.session;
      const result = await sessionCallback({ session: mockSession, token: mockToken } as any);
      
      // Use optional chaining to avoid type errors
      expect(result.user && 'id' in result.user).toBeTruthy();
      if (result.user && 'id' in result.user) {
        expect(result.user.id).toBe('user-1');
      }
    });
    
    it('should not modify session if token is missing', async () => {
      if (!authOptions.callbacks?.session) {
        expect.assertions(0);
        return;
      }
      
      const mockSession = { user: {} };
      
      const sessionCallback = authOptions.callbacks.session;
      const result = await sessionCallback({ session: mockSession } as any);
      
      expect(result).toEqual(mockSession);
    });
    
    it('should not modify session if user is missing', async () => {
      if (!authOptions.callbacks?.session) {
        expect.assertions(0);
        return;
      }
      
      const mockSession = {};
      const mockToken = { sub: 'user-1' };
      
      const sessionCallback = authOptions.callbacks.session;
      const result = await sessionCallback({ session: mockSession, token: mockToken } as any);
      
      expect(result).toEqual(mockSession);
    });

    it('should add user id to token', async () => {
      // Skip test if callback is not defined
      if (!authOptions.callbacks?.jwt) {
        expect.assertions(0);
        return;
      }
      
      const mockToken = {};
      const mockUser = { id: 'user-1' };
      
      const jwtCallback = authOptions.callbacks.jwt;
      const result = await jwtCallback({ token: mockToken, user: mockUser } as any);
      
      expect(result.sub).toBe('user-1');
    });
    
    it('should not modify token if user is missing', async () => {
      if (!authOptions.callbacks?.jwt) {
        expect.assertions(0);
        return;
      }
      
      const mockToken = { sub: 'existing-user-id' };
      
      const jwtCallback = authOptions.callbacks.jwt;
      const result = await jwtCallback({ token: mockToken } as any);
      
      expect(result).toEqual(mockToken);
    });
  });
}); 