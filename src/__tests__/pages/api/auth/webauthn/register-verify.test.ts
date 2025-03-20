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
  verifyWebAuthnRegistration: vi.fn().mockResolvedValue({
    verified: true,
    registrationInfo: {
      credentialID: new Uint8Array([1, 2, 3]),
      credentialPublicKey: new Uint8Array([4, 5, 6]),
      counter: 0,
    },
  }),
}));

vi.mock('@/lib/db/prisma', () => ({
  db: {
    credential: {
      create: vi.fn().mockResolvedValue({
        id: 'credential-123',
      }),
      count: vi.fn().mockResolvedValue(1),
    },
  },
}));

// Mock the registration challenge store
vi.mock('@/pages/api/auth/webauthn/register-options', () => ({
  registrationChallengeStore: {
    'mock-challenge-id': 'stored-challenge',
  },
}));

// Import handler
import { getSessionFromReq } from '@/lib/auth/utils';
import { verifyWebAuthnRegistration } from '@/lib/auth/webauthn';
import { db } from '@/lib/db/prisma';
import handler from '@/pages/api/auth/webauthn/register-verify';

describe('WebAuthn Registration Verification API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Should import the handler correctly', () => {
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('Should verify registration successfully', async () => {
    // Create mock request and response
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        credential: {
          id: 'credential-id',
          rawId: 'raw-id',
          response: {
            attestationObject: 'attestation-object',
            clientDataJSON: 'client-data',
            transports: ['internal', 'usb'],
          },
          type: 'public-key',
          authenticatorAttachment: 'platform',
          clientExtensionResults: {
            credProps: {
              rk: true,
            },
          },
        },
        challengeId: 'mock-challenge-id',
      },
    });

    // Call the handler
    await handler(req, res);

    // Verify response
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.message).toBe('Registration successful');
    expect(data.isFirstCredential).toBe(true);

    // Verify function calls
    expect(getSessionFromReq).toHaveBeenCalledWith(req, res);
    expect(verifyWebAuthnRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'credential-id',
        response: expect.objectContaining({
          attestationObject: 'attestation-object',
          clientDataJSON: 'client-data',
        }),
      }),
      'stored-challenge'
    );

    // Verify credential creation
    expect(db.credential.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-123',
        deviceType: 'platform',
        backupState: true,
        transports: ['internal', 'usb'],
        friendlyName: 'My passkey',
      }),
    });
    expect(db.credential.count).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
    });
  });

  it('Should return 401 if user is not authenticated', async () => {
    // Override the session mock for this test
    vi.mocked(getSessionFromReq).mockResolvedValueOnce(null);

    // Create mock request and response
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        credential: {},
        challengeId: 'mock-challenge-id',
      },
    });

    // Call the handler
    await handler(req, res);

    // Verify response
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Unauthorized',
    });
  });

  it('Should return 400 if challenge not found', async () => {
    // Create mock request and response
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        credential: {},
        challengeId: 'non-existent-id',
      },
    });

    // Call the handler
    await handler(req, res);

    // Verify response
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Registration challenge not found or expired. Please try again.',
    });
  });

  it('Should return 405 for non-POST requests', async () => {
    // Create mock request and response
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
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