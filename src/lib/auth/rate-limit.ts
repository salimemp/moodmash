import { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = Redis.fromEnv();

// Configure rate limits
const RATE_LIMIT_WINDOW = 60 * 15; // 15 minutes in seconds
const MAX_LOGIN_ATTEMPTS = 5; // Max login attempts per window
const MAX_PASSWORD_RESET_ATTEMPTS = 3; // Max password reset attempts per window
const MAX_EMAIL_VERIFICATION_ATTEMPTS = 5; // Max email verification attempts per window
const MAX_MFA_ATTEMPTS = 5; // Max MFA attempts per window
const MAX_REQUESTS_PER_IP = 100; // General rate limit per IP

// Rate limit types and their configurations
const rateLimits = {
  login: {
    max: MAX_LOGIN_ATTEMPTS,
    window: RATE_LIMIT_WINDOW,
    message: 'Too many login attempts. Please try again later.',
  },
  passwordReset: {
    max: MAX_PASSWORD_RESET_ATTEMPTS,
    window: RATE_LIMIT_WINDOW,
    message: 'Too many password reset attempts. Please try again later.',
  },
  emailVerification: {
    max: MAX_EMAIL_VERIFICATION_ATTEMPTS,
    window: RATE_LIMIT_WINDOW,
    message: 'Too many email verification attempts. Please try again later.',
  },
  mfa: {
    max: MAX_MFA_ATTEMPTS,
    window: RATE_LIMIT_WINDOW,
    message: 'Too many MFA attempts. Please try again later.',
  },
  general: {
    max: MAX_REQUESTS_PER_IP,
    window: RATE_LIMIT_WINDOW,
    message: 'Too many requests. Please try again later.',
  },
};

type RateLimitType = keyof typeof rateLimits;

/**
 * Rate limiting middleware for API routes
 * Uses Redis to track request counts by IP and/or user identifier
 */
export async function rateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  type: RateLimitType = 'general',
  identifier?: string
): Promise<boolean> {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    
    // Use IP address as identifier if none provided
    const key = identifier 
      ? `ratelimit:${type}:${identifier}` 
      : `ratelimit:${type}:ip:${ip}`;
    
    const config = rateLimits[type];
    
    // Get current count
    const current = await redis.get<number>(key) || 0;
    
    if (current >= config.max) {
      // Rate limit exceeded
      res.setHeader('Retry-After', config.window);
      res.status(429).json({ message: config.message });
      return false;
    }
    
    // Increment count
    await redis.incr(key);
    
    // Set expiry if first request
    if (current === 0) {
      await redis.expire(key, config.window);
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', config.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.max - current - 1));
    
    return true;
  } catch (error) {
    console.error('Rate limit error:', error);
    // Allow the request if rate limiting fails
    return true;
  }
}

/**
 * Reset rate limit for a specific identifier
 */
export async function resetRateLimit(
  type: RateLimitType,
  identifier: string
): Promise<void> {
  try {
    const key = `ratelimit:${type}:${identifier}`;
    await redis.del(key);
  } catch (error) {
    console.error('Reset rate limit error:', error);
  }
}

/**
 * Increment failed attempt counter for login brute force protection
 */
export async function incrementFailedLoginAttempts(
  identifier: string
): Promise<number> {
  try {
    const key = `ratelimit:login:${identifier}`;
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW);
    }
    
    return current;
  } catch (error) {
    console.error('Increment failed login attempts error:', error);
    return 0;
  }
} 