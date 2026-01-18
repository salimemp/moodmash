// Phase 5: Security & 2FA API Routes
import { Hono } from 'hono';
import type { Env, Variables } from '../../types';
import { TOTP } from 'otplib';
import * as otplibUri from '@otplib/uri';
import QRCode from 'qrcode';
import { hash as bcryptHash, compare as bcryptCompare } from 'bcryptjs';

// Create TOTP instance
const totp = new TOTP();

// Helper to generate otpauth URI
function generateOtpauthUri(email: string, issuer: string, secret: string): string {
  return otplibUri.generateTOTP({
    label: email,
    issuer,
    secret
  });
}

const security = new Hono<{ Bindings: Env; Variables: Variables }>();

// Helper: Get current user
function getCurrentUser(c: any) {
  const user = c.get('user');
  if (!user) throw new Error('Unauthorized');
  return user;
}

// Helper: Generate random string
function generateSecureCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

// Helper: Hash code
async function hashCode(code: string): Promise<string> {
  return bcryptHash(code, 10);
}

// Helper: Log security event
async function logSecurityEvent(
  db: any,
  userId: number,
  eventType: string,
  details: string,
  ipAddress?: string,
  severity: 'info' | 'warning' | 'critical' = 'info'
) {
  await db.prepare(
    `INSERT INTO security_events (user_id, event_type, details, ip_address, severity) VALUES (?, ?, ?, ?, ?)`
  ).bind(userId, eventType, details, ipAddress || 'unknown', severity).run();
}

// ==================== TOTP 2FA ====================

// POST /api/2fa/totp/setup - Generate TOTP secret and QR code
security.post('/2fa/totp/setup', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;

    // Check if TOTP already enabled
    const existing = await db.prepare(
      `SELECT * FROM two_factor_settings WHERE user_id = ? AND type = 'totp'`
    ).bind(user.id).first();

    if (existing?.enabled) {
      return c.json({ error: 'TOTP already enabled' }, 400);
    }

    // Generate secret
    const secret = totp.generateSecret();
    const appName = 'MoodMash';
    const otpauth = generateOtpauthUri(user.email, appName, secret);

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    // Store secret (not enabled yet)
    await db.prepare(
      `INSERT OR REPLACE INTO two_factor_settings (user_id, type, secret, enabled, verified)
       VALUES (?, 'totp', ?, 0, 0)`
    ).bind(user.id, secret).run();

    await logSecurityEvent(db, user.id, '2fa_setup_initiated', 'TOTP setup started');

    return c.json({
      secret,
      qrCode: qrCodeDataUrl,
      manualEntry: secret,
      instructions: 'Scan the QR code with Google Authenticator, Authy, or another TOTP app. Then verify with a 6-digit code.'
    });
  } catch (error) {
    console.error('TOTP setup error:', error);
    return c.json({ error: 'Failed to setup TOTP' }, 500);
  }
});

// POST /api/2fa/totp/verify - Verify TOTP code (during setup)
security.post('/2fa/totp/verify', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;
    const { code } = await c.req.json();

    if (!code || code.length !== 6) {
      return c.json({ error: 'Invalid code format' }, 400);
    }

    const settings = await db.prepare(
      `SELECT * FROM two_factor_settings WHERE user_id = ? AND type = 'totp'`
    ).bind(user.id).first();

    if (!settings?.secret) {
      return c.json({ error: 'TOTP not setup' }, 400);
    }

    const verifyResult = await totp.verify(code, { secret: settings.secret as string });

    if (verifyResult.valid) {
      await db.prepare(
        `UPDATE two_factor_settings SET verified = 1 WHERE user_id = ? AND type = 'totp'`
      ).bind(user.id).run();

      await logSecurityEvent(db, user.id, '2fa_verified', 'TOTP code verified successfully');

      return c.json({ success: true, message: 'Code verified. You can now enable 2FA.' });
    }

    return c.json({ error: 'Invalid code' }, 400);
  } catch (error) {
    console.error('TOTP verify error:', error);
    return c.json({ error: 'Verification failed' }, 500);
  }
});

// POST /api/2fa/totp/enable - Enable TOTP 2FA
security.post('/2fa/totp/enable', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;

    const settings = await db.prepare(
      `SELECT * FROM two_factor_settings WHERE user_id = ? AND type = 'totp'`
    ).bind(user.id).first();

    if (!settings?.verified) {
      return c.json({ error: 'TOTP not verified. Please verify a code first.' }, 400);
    }

    await db.prepare(
      `UPDATE two_factor_settings SET enabled = 1 WHERE user_id = ? AND type = 'totp'`
    ).bind(user.id).run();

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = generateSecureCode(8);
      backupCodes.push(code);
      const codeHash = await hashCode(code);
      await db.prepare(
        `INSERT INTO backup_codes (user_id, code_hash) VALUES (?, ?)`
      ).bind(user.id, codeHash).run();
    }

    await logSecurityEvent(db, user.id, '2fa_enabled', 'TOTP 2FA enabled', undefined, 'info');

    return c.json({
      success: true,
      message: '2FA enabled successfully',
      backupCodes,
      warning: 'Save these backup codes in a safe place. They can be used to access your account if you lose your authenticator.'
    });
  } catch (error) {
    console.error('Enable TOTP error:', error);
    return c.json({ error: 'Failed to enable 2FA' }, 500);
  }
});

