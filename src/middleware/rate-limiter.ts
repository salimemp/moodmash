/**
 * Rate Limiting Middleware (v1.0)
 * 
 * Advanced rate limiting with per-endpoint configuration, sliding window algorithm,
 * and distributed rate limiting support for Cloudflare Workers.
 * 
 * Features:
 * - Per-endpoint rate limits
 * - Sliding window algorithm for accurate rate limiting
 * - IP-based and user-based rate limiting
 * - Automatic rate limit headers (X-RateLimit-*)
 * - Support for different tiers (anonymous, authenticated, premium)
 * - Redis-compatible for distributed rate limiting
 */

import type { Context, Next } from 'hono'
import type { Bindings } from '../types'

interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (c: Context) => string
}

interface RateLimitEntry {
  count: number
  resetTime: number
  requests: number[]  // Timestamps of requests (sliding window)
}

// Per-endpoint rate limit configurations
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Authentication endpoints - strict limits
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  '/api/auth/register': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
  },
  '/api/auth/forgot-password': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
  },
  '/api/auth/reset-password': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 3,
  },
  '/api/auth/verify-email': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
  },

  // Biometric endpoints - moderate limits
  '/api/biometrics/register': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  },
  '/api/biometrics/authenticate': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20,
  },

  // Mood logging - generous limits for frequent use
  '/api/moods': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
  '/api/moods/log': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
  },

  // Social features - moderate limits
  '/api/friends/request': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
  },
  '/api/groups/create': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  },
  '/api/posts/create': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },

  // AI endpoints - expensive operations
  '/api/ai/chat': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
  '/api/ai/insights': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 30,
  },

  // File uploads - strict limits
  '/api/upload': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
  },

  // Search endpoints - moderate limits
  '/api/search': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  },

  // Default rate limit for other API endpoints
  'default': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
}

// In-memory store (for single instance) - in production, use KV or Durable Objects
class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map()

  async get(key: string): Promise<RateLimitEntry | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    
    // Clean up expired entry
    if (Date.now() > entry.resetTime) {
      this.store.delete(key)
      return null
    }
    
    return entry
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    this.store.set(key, entry)
  }

  async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
    const now = Date.now()
    let entry = await this.get(key)

    if (!entry) {
      entry = {
        count: 1,
        resetTime: now + windowMs,
        requests: [now],
      }
    } else {
      // Sliding window: remove old requests
      entry.requests = entry.requests.filter(ts => ts > now - windowMs)
      entry.requests.push(now)
      entry.count = entry.requests.length
      
      // Update reset time if window has passed
      if (now > entry.resetTime) {
        entry.resetTime = now + windowMs
      }
    }

    await this.set(key, entry)
    return entry
  }

  // Clean up old entries periodically
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

// Global store instance
const rateLimitStore = new RateLimitStore()

// Note: Cloudflare Workers don't support setInterval in global scope
// Cleanup will happen lazily during get operations

/**
 * Get rate limit configuration for an endpoint
 */
