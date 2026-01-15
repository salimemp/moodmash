// OAuth Authentication Module
import { Google, GitHub } from 'arctic';
import type { Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { OAuthEnv } from './types';

// Check if OAuth provider is configured
export function isOAuthConfigured(provider: 'google' | 'github', env: OAuthEnv): boolean {
    if (provider === 'google') {
        return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
    } else if (provider === 'github') {
        return !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
    }
    return false;
}

// Initialize OAuth providers
export function initOAuthProviders(env: OAuthEnv): { google: Google | null; github: GitHub | null } {
    // For production, use the production URL
    // For local development, use localhost
    const baseUrl = env.BASE_URL || 'https://moodmash.win';
    
    // OAuth initialization (debug logging removed for production)
    
    // Only initialize if credentials are present
    const google = (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) 
        ? new Google(
            env.GOOGLE_CLIENT_ID,
            env.GOOGLE_CLIENT_SECRET,
            `${baseUrl}/auth/google/callback`
        )
        : null;
    
    const github = (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET)
        ? new GitHub(
            env.GITHUB_CLIENT_ID,
            env.GITHUB_CLIENT_SECRET,
            `${baseUrl}/auth/github/callback`
        )
        : null;
    
    return { google, github };
}

// Generate session token
export function generateSessionToken(): string {
    const array = new Uint8Array(20);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Session interface
export interface Session {
    userId: string;
    email: string;
    name: string;
    picture?: string;
    provider: 'google' | 'github';
    isPremium: boolean;
    createdAt: number;
}

// In-memory session store (for development - use D1 or KV in production)
const sessions = new Map<string, Session>();

export function createSession(session: Session): string {
    const token = generateSessionToken();
    sessions.set(token, session);
    return token;
}

export function getSession(token: string): Session | null {
    return sessions.get(token) || null;
}

export function deleteSession(token: string): void {
    sessions.delete(token);
}

// Database session interface
export interface DbSession {
    token: string;
    expiresAt: Date;
}

/**
 * Create a database-backed session
 * @param db - D1 database instance
 * @param userId - User ID to create session for
 * @param durationDays - Session duration in days (default: 7)
 * @returns Session token info
 */
export async function createDbSession(
    db: import('@cloudflare/workers-types').D1Database,
    userId: number,
    durationDays: number = 7
): Promise<DbSession> {
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    
    await db.prepare(`
        INSERT INTO sessions (session_token, user_id, expires_at, created_at, last_activity_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `).bind(token, userId, expiresAt.toISOString()).run();
    
    return { token, expiresAt };
}

/**
 * Delete a database-backed session
 */
export async function deleteDbSession(
    db: import('@cloudflare/workers-types').D1Database,
    token: string
): Promise<void> {
    await db.prepare('DELETE FROM sessions WHERE session_token = ?').bind(token).run();
}

// Middleware to check authentication (uses database-backed sessions)
export async function requireAuth(c: Context, next: () => Promise<void>) {
    const token = getCookie(c, 'session_token');
    
    if (!token) {
        return c.json({ error: 'Unauthorized', message: 'Please login to continue' }, 401);
    }
    
    // CRITICAL FIX: Use database-backed sessions instead of in-memory sessions
    // The login process creates sessions in the database, so we must query the database
    const user = await getCurrentUser(c);
    
    if (!user) {
        return c.json({ error: 'Unauthorized', message: 'Invalid session' }, 401);
    }
    
    // Attach user to context (backwards compatible with session structure)
    c.set('session', {
        userId: String(user.userId),
        email: user.email,
        name: user.name || user.username,
        isPremium: user.isPremium,
        provider: 'email' as const,
        createdAt: user.created_at ? new Date(user.created_at).getTime() : Date.now()
    });
    c.set('user', user);
    await next();
}

// Middleware to check premium
export async function requirePremium(c: Context, next: () => Promise<void>) {
    const session = c.get('session') as Session | undefined;
    
    if (!session || !session.isPremium) {
        return c.json({ 
            error: 'Premium Required', 
            message: 'This feature requires a premium subscription' 
        }, 403);
    }
    
    await next();
}

// User session data returned by getCurrentUser
export interface CurrentUser {
    id: number;  // Alias for userId for backward compatibility
    userId: number;
    email: string;
    username: string;
    name: string | null;
    avatar_url: string | null;
    isPremium: boolean;
    is_verified?: boolean;
    created_at?: string;
}

// Helper to get current user from database session
export async function getCurrentUser(c: Context): Promise<CurrentUser | null> {
    const { DB } = c.env;
    const token = getCookie(c, 'session_token');
    if (!token) return null;
    
    try {
        // Query database for session with user data
        const session = await DB.prepare(`
            SELECT s.user_id as userId, u.email, u.username, u.name, u.avatar_url, 
                   u.is_verified, u.created_at
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
        `).bind(token).run().catch(() => {});
        
        const userId = session.userId as number;
        return {
            id: userId,  // Alias for backward compatibility
            userId: userId,
            email: session.email as string,
            username: session.username as string,
            name: session.name as string | null,
            avatar_url: session.avatar_url as string | null,
            isPremium: false, // Default: Check user_subscriptions table when premium features enabled
            is_verified: session.is_verified === 1,
            created_at: session.created_at as string | undefined
        };
    } catch (error) {
        console.error('[Auth] Error getting current user:', error);
        return null;
    }
}
