import handlers, { auth, signIn, signOut } from '@/lib/auth/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock NextAuth and authConfig
vi.mock('next-auth', () => {
  return {
    default: vi.fn(() => ({ 
      GET: vi.fn(),
      POST: vi.fn(),
    })),
  };
});

vi.mock('./auth.config', () => ({
  authConfig: {
    providers: [],
    callbacks: {},
    pages: {},
  },
}));

describe('NextAuth handlers', () => {
  it('should export NextAuth handlers', () => {
    expect(handlers).toBeDefined();
    expect(handlers.GET).toBeDefined();
    expect(handlers.POST).toBeDefined();
  });
});

describe('auth function', () => {
  it('should return unauthenticated status by default', async () => {
    const result = await auth();
    
    expect(result).toEqual({
      user: null,
      status: 'unauthenticated'
    });
  });
});

describe('signIn function', () => {
  let consoleSpy: any;
  
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should throw an error instructing to use next-auth/react', async () => {
    await expect(() => signIn()).toThrow(
      'Use next-auth/react signIn instead'
    );
  });
});

describe('signOut function', () => {
  let consoleSpy: any;
  
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should throw an error instructing to use next-auth/react', async () => {
    await expect(() => signOut()).toThrow(
      'Use next-auth/react signOut instead'
    );
  });
}); 