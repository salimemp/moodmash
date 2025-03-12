import { db } from '@/lib/db/prisma';
import updateProfileHandler from '@/pages/api/profile/update';
import { getServerSession } from 'next-auth';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db/prisma', () => ({
  db: {
    user: {
      update: vi.fn(),
    },
  },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth/auth-options', () => ({
  authOptions: {},
}));

vi.mock('@/lib/auth/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(true),
}));

// Tests for Profile Update API
// Validates profile update functionality and input validation
describe('Profile Update API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Verifies that the API rejects non-POST methods
  // Ensures correct HTTP method validation
  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await updateProfileHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Method not allowed',
    });
  });

  // Verifies that unauthenticated requests are rejected
  // Ensures proper authentication checks
  it('should return 401 for unauthenticated requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { name: 'New Name', bio: 'New Bio', image: 'new-image.jpg' },
    });

    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    await updateProfileHandler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Unauthorized',
    });
  });

  // Verifies that bio length is validated properly
  // Ensures input validation rules are enforced
  it('should return 400 if bio exceeds 160 characters', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { 
        name: 'Test User', 
        bio: 'a'.repeat(161), 
        image: 'image.jpg' 
      },
    });

    // Mock authenticated session
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: 'user-123', email: 'user@example.com' },
      expires: new Date().toISOString(),
    });

    await updateProfileHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Bio cannot exceed 160 characters',
    });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  // Verifies successful profile update
  // Ensures the entire flow works correctly with valid inputs
  it('should update user profile successfully with valid inputs', async () => {
    const profileData = { 
      name: 'Updated Name', 
      bio: 'Updated Bio', 
      image: 'updated-image.jpg' 
    };
    
    const { req, res } = createMocks({
      method: 'POST',
      body: profileData,
    });

    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      name: 'Old Name',
      bio: 'Old Bio',
      image: 'old-image.jpg',
      // Additional required fields
      emailVerified: null,
      password: null,
      settings: null,
      role: 'USER',
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedUser = {
      ...mockUser,
      ...profileData,
    };

    // Mock authenticated session
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: mockUser.id, email: mockUser.email },
      expires: new Date().toISOString(),
    });

    vi.mocked(db.user.update).mockResolvedValueOnce(updatedUser);

    await updateProfileHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Profile updated successfully',
      user: updatedUser
    });
    
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: profileData,
    });
  });

  // Verifies partial profile updates
  // Ensures users can update only specific fields
  it('should update only provided fields', async () => {
    const partialProfileData = { 
      name: 'Updated Name'
      // No bio or image
    };
    
    const { req, res } = createMocks({
      method: 'POST',
      body: partialProfileData,
    });

    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      name: 'Old Name',
      bio: 'Old Bio',
      image: 'old-image.jpg',
      // Additional required fields
      emailVerified: null,
      password: null,
      settings: null,
      role: 'USER',
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedUser = {
      ...mockUser,
      ...partialProfileData,
    };

    // Mock authenticated session
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: mockUser.id, email: mockUser.email },
      expires: new Date().toISOString(),
    });

    vi.mocked(db.user.update).mockResolvedValueOnce(updatedUser);

    await updateProfileHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: partialProfileData,
    });
  });

  // Verifies error handling
  // Ensures database errors are handled gracefully
  it('should handle database errors gracefully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { name: 'Test User' },
    });

    // Mock authenticated session
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: 'user-123', email: 'user@example.com' },
      expires: new Date().toISOString(),
    });

    vi.mocked(db.user.update).mockRejectedValueOnce(
      new Error('Database error')
    );

    await updateProfileHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Error updating profile',
    });
  });
}); 