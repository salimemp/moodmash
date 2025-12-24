/**
 * Biometric Authentication Routes (WebAuthn)
 * Handles registration and authentication using biometric credentials
 */

import { Hono } from 'hono';
import type { Bindings } from '../types';
import { getCurrentUser } from '../auth';

// WebAuthn configuration
const RP_NAME = 'MoodMash';
const TIMEOUT = 60000; // 60 seconds

/**
 * Generate random challenge (32 bytes)
 */
function generateChallenge(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Generate user ID (16 bytes)
 */
async function generateUserId(userId: string): Promise<string> {
  // Use consistent hash of user ID
  const encoder = new TextEncoder();
  const data = encoder.encode(userId);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash).slice(0, 16)));
}

const biometricRoutes = new Hono<{ Bindings: Bindings }>();

// =============================================================================
// BIOMETRIC REGISTRATION
// =============================================================================

/**
 * Get registration options (step 1 of registration)
 */
biometricRoutes.post('/register/options', async (c) => {
  try {
    const { userId, username, displayName } = await c.req.json();

    if (!userId || !username) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Generate challenge
    const challenge = generateChallenge();
    
    // Generate user ID bytes
    const userIdBytes = await generateUserId(userId);

    // Get existing credentials for this user (to exclude them)
    const existingCredentials = await c.env.DB.prepare(
      'SELECT credential_id FROM biometric_credentials WHERE user_id = ?'
    ).bind(userId).all();

    const excludeCredentials = existingCredentials.results.map((row: any) => ({
      type: 'public-key' as const,
      id: row.credential_id
    }));

    // Store challenge temporarily (expires in 5 minutes)
    await c.env.DB.prepare(
      `INSERT INTO biometric_challenges (user_id, challenge, expires_at) 
       VALUES (?, ?, datetime('now', '+5 minutes'))`
    ).bind(userId, challenge).run();

    // Build registration options
    const options = {
      challenge,
      rp: {
        name: RP_NAME,
        id: new URL(c.req.url).hostname
      },
      user: {
        id: userIdBytes,
        name: username,
        displayName: displayName || username
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' as const },  // ES256
        { alg: -257, type: 'public-key' as const } // RS256
      ],
      timeout: TIMEOUT,
      attestation: 'none' as const,
      authenticatorSelection: {
        authenticatorAttachment: 'platform' as const, // Force platform authenticator (Face ID, Touch ID, etc.)
        userVerification: 'required' as const,
        requireResidentKey: true,  // PASSKEY: Enable discoverable credentials (resident keys)
        residentKey: 'required' as const  // PASSKEY: Modern WebAuthn Level 3 parameter
      },
      excludeCredentials: excludeCredentials.length > 0 ? excludeCredentials : undefined
    };

    return c.json(options);

  } catch (error) {
    console.error('[Biometrics] Registration options error:', error);
    return c.json({ error: 'Failed to generate registration options' }, 500);
  }
});

/**
 * Verify registration (step 2 of registration)
 */
biometricRoutes.post('/register/verify', async (c) => {
  try {
    const { userId, credential } = await c.req.json();

    if (!userId || !credential) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Verify challenge
    const challengeResult = await c.env.DB.prepare(
      `SELECT challenge FROM biometric_challenges 
       WHERE user_id = ? AND expires_at > datetime('now') 
       ORDER BY created_at DESC LIMIT 1`
    ).bind(userId).first();

    if (!challengeResult) {
      return c.json({ error: 'Invalid or expired challenge' }, 400);
    }

    // Clean up used challenge
    await c.env.DB.prepare(
      'DELETE FROM biometric_challenges WHERE user_id = ?'
    ).bind(userId).run();

    // Store credential
    // In production, you should verify the attestation and clientDataJSON
    // For this implementation, we'll store the credential directly
    await c.env.DB.prepare(
      `INSERT INTO biometric_credentials 
       (user_id, credential_id, public_key, counter, created_at) 
       VALUES (?, ?, ?, ?, datetime('now'))`
    ).bind(
      userId,
      credential.id,
      credential.rawId, // Store public key (in production, extract from attestationObject)
      0 // Initial counter
    ).run();

    return c.json({
      success: true,
      credentialId: credential.id
    });

  } catch (error) {
    console.error('[Biometrics] Registration verify error:', error);
    return c.json({ error: 'Failed to verify registration' }, 500);
  }
});

// =============================================================================
// BIOMETRIC AUTHENTICATION
// =============================================================================

/**
 * Get authentication options (step 1 of authentication)
 */
