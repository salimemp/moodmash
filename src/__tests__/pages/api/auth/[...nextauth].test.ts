import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('NextAuth API Route', () => {
  const mockGet = vi.fn();
  const mockPost = vi.fn();
  let handlers: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock nextauth
    vi.doMock('next-auth', () => ({
      default: vi.fn().mockReturnValue({
        GET: mockGet,
        POST: mockPost
      })
    }));
    
    // Mock auth config
    vi.doMock('@/lib/auth/auth.config', () => ({
      authConfig: {
        providers: [
          { id: 'credentials', name: 'Credentials' },
          { id: 'google', name: 'Google' },
          { id: 'github', name: 'GitHub' },
        ],
        callbacks: {
          jwt: vi.fn(),
          session: vi.fn(),
        },
        pages: {
          signIn: '/auth/signin',
          signOut: '/auth/signout',
          error: '/auth/error',
          verifyRequest: '/auth/verify-request',
        },
      }
    }));
    
    // Import dynamically after mocks are set up
    handlers = (await import('@/pages/api/auth/[...nextauth]')).default;
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  it('should export GET and POST functions', () => {
    expect(handlers).toBeDefined();
    expect(typeof handlers.GET).toBe('function');
    expect(typeof handlers.POST).toBe('function');
  });

  it('should handle GET requests for sign-in', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: {
        nextauth: ['signin'],
      },
    });

    await handlers.GET(req, res);

    expect(mockGet).toHaveBeenCalledWith(req, res);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('should handle GET requests for callback', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: {
        nextauth: ['callback', 'google'],
      },
      headers: {
        host: 'localhost:3000',
      },
    });

    await handlers.GET(req, res);

    expect(mockGet).toHaveBeenCalledWith(req, res);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('should handle GET requests for session info', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: {
        nextauth: ['session'],
      },
    });

    await handlers.GET(req, res);

    expect(mockGet).toHaveBeenCalledWith(req, res);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('should handle GET requests for CSRF token', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: {
        nextauth: ['csrf'],
      },
    });

    await handlers.GET(req, res);

    expect(mockGet).toHaveBeenCalledWith(req, res);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('should handle POST requests for sign-in with credentials', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      query: {
        nextauth: ['callback', 'credentials'],
      },
      body: {
        email: 'test@example.com',
        password: 'password123',
        redirect: false,
      },
    });

    await handlers.POST(req, res);

    expect(mockPost).toHaveBeenCalledWith(req, res);
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it('should handle POST requests for sign-out', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      query: {
        nextauth: ['signout'],
      },
      body: {
        callbackUrl: '/',
      },
    });

    await handlers.POST(req, res);

    expect(mockPost).toHaveBeenCalledWith(req, res);
    expect(mockPost).toHaveBeenCalledTimes(1);
  });
}); 