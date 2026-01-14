/**
 * AR API Routes
 * Handles AR cards, 3D avatar state
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

interface ARCard {
  id: number;
  user_id: number;
  card_type: string;
  title: string;
  content: string;
  mood_tag: string;
  created_at: string;
}

const ar = new Hono<{ Bindings: Bindings }>();

// Apply auth to all routes
ar.use('*', requireAuth);

// Get AR cards
ar.get('/ar-cards', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const cards = await DB.prepare(`
      SELECT * FROM ar_cards
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).bind(user!.id).all();

    return c.json({ cards: cards.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Create AR card
ar.post('/ar-cards', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<{
      card_type: string;
      title: string;
      content: string;
      mood_tag?: string;
    }>();

    const result = await DB.prepare(`
      INSERT INTO ar_cards (user_id, card_type, title, content, mood_tag)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      user!.id,
      body.card_type || 'mood',
      body.title,
      body.content,
      body.mood_tag || 'neutral'
    ).run();

    return c.json({ id: result.meta.last_row_id }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get avatar state
ar.get('/avatar/state', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const state = await DB.prepare(`
      SELECT * FROM avatar_states
      WHERE user_id = ?
    `).bind(user!.id).first();

    if (!state) {
      // Return default state
      return c.json({
        state: {
          mood: 'neutral',
          energy: 50,
          outfit: 'default',
          accessories: [],
          background: 'simple'
        }
      });
    }

    return c.json({ state });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default ar;
