import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextAuthOptions } from 'next-auth';
import { vi } from 'vitest';

// Mock implementation of getServerSession
export const getServerSession = vi.fn().mockImplementation(
  async (_req: NextApiRequest, _res: NextApiResponse, _options: NextAuthOptions) => {
    // Return a mock session
    return {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
      user: { id: 'mock-user-id', name: 'Mock User', email: 'mock@example.com' }
    };
  }
); 