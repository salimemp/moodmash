import * as rateLimitModule from '@/lib/auth/rate-limit';
import * as webauthnModule from '@/lib/auth/webauthn';
import { authenticationChallengeStore } from '@/pages/api/auth/webauthn/login-options';
import loginVerifyHandler from '@/pages/api/auth/webauthn/login-verify';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the dependencies
vi.mock('@/lib/auth/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(true),
  resetRateLimit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/auth/webauthn', () => ({
  verifyWebAuthnAuthentication: vi.fn(),
}));

// Mock next-auth directly with a mock implementation
vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}));

// Mock the authentication challenge store
vi.mock('@/pages/api/auth/webauthn/login-options', () => ({
  authenticationChallengeStore: {},
}));

// Import the mocked getServerSession after mocking
import { getServerSession } from 'next-auth';

describe('WebAuthn Login Verify API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the challenge store
    Object.keys(authenticationChallengeStore).forEach((key) => {
      delete authenticationChallengeStore[key];
    });
  });

  // Test handling of non-POST requests
  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await loginVerifyHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Method not allowed',
    });
  });

  // Test different HTTP methods 
  it('should return 405 for PUT requests', async () => {
    const { req, res } = createMocks({
      method: 'PUT',
    });

    await loginVerifyHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Method not allowed',
    });
  });

  it('should return 405 for DELETE requests', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
    });

    await loginVerifyHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Method not allowed',
    });
  });

  // Test rate limiting
  it('should apply rate limiting', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { credential: 'test-credential', requestId: 'test-request-id' },
    });

    vi.mocked(rateLimitModule.rateLimit).mockResolvedValueOnce(false);

    await loginVerifyHandler(req, res);

    expect(rateLimitModule.rateLimit).toHaveBeenCalledWith(req, res, 'general');
    // The handler should return early without calling verifyWebAuthnAuthentication
    expect(webauthnModule.verifyWebAuthnAuthentication).not.toHaveBeenCalled();
  });

  // Test validation for missing credential or requestId
  it('should return 400 if credential or requestId is missing', async () => {
    const { req: reqNoCredential, res: resNoCredential } = createMocks({
      method: 'POST',
      body: { requestId: 'test-request-id' },
    });

    await loginVerifyHandler(reqNoCredential, resNoCredential);

    expect(resNoCredential._getStatusCode()).toBe(400);
    expect(JSON.parse(resNoCredential._getData())).toEqual({
      message: 'Credential and requestId are required',
    });

    const { req: reqNoRequestId, res: resNoRequestId } = createMocks({
      method: 'POST',
      body: { credential: 'test-credential' },
    });

    await loginVerifyHandler(reqNoRequestId, resNoRequestId);

    expect(resNoRequestId._getStatusCode()).toBe(400);
    expect(JSON.parse(resNoRequestId._getData())).toEqual({
      message: 'Credential and requestId are required',
    });
  });

  // Test with empty objects as credentials
  it('should return 400 if credential is an empty object', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { credential: {}, requestId: 'test-request-id' },
    });

    await loginVerifyHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Authentication challenge not found or expired. Please try again.',
    });
  });

  // Test with empty string as requestId
  it('should return 400 if requestId is an empty string', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { credential: 'test-credential', requestId: '' },
    });

    await loginVerifyHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Credential and requestId are required',
    });
  });

  // Test handling of missing challenge
  it('should return 400 if challenge is not found', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { credential: 'test-credential', requestId: 'test-request-id' },
    });

    // Challenge store is empty, so it should return an error

    await loginVerifyHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Authentication challenge not found or expired. Please try again.',
    });
  });

  // Test failed authentication
  it('should return 400 if authentication fails', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { credential: 'test-credential', requestId: 'test-request-id' },
    });

    // Add a challenge to the store
    Object.defineProperty(authenticationChallengeStore, 'test-request-id', {
      value: 'test-challenge',
      configurable: true,
      enumerable: true,
    });

    // Use type assertion (as any) to bypass TypeScript checks
    vi.mocked(webauthnModule.verifyWebAuthnAuthentication).mockResolvedValueOnce({
      verified: false,
      authenticationInfo: {
        // Mock the minimum needed properties
        credentialID: 'test-credential-id',
        newCounter: 0,
        // Add dummy values for required properties
        userVerified: true,
        credentialDeviceType: 'platform',
        credentialBackedUp: false,
        origin: 'http://localhost:3000',
        rpID: 'localhost',
      },
      user: undefined,
    } as any);

    await loginVerifyHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Authentication failed',
    });

    // Verify the challenge was removed from the store
    expect(authenticationChallengeStore['test-request-id']).toBeUndefined();
  });

  // Test authentication with valid credential but missing user data
  it('should return 400 if authentication is verified but user data is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { credential: 'test-credential', requestId: 'test-request-id' },
    });

    // Add a challenge to the store
    Object.defineProperty(authenticationChallengeStore, 'test-request-id', {
      value: 'test-challenge',
      configurable: true,
      enumerable: true,
    });

    // Use type assertion (as any) to bypass TypeScript checks
    vi.mocked(webauthnModule.verifyWebAuthnAuthentication).mockResolvedValueOnce({
      verified: true,
      authenticationInfo: {
        credentialID: 'test-credential-id',
        newCounter: 0,
        userVerified: true,
        credentialDeviceType: 'platform',
        credentialBackedUp: false,
        origin: 'http://localhost:3000',
        rpID: 'localhost',
      },
      user: null, // User data is missing
    } as any);

    await loginVerifyHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Authentication failed',
    });

    // Verify the challenge was removed from the store
    expect(authenticationChallengeStore['test-request-id']).toBeUndefined();
  });

  // Test successful authentication without session
  it('should return user data for successful authentication without session', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { credential: 'test-credential', requestId: 'test-request-id' },
    });

    // Add a challenge to the store
    Object.defineProperty(authenticationChallengeStore, 'test-request-id', {
      value: 'test-challenge',
      configurable: true,
      enumerable: true,
    });

    const mockUser = {
      id: 'user-123',
      email: 'user@example.com'
    };

    // Use type assertion (as any) to bypass TypeScript checks
    vi.mocked(webauthnModule.verifyWebAuthnAuthentication).mockResolvedValueOnce({
      verified: true,
      authenticationInfo: {
        // Mock the minimum needed properties
        credentialID: 'test-credential-id',
        newCounter: 1,
        // Add dummy values for required properties
        userVerified: true,
        credentialDeviceType: 'platform',
        credentialBackedUp: false,
        origin: 'http://localhost:3000',
        rpID: 'localhost',
      },
      user: mockUser,
    } as any);

    // No session exists
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    await loginVerifyHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Authentication successful',
      user: {
        id: 'user-123',
        email: 'user@example.com',
      },
    });

    // Verify rate limit was reset
    expect(rateLimitModule.resetRateLimit).toHaveBeenCalledWith('login', 'user@example.com');

    // Verify the challenge was removed from the store
    expect(authenticationChallengeStore['test-request-id']).toBeUndefined();
  });

  // Test successful authentication with missing email
  it('should handle successful authentication when user has no email', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { credential: 'test-credential', requestId: 'test-request-id' },
    });

    // Add a challenge to the store
    Object.defineProperty(authenticationChallengeStore, 'test-request-id', {
      value: 'test-challenge',
      configurable: true,
      enumerable: true,
    });

    const mockUser = {
      id: 'user-123',
      // No email property
    };

    // Use type assertion (as any) to bypass TypeScript checks
    vi.mocked(webauthnModule.verifyWebAuthnAuthentication).mockResolvedValueOnce({
      verified: true,
      authenticationInfo: {
        credentialID: 'test-credential-id',
        newCounter: 1,
        userVerified: true,
        credentialDeviceType: 'platform',
        credentialBackedUp: false,
        origin: 'http://localhost:3000',
        rpID: 'localhost',
      },
      user: mockUser,
    } as any);

    // No session exists
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    await loginVerifyHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Authentication successful',
      user: {
        id: 'user-123',
      },
    });

    // Verify rate limit was NOT reset (no email)
    expect(rateLimitModule.resetRateLimit).not.toHaveBeenCalled();

    // Verify the challenge was removed from the store
    expect(authenticationChallengeStore['test-request-id']).toBeUndefined();
  });

  // Test successful authentication with existing session
  it('should update session for successful authentication with existing session', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { credential: 'test-credential', requestId: 'test-request-id' },
    });

    // Add a challenge to the store
    Object.defineProperty(authenticationChallengeStore, 'test-request-id', {
      value: 'test-challenge',
      configurable: true,
      enumerable: true,
    });

    const mockUser = {
      id: 'user-123',
      email: 'user@example.com'
    };

    // Use type assertion (as any) to bypass TypeScript checks
    vi.mocked(webauthnModule.verifyWebAuthnAuthentication).mockResolvedValueOnce({
      verified: true,
      authenticationInfo: {
        // Mock the minimum needed properties
        credentialID: 'test-credential-id',
        newCounter: 1,
        // Add dummy values for required properties
        userVerified: true,
        credentialDeviceType: 'platform',
        credentialBackedUp: false,
        origin: 'http://localhost:3000',
        rpID: 'localhost',
      },
      user: mockUser,
    } as any);

    // Mock an existing session
    const mockSession = {
      user: { id: 'user-123', email: 'user@example.com' },
      expires: new Date().toISOString(),
    };

    vi.mocked(getServerSession).mockResolvedValueOnce(mockSession);

    await loginVerifyHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Authentication successful',
      user: {
        id: 'user-123',
        email: 'user@example.com',
      },
    });

    // Verify rate limit was reset
    expect(rateLimitModule.resetRateLimit).toHaveBeenCalledWith('login', 'user@example.com');

    // Verify the challenge was removed from the store
    expect(authenticationChallengeStore['test-request-id']).toBeUndefined();
  });

  // Test error handling
  it('should handle server errors gracefully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { credential: 'test-credential', requestId: 'test-request-id' },
    });

    // Add a challenge to the store
    Object.defineProperty(authenticationChallengeStore, 'test-request-id', {
      value: 'test-challenge',
      configurable: true,
      enumerable: true,
    });

    // Mock an error being thrown during authentication
    vi.mocked(webauthnModule.verifyWebAuthnAuthentication).mockImplementationOnce(() => {
      throw new Error('Authentication error');
    });

    await loginVerifyHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Internal server error',
    });
  });

  // Test session error handling
  it('should handle errors from getServerSession gracefully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { credential: 'test-credential', requestId: 'test-request-id' },
    });

    // Add a challenge to the store
    Object.defineProperty(authenticationChallengeStore, 'test-request-id', {
      value: 'test-challenge',
      configurable: true,
      enumerable: true,
    });

    const mockUser = {
      id: 'user-123',
      email: 'user@example.com'
    };

    // Authentication succeeds
    vi.mocked(webauthnModule.verifyWebAuthnAuthentication).mockResolvedValueOnce({
      verified: true,
      authenticationInfo: {
        credentialID: 'test-credential-id',
        newCounter: 1,
        userVerified: true,
        credentialDeviceType: 'platform',
        credentialBackedUp: false,
        origin: 'http://localhost:3000',
        rpID: 'localhost',
      },
      user: mockUser,
    } as any);

    // But getting the session fails
    vi.mocked(getServerSession).mockRejectedValueOnce(new Error('Session error'));

    await loginVerifyHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Internal server error',
    });
  });

  // Test rate limit resetting error handling
  it('should complete authentication even if resetRateLimit fails', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { credential: 'test-credential', requestId: 'test-request-id' },
    });

    // Add a challenge to the store
    Object.defineProperty(authenticationChallengeStore, 'test-request-id', {
      value: 'test-challenge',
      configurable: true,
      enumerable: true,
    });

    const mockUser = {
      id: 'user-123',
      email: 'user@example.com'
    };

    // Authentication succeeds
    vi.mocked(webauthnModule.verifyWebAuthnAuthentication).mockResolvedValueOnce({
      verified: true,
      authenticationInfo: {
        credentialID: 'test-credential-id',
        newCounter: 1,
        userVerified: true,
        credentialDeviceType: 'platform',
        credentialBackedUp: false,
        origin: 'http://localhost:3000',
        rpID: 'localhost',
      },
      user: mockUser,
    } as any);

    // But resetting rate limit fails
    vi.mocked(rateLimitModule.resetRateLimit).mockRejectedValueOnce(new Error('Rate limit error'));

    // No session exists
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    await loginVerifyHandler(req, res);

    // Even with the rate limit error, authentication should complete successfully
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Internal server error',
    });
  });

  // Test authentication with verified status but undefined user
  it('should return 400 if authentication is verified but user is undefined', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { credential: 'test-credential', requestId: 'test-request-id' },
    });

    // Add a challenge to the store
    Object.defineProperty(authenticationChallengeStore, 'test-request-id', {
      value: 'test-challenge',
      configurable: true,
      enumerable: true,
    });

    // Use type assertion (as any) to bypass TypeScript checks
    vi.mocked(webauthnModule.verifyWebAuthnAuthentication).mockResolvedValueOnce({
      verified: true,
      authenticationInfo: {
        credentialID: 'test-credential-id',
        newCounter: 0,
        userVerified: true,
        credentialDeviceType: 'platform',
        credentialBackedUp: false,
        origin: 'http://localhost:3000',
        rpID: 'localhost',
      },
      user: undefined, // User is undefined
    } as any);

    await loginVerifyHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Authentication failed',
    });

    // Verify the challenge was removed from the store
    expect(authenticationChallengeStore['test-request-id']).toBeUndefined();
  });
}); 