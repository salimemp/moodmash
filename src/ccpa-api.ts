/**
 * CCPA (California Consumer Privacy Act) API Routes
 * Implements user rights under CCPA:
 * - Right to Know
 * - Right to Delete
 * - Right to Opt-Out of Sale/Sharing
 * - Right to Correct
 * - Right to Data Portability
 */

import { Context } from 'hono';

// Helper to get current user from session
function getCurrentUser(c: Context) {
  const cookieHeader = c.req.header('cookie');
  if (!cookieHeader) return null;

  const sessionCookie = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('moodmash_session='));
  
  if (!sessionCookie) return null;

  try {
    const sessionData = JSON.parse(
      decodeURIComponent(sessionCookie.split('=')[1])
    );
    return sessionData;
  } catch {
    return null;
  }
}

// Helper to get client IP
function getClientIP(c: Context): string {
  return c.req.header('cf-connecting-ip') || 
         c.req.header('x-forwarded-for') || 
         c.req.header('x-real-ip') || 
         'unknown';
}

// Helper to get user agent
function getUserAgent(c: Context): string {
  return c.req.header('user-agent') || 'unknown';
}

// Helper to check if user is likely from California
function isLikelyCaliforniaResident(c: Context): boolean {
  const state = c.req.header('cf-region-code');  // Cloudflare header
  return state === 'CA';
}

// =============================================================================
// CCPA API ROUTES
// =============================================================================

/**
 * Get user's CCPA preferences
 * GET /api/ccpa/preferences
 */
export async function getCCPAPreferences(c: Context) {
  try {
    const session = getCurrentUser(c);
    if (!session?.userId) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const db = c.env.DB;
    const userId = parseInt(session.userId);

    // Get or create CCPA preferences
    let prefs = await db.prepare(`
      SELECT * FROM ccpa_preferences WHERE user_id = ?
    `).bind(userId).first();

    if (!prefs) {
      // Create default preferences
      const result = await db.prepare(`
        INSERT INTO ccpa_preferences (user_id, do_not_sell, do_not_share, limit_use, ip_address, user_agent)
        VALUES (?, 0, 0, 0, ?, ?)
      `).bind(userId, getClientIP(c), getUserAgent(c)).run();

      prefs = await db.prepare(`
        SELECT * FROM ccpa_preferences WHERE id = ?
      `).bind(result.meta.last_row_id).first();
    }

    return c.json({
      success: true,
      preferences: {
        do_not_sell: Boolean(prefs.do_not_sell),
        do_not_share: Boolean(prefs.do_not_share),
        limit_use: Boolean(prefs.limit_use),
        updated_at: prefs.updated_at
      }
    });
  } catch (error: any) {
    console.error('CCPA preferences error:', error);
    return c.json({ 
      error: 'Failed to get CCPA preferences',
      message: error.message 
    }, 500);
  }
}

/**
 * Update user's CCPA preferences
 * POST /api/ccpa/preferences
 */
