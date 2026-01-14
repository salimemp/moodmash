/**
 * Feature Flags API Routes (Public)
 * Handles feature flag checks
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser } from '../../auth';

const featureFlags = new Hono<{ Bindings: Bindings }>();

// Get all feature flags (for authenticated users)
featureFlags.get('/', async (c) => {
  const { DB } = c.env;

  try {
    // Try to get user for personalized flags
    let userId: number | null = null;
    try {
      const user = await getCurrentUser(c);
      userId = user?.id || null;
    } catch {
      // Not authenticated
    }

    const flags = await DB.prepare(`
      SELECT name, enabled FROM feature_flags
      WHERE is_active = 1
    `).all();

    const flagMap: Record<string, boolean> = {};
    for (const flag of flags.results || []) {
      const f = flag as { name: string; enabled: number };
      flagMap[f.name] = f.enabled === 1;
    }

    return c.json({ flags: flagMap });
  } catch (error) {
    // Return empty flags if table doesn't exist
    return c.json({ flags: {} });
  }
});

// Check specific flag
featureFlags.get('/:flagName', async (c) => {
  const { DB } = c.env;
  const flagName = c.req.param('flagName');

  try {
    const flag = await DB.prepare(`
      SELECT enabled FROM feature_flags
      WHERE name = ? AND is_active = 1
    `).bind(flagName).first() as { enabled: number } | null;

    return c.json({
      flag: flagName,
      enabled: flag ? flag.enabled === 1 : false
    });
  } catch (error) {
    return c.json({ flag: flagName, enabled: false });
  }
});

export default featureFlags;
