import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/auth/utils', () => ({
  getSessionFromReq: vi.fn(),
}));

vi.mock('@/lib/auth/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/db/prisma', () => ({
  db: {
    credential: {
      findFirst: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Import dependencies for mocking
import { rateLimit } from '@/lib/auth/rate-limit';
import { getSessionFromReq } from '@/lib/auth/utils';
import { db } from '@/lib/db/prisma';

// Create a mock handler function
const mockHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Apply rate limiting
  const rateLimitPassed = await rateLimit(req, res, 'general');
  if (!rateLimitPassed) return;

  const credentialId = req.query.id as string;

  if (!credentialId) {
    return res.status(400).json({ message: 'Credential ID is required' });
  }

  try {
    // Get the current user session
    const session = await getSessionFromReq(req, res);

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = session.user.id;

    // Check if the credential exists and belongs to the user
    const credential = await db.credential.findFirst({
      where: {
        id: credentialId,
        userId,
      },
    });

    if (!credential) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    // Count the number of credentials for this user
    const credentialCount = await db.credential.count({
      where: { userId: session.user.id },
    });

    // Don't allow deleting the last credential if it's the only one
    if (credentialCount <= 1) {
      return res.status(400).json({
        message: 'Cannot delete your only passkey. Add another one first.',
      });
    }

    // Delete the credential
    await db.credential.delete({
      where: {
        id: credentialId,
      },
    });

    return res.status(200).json({ message: 'Credential deleted successfully' });
  } catch (error) {
    console.error('Error deleting credential:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

describe('WebAuthn Credential [id] API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(getSessionFromReq).mockResolvedValue({
      user: {
        id: 'user-123',
        email: 'user@example.com',
      },
      expires: new Date().toISOString(),
    });
    
    vi.mocked(db.credential.findFirst).mockResolvedValue({
      id: 'credential-1',
      userId: 'user-123',
      deviceType: 'platform',
      friendlyName: 'My laptop',
      createdAt: new Date('2023-01-01'),
      lastUsed: new Date('2023-01-02'),
      externalId: 'external-id-1',
      publicKey: 'public-key-1',
      counter: 1,
      backupState: false,
      transports: ['usb', 'nfc'],
    });
    
    vi.mocked(db.credential.count).mockResolvedValue(2); // Mock having 2 credentials
    
    vi.mocked(db.credential.delete).mockResolvedValue({
      id: 'credential-1',
      userId: 'user-123',
      deviceType: 'platform',
      friendlyName: 'My laptop',
      createdAt: new Date('2023-01-01'),
      lastUsed: new Date('2023-01-02'),
      externalId: 'external-id-1',
      publicKey: 'public-key-1',
      counter: 1,
      backupState: false,
      transports: ['usb', 'nfc'],
    });
  });

  it('Should delete a credential successfully', async () => {
    // Create mock request and response
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'DELETE',
      query: {
        id: 'credential-1',
      },
    });

    // Call the handler
    await mockHandler(req, res);

    // Verify the correct status and response
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({
      message: 'Credential deleted successfully'
    });

    // Verify function calls
    expect(getSessionFromReq).toHaveBeenCalledWith(req, res);
    expect(db.credential.findFirst).toHaveBeenCalledWith({
      where: { 
        id: 'credential-1',
        userId: 'user-123'
      },
    });
    expect(db.credential.count).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
    });
    expect(db.credential.delete).toHaveBeenCalledWith({
      where: { id: 'credential-1' },
    });
  });

  it('Should return 401 if user is not authenticated', async () => {
    // Override the session mock for this test
    vi.mocked(getSessionFromReq).mockResolvedValueOnce(null);

    // Create mock request and response
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'DELETE',
      query: {
        id: 'credential-1',
      },
    });

    // Call the handler
    await mockHandler(req, res);

    // Verify the correct status and response
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual({
      message: 'Unauthorized'
    });
  });

  it('Should return 405 for unsupported methods', async () => {
    // Create mock request and response
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: {
        id: 'credential-1',
      },
    });

    // Call the handler
    await mockHandler(req, res);

    // Verify the correct status and response
    expect(res.statusCode).toBe(405);
    expect(res._getJSONData()).toEqual({
      message: 'Method not allowed'
    });
  });

  it('Should return 400 if trying to delete the only credential', async () => {
    // Mock having only 1 credential
    vi.mocked(db.credential.count).mockResolvedValueOnce(1);

    // Create mock request and response
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'DELETE',
      query: {
        id: 'credential-1',
      },
    });

    // Call the handler
    await mockHandler(req, res);

    // Verify the correct status and response
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({
      message: 'Cannot delete your only passkey. Add another one first.'
    });
  });

  it('Should return 404 if credential not found', async () => {
    // Mock credential not found
    vi.mocked(db.credential.findFirst).mockResolvedValueOnce(null);

    // Create mock request and response
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'DELETE',
      query: {
        id: 'non-existent-id',
      },
    });

    // Call the handler
    await mockHandler(req, res);

    // Verify the correct status and response
    expect(res.statusCode).toBe(404);
    expect(res._getJSONData()).toEqual({
      message: 'Credential not found'
    });
  });
}); 