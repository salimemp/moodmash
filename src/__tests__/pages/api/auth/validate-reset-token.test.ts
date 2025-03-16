import handler from '@/pages/api/auth/validate-reset-token';
import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the database
vi.mock('@/lib/db/prisma', () => ({
  db: {
    verificationToken: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { db } from '@/lib/db/prisma';

describe('Validate Reset Token API Endpoint', () => {
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

  it('should return 400 if token is missing', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {},
    });

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'Token is required' });
  });

  it('should return 400 for invalid token', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { token: 'invalid-token' },
    });

    // Mock the database response for invalid token
    (db.verificationToken.findUnique as any).mockResolvedValue(null);

    await handler(req, res);

    expect(db.verificationToken.findUnique).toHaveBeenCalledWith({
      where: { token: 'invalid-token' },
    });
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'Invalid token' });
  });

  it('should return 400 for expired token', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { token: 'expired-token' },
    });

    // Mock the database response for expired token
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1); // 1 day ago
    
    (db.verificationToken.findUnique as any).mockResolvedValue({
      token: 'expired-token',
      identifier: 'user@example.com',
      expires: expiredDate,
    });

    await handler(req, res);

    expect(db.verificationToken.findUnique).toHaveBeenCalledWith({
      where: { token: 'expired-token' },
    });
    expect(db.verificationToken.delete).toHaveBeenCalledWith({
      where: { token: 'expired-token' },
    });
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'Token has expired' });
  });

  it('should return 200 for valid token', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { token: 'valid-token' },
    });

    // Mock the database response for valid token
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // 1 day in the future
    
    (db.verificationToken.findUnique as any).mockResolvedValue({
      token: 'valid-token',
      identifier: 'user@example.com',
      expires: futureDate,
    });

    await handler(req, res);

    expect(db.verificationToken.findUnique).toHaveBeenCalledWith({
      where: { token: 'valid-token' },
    });
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'Token is valid' });
  });

  it('should handle errors gracefully', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { token: 'valid-token' },
    });

    // Mock a database error
    (db.verificationToken.findUnique as any).mockRejectedValue(new Error('Database error'));

    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({ message: 'Internal server error' });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
}); 