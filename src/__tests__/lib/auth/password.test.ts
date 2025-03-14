import { comparePasswords, hashPassword } from '@/lib/auth/password';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock bcryptjs without importing it directly
vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockImplementation(() => Promise.resolve('hashed_password')),
  compare: vi.fn().mockImplementation(() => Promise.resolve(true))
}));

// Import bcryptjs after mocking
import * as bcryptjs from 'bcryptjs';

describe('Password Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password correctly', async () => {
      // Mock implementation for this test
      (bcryptjs.hash as any).mockResolvedValueOnce('hashed_password');
      
      const password = 'test_password';
      const result = await hashPassword(password);
      
      expect(result).toBe('hashed_password');
      expect(bcryptjs.hash).toHaveBeenCalledWith(password, 12);
    });

    it('should throw an error if hashing fails', async () => {
      // Mock implementation for this test
      (bcryptjs.hash as any).mockRejectedValueOnce(new Error('Hashing failed'));
      
      const password = 'test_password';
      
      await expect(hashPassword(password)).rejects.toThrow('Error hashing password');
    });
  });

  describe('comparePasswords', () => {
    it('should return true for matching passwords', async () => {
      // Mock implementation for this test
      (bcryptjs.compare as any).mockResolvedValueOnce(true);
      
      const plainPassword = 'test_password';
      const hashedPassword = 'hashed_password';
      
      const result = await comparePasswords(plainPassword, hashedPassword);
      
      expect(result).toBe(true);
      expect(bcryptjs.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
    });

    it('should return false for non-matching passwords', async () => {
      // Mock implementation for this test
      (bcryptjs.compare as any).mockResolvedValueOnce(false);
      
      const plainPassword = 'wrong_password';
      const hashedPassword = 'hashed_password';
      
      const result = await comparePasswords(plainPassword, hashedPassword);
      
      expect(result).toBe(false);
      expect(bcryptjs.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
    });

    it('should handle errors during comparison', async () => {
      // Mock implementation for this test
      (bcryptjs.compare as any).mockRejectedValueOnce(new Error('Comparison failed'));
      
      const plainPassword = 'test_password';
      const hashedPassword = 'hashed_password';
      
      await expect(comparePasswords(plainPassword, hashedPassword)).rejects.toThrow('Error comparing passwords');
    });
  });
}); 