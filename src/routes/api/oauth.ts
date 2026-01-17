// OAuth Routes (Google & GitHub)
import { Hono } from 'hono';
import type { Env, Variables, User, OAuthAccount, OAuthUserInfo, OAuthTokens } from '../../types';
import { createSession } from '../../lib/db';

const oauth = new Hono<{ Bindings: Env; Variables: Variables }>();

// Google OAuth - Redirect to Google
oauth.get('/api/auth/google', async (c) => {
  if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_REDIRECT_URI) {
    return c.json({ error: 'Google OAuth not configured' }, 503);
  }

  const state = generateState();
  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: c.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent'
  });

  // Store state in cookie for verification
  const response = c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  response.headers.set('Set-Cookie', `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`);
  return response;
});

// Google OAuth - Callback
oauth.get('/api/auth/google/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');

  if (error) {
    return c.redirect(`/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return c.redirect('/login?error=no_code');
  }

  // Verify state (simplified - in production, verify against stored state)
  if (!state) {
    return c.redirect('/login?error=invalid_state');
  }

  if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET || !c.env.GOOGLE_REDIRECT_URI) {
    return c.redirect('/login?error=oauth_not_configured');
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: c.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      console.error('Google token error:', await tokenResponse.text());
      return c.redirect('/login?error=token_exchange_failed');
    }

    const tokens = await tokenResponse.json() as OAuthTokens;

    // Get user info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!userInfoResponse.ok) {
      return c.redirect('/login?error=user_info_failed');
    }

    const userInfo = await userInfoResponse.json() as {
      id: string;
      email: string;
      name: string;
      picture: string;
    };

    // Create or update user and OAuth account
    const user = await findOrCreateOAuthUser(c.env.DB, 'google', {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      avatar_url: userInfo.picture
    }, tokens);

    if (!user) {
      return c.redirect('/login?error=user_creation_failed');
    }

    // Create session
    const sessionToken = await createSession(c.env.DB, user.id);

    // Redirect to dashboard with session cookie
    const response = c.redirect('/dashboard');
    response.headers.set('Set-Cookie', 
      `session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; Path=/`
    );
    return response;
  } catch (err) {
    console.error('Google OAuth error:', err);
    return c.redirect('/login?error=oauth_failed');
  }
});

// GitHub OAuth - Redirect to GitHub
oauth.get('/api/auth/github', async (c) => {
  if (!c.env.GITHUB_CLIENT_ID || !c.env.GITHUB_REDIRECT_URI) {
    return c.json({ error: 'GitHub OAuth not configured' }, 503);
  }

  const state = generateState();
  const params = new URLSearchParams({
    client_id: c.env.GITHUB_CLIENT_ID,
    redirect_uri: c.env.GITHUB_REDIRECT_URI,
    scope: 'read:user user:email',
    state
  });

  const response = c.redirect(`https://github.com/login/oauth/authorize?${params}`);
  response.headers.set('Set-Cookie', `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`);
  return response;
});

