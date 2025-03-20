import { createToken, generateOTP } from '@/lib/auth/token';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock crypto module
vi.mock('crypto', () => {
  return {
    __esModule: true,
    default: {
      randomBytes: vi.fn(),
      createHash: vi.fn()
    }
  };
});

// Import crypto after mocking
import crypto from 'crypto';

describe('Token Module', () => {
  let mockHash: any;
  let mockRandomBytesResult: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mocks
    mockHash = {
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('hashed-token'),
    };
    
    mockRandomBytesResult = {
      toString: vi.fn().mockReturnValue('random-bytes'),
    };
    
    (crypto.randomBytes as any).mockReturnValue(mockRandomBytesResult);
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
      const dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => mockDate.getTime());

      // Execute
      const token = await createToken(tokenType, userId);

      // Verify
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(mockRandomBytesResult.toString).toHaveBeenCalledWith('hex');
      
      const expectedRawToken = `${userId}:random-bytes:${mockDate.getTime()}:${tokenType}`;
      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
      expect(mockHash.update).toHaveBeenCalledWith(expectedRawToken);
      expect(mockHash.digest).toHaveBeenCalledWith('hex');
      
      expect(token).toBe('hashed-token');
      
      // Cleanup
      dateSpy.mockRestore();
    });

    it('should accept different token types', async () => {
      const userId = 'user-123';
      const tokenTypes: ('verification' | 'passwordReset' | 'mfa')[] = [
        'verification',
        'passwordReset',
        'mfa'
      ];

      for (const tokenType of tokenTypes) {
        // Reset mocks for each iteration
        vi.clearAllMocks();
        
        // Setup mocks again for each iteration
        mockRandomBytesResult = {
          toString: vi.fn().mockReturnValue('random-bytes'),
        };
        (crypto.randomBytes as any).mockReturnValue(mockRandomBytesResult);
        (crypto.createHash as any).mockReturnValue(mockHash);
        
        // Execute
        await createToken(tokenType, userId);

        // Verify token type is included in the raw token
        const rawTokenArg = mockHash.update.mock.calls[0][0];
        const tokenParts = rawTokenArg.split(':');
        
        expect(tokenParts[0]).toBe(userId);
        expect(tokenParts[3]).toBe(tokenType);
      }
    });
  });

  describe('generateOTP', () => {
    let randomSpy: any;

    beforeEach(() => {
      randomSpy = vi.spyOn(Math, 'random');
    });

    afterEach(() => {
      if (randomSpy) {
        randomSpy.mockRestore();
      }
    });

    it('should generate a 6-digit OTP', async () => {
      // Mock Math.random to return a fixed value
      randomSpy.mockReturnValue(0.5);

      const otp = await generateOTP();

      // 100000 + (0.5 * 900000) = 550000
      expect(otp).toBe('550000');
      expect(otp.length).toBe(6);
      expect(Number(otp)).toBeGreaterThanOrEqual(100000);
      expect(Number(otp)).toBeLessThanOrEqual(999999);
    });

    it('should generate unique OTPs on multiple calls', async () => {
      // Mock Math.random to return different values
      randomSpy.mockReturnValueOnce(0.1)
              .mockReturnValueOnce(0.5)
              .mockReturnValueOnce(0.9);

      const otp1 = await generateOTP();
      const otp2 = await generateOTP();
      const otp3 = await generateOTP();

      // 100000 + (0.1 * 900000) = 190000
      expect(otp1).toBe('190000');
      // 100000 + (0.5 * 900000) = 550000
      expect(otp2).toBe('550000');
      // 100000 + (0.9 * 900000) = 910000
      expect(otp3).toBe('910000');
      
      expect(otp1).not.toBe(otp2);
      expect(otp2).not.toBe(otp3);
      expect(otp1).not.toBe(otp3);
    });

    it('should handle minimum value case', async () => {
      randomSpy.mockReturnValue(0);
      
      const otp = await generateOTP();
      
      expect(otp).toBe('100000');
      expect(otp.length).toBe(6);
    });

    it('should handle maximum value case', async () => {
      randomSpy.mockReturnValue(0.999999);
      
      const otp = await generateOTP();
      
      // 100000 + (0.999999 * 900000) ≈ 999999
      expect(Number(otp)).toBeCloseTo(999999, 0);
      expect(otp.length).toBe(6);
    });
  });
}); 