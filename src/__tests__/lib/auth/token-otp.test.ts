import { describe, expect, it, vi } from 'vitest';

// Import only the function we're testing
// This keeps the test focused on the OTP generation functionality
import { generateOTP } from '@/lib/auth/token';

// Tests for One-Time Password generation utilities
// Validates secure and consistent OTP generation for authentication
describe('Token OTP Utilities', () => {
  // Tests for OTP generation function
  // Ensures OTPs are properly formatted and have expected properties
  describe('generateOTP', () => {
    beforeEach(() => {
      // Reset mocks before each test
      // This prevents test contamination between test cases
      vi.restoreAllMocks();
    });

    // Verifies basic OTP generation with expected format
    // Ensures OTPs are 6 digits and within the correct range
    it('should generate a 6-digit OTP', async () => {
      // Mock Math.random to return a predictable value
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      
      const otp = await generateOTP();
      
      // With Math.random = 0.5, the OTP should be 100000 + (0.5 * 900000) = 550000
      expect(otp).toBe('550000');
      
      // Verify it's a 6-digit number
      expect(otp.length).toBe(6);
      expect(Number(otp)).toBeGreaterThanOrEqual(100000);
      expect(Number(otp)).toBeLessThanOrEqual(999999);
    });
    
    // Verifies that different random values produce different OTPs
    // Ensures uniqueness of generated OTPs
    it('should generate different OTPs based on random values', async () => {
      // First call with Math.random = 0.1
      vi.spyOn(Math, 'random').mockReturnValue(0.1);
      const otp1 = await generateOTP();
      expect(otp1).toBe('190000');
      
      // Reset mock
      vi.restoreAllMocks();
      
      // Second call with Math.random = 0.9
      vi.spyOn(Math, 'random').mockReturnValue(0.9);
      const otp2 = await generateOTP();
      expect(otp2).toBe('910000');
      
      // Verify they're different
      expect(otp1).not.toBe(otp2);
    });
    
    // Verifies OTP generation at boundary conditions
    // Ensures OTPs are always at least 6 digits and within valid range
    it('should generate OTPs within the correct range', async () => {
      // Test minimum value (Math.random = 0)
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const minOtp = await generateOTP();
      expect(Number(minOtp)).toBe(100000);
      
      // Reset mock
      vi.restoreAllMocks();
      
      // Test maximum value (Math.random = 0.999...)
      vi.spyOn(Math, 'random').mockReturnValue(0.999999);
      const maxOtp = await generateOTP();
      expect(Number(maxOtp)).toBeCloseTo(999999, 0);
    });
  });
}); 