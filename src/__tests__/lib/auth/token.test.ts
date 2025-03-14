import { generateOTP } from '@/lib/auth/token';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Auth Token Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('generateOTP', () => {
    it('should generate a 6-digit OTP', async () => {
      // Mock Math.random to return a predictable value
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      
      const otp = await generateOTP();
      
      // Verify it's a string with 6 digits
      expect(otp).toHaveLength(6);
      expect(otp).toMatch(/^\d{6}$/);
      
      // Verify the expected value based on our mocked Math.random
      // 100000 + (0.5 * 900000) = 100000 + 450000 = 550000
      expect(otp).toBe('550000');
    });
    
    it('should generate different OTPs for different random values', async () => {
      // Test with different random values
      const randomValues = [0, 0.25, 0.5, 0.75, 0.999];
      const expectedOTPs = ['100000', '325000', '550000', '775000', '999100'];
      
      for (let i = 0; i < randomValues.length; i++) {
        vi.spyOn(Math, 'random').mockReturnValue(randomValues[i]);
        
        const otp = await generateOTP();
        
        expect(otp).toBe(expectedOTPs[i]);
        
        vi.spyOn(Math, 'random').mockRestore();
      }
    });
  });
}); 