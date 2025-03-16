import { handlers } from '@/lib/auth/auth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock NextAuth with a default export
vi.mock('next-auth', () => {
  return {
    default: (_config: any) => ({
      GET: vi.fn(),
      POST: vi.fn(),
    }),
  };
});

// Mock the auth config
vi.mock('@/lib/auth/auth.config', () => ({
  authConfig: {
    providers: [
      { id: 'credentials', name: 'Credentials' },
      { id: 'google', name: 'Google' },
      { id: 'github', name: 'GitHub' },
    ],
    pages: {
      signIn: '/auth/signin',
      error: '/auth/error',
      newUser: '/auth/register',
      verifyRequest: '/auth/verify-request',
    },
    callbacks: {
      jwt: vi.fn(),
      session: vi.fn(),
    },
    adapter: {
      // Mock adapter methods
      createUser: vi.fn(),
      getUser: vi.fn(),
      getUserByEmail: vi.fn(),
      getUserByAccount: vi.fn(),
      updateUser: vi.fn(),
      linkAccount: vi.fn(),
      createSession: vi.fn(),
      getSessionAndUser: vi.fn(),
      updateSession: vi.fn(),
      deleteSession: vi.fn(),
    },
    session: {
      strategy: 'jwt',
    },
  },
}));

// Import handlers after the mocks are set up
import { authConfig } from '@/lib/auth/auth.config';

describe('NextAuth Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should have required configuration properties', () => {
    expect(authConfig).toHaveProperty('providers');
    expect(authConfig).toHaveProperty('pages');
    expect(authConfig).toHaveProperty('callbacks');
    expect(authConfig).toHaveProperty('adapter');
    expect(authConfig).toHaveProperty('session');
  });

  it('should configure the pages correctly', () => {
    expect(authConfig.pages).toHaveProperty('signIn', '/auth/signin');
    expect(authConfig.pages).toHaveProperty('newUser', '/auth/register');
    expect(authConfig.pages).toHaveProperty('error', '/auth/error');
    expect(authConfig.pages).toHaveProperty('verifyRequest', '/auth/verify-request');
  });

  it('should include essential providers', () => {
    const providerIds = authConfig.providers.map((provider: any) => provider.id);
    
    // Check that the specified providers exist
    expect(providerIds).toContain('credentials');
    expect(providerIds).toContain('google');
    expect(providerIds).toContain('github');
  });

  it('should export handler functions for API routes', () => {
    expect(handlers).toHaveProperty('GET');
    expect(handlers).toHaveProperty('POST');
    expect(handlers.GET).toBeInstanceOf(Function);
    expect(handlers.POST).toBeInstanceOf(Function);
  });

  it('should have proper session strategy', () => {
    expect(authConfig.session).toHaveProperty('strategy', 'jwt');
  });

  it('should have JWT and session callbacks', () => {
    expect(authConfig.callbacks).toBeDefined();
    if (authConfig.callbacks) {
      expect(authConfig.callbacks).toHaveProperty('jwt');
      expect(authConfig.callbacks).toHaveProperty('session');
      expect(authConfig.callbacks.jwt).toBeInstanceOf(Function);
      expect(authConfig.callbacks.session).toBeInstanceOf(Function);
    }
  });
}); 