/**
 * API Response Caching Middleware (v1.0)
 * 
 * Advanced caching layer for API responses with:
 * - HTTP Cache-Control headers
 * - ETag support for conditional requests
 * - Stale-while-revalidate strategy
 * - Per-endpoint cache configuration
 * - Cache invalidation by pattern
 * - Cloudflare KV integration for distributed caching
 * 
 * Cache Strategies:
 * - no-cache: Always revalidate with server
 * - private: Cache only in browser
 * - public: Cache in browser and CDN
 * - stale-while-revalidate: Serve stale content while revalidating
 */

import type { Context, Next } from 'hono'
import type { Bindings } from '../types'

interface CacheConfig {
  ttl: number                    // Time to live in seconds
  strategy: 'no-cache' | 'private' | 'public' | 'stale-while-revalidate'
  staleWhileRevalidate?: number  // Additional time to serve stale content
  varyBy?: string[]              // Headers to vary cache by (e.g., ['Accept-Language', 'Authorization'])
  tags?: string[]                // Cache tags for invalidation
  skipCache?: (c: Context) => boolean  // Function to skip cache conditionally
}

// Per-endpoint cache configurations
const CACHE_CONFIGS: Record<string, CacheConfig> = {
  // Static data - long cache
  '/api/config': {
    ttl: 3600,          // 1 hour
    strategy: 'public',
    staleWhileRevalidate: 86400,  // 24 hours
    tags: ['config'],
  },
  
  '/api/features': {
    ttl: 1800,          // 30 minutes
    strategy: 'public',
    staleWhileRevalidate: 3600,
    tags: ['features'],
  },

  // Health check - short cache
  '/api/health': {
    ttl: 60,            // 1 minute
    strategy: 'public',
    tags: ['health'],
  },

  // User data - private cache
  '/api/auth/me': {
    ttl: 300,           // 5 minutes
    strategy: 'private',
    varyBy: ['Authorization'],
    tags: ['user', 'auth'],
    skipCache: (c) => !c.req.header('Authorization'),
  },

  '/api/profile': {
    ttl: 300,           // 5 minutes
    strategy: 'private',
    varyBy: ['Authorization'],
    tags: ['user', 'profile'],
  },

  // Mood data - private cache with revalidation
  '/api/moods': {
    ttl: 60,            // 1 minute
    strategy: 'stale-while-revalidate',
    staleWhileRevalidate: 300,  // 5 minutes
    varyBy: ['Authorization'],
    tags: ['moods', 'user'],
  },

  '/api/stats': {
    ttl: 300,           // 5 minutes
    strategy: 'stale-while-revalidate',
    staleWhileRevalidate: 600,  // 10 minutes
    varyBy: ['Authorization'],
    tags: ['stats', 'user'],
  },

  '/api/insights': {
    ttl: 600,           // 10 minutes
    strategy: 'stale-while-revalidate',
    staleWhileRevalidate: 1800, // 30 minutes
    varyBy: ['Authorization'],
    tags: ['insights', 'user'],
  },

  // Social features - short cache
  '/api/friends': {
    ttl: 120,           // 2 minutes
    strategy: 'private',
    varyBy: ['Authorization'],
    tags: ['friends', 'social'],
  },

  '/api/feed': {
    ttl: 60,            // 1 minute
    strategy: 'private',
    varyBy: ['Authorization'],
    tags: ['feed', 'social'],
  },

  '/api/groups': {
    ttl: 120,           // 2 minutes
    strategy: 'private',
    varyBy: ['Authorization'],
    tags: ['groups', 'social'],
  },

  // Search results - public cache
  '/api/search': {
    ttl: 300,           // 5 minutes
    strategy: 'public',
    staleWhileRevalidate: 600,
    tags: ['search'],
  },

  // Activities - long cache
  '/api/activities': {
    ttl: 1800,          // 30 minutes
    strategy: 'public',
    staleWhileRevalidate: 3600,
    tags: ['activities'],
  },

  // Default cache configuration
  'default': {
    ttl: 0,             // No cache
    strategy: 'no-cache',
  },
}

interface CachedResponse {
  status: number
  headers: Record<string, string>
  body: string
  etag: string
  timestamp: number
  tags: string[]
}

/**
 * Generate ETag from response body
 */
async function generateETag(body: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(body)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return `"${hashHex.slice(0, 16)}"`
}

/**
 * Generate cache key
 */
