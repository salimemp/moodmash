/**
 * Health API Routes
 * Handles health status, metrics, trends, and monitoring
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

const health = new Hono<{ Bindings: Bindings }>();

// Public health check (no auth required)
health.get('/', async (c) => {
  const { DB } = c.env;

  try {
    await DB.prepare('SELECT 1').first();
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    return c.json({ status: 'unhealthy', error: 'Database connection failed' }, 503);
  }
});

// Health status endpoint
health.get('/status', async (c) => {
  const { DB, R2, KV } = c.env;

  const services: Record<string, string> = {
    database: 'unknown',
    storage: 'unknown',
    cache: 'unknown'
  };

  try {
    await DB.prepare('SELECT 1').first();
    services.database = 'up';
  } catch {
    services.database = 'down';
  }

  services.storage = R2 ? 'up' : 'not_configured';
  services.cache = KV ? 'up' : 'not_configured';

  const allHealthy = services.database === 'up';

  return c.json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services
  }, allHealthy ? 200 : 503);
});

// Health metrics (authenticated)
health.get('/metrics', requireAuth, async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const metrics = await DB.prepare(`
      SELECT 
        COUNT(*) as total_entries,
        AVG(intensity) as avg_intensity,
        COUNT(DISTINCT DATE(created_at)) as active_days
      FROM mood_entries
      WHERE user_id = ?
    `).bind(user!.id).first() as {
      total_entries: number;
      avg_intensity: number;
      active_days: number;
    } | null;

    return c.json({
      metrics: metrics || { total_entries: 0, avg_intensity: 0, active_days: 0 }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Health trends (authenticated)
health.get('/trends/:period', requireAuth, async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const period = c.req.param('period');

  try {
    let dateFilter: string;
    switch (period) {
      case 'week':
        dateFilter = "datetime('now', '-7 days')";
        break;
      case 'month':
        dateFilter = "datetime('now', '-30 days')";
        break;
      case 'year':
        dateFilter = "datetime('now', '-365 days')";
        break;
      default:
        dateFilter = "datetime('now', '-30 days')";
    }

    const trends = await DB.prepare(`
      SELECT 
        DATE(created_at) as date,
        AVG(intensity) as avg_intensity,
        COUNT(*) as entry_count
      FROM mood_entries
      WHERE user_id = ? AND created_at >= ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).bind(user!.id).all();

    return c.json({ trends: trends.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Health history (authenticated)
health.get('/history', requireAuth, async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const limit = parseInt(c.req.query('limit') || '30');

  try {
    const history = await DB.prepare(`
      SELECT id, emotion, intensity, note, created_at
      FROM mood_entries
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(user!.id, Math.min(limit, 100)).all();

    return c.json({ history: history.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default health;
