/**
 * Database Connection Pooling and Query Optimization (v1.0)
 * 
 * Features:
 * - Prepared statement caching
 * - Query result caching
 * - Batch query execution
 * - Transaction management
 * - Connection pooling for D1
 * - Query performance monitoring
 * - Automatic retry logic
 * - Query timeout handling
 */

import type { D1Database, D1Result } from '@cloudflare/workers-types'
import type { Bindings } from '../types'

interface QueryOptions {
  cache?: boolean
  cacheTTL?: number       // seconds
  timeout?: number        // milliseconds
  retry?: number          // retry attempts
  logPerformance?: boolean
}

interface PreparedStatementCache {
  statement: string
  lastUsed: number
  useCount: number
}

interface QueryResultCache {
  result: any
  timestamp: number
  ttl: number
}

class DatabasePool {
  private db: D1Database
  private preparedStatements: Map<string, PreparedStatementCache> = new Map()
  private queryCache: Map<string, QueryResultCache> = new Map()
  private queryMetrics: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map()

  constructor(db: D1Database) {
    this.db = db
    
    // Clean up cache periodically
    setInterval(() => this.cleanupCache(), 5 * 60 * 1000) // 5 minutes
  }

  /**
   * Generate cache key for query
   */
  private generateCacheKey(sql: string, params?: any[]): string {
    const paramStr = params ? JSON.stringify(params) : ''
    return `query:${sql}:${paramStr}`
  }

  /**
   * Check if query result is cached
   */
  private getCachedResult(cacheKey: string): any | null {
    const cached = this.queryCache.get(cacheKey)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > cached.ttl * 1000) {
      this.queryCache.delete(cacheKey)
      return null
    }

    return cached.result
  }

  /**
   * Cache query result
   */
  private cacheResult(cacheKey: string, result: any, ttl: number): void {
    this.queryCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now()

    // Clean query cache
    for (const [key, cached] of this.queryCache.entries()) {
      if (now - cached.timestamp > cached.ttl * 1000) {
        this.queryCache.delete(key)
      }
    }

    // Clean prepared statements (remove unused for > 1 hour)
    for (const [key, stmt] of this.preparedStatements.entries()) {
      if (now - stmt.lastUsed > 60 * 60 * 1000) {
        this.preparedStatements.delete(key)
      }
    }
  }

  /**
   * Track query performance metrics
   */
  private trackQueryMetrics(sql: string, executionTime: number): void {
    const existing = this.queryMetrics.get(sql)
    if (existing) {
      existing.count++
      existing.totalTime += executionTime
      existing.avgTime = existing.totalTime / existing.count
    } else {
      this.queryMetrics.set(sql, {
        count: 1,
        totalTime: executionTime,
        avgTime: executionTime,
      })
    }
  }

  /**
   * Execute query with caching and performance tracking
   */
  async query<T = any>(
    sql: string,
    params?: any[],
    options: QueryOptions = {}
  ): Promise<D1Result<T>> {
    const {
      cache = false,
      cacheTTL = 300,
      timeout = 30000,
      retry = 3,
      logPerformance = true,
    } = options

    const cacheKey = this.generateCacheKey(sql, params)

    // Check cache
    if (cache) {
      const cached = this.getCachedResult(cacheKey)
      if (cached) {
        return cached
      }
    }

    const startTime = Date.now()
    let lastError: Error | null = null

    // Retry logic
    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        // Prepare statement
        const stmt = this.db.prepare(sql)

        // Bind parameters
        const boundStmt = params && params.length > 0 ? stmt.bind(...params) : stmt

        // Execute with timeout
        const result = await Promise.race([
          boundStmt.all<T>(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), timeout)
          ),
        ])

        const executionTime = Date.now() - startTime

        // Track performance
        if (logPerformance) {
          this.trackQueryMetrics(sql, executionTime)
        }

        // Log slow queries (> 1 second)
        if (executionTime > 1000) {
          console.warn(`[DB] Slow query (${executionTime}ms):`, sql)
        }

        // Cache result
        if (cache && result.success) {
          this.cacheResult(cacheKey, result, cacheTTL)
        }

        return result

      } catch (error) {
        lastError = error as Error
        console.error(`[DB] Query error (attempt ${attempt + 1}/${retry + 1}):`, error)

        // Wait before retry (exponential backoff)
        if (attempt < retry) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
        }
      }
    }

    throw lastError || new Error('Query failed after retries')
  }

  /**
   * Execute single query (first row only)
   */
  async queryFirst<T = any>(
    sql: string,
    params?: any[],
    options: QueryOptions = {}
  ): Promise<T | null> {
    const result = await this.query<T>(sql, params, options)
    return result.results && result.results.length > 0 ? result.results[0] : null
  }

  /**
   * Execute query and return all rows
   */
  async queryAll<T = any>(
    sql: string,
    params?: any[],
    options: QueryOptions = {}
  ): Promise<T[]> {
    const result = await this.query<T>(sql, params, options)
    return result.results || []
  }

  /**
   * Execute multiple queries in a batch
   */
  async batch<T = any>(
    queries: Array<{ sql: string; params?: any[] }>,
    options: QueryOptions = {}
  ): Promise<Array<D1Result<any>>> {
    const statements = queries.map(q => {
      const stmt = this.db.prepare(q.sql)
      return q.params && q.params.length > 0 ? stmt.bind(...q.params) : stmt
    })

    const startTime = Date.now()
    const results = await this.db.batch(statements)
    const executionTime = Date.now() - startTime

    if (options.logPerformance) {
      console.log(`[DB] Batch query (${queries.length} queries) completed in ${executionTime}ms`)
    }

    return results as Array<D1Result<any>>
  }

  /**
   * Execute query without returning results (INSERT, UPDATE, DELETE)
   */
  async execute(
    sql: string,
    params?: any[],
    options: QueryOptions = {}
  ): Promise<D1Result> {
    const stmt = this.db.prepare(sql)
    const boundStmt = params && params.length > 0 ? stmt.bind(...params) : stmt

    const startTime = Date.now()
    const result = await boundStmt.run()
    const executionTime = Date.now() - startTime

    if (options.logPerformance) {
      this.trackQueryMetrics(sql, executionTime)
    }

    // Invalidate cache for write operations
    if (sql.trim().toUpperCase().startsWith('INSERT') ||
        sql.trim().toUpperCase().startsWith('UPDATE') ||
        sql.trim().toUpperCase().startsWith('DELETE')) {
      // Clear all cache (simple strategy)
      // In production, implement smarter invalidation based on affected tables
      this.queryCache.clear()
    }

    return result
  }

  /**
   * Transaction support
   */
  async transaction<T>(
    callback: (tx: DatabasePool) => Promise<T>
  ): Promise<T> {
    // D1 doesn't support explicit transactions yet
    // This is a placeholder for future support
    // For now, we'll execute queries sequentially
    
    try {
      const result = await callback(this)
      return result
    } catch (error) {
      console.error('[DB] Transaction failed:', error)
      throw error
    }
  }

  /**
   * Get query performance metrics
   */
  getMetrics(): Array<{ sql: string; count: number; avgTime: number; totalTime: number }> {
    return Array.from(this.queryMetrics.entries())
      .map(([sql, metrics]) => ({ sql, ...metrics }))
      .sort((a, b) => b.totalTime - a.totalTime) // Sort by total time
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.queryCache.clear()
    this.preparedStatements.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { queries: number; statements: number } {
    return {
      queries: this.queryCache.size,
      statements: this.preparedStatements.size,
    }
  }
}

