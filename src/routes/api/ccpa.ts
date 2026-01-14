/**
 * CCPA API Routes
 * Handles California Consumer Privacy Act compliance
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

const ccpa = new Hono<{ Bindings: Bindings }>();

// Apply auth to most routes
ccpa.use('*', async (c, next) => {
  // Some CCPA routes can be public
  const publicPaths = ['/applies', '/data-categories'];
  if (publicPaths.some(p => c.req.path.endsWith(p))) {
    return next();
  }
  return requireAuth(c, next);
});

// Check if CCPA applies (based on IP/location)
ccpa.get('/applies', async (c) => {
  // In production, use IP geolocation
  const cfCountry = c.req.header('CF-IPCountry');
  const cfRegion = c.req.header('CF-IPRegion');
  
  const applies = cfCountry === 'US' && cfRegion === 'CA';
  
  return c.json({ applies, country: cfCountry, region: cfRegion });
});

// Get privacy preferences
ccpa.get('/preferences', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const prefs = await DB.prepare(`
      SELECT * FROM ccpa_preferences
      WHERE user_id = ?
    `).bind(user!.id).first();

    return c.json({
      preferences: prefs || {
        do_not_sell: false,
        limit_use: false,
        delete_on_request: false
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Update privacy preferences
ccpa.post('/preferences', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<{
      do_not_sell?: boolean;
      limit_use?: boolean;
      delete_on_request?: boolean;
    }>();

    await DB.prepare(`
      INSERT INTO ccpa_preferences (user_id, do_not_sell, limit_use, delete_on_request)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (user_id) DO UPDATE SET
        do_not_sell = excluded.do_not_sell,
        limit_use = excluded.limit_use,
        delete_on_request = excluded.delete_on_request,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      user!.id,
      body.do_not_sell ? 1 : 0,
      body.limit_use ? 1 : 0,
      body.delete_on_request ? 1 : 0
    ).run();

    return c.json({ message: 'Preferences updated' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Submit CCPA request
ccpa.post('/request', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<{
      request_type: 'access' | 'delete' | 'opt_out';
      details?: string;
    }>();

    const result = await DB.prepare(`
      INSERT INTO ccpa_requests (user_id, request_type, details, status)
      VALUES (?, ?, ?, 'pending')
    `).bind(user!.id, body.request_type, body.details || '').run();

    return c.json({
      request_id: result.meta.last_row_id,
      message: 'Request submitted. We will process within 45 days.',
      estimated_completion: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get user's CCPA requests
ccpa.get('/requests', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const requests = await DB.prepare(`
      SELECT * FROM ccpa_requests
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(user!.id).all();

    return c.json({ requests: requests.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get data categories (public)
ccpa.get('/data-categories', async (c) => {
  const categories = [
    { category: 'Identifiers', examples: 'Email, username, IP address', collected: true },
    { category: 'Personal Information', examples: 'Name, account preferences', collected: true },
    { category: 'Health Information', examples: 'Mood entries, wellness data', collected: true },
    { category: 'Internet Activity', examples: 'App usage, feature interactions', collected: true },
    { category: 'Geolocation', examples: 'General location (country/region)', collected: true },
    { category: 'Biometric', examples: 'None collected', collected: false },
    { category: 'Financial', examples: 'Payment info (processed by Stripe)', collected: false }
  ];

  return c.json({ categories });
});

// Export data (CCPA compliant)
ccpa.get('/export-data', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    // Collect all user data
    const userData = await DB.prepare(
      'SELECT id, email, username, name, created_at FROM users WHERE id = ?'
    ).bind(user!.id).first();

    const moods = await DB.prepare(
      'SELECT * FROM mood_entries WHERE user_id = ?'
    ).bind(user!.id).all();

    const preferences = await DB.prepare(
      'SELECT * FROM ccpa_preferences WHERE user_id = ?'
    ).bind(user!.id).first();

    return c.json({
      exported_at: new Date().toISOString(),
      user: userData,
      mood_entries: moods.results || [],
      privacy_preferences: preferences
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Delete account (CCPA right to delete)
ccpa.post('/delete-account', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<{ confirm: boolean }>();

    if (!body.confirm) {
      return c.json({ error: 'Please confirm deletion' }, 400);
    }

    // Create deletion request
    await DB.prepare(`
      INSERT INTO ccpa_requests (user_id, request_type, status)
      VALUES (?, 'delete', 'processing')
    `).bind(user!.id).run();

    return c.json({
      message: 'Deletion request submitted. Account will be deleted within 45 days.'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Log privacy notice view
ccpa.post('/log-notice', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<{ notice_type: string }>();

    await DB.prepare(`
      INSERT INTO ccpa_notice_logs (user_id, notice_type)
      VALUES (?, ?)
    `).bind(user!.id, body.notice_type).run();

    return c.json({ logged: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default ccpa;
