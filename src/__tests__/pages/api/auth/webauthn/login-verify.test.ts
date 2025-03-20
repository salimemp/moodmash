import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/auth/auth.config', () => ({
  authConfig: {},
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/auth/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(true),
  resetRateLimit: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/auth/webauthn', () => ({
  verifyWebAuthnAuthentication: vi.fn().mockResolvedValue({
    verified: true,
    authenticationInfo: {
      newCounter: 2,
    },
    user: {
      id: 'user-123',
      email: 'user@example.com',
    },
  }),
}));

// Mock the authentication challenge store
vi.mock('@/pages/api/auth/webauthn/login-options', () => ({
  authenticationChallengeStore: {
    'mock-request-id': 'stored-challenge',
  },
}));

// Import handler
import { resetRateLimit } from '@/lib/auth/rate-limit';
import { verifyWebAuthnAuthentication } from '@/lib/auth/webauthn';
import handler from '@/pages/api/auth/webauthn/login-verify';

describe('WebAuthn Login Verify API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Should import the handler correctly', () => {
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('Should verify authentication successfully', async () => {
    // Create mock request and response
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        credential: {
          id: 'credential-id',
          rawId: 'raw-id',
          response: {
            authenticatorData: 'auth-data',
            clientDataJSON: 'client-data',
            signature: 'signature',
          },
          type: 'public-key',
        },
        requestId: 'mock-request-id',
      },
    });

    // Call the handler
    await handler(req, res);

    // Verify response
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.message).toBe('Authentication successful');
    expect(data.user).toEqual({
      id: 'user-123',
      email: 'user@example.com',
    });

    // Verify function calls
    expect(verifyWebAuthnAuthentication).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'credential-id',
        type: 'public-key',
      }),
      'stored-challenge'
    );
    expect(resetRateLimit).toHaveBeenCalledWith('login', 'user@example.com');
  });
});