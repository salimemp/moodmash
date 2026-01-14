/**
 * Admin API Routes
 * Handles admin operations like feature flags
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

interface FeatureFlag {
  id: number;
  name: string;
  enabled: boolean;
  description: string;
  created_at: string;
}

interface CreateFlagBody {
  name: string;
  enabled?: boolean;
  description?: string;
}

const admin = new Hono<{ Bindings: Bindings }>();

// Apply auth to all routes
admin.use('*', requireAuth);

// Admin middleware - check if user is admin
admin.use('*', async (c, next) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  const adminUser = await DB.prepare(
    'SELECT is_admin FROM users WHERE id = ?'
  ).bind(user!.id).first() as { is_admin: number } | null;

  if (!adminUser || !adminUser.is_admin) {
    return c.json({ error: 'Admin access required' }, 403);
  }

  await next();
});

// Get all feature flags
admin.get('/feature-flags', async (c) => {
  const { DB } = c.env;

  try {
    const flags = await DB.prepare(`
      SELECT * FROM feature_flags
      ORDER BY name
    `).all();

    return c.json({ flags: flags.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Create feature flag
admin.post('/feature-flags', async (c) => {
  const { DB } = c.env;

  try {
    const body = await c.req.json<CreateFlagBody>();

    if (!body.name) {
      return c.json({ error: 'Flag name is required' }, 400);
    }

    const result = await DB.prepare(`
      INSERT INTO feature_flags (name, enabled, description)
      VALUES (?, ?, ?)
    `).bind(body.name, body.enabled ? 1 : 0, body.description || '').run();

    return c.json({ id: result.meta.last_row_id, message: 'Flag created' }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Delete feature flag
admin.delete('/feature-flags/:flagName', async (c) => {
  const { DB } = c.env;
  const flagName = c.req.param('flagName');

  try {
    const result = await DB.prepare(`
      DELETE FROM feature_flags
      WHERE name = ?
    `).bind(flagName).run();

    if (result.meta.changes === 0) {
      return c.json({ error: 'Flag not found' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get feature flag analytics
admin.get('/feature-flags/:flagName/analytics', async (c) => {
  const { DB } = c.env;
  const flagName = c.req.param('flagName');

  try {
    const flag = await DB.prepare(`
      SELECT * FROM feature_flags WHERE name = ?
    `).bind(flagName).first() as FeatureFlag | null;

    if (!flag) {
      return c.json({ error: 'Flag not found' }, 404);
    }

    // Get usage analytics
    const usage = await DB.prepare(`
      SELECT 
        COUNT(*) as total_checks,
        COUNT(DISTINCT user_id) as unique_users
      FROM feature_flag_checks
      WHERE flag_name = ?
    `).bind(flagName).first();

    return c.json({ flag, usage });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default admin;
