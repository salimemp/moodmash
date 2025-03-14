/**
 * Rate limiting module
 * 
 * This module has been refactored into smaller, focused modules:
 * 
 * 1. rate-limit-config.ts - Configuration values for rate limits
 * 2. rate-limit-middleware.ts - Express/Next.js middleware for API routes
 * 3. rate-limit-client.ts - Client-side rate limiting utilities
 * 4. rate-limit-storage.ts - Storage adapters (Redis, in-memory)
 * 
 * This main file re-exports from these modules to maintain backward compatibility.
 */

// Re-export from rate-limit-config.ts
export type {
  RateLimitConfig, RateLimitType
} from './rate-limit-config';

export {
  generateIPRateLimitKey, generateRateLimitKey, rateLimits
} from './rate-limit-config';

// Re-export from rate-limit-storage.ts
export type {
  RateLimitStorage
} from './rate-limit-storage';

export {
  incrementFailedLoginAttempts, rateLimitStorage,
  resetRateLimit
} from './rate-limit-storage';

// Re-export from rate-limit-middleware.ts
export { rateLimit } from './rate-limit-middleware';

// Re-export from rate-limit-client.ts
export {
  throttle,
  withBackoff
} from './rate-limit-client';

