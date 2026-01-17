// Cloudflare Turnstile Bot Protection API
import { Hono } from 'hono';
import type { Env, Variables } from '../../types';

const turnstile = new Hono<{ Bindings: Env; Variables: Variables }>();

// Turnstile Secret Key (set in Cloudflare Workers environment)
const TURNSTILE_SECRET_KEY = '0x4AAAAAAC...'; // Will be replaced by env variable

interface TurnstileVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

interface TurnstileVerifyRequest {
  token: string;
  action?: string;
  remoteip?: string;
}

/**
 * Verify Turnstile token
 * POST /api/turnstile/verify
 */
turnstile.post('/verify', async (c) => {
  try {
    const body = await c.req.json<TurnstileVerifyRequest>();
    const { token, action } = body;
    
    if (!token) {
      return c.json({ 
        success: false, 
        error: 'Turnstile token is required' 
      }, 400);
    }
    
    // Get client IP
    const clientIp = c.req.header('CF-Connecting-IP') || 
                     c.req.header('X-Forwarded-For')?.split(',')[0] || 
                     '127.0.0.1';
    
    // Skip verification for localhost in development
    const isLocalhost = clientIp === '127.0.0.1' || clientIp === '::1';
    if (isLocalhost && !c.env.TURNSTILE_SECRET_KEY) {
      // Log for audit
      await logTurnstileAttempt(c.env.DB, {
        ip_address: clientIp,
        success: true,
        action: action || 'unknown',
        user_agent: c.req.header('User-Agent') || '',
        hostname: 'localhost',
        error_codes: null,
        challenge_ts: new Date().toISOString()
      });
      
      return c.json({ 
        success: true, 
        message: 'Localhost bypass - development mode' 
      });
    }
    
    // Verify with Cloudflare
    const secretKey = c.env.TURNSTILE_SECRET_KEY || TURNSTILE_SECRET_KEY;
    
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    formData.append('remoteip', clientIp);
    
    const verifyResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const result: TurnstileVerifyResponse = await verifyResponse.json();
    
    // Log the attempt
    await logTurnstileAttempt(c.env.DB, {
      ip_address: clientIp,
      success: result.success,
      action: action || 'unknown',
      user_agent: c.req.header('User-Agent') || '',
      hostname: result.hostname || '',
      error_codes: result['error-codes'] ? JSON.stringify(result['error-codes']) : null,
      challenge_ts: result.challenge_ts || null
    });
    
    if (!result.success) {
      // Check for bot detection threshold
      await checkAndBlockBot(c.env.DB, clientIp, c.req.header('User-Agent') || '');
      
      return c.json({ 
        success: false, 
        error: 'Turnstile verification failed',
        codes: result['error-codes']
      }, 403);
    }
    
    return c.json({ 
      success: true,
      challenge_ts: result.challenge_ts,
      hostname: result.hostname
    });
    
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return c.json({ 
      success: false, 
      error: 'Verification service error' 
    }, 500);
  }
});

/**
 * Get Turnstile stats (admin only)
 * GET /api/turnstile/stats
 */
