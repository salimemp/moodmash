/**
 * Security Middleware for MoodMash
 * Rate limiting, CSRF protection, input sanitization, XSS prevention
 */

import { Context } from 'hono';

/**
 * Rate Limiting Middleware
 */
export async function rateLimiter(
  c: Context,
  identifier: string,
  identifierType: 'ip' | 'user' | 'token',
  endpoint: string,
  limit: number,
  windowMinutes: number = 60
): Promise<boolean> {
  try {
    const db = c.env.DB;
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    const windowEnd = new Date().toISOString();

    // Check existing rate limit
    const existing = await db.prepare(`
      SELECT request_count, limit_exceeded
      FROM rate_limits
      WHERE identifier = ? 
        AND identifier_type = ?
        AND endpoint = ?
        AND window_end > ?
    `).bind(identifier, identifierType, endpoint, windowStart).first();

    if (existing) {
      if (existing.limit_exceeded) {
        return false; // Rate limit exceeded
      }
      
      if (existing.request_count >= limit) {
        // Mark as exceeded
        await db.prepare(`
          UPDATE rate_limits
          SET limit_exceeded = 1, limit_exceeded_at = datetime('now')
          WHERE identifier = ? AND identifier_type = ? AND endpoint = ?
        `).bind(identifier, identifierType, endpoint).run();
        
        // Log security incident
        await logSecurityIncident(c, 'rate_limit_exceeded', 'medium', 
          `Rate limit exceeded for ${identifierType} ${identifier} on ${endpoint}`);
        
        return false;
      }
      
      // Increment count
      await db.prepare(`
        UPDATE rate_limits
        SET request_count = request_count + 1
        WHERE identifier = ? AND identifier_type = ? AND endpoint = ?
      `).bind(identifier, identifierType, endpoint).run();
      
    } else {
      // Create new rate limit entry
      await db.prepare(`
        INSERT INTO rate_limits (
          identifier, identifier_type, endpoint, request_count,
          window_start, window_end, created_at
        ) VALUES (?, ?, ?, 1, ?, ?, datetime('now'))
      `).bind(identifier, identifierType, endpoint, windowStart, windowEnd).run();
    }

    return true; // Within rate limit
  } catch (error) {
    console.error('Rate limiter error:', error);
    return true; // Fail open - allow request if rate limiter fails
  }
}

/**
 * Check IP Blacklist
 */
export async function checkIpBlacklist(c: Context, ipAddress: string): Promise<boolean> {
  try {
    const db = c.env.DB;
    
    const blacklisted = await db.prepare(`
      SELECT id FROM ip_blacklist
      WHERE ip_address = ?
        AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).bind(ipAddress).first();

    if (blacklisted) {
      await logSecurityIncident(c, 'blacklisted_ip_attempt', 'high',
        `Blacklisted IP ${ipAddress} attempted access`);
      return true; // IP is blacklisted
    }

    return false; // IP is not blacklisted
  } catch (error) {
    console.error('IP blacklist check error:', error);
    return false; // Fail open
  }
}

/**
 * Generate CSRF Token
 */
export async function generateCsrfToken(
  c: Context,
  userId: number,
  sessionId: string
): Promise<string> {
  const db = c.env.DB;
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

  await db.prepare(`
    INSERT INTO csrf_tokens (token, user_id, session_id, expires_at, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).bind(token, userId, sessionId, expiresAt).run();

  return token;
}

/**
 * Verify CSRF Token
 */
export async function verifyCsrfToken(
  c: Context,
  token: string,
  userId: number,
  sessionId: string
): Promise<boolean> {
  try {
    const db = c.env.DB;

    const csrfToken = await db.prepare(`
      SELECT id, used FROM csrf_tokens
      WHERE token = ?
        AND user_id = ?
        AND session_id = ?
        AND expires_at > datetime('now')
        AND used = 0
    `).bind(token, userId, sessionId).first();

    if (!csrfToken) {
      await logSecurityIncident(c, 'csrf_attempt', 'high',
        `Invalid CSRF token for user ${userId}`);
      return false;
    }

    // Mark token as used
    await db.prepare(`
      UPDATE csrf_tokens
      SET used = 1, used_at = datetime('now')
      WHERE id = ?
    `).bind(csrfToken.id).run();

    return true;
  } catch (error) {
    console.error('CSRF verification error:', error);
    return false;
  }
}

/**
 * Sanitize Input (prevent XSS)
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate Email Format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Password Strength
 */
export function isStrongPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
}

/**
 * Detect SQL Injection Attempt
 */
export function detectSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bUNION\b)/i,
    /--/,
    /;/,
    /\/\*/,
    /\*\//,
    /xp_/i,
    /sp_/i
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Detect XSS Attempt
 */
export function detectXss(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick, onload, etc.
    /<iframe/gi,
    /<embed/gi,
    /<object/gi
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Log Security Incident
 */
export async function logSecurityIncident(
  c: Context,
  incidentType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  description: string,
  options?: {
    blocked?: boolean;
    actionTaken?: string;
    userId?: number;
  }
) {
  try {
    const db = c.env.DB;
    const ipAddress = c.req.header('cf-connecting-ip') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';
    const endpoint = c.req.path;
    const method = c.req.method;

    await db.prepare(`
      INSERT INTO security_incidents (
        incident_type, severity, description, ip_address, user_agent,
        user_id, endpoint, method, blocked, action_taken, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      incidentType,
      severity,
      description,
      ipAddress,
      userAgent,
      options?.userId || null,
      endpoint,
      method,
      options?.blocked ? 1 : 0,
      options?.actionTaken || 'logged'
    ).run();
  } catch (error) {
    console.error('Security incident logging failed:', error);
  }
}

/**
 * Security Middleware - comprehensive security checks
 */
export async function securityMiddleware(c: Context, next: () => Promise<void>) {
  const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-real-ip') || 'unknown';
  
  // 1. Check IP blacklist
  if (await checkIpBlacklist(c, ipAddress)) {
    return c.json({ error: 'Access denied' }, 403);
  }

  // 2. Rate limiting for API endpoints
  if (c.req.path.startsWith('/api/')) {
    const allowed = await rateLimiter(c, ipAddress, 'ip', c.req.path, 100, 60);
    if (!allowed) {
      return c.json({ 
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.'
      }, 429);
    }
  }

  // 3. Check for SQL injection in query parameters
  const url = new URL(c.req.url);
  for (const [key, value] of url.searchParams) {
    if (detectSqlInjection(value)) {
      await logSecurityIncident(c, 'sql_injection', 'critical',
        `SQL injection attempt detected in parameter ${key}`, 
        { blocked: true, actionTaken: 'blocked' });
      return c.json({ error: 'Invalid input detected' }, 400);
    }
  }

  // 4. Check for XSS in body (for POST/PUT requests)
  if (['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
    try {
      const body = await c.req.json().catch(() => ({}));
      for (const [key, value] of Object.entries(body)) {
        if (typeof value === 'string' && detectXss(value)) {
          await logSecurityIncident(c, 'xss_attempt', 'high',
            `XSS attempt detected in field ${key}`,
            { blocked: true, actionTaken: 'blocked' });
          return c.json({ error: 'Invalid input detected' }, 400);
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  }

  // 5. Add security headers to response
  await next();
  
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.header('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://static.cloudflareinsights.com https://challenges.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' https://cdn.jsdelivr.net data:; " +
    "connect-src 'self' https://cloudflareinsights.com https://challenges.cloudflare.com https://cdn.jsdelivr.net; " +
    "frame-src https://challenges.cloudflare.com; " +
    "worker-src 'self'; " +
    "manifest-src 'self';");
}
