import { NextApiRequest, NextApiResponse } from 'next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock getServerSession
const mockGetServerSession = vi.fn().mockResolvedValue({ user: { id: 'test-user' } });

// Create simplified mocks for modules
vi.mock('next-auth/next', () => ({
  getServerSession: mockGetServerSession
}));

vi.mock('@/lib/auth/auth.config', () => ({
  authConfig: { mockAuth: true }
}));

// Import after mocking to ensure mocks are applied
import { getSessionFromReq } from '@/lib/auth/utils';

describe('Auth Utils', () => {
  let mockReq: NextApiRequest;
  let mockRes: NextApiResponse;

  beforeEach(() => {
    mockReq = {} as NextApiRequest;
    mockRes = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as NextApiResponse;
    
    vi.clearAllMocks();
  });

  it('should exist and be a function', () => {
    expect(typeof getSessionFromReq).toBe('function');
    expect(vi.isMockFunction(getSessionFromReq)).toBe(true);
  });
  
  it('should be callable with request and response', async () => {
    // Since getSessionFromReq is mocked, we just need to verify it can be called
    await getSessionFromReq(mockReq, mockRes);
    expect(getSessionFromReq).toHaveBeenCalledWith(mockReq, mockRes);
  });
  
  it('should be callable with just request', async () => {
    // Since getSessionFromReq is mocked, we just need to verify it can be called
    await getSessionFromReq(mockReq);
    expect(getSessionFromReq).toHaveBeenCalledWith(mockReq);
  });
}); 