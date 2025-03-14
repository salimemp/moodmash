import * as rateLimitModule from '@/lib/auth/rate-limit';
import { db } from '@/lib/db/prisma';
import verifyEmailHandler from '@/pages/api/auth/verify-email';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Define types based on the Prisma schema
type VerificationToken = {
  identifier: string;
  token: string;
  expires: Date;
};

type MockUser = {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  password: string | null;
  bio: string | null;
  settings: string | null;
  role: string;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  mfaBackupCodes: string[];
  createdAt: Date;
  updatedAt: Date;
};

// Mock dependencies
vi.mock('@/lib/db/prisma', () => ({
  db: {
    verificationToken: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(true),
}));

describe('Verify Email API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test handling of non-POST requests
  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await verifyEmailHandler(req, res);

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

    await verifyEmailHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Missing token',
    });
  });

  // Test rate limiting
  it('should apply rate limiting', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { token: 'valid-token' },
    });

    vi.mocked(rateLimitModule.rateLimit).mockResolvedValueOnce(false);

    await verifyEmailHandler(req, res);

    expect(rateLimitModule.rateLimit).toHaveBeenCalledWith(req, res, 'emailVerification');
    // The handler should return early without calling findUnique
    expect(db.verificationToken.findUnique).not.toHaveBeenCalled();
  });

  // Test handling of invalid token
  it('should return 400 if token is invalid', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { token: 'invalid-token' },
    });

    vi.mocked(db.verificationToken.findUnique).mockResolvedValueOnce(null);

    await verifyEmailHandler(req, res);

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

    await verifyEmailHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Token has expired',
    });
    expect(db.verificationToken.delete).toHaveBeenCalledWith({
      where: { token: 'expired-token' },
    });
  });

  // Test handling of user not found
  it('should return 404 if user is not found', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { token: 'valid-token' },
    });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // 1 day in the future

    const mockToken: VerificationToken = {
      identifier: 'nonexistent@example.com',
      token: 'valid-token',
      expires: futureDate,
    };

    vi.mocked(db.verificationToken.findUnique).mockResolvedValueOnce(mockToken);
    vi.mocked(db.user.findFirst).mockResolvedValueOnce(null);

    await verifyEmailHandler(req, res);

    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'User not found',
    });
  });

  // Test successful email verification
  it('should successfully verify email', async () => {
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

    const mockUser: Partial<MockUser> = {
      id: 'user-123',
      email: 'user@example.com',
      emailVerified: null,
      role: 'USER',
      mfaEnabled: false,
      mfaBackupCodes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.verificationToken.findUnique).mockResolvedValueOnce(mockToken);
    vi.mocked(db.user.findFirst).mockResolvedValueOnce(mockUser as any);

    await verifyEmailHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Email verified successfully',
    });

    // Verify user's email verification status was updated
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: { emailVerified: expect.any(Date) },
    });

    // Verify token was deleted
    expect(db.verificationToken.delete).toHaveBeenCalledWith({
      where: { token: 'valid-token' },
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

    await verifyEmailHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Internal server error',
    });
  });
}); 