import { createToken, generateOTP } from '@/lib/auth/token';
import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock crypto module
vi.mock('crypto', () => ({
  default: {
    randomBytes: vi.fn(),
    createHash: vi.fn(),
  },
}));

describe('Token Management Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup the crypto mock implementation
    const mockHash = {
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('hashed-token'),
    };
    
    (crypto.randomBytes as any).mockReturnValue({
      toString: vi.fn().mockReturnValue('random-bytes'),
    });
    
    (crypto.createHash as any).mockReturnValue(mockHash);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createToken', () => {
    it('should generate a token with the correct format', async () => {
      // Setup
      const userId = 'user-123';
      const tokenType = 'verification';
      const mockDate = new Date(2023, 0, 1, 12, 0, 0);
      vi.spyOn(Date, 'now').mockImplementation(() => mockDate.getTime());

      // Execute
      const token = await createToken(tokenType, userId);

      // Verify
      // 1. Should call randomBytes with 32
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      
      // 2. Should format the raw token correctly
      const rawToken = `${userId}:random-bytes:${mockDate.getTime()}:${tokenType}`;
      
      // 3. Should pass the raw token to the hash function
      const mockHash = crypto.createHash('sha256');
      expect(mockHash.update).toHaveBeenCalledWith(rawToken);
      expect(mockHash.digest).toHaveBeenCalledWith('hex');
      
      // 4. Should return the hashed token
      expect(token).toBe('hashed-token');
    });

    it('should accept different token types', async () => {
      // Test with each valid token type
      const userId = 'user-123';
      const tokenTypes: ('verification' | 'passwordReset' | 'mfa')[] = [
        'verification',
        'passwordReset',
        'mfa'
      ];

      for (const tokenType of tokenTypes) {
        // Execute
        await createToken(tokenType, userId);

        // Verify that the token type is included in the raw token
        const mockHash = crypto.createHash('sha256');
        const rawTokenParams = (mockHash.update as any).mock.calls[0][0].split(':');
        
        expect(rawTokenParams[0]).toBe(userId);
        expect(rawTokenParams[3]).toBe(tokenType);
        
        // Reset mocks for next iteration
        vi.clearAllMocks();
      }
    });
  });

  describe('generateOTP', () => {
    it('should generate a 6-digit OTP', async () => {
      // Mock Math.random to return a fixed value for testing
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.5);

      // Execute
      const otp = await generateOTP();

      // Verify
      expect(otp).toBe('550000'); // 100000 + (0.5 * 900000) = 550000
      expect(otp.length).toBe(6);
      expect(Number(otp)).toBeGreaterThanOrEqual(100000);
      expect(Number(otp)).toBeLessThanOrEqual(999999);

      // Restore the mock
      mockRandom.mockRestore();
    });

    it('should generate unique OTPs on multiple calls', async () => {
      // Mock Math.random to return different values
      const mockRandom = vi.spyOn(Math, 'random');
      mockRandom.mockReturnValueOnce(0.1);
      mockRandom.mockReturnValueOnce(0.5);
      mockRandom.mockReturnValueOnce(0.9);

      // Execute
      const otp1 = await generateOTP();
      const otp2 = await generateOTP();
      const otp3 = await generateOTP();

      // Verify
      expect(otp1).toBe('190000'); // 100000 + (0.1 * 900000) = 190000
      expect(otp2).toBe('550000'); // 100000 + (0.5 * 900000) = 550000
      expect(otp3).toBe('910000'); // 100000 + (0.9 * 900000) = 910000
      
      expect(otp1).not.toBe(otp2);
      expect(otp2).not.toBe(otp3);
      expect(otp1).not.toBe(otp3);

      // Restore the mock
      mockRandom.mockRestore();
    });
  });
}); 