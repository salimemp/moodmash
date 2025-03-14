/**
 * Express/Next.js middleware for API routes rate limiting
 * 
 * This module provides middleware for rate limiting API endpoints
 * using Redis-based storage and configurable limits.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import {
    RateLimitType,
    generateIPRateLimitKey,
    generateRateLimitKey,
    rateLimits
} from './rate-limit-config';
import { rateLimitStorage } from './rate-limit-storage';

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
      ? generateRateLimitKey(type, identifier) 
      : generateIPRateLimitKey(type, ip as string);

    const config = rateLimits[type];

    // Get current count
    const current = await rateLimitStorage.get(key);

    if (current >= config.max) {
      // Rate limit exceeded
      res.setHeader('Retry-After', config.window);
      res.status(429).json({ message: config.message });
      return false;
    }

    // Increment count
    const newCount = await rateLimitStorage.increment(key);

    // Set expiry if first request
    if (current === 0) {
      await rateLimitStorage.expire(key, config.window);
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', config.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.max - newCount));

    return true;
  } catch (error) {
    console.error('Rate limit error:', error);
    // Allow the request if rate limiting fails
    return true;
  }
} 