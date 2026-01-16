// Authentication middleware
import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import type { Env, Variables, CurrentUser } from '../types';
import { getSession, getUserById } from '../lib/db';

// Get current user from session cookie
export async function getCurrentUser(
  c: Context<{ Bindings: Env; Variables: Variables }>
): Promise<CurrentUser | null> {
  const sessionToken = getCookie(c, 'session');
  
  if (!sessionToken) {
    return null;
  }
  
  const session = await getSession(c.env.DB, sessionToken);
  if (!session) {
    return null;
  }
  
  const user = await getUserById(c.env.DB, session.user_id);
  if (!user) {
    return null;
  }
  
  return {
    id: user.id,
    email: user.email,
    name: user.name
  };
}

// Middleware to require authentication
export async function requireAuth(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
): Promise<Response | void> {
  const user = await getCurrentUser(c);
  
  if (!user) {
    // Check if it's an API request
    const accept = c.req.header('Accept') || '';
    const isApi = c.req.path.startsWith('/api/') || accept.includes('application/json');
    
    if (isApi) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Redirect to login for page requests
    return c.redirect('/login');
  }
  
  c.set('user', user);
  await next();
}
