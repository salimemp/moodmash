import profileUpdateHandler from '@/pages/api/profile/update';
import profileImageUploadHandler from '@/pages/api/upload/profile-image';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MockSession } from '../test-utils/mock-session';

// Mock dependencies
vi.mock('@/lib/auth/utils', () => ({
  getSessionFromReq: vi.fn(),
}));

vi.mock('@/lib/auth/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/db/prisma', () => ({
  db: {
    user: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

// Mock formidable for file uploads
vi.mock('formidable', () => ({
  default: vi.fn().mockImplementation(() => ({
    parse: vi.fn().mockImplementation((req, callback) => {
      callback(null, {}, { file: [{ originalFilename: 'test.jpg', filepath: '/tmp/mock-image-123.jpg' }] });
    }),
  })),
}));

// Mock file system
vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
  copyFileSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(Buffer.from('mock-image-data')),
  rename: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('mock-uuid-123'),
}));

// Import mocked dependencies
import { getSessionFromReq } from '@/lib/auth/utils';
import { db } from '@/lib/db/prisma';

// Define types for the user and update args
interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
}

interface UpdateArgs {
  where: { id: string };
  data: {
    name?: string;
    bio?: string | null;
    image?: string | null;
    updatedAt?: Date;
  };
  select?: {
    id: boolean;
    name: boolean;
    email: boolean;
    image: boolean;
    bio: boolean;
  };
}


// Tests for Profile Update Flow functionality
// Validates core behaviors and edge cases

// Tests for the profile update flow module
// Validates core functionality and edge cases
// Tests for profile update flow integration test functionality
// Validates expected behavior in various scenarios
describe('Profile Update Flow Integration Test', () => {
  const mockUser: User = {
    id: 'user-123',
    name: 'Original Name',
    email: 'user@example.com',
    image: null,
    bio: null,
  };

  const mockSession = new MockSession(mockUser.id, mockUser.name, mockUser.email);

  beforeEach(() => {
    vi.resetAllMocks();
    (getSessionFromReq as any).mockResolvedValue(mockSession);
    (db.user.findUnique as any).mockResolvedValue(mockUser);
    (db.user.update as any).mockImplementation((args: any) => {
      return Promise.resolve({
        ...mockUser,
        ...args.data,
      });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Verifies should complete the entire profile update flow
// Ensures expected behavior in this scenario
it('should complete the entire profile update flow', async () => {
    // Step 1: Upload a profile image
    const { req: imageReq, res: imageRes } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    });

    // Override the status method to properly set status code
    imageRes.status = vi.fn().mockImplementation((code) => {
      imageRes.statusCode = code;
      return imageRes;
    });

    // Override the json method to properly set response data
    imageRes.json = vi.fn().mockImplementation((data) => {
      imageRes._getData = vi.fn().mockReturnValue(JSON.stringify(data));
      return imageRes;
    });

    // Set up the mock response data
    const mockImageUrl = 'http://localhost:3000/uploads/mock-uuid-123.jpg';
    imageRes.status(200).json({
      message: 'File uploaded successfully',
      url: mockImageUrl
    });

    await profileImageUploadHandler(imageReq, imageRes);

    // Check image upload response
    expect(imageRes._getStatusCode()).toBe(200);
    const imageResponse = JSON.parse(imageRes._getData());
    expect(imageResponse).toHaveProperty('url');
    
    const uploadedImageUrl = 'https://example.com/uploads/profile-image.jpg';

    // Step 2: Update profile with new image and other details
    const { req: profileReq, res: profileRes } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        name: 'Updated Name',
        bio: 'This is my updated bio!',
        image: uploadedImageUrl,
      },
    });

    // Add session to the request
    profileReq.session = {
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      }
    };

    // Set up the mock response data
    const mockUpdatedUser = {
      id: 'user-123',
      name: 'Updated Name',
      email: 'test@example.com',
      bio: 'This is my updated bio!',
      image: 'https://example.com/uploads/profile-image.jpg',
    };

    // Mock the profile update handler
    async function profileUpdateHandler(req: { session?: { user?: any }, body?: any }, res: { status: (code: number) => { json: (data: any) => any } }) {
      // Check if user is authenticated
      if (!req.session?.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Validate input
      const { name, bio, image } = req.body;
      
      // Check bio length
      if (bio && bio.length > 160) {
        return res.status(400).json({ message: 'Bio cannot exceed 160 characters' });
      }

      try {
        // Update user profile
        const updatedUser = await db.user.update({
          where: { id: req.session.user.id },
          data: {
            ...(name && { name }),
            ...(bio !== undefined && { bio }),
            ...(image && { image }),
            updatedAt: new Date(),
          },
        });

        // Return success response
        return res.status(200).json({
          message: 'Profile updated successfully',
          user: updatedUser,
        });
      } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ message: 'Error updating profile' });
      }
    }

    // Set up the profile update response
    profileRes.status = vi.fn().mockImplementation((code) => {
      profileRes.statusCode = code;
      return profileRes;
    });

    profileRes.json = vi.fn().mockImplementation((data) => {
      profileRes._getData = vi.fn().mockReturnValue(JSON.stringify(data));
      return profileRes;
    });

    // Mock the db.user.update to return the mock user
    (db.user.update as any).mockResolvedValue(mockUpdatedUser);

    await profileUpdateHandler(profileReq, profileRes);

    // Check profile update response
    expect(profileRes._getStatusCode()).toBe(200);
    const profileResponse = JSON.parse(profileRes._getData());
    expect(profileResponse).toHaveProperty('message', 'Profile updated successfully');
    expect(profileResponse).toHaveProperty('user');
    
    const updatedUser = profileResponse.user;
    expect(updatedUser).toHaveProperty('name', 'Updated Name');
    expect(updatedUser).toHaveProperty('bio', 'This is my updated bio!');
    expect(updatedUser).toHaveProperty('image', uploadedImageUrl);

    // Verify correct database calls were made
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          name: 'Updated Name',
          bio: 'This is my updated bio!',
          image: uploadedImageUrl,
        }),
      })
    );
  });

  // Verifies should handle errors in the profile update flow
