/**
 * Activities API Routes
 * Handles wellness activities and recommendations
 */

import { Hono } from 'hono';
import type { Bindings, WellnessActivity } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

const activities = new Hono<{ Bindings: Bindings }>();

// Get all activities (no auth required for browsing)
activities.get('/', async (c) => {
  const { DB } = c.env;
  
  try {
    const result = await DB.prepare(
      'SELECT * FROM activities ORDER BY category, name'
    ).all();

    return c.json({ activities: result.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Activities API] Error fetching activities:', message);
    return c.json({ activities: [], error: message }, 500);
  }
});

// Log activity completion (requires auth)
activities.post('/:id/log', requireAuth, async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const activityId = c.req.param('id');

  // Verify activity exists
  const activity = await DB.prepare('SELECT * FROM activities WHERE id = ?')
    .bind(activityId)
    .first();

  if (!activity) {
    return c.json({ error: 'Activity not found' }, 404);
  }

  // Log the activity
  const result = await DB.prepare(
    'INSERT INTO activity_logs (user_id, activity_id, completed_at) VALUES (?, ?, ?)'
  )
    .bind(user!.id, activityId, new Date().toISOString())
    .run();

  return c.json({
    success: true,
    log_id: result.meta.last_row_id,
    activity: activity,
  }, 201);
});

// Get user's activity history
activities.get('/history', requireAuth, async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const result = await DB.prepare(
      `SELECT al.*, a.name, a.category, a.duration_minutes 
       FROM activity_logs al
       JOIN activities a ON al.activity_id = a.id
       WHERE al.user_id = ?
       ORDER BY al.completed_at DESC
       LIMIT 50`
    )
      .bind(user!.id)
      .all();

    return c.json({ history: result.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ history: [], error: message }, 500);
  }
});

// Get recommended activities based on current mood
activities.get('/recommended', requireAuth, async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  // Get user's most recent mood
  const recentMood = await DB.prepare(
    'SELECT emotion, intensity FROM mood_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
  )
    .bind(user!.id)
    .first() as { emotion: string; intensity: number } | null;

  if (!recentMood) {
    // No mood data, return general recommendations
    const result = await DB.prepare(
      'SELECT * FROM activities WHERE category IN (?, ?) ORDER BY RANDOM() LIMIT 6'
    )
      .bind('mindfulness', 'physical')
      .all();

    return c.json(result.results);
  }

  // Recommend based on mood and intensity
  let categories: string[] = [];

  if (recentMood.emotion === 'anxious' || recentMood.emotion === 'stressed') {
    categories = ['mindfulness', 'relaxation', 'breathing'];
  } else if (recentMood.emotion === 'sad' || recentMood.emotion === 'depressed') {
    categories = ['physical', 'social', 'creative'];
  } else if (recentMood.emotion === 'happy' || recentMood.emotion === 'excited') {
    categories = ['physical', 'social', 'creative'];
  } else if (recentMood.intensity < 4) {
    // Low energy
    categories = ['mindfulness', 'relaxation'];
  } else {
    // Higher energy
    categories = ['physical', 'creative', 'social'];
  }

  const placeholders = categories.map(() => '?').join(',');
  const result = await DB.prepare(
    `SELECT * FROM activities WHERE category IN (${placeholders}) ORDER BY RANDOM() LIMIT 6`
  )
    .bind(...categories)
    .all();

  return c.json({
    recommendations: result.results,
    based_on: {
      emotion: recentMood.emotion,
      intensity: recentMood.intensity,
    },
  });
});

export default activities;
