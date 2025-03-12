import { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Define rate limit types
type RateLimitType =
  | 'general'
  | 'auth'
  | 'mfa'
  | 'api'
  | 'login'
  | 'passwordReset'
  | 'emailVerification';

// Configure rate limits for different actions
const rateLimits: Record<RateLimitType, { max: number; window: number; message: string }> = {
  general: {
    max: 60,
    window: 60,
    message: 'Too many requests, please try again later.',
  },
  auth: {
    max: 10,
    window: 60,
    message: 'Too many authentication attempts, please try again later.',
  },
  mfa: {
    max: 5,
    window: 60,
    message: 'Too many MFA attempts, please try again later.',
  },
  api: {
    max: 60,
    window: 60,
    message: 'Rate limit exceeded, please try again later.',
  },
  login: {
    max: 5,
    window: 60 * 15, // 15 minutes
    message: 'Too many login attempts. Please try again later.',
  },
  passwordReset: {
    max: 3,
    window: 60 * 15, // 15 minutes
    message: 'Too many password reset attempts. Please try again later.',
  },
  emailVerification: {
    max: 5,
    window: 60 * 15, // 15 minutes
    message: 'Too many email verification attempts. Please try again later.',
  },
};

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
    const key = identifier ? `ratelimit:${type}:${identifier}` : `ratelimit:${type}:ip:${ip}`;

    const config = rateLimits[type];

    // Get current count
    const current = (await redis.get<number>(key)) || 0;

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
export async function resetRateLimit(type: RateLimitType, identifier: string): Promise<void> {
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
export async function incrementFailedLoginAttempts(identifier: string): Promise<number> {
  try {
    const key = `ratelimit:login:${identifier}`;
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, 60);
    }

    return current;
  } catch (error) {
    console.error('Increment failed login attempts error:', error);
    return 0;
  }
}