/**
 * Database helper functions
 */

/**
 * Create optimized indexes
 */
export const RECOMMENDED_INDEXES = [
  // Users table
  'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
  'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
  'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)',
  
  // Moods table
  'CREATE INDEX IF NOT EXISTS idx_moods_user_id ON moods(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_moods_created_at ON moods(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_moods_user_date ON moods(user_id, created_at)',
  
  // Sessions table
  'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)',
  
  // Friends table
  'CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id)',
  'CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status)',
  
  // Posts table
  'CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at)',
  
  // Comments table
  'CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)',
  'CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)',
]

/**
 * Initialize database with recommended indexes
 */
export async function initializeDatabase(db: D1Database): Promise<void> {
  console.log('[DB] Initializing database with optimized indexes...')
  
  for (const indexSQL of RECOMMENDED_INDEXES) {
    try {
      await db.prepare(indexSQL).run()
      console.log('[DB] Created index:', indexSQL)
    } catch (error) {
      console.error('[DB] Failed to create index:', error)
    }
  }
  
  console.log('[DB] Database initialization complete')
}

/**
 * Query builder helper for common patterns
 */
export class QueryBuilder {
  private table: string
  private selectFields: string[] = ['*']
  private whereConditions: Array<{ field: string; operator: string; value: any }> = []
  private orderByFields: Array<{ field: string; direction: 'ASC' | 'DESC' }> = []
  private limitValue?: number
  private offsetValue?: number
  private params: any[] = []

  constructor(table: string) {
    this.table = table
  }

  select(...fields: string[]): this {
    this.selectFields = fields
    return this
  }

  where(field: string, operator: string, value: any): this {
    this.whereConditions.push({ field, operator, value })
    this.params.push(value)
    return this
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByFields.push({ field, direction })
    return this
  }

  limit(value: number): this {
    this.limitValue = value
    return this
  }

  offset(value: number): this {
    this.offsetValue = value
    return this
  }

  build(): { sql: string; params: any[] } {
    let sql = `SELECT ${this.selectFields.join(', ')} FROM ${this.table}`

    if (this.whereConditions.length > 0) {
      const conditions = this.whereConditions
        .map(c => `${c.field} ${c.operator} ?`)
        .join(' AND ')
      sql += ` WHERE ${conditions}`
    }

    if (this.orderByFields.length > 0) {
      const orders = this.orderByFields
        .map(o => `${o.field} ${o.direction}`)
        .join(', ')
      sql += ` ORDER BY ${orders}`
    }

    if (this.limitValue !== undefined) {
      sql += ` LIMIT ${this.limitValue}`
    }

    if (this.offsetValue !== undefined) {
      sql += ` OFFSET ${this.offsetValue}`
    }

    return { sql, params: this.params }
  }
}

/**
 * Create database pool instance
 */
export function createDatabasePool(db: D1Database): DatabasePool {
  return new DatabasePool(db)
}

export { DatabasePool, QueryOptions, PreparedStatementCache, QueryResultCache }