// POST /api/2fa/totp/disable - Disable TOTP 2FA
security.post('/2fa/totp/disable', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;
    const { code, password } = await c.req.json();

    // Verify with either TOTP code or password
    const settings = await db.prepare(
      `SELECT * FROM two_factor_settings WHERE user_id = ? AND type = 'totp' AND enabled = 1`
    ).bind(user.id).first();

    if (!settings) {
      return c.json({ error: '2FA not enabled' }, 400);
    }

    let verified = false;

    if (code) {
      const verifyResult = await totp.verify(code, { secret: settings.secret as string });
      verified = verifyResult.valid;
    } else if (password) {
      const userRecord = await db.prepare(
        `SELECT password_hash FROM users WHERE id = ?`
      ).bind(user.id).first();
      if (userRecord?.password_hash) {
        verified = await bcryptCompare(password, userRecord.password_hash as string);
      }
    }

    if (!verified) {
      return c.json({ error: 'Invalid verification' }, 400);
    }

    // Disable and remove backup codes
    await db.prepare(
      `UPDATE two_factor_settings SET enabled = 0, verified = 0, secret = NULL WHERE user_id = ? AND type = 'totp'`
    ).bind(user.id).run();

    await db.prepare(
      `DELETE FROM backup_codes WHERE user_id = ?`
    ).bind(user.id).run();

    await logSecurityEvent(db, user.id, '2fa_disabled', 'TOTP 2FA disabled', undefined, 'warning');

    return c.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Disable TOTP error:', error);
    return c.json({ error: 'Failed to disable 2FA' }, 500);
  }
});

// GET /api/2fa/status - Get 2FA status
security.get('/2fa/status', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;

    const totp = await db.prepare(
      `SELECT type, enabled, verified FROM two_factor_settings WHERE user_id = ? AND type = 'totp'`
    ).bind(user.id).first();

    const email = await db.prepare(
      `SELECT type, enabled, verified FROM two_factor_settings WHERE user_id = ? AND type = 'email'`
    ).bind(user.id).first();

    const backupCount = await db.prepare(
      `SELECT COUNT(*) as count FROM backup_codes WHERE user_id = ? AND used = 0`
    ).bind(user.id).first();

    return c.json({
      totp: {
        enabled: !!totp?.enabled,
        verified: !!totp?.verified
      },
      email: {
        enabled: !!email?.enabled,
        verified: !!email?.verified
      },
      backupCodesRemaining: backupCount?.count || 0
    });
  } catch (error) {
    console.error('2FA status error:', error);
    return c.json({ error: 'Failed to get 2FA status' }, 500);
  }
});

// ==================== BACKUP CODES ====================

// GET /api/2fa/backup-codes - Get remaining backup codes count
security.get('/2fa/backup-codes', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;

    const result = await db.prepare(
      `SELECT COUNT(*) as remaining FROM backup_codes WHERE user_id = ? AND used = 0`
    ).bind(user.id).first();

    return c.json({ remaining: result?.remaining || 0 });
  } catch (error) {
    console.error('Backup codes error:', error);
    return c.json({ error: 'Failed to get backup codes' }, 500);
  }
});

// POST /api/2fa/backup-codes/regenerate - Regenerate backup codes
security.post('/2fa/backup-codes/regenerate', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;
    const { code } = await c.req.json();

    // Verify current 2FA code
    const settings = await db.prepare(
      `SELECT * FROM two_factor_settings WHERE user_id = ? AND type = 'totp' AND enabled = 1`
    ).bind(user.id).first();

    if (!settings) {
      return c.json({ error: '2FA not enabled' }, 400);
    }

    const verifyResult = await totp.verify(code, { secret: settings.secret as string });
    if (!verifyResult.valid) {
      return c.json({ error: 'Invalid verification code' }, 400);
    }

    // Delete old backup codes
    await db.prepare(
      `DELETE FROM backup_codes WHERE user_id = ?`
    ).bind(user.id).run();

    // Generate new backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      const newCode = generateSecureCode(8);
      backupCodes.push(newCode);
      const codeHash = await hashCode(newCode);
      await db.prepare(
        `INSERT INTO backup_codes (user_id, code_hash) VALUES (?, ?)`
      ).bind(user.id, codeHash).run();
    }

    await logSecurityEvent(db, user.id, 'backup_codes_regenerated', 'Backup codes regenerated');

    return c.json({
      success: true,
      backupCodes,
      message: 'New backup codes generated. Previous codes are now invalid.'
    });
  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    return c.json({ error: 'Failed to regenerate codes' }, 500);
  }
});

