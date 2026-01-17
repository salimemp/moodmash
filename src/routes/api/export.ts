// Data Export API
import { Hono } from 'hono';
import type { Env, Variables, MoodEntry, VoiceJournal, ExportData } from '../../types';
import { getCurrentUser } from '../../middleware/auth';

const exportRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Export all data as JSON
exportRoutes.get('/api/export/json', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Get all moods
  const moodsResult = await c.env.DB.prepare(
    `SELECT id, emotion, intensity, notes, logged_at, created_at 
     FROM mood_entries 
     WHERE user_id = ?
     ORDER BY logged_at DESC`
  ).bind(user.id).all<MoodEntry>();

  // Get all voice journals
  const journalsResult = await c.env.DB.prepare(
    `SELECT id, title, transcript, duration_seconds, emotion_detected, sentiment_score, created_at 
     FROM voice_journals 
     WHERE user_id = ?
     ORDER BY created_at DESC`
  ).bind(user.id).all<VoiceJournal>();

  const exportData: ExportData = {
    user: {
      email: user.email,
      name: user.name,
      created_at: new Date().toISOString() // We don't have user created_at in CurrentUser
    },
    moods: moodsResult.results || [],
    voiceJournals: journalsResult.results || [],
    exportedAt: new Date().toISOString()
  };

  return c.json(exportData, 200, {
    'Content-Disposition': `attachment; filename="moodmash-export-${new Date().toISOString().split('T')[0]}.json"`
  });
});

// Export moods as CSV
exportRoutes.get('/api/export/csv', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const type = c.req.query('type') || 'moods'; // moods or journals

  if (type === 'moods') {
    const moodsResult = await c.env.DB.prepare(
      `SELECT id, emotion, intensity, notes, logged_at, created_at 
       FROM mood_entries 
       WHERE user_id = ?
       ORDER BY logged_at DESC`
    ).bind(user.id).all<MoodEntry>();

    const moods = moodsResult.results || [];
    const csv = generateMoodsCsv(moods);

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="moodmash-moods-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  }

  if (type === 'journals') {
    const journalsResult = await c.env.DB.prepare(
      `SELECT id, title, transcript, duration_seconds, emotion_detected, sentiment_score, created_at 
       FROM voice_journals 
       WHERE user_id = ?
       ORDER BY created_at DESC`
    ).bind(user.id).all<VoiceJournal>();

    const journals = journalsResult.results || [];
    const csv = generateJournalsCsv(journals);

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="moodmash-journals-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  }

  return c.json({ error: 'Invalid export type' }, 400);
});

// GDPR/Privacy compliant full data export
exportRoutes.get('/api/export/full', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Get user details
  const userDetails = await c.env.DB.prepare(
    `SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?`
  ).bind(user.id).first();

  // Get all moods
  const moodsResult = await c.env.DB.prepare(
    `SELECT * FROM mood_entries WHERE user_id = ? ORDER BY logged_at DESC`
  ).bind(user.id).all();

  // Get all voice journals (without audio data for size)
  const journalsResult = await c.env.DB.prepare(
    `SELECT id, title, transcript, duration_seconds, emotion_detected, sentiment_score, created_at 
     FROM voice_journals WHERE user_id = ? ORDER BY created_at DESC`
  ).bind(user.id).all();

  // Get OAuth accounts
  const oauthResult = await c.env.DB.prepare(
    `SELECT provider, email, name, created_at FROM oauth_accounts WHERE user_id = ?`
  ).bind(user.id).all();

  // Get sessions (for audit)
  const sessionsResult = await c.env.DB.prepare(
    `SELECT created_at, expires_at FROM sessions WHERE user_id = ?`
  ).bind(user.id).all();

  const fullExport = {
    exportType: 'GDPR Full Data Export',
    exportedAt: new Date().toISOString(),
    user: userDetails,
    data: {
      moodEntries: moodsResult.results || [],
      voiceJournals: journalsResult.results || [],
      linkedAccounts: oauthResult.results || [],
      sessions: sessionsResult.results || []
    },
    metadata: {
      totalMoods: moodsResult.results?.length || 0,
      totalJournals: journalsResult.results?.length || 0,
      linkedAccountsCount: oauthResult.results?.length || 0
    }
  };

  return c.json(fullExport, 200, {
    'Content-Disposition': `attachment; filename="moodmash-full-export-${new Date().toISOString().split('T')[0]}.json"`
  });
});

// Delete all user data (GDPR right to be forgotten)
exportRoutes.delete('/api/export/delete-all', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Confirm deletion
  const body = await c.req.json<{ confirm: boolean }>().catch(() => ({ confirm: false }));
  if (!body.confirm) {
    return c.json({ error: 'Deletion must be confirmed', hint: 'Send { "confirm": true }' }, 400);
  }

  // Delete all user data in order (foreign key constraints)
  await c.env.DB.prepare('DELETE FROM voice_journals WHERE user_id = ?').bind(user.id).run();
  await c.env.DB.prepare('DELETE FROM mood_entries WHERE user_id = ?').bind(user.id).run();
  await c.env.DB.prepare('DELETE FROM oauth_accounts WHERE user_id = ?').bind(user.id).run();
  await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run();
  await c.env.DB.prepare('DELETE FROM password_resets WHERE user_id = ?').bind(user.id).run();
  await c.env.DB.prepare('DELETE FROM email_verifications WHERE user_id = ?').bind(user.id).run();
  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run();

  return c.json({ 
    success: true, 
    message: 'All your data has been permanently deleted.' 
  });
});

// Helper functions
function generateMoodsCsv(moods: MoodEntry[]): string {
  const headers = ['ID', 'Emotion', 'Intensity', 'Notes', 'Logged At', 'Created At'];
  const rows = moods.map(m => [
    m.id,
    m.emotion,
    m.intensity,
    escapeCsvField(m.notes || ''),
    m.logged_at,
    m.created_at
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}

function generateJournalsCsv(journals: VoiceJournal[]): string {
  const headers = ['ID', 'Title', 'Transcript', 'Duration (s)', 'Emotion Detected', 'Sentiment Score', 'Created At'];
  const rows = journals.map(j => [
    j.id,
    escapeCsvField(j.title || ''),
    escapeCsvField(j.transcript || ''),
    j.duration_seconds || '',
    j.emotion_detected || '',
    j.sentiment_score?.toString() || '',
    j.created_at
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export default exportRoutes;
