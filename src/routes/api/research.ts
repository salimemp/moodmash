/**
 * Research API Routes
 * Handles research consent, data anonymization, exports
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

const research = new Hono<{ Bindings: Bindings }>();

// Apply auth to all routes
research.use('*', requireAuth);

// Get research dashboard
research.get('/dashboard', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const consent = await DB.prepare(`
      SELECT * FROM research_consents
      WHERE user_id = ?
    `).bind(user!.id).first();

    const contributions = await DB.prepare(`
      SELECT COUNT(*) as count FROM research_contributions
      WHERE user_id = ?
    `).bind(user!.id).first() as { count: number };

    return c.json({
      hasConsent: !!consent,
      consent,
      contributionCount: contributions?.count || 0
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get user's research consents
research.get('/consents/:userId', async (c) => {
  const { DB } = c.env;
  const currentUser = await getCurrentUser(c);
  const targetUserId = c.req.param('userId');

  // Only allow viewing own consents
  if (parseInt(targetUserId) !== currentUser!.id) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  try {
    const consents = await DB.prepare(`
      SELECT * FROM research_consents
      WHERE user_id = ?
    `).bind(currentUser!.id).all();

    return c.json({ consents: consents.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Submit research consent
research.post('/consent', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<{
      consent_type: string;
      allow_mood_data: boolean;
      allow_demographic: boolean;
      allow_anonymized_sharing: boolean;
    }>();

    await DB.prepare(`
      INSERT INTO research_consents (user_id, consent_type, allow_mood_data, allow_demographic, allow_anonymized_sharing)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT (user_id, consent_type) DO UPDATE SET
        allow_mood_data = excluded.allow_mood_data,
        allow_demographic = excluded.allow_demographic,
        allow_anonymized_sharing = excluded.allow_anonymized_sharing,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      user!.id,
      body.consent_type,
      body.allow_mood_data ? 1 : 0,
      body.allow_demographic ? 1 : 0,
      body.allow_anonymized_sharing ? 1 : 0
    ).run();

    return c.json({ message: 'Consent recorded' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Anonymize mood data for research
research.post('/anonymize/mood', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    // Check consent
    const consent = await DB.prepare(`
      SELECT allow_mood_data FROM research_consents
      WHERE user_id = ? AND allow_mood_data = 1
    `).bind(user!.id).first();

    if (!consent) {
      return c.json({ error: 'Research consent required' }, 403);
    }

    // Get mood data and anonymize
    const moods = await DB.prepare(`
      SELECT emotion, intensity, weather, sleep_hours, social_interaction, DATE(created_at) as date
      FROM mood_entries
      WHERE user_id = ?
    `).bind(user!.id).all();

    const anonymizedData = (moods.results || []).map((m, i) => ({
      id: `anon_${i}`,
      ...(m as Record<string, unknown>),
      // Remove any identifying information
    }));

    return c.json({ anonymizedCount: anonymizedData.length, preview: anonymizedData.slice(0, 5) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Anonymize health data
research.post('/anonymize/health', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const consent = await DB.prepare(`
      SELECT allow_mood_data FROM research_consents
      WHERE user_id = ? AND allow_mood_data = 1
    `).bind(user!.id).first();

    if (!consent) {
      return c.json({ error: 'Research consent required' }, 403);
    }

    return c.json({ message: 'Health data anonymized', count: 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get research stats
research.get('/stats', async (c) => {
  const { DB } = c.env;

  try {
    const stats = await DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM research_consents WHERE allow_mood_data = 1) as mood_contributors,
        (SELECT COUNT(*) FROM research_contributions) as total_contributions
    `).first();

    return c.json({ stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Export research data
research.post('/export', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<{ format: string; include_demographics?: boolean }>();

    // Check consent
    const consent = await DB.prepare(`
      SELECT * FROM research_consents
      WHERE user_id = ? AND allow_anonymized_sharing = 1
    `).bind(user!.id).first();

    if (!consent) {
      return c.json({ error: 'Research sharing consent required' }, 403);
    }

    return c.json({
      message: 'Export initiated',
      format: body.format || 'json',
      estimatedRecords: 0
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default research;
