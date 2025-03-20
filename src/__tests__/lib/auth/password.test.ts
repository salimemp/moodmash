import { comparePasswords, hashPassword } from '@/lib/auth/password';
import * as bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

describe('Password Utils', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password with bcrypt', async () => {
      // Mock bcrypt.hash to return a known value
      (bcrypt.hash as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce('hashed_password');

      const password = 'password123';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBe('hashed_password');
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });

    it('should handle empty passwords', async () => {
      // Even with empty password, the function should still call bcrypt.hash
      (bcrypt.hash as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce('hashed_empty');

      const password = '';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBe('hashed_empty');
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });

    it('should propagate errors from bcrypt', async () => {
      const error = new Error('Hashing error');
      (bcrypt.hash as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

      const password = 'password123';
      
      await expect(hashPassword(password)).rejects.toThrow('Error hashing password');
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });
  });

  describe('comparePasswords', () => {
    it('should verify a correct password', async () => {
      // Mock bcrypt.compare to return true for a correct password
      (bcrypt.compare as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);

      const password = 'password123';
      const hashedPassword = 'hashed_password';
      const isValid = await comparePasswords(password, hashedPassword);

      expect(isValid).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should reject an incorrect password', async () => {
      // Mock bcrypt.compare to return false for an incorrect password
      (bcrypt.compare as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

      const password = 'wrong_password';
      const hashedPassword = 'hashed_password';
      const isValid = await comparePasswords(password, hashedPassword);

      expect(isValid).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should handle empty passwords and hashes', async () => {
      // Empty password should still go through bcrypt.compare
      (bcrypt.compare as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

      const password = '';
      const hashedPassword = 'hashed_password';
      const isValid = await comparePasswords(password, hashedPassword);

      expect(isValid).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);

      // Reset mock
      vi.resetAllMocks();

      // Empty hash should still go through bcrypt.compare
      (bcrypt.compare as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

      const password2 = 'password123';
      const hashedPassword2 = '';
      const isValid2 = await comparePasswords(password2, hashedPassword2);

      expect(isValid2).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password2, hashedPassword2);
    });

    it('should propagate errors from bcrypt', async () => {
      const error = new Error('Comparison error');
      (bcrypt.compare as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

      const password = 'password123';
      const hashedPassword = 'hashed_password';
      
      await expect(comparePasswords(password, hashedPassword)).rejects.toThrow('Error comparing passwords');
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });
  });
}); 