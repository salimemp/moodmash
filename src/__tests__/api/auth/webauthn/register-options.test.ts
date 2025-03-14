import * as rateLimitModule from '@/lib/auth/rate-limit';
import * as authUtilsModule from '@/lib/auth/utils';
import * as webauthnModule from '@/lib/auth/webauthn';
import registerOptionsHandler, { registrationChallengeStore } from '@/pages/api/auth/webauthn/register-options';
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types';
import { createMocks } from 'node-mocks-http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/auth/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/auth/webauthn', () => ({
  generateWebAuthnRegistrationOptions: vi.fn(),
}));

vi.mock('@/lib/auth/utils', () => ({
  getSessionFromReq: vi.fn(),
}));

// Mock crypto.randomUUID to return a consistent value for testing
vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    randomUUID: vi.fn().mockReturnValue('test-uuid'),
  };
});

// Store original setTimeout
const originalSetTimeout = global.setTimeout;

describe('WebAuthn Register Options API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset the challenge store
    Object.keys(registrationChallengeStore).forEach((key) => {
      delete registrationChallengeStore[key];
    });
    
    // Mock setTimeout to prevent it from actually setting timeouts in tests
    global.setTimeout = vi.fn() as any;
  });

  afterEach(() => {
    // Restore original setTimeout
    global.setTimeout = originalSetTimeout;
  });

  // Test handling of non-GET requests
  it('should return 405 for non-GET requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    await registerOptionsHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Method not allowed',
    });
  });

  // Test rate limiting
  it('should apply rate limiting', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    vi.mocked(rateLimitModule.rateLimit).mockResolvedValueOnce(false);

    await registerOptionsHandler(req, res);

    expect(rateLimitModule.rateLimit).toHaveBeenCalledWith(req, res, 'general');
    // The handler should return early without calling generateWebAuthnRegistrationOptions
    expect(webauthnModule.generateWebAuthnRegistrationOptions).not.toHaveBeenCalled();
  });

  // Test authentication requirement
  it('should return 401 if user is not authenticated', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    vi.mocked(authUtilsModule.getSessionFromReq).mockResolvedValueOnce(null);

    await registerOptionsHandler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Unauthorized',
    });
  });

  // Test validation of user ID and email
  it('should return 400 if user ID or email is missing', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    // Mock session with missing email
    vi.mocked(authUtilsModule.getSessionFromReq).mockResolvedValueOnce({
      user: { id: 'user-123', name: 'Test User' },
      expires: new Date().toISOString(),
    });

    await registerOptionsHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'User ID and email are required',
    });

    // Reset mocks and test missing ID
    vi.clearAllMocks();
    const { req: req2, res: res2 } = createMocks({
      method: 'GET',
    });

    // Mock session with missing ID
    vi.mocked(authUtilsModule.getSessionFromReq).mockResolvedValueOnce({
      user: { email: 'user@example.com', name: 'Test User', id: undefined as any },
      expires: new Date().toISOString(),
    });

    await registerOptionsHandler(req2, res2);

    expect(res2._getStatusCode()).toBe(400);
    expect(JSON.parse(res2._getData())).toEqual({
      message: 'User ID and email are required',
    });
  });

  // Test successful generation of registration options
  it('should successfully generate registration options', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    // Mock valid session
    vi.mocked(authUtilsModule.getSessionFromReq).mockResolvedValueOnce({
      user: { 
        id: 'user-123', 
        email: 'user@example.com', 
        name: 'Test User' 
      },
      expires: new Date().toISOString(),
    });

    // Mock registration options
    const mockOptions: PublicKeyCredentialCreationOptionsJSON = {
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
      pubKeyCredParams: [],
      timeout: 60000,
      attestation: 'none',
      excludeCredentials: [],
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    };

    vi.mocked(webauthnModule.generateWebAuthnRegistrationOptions).mockResolvedValueOnce(mockOptions);

    await registerOptionsHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    // Verify the JSON response
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('options');
    expect(responseData).toHaveProperty('challengeId');
    expect(responseData.options).toEqual(mockOptions);
    
    // Get the actual challengeId from the response
    const challengeId = responseData.challengeId;
    
    // Verify the challenge was stored using the actual challengeId from the response
    expect(registrationChallengeStore[challengeId]).toBe('mock-challenge');
    
    // Verify function calls
    expect(webauthnModule.generateWebAuthnRegistrationOptions).toHaveBeenCalledWith(
      'user-123',
      'user@example.com',
      'Test User'
    );
    
    // Verify setTimeout was called to clear the challenge
    expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 15 * 60 * 1000);
  });

  // Test fallback to email as display name when name is missing
  it('should use email as display name when name is missing', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    // Mock valid session without name
    vi.mocked(authUtilsModule.getSessionFromReq).mockResolvedValueOnce({
      user: { 
        id: 'user-123', 
        email: 'user@example.com', 
        name: null 
      },
      expires: new Date().toISOString(),
    });

    // Mock registration options
    const mockOptions: PublicKeyCredentialCreationOptionsJSON = {
      challenge: 'mock-challenge',
      rp: {
        name: 'MoodMash',
        id: 'localhost',
      },
      user: {
        id: 'user-123',
        name: 'user@example.com',
        displayName: 'user@example.com',
      },
      pubKeyCredParams: [],
      timeout: 60000,
      attestation: 'none',
      excludeCredentials: [],
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    };

    vi.mocked(webauthnModule.generateWebAuthnRegistrationOptions).mockResolvedValueOnce(mockOptions);

    await registerOptionsHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    // Verify function calls with email as display name
    expect(webauthnModule.generateWebAuthnRegistrationOptions).toHaveBeenCalledWith(
      'user-123',
      'user@example.com',
      'user@example.com'
    );
  });

  // Test error handling
  it('should handle server errors gracefully', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    // Mock valid session
    vi.mocked(authUtilsModule.getSessionFromReq).mockResolvedValueOnce({
      user: { 
        id: 'user-123', 
        email: 'user@example.com', 
        name: 'Test User' 
      },
      expires: new Date().toISOString(),
    });

    // Force an error
    const error = new Error('Registration options error');
    vi.mocked(webauthnModule.generateWebAuthnRegistrationOptions).mockRejectedValueOnce(error);
    
    // Spy on console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await registerOptionsHandler(req, res);

    expect(consoleSpy).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Internal server error',
    });
  });
}); 