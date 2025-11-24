/**
 * Caching Service for Production Optimization
 * Version: 10.0 (Phase 3)
 * 
 * Features:
 * - In-memory caching with TTL
 * - Cache invalidation strategies
 * - Cache hit/miss tracking
 * - Response caching
 */

export interface CacheEntry {
  data: any;
  expires_at: number;
  created_at: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hit_rate: number;
  total_entries: number;
}

// Simple in-memory cache (per Worker instance)
const cache = new Map<string, CacheEntry>();
let cacheHits = 0;
let cacheMisses = 0;

/**
 * Get value from cache
 */
export function get<T>(key: string): T | null {
  const entry = cache.get(key);

  if (!entry) {
    cacheMisses++;
    return null;
  }

  // Check if expired
  if (Date.now() > entry.expires_at) {
    cache.delete(key);
    cacheMisses++;
    return null;
  }

  cacheHits++;
  return entry.data as T;
}

/**
 * Set value in cache with TTL (in seconds)
 */
export function set(key: string, data: any, ttl: number = 300): void {
  const now = Date.now();
  cache.set(key, {
    data,
    expires_at: now + ttl * 1000,
    created_at: now,
  });
}

/**
 * Delete specific cache entry
 */
export function del(key: string): void {
  cache.delete(key);
}

/**
 * Delete cache entries matching pattern
 */
export function delPattern(pattern: string): void {
  const regex = new RegExp(pattern);
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear all cache
 */
export function clear(): void {
  cache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}

/**
 * Get cache statistics
 */
export function getStats(): CacheStats {
  const total = cacheHits + cacheMisses;
  return {
    hits: cacheHits,
    misses: cacheMisses,
    hit_rate: total > 0 ? (cacheHits / total) * 100 : 0,
    total_entries: cache.size,
  };
}

/**
 * Clean expired entries
 */
export function cleanExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expires_at) {
      cache.delete(key);
    }
  }
}

/**
 * Cache key builders for common patterns
 */
export const CacheKeys = {
  moodStats: (userId: number) => `mood:stats:${userId}`,
  userMoods: (userId: number, limit?: number) => `mood:list:${userId}:${limit || 'all'}`,
  healthMetrics: (userId: number) => `health:metrics:${userId}`,
  socialFeed: (userId: number, limit?: number) => `social:feed:${userId}:${limit || 10}`,
  groupDetails: (groupId: number) => `group:details:${groupId}`,
  groupMembers: (groupId: number) => `group:members:${groupId}`,
  moodSync: (groupId: number) => `group:sync:${groupId}`,
  userFriends: (userId: number) => `social:friends:${userId}`,
  sharedMoods: (userId: number) => `social:shares:${userId}`,
  complianceStatus: () => 'hipaa:status',
  securityDashboard: () => 'security:dashboard',
  performanceDashboard: () => 'performance:dashboard',
};

/**
 * Cache invalidation strategies
 */
export const CacheInvalidation = {
  // Invalidate user-specific mood caches
  onMoodChange: (userId: number) => {
    delPattern(`mood:(stats|list):${userId}`);
    delPattern(`social:(feed|shares):${userId}`);
  },

  // Invalidate health metrics cache
  onHealthMetricsChange: (userId: number) => {
    delPattern(`health:metrics:${userId}`);
  },

  // Invalidate group caches
  onGroupChange: (groupId: number) => {
    delPattern(`group:(details|members|sync):${groupId}`);
  },

  // Invalidate social caches
  onSocialChange: (userId: number) => {
    delPattern(`social:(feed|friends|shares):${userId}`);
  },

  // Invalidate compliance caches
  onComplianceChange: () => {
    del(CacheKeys.complianceStatus());
    del(CacheKeys.securityDashboard());
  },
};

/**
 * TTL configurations (in seconds)
 */
export const CacheTTL = {
  SHORT: 60, // 1 minute - frequently changing data
  MEDIUM: 300, // 5 minutes - moderate updates
  LONG: 900, // 15 minutes - stable data
  VERY_LONG: 3600, // 1 hour - rarely changing
};

/**
 * Middleware to add cache headers
 */
export function getCacheHeaders(ttl: number): Record<string, string> {
  return {
    'Cache-Control': `public, max-age=${ttl}`,
    'CDN-Cache-Control': `public, max-age=${ttl}`,
    'Cloudflare-CDN-Cache-Control': `public, max-age=${ttl}`,
  };
}

/**
 * Middleware for no-cache
 */
export function getNoCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}
