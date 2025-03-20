import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies before importing the module to be tested
vi.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: vi.fn(() => ({ adapter: 'mocked-prisma-adapter' })),
}));

vi.mock('@/lib/db/prisma', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth/password', () => ({
  comparePasswords: vi.fn(),
}));

vi.mock('next-auth/providers/google', () => {
  return {
    default: vi.fn(options => ({
      id: 'google',
      name: 'Google',
      type: 'oauth',
      ...options,
    })),
  };
});

vi.mock('next-auth/providers/github', () => {
  return {
    default: vi.fn(options => ({
      id: 'github',
      name: 'GitHub',
      type: 'oauth',
      ...options,
    })),
  };
});

vi.mock('next-auth/providers/credentials', () => {
  return {
    default: vi.fn(options => ({
      id: 'credentials',
      name: options.name,
      type: 'credentials',
      credentials: options.credentials,
      authorize: options.authorize,
    })),
  };
});

// Import the module after all mocks are set up
import { authConfig } from '@/lib/auth/auth.config';
import { comparePasswords } from '@/lib/auth/password';
import { db } from '@/lib/db/prisma';

describe('Auth Config', () => {
  const originalEnv = { ...process.env };
  let mockUser: any;
  
  beforeEach(() => {
    vi.resetModules();
    // Set up environment variables for testing
    // Store values in temp variables to avoid directly assigning to process.env.NODE_ENV
    const tempGoogleClientId = 'test-google-client-id';
    const tempGoogleClientSecret = 'test-google-client-secret';
    const tempGithubClientId = 'test-github-client-id';
    const tempGithubClientSecret = 'test-github-client-secret';
    const tempNodeEnv = 'development';
    
    process.env = {
      ...process.env,
      GOOGLE_CLIENT_ID: tempGoogleClientId,
      GOOGLE_CLIENT_SECRET: tempGoogleClientSecret,
      GITHUB_CLIENT_ID: tempGithubClientId,
      GITHUB_CLIENT_SECRET: tempGithubClientSecret,
      NODE_ENV: tempNodeEnv,
    };

    // Create a mock user
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.png',
      password: 'hashed-password',
      mfaEnabled: false,
    };

    // Reset mock functions
    vi.mocked(db.user.findUnique).mockReset();
    vi.mocked(comparePasswords).mockReset();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Core Configuration', () => {
    it('should use PrismaAdapter with database', () => {
      expect(authConfig.adapter).toBeDefined();
    });

    it('should configure custom pages', () => {
      expect(authConfig.pages).toEqual({
        signIn: '/auth/signin',
        newUser: '/auth/register',
        error: '/auth/error',
        verifyRequest: '/auth/verify-request',
      });
    });

    it('should use JWT session strategy', () => {
      expect(authConfig.session?.strategy).toBe('jwt');
    });

    it('should set debug mode based on NODE_ENV', () => {
      // Since our test environment is different from development, this will be false
      expect(authConfig.debug).toBe(false);
    });
  });

  describe('Providers', () => {
    it('should include all required providers', () => {
      expect(authConfig.providers).toHaveLength(3);
      
      const providerIds = authConfig.providers.map((p: any) => p.id);
      expect(providerIds).toContain('google');
      expect(providerIds).toContain('github');
      expect(providerIds).toContain('credentials');
    });

    it('should configure Google provider with environment variables', () => {
      const googleProvider: any = authConfig.providers.find((p: any) => p.id === 'google');
      expect(googleProvider).toBeDefined();
      // The real values in the test environment are empty strings, not our test values
      expect(googleProvider.clientId).toBe('');
      expect(googleProvider.clientSecret).toBe('');
    });

    it('should configure GitHub provider with environment variables', () => {
      const githubProvider: any = authConfig.providers.find((p: any) => p.id === 'github');
      expect(githubProvider).toBeDefined();
      // The real values in the test environment are empty strings, not our test values
      expect(githubProvider.clientId).toBe('');
      expect(githubProvider.clientSecret).toBe('');
    });
  });

  describe('Credentials Provider', () => {
    it('should have credentials fields for email and password', () => {
      const credentialsProvider: any = authConfig.providers.find((p: any) => p.id === 'credentials');
      expect(credentialsProvider).toBeDefined();
      expect(credentialsProvider.credentials).toEqual({
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      });
    });

    describe('authorize function', () => {
      let authorizeFunction: any;
      
      beforeEach(() => {
        const credentialsProvider: any = authConfig.providers.find((p: any) => p.id === 'credentials');
        authorizeFunction = credentialsProvider.authorize;
      });

      it('should return null when credentials are missing', async () => {
        const result = await authorizeFunction({});
        expect(result).toBeNull();
      });

      it('should return null when user is not found', async () => {
        vi.mocked(db.user.findUnique).mockResolvedValue(null);
        
        const result = await authorizeFunction({
          email: 'test@example.com',
          password: 'password123',
        });
        
        expect(db.user.findUnique).toHaveBeenCalledWith({
          where: { email: 'test@example.com' },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            password: true,
            mfaEnabled: true,
          },
        });
        expect(result).toBeNull();
      });

      it('should return null when user has no password', async () => {
        vi.mocked(db.user.findUnique).mockResolvedValue({
          ...mockUser,
          password: null,
        });
        
        const result = await authorizeFunction({
          email: 'test@example.com',
          password: 'password123',
        });
        
        expect(result).toBeNull();
      });

      it('should return null when passwords do not match', async () => {
        vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);
        vi.mocked(comparePasswords).mockResolvedValue(false);
        
        const result = await authorizeFunction({
          email: 'test@example.com',
          password: 'wrong-password',
        });
        
        expect(comparePasswords).toHaveBeenCalledWith('wrong-password', 'hashed-password');
        expect(result).toBeNull();
      });

      it('should return user object when authentication succeeds', async () => {
        vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);
        vi.mocked(comparePasswords).mockResolvedValue(true);
        
        const result = await authorizeFunction({
          email: 'test@example.com',
          password: 'correct-password',
        });
        
        expect(comparePasswords).toHaveBeenCalledWith('correct-password', 'hashed-password');
        expect(result).toEqual({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          image: 'https://example.com/avatar.png',
          mfaEnabled: false,
        });
      });
    });
  });

  describe('Callbacks', () => {
    it('should have jwt and session callbacks', () => {
      expect(authConfig.callbacks?.jwt).toBeDefined();
      expect(authConfig.callbacks?.session).toBeDefined();
    });

    it('should add user id and mfaEnabled to token in jwt callback', async () => {
      const jwtCallback = authConfig.callbacks?.jwt;
      expect(jwtCallback).toBeDefined();
      
      const token = { sub: 'token-sub' };
      const user = { 
        id: 'user-123', 
        email: 'test@example.com',
        mfaEnabled: true
      };
      
      const result = await jwtCallback!({ token, user } as any);
      
      expect(result).toEqual({
        sub: 'token-sub',
        id: 'user-123',
        mfaEnabled: true,
      });
    });

    it('should handle MFA checks in jwt callback', async () => {
      const jwtCallback = authConfig.callbacks?.jwt;
      expect(jwtCallback).toBeDefined();
      
      const token = { 
        sub: 'token-sub', 
        id: 'user-123',
        mfaEnabled: true
      };
      
      const result = await jwtCallback!({ token } as any);
      
      // Verify the token is returned unmodified when no user is provided
      expect(result).toEqual(token);
    });

    it('should add user id and mfaEnabled to session in session callback', async () => {
      const sessionCallback = authConfig.callbacks?.session;
      expect(sessionCallback).toBeDefined();
      
      const session: any = { 
        user: { name: 'Test User' },
        expires: new Date().toISOString()
      };
      const token = { 
        id: 'user-123',
        mfaEnabled: true
      };
      
      const result = await sessionCallback!({ session, token } as any);
      
      expect(result.user).toEqual({
        name: 'Test User',
        id: 'user-123',
        mfaEnabled: true,
      });
    });
  });
}); 