import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/auth/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/auth/webauthn', () => ({
  generateWebAuthnAuthenticationOptions: vi.fn().mockResolvedValue({
    challenge: 'mock-challenge',
    timeout: 60000,
    rpId: 'localhost',
    userVerification: 'preferred',
    allowCredentials: [],
  }),
}));

// Import handler
import { generateWebAuthnAuthenticationOptions } from '@/lib/auth/webauthn';
import handler from '@/pages/api/auth/webauthn/login-options';

describe('WebAuthn Login Options API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Should import the handler correctly', () => {
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('Should return authentication options successfully', async () => {
    // Create mock request and response
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    // Mock crypto.randomUUID
    const randomUUIDSpy = vi.spyOn(crypto, 'randomUUID').mockReturnValue('mock-uuid');

    // Call the handler
    await handler(req, res);

    // Restore crypto mock
    randomUUIDSpy.mockRestore();

    // Verify response
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.options).toEqual({
      challenge: 'mock-challenge',
      timeout: 60000,
      rpId: 'localhost',
      userVerification: 'preferred',
      allowCredentials: [],
    });
    expect(data.requestId).toBeDefined();

    // Verify function calls
    expect(generateWebAuthnAuthenticationOptions).toHaveBeenCalled();
  });
});