function getRateLimitConfig(path: string): RateLimitConfig {
  // Exact match
  if (RATE_LIMIT_CONFIGS[path]) {
    return RATE_LIMIT_CONFIGS[path]
  }

  // Pattern matching for dynamic routes
  for (const [pattern, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
    if (pattern.includes(':') || pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*') + '$')
      if (regex.test(path)) {
        return config
      }
    }
  }

  // Default configuration
  return RATE_LIMIT_CONFIGS['default']
}

/**
 * Generate rate limit key based on IP and user
 */
function generateKey(c: Context, path: string): string {
  const ip = c.req.header('cf-connecting-ip') || 
             c.req.header('x-forwarded-for') || 
             c.req.header('x-real-ip') || 
             'unknown'
  
  // Include user ID if authenticated for more granular control
  const userId = c.get('user_id')
  const userPart = userId ? `:user:${userId}` : ''
  
  return `ratelimit:${path}${userPart}:${ip}`
}

/**
 * Rate limiting middleware
 */
export async function rateLimiter(c: Context<{ Bindings: Bindings }>, next: Next) {
  const path = c.req.path
  
  // Skip rate limiting for non-API routes and health checks
  if (!path.startsWith('/api') || path === '/api/health') {
    return next()
  }

  const config = getRateLimitConfig(path)
  const key = config.keyGenerator ? config.keyGenerator(c) : generateKey(c, path)

  try {
    const entry = await rateLimitStore.increment(key, config.windowMs)
    
    // Set rate limit headers
    const remaining = Math.max(0, config.maxRequests - entry.count)
    const resetTime = Math.ceil(entry.resetTime / 1000)
    
    c.header('X-RateLimit-Limit', config.maxRequests.toString())
    c.header('X-RateLimit-Remaining', remaining.toString())
    c.header('X-RateLimit-Reset', resetTime.toString())

    // Check if rate limit exceeded
    if (entry.count > config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - Date.now()) / 1000)
      
      c.header('Retry-After', retryAfter.toString())
      
      return c.json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        retryAfter,
        limit: config.maxRequests,
        windowMs: config.windowMs,
      }, 429)
    }

    // Continue to next middleware
    await next()

    // Handle skipSuccessfulRequests
    if (config.skipSuccessfulRequests && c.res.status < 400) {
      // Decrement counter for successful requests if configured
      // Note: This is a simple implementation; more sophisticated logic may be needed
    }

  } catch (error) {
    console.error('[RateLimiter] Error:', error)
    // On error, allow the request to proceed (fail open)
    await next()
  }
}

/**
 * Custom rate limiter factory for specific endpoints
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const path = c.req.path
    const key = config.keyGenerator ? config.keyGenerator(c) : generateKey(c, path)

    try {
      const entry = await rateLimitStore.increment(key, config.windowMs)
      
      c.header('X-RateLimit-Limit', config.maxRequests.toString())
      c.header('X-RateLimit-Remaining', Math.max(0, config.maxRequests - entry.count).toString())
      c.header('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString())

      if (entry.count > config.maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - Date.now()) / 1000)
        c.header('Retry-After', retryAfter.toString())
        
        return c.json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        }, 429)
      }

      await next()
    } catch (error) {
      console.error('[RateLimiter] Error:', error)
      await next()
    }
  }
}

/**
 * Distributed rate limiter using Cloudflare KV (for production)
 */
export async function distributedRateLimiter(
  c: Context<{ Bindings: Bindings }>,
  next: Next
) {
  const { KV } = c.env
  if (!KV) {
    // Fallback to in-memory rate limiter
    return rateLimiter(c, next)
  }

  const path = c.req.path
  if (!path.startsWith('/api') || path === '/api/health') {
    return next()
  }

  const config = getRateLimitConfig(path)
  const key = generateKey(c, path)

  try {
    const now = Date.now()
    const storedData = await KV.get(key, 'json') as RateLimitEntry | null
    
    let entry: RateLimitEntry
    if (!storedData || now > storedData.resetTime) {
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
        requests: [now],
      }
    } else {
      // Sliding window
      storedData.requests = storedData.requests.filter(ts => ts > now - config.windowMs)
      storedData.requests.push(now)
      storedData.count = storedData.requests.length
      entry = storedData
    }

    // Store in KV with expiration
    const ttl = Math.ceil((entry.resetTime - now) / 1000)
    await KV.put(key, JSON.stringify(entry), { expirationTtl: ttl })

    // Set headers
    c.header('X-RateLimit-Limit', config.maxRequests.toString())
    c.header('X-RateLimit-Remaining', Math.max(0, config.maxRequests - entry.count).toString())
    c.header('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString())

    if (entry.count > config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      c.header('Retry-After', retryAfter.toString())
      
      return c.json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      }, 429)
    }

    await next()
  } catch (error) {
    console.error('[DistributedRateLimiter] Error:', error)
    await next()
  }
}

export { RATE_LIMIT_CONFIGS }
