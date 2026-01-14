/**
 * Security API Routes
 * Handles security dashboard, events, alerts, compliance
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

const security = new Hono<{ Bindings: Bindings }>();

// Apply auth to all routes
security.use('*', requireAuth);

// Get security dashboard
security.get('/dashboard', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const overview = await DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM security_events WHERE user_id = ? AND created_at >= datetime('now', '-24 hours')) as events_24h,
        (SELECT COUNT(*) FROM failed_logins WHERE user_id = ? AND created_at >= datetime('now', '-24 hours')) as failed_logins_24h,
        (SELECT COUNT(*) FROM security_alerts WHERE user_id = ? AND acknowledged = 0) as unacknowledged_alerts
    `).bind(user!.id, user!.id, user!.id).first();

    return c.json({
      dashboard: overview || { events_24h: 0, failed_logins_24h: 0, unacknowledged_alerts: 0 },
      lastChecked: new Date().toISOString()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get security events
security.get('/events', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const limit = parseInt(c.req.query('limit') || '50');

  try {
    const events = await DB.prepare(`
      SELECT * FROM security_events
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(user!.id, Math.min(limit, 100)).all();

    return c.json({ events: events.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get failed logins
security.get('/failed-logins', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const failedLogins = await DB.prepare(`
      SELECT ip_address, user_agent, created_at, reason
      FROM failed_logins
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).bind(user!.id).all();

    return c.json({ failedLogins: failedLogins.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get security alerts
security.get('/alerts', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const alerts = await DB.prepare(`
      SELECT * FROM security_alerts
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 30
    `).bind(user!.id).all();

    return c.json({ alerts: alerts.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get compliance checklist
security.get('/compliance-checklist', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const checklist = await DB.prepare(`
      SELECT * FROM compliance_checklist
      WHERE user_id = ?
      ORDER BY category, item_order
    `).bind(user!.id).all();

    // Return default checklist if none exists
    if (!checklist.results || checklist.results.length === 0) {
      return c.json({
        checklist: [
          { id: 1, category: 'Account Security', item: 'Enable 2FA', completed: false },
          { id: 2, category: 'Account Security', item: 'Use strong password', completed: false },
          { id: 3, category: 'Privacy', item: 'Review privacy settings', completed: false },
          { id: 4, category: 'Privacy', item: 'Set data retention preferences', completed: false },
          { id: 5, category: 'Data', item: 'Export your data', completed: false }
        ]
      });
    }

    return c.json({ checklist: checklist.results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Update compliance checklist item
security.put('/compliance-checklist/:id', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const itemId = c.req.param('id');

  try {
    const body = await c.req.json<{ completed: boolean }>();

    await DB.prepare(`
      UPDATE compliance_checklist
      SET completed = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).bind(body.completed ? 1 : 0, itemId, user!.id).run();

    return c.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get rate limit status
security.get('/rate-limits', async (c) => {
  const user = await getCurrentUser(c);

  // Return current rate limit status (simplified)
  return c.json({
    rateLimits: {
      api: { limit: 100, remaining: 95, resetAt: new Date(Date.now() + 60000).toISOString() },
      auth: { limit: 10, remaining: 10, resetAt: new Date(Date.now() + 3600000).toISOString() }
    }
  });
});

export default security;
