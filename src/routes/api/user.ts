/**
 * User API Routes
 * Handles user data, export, deletion, consent
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

const user = new Hono<{ Bindings: Bindings }>();

// Apply auth to all routes
user.use('*', requireAuth);

// Get user data summary
user.get('/data-summary', async (c) => {
  const { DB } = c.env;
  const currentUser = await getCurrentUser(c);

  try {
    const summary = await DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM mood_entries WHERE user_id = ?) as mood_count,
        (SELECT COUNT(*) FROM chat_conversations WHERE user_id = ?) as conversation_count,
        (SELECT COUNT(*) FROM user_files WHERE user_id = ?) as file_count,
        (SELECT COUNT(*) FROM social_posts WHERE user_id = ?) as post_count
    `).bind(currentUser!.id, currentUser!.id, currentUser!.id, currentUser!.id).first() as {
      mood_count: number;
      conversation_count: number;
      file_count: number;
      post_count: number;
    };

    return c.json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Export user data
user.get('/export-data', async (c) => {
  const { DB } = c.env;
  const currentUser = await getCurrentUser(c);

  try {
    // Collect all user data
    const userData = await DB.prepare(
      'SELECT id, email, username, name, created_at FROM users WHERE id = ?'
    ).bind(currentUser!.id).first();

    const moods = await DB.prepare(
      'SELECT * FROM mood_entries WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(currentUser!.id).all();

    const conversations = await DB.prepare(
      'SELECT * FROM chat_conversations WHERE user_id = ?'
    ).bind(currentUser!.id).all();

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: userData,
      moods: moods.results || [],
      conversations: conversations.results || [],
    };

    return c.json(exportData, 200, {
      'Content-Disposition': 'attachment; filename="moodmash-export.json"'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Delete user account
user.delete('/delete-account', async (c) => {
  const { DB, R2 } = c.env;
  const currentUser = await getCurrentUser(c);

  try {
    const body = await c.req.json<{ confirm: boolean }>().catch(() => ({ confirm: false }));

    if (!body.confirm) {
      return c.json({ error: 'Please confirm account deletion' }, 400);
    }

    // Delete user files from R2
    if (R2) {
      const files = await DB.prepare(
        'SELECT file_key FROM user_files WHERE user_id = ?'
      ).bind(currentUser!.id).all();

      for (const file of files.results || []) {
        try {
          await R2.delete((file as { file_key: string }).file_key);
        } catch {
          // Continue even if file deletion fails
        }
      }
    }

    // Delete all user data (cascade)
    await DB.prepare('DELETE FROM mood_entries WHERE user_id = ?').bind(currentUser!.id).run();
    await DB.prepare('DELETE FROM chat_conversations WHERE user_id = ?').bind(currentUser!.id).run();
    await DB.prepare('DELETE FROM user_files WHERE user_id = ?').bind(currentUser!.id).run();
    await DB.prepare('DELETE FROM social_posts WHERE user_id = ?').bind(currentUser!.id).run();
    await DB.prepare('DELETE FROM user_sessions WHERE user_id = ?').bind(currentUser!.id).run();
    await DB.prepare('DELETE FROM users WHERE id = ?').bind(currentUser!.id).run();

    return c.json({ message: 'Account deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Update consent
user.post('/consent/update', async (c) => {
  const { DB } = c.env;
  const currentUser = await getCurrentUser(c);

  try {
    const body = await c.req.json<{
      analytics: boolean;
      marketing: boolean;
      research: boolean;
    }>();

    await DB.prepare(`
      INSERT INTO user_consents (user_id, analytics, marketing, research, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        analytics = excluded.analytics,
        marketing = excluded.marketing,
        research = excluded.research,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      currentUser!.id,
      body.analytics ? 1 : 0,
      body.marketing ? 1 : 0,
      body.research ? 1 : 0
    ).run();

    return c.json({ message: 'Consent preferences updated' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default user;
