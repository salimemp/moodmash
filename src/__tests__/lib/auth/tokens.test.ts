import {
    createEmailVerificationToken,
    createPasswordResetToken,
    verifyEmailToken,
    verifyPasswordResetToken
} from '@/lib/auth/tokens';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Token Functions', () => {
  beforeEach(() => {
    // Mock console.log to avoid cluttering test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('verifyPasswordResetToken', () => {
    it('should verify a valid password reset token', async () => {
      const result = await verifyPasswordResetToken('valid-token');
      expect(result).toEqual({ userId: 'user123' });
    });

    it('should return null for an invalid password reset token', async () => {
      const result = await verifyPasswordResetToken('invalid-token');
      expect(result).toBeNull();
    });

    it('should return null for an empty password reset token', async () => {
      const result = await verifyPasswordResetToken('');
      expect(result).toBeNull();
    });
  });

  describe('verifyEmailToken', () => {
    it('should verify a valid email token', async () => {
      const result = await verifyEmailToken('valid-token');
      expect(result).toEqual({ userId: 'user123' });
    });

    it('should return null for an invalid email token', async () => {
      const result = await verifyEmailToken('invalid-token');
      expect(result).toBeNull();
    });

    it('should return null for an empty email token', async () => {
      const result = await verifyEmailToken('');
      expect(result).toBeNull();
    });
  });

  describe('createPasswordResetToken', () => {
    it('should create a password reset token for a user', async () => {
      const userId = 'user123';
      const token = await createPasswordResetToken(userId);
      
      expect(token).toBe(`valid-token-for-${userId}`);
      // Verify that console.log was called with the user ID
      expect(console.log).toHaveBeenCalledWith(`Creating password reset token for user: ${userId}`);
    });
  });

  describe('createEmailVerificationToken', () => {
    it('should create an email verification token for a user', async () => {
      const userId = 'user123';
      const token = await createEmailVerificationToken(userId);
      
      expect(token).toBe(`valid-token-for-${userId}`);
      // Verify that console.log was called with the user ID
      expect(console.log).toHaveBeenCalledWith(`Creating email verification token for user: ${userId}`);
    });
  });
}); 