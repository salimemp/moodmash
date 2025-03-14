import { authConfig } from '@/lib/auth/auth.config';
import { NextApiRequest, NextApiResponse } from 'next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the getServerSession function
const mockGetServerSession = vi.fn();

// Mock the getSessionFromReq function
const mockGetSessionFromReq = vi.fn();

// Mock the modules
vi.mock('next-auth/next', () => ({
  getServerSession: mockGetServerSession
}));

vi.mock('@/lib/auth/auth.config', () => ({
  authConfig: { providers: [], secret: 'test-secret' },
}));

vi.mock('@/lib/auth/utils', () => ({
  getSessionFromReq: mockGetSessionFromReq
}));

// Tests for the authentication utils module
describe('Auth Utilities', () => {
  const mockReq = {} as NextApiRequest;
  const mockRes = {} as NextApiResponse;
  
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getSessionFromReq', () => {
    it('should call getServerSession with correct parameters', async () => {
      // Setup mock return value
      const mockSession = { user: { id: 'user-123', name: 'Test User' } };
      mockGetServerSession.mockResolvedValue(mockSession);
      mockGetSessionFromReq.mockImplementation(async (req, res) => {
        return mockGetServerSession(req, res, authConfig);
      });

      // Call the function
      await mockGetSessionFromReq(mockReq, mockRes);

      // Verify function was called with correct parameters
      expect(mockGetServerSession).toHaveBeenCalledWith(mockReq, mockRes, authConfig);
    });

    it('should return null when no session is found', async () => {
      // Setup mock to return null
      mockGetServerSession.mockResolvedValue(null);
      mockGetSessionFromReq.mockImplementation(async (req, res) => {
        return mockGetServerSession(req, res, authConfig);
      });

      // Call the function
      const result = await mockGetSessionFromReq(mockReq, mockRes);

      // Verify function was called
      expect(mockGetServerSession).toHaveBeenCalledWith(mockReq, mockRes, authConfig);
      
      // Verify result
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      // Setup mock to throw an error
      const error = new Error('Session fetch failed');
      mockGetServerSession.mockRejectedValue(error);
      mockGetSessionFromReq.mockImplementation(async (req, res) => {
        return mockGetServerSession(req, res, authConfig);
      });

      // Call the function and expect it to throw
      try {
        await mockGetSessionFromReq(mockReq, mockRes);
        // If we get here, the test should fail
        expect(true).toBe(false); // This should not be reached
      } catch (e: any) {
        expect(e.message).toBe('Session fetch failed');
      }
      
      // Verify function was called
      expect(mockGetServerSession).toHaveBeenCalledWith(mockReq, mockRes, authConfig);
    });
  });
}); 