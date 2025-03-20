import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/auth/utils', () => ({
  getSessionFromReq: vi.fn().mockResolvedValue({
    user: {
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
    },
  }),
}));

vi.mock('@/lib/auth/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/auth/webauthn', () => ({
  generateWebAuthnRegistrationOptions: vi.fn().mockResolvedValue({
    challenge: 'mock-challenge',
    rp: {
      name: 'MoodMash',
      id: 'localhost',
    },
    user: {
      id: 'user-123',
      name: 'user@example.com',
      displayName: 'Test User',
    },
    timeout: 60000,
    attestation: 'direct',
    authenticatorSelection: {
      userVerification: 'preferred',
    },
  }),
}));

// Mock crypto.randomUUID
vi.mock('crypto', () => {
  return {
    default: {
      randomUUID: vi.fn().mockReturnValue('mock-uuid'),
    },
    randomUUID: vi.fn().mockReturnValue('mock-uuid'),
  };
});

// Import handler
import { getSessionFromReq } from '@/lib/auth/utils';
import { generateWebAuthnRegistrationOptions } from '@/lib/auth/webauthn';
import handler from '@/pages/api/auth/webauthn/register-options';

describe('WebAuthn Registration Options API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Should import the handler correctly', () => {
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('Should return registration options successfully', async () => {
    // Create mock request and response
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    // Call the handler
    await handler(req, res);

    // Verify response
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.options).toEqual({
      challenge: 'mock-challenge',
      rp: {
        name: 'MoodMash',
        id: 'localhost',
      },
      user: {
        id: 'user-123',
        name: 'user@example.com',
        displayName: 'Test User',
      },
      timeout: 60000,
      attestation: 'direct',
      authenticatorSelection: {
        userVerification: 'preferred',
      },
    });
    expect(data.challengeId).toBe('mock-uuid');

    // Verify function calls
    expect(getSessionFromReq).toHaveBeenCalledWith(req, res);
    expect(generateWebAuthnRegistrationOptions).toHaveBeenCalledWith(
      'user-123', 
      'user@example.com', 
      'Test User'
    );
  });

  it('Should return 401 if user is not authenticated', async () => {
    // Override the session mock for this test
    vi.mocked(getSessionFromReq).mockResolvedValueOnce(null);

    // Create mock request and response
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    // Call the handler
    await handler(req, res);

    // Verify response
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Unauthorized',
    });
  });

  it('Should return 405 for non-GET requests', async () => {
    // Create mock request and response
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    });

    // Call the handler
    await handler(req, res);

    // Verify response
    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Method not allowed',
    });
  });
}); 