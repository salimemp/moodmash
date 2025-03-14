import { authConfig } from '@/lib/auth/auth.config';
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { vi } from 'vitest';

// Mock implementation of getSessionFromReq
export const getSessionFromReq = vi.fn().mockImplementation(async (req: NextApiRequest, res?: NextApiResponse) => {
  try {
    if (res) {
      return getServerSession(req, res, authConfig);
    }
    
    // For API routes that don't have a response object, we create a mock
    const mockRes = {} as NextApiResponse;
    return getServerSession(req, mockRes, authConfig);
  } catch (_error) {
    // Re-throw the error for proper error handling in tests and application code
    throw _error;
  }
}); 