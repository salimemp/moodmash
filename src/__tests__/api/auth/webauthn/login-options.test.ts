import * as rateLimitModule from '@/lib/auth/rate-limit';
import * as webauthnModule from '@/lib/auth/webauthn';
import loginOptionsHandler, { authenticationChallengeStore } from '@/pages/api/auth/webauthn/login-options';
import { createMocks } from 'node-mocks-http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/auth/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/auth/webauthn', () => ({
  generateWebAuthnAuthenticationOptions: vi.fn(),
  rpID: 'localhost',
}));

// Mock crypto.randomUUID to return a consistent value for testing
vi.mock('crypto', () => ({
  randomUUID: vi.fn().mockReturnValue('test-uuid'),
}));

// Store original setTimeout
const originalSetTimeout = global.setTimeout;

describe('WebAuthn Login Options API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset the challenge store
    Object.keys(authenticationChallengeStore).forEach((key) => {
      delete authenticationChallengeStore[key];
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

    await loginOptionsHandler(req, res);

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

    await loginOptionsHandler(req, res);

    expect(rateLimitModule.rateLimit).toHaveBeenCalledWith(req, res, 'general');
    // The handler should return early without calling generateWebAuthnAuthenticationOptions
    expect(webauthnModule.generateWebAuthnAuthenticationOptions).not.toHaveBeenCalled();
  });

  // Test error handling
  it('should handle server errors gracefully', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    const error = new Error('Authentication options error');
    vi.mocked(webauthnModule.generateWebAuthnAuthenticationOptions).mockRejectedValueOnce(error);
    
    // Spy on console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await loginOptionsHandler(req, res);

    expect(consoleSpy).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Internal server error',
    });
  });
}); 