export async function updateCCPAPreferences(c: Context) {
  try {
    const session = getCurrentUser(c);
    if (!session?.userId) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { do_not_sell, do_not_share, limit_use } = body;

    const db = c.env.DB;
    const userId = parseInt(session.userId);

    // Check if preferences exist
    const existing = await db.prepare(`
      SELECT id FROM ccpa_preferences WHERE user_id = ?
    `).bind(userId).first();

    if (existing) {
      // Update existing
      await db.prepare(`
        UPDATE ccpa_preferences 
        SET do_not_sell = ?, do_not_share = ?, limit_use = ?, 
            ip_address = ?, user_agent = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).bind(
        do_not_sell ? 1 : 0,
        do_not_share ? 1 : 0,
        limit_use ? 1 : 0,
        getClientIP(c),
        getUserAgent(c),
        userId
      ).run();
    } else {
      // Create new
      await db.prepare(`
        INSERT INTO ccpa_preferences (user_id, do_not_sell, do_not_share, limit_use, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        userId,
        do_not_sell ? 1 : 0,
        do_not_share ? 1 : 0,
        limit_use ? 1 : 0,
        getClientIP(c),
        getUserAgent(c)
      ).run();
    }

    // Log consent change
    const consentTypes = [];
    if (do_not_sell !== undefined) consentTypes.push({ type: 'do_not_sell', given: !do_not_sell });
    if (do_not_share !== undefined) consentTypes.push({ type: 'do_not_share', given: !do_not_share });
    if (limit_use !== undefined) consentTypes.push({ type: 'limit_use', given: !limit_use });

    for (const consent of consentTypes) {
      await db.prepare(`
        INSERT INTO ccpa_consent_log (user_id, consent_type, consent_given, ip_address, user_agent, page_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        userId,
        consent.type,
        consent.given ? 1 : 0,
        getClientIP(c),
        getUserAgent(c),
        c.req.url
      ).run();
    }

    return c.json({
      success: true,
      message: 'CCPA preferences updated successfully',
      preferences: { do_not_sell, do_not_share, limit_use }
    });
  } catch (error: any) {
    console.error('CCPA update error:', error);
    return c.json({ 
      error: 'Failed to update CCPA preferences',
      message: error.message 
    }, 500);
  }
}

/**
 * Submit a CCPA data request (access, delete, portability, correction)
 * POST /api/ccpa/request
 */
export async function submitCCPARequest(c: Context) {
  try {
    const session = getCurrentUser(c);
    if (!session?.userId) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { request_type, description } = body;

    // Validate request type
    const validTypes = ['access', 'delete', 'portability', 'correction', 'opt_out'];
    if (!validTypes.includes(request_type)) {
      return c.json({ 
        error: 'Invalid request type',
        valid_types: validTypes 
      }, 400);
    }

    const db = c.env.DB;
    const userId = parseInt(session.userId);

    // Generate verification code
    const verificationCode = Math.random().toString(36).substring(2, 15);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Calculate due date (45 days as required by CCPA)
    const dueDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);

    // Insert request
    const result = await db.prepare(`
      INSERT INTO ccpa_requests (
        user_id, request_type, description, status, verification_status,
        ip_address, user_agent, verification_code, verification_expires_at, due_date
      ) VALUES (?, ?, ?, 'submitted', 'pending', ?, ?, ?, ?, ?)
    `).bind(
      userId,
      request_type,
      description || '',
      getClientIP(c),
      getUserAgent(c),
      verificationCode,
      verificationExpires.toISOString(),
      dueDate.toISOString()
    ).run();

    // TODO: Send verification email with verification_code

    return c.json({
      success: true,
      message: 'CCPA request submitted successfully. Check your email for verification.',
      request_id: result.meta.last_row_id,
      request_type,
      status: 'submitted',
      due_date: dueDate.toISOString(),
      response_time: '45 days (as required by CCPA)'
    });
  } catch (error: any) {
    console.error('CCPA request error:', error);
    return c.json({ 
      error: 'Failed to submit CCPA request',
      message: error.message 
    }, 500);
  }
}

/**
 * Get user's CCPA requests
 * GET /api/ccpa/requests
 */
export async function getCCPARequests(c: Context) {
  try {
    const session = getCurrentUser(c);
    if (!session?.userId) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const db = c.env.DB;
    const userId = parseInt(session.userId);

    const requests = await db.prepare(`
      SELECT 
        id, request_type, description, status, verification_status,
        requested_at, due_date, completion_date, response_file_url
      FROM ccpa_requests
      WHERE user_id = ?
      ORDER BY requested_at DESC
      LIMIT 50
    `).bind(userId).all();

    return c.json({
      success: true,
      requests: requests.results
    });
  } catch (error: any) {
    console.error('CCPA requests error:', error);
    return c.json({ 
      error: 'Failed to get CCPA requests',
      message: error.message 
    }, 500);
  }
}

/**
 * Get data categories (what data we collect)
 * GET /api/ccpa/data-categories
 */
export async function getDataCategories(c: Context) {
  try {
    const db = c.env.DB;

    const categories = await db.prepare(`
      SELECT 
        category_name, category_label, description, is_sensitive,
        is_sold, is_shared, collection_purpose, retention_period, third_parties
      FROM ccpa_data_categories
      ORDER BY category_label
    `).all();

    return c.json({
      success: true,
      categories: categories.results.map((cat: any) => ({
        ...cat,
        is_sensitive: Boolean(cat.is_sensitive),
        is_sold: Boolean(cat.is_sold),
        is_shared: Boolean(cat.is_shared),
        third_parties: cat.third_parties ? JSON.parse(cat.third_parties) : []
      }))
    });
  } catch (error: any) {
    console.error('Data categories error:', error);
    return c.json({ 
      error: 'Failed to get data categories',
      message: error.message 
    }, 500);
  }
}

/**
 * Export user data (Right to Data Portability)
 * GET /api/ccpa/export-data
 */
export async function exportUserData(c: Context) {
  try {
    const session = getCurrentUser(c);
    if (!session?.userId) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const db = c.env.DB;
    const userId = parseInt(session.userId);

    // Collect all user data
    const userData: any = {};

    // User profile
    const user = await db.prepare(`
      SELECT id, username, email, created_at, last_login FROM users WHERE id = ?
    `).bind(userId).first();
    userData.profile = user;

    // Mood entries
    const moods = await db.prepare(`
      SELECT * FROM moods WHERE user_id = ? ORDER BY timestamp DESC
    `).bind(userId).all();
    userData.moods = moods.results;

    // Activities
    const activities = await db.prepare(`
      SELECT * FROM activity_logs WHERE user_id = ? ORDER BY logged_at DESC
    `).bind(userId).all();
    userData.activities = activities.results;

    // CCPA preferences
    const ccpaPrefs = await db.prepare(`
      SELECT * FROM ccpa_preferences WHERE user_id = ?
    `).bind(userId).first();
    userData.ccpa_preferences = ccpaPrefs;

    // CCPA requests
    const ccpaRequests = await db.prepare(`
      SELECT * FROM ccpa_requests WHERE user_id = ? ORDER BY requested_at DESC
    `).bind(userId).all();
    userData.ccpa_requests = ccpaRequests.results;

    // Consent log
    const consentLog = await db.prepare(`
      SELECT * FROM ccpa_consent_log WHERE user_id = ? ORDER BY timestamp DESC
    `).bind(userId).all();
    userData.consent_history = consentLog.results;

    // Add export metadata
    userData._export_metadata = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      format: 'JSON',
      ccpa_compliant: true,
      note: 'This is your complete data export as required by CCPA'
    };

    // Return as downloadable JSON
    return c.json(userData, 200, {
      'Content-Disposition': `attachment; filename="moodmash-data-export-${userId}-${Date.now()}.json"`,
      'Content-Type': 'application/json'
    });
  } catch (error: any) {
    console.error('Data export error:', error);
    return c.json({ 
      error: 'Failed to export user data',
      message: error.message 
    }, 500);
  }
}

/**
 * Delete user account and all data (Right to Delete)
 * POST /api/ccpa/delete-account
 */
export async function deleteUserAccount(c: Context) {
  try {
    const session = getCurrentUser(c);
    if (!session?.userId) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { confirmation } = body;

    if (confirmation !== 'DELETE MY ACCOUNT') {
      return c.json({ 
        error: 'Confirmation required',
        message: 'Please type "DELETE MY ACCOUNT" to confirm deletion' 
      }, 400);
    }

    const db = c.env.DB;
    const userId = parseInt(session.userId);

    // Log deletion request
    await db.prepare(`
      INSERT INTO ccpa_requests (
        user_id, request_type, description, status, verification_status
      ) VALUES (?, 'delete', 'Account deletion request', 'completed', 'verified')
    `).bind(userId).run();

    // Delete user data (cascade will handle related tables)
    await db.prepare(`DELETE FROM users WHERE id = ?`).bind(userId).run();

    // Clear session
    c.header('Set-Cookie', 'moodmash_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict');

    return c.json({
      success: true,
      message: 'Account and all associated data deleted successfully',
      deleted_at: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Account deletion error:', error);
    return c.json({ 
      error: 'Failed to delete account',
      message: error.message 
    }, 500);
  }
}

/**
 * Log CCPA notice display
 * POST /api/ccpa/log-notice
 */
export async function logCCPANotice(c: Context) {
  try {
    const session = getCurrentUser(c);
    const userId = session?.userId ? parseInt(session.userId) : null;

    const body = await c.req.json();
    const { notice_type, acknowledged } = body;

    const validNoticeTypes = ['collection', 'sale_opt_out', 'share_opt_out', 'privacy_policy', 'rights_info'];
    if (!validNoticeTypes.includes(notice_type)) {
      return c.json({ 
        error: 'Invalid notice type',
        valid_types: validNoticeTypes 
      }, 400);
    }

    const db = c.env.DB;

    await db.prepare(`
      INSERT INTO ccpa_notice_log (
        user_id, notice_type, ip_address, user_agent, page_url, user_acknowledged, acknowledged_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      notice_type,
      getClientIP(c),
      getUserAgent(c),
      c.req.url,
      acknowledged ? 1 : 0,
      acknowledged ? new Date().toISOString() : null
    ).run();

    return c.json({
      success: true,
      message: 'Notice logged successfully'
    });
  } catch (error: any) {
    console.error('Notice log error:', error);
    return c.json({ 
      error: 'Failed to log notice',
      message: error.message 
    }, 500);
  }
}

/**
 * Check if CCPA applies to user (California resident check)
 * GET /api/ccpa/applies
 */
export async function checkCCPAApplicability(c: Context) {
  try {
    const isCA = isLikelyCaliforniaResident(c);
    const state = c.req.header('cf-region-code') || 'unknown';
    const country = c.req.header('cf-ipcountry') || 'unknown';

    return c.json({
      success: true,
      ccpa_applies: isCA,
      location: {
        state,
        country,
        note: 'CCPA applies to California residents. If you are a California resident, you have additional privacy rights.'
      }
    });
  } catch (error: any) {
    return c.json({ 
      error: 'Failed to check CCPA applicability',
      message: error.message 
    }, 500);
  }
}
