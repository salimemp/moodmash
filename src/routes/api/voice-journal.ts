/**
 * Voice Journal API Routes
 * Handles voice recordings, transcription, analysis
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';
import { uploadToR2, downloadFromR2, deleteFromR2, generateFileKey } from '../../utils/media';

interface VoiceEntry {
  id: number;
  user_id: number;
  title: string;
  audio_key: string;
  duration_seconds: number;
  transcript: string | null;
  analysis: string | null;
  created_at: string;
}

const voiceJournal = new Hono<{ Bindings: Bindings }>();

// Apply auth to all routes
voiceJournal.use('*', requireAuth);

// Get voice journal entries
voiceJournal.get('/', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const entries = await DB.prepare(`
      SELECT id, title, duration_seconds, transcript, created_at
      FROM voice_journal_entries
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(user!.id).all();

    return c.json({ entries: entries.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Create voice journal entry (metadata only)
voiceJournal.post('/', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<{ title: string; duration_seconds?: number }>();

    const result = await DB.prepare(`
      INSERT INTO voice_journal_entries (user_id, title, duration_seconds)
      VALUES (?, ?, ?)
    `).bind(user!.id, body.title || 'Untitled', body.duration_seconds || 0).run();

    return c.json({ id: result.meta.last_row_id }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Upload audio file
voiceJournal.post('/upload', async (c) => {
  const { DB, R2 } = c.env;
  const user = await getCurrentUser(c);

  if (!R2) {
    return c.json({ error: 'Storage not configured' }, 503);
  }

  try {
    const formData = await c.req.formData();
    const audio = formData.get('audio') as File | null;
    const title = formData.get('title') as string || 'Voice Entry';

    if (!audio) {
      return c.json({ error: 'Audio file required' }, 400);
    }

    // Validate audio file
    if (!audio.type.startsWith('audio/')) {
      return c.json({ error: 'Invalid audio format' }, 400);
    }

    if (audio.size > 50 * 1024 * 1024) {
      return c.json({ error: 'File size exceeds 50MB limit' }, 400);
    }

    const key = generateFileKey(user!.id, `voice_${Date.now()}.webm`);
    const buffer = await audio.arrayBuffer();
    await uploadToR2(R2, key, buffer);

    const result = await DB.prepare(`
      INSERT INTO voice_journal_entries (user_id, title, audio_key, duration_seconds)
      VALUES (?, ?, ?, ?)
    `).bind(user!.id, title, key, 0).run();

    return c.json({ id: result.meta.last_row_id, key }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get single entry
voiceJournal.get('/:id', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const entryId = c.req.param('id');

  try {
    const entry = await DB.prepare(`
      SELECT * FROM voice_journal_entries
      WHERE id = ? AND user_id = ?
    `).bind(entryId, user!.id).first() as VoiceEntry | null;

    if (!entry) {
      return c.json({ error: 'Entry not found' }, 404);
    }

    return c.json({ entry });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Delete entry
voiceJournal.delete('/:id', async (c) => {
  const { DB, R2 } = c.env;
  const user = await getCurrentUser(c);
  const entryId = c.req.param('id');

  try {
    const entry = await DB.prepare(`
      SELECT audio_key FROM voice_journal_entries
      WHERE id = ? AND user_id = ?
    `).bind(entryId, user!.id).first() as { audio_key: string | null } | null;

    if (!entry) {
      return c.json({ error: 'Entry not found' }, 404);
    }

    // Delete audio from R2
    if (entry.audio_key && R2) {
      await deleteFromR2(R2, entry.audio_key);
    }

    await DB.prepare(`
      DELETE FROM voice_journal_entries
      WHERE id = ? AND user_id = ?
    `).bind(entryId, user!.id).run();

    return c.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Analyze voice entry
voiceJournal.post('/:id/analyze', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const entryId = c.req.param('id');

  try {
    const entry = await DB.prepare(`
      SELECT * FROM voice_journal_entries
      WHERE id = ? AND user_id = ?
    `).bind(entryId, user!.id).first() as VoiceEntry | null;

    if (!entry) {
      return c.json({ error: 'Entry not found' }, 404);
    }

    // Simplified analysis (in production, use AI service)
    const analysis = {
      sentiment: 'neutral',
      emotions: ['calm'],
      keywords: [],
      summary: 'Voice entry recorded'
    };

    await DB.prepare(`
      UPDATE voice_journal_entries
      SET analysis = ?
      WHERE id = ?
    `).bind(JSON.stringify(analysis), entryId).run();

    return c.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get analysis for entry
voiceJournal.get('/:id/analysis', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const entryId = c.req.param('id');

  try {
    const entry = await DB.prepare(`
      SELECT analysis FROM voice_journal_entries
      WHERE id = ? AND user_id = ?
    `).bind(entryId, user!.id).first() as { analysis: string | null } | null;

    if (!entry) {
      return c.json({ error: 'Entry not found' }, 404);
    }

    const analysis = entry.analysis ? JSON.parse(entry.analysis) : null;
    return c.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default voiceJournal;