// POST /api/2fa/backup-codes/verify - Verify a backup code
security.post('/2fa/backup-codes/verify', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;
    const { code } = await c.req.json();

    const codes = await db.prepare(
      `SELECT id, code_hash FROM backup_codes WHERE user_id = ? AND used = 0`
    ).bind(user.id).all();

    for (const row of codes.results || []) {
      const isMatch = await bcryptCompare(code, row.code_hash as string);
      if (isMatch) {
        // Mark as used
        await db.prepare(
          `UPDATE backup_codes SET used = 1, used_at = datetime('now') WHERE id = ?`
        ).bind(row.id).run();

        await logSecurityEvent(db, user.id, 'backup_code_used', 'Backup code used for authentication');

        return c.json({ success: true, message: 'Backup code verified' });
      }
    }

    return c.json({ error: 'Invalid backup code' }, 400);
  } catch (error) {
    console.error('Verify backup code error:', error);
    return c.json({ error: 'Verification failed' }, 500);
  }
});

// ==================== EMAIL 2FA ====================

// POST /api/2fa/email/send - Send 2FA code via email
security.post('/2fa/email/send', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;
    const resendApiKey = c.env.RESEND_API_KEY;
    const fromEmail = c.env.FROM_EMAIL || 'noreply@moodmash.app';

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await hashCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Clear old codes
    await db.prepare(
      `DELETE FROM email_2fa_codes WHERE user_id = ?`
    ).bind(user.id).run();

    // Store new code
    await db.prepare(
      `INSERT INTO email_2fa_codes (user_id, code_hash, expires_at) VALUES (?, ?, ?)`
    ).bind(user.id, codeHash, expiresAt).run();

    // Send email
    if (resendApiKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: user.email,
          subject: 'MoodMash - Your Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #7C3AED;">Your Verification Code</h2>
              <p>Your MoodMash verification code is:</p>
              <div style="background: #F3F4F6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #7C3AED;">${code}</span>
              </div>
              <p>This code expires in 10 minutes.</p>
              <p style="color: #6B7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
            </div>
          `
        })
      });
    }

    await logSecurityEvent(db, user.id, 'email_2fa_sent', 'Email 2FA code sent');

    return c.json({ success: true, message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Send email 2FA error:', error);
    return c.json({ error: 'Failed to send verification code' }, 500);
  }
});

// POST /api/2fa/email/verify - Verify email 2FA code
security.post('/2fa/email/verify', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;
    const { code } = await c.req.json();

    const storedCode = await db.prepare(
      `SELECT * FROM email_2fa_codes WHERE user_id = ? AND used = 0 ORDER BY created_at DESC LIMIT 1`
    ).bind(user.id).first();

    if (!storedCode) {
      return c.json({ error: 'No pending verification code' }, 400);
    }

    // Check expiration
    if (new Date(storedCode.expires_at as string) < new Date()) {
      return c.json({ error: 'Code expired' }, 400);
    }

    // Verify code
    const isValid = await bcryptCompare(code, storedCode.code_hash as string);

    if (isValid) {
      await db.prepare(
        `UPDATE email_2fa_codes SET used = 1 WHERE id = ?`
      ).bind(storedCode.id).run();

      await logSecurityEvent(db, user.id, 'email_2fa_verified', 'Email 2FA code verified');

      return c.json({ success: true, message: 'Code verified' });
    }

    return c.json({ error: 'Invalid code' }, 400);
  } catch (error) {
    console.error('Verify email 2FA error:', error);
    return c.json({ error: 'Verification failed' }, 500);
  }
});

// POST /api/2fa/email/enable - Enable email 2FA
security.post('/2fa/email/enable', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;

    await db.prepare(
      `INSERT OR REPLACE INTO two_factor_settings (user_id, type, enabled, verified)
       VALUES (?, 'email', 1, 1)`
    ).bind(user.id).run();

    await logSecurityEvent(db, user.id, 'email_2fa_enabled', 'Email 2FA enabled');

    return c.json({ success: true, message: 'Email 2FA enabled' });
  } catch (error) {
    console.error('Enable email 2FA error:', error);
    return c.json({ error: 'Failed to enable email 2FA' }, 500);
  }
});

// ==================== SESSION MANAGEMENT ====================

// GET /api/security/sessions - Get active sessions
security.get('/sessions', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;

    const sessions = await db.prepare(
      `SELECT id, device_info, browser, os, ip_address, location, is_current, last_activity, created_at
       FROM user_sessions WHERE user_id = ? ORDER BY last_activity DESC`
    ).bind(user.id).all();

    return c.json({ sessions: sessions.results || [] });
  } catch (error) {
    console.error('Get sessions error:', error);
    return c.json({ error: 'Failed to get sessions' }, 500);
  }
});

// DELETE /api/security/sessions/:id - Terminate a session
security.delete('/sessions/:id', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;
    const sessionId = c.req.param('id');

    const session = await db.prepare(
      `SELECT * FROM user_sessions WHERE id = ? AND user_id = ?`
    ).bind(sessionId, user.id).first();

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    await db.prepare(
      `DELETE FROM user_sessions WHERE id = ?`
    ).bind(sessionId).run();

    await logSecurityEvent(db, user.id, 'session_terminated', `Session ${sessionId} terminated remotely`, undefined, 'warning');

    return c.json({ success: true, message: 'Session terminated' });
  } catch (error) {
    console.error('Terminate session error:', error);
    return c.json({ error: 'Failed to terminate session' }, 500);
  }
});

// POST /api/security/sessions/terminate-all - Terminate all other sessions
security.post('/sessions/terminate-all', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;

    await db.prepare(
      `DELETE FROM user_sessions WHERE user_id = ? AND is_current = 0`
    ).bind(user.id).run();

    await logSecurityEvent(db, user.id, 'all_sessions_terminated', 'All other sessions terminated', undefined, 'warning');

    return c.json({ success: true, message: 'All other sessions terminated' });
  } catch (error) {
    console.error('Terminate all sessions error:', error);
    return c.json({ error: 'Failed to terminate sessions' }, 500);
  }
});

// ==================== LOGIN HISTORY ====================

// GET /api/security/login-history - Get login history (last 30 days)
security.get('/login-history', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;

    const history = await db.prepare(
      `SELECT ip_address, device_info, browser, os, location, success, failure_reason, two_factor_used, created_at
       FROM login_history 
       WHERE user_id = ? AND created_at > datetime('now', '-30 days')
       ORDER BY created_at DESC LIMIT 100`
    ).bind(user.id).all();

    return c.json({ history: history.results || [] });
  } catch (error) {
    console.error('Get login history error:', error);
    return c.json({ error: 'Failed to get login history' }, 500);
  }
});

// ==================== SECURITY EVENTS ====================

// GET /api/security/events - Get security events
security.get('/events', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;

    const events = await db.prepare(
      `SELECT event_type, details, ip_address, severity, created_at
       FROM security_events 
       WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 50`
    ).bind(user.id).all();

    return c.json({ events: events.results || [] });
  } catch (error) {
    console.error('Get security events error:', error);
    return c.json({ error: 'Failed to get security events' }, 500);
  }
});

// GET /api/security/dashboard - Security dashboard overview
security.get('/dashboard', async (c) => {
  try {
    const user = getCurrentUser(c);
    const db = c.env.DB;

    // Get 2FA status
    const twoFactorStatus = await db.prepare(
      `SELECT type, enabled FROM two_factor_settings WHERE user_id = ?`
    ).bind(user.id).all();

    // Active sessions count
    const sessionsCount = await db.prepare(
      `SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ?`
    ).bind(user.id).first();

    // Recent logins
    const recentLogins = await db.prepare(
      `SELECT ip_address, device_info, success, created_at
       FROM login_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`
    ).bind(user.id).all();

    // Recent security events
    const recentEvents = await db.prepare(
      `SELECT event_type, severity, created_at
       FROM security_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`
    ).bind(user.id).all();

    // Backup codes remaining
    const backupCodes = await db.prepare(
      `SELECT COUNT(*) as count FROM backup_codes WHERE user_id = ? AND used = 0`
    ).bind(user.id).first();

    // Security score calculation
    let securityScore = 50;
    const twoFactorEnabled = (twoFactorStatus.results || []).some((r: any) => r.enabled);
    if (twoFactorEnabled) securityScore += 30;
    const backupCodesCount = (backupCodes as { count: number } | null)?.count ?? 0;
    const activeSessionsCount = (sessionsCount as { count: number } | null)?.count ?? 0;
    if (backupCodesCount > 0) securityScore += 10;
    if (activeSessionsCount <= 3) securityScore += 10;

    return c.json({
      securityScore,
      twoFactor: {
        enabled: twoFactorEnabled,
        methods: (twoFactorStatus.results || []).filter((r: any) => r.enabled).map((r: any) => r.type)
      },
      sessions: {
        active: activeSessionsCount
      },
      backupCodes: {
        remaining: backupCodesCount
      },
      recentLogins: recentLogins.results || [],
      recentEvents: recentEvents.results || []
    });
  } catch (error) {
    console.error('Security dashboard error:', error);
    return c.json({ error: 'Failed to load security dashboard' }, 500);
  }
});

export default security;
