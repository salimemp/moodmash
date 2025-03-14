import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authConfig } from './auth.config';

// This is a compatibility layer for API routes that used the auth(req, res) pattern
export async function getSessionFromReq(req: NextApiRequest, res?: NextApiResponse) {
  try {
    if (res) {
      return getServerSession(req, res, authConfig);
    }
    
    // For API routes that don't have a response object, we create a mock
    const mockRes = {} as NextApiResponse;
    return getServerSession(req, mockRes, authConfig);
  } catch (error) {
    // Re-throw the error for proper error handling in tests and application code
    throw error;
  }
}