turnstile.get('/stats', async (c) => {
  try {
    // Check admin access (simplified - should use proper admin auth)
    const { getCurrentUser } = await import('../../middleware/auth');
    const user = await getCurrentUser(c);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Get stats from last 24 hours
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_attempts,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed,
        COUNT(DISTINCT ip_address) as unique_ips,
        action
      FROM turnstile_logs
      WHERE created_at > datetime('now', '-24 hours')
      GROUP BY action
    `).all();
    
    const blocked = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM bot_detections
      WHERE blocked_until > datetime('now')
    `).first();
    
    return c.json({
      stats: stats.results,
      blocked_ips: blocked?.count || 0
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    return c.json({ error: 'Failed to get stats' }, 500);
  }
});

/**
 * Check if IP is blocked
 * GET /api/turnstile/check-ip
 */
turnstile.get('/check-ip', async (c) => {
  const clientIp = c.req.header('CF-Connecting-IP') || 
                   c.req.header('X-Forwarded-For')?.split(',')[0] || 
                   '127.0.0.1';
  
  try {
    const blocked = await c.env.DB.prepare(`
      SELECT * FROM bot_detections
      WHERE ip_address = ? AND blocked_until > datetime('now')
      LIMIT 1
    `).bind(clientIp).first();
    
    if (blocked) {
      return c.json({ 
        blocked: true, 
        reason: blocked.reason,
        until: blocked.blocked_until 
      }, 403);
    }
    
    return c.json({ blocked: false });
    
  } catch (error) {
    return c.json({ blocked: false });
  }
});

// Helper function to log Turnstile attempts
async function logTurnstileAttempt(db: D1Database, data: {
  ip_address: string;
  success: boolean;
  action: string;
  user_agent: string;
  hostname: string;
  error_codes: string | null;
  challenge_ts: string | null;
}) {
  try {
    await db.prepare(`
      INSERT INTO turnstile_logs (ip_address, success, action, user_agent, hostname, error_codes, challenge_ts)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.ip_address,
      data.success ? 1 : 0,
      data.action,
      data.user_agent,
      data.hostname,
      data.error_codes,
      data.challenge_ts
    ).run();
  } catch (error) {
    console.error('Failed to log Turnstile attempt:', error);
  }
}

// Helper function to check and block suspicious IPs
async function checkAndBlockBot(db: D1Database, ip: string, userAgent: string) {
  try {
    // Count failed attempts in last hour
    const failedCount = await db.prepare(`
      SELECT COUNT(*) as count
      FROM turnstile_logs
      WHERE ip_address = ? AND success = 0 AND created_at > datetime('now', '-1 hour')
    `).bind(ip).first();
    
    const count = (failedCount?.count as number) || 0;
    
    // Block if more than 5 failed attempts
    if (count >= 5) {
      // Calculate block duration based on attempt count
      const blockHours = Math.min(count, 24); // Max 24 hours
      
      await db.prepare(`
        INSERT INTO bot_detections (ip_address, user_agent, reason, blocked_until, attempt_count)
        VALUES (?, ?, ?, datetime('now', '+' || ? || ' hours'), ?)
        ON CONFLICT(ip_address) DO UPDATE SET
          attempt_count = attempt_count + 1,
          blocked_until = datetime('now', '+' || ? || ' hours'),
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        ip,
        userAgent,
        'turnstile_failed',
        blockHours.toString(),
        count,
        blockHours.toString()
      ).run();
    }
  } catch (error) {
    console.error('Bot check error:', error);
  }
}

// Middleware to verify Turnstile token before processing requests
export async function verifyTurnstileMiddleware(c: any, next: () => Promise<void>) {
  const clientIp = c.req.header('CF-Connecting-IP') || 
                   c.req.header('X-Forwarded-For')?.split(',')[0] || 
                   '127.0.0.1';
  
  // Skip for localhost
  const isLocalhost = clientIp === '127.0.0.1' || clientIp === '::1';
  if (isLocalhost) {
    return next();
  }
  
  // Check if IP is blocked
  try {
    const blocked = await c.env.DB.prepare(`
      SELECT * FROM bot_detections
      WHERE ip_address = ? AND blocked_until > datetime('now')
      LIMIT 1
    `).bind(clientIp).first();
    
    if (blocked) {
      return c.json({ 
        error: 'Access temporarily blocked due to suspicious activity',
        blocked_until: blocked.blocked_until
      }, 403);
    }
  } catch (error) {
    // Continue if DB check fails
  }
  
  // Get token from request body or header
  const body = await c.req.json().catch(() => ({}));
  const token = body.turnstileToken || c.req.header('X-Turnstile-Token');
  
  if (!token) {
    return c.json({ error: 'Bot verification required' }, 403);
  }
  
  // Verify token
  const secretKey = c.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    // Skip verification if no secret key configured
    return next();
  }
  
  const formData = new URLSearchParams();
  formData.append('secret', secretKey);
  formData.append('response', token);
  formData.append('remoteip', clientIp);
  
  const verifyResponse = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      body: formData
    }
  );
  
  const result = await verifyResponse.json() as TurnstileVerifyResponse;
  
  if (!result.success) {
    return c.json({ 
      error: 'Bot verification failed',
      codes: result['error-codes']
    }, 403);
  }
  
  return next();
}

export default turnstile;
