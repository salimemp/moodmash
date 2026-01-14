/**
 * Biometrics API Routes
 * Handles biometric device connections, data sync
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

interface BiometricSource {
  id: number;
  user_id: number;
  source_type: string;
  device_name: string;
  is_connected: boolean;
  last_sync: string | null;
}

const biometrics = new Hono<{ Bindings: Bindings }>();

// Apply auth to all routes
biometrics.use('*', requireAuth);

// Connect biometric source
biometrics.post('/connect', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<{
      source_type: string;
      device_name: string;
      auth_token?: string;
    }>();

    const result = await DB.prepare(`
      INSERT INTO biometric_sources (user_id, source_type, device_name, is_connected)
      VALUES (?, ?, ?, 1)
      ON CONFLICT (user_id, source_type) DO UPDATE SET
        device_name = excluded.device_name,
        is_connected = 1,
        updated_at = CURRENT_TIMESTAMP
    `).bind(user!.id, body.source_type, body.device_name).run();

    return c.json({ message: 'Device connected', id: result.meta.last_row_id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get connected sources
biometrics.get('/sources', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const sources = await DB.prepare(`
      SELECT * FROM biometric_sources
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(user!.id).all();

    return c.json({ sources: sources.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Sync biometric data
biometrics.post('/sync', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<{
      source_type: string;
      data: Array<{
        metric: string;
        value: number;
        timestamp: string;
      }>;
    }>();

    // Insert biometric data
    for (const dataPoint of body.data) {
      await DB.prepare(`
        INSERT INTO biometric_data (user_id, source_type, metric, value, recorded_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        user!.id,
        body.source_type,
        dataPoint.metric,
        dataPoint.value,
        dataPoint.timestamp
      ).run();
    }

    // Update last sync time
    await DB.prepare(`
      UPDATE biometric_sources
      SET last_sync = CURRENT_TIMESTAMP
      WHERE user_id = ? AND source_type = ?
    `).bind(user!.id, body.source_type).run();

    return c.json({ synced: body.data.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get biometric data
biometrics.get('/data', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const metric = c.req.query('metric');
  const days = parseInt(c.req.query('days') || '7');

  try {
    let query = `
      SELECT * FROM biometric_data
      WHERE user_id = ? AND recorded_at >= datetime('now', '-${days} days')
    `;
    const params: (number | string)[] = [user!.id];

    if (metric) {
      query += ' AND metric = ?';
      params.push(metric);
    }

    query += ' ORDER BY recorded_at DESC LIMIT 500';

    const data = await DB.prepare(query).bind(...params).all();

    return c.json({ data: data.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default biometrics;
