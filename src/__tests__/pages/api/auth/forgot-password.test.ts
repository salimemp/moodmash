import handler from '@/pages/api/auth/forgot-password';
import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the database
vi.mock('@/lib/db/prisma', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock rate limiting
vi.mock('@/lib/auth/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(true),
}));

// Mock email sending
vi.mock('@/lib/email/sendPasswordResetEmail', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

import { rateLimit } from '@/lib/auth/rate-limit';
import { db } from '@/lib/db/prisma';
import { sendPasswordResetEmail } from '@/lib/email/sendPasswordResetEmail';

describe('Forgot Password API Endpoint', () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res._getJSONData()).toEqual({ message: 'Method not allowed' });
  });

  it('should return 400 if email is missing', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {},
    });

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'Email is required' });
  });

  it('should return 200 if user does not exist', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { email: 'nonexistent@example.com' },
    });

    // Mock the database response for non-existent user
    (db.user.findUnique as any).mockResolvedValue(null);

    await handler(req, res);

    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'nonexistent@example.com' },
    });
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({
      message: 'If a user with that email exists, a password reset link has been sent.',
    });
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('should send reset email if user exists', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { email: 'user@example.com' },
      headers: {
        host: 'test.com',
      },
    });

    // Mock the database response for existing user
    const userId = 'user-123';
    (db.user.findUnique as any).mockResolvedValue({
      id: userId,
      email: 'user@example.com',
    });

    await handler(req, res);

    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });
    expect(sendPasswordResetEmail).toHaveBeenCalledWith({
      email: 'user@example.com',
      userId,
      baseUrl: 'http://test.com',
    });
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({
      message: 'If a user with that email exists, a password reset link has been sent.',
    });
  });

  it('should return early if rate limit is exceeded', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { email: 'user@example.com' },
    });

    // Mock rate limit exceeded
    (rateLimit as any).mockResolvedValueOnce(false);

    await handler(req, res);

    expect(rateLimit).toHaveBeenCalledWith(req, res, 'general');
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('should return early if email-specific rate limit is exceeded', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { email: 'user@example.com' },
    });

    // Mock general rate limit passed but email-specific rate limit exceeded
    (rateLimit as any).mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    await handler(req, res);

    expect(rateLimit).toHaveBeenCalledWith(req, res, 'general');
    expect(rateLimit).toHaveBeenCalledWith(req, res, 'passwordReset', 'user@example.com');
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { email: 'user@example.com' },
    });

    // Mock a database error
    (db.user.findUnique as any).mockRejectedValue(new Error('Database error'));

    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({ message: 'Internal server error' });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
}); 