// Voice Journal API Routes
import { Hono } from 'hono';
import type { Env, Variables, VoiceJournal, VoiceJournalInput } from '../../types';
import { getCurrentUser } from '../../middleware/auth';
import { analyzeVoiceJournal } from '../../services/gemini';

const voiceJournals = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get all voice journals for current user
voiceJournals.get('/api/voice-journals', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  const result = await c.env.DB.prepare(
    `SELECT id, user_id, mood_entry_id, title, transcript, duration_seconds, 
            emotion_detected, sentiment_score, created_at 
     FROM voice_journals 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`
  ).bind(user.id, limit, offset).all<VoiceJournal>();

  return c.json({
    journals: result.results || [],
    total: result.results?.length || 0
  });
});

// Get single voice journal
voiceJournals.get('/api/voice-journals/:id', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = parseInt(c.req.param('id'));
  const journal = await c.env.DB.prepare(
    `SELECT * FROM voice_journals WHERE id = ? AND user_id = ?`
  ).bind(id, user.id).first<VoiceJournal>();

  if (!journal) {
    return c.json({ error: 'Not found' }, 404);
  }

  return c.json({ journal });
});

// Create new voice journal
voiceJournals.post('/api/voice-journals', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json<VoiceJournalInput>();
  const { title, transcript, audio_data, duration_seconds, mood_entry_id } = body;

  if (!transcript && !audio_data) {
    return c.json({ error: 'Either transcript or audio_data is required' }, 400);
  }

  // Analyze transcript with Gemini if available
  let emotion_detected = 'neutral';
  let sentiment_score = 0;

  if (transcript && c.env.GEMINI_API_KEY) {
    const analysis = await analyzeVoiceJournal(c.env.GEMINI_API_KEY, transcript);
    emotion_detected = analysis.emotion;
    sentiment_score = analysis.sentiment;
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO voice_journals 
     (user_id, mood_entry_id, title, transcript, audio_data, duration_seconds, emotion_detected, sentiment_score)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    user.id,
    mood_entry_id || null,
    title || null,
    transcript || null,
    audio_data || null,
    duration_seconds || null,
    emotion_detected,
    sentiment_score
  ).run();

  if (!result.meta.last_row_id) {
    return c.json({ error: 'Failed to create voice journal' }, 500);
  }

  const journal = await c.env.DB.prepare(
    `SELECT * FROM voice_journals WHERE id = ?`
  ).bind(result.meta.last_row_id).first<VoiceJournal>();

  return c.json({ journal }, 201);
});

// Update voice journal
voiceJournals.put('/api/voice-journals/:id', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = parseInt(c.req.param('id'));
  const body = await c.req.json<Partial<VoiceJournalInput>>();

  // Check ownership
  const existing = await c.env.DB.prepare(
    `SELECT id FROM voice_journals WHERE id = ? AND user_id = ?`
  ).bind(id, user.id).first();

  if (!existing) {
    return c.json({ error: 'Not found' }, 404);
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (body.title !== undefined) {
    updates.push('title = ?');
    values.push(body.title);
  }
  if (body.transcript !== undefined) {
    updates.push('transcript = ?');
    values.push(body.transcript);
  }
  if (body.mood_entry_id !== undefined) {
    updates.push('mood_entry_id = ?');
    values.push(body.mood_entry_id);
  }

  if (updates.length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  values.push(id, user.id);
  await c.env.DB.prepare(
    `UPDATE voice_journals SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
  ).bind(...values).run();

  const journal = await c.env.DB.prepare(
    `SELECT * FROM voice_journals WHERE id = ?`
  ).bind(id).first<VoiceJournal>();

  return c.json({ journal });
});

// Delete voice journal
voiceJournals.delete('/api/voice-journals/:id', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = parseInt(c.req.param('id'));
  
  const result = await c.env.DB.prepare(
    `DELETE FROM voice_journals WHERE id = ? AND user_id = ?`
  ).bind(id, user.id).run();

  if ((result.meta.changes || 0) === 0) {
    return c.json({ error: 'Not found' }, 404);
  }

  return c.json({ success: true });
});

// Analyze transcript with AI
voiceJournals.post('/api/voice-journals/:id/analyze', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (!c.env.GEMINI_API_KEY) {
    return c.json({ error: 'AI analysis not configured' }, 503);
  }

  const id = parseInt(c.req.param('id'));
  const journal = await c.env.DB.prepare(
    `SELECT * FROM voice_journals WHERE id = ? AND user_id = ?`
  ).bind(id, user.id).first<VoiceJournal>();

  if (!journal) {
    return c.json({ error: 'Not found' }, 404);
  }

  if (!journal.transcript) {
    return c.json({ error: 'No transcript to analyze' }, 400);
  }

  const analysis = await analyzeVoiceJournal(c.env.GEMINI_API_KEY, journal.transcript);

  // Update the journal with analysis results
  await c.env.DB.prepare(
    `UPDATE voice_journals SET emotion_detected = ?, sentiment_score = ? WHERE id = ?`
  ).bind(analysis.emotion, analysis.sentiment, id).run();

  return c.json({ 
    analysis: {
      emotion: analysis.emotion,
      sentiment: analysis.sentiment,
      summary: analysis.summary
    }
  });
});

export default voiceJournals;
