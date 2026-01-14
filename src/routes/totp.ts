import type { Context } from 'hono';
/**
 * Two-Factor Authentication Routes (TOTP/HOTP)
 * Handles app-based (Google Authenticator) and hardware token 2FA
 */

import { Hono } from 'hono';
import type { Bindings } from '../types';
import { getCurrentUser } from '../auth';
import {
  generateSecret,
  generateTOTP,
  verifyTOTP,
  generateTOTPUri,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  generateHOTP,
  verifyHOTP,
  formatSecret
} from '../utils/totp';

const totpRoutes = new Hono<{ Bindings: Bindings }>();

// =============================================================================
// TOTP ENROLLMENT (App-based Authenticators)
// =============================================================================

/**
 * Start TOTP enrollment - Generate secret and QR code
 */
totpRoutes.post('/enroll/start', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if already enrolled
    const existing = await c.env.DB.prepare(
      'SELECT * FROM totp_secrets WHERE user_id = ?'
    ).bind(currentUser.userId).first();

    if (existing && existing.enabled) {
      return c.json({ error: '2FA is already enabled' }, 400);
    }

    // Generate new secret
    const secret = generateSecret();

    // Generate TOTP URI for QR code
    const uri = generateTOTPUri(secret, 'MoodMash', currentUser.email);

    // Store secret (not enabled yet, needs verification)
    if (existing) {
      // Update existing
      await c.env.DB.prepare(
        'UPDATE totp_secrets SET secret = ?, enabled = 0, verified = 0 WHERE user_id = ?'
      ).bind(secret, currentUser.userId).run();
    } else {
      // Create new
      await c.env.DB.prepare(
        'INSERT INTO totp_secrets (user_id, secret, enabled, verified) VALUES (?, ?, 0, 0)'
      ).bind(currentUser.userId, secret).run();
    }

    return c.json({
      secret: formatSecret(secret), // For manual entry
      qrCodeUri: uri,
      issuer: 'MoodMash',
      account: currentUser.email
    });

  } catch (error) {
    console.error('[2FA] Enroll start error:', error);
    return c.json({ error: 'Failed to start 2FA enrollment' }, 500);
  }
});

/**
 * Verify and complete TOTP enrollment
 */
totpRoutes.post('/enroll/verify', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { code } = await c.req.json();
    if (!code || code.length !== 6) {
      return c.json({ error: 'Invalid verification code' }, 400);
    }

    // Get secret
    const result = await c.env.DB.prepare(
      'SELECT secret FROM totp_secrets WHERE user_id = ? AND enabled = 0'
    ).bind(currentUser.userId).first();

    if (!result) {
      return c.json({ error: 'No pending 2FA enrollment' }, 404);
    }

    // Verify code
    const isValid = await verifyTOTP(code, result.secret as string);
    if (!isValid) {
      return c.json({ error: 'Invalid verification code' }, 400);
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);
    const hashedCodes = await Promise.all(
      backupCodes.map(code => hashBackupCode(code))
    );

    // Enable 2FA
    await c.env.DB.prepare(
      'UPDATE totp_secrets SET enabled = 1, verified = 1 WHERE user_id = ?'
    ).bind(currentUser.userId).run();

    // Store backup codes
    for (const hash of hashedCodes) {
      await c.env.DB.prepare(
        'INSERT INTO backup_codes (user_id, code_hash) VALUES (?, ?)'
      ).bind(currentUser.userId, hash).run();
    }

    return c.json({
      success: true,
      backupCodes // Show only once, user must save them
    });

  } catch (error) {
    console.error('[2FA] Enroll verify error:', error);
    return c.json({ error: 'Failed to verify 2FA code' }, 500);
  }
});

// =============================================================================
// TOTP AUTHENTICATION
// =============================================================================

/**
 * Verify TOTP code during login
 */
