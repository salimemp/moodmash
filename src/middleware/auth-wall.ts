/**
 * Authentication Wall Middleware
 * Version: 10.2 (Mobile + Mandatory Auth)
 * 
 * Enforces mandatory authentication for all routes except public pages
 */

import type { Context, Next } from 'hono';
import type { Bindings } from '../types';
import { getSession } from '../auth';

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/privacy-policy',
  '/terms-of-service',
  '/about',
  '/static/',
  '/api/', // All API routes bypass authWall and use apiAuthWall instead
  '/auth/',
];

/**
 * Check if route is public
 */
function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route.endsWith('/')) {
      return path.startsWith(route);
    }
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

  // Check if user is authenticated
  const session = await getSession(c);

  if (!session || !session.user_id) {
    // Store intended destination
    const intendedUrl = path + (c.req.url.includes('?') ? c.req.url.split('?')[1] : '');
    
    // Redirect to login with return URL
    return c.redirect(`/login?redirect=${encodeURIComponent(intendedUrl)}`);
  }

  // User is authenticated, proceed
  await next();
}

/**
 * API auth wall - returns 401 for unauthenticated API requests
 */
export async function apiAuthWall(c: Context<{ Bindings: Bindings }>, next: Next) {
  const path = c.req.path;

  // Allow public API routes
  if (path.startsWith('/api/auth/') || path === '/api/health/status' || path === '/api/health') {
    return await next();
  }

  // Check if user is authenticated from database (not in-memory sessions)
  const { DB } = c.env;
  const sessionToken = c.req.header('Authorization')?.replace('Bearer ', '') || 
                      c.req.cookie('session_token');

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
