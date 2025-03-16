import { comparePasswords, hashPassword } from '@/lib/auth/password';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock bcryptjs directly
vi.mock('bcryptjs', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

// Import mocked functions after mock setup
import { compare, hash } from 'bcryptjs';

describe('Password Management Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password with bcrypt using the correct salt rounds', async () => {
      // Setup
      const plainPassword = 'secure-password-123';
      const hashedPassword = 'hashed-password-result';
      (hash as any).mockResolvedValue(hashedPassword);

      // Execute
      const result = await hashPassword(plainPassword);

      // Verify
      expect(hash).toHaveBeenCalledWith(plainPassword, 12); // 12 is the default salt rounds
      expect(result).toBe(hashedPassword);
    });

    it('should throw an error if bcrypt hash fails', async () => {
      // Setup
      const plainPassword = 'secure-password-123';
      const errorMessage = 'Bcrypt hash error';
      (hash as any).mockRejectedValue(new Error(errorMessage));

      // Execute & Verify
      await expect(hashPassword(plainPassword)).rejects.toThrow('Error hashing password');
    });
  });

  describe('comparePasswords', () => {
    it('should compare plain password with hashed password using bcrypt', async () => {
      // Setup
      const plainPassword = 'secure-password-123';
      const hashedPassword = 'hashed-password-result';
      (compare as any).mockResolvedValue(true);

      // Execute
      const result = await comparePasswords(plainPassword, hashedPassword);

      // Verify
      expect(compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false if passwords do not match', async () => {
      // Setup
      const plainPassword = 'wrong-password';
      const hashedPassword = 'hashed-password-result';
      (compare as any).mockResolvedValue(false);

      // Execute
      const result = await comparePasswords(plainPassword, hashedPassword);

      // Verify
      expect(compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result).toBe(false);
    });

    it('should throw an error if bcrypt compare fails', async () => {
      // Setup
      const plainPassword = 'secure-password-123';
      const hashedPassword = 'hashed-password-result';
      const errorMessage = 'Bcrypt compare error';
      (compare as any).mockRejectedValue(new Error(errorMessage));

      // Execute & Verify
      await expect(comparePasswords(plainPassword, hashedPassword)).rejects.toThrow('Error comparing passwords');
    });
  });
}); 