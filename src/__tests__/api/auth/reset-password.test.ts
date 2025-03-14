import * as passwordModule from '@/lib/auth/password';
import { db } from '@/lib/db/prisma';
import resetPasswordHandler from '@/pages/api/auth/reset-password';
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

vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password-123'),
}));

describe('Reset Password API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test handling of non-POST requests
  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await resetPasswordHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Method not allowed',
    });
  });

  // Test validation for missing token or password
  it('should return 400 if token or password is missing', async () => {
    const { req: reqNoToken, res: resNoToken } = createMocks({
      method: 'POST',
      body: { password: 'newPassword123' },
    });

    await resetPasswordHandler(reqNoToken, resNoToken);

    expect(resNoToken._getStatusCode()).toBe(400);
    expect(JSON.parse(resNoToken._getData())).toEqual({
      message: 'Token and password are required',
    });

    const { req: reqNoPassword, res: resNoPassword } = createMocks({
      method: 'POST',
      body: { token: 'valid-token' },
    });

    await resetPasswordHandler(reqNoPassword, resNoPassword);

    expect(resNoPassword._getStatusCode()).toBe(400);
    expect(JSON.parse(resNoPassword._getData())).toEqual({
      message: 'Token and password are required',
    });
  });

  // Test password validation
  it('should return 400 if password is too short', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { token: 'valid-token', password: 'short' },
    });

    await resetPasswordHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Password must be at least 8 characters long',
    });
  });

  // Test handling of invalid token
  it('should return 400 if token is invalid', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { token: 'invalid-token', password: 'ValidPassword123' },
    });

    vi.mocked(db.verificationToken.findUnique).mockResolvedValueOnce(null);

    await resetPasswordHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Invalid token',
    });
  });

  // Test handling of expired token
  it('should return 400 if token has expired', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { token: 'expired-token', password: 'ValidPassword123' },
    });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // 1 day in the past

    const mockToken: VerificationToken = {
      identifier: 'user@example.com',
      token: 'expired-token',
      expires: pastDate,
    };

    vi.mocked(db.verificationToken.findUnique).mockResolvedValueOnce(mockToken);

    await resetPasswordHandler(req, res);

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
      body: { token: 'valid-token', password: 'ValidPassword123' },
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

    await resetPasswordHandler(req, res);

    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'User not found',
    });
  });

  // Test successful password reset
  it('should successfully reset the password', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { token: 'valid-token', password: 'ValidPassword123' },
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
      password: 'old-hash',
      role: 'USER',
      mfaEnabled: false,
      mfaBackupCodes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.verificationToken.findUnique).mockResolvedValueOnce(mockToken);
    vi.mocked(db.user.findFirst).mockResolvedValueOnce(mockUser as any);

    await resetPasswordHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Password has been reset successfully',
    });

    // Verify password was hashed and updated
    expect(passwordModule.hashPassword).toHaveBeenCalledWith('ValidPassword123');
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: { password: 'hashed-password-123' },
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
      body: { token: 'valid-token', password: 'ValidPassword123' },
    });

    vi.mocked(db.verificationToken.findUnique).mockRejectedValueOnce(
      new Error('Database error')
    );

    await resetPasswordHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Internal server error',
    });
  });
}); 