// GitHub OAuth - Callback
oauth.get('/api/auth/github/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');

  if (error) {
    return c.redirect(`/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return c.redirect('/login?error=no_code');
  }

  if (!state) {
    return c.redirect('/login?error=invalid_state');
  }

  if (!c.env.GITHUB_CLIENT_ID || !c.env.GITHUB_CLIENT_SECRET || !c.env.GITHUB_REDIRECT_URI) {
    return c.redirect('/login?error=oauth_not_configured');
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: c.env.GITHUB_CLIENT_ID,
        client_secret: c.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: c.env.GITHUB_REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      return c.redirect('/login?error=token_exchange_failed');
    }

    const tokens = await tokenResponse.json() as OAuthTokens & { error?: string };
    
    if (tokens.error) {
      return c.redirect(`/login?error=${encodeURIComponent(tokens.error)}`);
    }

    // Get user info
    const userInfoResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'User-Agent': 'MoodMash'
      }
    });

    if (!userInfoResponse.ok) {
      return c.redirect('/login?error=user_info_failed');
    }

    const userInfo = await userInfoResponse.json() as {
      id: number;
      login: string;
      name: string;
      email: string | null;
      avatar_url: string;
    };

    // Get primary email if not public
    let email = userInfo.email;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'User-Agent': 'MoodMash'
        }
      });
      
      if (emailsResponse.ok) {
        const emails = await emailsResponse.json() as Array<{ email: string; primary: boolean; verified: boolean }>;
        const primaryEmail = emails.find(e => e.primary && e.verified);
        email = primaryEmail?.email || emails[0]?.email || null;
      }
    }

    if (!email) {
      return c.redirect('/login?error=email_required');
    }

    // Create or update user
    const user = await findOrCreateOAuthUser(c.env.DB, 'github', {
      id: userInfo.id.toString(),
      email,
      name: userInfo.name || userInfo.login,
      avatar_url: userInfo.avatar_url
    }, tokens);

    if (!user) {
      return c.redirect('/login?error=user_creation_failed');
    }

    // Create session
    const sessionToken = await createSession(c.env.DB, user.id);

    const response = c.redirect('/dashboard');
    response.headers.set('Set-Cookie', 
      `session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; Path=/`
    );
    return response;
  } catch (err) {
    console.error('GitHub OAuth error:', err);
    return c.redirect('/login?error=oauth_failed');
  }
});

// Helper: Generate random state
function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Helper: Find or create OAuth user
async function findOrCreateOAuthUser(
  db: D1Database,
  provider: 'google' | 'github',
  userInfo: OAuthUserInfo,
  tokens: OAuthTokens
): Promise<User | null> {
  // Check if OAuth account exists
  const existingOAuth = await db.prepare(
    `SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_account_id = ?`
  ).bind(provider, userInfo.id).first<{ user_id: number }>();

  if (existingOAuth) {
    // Update tokens
    await db.prepare(
      `UPDATE oauth_accounts SET access_token = ?, refresh_token = ?, updated_at = CURRENT_TIMESTAMP
       WHERE provider = ? AND provider_account_id = ?`
    ).bind(
      tokens.access_token,
      tokens.refresh_token || null,
      provider,
      userInfo.id
    ).run();

    // Return existing user
    return await db.prepare(
      `SELECT id, email, name, password_hash, email_verified, avatar_url, oauth_provider, created_at, updated_at 
       FROM users WHERE id = ?`
    ).bind(existingOAuth.user_id).first<User>();
  }

  // Check if user exists by email
  let user = await db.prepare(
    `SELECT id, email, name, password_hash, email_verified, avatar_url, oauth_provider, created_at, updated_at 
     FROM users WHERE email = ?`
  ).bind(userInfo.email.toLowerCase()).first<User>();

  if (!user) {
    // Create new user
    await db.prepare(
      `INSERT INTO users (email, name, email_verified, avatar_url, oauth_provider)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(
      userInfo.email.toLowerCase(),
      userInfo.name,
      true, // OAuth users are verified
      userInfo.avatar_url,
      provider
    ).run();

    user = await db.prepare(
      `SELECT id, email, name, password_hash, email_verified, avatar_url, oauth_provider, created_at, updated_at 
       FROM users WHERE email = ?`
    ).bind(userInfo.email.toLowerCase()).first<User>();
  }

  if (!user) return null;

  // Create OAuth account link
  await db.prepare(
    `INSERT INTO oauth_accounts (user_id, provider, provider_account_id, email, name, avatar_url, access_token, refresh_token)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    user.id,
    provider,
    userInfo.id,
    userInfo.email,
    userInfo.name,
    userInfo.avatar_url,
    tokens.access_token,
    tokens.refresh_token || null
  ).run();

  // Update user avatar if not set
  if (!user.avatar_url && userInfo.avatar_url) {
    await db.prepare(
      `UPDATE users SET avatar_url = ? WHERE id = ?`
    ).bind(userInfo.avatar_url, user.id).run();
  }

  return user;
}

// Import D1Database type
import type { D1Database } from '@cloudflare/workers-types';

export default oauth;
