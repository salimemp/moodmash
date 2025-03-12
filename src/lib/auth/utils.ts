import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authConfig } from './auth.config';

// This is a compatibility layer for API routes that used the auth(req, res) pattern
// It adapts this to work with NextAuth.js v4
export async function getSessionFromReq(req: NextApiRequest, res: NextApiResponse) {
  return getServerSession(req, res, authConfig);
}
