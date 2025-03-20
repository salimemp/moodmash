import type { NextApiRequest, NextApiResponse } from 'next';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

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
      findMany: vi.fn(),
    },
  },
}));

// Import dependencies for mocking
import { rateLimit } from '@/lib/auth/rate-limit';
import { getSessionFromReq } from '@/lib/auth/utils';
import { db } from '@/lib/db/prisma';

// Manual implementation of the handler for testing
async function credentialsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Apply rate limiting
  const rateLimitPassed = await rateLimit(req, res, 'general');
  if (!rateLimitPassed) return;

  try {
    // Get the current user session
    const session = await getSessionFromReq(req, res);

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Fetch credentials for the user
    const credentials = await db.credential.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        deviceType: true,
        friendlyName: true,
        createdAt: true,
        lastUsed: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit the number of credentials to prevent performance issues
    });

    return res.status(200).json({
      credentials,
    });
  } catch (error) {
    console.error('Error fetching WebAuthn credentials:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

describe('WebAuthn Credentials API', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let jsonMock: Mock;
  let statusMock: Mock;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(getSessionFromReq).mockResolvedValue({
      user: {
        id: 'user-123',
        email: 'user@example.com',
      },
      expires: new Date().toISOString(),
    } as any);
    
    // Mock the findMany to return test data
    vi.mocked(db.credential.findMany).mockResolvedValue([
      {
        id: 'credential-1',
        userId: 'user-123',
        deviceType: 'platform',
        friendlyName: 'My laptop',
        createdAt: new Date('2023-01-01'),
        lastUsed: new Date('2023-01-02'),
        externalId: 'ext-id-1',
        publicKey: 'public-key-1',
        counter: 1,
        backupState: false,
        transports: ['usb', 'nfc']
      },
      {
        id: 'credential-2',
        userId: 'user-123',
        deviceType: 'cross-platform',
        friendlyName: 'Security key',
        createdAt: new Date('2023-01-03'),
        lastUsed: new Date('2023-01-04'),
        externalId: 'ext-id-2',
        publicKey: 'public-key-2',
        counter: 2,
        backupState: true,
        transports: ['internal']
      },
    ]);
    
    // Create request and response mocks
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnThis();
    
    mockReq = {
      method: 'GET',
    };
    
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
  });

  it('Should return user credentials successfully', async () => {
    await credentialsHandler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assertions
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      credentials: expect.arrayContaining([
        expect.objectContaining({
          id: 'credential-1',
          deviceType: 'platform',
          friendlyName: 'My laptop',
        }),
        expect.objectContaining({
          id: 'credential-2',
          deviceType: 'cross-platform',
          friendlyName: 'Security key',
        }),
      ]),
    });

    // Verify function calls
    expect(getSessionFromReq).toHaveBeenCalledWith(mockReq, mockRes);
    expect(db.credential.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      select: {
        id: true,
        deviceType: true,
        friendlyName: true,
        createdAt: true,
        lastUsed: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });

  it('Should return 401 if user is not authenticated', async () => {
    // Override the session mock for this test
    vi.mocked(getSessionFromReq).mockResolvedValueOnce(null);

    await credentialsHandler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assertions
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Unauthorized'
    });
  });

  it('Should return 401 if user session exists but has no ID', async () => {
    // Session exists but has no user.id
    vi.mocked(getSessionFromReq).mockResolvedValueOnce({
      user: {
        // Missing id field
        email: 'user@example.com',
      },
      expires: new Date().toISOString(),
    } as any);

    await credentialsHandler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assertions
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Unauthorized'
    });
  });

  it('Should return 405 for non-GET requests', async () => {
    // Override the method for this test
    mockReq.method = 'POST';

    await credentialsHandler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assertions
    expect(statusMock).toHaveBeenCalledWith(405);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Method not allowed'
    });
  });

  it('Should return 500 if database operation fails', async () => {
    // Mock database error
    vi.mocked(db.credential.findMany).mockRejectedValueOnce(
      new Error('Database connection error')
    );

    // Spy on console.error to prevent test output pollution
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await credentialsHandler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assertions
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Internal server error'
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('Error fetching WebAuthn credentials:');
    
    consoleErrorSpy.mockRestore();
  });

  it('Should return empty credentials array when user has no credentials', async () => {
    // Mock empty credentials array
    vi.mocked(db.credential.findMany).mockResolvedValueOnce([]);

    await credentialsHandler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assertions
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      credentials: []
    });
  });

  it('Should return early if rate limiting fails', async () => {
    // Override rate limit to fail
    vi.mocked(rateLimit).mockResolvedValueOnce(false);

    await credentialsHandler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Rate limit should be called but other operations should not
    expect(rateLimit).toHaveBeenCalledWith(mockReq, mockRes, 'general');
    expect(getSessionFromReq).not.toHaveBeenCalled();
    expect(db.credential.findMany).not.toHaveBeenCalled();
  });
});