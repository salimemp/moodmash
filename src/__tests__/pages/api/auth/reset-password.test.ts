import { hashPassword } from '@/lib/auth/password';
import { db } from '@/lib/db/prisma';
import resetPasswordHandler from '@/pages/api/auth/reset-password';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the dependencies
vi.mock('@/lib/db/prisma', () => ({
  db: {
    user: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    verificationToken: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn(),
}));

describe('Reset Password API Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    await resetPasswordHandler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res._getJSONData()).toEqual({ message: 'Method not allowed' });
  });

  it('should return 400 if required fields are missing', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { token: 'valid-token' }, // Missing password
    });

    await resetPasswordHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'Token and password are required' });
  });

  it('should return 400 if password is too short', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { 
        token: 'valid-token',
        password: 'short' // Too short password
      },
    });

    await resetPasswordHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'Password must be at least 8 characters long' });
  });

  it('should return 400 for invalid token', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { 
        token: 'invalid-token',
        password: 'password123'
      },
    });

    (db.verificationToken.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    await resetPasswordHandler(req, res);

    expect(db.verificationToken.findUnique).toHaveBeenCalledWith({
      where: { token: 'invalid-token' },
    });
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'Invalid token' });
  });

  it('should return 400 for expired token', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { 
        token: 'expired-token',
        password: 'password123'
      },
    });

    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1); // 1 day ago

    (db.verificationToken.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      token: 'expired-token',
      identifier: 'user@example.com',
      expires: expiredDate,
    });

    await resetPasswordHandler(req, res);

    expect(db.verificationToken.findUnique).toHaveBeenCalledWith({
      where: { token: 'expired-token' },
    });
    expect(db.verificationToken.delete).toHaveBeenCalledWith({
      where: { token: 'expired-token' },
    });
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'Token has expired' });
  });

  it('should return 404 if user not found', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { 
        token: 'valid-token',
        password: 'password123'
      },
    });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // 1 day in the future
    const userEmail = 'user@example.com';

    (db.verificationToken.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      token: 'valid-token',
      identifier: userEmail,
      expires: futureDate,
    });
    
    (db.user.findFirst as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    await resetPasswordHandler(req, res);

    expect(db.verificationToken.findUnique).toHaveBeenCalledWith({
      where: { token: 'valid-token' },
    });
    expect(db.user.findFirst).toHaveBeenCalledWith({
      where: { email: userEmail },
    });
    expect(res.statusCode).toBe(404);
    expect(res._getJSONData()).toEqual({ message: 'User not found' });
  });

  it('should successfully reset password', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { 
        token: 'valid-token',
        password: 'newPassword123'
      },
    });

    const userId = 'user123';
    const userEmail = 'user@example.com';
    const hashedPassword = 'hashed_new_password';
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // 1 day in the future
    
    (db.verificationToken.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      token: 'valid-token',
      identifier: userEmail,
      expires: futureDate,
    });
    
    (db.user.findFirst as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: userId,
      email: userEmail,
    });
    
    (hashPassword as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(hashedPassword);
    
    (db.user.update as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: userId,
    });

    await resetPasswordHandler(req, res);

    expect(db.verificationToken.findUnique).toHaveBeenCalledWith({
      where: { token: 'valid-token' },
    });
    expect(db.user.findFirst).toHaveBeenCalledWith({
      where: { email: userEmail },
    });
    expect(hashPassword).toHaveBeenCalledWith('newPassword123');
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    expect(db.verificationToken.delete).toHaveBeenCalledWith({
      where: { token: 'valid-token' },
    });
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'Password has been reset successfully' });
  });

  it('should handle errors gracefully', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { 
        token: 'valid-token',
        password: 'password123'
      },
    });

    // Simulate an error
    (db.verificationToken.findUnique as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Database error'));

    // Mock console.error to prevent test output pollution
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await resetPasswordHandler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({ message: 'Internal server error' });
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
}); 