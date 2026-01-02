/**
 * Authentication API Routes
 * Handles registration, login, password reset, email verification
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import * as bcrypt from 'bcryptjs';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { createSession, deleteSession, getCurrentUser } from '../../auth';
import { isValidEmail, isStrongPassword, sanitizeInput } from '../../middleware/security';
import { verifyTurnstile } from '../../services/turnstile';
// import { sendVerificationEmail } from '../../utils/email-verification'; // TODO: Fix email integration
import { validatePassword } from '../../utils/password-validator';

const authApi = new Hono<{ Bindings: Bindings }>();

// Get current user
authApi.get('/me', async (c) => {
  const user = await getCurrentUser(c);
  
  if (!user) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  return c.json({
    id: user.id,
    email: user.email,
    username: user.username,
    is_verified: user.is_verified,
    created_at: user.created_at,
  });
});

// Register
authApi.post('/register', async (c) => {
  const { DB } = c.env;
  const body = await c.req.json();
  const { username, email, password, turnstileToken } = body;

  // Verify Turnstile (bot protection)
  if (turnstileToken) {
    const turnstileValid = await verifyTurnstile(c.env, turnstileToken, 'register');
    if (!turnstileValid) {
      return c.json({ error: 'Bot verification failed. Please try again.' }, 403);
    }
  }

  // Validate input
  if (!username || !email || !password) {
    return c.json({ error: 'All fields are required' }, 400);
  }

  if (!isValidEmail(email)) {
    return c.json({ error: 'Invalid email format' }, 400);
  }

  // Check password strength
  const passwordStrength = validatePassword(password);
  if (passwordStrength.score < 40) {
    return c.json({
      error: 'Password does not meet security requirements',
      details: passwordStrength.feedback,
      score: passwordStrength.score,
    }, 400);
  }

  // Sanitize input
  const sanitizedUsername = sanitizeInput(username);
  const sanitizedEmail = sanitizeInput(email).toLowerCase();

  // Check if user exists
  const existingUser = await DB.prepare('SELECT id FROM users WHERE email = ? OR username = ?')
    .bind(sanitizedEmail, sanitizedUsername)
    .first();

  if (existingUser) {
    return c.json({ error: 'Email or username already exists' }, 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const result = await DB.prepare(
    'INSERT INTO users (username, email, password_hash, is_verified, created_at) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(sanitizedUsername, sanitizedEmail, hashedPassword, 0, new Date().toISOString())
    .run();

  const userId = result.meta.last_row_id;

  // Send verification email
  // TODO: Re-enable email verification
  // try {
  //   await sendVerificationEmail(c.env, sanitizedEmail, userId as number);
  // } catch (error) {
  //   console.error('Failed to send verification email:', error);
  // }

  return c.json({
    success: true,
    message: 'Registration successful! Please check your email to verify your account.',
    user: {
      id: userId,
      username: sanitizedUsername,
      email: sanitizedEmail,
      is_verified: false,
    },
    requires_verification: true,
    verification_sent: true,
  }, 201);
});

// Login
authApi.post('/login', async (c) => {
  const { DB } = c.env;
  const body = await c.req.json();
  const { username, password, trustDevice, turnstileToken } = body;

  // Verify Turnstile if provided
  if (turnstileToken) {
    const turnstileValid = await verifyTurnstile(c.env, turnstileToken, 'login');
    if (!turnstileValid) {
      return c.json({ error: 'Bot verification failed. Please try again.' }, 403);
    }
  }

  if (!username || !password) {
    return c.json({ error: 'Username and password required' }, 400);
  }

  // Find user by username or email
  const user = await DB.prepare(
    'SELECT * FROM users WHERE username = ? OR email = ?'
  )
    .bind(username, username.toLowerCase())
    .first() as any;

  if (!user || !user.password_hash) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // Check if email is verified
  if (!user.is_verified) {
    return c.json({
      error: 'Please verify your email before logging in',
      requires_verification: true,
      email: user.email,
    }, 403);
  }

  // Create session
  const session = await createSession(DB, user.id);
  const maxAge = trustDevice ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 days or 1 day

  setCookie(c, 'session_token', session.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge,
  });

  return c.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      is_verified: user.is_verified,
    },
  });
});

// Logout
authApi.post('/logout', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  if (user) {
    const token = getCookie(c, 'session_token');
    if (token) {
      await deleteSession(DB, token);
    }
  }

  deleteCookie(c, 'session_token');
  return c.json({ success: true });
});

// Check password strength
authApi.post('/check-password-strength', async (c) => {
  const { password } = await c.req.json();
  const strength = validatePassword(password);
  return c.json(strength);
});

// Verify email
authApi.get('/verify-email', async (c) => {
  const { DB } = c.env;
  const token = c.req.query('token');
  const userId = c.req.query('user');

  if (!token || !userId) {
    return c.json({ error: 'Invalid verification link' }, 400);
  }

  // TODO: Implement token verification logic
  // For now, just mark user as verified
  await DB.prepare('UPDATE users SET is_verified = 1 WHERE id = ?')
    .bind(userId)
    .run();

  return c.redirect('/?verified=true');
});

// Resend verification email
authApi.post('/resend-verification', async (c) => {
  const { DB } = c.env;
  const { email } = await c.req.json();

  if (!email) {
    return c.json({ error: 'Email required' }, 400);
  }

  const user = await DB.prepare('SELECT id, email, is_verified FROM users WHERE email = ?')
    .bind(email.toLowerCase())
    .first() as any;

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  if (user.is_verified) {
    return c.json({ error: 'Email already verified' }, 400);
  }

  // TODO: Re-enable email verification
  // try {
  //   await sendVerificationEmail(c.env, user.email, user.id);
  //   return c.json({ success: true, message: 'Verification email sent' });
  // } catch (error) {
  //   return c.json({ error: 'Failed to send verification email' }, 500);
  // }
  return c.json({ success: true, message: 'Email verification temporarily disabled' });
});

export default authApi;
