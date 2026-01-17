// Password Reset & Email Verification Routes
import { Hono } from 'hono';
import { hash } from 'bcryptjs';
import type { Env, Variables, User, PasswordReset } from '../../types';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../../services/resend';
import { getCurrentUser } from '../../middleware/auth';

const passwordRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Request password reset
passwordRoutes.post('/api/auth/forgot-password', async (c) => {
  const body = await c.req.json<{ email: string }>();
  const { email } = body;

  if (!email) {
    return c.json({ error: 'Email is required' }, 400);
  }

  // Find user
  const user = await c.env.DB.prepare(
    `SELECT id, email, name FROM users WHERE email = ?`
  ).bind(email.toLowerCase()).first<User>();

  // Always return success to prevent email enumeration
  if (!user) {
    return c.json({ success: true, message: 'If the email exists, a reset link will be sent.' });
  }

  // Generate reset token
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  // Delete any existing reset tokens for this user
  await c.env.DB.prepare(
    `DELETE FROM password_resets WHERE user_id = ?`
  ).bind(user.id).run();

  // Create new reset token
  await c.env.DB.prepare(
    `INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)`
  ).bind(user.id, token, expiresAt).run();

  // Send email
  if (c.env.RESEND_API_KEY && c.env.FROM_EMAIL) {
    const appUrl = c.env.APP_URL || `https://${c.req.header('host')}`;
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    
    await sendPasswordResetEmail(
      c.env.RESEND_API_KEY,
      c.env.FROM_EMAIL,
      user.email,
      resetUrl
    );
  }

  return c.json({ success: true, message: 'If the email exists, a reset link will be sent.' });
});

// Verify reset token
passwordRoutes.get('/api/auth/verify-reset-token', async (c) => {
  const token = c.req.query('token');

  if (!token) {
    return c.json({ valid: false, error: 'Token is required' }, 400);
  }

  const reset = await c.env.DB.prepare(
    `SELECT id, expires_at, used FROM password_resets WHERE token = ?`
  ).bind(token).first<PasswordReset>();

  if (!reset) {
    return c.json({ valid: false, error: 'Invalid token' });
  }

  if (reset.used) {
    return c.json({ valid: false, error: 'Token already used' });
  }

  if (new Date(reset.expires_at) < new Date()) {
    return c.json({ valid: false, error: 'Token expired' });
  }

  return c.json({ valid: true });
});

// Reset password
passwordRoutes.post('/api/auth/reset-password', async (c) => {
  const body = await c.req.json<{ token: string; password: string }>();
  const { token, password } = body;

  if (!token || !password) {
    return c.json({ error: 'Token and password are required' }, 400);
  }

  if (password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters' }, 400);
  }

  // Find reset token
  const reset = await c.env.DB.prepare(
    `SELECT id, user_id, expires_at, used FROM password_resets WHERE token = ?`
  ).bind(token).first<PasswordReset>();

  if (!reset) {
    return c.json({ error: 'Invalid token' }, 400);
  }

  if (reset.used) {
    return c.json({ error: 'Token already used' }, 400);
  }

  if (new Date(reset.expires_at) < new Date()) {
    return c.json({ error: 'Token expired' }, 400);
  }

  // Hash new password
  const passwordHash = await hash(password, 10);

  // Update user password
  await c.env.DB.prepare(
    `UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(passwordHash, reset.user_id).run();

  // Mark token as used
  await c.env.DB.prepare(
    `UPDATE password_resets SET used = TRUE WHERE id = ?`
  ).bind(reset.id).run();

  // Delete all sessions for this user (force re-login)
  await c.env.DB.prepare(
    `DELETE FROM sessions WHERE user_id = ?`
  ).bind(reset.user_id).run();

  return c.json({ success: true, message: 'Password reset successfully. Please log in.' });
});

// Change password (authenticated)
passwordRoutes.post('/api/auth/change-password', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json<{ currentPassword: string; newPassword: string }>();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return c.json({ error: 'Current and new passwords are required' }, 400);
  }

  if (newPassword.length < 8) {
    return c.json({ error: 'New password must be at least 8 characters' }, 400);
  }

  // Get user with password
  const fullUser = await c.env.DB.prepare(
    `SELECT password_hash FROM users WHERE id = ?`
  ).bind(user.id).first<{ password_hash: string | null }>();

  if (!fullUser?.password_hash) {
    return c.json({ error: 'Cannot change password for OAuth-only accounts' }, 400);
  }

  // Verify current password
  const { compare } = await import('bcryptjs');
  const valid = await compare(currentPassword, fullUser.password_hash);

  if (!valid) {
    return c.json({ error: 'Current password is incorrect' }, 400);
  }

  // Hash new password
  const passwordHash = await hash(newPassword, 10);

  // Update password
  await c.env.DB.prepare(
    `UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(passwordHash, user.id).run();

  return c.json({ success: true, message: 'Password changed successfully' });
});

// Send welcome email (called after registration)
passwordRoutes.post('/api/auth/send-welcome', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (!c.env.RESEND_API_KEY || !c.env.FROM_EMAIL) {
    return c.json({ error: 'Email not configured' }, 503);
  }

  const sent = await sendWelcomeEmail(
    c.env.RESEND_API_KEY,
    c.env.FROM_EMAIL,
    user.email,
    user.name || 'there'
  );

  return c.json({ success: sent });
});

// Helper: Generate secure token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export default passwordRoutes;
