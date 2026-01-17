// Authentication routes
import { Hono } from 'hono';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import type { Env, Variables, AuthInput } from '../types';
import {
  createUser,
  getUserByEmail,
  verifyPassword,
  createSession,
  deleteSession
} from '../lib/db';
import { sendWelcomeEmail } from '../services/resend';

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

// Login page
auth.get('/login', (c) => {
  const error = c.req.query('error');
  return c.html(loginPage(error));
});

// Register page
auth.get('/register', (c) => {
  return c.html(registerPage());
});

// API: Register
auth.post('/api/auth/register', async (c) => {
  try {
    const body = await c.req.json<AuthInput & { turnstileToken?: string }>();
    const { email, password, name, turnstileToken } = body;
    
    // Verify Turnstile token (skip for localhost)
    const clientIp = c.req.header('CF-Connecting-IP') || 
                     c.req.header('X-Forwarded-For')?.split(',')[0] || 
                     '127.0.0.1';
    const isLocalhost = clientIp === '127.0.0.1' || clientIp === '::1';
    
    if (!isLocalhost && c.env.TURNSTILE_SECRET_KEY && turnstileToken) {
      const formData = new URLSearchParams();
      formData.append('secret', c.env.TURNSTILE_SECRET_KEY);
      formData.append('response', turnstileToken);
      formData.append('remoteip', clientIp);
      
      const verifyResponse = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        { method: 'POST', body: formData }
      );
      
      const result = await verifyResponse.json() as { success: boolean };
      if (!result.success) {
        return c.json({ error: 'Bot verification failed. Please try again.' }, 403);
      }
    }
    
    // Validation
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }
    
    // Check if email exists
    const existing = await getUserByEmail(c.env.DB, email);
    if (existing) {
      return c.json({ error: 'Email already registered' }, 400);
    }
    
    // Create user
    const user = await createUser(c.env.DB, email, password, name);
    if (!user) {
      return c.json({ error: 'Failed to create user' }, 500);
    }
    
    // Create session
    const sessionToken = await createSession(c.env.DB, user.id);
    
    // Set cookie
    setCookie(c, 'session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    // Send welcome email (async, don't wait)
    if (c.env.RESEND_API_KEY && c.env.FROM_EMAIL) {
      sendWelcomeEmail(
        c.env.RESEND_API_KEY,
        c.env.FROM_EMAIL,
        user.email,
        name || 'there'
      ).catch(err => console.error('Welcome email error:', err));
    }
    
    return c.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// API: Login
auth.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json<AuthInput & { turnstileToken?: string }>();
    const { email, password, turnstileToken } = body;
    
    // Verify Turnstile token (skip for localhost)
    const clientIp = c.req.header('CF-Connecting-IP') || 
                     c.req.header('X-Forwarded-For')?.split(',')[0] || 
                     '127.0.0.1';
    const isLocalhost = clientIp === '127.0.0.1' || clientIp === '::1';
    
    if (!isLocalhost && c.env.TURNSTILE_SECRET_KEY && turnstileToken) {
      const formData = new URLSearchParams();
      formData.append('secret', c.env.TURNSTILE_SECRET_KEY);
      formData.append('response', turnstileToken);
      formData.append('remoteip', clientIp);
      
      const verifyResponse = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        { method: 'POST', body: formData }
      );
      
      const result = await verifyResponse.json() as { success: boolean };
      if (!result.success) {
        return c.json({ error: 'Bot verification failed. Please try again.' }, 403);
      }
    }
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    // Find user
    const user = await getUserByEmail(c.env.DB, email);
    if (!user || !user.password_hash) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Verify password
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Create session
    const sessionToken = await createSession(c.env.DB, user.id);
    
    // Set cookie
    setCookie(c, 'session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });
    
    return c.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// API: Logout
auth.post('/api/auth/logout', async (c) => {
  const sessionToken = getCookie(c, 'session');
  
  if (sessionToken) {
    await deleteSession(c.env.DB, sessionToken);
  }
  
  deleteCookie(c, 'session', { path: '/' });
  
  return c.json({ success: true });
});

// API: Get current user
auth.get('/api/auth/me', async (c) => {
  const { getCurrentUser } = await import('../middleware/auth');
  const user = await getCurrentUser(c);
  
  if (!user) {
    return c.json({ user: null }, 200);
  }
  
  return c.json({ user });
});

// HTML Templates
function loginPage(error?: string): string {
  const errorMessage = error ? getErrorMessage(error) : '';
  return `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <h1 class="text-3xl font-bold text-center mb-8">🎭 MoodMash</h1>
    <div class="bg-gray-800 rounded-xl p-6 shadow-xl">
      <h2 class="text-2xl font-semibold mb-6 text-center">Login</h2>
      
      ${errorMessage ? `<div class="mb-4 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">${errorMessage}</div>` : ''}
      
      <!-- OAuth Buttons -->
      <div class="space-y-3 mb-6">
        <a href="/api/auth/google" class="flex items-center justify-center gap-3 w-full py-3 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100 transition-colors">
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </a>
        <a href="/api/auth/github" class="flex items-center justify-center gap-3 w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          Continue with GitHub
        </a>
      </div>
      
      <div class="relative mb-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-600"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-gray-800 text-gray-400">or continue with email</span>
        </div>
      </div>
      
      <form id="loginForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Email</label>
          <input type="email" name="email" required
            class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Password</label>
          <input type="password" name="password" required
            class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
        </div>
        <div id="error" class="text-red-400 text-sm hidden"></div>
        <button type="submit"
          class="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors">
          Login
        </button>
      </form>
      <div class="mt-4 flex justify-between text-sm">
        <a href="/forgot-password" class="text-gray-400 hover:text-white">Forgot password?</a>
        <a href="/register" class="text-blue-400 hover:underline">Create account</a>
      </div>
    </div>
  </div>
  <script src="/static/app.js"></script>
</body>
</html>
`;
}

function registerPage(): string {
  return `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Register - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <h1 class="text-3xl font-bold text-center mb-8">🎭 MoodMash</h1>
    <div class="bg-gray-800 rounded-xl p-6 shadow-xl">
      <h2 class="text-2xl font-semibold mb-6 text-center">Create Account</h2>
      
      <!-- OAuth Buttons -->
      <div class="space-y-3 mb-6">
        <a href="/api/auth/google" class="flex items-center justify-center gap-3 w-full py-3 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100 transition-colors">
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up with Google
        </a>
        <a href="/api/auth/github" class="flex items-center justify-center gap-3 w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          Sign up with GitHub
        </a>
      </div>
      
      <div class="relative mb-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-600"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-gray-800 text-gray-400">or create with email</span>
        </div>
      </div>
      
      <form id="registerForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Name (optional)</label>
          <input type="text" name="name"
            class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Email</label>
          <input type="email" name="email" required
            class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Password (min 8 characters)</label>
          <input type="password" name="password" required minlength="8"
            class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
        </div>
        <div id="error" class="text-red-400 text-sm hidden"></div>
        <button type="submit"
          class="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors">
          Create Account
        </button>
      </form>
      <p class="mt-4 text-center text-gray-400">
        Already have an account? <a href="/login" class="text-blue-400 hover:underline">Login</a>
      </p>
    </div>
  </div>
  <script src="/static/app.js"></script>
</body>
</html>
`;
}

function getErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    'oauth_not_configured': 'OAuth login is not configured yet.',
    'token_exchange_failed': 'Authentication failed. Please try again.',
    'user_info_failed': 'Could not get user info. Please try again.',
    'user_creation_failed': 'Account creation failed. Please try again.',
    'email_required': 'Email is required. Please use an account with a verified email.',
    'oauth_failed': 'Authentication failed. Please try again.',
    'invalid_state': 'Invalid request. Please try again.',
    'no_code': 'Authentication cancelled.',
  };
  return messages[error] || 'An error occurred. Please try again.';
}

export default auth;
