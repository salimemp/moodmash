import { NextApiRequest, NextApiResponse } from 'next';
import { vi } from 'vitest';

// Define allowed rate limit types for type safety
type RateLimitType =
  | 'general'
  | 'auth'
  | 'mfa'
  | 'api'
  | 'login'
  | 'passwordReset'
  | 'emailVerification';

// Mock implementation of rateLimit
export const rateLimit = vi.fn().mockImplementation(
  async (_req: NextApiRequest, res: NextApiResponse, _type: RateLimitType = 'general', _identifier?: string): Promise<boolean> => {
    // Simulate rate limiting behavior based on the request IP
    // Unused variable commented out to fix warning
    // const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    
    // Set headers to simulate real behavior
    res.setHeader('X-RateLimit-Limit', '10');
    res.setHeader('X-RateLimit-Remaining', '5');
    
    // Return true for successful requests (not rate limited)
    // This can be controlled in tests by mocking the return value
    return true;
  }
);

// Mock implementation of resetRateLimit
export const resetRateLimit = vi.fn().mockImplementation(
  async (_type: RateLimitType, _identifier: string): Promise<void> => {
    // Mock implementation just resolves
    return Promise.resolve();
  }
);

// Mock implementation of incrementFailedLoginAttempts
export const incrementFailedLoginAttempts = vi.fn().mockImplementation(
  async (_identifier: string): Promise<number> => {
    // Return a mock counter value of 1 (first attempt)
    return 1;
  }
); 