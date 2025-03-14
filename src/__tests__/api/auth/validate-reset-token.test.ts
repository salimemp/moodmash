import { db } from '@/lib/db/prisma';
import validateResetTokenHandler from '@/pages/api/auth/validate-reset-token';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Define types based on the Prisma schema
type VerificationToken = {
  identifier: string;
  token: string;
  expires: Date;
};

// Mock dependencies
vi.mock('@/lib/db/prisma', () => ({
  db: {
    verificationToken: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Validate Reset Token API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test handling of non-POST requests
  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await validateResetTokenHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Method not allowed',
    });
  });

  // Test validation for missing token
  it('should return 400 if token is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    });

    await validateResetTokenHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Token is required',
    });
  });

  // Test handling of invalid token
  it('should return 400 if token is invalid', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { token: 'invalid-token' },
    });

    vi.mocked(db.verificationToken.findUnique).mockResolvedValueOnce(null);

    await validateResetTokenHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Invalid token',
    });
  });

  // Test handling of expired token
  it('should return 400 if token has expired', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { token: 'expired-token' },
    });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // 1 day in the past

    const mockToken: VerificationToken = {
      identifier: 'user@example.com',
      token: 'expired-token',
      expires: pastDate,
    };

    vi.mocked(db.verificationToken.findUnique).mockResolvedValueOnce(mockToken);

    await validateResetTokenHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Token has expired',
    });
    expect(db.verificationToken.delete).toHaveBeenCalledWith({
      where: { token: 'expired-token' },
    });
  });

  // Test successful token validation
  it('should confirm token is valid for unexpired tokens', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { token: 'valid-token' },
    });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // 1 day in the future

    const mockToken: VerificationToken = {
      identifier: 'user@example.com',
      token: 'valid-token',
      expires: futureDate,
    };

    vi.mocked(db.verificationToken.findUnique).mockResolvedValueOnce(mockToken);

    await validateResetTokenHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Token is valid',
    });
  });

  // Test error handling
  it('should handle server errors gracefully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { token: 'valid-token' },
    });

    vi.mocked(db.verificationToken.findUnique).mockRejectedValueOnce(
      new Error('Database error')
    );

    await validateResetTokenHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Internal server error',
    });
  });
}); 