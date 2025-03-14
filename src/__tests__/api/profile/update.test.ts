import * as authUtils from '@/lib/auth/utils';
import { db } from '@/lib/db/prisma';
import updateProfileHandler from '@/pages/api/profile/update';
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

// Instead of mocking getServerSession directly, mock the utils function
vi.mock('@/lib/auth/utils', () => ({
  getSessionFromReq: vi.fn(),
}));

vi.mock('@/lib/auth/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(true),
}));

// Define a type for the mock user object to avoid TypeScript errors
type MockUser = {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  image: string | null;
  emailVerified: Date | null;
  password: string | null;
  settings: string | null;
  role: string;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  mfaBackupCodes: string[];
  createdAt: Date;
  updatedAt: Date;
};

// Define a type for the selected user data returned by the API
type UserSelect = {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  image: string | null;
};

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

    // Mock null session to simulate unauthenticated request
    vi.mocked(authUtils.getSessionFromReq).mockResolvedValueOnce(null);

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
    vi.mocked(authUtils.getSessionFromReq).mockResolvedValueOnce({
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

    // Create a mock user with the required properties
    const mockUser: MockUser = {
      id: 'user-123',
      email: 'user@example.com',
      name: 'Updated Name',
      bio: 'Updated Bio',
      image: 'updated-image.jpg',
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

    // Mock authenticated session
    vi.mocked(authUtils.getSessionFromReq).mockResolvedValueOnce({
      user: { id: 'user-123', email: 'user@example.com' },
      expires: new Date().toISOString(),
    });

    // Only mock the selected fields that the handler returns
    const selectedUserData: UserSelect = {
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      bio: mockUser.bio,
      image: mockUser.image,
    };

    // Mock the database update to return only the selected fields
    vi.mocked(db.user.update).mockResolvedValueOnce(selectedUserData as any);

    await updateProfileHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    // Parse the response data to compare
    const responseData = JSON.parse(res._getData());
    expect(responseData.message).toBe('Profile updated successfully');
    expect(responseData.user).toEqual(selectedUserData);
    
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: expect.objectContaining({
        name: profileData.name,
        bio: profileData.bio,
        image: profileData.image,
        updatedAt: expect.any(Date),
      }),
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
      },
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

    // Create a mock user with the required properties
    const mockUser: MockUser = {
      id: 'user-123',
      email: 'user@example.com',
      name: 'Updated Name',
      bio: null,
      image: null,
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

    // Mock authenticated session
    vi.mocked(authUtils.getSessionFromReq).mockResolvedValueOnce({
      user: { id: 'user-123', email: 'user@example.com' },
      expires: new Date().toISOString(),
    });

    // Only mock the selected fields that the handler returns
    const selectedUserData: UserSelect = {
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      bio: mockUser.bio,
      image: mockUser.image,
    };

    // Mock the database update to return only the selected fields
    vi.mocked(db.user.update).mockResolvedValueOnce(selectedUserData as any);

    await updateProfileHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    // Parse the response data to compare
    const responseData = JSON.parse(res._getData());
    expect(responseData.message).toBe('Profile updated successfully');
    expect(responseData.user).toEqual(selectedUserData);
    
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: expect.objectContaining({
        name: partialProfileData.name,
        bio: null,
        image: null,
        updatedAt: expect.any(Date),
      }),
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
      },
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
    vi.mocked(authUtils.getSessionFromReq).mockResolvedValueOnce({
      user: { id: 'user-123', email: 'user@example.com' },
      expires: new Date().toISOString(),
    });

    vi.mocked(db.user.update).mockRejectedValueOnce(
      new Error('Database error')
    );

    await updateProfileHandler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Internal server error',
    });
  });
}); 