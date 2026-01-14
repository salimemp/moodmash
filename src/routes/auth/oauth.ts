/**
 * Authentication Routes
 * Handles all authentication-related endpoints (OAuth flows)
 */

import { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import {
  initOAuthProviders,
  createDbSession,
  deleteDbSession,
  getCurrentUser,
} from '../../auth';

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Google OAuth - Initiate
auth.get('/google', async (c) => {
  const providers = initOAuthProviders(c.env);
  
  if (!providers.google) {
    return c.json({ error: 'Google OAuth not configured' }, 500);
  }
  
  const state = crypto.randomUUID();
  const codeVerifier = crypto.randomUUID();
  
  // Store state and code_verifier in cookies
  setCookie(c, 'oauth_state', state, { httpOnly: true, secure: true, sameSite: 'Lax' });
  setCookie(c, 'code_verifier', codeVerifier, { httpOnly: true, secure: true, sameSite: 'Lax' });
  
  const authUrl = providers.google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);
  return c.redirect(authUrl.toString());
});

// Google OAuth - Callback
auth.get('/google/callback', async (c) => {
  const { DB } = c.env;
  const code = c.req.query('code');
  const state = c.req.query('state');
  const storedState = getCookie(c, 'oauth_state');
  const codeVerifier = getCookie(c, 'code_verifier');

  if (!code || !state || state !== storedState || !codeVerifier) {
    return c.redirect('/?error=oauth_failed');
  }

  try {
    const providers = initOAuthProviders(c.env);
    
    if (!providers.google) {
      return c.redirect('/?error=oauth_not_configured');
    }
    
    const tokens = await providers.google.validateAuthorizationCode(code, codeVerifier);
    
    // Fetch user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.accessToken()}` },
    });
    const oauthUser = await userResponse.json() as { email: string; name: string; id: string };

    // Check if user exists
    interface DbUserRow {
      id: number;
      email: string;
      username: string;
    }
    
    let dbUser = await DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(oauthUser.email)
      .first<DbUserRow>();

    if (!dbUser) {
      // Create new user
      const result = await DB.prepare(
        'INSERT INTO users (email, username, oauth_provider, oauth_id, is_verified, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
        .bind(oauthUser.email, oauthUser.name, 'google', oauthUser.id, 1, new Date().toISOString())
        .run();

      dbUser = await DB.prepare('SELECT * FROM users WHERE id = ?')
        .bind(result.meta.last_row_id)
        .first<DbUserRow>();
    }

    if (!dbUser) {
      return c.redirect('/?error=user_creation_failed');
    }

    // Create session
    const session = await createDbSession(DB, dbUser.id, 30);
    setCookie(c, 'session_token', session.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Clean up OAuth cookies
    deleteCookie(c, 'oauth_state');
    deleteCookie(c, 'code_verifier');

    return c.redirect('/');
  } catch (error) {
    console.error('OAuth error:', error);
    return c.redirect('/?error=oauth_failed');
  }
});

// GitHub OAuth - Initiate
auth.get('/github', async (c) => {
  const providers = initOAuthProviders(c.env);
  
  if (!providers.github) {
    return c.json({ error: 'GitHub OAuth not configured' }, 500);
  }
  
  const state = crypto.randomUUID();
  
  setCookie(c, 'oauth_state', state, { httpOnly: true, secure: true, sameSite: 'Lax' });
  
  const authUrl = await providers.github.createAuthorizationURL(state, ['user:email']);
  return c.redirect(authUrl.toString());
});

// GitHub OAuth - Callback
auth.get('/github/callback', async (c) => {
  const { DB } = c.env;
  const code = c.req.query('code');
  const state = c.req.query('state');
  const storedState = getCookie(c, 'oauth_state');

  if (!code || !state || state !== storedState) {
    return c.redirect('/?error=oauth_failed');
  }

  try {
    const providers = initOAuthProviders(c.env);
    
    if (!providers.github) {
      return c.redirect('/?error=oauth_not_configured');
    }
    
    const tokens = await providers.github.validateAuthorizationCode(code);
    
    // Fetch user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
        'User-Agent': 'MoodMash',
      },
    });
    const oauthUser = await userResponse.json() as { email: string; login: string; id: number };

    // Check if user exists
    interface DbUserRow {
      id: number;
      email: string;
      username: string;
    }
    
    let dbUser = await DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(oauthUser.email)
      .first<DbUserRow>();

    if (!dbUser) {
      // Create new user
      const result = await DB.prepare(
        'INSERT INTO users (email, username, oauth_provider, oauth_id, is_verified, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
        .bind(oauthUser.email, oauthUser.login, 'github', String(oauthUser.id), 1, new Date().toISOString())
        .run();

      dbUser = await DB.prepare('SELECT * FROM users WHERE id = ?')
        .bind(result.meta.last_row_id)
        .first<DbUserRow>();
    }

    if (!dbUser) {
      return c.redirect('/?error=user_creation_failed');
    }

    // Create session
    const session = await createDbSession(DB, dbUser.id, 30);
    setCookie(c, 'session_token', session.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    deleteCookie(c, 'oauth_state');

    return c.redirect('/');
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return c.redirect('/?error=oauth_failed');
  }
});

// Logout
auth.post('/logout', async (c) => {
  const { DB } = c.env;
  const token = getCookie(c, 'session_token');

  if (token) {
    await deleteDbSession(DB, token);
    deleteCookie(c, 'session_token');
  }

  return c.json({ success: true });
});

export default auth;
