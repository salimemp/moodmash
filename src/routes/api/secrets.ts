/**
 * Secrets API Routes
 * Handles secure secret storage
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';
import { getSecret, storeSecret } from '../../utils/secrets';

const secrets = new Hono<{ Bindings: Bindings }>();

// Apply auth to all routes
secrets.use('*', requireAuth);

// Get secret
secrets.get('/:key', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const key = c.req.param('key');

  try {
    // In production, implement proper secret retrieval with encryption
    const secret = await DB.prepare(`
      SELECT value, category, description FROM user_secrets
      WHERE user_id = ? AND key_name = ?
    `).bind(user!.id, key).first();

    if (!secret) {
      return c.json({ error: 'Secret not found' }, 404);
    }

    return c.json({ key, exists: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Store secret
secrets.post('/', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<{
      key: string;
      value: string;
      category?: string;
      description?: string;
    }>();

    if (!body.key || !body.value) {
      return c.json({ error: 'Key and value are required' }, 400);
    }

    await DB.prepare(`
      INSERT INTO user_secrets (user_id, key_name, value, category, description)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT (user_id, key_name) DO UPDATE SET
        value = excluded.value,
        category = excluded.category,
        description = excluded.description,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      user!.id,
      body.key,
      body.value, // In production, encrypt this
      body.category || 'general',
      body.description || ''
    ).run();

    return c.json({ message: 'Secret stored' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default secrets;
