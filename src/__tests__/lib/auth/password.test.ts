import { describe, expect, it, vi } from 'vitest';

// Mock bcryptjs for password hashing and comparison
// This allows us to test password functions without actual cryptography
vi.mock('bcryptjs', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

// Import after mocking to ensure mocks are applied
import { comparePasswords, hashPassword } from '@/lib/auth/password';
import { compare, hash } from 'bcryptjs';

// Tests for password utility functions
// Validates secure password hashing and comparison
describe('Password Utilities', () => {
  // Tests for password hashing functionality
  // Ensures passwords are securely hashed with proper error handling
  describe('hashPassword', () => {
    // Verifies successful password hashing
    // Ensures hashing uses correct salt rounds (12) and returns expected result
    it('should hash a password successfully', async () => {
      // Mock successful hashing
      (hash as any).mockResolvedValue('hashed-password-123');
      
      const result = await hashPassword('password123');
      
      expect(hash).toHaveBeenCalledWith('password123', 12);
      expect(result).toBe('hashed-password-123');
    });

    // Verifies error handling during password hashing
    // Ensures failures are caught and wrapped with meaningful error messages
    it('should throw an error when hashing fails', async () => {
      // Mock hash function to throw an error
      (hash as any).mockRejectedValue(new Error('Hashing failed'));
      
      await expect(hashPassword('password123')).rejects.toThrow('Error hashing password');
      expect(hash).toHaveBeenCalledWith('password123', 12);
    });
  });

  // Tests for password comparison functionality
  // Ensures secure password validation with proper error handling
  describe('comparePasswords', () => {
    // Verifies successful password matching
    // Confirms correct behavior when passwords match
    it('should return true when passwords match', async () => {
      // Mock successful comparison with matching passwords
      (compare as any).mockResolvedValue(true);
      
      const result = await comparePasswords('password123', 'hashed-password-123');
      
      expect(compare).toHaveBeenCalledWith('password123', 'hashed-password-123');
      expect(result).toBe(true);
    });

    // Verifies successful password non-matching
    // Confirms correct behavior when passwords don't match
    it('should return false when passwords do not match', async () => {
      // Mock successful comparison with non-matching passwords
      (compare as any).mockResolvedValue(false);
      
      const result = await comparePasswords('wrong-password', 'hashed-password-123');
      
      expect(compare).toHaveBeenCalledWith('wrong-password', 'hashed-password-123');
      expect(result).toBe(false);
    });

    // Verifies error handling during password comparison
    // Ensures failures are caught and wrapped with meaningful error messages
    it('should throw an error when comparison fails', async () => {
      // Mock compare function to throw an error
      (compare as any).mockRejectedValue(new Error('Comparison failed'));
      
      await expect(comparePasswords('password123', 'hashed-password-123')).rejects.toThrow('Error comparing passwords');
      expect(compare).toHaveBeenCalledWith('password123', 'hashed-password-123');
    });
  });
}); 