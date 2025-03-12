import crypto from 'crypto';

type TokenType = 'verification' | 'passwordReset' | 'mfa';

export async function createToken(type: TokenType, userId: string): Promise<string> {
  // Create a random token: userId + random bytes + timestamp + token type
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const timestamp = Date.now().toString();
  const rawToken = `${userId}:${randomBytes}:${timestamp}:${type}`;

  // Hash the token for security
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export async function generateOTP(): Promise<string> {
  // Generate a 6-digit OTP for MFA
  return Math.floor(100000 + Math.random() * 900000).toString();
}
