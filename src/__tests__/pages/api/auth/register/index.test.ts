import { hashPassword } from '@/lib/auth/password';
import { db } from '@/lib/db/prisma';
import registerHandler from '@/pages/api/auth/register/index';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the dependencies
vi.mock('@/lib/db/prisma', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn(),
}));

// Mock rate limiting
vi.mock('@/lib/api/rate-limit', () => ({
  rateLimit: () => {
    return {
      check: vi.fn().mockResolvedValue({
        success: true
      })
    };
  }
}));

describe('Registration API', () => {
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

    await registerHandler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res._getJSONData()).toEqual({ message: 'Method not allowed' });
  });

  it('should return 400 if required fields are missing', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        name: 'Test User',
        // Missing email and password
      },
    });

    await registerHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'Missing required fields' });
  });

  it('should return 400 if password is too short', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'short', // Too short password
      },
    });

    await registerHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'Password must be at least 8 characters long' });
  });

  it('should return 400 if user already exists', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
      },
    });

    // Mock findUnique to return an existing user
    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 'existing-user-id',
      email: 'existing@example.com',
    });

    await registerHandler(req, res);

    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'existing@example.com' },
    });
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'User with this email already exists' });
  });

  it('should successfully create a new user', async () => {
    // Mock findUnique to return null, indicating the user doesn't exist
    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const createdUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed_password',
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock the user creation
    (db.user.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(createdUser);

    // Mock the password hashing
    (hashPassword as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce('hashed_password');

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      },
    });

    await registerHandler(req, res);

    expect(res.statusCode).toBe(201);
    
    // User data should be returned without the password
    const responseData = res._getJSONData();
    expect(responseData).toHaveProperty('id', '123');
    expect(responseData).toHaveProperty('name', 'Test User');
    expect(responseData).toHaveProperty('email', 'test@example.com');
    expect(responseData).not.toHaveProperty('password');

    // Verify that the password was hashed
    expect(hashPassword).toHaveBeenCalledWith('password123');

    // Verify that the user was created with the correct parameters
    expect(db.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        emailVerified: expect.any(Date),
      }),
    });
  });

  it('should handle errors gracefully', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      },
    });

    // Mock findUnique to throw an error
    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Database error')
    );

    // Mock console.error to prevent test output pollution
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await registerHandler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({ message: 'Internal server error' });
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
}); 