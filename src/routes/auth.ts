// Authentication routes
import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import type { Env, Variables, AuthInput } from '../types';
import {
  createUser,
  getUserByEmail,
  verifyPassword,
  createSession,
  deleteSession
} from '../lib/db';
import { getCookie } from 'hono/cookie';

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

// Login page
auth.get('/login', (c) => {
  return c.html(loginPage());
});

// Register page
auth.get('/register', (c) => {
  return c.html(registerPage());
});

// API: Register
auth.post('/api/auth/register', async (c) => {
  try {
    const body = await c.req.json<AuthInput>();
    const { email, password, name } = body;
    
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
    const body = await c.req.json<AuthInput>();
    const { email, password } = body;
    
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
function loginPage(): string {
  return `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen flex items-center justify-center">
  <div class="w-full max-w-md p-8">
    <h1 class="text-3xl font-bold text-center mb-8">🎭 MoodMash</h1>
    <div class="bg-gray-800 rounded-lg p-6 shadow-xl">
      <h2 class="text-2xl font-semibold mb-6 text-center">Login</h2>
      <form id="loginForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Email</label>
          <input type="email" name="email" required
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Password</label>
          <input type="password" name="password" required
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
        </div>
        <div id="error" class="text-red-400 text-sm hidden"></div>
        <button type="submit"
          class="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors">
          Login
        </button>
      </form>
      <p class="mt-4 text-center text-gray-400">
        Don't have an account? <a href="/register" class="text-blue-400 hover:underline">Register</a>
      </p>
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
<body class="bg-gray-900 text-white min-h-screen flex items-center justify-center">
  <div class="w-full max-w-md p-8">
    <h1 class="text-3xl font-bold text-center mb-8">🎭 MoodMash</h1>
    <div class="bg-gray-800 rounded-lg p-6 shadow-xl">
      <h2 class="text-2xl font-semibold mb-6 text-center">Create Account</h2>
      <form id="registerForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Name (optional)</label>
          <input type="text" name="name"
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Email</label>
          <input type="email" name="email" required
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Password (min 8 characters)</label>
          <input type="password" name="password" required minlength="8"
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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

export default auth;
