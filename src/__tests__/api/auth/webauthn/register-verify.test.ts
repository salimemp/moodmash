import * as rateLimitModule from '@/lib/auth/rate-limit';
import * as authUtilsModule from '@/lib/auth/utils';
import * as webauthnModule from '@/lib/auth/webauthn';
import * as dbModule from '@/lib/db/prisma';
import { registrationChallengeStore } from '@/pages/api/auth/webauthn/register-options';
import registerVerifyHandler from '@/pages/api/auth/webauthn/register-verify';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/auth/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/auth/utils', () => ({
  getSessionFromReq: vi.fn(),
}));

vi.mock('@/lib/auth/webauthn', () => ({
  verifyWebAuthnRegistration: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  db: {
    credential: {
      create: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('WebAuthn Register Verify API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset the challenge store
    Object.keys(registrationChallengeStore).forEach((key) => {
      delete registrationChallengeStore[key];
    });
    
    // Set up a test challenge in the store
    registrationChallengeStore['test-challenge-id'] = 'test-challenge';
  });

  // Test handling of non-POST requests
  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await registerVerifyHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Method not allowed',
    });
  });

  // Test rate limiting
  it('should apply rate limiting', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    vi.mocked(rateLimitModule.rateLimit).mockResolvedValueOnce(false);

    await registerVerifyHandler(req, res);

    expect(rateLimitModule.rateLimit).toHaveBeenCalledWith(req, res, 'general');
    // The handler should return early without calling verifyWebAuthnRegistration
    expect(webauthnModule.verifyWebAuthnRegistration).not.toHaveBeenCalled();
  });

  // Test authentication requirement
  it('should return 401 if user is not authenticated', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    vi.mocked(authUtilsModule.getSessionFromReq).mockResolvedValueOnce(null);

    await registerVerifyHandler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Unauthorized',
    });
  });

  // Test validation of request body
  it('should return 400 if credential or challengeId is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        // Missing credential and challengeId
      },
    });

    vi.mocked(authUtilsModule.getSessionFromReq).mockResolvedValueOnce({
      user: { id: 'user-123' },
      expires: new Date().toISOString(),
    });

    await registerVerifyHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Credential and challengeId are required',
    });

    // Test with missing credential only
    const { req: req2, res: res2 } = createMocks({
      method: 'POST',
      body: {
        challengeId: 'test-challenge-id',
      },
    });

    vi.mocked(authUtilsModule.getSessionFromReq).mockResolvedValueOnce({
      user: { id: 'user-123' },
      expires: new Date().toISOString(),
    });

    await registerVerifyHandler(req2, res2);

    expect(res2._getStatusCode()).toBe(400);
    expect(JSON.parse(res2._getData())).toEqual({
      message: 'Credential and challengeId are required',
    });
  });

  // Test challenge validation
  it('should return 400 if challenge is not found', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        credential: { id: 'credential-id' },
        challengeId: 'non-existent-challenge-id',
      },
    });

    vi.mocked(authUtilsModule.getSessionFromReq).mockResolvedValueOnce({
      user: { id: 'user-123' },
      expires: new Date().toISOString(),
    });

    await registerVerifyHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Registration challenge not found or expired. Please try again.',
    });
  });

  // Test verification failure
  it('should return 400 if verification fails', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        credential: { id: 'credential-id' },
        challengeId: 'test-challenge-id',
      },
    });

    vi.mocked(authUtilsModule.getSessionFromReq).mockResolvedValueOnce({
      user: { id: 'user-123' },
      expires: new Date().toISOString(),
    });

    vi.mocked(webauthnModule.verifyWebAuthnRegistration).mockResolvedValueOnce({
      verified: false,
    });

    await registerVerifyHandler(req, res);

    // Verify that the challenge was removed from the store
    expect(registrationChallengeStore['test-challenge-id']).toBeUndefined();

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Verification failed',
    });
  });

  // Test missing registration info
  it('should return 400 if registration info is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        credential: { id: 'credential-id' },
        challengeId: 'test-challenge-id',
      },
    });

    vi.mocked(authUtilsModule.getSessionFromReq).mockResolvedValueOnce({
      user: { id: 'user-123' },
      expires: new Date().toISOString(),
    });

    vi.mocked(webauthnModule.verifyWebAuthnRegistration).mockResolvedValueOnce({
      verified: true,
      registrationInfo: undefined,
    });

    await registerVerifyHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Registration info missing',
    });
  });

  // Test successful registration (first credential)
  it('should create a credential and return success for first credential', async () => {
    const mockCredential = {
      id: 'credential-id',
      authenticatorAttachment: 'platform',
      clientExtensionResults: {
        credProps: { rk: true },
      },
      response: {
        transports: ['internal'],
      },
    };

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        credential: mockCredential,
        challengeId: 'test-challenge-id',
      },
    });

    vi.mocked(authUtilsModule.getSessionFromReq).mockResolvedValueOnce({
      user: { id: 'user-123' },
      expires: new Date().toISOString(),
    });

    // Mock verification response
    const mockRegistrationInfo = {
      fmt: 'none' as const,
      counter: 0,
      aaguid: '00000000-0000-0000-0000-000000000000',
      credentialID: new Uint8Array([1, 2, 3]),
      credentialPublicKey: new Uint8Array([4, 5, 6]),
      credentialType: 'public-key' as const,
      attestationObject: new Uint8Array([7, 8, 9]),
      clientDataJSON: new Uint8Array([10, 11, 12]),
      publicKey: new Uint8Array([13, 14, 15]),
      userVerified: true,
      credentialDeviceType: 'singleDevice' as const,
      credentialBackedUp: false,
      origin: 'http://localhost:3000'
    };

    vi.mocked(webauthnModule.verifyWebAuthnRegistration).mockResolvedValueOnce({
      verified: true,
      registrationInfo: mockRegistrationInfo,
    });

    // Mock credential count to indicate this is the first credential
    vi.mocked(dbModule.db.credential.count).mockResolvedValueOnce(1);

    await registerVerifyHandler(req, res);

    // Verify database operations
    expect(dbModule.db.credential.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        externalId: expect.any(String),
        publicKey: expect.any(String),
        counter: 0,
        deviceType: 'platform',
        backupState: true,
        transports: ['internal'],
        friendlyName: 'My passkey',
      },
    });

    expect(dbModule.db.credential.count).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
    });

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Registration successful',
      isFirstCredential: true,
    });
  });

  // Test successful registration (additional credential)
  it('should create a credential and return success for additional credential', async () => {
    const mockCredential = {
      id: 'credential-id',
      authenticatorAttachment: 'cross-platform',
      clientExtensionResults: {
        credProps: { rk: false },
      },
      response: {
        transports: ['usb'],
      },
    };

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        credential: mockCredential,
        challengeId: 'test-challenge-id',
      },
    });

    vi.mocked(authUtilsModule.getSessionFromReq).mockResolvedValueOnce({
      user: { id: 'user-123' },
      expires: new Date().toISOString(),
    });

    // Mock verification response
    const mockRegistrationInfo = {
      fmt: 'none' as const,
      counter: 0,
      aaguid: '00000000-0000-0000-0000-000000000000',
      credentialID: new Uint8Array([1, 2, 3]),
      credentialPublicKey: new Uint8Array([4, 5, 6]),
      credentialType: 'public-key' as const,
      attestationObject: new Uint8Array([7, 8, 9]),
      clientDataJSON: new Uint8Array([10, 11, 12]),
      publicKey: new Uint8Array([13, 14, 15]),
      userVerified: true,
      credentialDeviceType: 'singleDevice' as const,
      credentialBackedUp: false,
      origin: 'http://localhost:3000'
    };

    vi.mocked(webauthnModule.verifyWebAuthnRegistration).mockResolvedValueOnce({
      verified: true,
      registrationInfo: mockRegistrationInfo,
    });

    // Mock credential count to indicate this is an additional credential
    vi.mocked(dbModule.db.credential.count).mockResolvedValueOnce(2);

    await registerVerifyHandler(req, res);

    // Verify database operations
    expect(dbModule.db.credential.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        externalId: expect.any(String),
        publicKey: expect.any(String),
        counter: 0,
        deviceType: 'cross-platform',
        backupState: false,
        transports: ['usb'],
        friendlyName: 'My passkey',
      },
    });

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Registration successful',
      isFirstCredential: false,
    });
  });

  // Test error handling
  it('should handle server errors gracefully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        credential: { id: 'credential-id' },
        challengeId: 'test-challenge-id',
      },
    });

    vi.mocked(authUtilsModule.getSessionFromReq).mockResolvedValueOnce({
      user: { id: 'user-123' },
      expires: new Date().toISOString(),
    });

    // Force an error during verification
    const error = new Error('Verification error');
    vi.mocked(webauthnModule.verifyWebAuthnRegistration).mockRejectedValueOnce(error);
    
    // Spy on console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await registerVerifyHandler(req, res);

    expect(consoleSpy).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Internal server error',
    });
  });
}); 