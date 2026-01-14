/**
 * Authentication Middleware
 * Centralizes authentication logic to replace repeated getCurrentUser calls
 * and hardcoded userId values throughout the codebase.
 */

import { createMiddleware } from 'hono/factory';
import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import type { Bindings, Variables, Session } from '../types';

/**
 * Authenticated user session returned by getCurrentUser
 */
export interface AuthenticatedUser {
    userId: number;
    email: string;
    username: string;
    name: string | null;
    avatar_url: string | null;
    isPremium: boolean;
}

/**
 * Get current user from session token
 * Optimized version with caching support
 */
export async function getCurrentUserFromContext(c: Context<{ Bindings: Bindings; Variables: Variables }>): Promise<AuthenticatedUser | null> {
    const { DB } = c.env;
    const token = getCookie(c, 'session_token');
    if (!token) return null;

    try {
        // Check if already in context (cached for this request)
        const cachedSession = c.get('session');
        if (cachedSession && cachedSession.userId) {
            return {
                userId: cachedSession.userId,
                email: cachedSession.email,
                username: cachedSession.username,
                name: cachedSession.name,
                avatar_url: cachedSession.avatar_url,
                isPremium: cachedSession.isPremium ?? false
            };
        }

        // Query database for session with user data
        const session = await DB.prepare(`
            SELECT s.user_id as userId, u.email, u.username, u.name, u.avatar_url, 
                   COALESCE((SELECT 1 FROM subscriptions sub WHERE sub.user_id = u.id AND sub.status = 'active' AND sub.end_date > datetime('now')), 0) as isPremium
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = ? 
              AND s.expires_at > datetime('now')
              AND u.is_active = 1
        `).bind(token).first();

        if (!session) return null;

        // Update last activity (non-blocking)
        DB.prepare(`
            UPDATE sessions 
            SET last_activity_at = datetime('now') 
            WHERE session_token = ?
        `).bind(token).run().catch(() => {}); // Silent fail

        const user: AuthenticatedUser = {
            userId: session.userId as number,
            email: session.email as string,
            username: session.username as string,
            name: session.name as string | null,
            avatar_url: session.avatar_url as string | null,
            isPremium: (session.isPremium as number) === 1
        };

        // Cache in context for this request
        c.set('session', user as Session);
        c.set('user_id', user.userId);

        return user;
    } catch (error) {
        console.error('[Auth Middleware] Error getting current user:', error);
        return null;
    }
}

/**
 * Middleware that requires authentication
 * Sets userId and session in context if authenticated
 * Returns 401 if not authenticated
 */
export const requireAuth = createMiddleware<{
    Bindings: Bindings;
    Variables: Variables;
}>(async (c, next) => {
    const user = await getCurrentUserFromContext(c);

    if (!user) {
        return c.json({
            success: false,
            error: 'Unauthorized',
            message: 'Please login to continue'
        }, 401);
    }

    // Set user data in context
    c.set('user_id', user.userId);
    c.set('session', user as Session);
    c.set('isPremium', user.isPremium);

    await next();
});

/**
 * Middleware that requires authentication + premium subscription
 */
export const requirePremium = createMiddleware<{
    Bindings: Bindings;
    Variables: Variables;
}>(async (c, next) => {
    const user = await getCurrentUserFromContext(c);

    if (!user) {
        return c.json({
            success: false,
            error: 'Unauthorized',
            message: 'Please login to continue'
        }, 401);
    }

    if (!user.isPremium) {
        return c.json({
            success: false,
            error: 'Premium Required',
            message: 'This feature requires a premium subscription'
        }, 403);
    }

    c.set('user_id', user.userId);
    c.set('session', user as Session);
    c.set('isPremium', true);

    await next();
});

/**
 * Optional authentication middleware
 * Sets user data if authenticated but doesn't block unauthenticated requests
 */
export const optionalAuth = createMiddleware<{
    Bindings: Bindings;
    Variables: Variables;
}>(async (c, next) => {
    const user = await getCurrentUserFromContext(c);

    if (user) {
        c.set('user_id', user.userId);
        c.set('session', user as Session);
        c.set('isPremium', user.isPremium);
    }

    await next();
});

/**
 * Helper to get userId from context (use after requireAuth middleware)
 */
export function getUserId(c: Context<{ Bindings: Bindings; Variables: Variables }>): number {
    const userId = c.get('user_id');
    if (!userId) {
        throw new Error('User ID not found in context. Did you apply requireAuth middleware?');
    }
    return userId;
}

/**
 * Helper to get session from context (use after requireAuth middleware)
 */
export function getSession(c: Context<{ Bindings: Bindings; Variables: Variables }>): Session {
    const session = c.get('session');
    if (!session) {
        throw new Error('Session not found in context. Did you apply requireAuth middleware?');
    }
    return session;
}