biometricRoutes.post('/authenticate/options', async (c) => {
  try {
    const { userId } = await c.req.json();

    // Generate challenge
    const challenge = generateChallenge();

    // Get user's credentials
    let allowCredentials;
    if (userId) {
      const credentials = await c.env.DB.prepare(
        'SELECT credential_id FROM biometric_credentials WHERE user_id = ?'
      ).bind(userId).all();

      if (credentials.results.length === 0) {
        return c.json({ error: 'No biometric credentials found for this user' }, 404);
      }

      allowCredentials = credentials.results.map((row: any) => ({
        type: 'public-key' as const,
        id: row.credential_id
      }));

      // Store challenge temporarily
      await c.env.DB.prepare(
        `INSERT INTO biometric_challenges (user_id, challenge, expires_at) 
         VALUES (?, ?, datetime('now', '+5 minutes'))`
      ).bind(userId, challenge).run();
    } else {
      // Discoverable credential (no user ID provided)
      // Store challenge with empty user_id
      await c.env.DB.prepare(
        `INSERT INTO biometric_challenges (user_id, challenge, expires_at) 
         VALUES ('', ?, datetime('now', '+5 minutes'))`
      ).bind(challenge).run();
    }

    // Build authentication options
    const options = {
      challenge,
      timeout: TIMEOUT,
      rpId: new URL(c.req.url).hostname,
      userVerification: 'required' as const,
      allowCredentials
    };

    return c.json(options);

  } catch (error) {
    console.error('[Biometrics] Authentication options error:', error);
    return c.json({ error: 'Failed to generate authentication options' }, 500);
  }
});

/**
 * Verify authentication (step 2 of authentication)
 */
biometricRoutes.post('/authenticate/verify', async (c) => {
  try {
    const { assertion } = await c.req.json();

    if (!assertion || !assertion.id) {
      return c.json({ error: 'Missing assertion data' }, 400);
    }

    // Find credential
    const credentialResult = await c.env.DB.prepare(
      'SELECT * FROM biometric_credentials WHERE credential_id = ?'
    ).bind(assertion.id).first();

    if (!credentialResult) {
      return c.json({ error: 'Credential not found' }, 404);
    }

    const userId = credentialResult.user_id as string;

    // Verify challenge
    const challengeResult = await c.env.DB.prepare(
      `SELECT challenge FROM biometric_challenges 
       WHERE (user_id = ? OR user_id = '') AND expires_at > datetime('now') 
       ORDER BY created_at DESC LIMIT 1`
    ).bind(userId).first();

    if (!challengeResult) {
      return c.json({ error: 'Invalid or expired challenge' }, 400);
    }

    // Clean up used challenge
    await c.env.DB.prepare(
      'DELETE FROM biometric_challenges WHERE user_id = ? OR user_id = ?'
    ).bind(userId, '').run();

    // In production, you should:
    // 1. Verify the signature using the stored public key
    // 2. Check the counter to prevent replay attacks
    // 3. Verify the clientDataJSON and authenticatorData

    // Update counter
    await c.env.DB.prepare(
      'UPDATE biometric_credentials SET counter = counter + 1, last_used_at = datetime(\'now\') WHERE credential_id = ?'
    ).bind(assertion.id).run();

    // Get user data
    const user = await c.env.DB.prepare(
      'SELECT id, email, name FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Create session
    const { createSession } = await import('../auth');
    const sessionToken = createSession({
      userId: userId.toString(),
      email: user.email as string,
      name: user.name as string,
      provider: 'biometric' as 'google' | 'github',
      isPremium: false,
      createdAt: Date.now()
    });

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      sessionToken
    });

  } catch (error) {
    console.error('[Biometrics] Authentication verify error:', error);
    return c.json({ error: 'Failed to verify authentication' }, 500);
  }
});

// =============================================================================
// BIOMETRIC MANAGEMENT
// =============================================================================

/**
 * Check if user has enrolled biometrics
 */
biometricRoutes.get('/enrolled', async (c) => {
  try {
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'Missing userId parameter' }, 400);
    }

    const result = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM biometric_credentials WHERE user_id = ?'
    ).bind(userId).first();

    return c.json({
      enrolled: result && (result.count as number) > 0
    });

  } catch (error) {
    console.error('[Biometrics] Enrolled check error:', error);
    return c.json({ error: 'Failed to check enrollment status' }, 500);
  }
});

/**
 * Remove biometric credentials
 */
biometricRoutes.post('/unenroll', async (c) => {
  try {
    const { userId } = await c.req.json();

    if (!userId) {
      return c.json({ error: 'Missing userId' }, 400);
    }

    // Verify user is authenticated and matches the userId
    const currentUser = await getCurrentUser(c);
    if (!currentUser || currentUser.userId !== userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Delete credentials
    await c.env.DB.prepare(
      'DELETE FROM biometric_credentials WHERE user_id = ?'
    ).bind(userId).run();

    return c.json({ success: true });

  } catch (error) {
    console.error('[Biometrics] Unenroll error:', error);
    return c.json({ error: 'Failed to remove biometric credentials' }, 500);
  }
});

/**
 * List user's biometric credentials
 */
biometricRoutes.get('/list', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const credentials = await c.env.DB.prepare(
      'SELECT credential_id, created_at, last_used_at FROM biometric_credentials WHERE user_id = ?'
    ).bind(currentUser.userId).all();

    return c.json({
      credentials: credentials.results.map((row: any) => ({
        id: row.credential_id,
        createdAt: row.created_at,
        lastUsedAt: row.last_used_at
      }))
    });

  } catch (error) {
    console.error('[Biometrics] List credentials error:', error);
    return c.json({ error: 'Failed to list credentials' }, 500);
  }
});

export default biometricRoutes;