function generateCacheKey(c: Context, config: CacheConfig): string {
  const path = c.req.path
  const method = c.req.method
  const query = c.req.query()
  const queryString = new URLSearchParams(query).toString()
  
  let key = `cache:${method}:${path}`
  if (queryString) {
    key += `:${queryString}`
  }

  // Add vary headers to key
  if (config.varyBy) {
    for (const header of config.varyBy) {
      const value = c.req.header(header)
      if (value) {
        key += `:${header}:${value}`
      }
    }
  }

  return key
}

/**
 * Get cache configuration for endpoint
 */
function getCacheConfig(path: string, method: string): CacheConfig {
  // Only cache GET requests by default
  if (method !== 'GET') {
    return CACHE_CONFIGS['default']
  }

  // Exact match
  if (CACHE_CONFIGS[path]) {
    return CACHE_CONFIGS[path]
  }

  // Pattern matching
  for (const [pattern, config] of Object.entries(CACHE_CONFIGS)) {
    if (pattern.includes(':') || pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*') + '$')
      if (regex.test(path)) {
        return config
      }
    }
  }

  return CACHE_CONFIGS['default']
}

/**
 * In-memory cache store
 */
class CacheStore {
  private store: Map<string, CachedResponse> = new Map()

  async get(key: string): Promise<CachedResponse | null> {
    return this.store.get(key) || null
  }

  async set(key: string, value: CachedResponse, ttl: number): Promise<void> {
    this.store.set(key, value)
    
    // Auto-expire after TTL
    setTimeout(() => {
      this.store.delete(key)
    }, ttl * 1000)
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  async invalidateByTag(tag: string): Promise<void> {
    for (const [key, value] of this.store.entries()) {
      if (value.tags.includes(tag)) {
        this.store.delete(key)
      }
    }
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern)
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key)
      }
    }
  }

  clear(): void {
    this.store.clear()
  }
}

const cacheStore = new CacheStore()

/**
 * API Response Caching Middleware
 */
export async function cacheMiddleware(c: Context<{ Bindings: Bindings }>, next: Next) {
  const method = c.req.method
  const path = c.req.path

  // Only cache API endpoints
  if (!path.startsWith('/api')) {
    return next()
  }

  const config = getCacheConfig(path, method)

  // Skip caching if configured
  if (config.skipCache && config.skipCache(c)) {
    return next()
  }

  // No cache strategy - skip caching
  if (config.strategy === 'no-cache' || config.ttl === 0) {
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
    c.header('Pragma', 'no-cache')
    c.header('Expires', '0')
    return next()
  }

  const cacheKey = generateCacheKey(c, config)

  try {
    // Check if client sent If-None-Match header (ETag)
    const clientETag = c.req.header('If-None-Match')

    // Try to get from cache
    const cached = await cacheStore.get(cacheKey)

    if (cached) {
      const now = Date.now()
      const age = Math.floor((now - cached.timestamp) / 1000)
      const isStale = age > config.ttl

      // Check ETag match
      if (clientETag && clientETag === cached.etag) {
        c.header('ETag', cached.etag)
        c.header('Age', age.toString())
        return c.body(null, 304) // Not Modified
      }

      // Serve from cache if not stale
      if (!isStale) {
        // Set cache headers
        Object.entries(cached.headers).forEach(([key, value]) => {
          c.header(key, value)
        })
        c.header('X-Cache', 'HIT')
        c.header('Age', age.toString())
        c.header('ETag', cached.etag)

        // Set appropriate Cache-Control
        const maxAge = config.ttl - age
        if (config.strategy === 'stale-while-revalidate' && config.staleWhileRevalidate) {
          c.header('Cache-Control', `${config.strategy}, max-age=${maxAge}, stale-while-revalidate=${config.staleWhileRevalidate}`)
        } else {
          c.header('Cache-Control', `${config.strategy}, max-age=${maxAge}`)
        }

        return new Response(cached.body, {
          status: cached.status,
          headers: c.res.headers,
        })
      }

      // Stale-while-revalidate: serve stale content and revalidate in background
      if (config.strategy === 'stale-while-revalidate' && 
          config.staleWhileRevalidate && 
          age < (config.ttl + config.staleWhileRevalidate)) {
        
        // Serve stale content
        Object.entries(cached.headers).forEach(([key, value]) => {
          c.header(key, value)
        })
        c.header('X-Cache', 'STALE')
        c.header('Age', age.toString())
        c.header('ETag', cached.etag)
        c.header('Cache-Control', `${config.strategy}, max-age=0, stale-while-revalidate=${config.staleWhileRevalidate}`)

        // Revalidate in background (fire and forget)
        c.executionCtx?.waitUntil(
          (async () => {
            try {
              await next()
              // Cache will be updated by the response interceptor below
            } catch (error) {
              console.error('[Cache] Background revalidation failed:', error)
            }
          })()
        )

        return new Response(cached.body, {
          status: cached.status,
          headers: c.res.headers,
        })
      }
    }

    // Cache miss - execute request
    c.header('X-Cache', 'MISS')
    await next()

    // Cache successful responses
    const response = c.res
    if (response.status >= 200 && response.status < 300) {
      const body = await response.text()
      const etag = await generateETag(body)

      const cachedResponse: CachedResponse = {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body,
        etag,
        timestamp: Date.now(),
        tags: config.tags || [],
      }

      await cacheStore.set(cacheKey, cachedResponse, config.ttl)

      // Set cache headers
      c.header('ETag', etag)
      
      if (config.strategy === 'stale-while-revalidate' && config.staleWhileRevalidate) {
        c.header('Cache-Control', `${config.strategy}, max-age=${config.ttl}, stale-while-revalidate=${config.staleWhileRevalidate}`)
      } else {
        c.header('Cache-Control', `${config.strategy}, max-age=${config.ttl}`)
      }

      // Return response with cached body
      return new Response(body, {
        status: response.status,
        headers: c.res.headers,
      })
    }

  } catch (error) {
    console.error('[Cache] Error:', error)
    // On error, proceed without caching
    return next()
  }
}

