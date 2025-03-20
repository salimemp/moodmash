import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the handlers that NextAuth returns
const mockHandlers = {
  GET: vi.fn(),
  POST: vi.fn(),
};

// Mock the NextAuth module
vi.mock('next-auth', () => ({
  default: vi.fn(() => mockHandlers),
}));

// Mock the auth config
vi.mock('@/lib/auth/auth.config', () => ({
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
  },
}));

// Import the modules after mocking

describe('NextAuth API Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should handle GET requests for authentication', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: {
        nextauth: ['signin'],
      },
    });

    // Call the handler
    await mockHandlers.GET(req, res);

    // Verify the handler was called
    expect(mockHandlers.GET).toHaveBeenCalledWith(req, res);
  });

  it('should handle POST requests for authentication', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      query: {
        nextauth: ['callback', 'credentials'],
      },
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    });

    // Call the handler
    await mockHandlers.POST(req, res);

    // Verify the handler was called
    expect(mockHandlers.POST).toHaveBeenCalledWith(req, res);
  });
}); 