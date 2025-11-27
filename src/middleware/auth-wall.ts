/**
 * Authentication Wall Middleware
 * Version: 10.2 (Mobile + Mandatory Auth)
 * 
 * Enforces mandatory authentication for all routes except public pages
 */

import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import type { Bindings } from '../types';
import { getSession } from '../auth';

/**
 * Public routes that don't require authentication
 * STRICT MODE: Only dashboard and register pages are public
 */
const PUBLIC_ROUTES = [
  '/', // Dashboard - public landing page
  '/register', // Register page - for new user signup
  '/login', // Login page - for authentication
  '/verify-email', // Email verification page (needs token in URL)
  '/forgot-password', // Password reset request page
  '/reset-password', // Password reset completion page (needs token in URL)
  '/monitoring', // Monitoring dashboard - public for Grafana/Prometheus integration
  '/static/', // Static assets (CSS, JS, images)
  '/api/', // All API routes bypass authWall and use apiAuthWall instead
  '/auth/', // OAuth callback routes
];

/**
 * Check if route is public
 */
function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    // Special case for root path - only match exactly
    if (route === '/') {
      return path === '/' || path.startsWith('/?');
    }
    // For routes ending with /, treat as prefix (e.g., /api/, /static/)
    if (route.endsWith('/')) {
      return path.startsWith(route);
    }
    // For other routes, match exactly or with query string
    return path === route || path.startsWith(route + '?');
  });
}

/**
 * Auth wall middleware - redirects unauthenticated users to login
 */
export async function authWall(c: Context<{ Bindings: Bindings }>, next: Next) {
  const path = c.req.path;

  // Allow public routes
  if (isPublicRoute(path)) {
    return await next();
  }

  // Check if user is authenticated from database (consistent with apiAuthWall)
  const { DB } = c.env;
  const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '') || 
                      getCookie(c, 'session_token');

  if (!sessionToken) {
    // Store intended destination
    const intendedUrl = path + (c.req.url.includes('?') ? '?' + c.req.url.split('?')[1] : '');
    
    // Redirect to login with return URL
    return c.redirect(`/login?redirect=${encodeURIComponent(intendedUrl)}`);
  }

  try {
    // Validate session from database and check if user is verified
    const session = await DB.prepare(`
      SELECT s.*, u.id as user_id, u.username, u.email, u.is_verified
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
    `).bind(sessionToken).first();

    if (!session) {
      // Invalid or expired session - redirect to login
      const intendedUrl = path + (c.req.url.includes('?') ? '?' + c.req.url.split('?')[1] : '');
      return c.redirect(`/login?redirect=${encodeURIComponent(intendedUrl)}`);
    }

    // Check if email is verified (optional - can be enabled if needed)
    // if (!session.is_verified) {
    //   return c.redirect('/verify-email?message=Please verify your email to continue');
    // }

    // Attach user info to context
    c.set('user_id', session.user_id);
    c.set('session', session);

    // User is authenticated and verified, proceed
    await next();
  } catch (error) {
    console.error('[authWall] Database error:', error);
    // On error, redirect to login
    return c.redirect('/login');
  }
}

/**
 * API auth wall - returns 401 for unauthenticated API requests
 */
export async function apiAuthWall(c: Context<{ Bindings: Bindings }>, next: Next) {
  const path = c.req.path;

  // Allow public API routes
  if (
    path.startsWith('/api/auth/') || 
    path === '/api/health/status' || 
    path === '/api/health' ||
    path.startsWith('/api/monitoring/') ||  // Allow Prometheus metrics scraping
    path === '/api/sentry-test'  // Allow Sentry test endpoint
  ) {
    return await next();
  }

  // Check if user is authenticated from database (not in-memory sessions)
  const { DB } = c.env;
  const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '') || 
                      getCookie(c, 'session_token');

  if (!sessionToken) {
    return c.json({
      error: 'Authentication required',
      message: 'Please log in to access this resource',
      code: 'UNAUTHENTICATED',
    }, 401);
  }

  try {
    // Validate session from database
    const session = await DB.prepare(`
      SELECT s.*, u.id as user_id, u.username, u.email
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
    `).bind(sessionToken).first();

    if (!session) {
      return c.json({
        error: 'Authentication required',
        message: 'Invalid or expired session',
        code: 'UNAUTHENTICATED',
      }, 401);
    }

    // Attach user info to context
    c.set('user_id', session.user_id);
    c.set('session', session);

    await next();
  } catch (error) {
    console.error('[apiAuthWall] Database error:', error);
    return c.json({
      error: 'Authentication error',
      message: 'Failed to validate session',
      code: 'AUTH_ERROR',
    }, 500);
  }
}

/**
 * Get authenticated user ID from context
 */
export function getAuthenticatedUserId(c: Context): number {
  const userId = c.get('user_id');
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId as number;
}

/**
 * Require specific user role
 */
export function requireRole(role: 'user' | 'admin' | 'moderator') {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const session = await getSession(c);
    
    if (!session || !session.user_id) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    // Get user role from database
    const user = await c.env.DB.prepare(`
      SELECT role FROM users WHERE id = ?
    `).bind(session.user_id).first();

    if (!user || user.role !== role) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    await next();
  };
}