/**
 * Cache invalidation helper
 */
export async function invalidateCache(pattern: string | string[]): Promise<void> {
  if (Array.isArray(pattern)) {
    // Invalidate by tags
    for (const tag of pattern) {
      await cacheStore.invalidateByTag(tag)
    }
  } else {
    // Invalidate by pattern
    await cacheStore.invalidateByPattern(pattern)
  }
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cacheStore.clear()
}

/**
 * Distributed cache using Cloudflare KV (for production)
 */
export async function distributedCacheMiddleware(
  c: Context<{ Bindings: Bindings }>,
  next: Next
) {
  const { KV } = c.env
  if (!KV) {
    // Fallback to in-memory cache
    return cacheMiddleware(c, next)
  }

  const method = c.req.method
  const path = c.req.path

  if (!path.startsWith('/api')) {
    return next()
  }

  const config = getCacheConfig(path, method)

  if (config.skipCache && config.skipCache(c)) {
    return next()
  }

  if (config.strategy === 'no-cache' || config.ttl === 0) {
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
    return next()
  }

  const cacheKey = generateCacheKey(c, config)

  try {
    const clientETag = c.req.header('If-None-Match')
    const cachedData = await KV.get(cacheKey, 'json') as CachedResponse | null

    if (cachedData) {
      const now = Date.now()
      const age = Math.floor((now - cachedData.timestamp) / 1000)
      const isStale = age > config.ttl

      if (clientETag && clientETag === cachedData.etag) {
        c.header('ETag', cachedData.etag)
        c.header('Age', age.toString())
        return c.body(null, 304)
      }

      if (!isStale) {
        Object.entries(cachedData.headers).forEach(([key, value]) => {
          c.header(key, value)
        })
        c.header('X-Cache', 'HIT')
        c.header('Age', age.toString())
        c.header('ETag', cachedData.etag)
        c.header('Cache-Control', `${config.strategy}, max-age=${config.ttl - age}`)

        return new Response(cachedData.body, {
          status: cachedData.status,
          headers: c.res.headers,
        })
      }
    }

    c.header('X-Cache', 'MISS')
    await next()

    const response = c.res
    if (response.status >= 200 && response.status < 300) {
      const body = await response.text()
      const etag = await generateETag(body)

      const cachedResponse: CachedResponse = {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body,
        etag,
        timestamp: Date.now(),
        tags: config.tags || [],
      }

      await KV.put(cacheKey, JSON.stringify(cachedResponse), {
        expirationTtl: config.ttl + (config.staleWhileRevalidate || 0),
      })

      c.header('ETag', etag)
      c.header('Cache-Control', `${config.strategy}, max-age=${config.ttl}`)

      return new Response(body, {
        status: response.status,
        headers: c.res.headers,
      })
    }

  } catch (error) {
    console.error('[DistributedCache] Error:', error)
    return next()
  }
}

export { CACHE_CONFIGS, cacheStore }
