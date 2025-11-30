// OAuth Authentication Module
import { Google, GitHub } from 'arctic';
import type { Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

// Check if OAuth provider is configured
export function isOAuthConfigured(provider: 'google' | 'github', env: any): boolean {
    if (provider === 'google') {
        return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
    } else if (provider === 'github') {
        return !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
    }
    return false;
}

// Initialize OAuth providers
export function initOAuthProviders(env: any) {
    // For production, use the production URL
    // For local development, use localhost
    const baseUrl = env.BASE_URL || 'https://moodmash.win';
    
    console.log('[OAuth Init] Base URL:', baseUrl);
    console.log('[OAuth Init] Google credentials:', {
        hasClientId: !!env.GOOGLE_CLIENT_ID,
        hasSecret: !!env.GOOGLE_CLIENT_SECRET,
        redirectUri: `${baseUrl}/auth/google/callback`
    });
    
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

// Middleware to check authentication
export async function requireAuth(c: Context, next: () => Promise<void>) {
    const token = getCookie(c, 'session_token');
    
    if (!token) {
        return c.json({ error: 'Unauthorized', message: 'Please login to continue' }, 401);
    }
    
    const session = getSession(token);
    
    if (!session) {
        return c.json({ error: 'Unauthorized', message: 'Invalid session' }, 401);
    }
    
    // Attach session to context
    c.set('session', session);
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

// Helper to get current user
export function getCurrentUser(c: Context): Session | null {
    const token = getCookie(c, 'session_token');
    if (!token) return null;
    return getSession(token);
}