totpRoutes.post('/verify', async (c) => {
  try {
    const { userId, code } = await c.req.json();

    if (!userId || !code) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Check if using backup code
    if (code.includes('-')) {
      return verifyBackupCodeHandler(c, userId, code);
    }

    // Get TOTP secret
    const result = await c.env.DB.prepare(
      'SELECT secret FROM totp_secrets WHERE user_id = ? AND enabled = 1'
    ).bind(userId).first();

    if (!result) {
      return c.json({ error: '2FA not enabled for this user' }, 404);
    }

    // Verify TOTP code
    const isValid = await verifyTOTP(code, result.secret as string);
    
    if (!isValid) {
      return c.json({ error: 'Invalid 2FA code' }, 400);
    }

    // Update last used
    await c.env.DB.prepare(
      'UPDATE totp_secrets SET last_used_at = datetime(\'now\') WHERE user_id = ?'
    ).bind(userId).run();

    return c.json({ success: true, valid: true });

  } catch (error) {
    console.error('[2FA] Verify error:', error);
    return c.json({ error: 'Failed to verify 2FA code' }, 500);
  }
});

/**
 * Verify backup code
 */
async function verifyBackupCodeHandler(c: Context, userId: string, code: string) {
  try {
    // Get all unused backup codes
    const codes = await c.env.DB.prepare(
      'SELECT id, code_hash FROM backup_codes WHERE user_id = ? AND used = 0'
    ).bind(userId).all();

    if (!codes.results.length) {
      return c.json({ error: 'No backup codes available' }, 404);
    }

    // Verify code
    const codeHash = await hashBackupCode(code);
    const matchingCode = codes.results.find((row: Record<string, unknown>) => row.code_hash === codeHash);

    if (!matchingCode) {
      return c.json({ error: 'Invalid backup code' }, 400);
    }

    // Mark as used
    await c.env.DB.prepare(
      'UPDATE backup_codes SET used = 1, used_at = datetime(\'now\') WHERE id = ?'
    ).bind(matchingCode.id).run();

    // Count remaining codes
    const remaining = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM backup_codes WHERE user_id = ? AND used = 0'
    ).bind(userId).first();

    return c.json({
      success: true,
      valid: true,
      backupCodeUsed: true,
      remainingBackupCodes: remaining?.count || 0
    });

  } catch (error) {
    console.error('[2FA] Backup code verify error:', error);
    return c.json({ error: 'Failed to verify backup code' }, 500);
  }
}

// =============================================================================
// 2FA MANAGEMENT
// =============================================================================

/**
 * Check if 2FA is enabled
 */
totpRoutes.get('/status', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await c.env.DB.prepare(
      'SELECT enabled, verified FROM totp_secrets WHERE user_id = ?'
    ).bind(currentUser.userId).first();

    const backupCodes = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM backup_codes WHERE user_id = ? AND used = 0'
    ).bind(currentUser.userId).first();

    const hardwareTokens = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM hardware_tokens WHERE user_id = ? AND enabled = 1'
    ).bind(currentUser.userId).first();

    return c.json({
      totpEnabled: result?.enabled === 1,
      totpVerified: result?.verified === 1,
      backupCodesCount: backupCodes?.count || 0,
      hardwareTokensCount: hardwareTokens?.count || 0
    });

  } catch (error) {
    console.error('[2FA] Status error:', error);
    return c.json({ error: 'Failed to get 2FA status' }, 500);
  }
});

/**
 * Disable 2FA
 */
totpRoutes.post('/disable', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { code } = await c.req.json();
    if (!code) {
      return c.json({ error: 'Verification code required' }, 400);
    }

    // Verify current code before disabling
    const result = await c.env.DB.prepare(
      'SELECT secret FROM totp_secrets WHERE user_id = ? AND enabled = 1'
    ).bind(currentUser.userId).first();

    if (!result) {
      return c.json({ error: '2FA is not enabled' }, 404);
    }

    // Verify code or backup code
    let isValid = false;
    if (code.includes('-')) {
      // Backup code
      const codeHash = await hashBackupCode(code);
      const backupCode = await c.env.DB.prepare(
        'SELECT id FROM backup_codes WHERE user_id = ? AND code_hash = ? AND used = 0'
      ).bind(currentUser.userId, codeHash).first();
      isValid = !!backupCode;
    } else {
      // TOTP code
      isValid = await verifyTOTP(code, result.secret as string);
    }

    if (!isValid) {
      return c.json({ error: 'Invalid verification code' }, 400);
    }

    // Disable 2FA
    await c.env.DB.prepare(
      'UPDATE totp_secrets SET enabled = 0 WHERE user_id = ?'
    ).bind(currentUser.userId).run();

    // Delete backup codes
    await c.env.DB.prepare(
      'DELETE FROM backup_codes WHERE user_id = ?'
    ).bind(currentUser.userId).run();

    // Disable hardware tokens
    await c.env.DB.prepare(
      'UPDATE hardware_tokens SET enabled = 0 WHERE user_id = ?'
    ).bind(currentUser.userId).run();

    return c.json({ success: true });

  } catch (error) {
    console.error('[2FA] Disable error:', error);
    return c.json({ error: 'Failed to disable 2FA' }, 500);
  }
});

