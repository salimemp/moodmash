import registerHandler from '@/pages/api/auth/register';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the database
vi.mock('@/lib/db/prisma', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock the password hasher
vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed_password'),
}));

// Import the mocked modules
import { hashPassword } from '@/lib/auth/password';
import { db } from '@/lib/db/prisma';

describe('Registration API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return 405 if method is not POST', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    await registerHandler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res._getJSONData()).toEqual({
      message: 'Method not allowed',
    });
  });

  it('should return 400 if required fields are missing', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        // Missing name, email, and password
      },
    });

    await registerHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({
      message: 'Missing required fields',
    });
  });

  it('should return 400 if password is too short', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: '123', // Too short
      },
    });

    await registerHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({
      message: 'Password must be at least 8 characters long',
    });
  });

  it('should return 400 if user already exists', async () => {
    // Mock findUnique to return a user, indicating the user already exists
    (db.user.findUnique as any).mockResolvedValue({ id: '123', email: 'test@example.com' });

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      },
    });

    await registerHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({
      message: 'User with this email already exists',
    });

    // Verify that the database was queried with the correct parameters
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
  });

  it('should successfully create a new user', async () => {
    // Mock findUnique to return null, indicating the user doesn't exist
    (db.user.findUnique as any).mockResolvedValue(null);

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
    (db.user.create as any).mockResolvedValue(createdUser);

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
    expect(db.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: expect.any(Date),
        }),
      })
    );
  });

  it('should handle database errors gracefully', async () => {
    // Mock findUnique to return null, indicating the user doesn't exist
    (db.user.findUnique as any).mockResolvedValue(null);

    // Mock the user creation to throw an error
    (db.user.create as any).mockRejectedValue(new Error('Database error'));

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      },
    });

    await registerHandler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({
      message: 'Internal server error',
    });
  });

  it('should handle password hashing errors gracefully', async () => {
    // Mock findUnique to return null, indicating the user doesn't exist
    (db.user.findUnique as any).mockResolvedValue(null);

    // Mock the password hash to throw an error
    (hashPassword as any).mockRejectedValue(new Error('Hashing error'));

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      },
    });

    await registerHandler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({
      message: 'Internal server error',
    });
  });
}); 