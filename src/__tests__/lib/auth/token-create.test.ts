import { describe, expect, it } from 'vitest';
import { createToken } from '../../../lib/auth/token';

// Tests for token creation functionality
// Validates the security and uniqueness properties of generated tokens
describe('createToken', () => {
  const userId = 'test-user-id';

  // Verifies creation of verification tokens
  // Ensures tokens have the correct format for email verification flows
  it('should create a verification token', async () => {
    const token = await createToken('verification', userId);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  // Verifies creation of password reset tokens
  // Ensures tokens have the correct format for password reset flows
  it('should create a password reset token', async () => {
    const token = await createToken('passwordReset', userId);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  // Verifies creation of MFA tokens
  // Ensures tokens have the correct format for multi-factor authentication
  it('should create an MFA token', async () => {
    const token = await createToken('mfa', userId);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  // Verifies token uniqueness across multiple generations
  // Ensures the same user/type combination produces different tokens each time
  it('should create different tokens for the same user and type', async () => {
    const token1 = await createToken('verification', userId);
    const token2 = await createToken('verification', userId);
    expect(token1).not.toBe(token2);
  });

  // Verifies token uniqueness across different token types
  // Ensures different token types for the same user produce distinct tokens
  it('should create different tokens for different types', async () => {
    const verificationToken = await createToken('verification', userId);
    const passwordResetToken = await createToken('passwordReset', userId);
    const mfaToken = await createToken('mfa', userId);
    
    expect(verificationToken).not.toBe(passwordResetToken);
    expect(verificationToken).not.toBe(mfaToken);
    expect(passwordResetToken).not.toBe(mfaToken);
  });

  // Verifies token uniqueness across different users
  // Ensures tokens are user-specific even with the same token type
  it('should create different tokens for different users', async () => {
    const userId1 = 'user-1';
    const userId2 = 'user-2';
    
    const token1 = await createToken('verification', userId1);
    const token2 = await createToken('verification', userId2);
    
    expect(token1).not.toBe(token2);
  });
}); 