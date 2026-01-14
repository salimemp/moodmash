/**
 * HIPAA API Routes
 * Handles HIPAA compliance status, audit logs, incidents, policies
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

const hipaa = new Hono<{ Bindings: Bindings }>();

// Apply auth to all routes
hipaa.use('*', requireAuth);

// Get HIPAA compliance status
hipaa.get('/status', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const userStatus = await DB.prepare(`
      SELECT 
        baa_signed,
        baa_signed_at,
        data_encryption_enabled,
        audit_logging_enabled
      FROM hipaa_user_status
      WHERE user_id = ?
    `).bind(user!.id).first();

    return c.json({
      status: userStatus || {
        baa_signed: false,
        data_encryption_enabled: true,
        audit_logging_enabled: true
      },
      complianceLevel: 'standard'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get audit logs
hipaa.get('/audit-logs', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const limit = parseInt(c.req.query('limit') || '50');

  try {
    const logs = await DB.prepare(`
      SELECT * FROM hipaa_audit_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(user!.id, Math.min(limit, 100)).all();

    return c.json({ logs: logs.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Sign BAA
hipaa.post('/baa', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<{ accept: boolean; signature?: string }>();

    if (!body.accept) {
      return c.json({ error: 'BAA must be accepted' }, 400);
    }

    await DB.prepare(`
      INSERT INTO hipaa_user_status (user_id, baa_signed, baa_signed_at, signature)
      VALUES (?, 1, CURRENT_TIMESTAMP, ?)
      ON CONFLICT (user_id) DO UPDATE SET
        baa_signed = 1,
        baa_signed_at = CURRENT_TIMESTAMP,
        signature = excluded.signature
    `).bind(user!.id, body.signature || '').run();

    // Log the BAA signing
    await DB.prepare(`
      INSERT INTO hipaa_audit_logs (user_id, action, details)
      VALUES (?, 'baa_signed', ?)
    `).bind(user!.id, JSON.stringify({ timestamp: new Date().toISOString() })).run();

    return c.json({ message: 'BAA signed successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get security incidents
hipaa.get('/incidents', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const incidents = await DB.prepare(`
      SELECT * FROM hipaa_incidents
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).bind(user!.id).all();

    return c.json({ incidents: incidents.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Acknowledge policy
hipaa.post('/policies', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<{ policy_id: string; acknowledged: boolean }>();

    await DB.prepare(`
      INSERT INTO hipaa_policy_acknowledgments (user_id, policy_id, acknowledged_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, policy_id) DO UPDATE SET
        acknowledged_at = CURRENT_TIMESTAMP
    `).bind(user!.id, body.policy_id).run();

    return c.json({ message: 'Policy acknowledged' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default hipaa;
