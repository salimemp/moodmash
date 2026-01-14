/**
 * Tokens API Routes
 * Handles user API tokens
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

interface TokenRow {
  id: number;
  user_id: number;
  token: string;
  name: string;
  last_used: string | null;
  created_at: string;
  expires_at: string | null;
}

interface CreateTokenBody {
  name: string;
  expires_in_days?: number;
}

const tokens = new Hono<{ Bindings: Bindings }>();

// Apply auth to all routes
tokens.use('*', requireAuth);

// Create new token
tokens.post('/user', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<CreateTokenBody>();

    if (!body.name) {
      return c.json({ error: 'Token name is required' }, 400);
    }

    // Generate secure token
    const tokenValue = crypto.randomUUID() + '-' + crypto.randomUUID();
    const expiresAt = body.expires_in_days 
      ? new Date(Date.now() + body.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const result = await DB.prepare(`
      INSERT INTO user_api_tokens (user_id, token, name, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind(user!.id, tokenValue, body.name, expiresAt).run();

    return c.json({
      id: result.meta.last_row_id,
      token: tokenValue,
      name: body.name,
      expires_at: expiresAt,
      message: 'Save this token - it will not be shown again'
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// List user tokens
tokens.get('/user', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const tokensList = await DB.prepare(`
      SELECT id, name, last_used, created_at, expires_at,
        SUBSTR(token, 1, 8) || '...' as token_preview
      FROM user_api_tokens
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(user!.id).all();

    return c.json({ tokens: tokensList.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Delete token
tokens.delete('/user/:id', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const tokenId = c.req.param('id');

  try {
    const result = await DB.prepare(`
      DELETE FROM user_api_tokens
      WHERE id = ? AND user_id = ?
    `).bind(tokenId, user!.id).run();

    if (result.meta.changes === 0) {
      return c.json({ error: 'Token not found' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default tokens;
