/**
 * Analytics API Routes
 * Handles analytics dashboard and user analytics
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

const analytics = new Hono<{ Bindings: Bindings }>();

// Apply auth to all routes
analytics.use('*', requireAuth);

// Get analytics dashboard
analytics.get('/dashboard', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    // Get various analytics metrics for the user
    const moodStats = await DB.prepare(`
      SELECT 
        COUNT(*) as total_moods,
        AVG(intensity) as avg_intensity,
        COUNT(DISTINCT DATE(created_at)) as active_days,
        MIN(created_at) as first_entry,
        MAX(created_at) as last_entry
      FROM mood_entries
      WHERE user_id = ?
    `).bind(user!.id).first() as {
      total_moods: number;
      avg_intensity: number;
      active_days: number;
      first_entry: string;
      last_entry: string;
    } | null;

    const emotionDistribution = await DB.prepare(`
      SELECT emotion, COUNT(*) as count
      FROM mood_entries
      WHERE user_id = ?
      GROUP BY emotion
      ORDER BY count DESC
    `).bind(user!.id).all();

    const weeklyTrend = await DB.prepare(`
      SELECT 
        DATE(created_at) as date,
        AVG(intensity) as avg_intensity,
        COUNT(*) as count
      FROM mood_entries
      WHERE user_id = ? AND created_at >= datetime('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `).bind(user!.id).all();

    return c.json({
      overview: moodStats || { total_moods: 0, avg_intensity: 0, active_days: 0 },
      emotionDistribution: emotionDistribution.results || [],
      weeklyTrend: weeklyTrend.results || []
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get user-specific analytics
analytics.get('/users/:userId', async (c) => {
  const { DB } = c.env;
  const currentUser = await getCurrentUser(c);
  const targetUserId = c.req.param('userId');

  // Users can only access their own analytics
  if (parseInt(targetUserId) !== currentUser!.id) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  try {
    const userAnalytics = await DB.prepare(`
      SELECT 
        u.created_at as account_created,
        (SELECT COUNT(*) FROM mood_entries WHERE user_id = u.id) as total_moods,
        (SELECT COUNT(*) FROM social_posts WHERE user_id = u.id) as total_posts,
        (SELECT COUNT(*) FROM chat_conversations WHERE user_id = u.id) as total_conversations
      FROM users u
      WHERE u.id = ?
    `).bind(currentUser!.id).first();

    return c.json({ analytics: userAnalytics });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default analytics;