/**
 * Regenerate backup codes
 */
totpRoutes.post('/backup-codes/regenerate', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { code } = await c.req.json();
    if (!code) {
      return c.json({ error: 'Verification code required' }, 400);
    }

    // Verify 2FA is enabled
    const result = await c.env.DB.prepare(
      'SELECT secret FROM totp_secrets WHERE user_id = ? AND enabled = 1'
    ).bind(currentUser.userId).first();

    if (!result) {
      return c.json({ error: '2FA is not enabled' }, 404);
    }

    // Verify code
    const isValid = await verifyTOTP(code, result.secret as string);
    if (!isValid) {
      return c.json({ error: 'Invalid verification code' }, 400);
    }

    // Delete old backup codes
    await c.env.DB.prepare(
      'DELETE FROM backup_codes WHERE user_id = ?'
    ).bind(currentUser.userId).run();

    // Generate new backup codes
    const backupCodes = generateBackupCodes(10);
    const hashedCodes = await Promise.all(
      backupCodes.map(code => hashBackupCode(code))
    );

    // Store new backup codes
    for (const hash of hashedCodes) {
      await c.env.DB.prepare(
        'INSERT INTO backup_codes (user_id, code_hash) VALUES (?, ?)'
      ).bind(currentUser.userId, hash).run();
    }

    return c.json({
      success: true,
      backupCodes
    });

  } catch (error) {
    console.error('[2FA] Regenerate backup codes error:', error);
    return c.json({ error: 'Failed to regenerate backup codes' }, 500);
  }
});

// =============================================================================
// HARDWARE TOKEN SUPPORT (HOTP)
// =============================================================================

/**
 * Register hardware token
 */
totpRoutes.post('/hardware/register', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { tokenName, secret, initialCode } = await c.req.json();

    if (!tokenName || !secret || !initialCode) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Verify initial code with counter 0
    const expectedCode = await generateHOTP(secret, 0);
    if (initialCode !== expectedCode) {
      return c.json({ error: 'Invalid initial code' }, 400);
    }

    // Store hardware token
    await c.env.DB.prepare(
      'INSERT INTO hardware_tokens (user_id, token_name, secret, counter) VALUES (?, ?, ?, 1)'
    ).bind(currentUser.userId, tokenName, secret).run();

    return c.json({ success: true });

  } catch (error) {
    console.error('[2FA] Hardware token register error:', error);
    return c.json({ error: 'Failed to register hardware token' }, 500);
  }
});

/**
 * Verify hardware token code
 */
totpRoutes.post('/hardware/verify', async (c) => {
  try {
    const { userId, code } = await c.req.json();

    if (!userId || !code) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Get all hardware tokens
    const tokens = await c.env.DB.prepare(
      'SELECT id, secret, counter FROM hardware_tokens WHERE user_id = ? AND enabled = 1'
    ).bind(userId).all();

    if (!tokens.results.length) {
      return c.json({ error: 'No hardware tokens registered' }, 404);
    }

    // Try each token
    for (const token of tokens.results) {
      const newCounter = await verifyHOTP(
        code,
        token.secret as string,
        token.counter as number,
        10 // Look-ahead window
      );

      if (newCounter !== -1) {
        // Valid! Update counter
        await c.env.DB.prepare(
          'UPDATE hardware_tokens SET counter = ?, last_used_at = datetime(\'now\') WHERE id = ?'
        ).bind(newCounter, token.id).run();

        return c.json({ success: true, valid: true });
      }
    }

    return c.json({ error: 'Invalid hardware token code' }, 400);

  } catch (error) {
    console.error('[2FA] Hardware token verify error:', error);
    return c.json({ error: 'Failed to verify hardware token' }, 500);
  }
});

export default totpRoutes;