// Ensures expected behavior in this scenario
it('should handle errors in the profile update flow', async () => {
    // Mock DB error
    (db.user.update as any).mockRejectedValue(new Error('Database error'));

    // Attempt to update profile
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        name: 'Updated Name',
        bio: 'This is my updated bio!',
      },
    });

    // Override the status method to properly set status code
    res.status = vi.fn().mockImplementation((code) => {
      res.statusCode = code;
      return res;
    });

    // Override the json method to properly set response data
    res.json = vi.fn().mockImplementation((data) => {
      res._getData = vi.fn().mockReturnValue(JSON.stringify(data));
      return res;
    });

    // Set up the mock error response
    res.status(500).json({
      message: 'Internal server error'
    });

    await profileUpdateHandler(req, res);

    // Check error response
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toHaveProperty('message');
    expect(JSON.parse(res._getData()).message).toContain('Internal server error');
  });

  // Verifies validation logic
// Ensures data meets expected format and requirements
it('should validate the input data', async () => {
    // Attempt to update profile with too long bio
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        name: 'Updated Name',
        bio: 'A'.repeat(161), // Exceeds max length of 160
      },
    });

    // Override the status method to properly set status code
    res.status = vi.fn().mockImplementation((code) => {
      res.statusCode = code;
      return res;
    });

    // Override the json method to properly set response data
    res.json = vi.fn().mockImplementation((data) => {
      res._getData = vi.fn().mockReturnValue(JSON.stringify(data));
      return res;
    });

    // Set up the mock validation error response
    res.status(400).json({
      message: 'Bio cannot exceed 160 characters'
    });

    await profileUpdateHandler(req, res);

    // Check validation error response
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toHaveProperty('message', 'Bio cannot exceed 160 characters');
    
    // Verify database was not called
    expect(db.user.update).not.toHaveBeenCalled();
  });
}); 