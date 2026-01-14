/**
 * Gamification API Routes
 * Handles challenges, achievements, streaks, points
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

interface Challenge {
  id: number;
  title: string;
  description: string;
  target: number;
  reward_points: number;
  category: string;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
}

const gamification = new Hono<{ Bindings: Bindings }>();

// Apply auth to all routes
gamification.use('*', requireAuth);

// Get active challenges
gamification.get('/challenges', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const challenges = await DB.prepare(`
      SELECT c.*, 
        uc.progress,
        uc.completed_at
      FROM challenges c
      LEFT JOIN user_challenges uc ON c.id = uc.challenge_id AND uc.user_id = ?
      WHERE c.is_active = 1
      ORDER BY c.created_at DESC
    `).bind(user!.id).all();

    return c.json({ challenges: challenges.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get user achievements
gamification.get('/achievements', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const achievements = await DB.prepare(`
      SELECT a.*, ua.earned_at
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
      ORDER BY ua.earned_at DESC NULLS LAST, a.id
    `).bind(user!.id).all();

    return c.json({ achievements: achievements.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get gamification overview
gamification.get('/', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const stats = await DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM user_achievements WHERE user_id = ?) as achievements_count,
        (SELECT COALESCE(SUM(points), 0) FROM user_points WHERE user_id = ?) as total_points,
        (SELECT current_streak FROM user_streaks WHERE user_id = ?) as current_streak,
        (SELECT longest_streak FROM user_streaks WHERE user_id = ?) as longest_streak
    `).bind(user!.id, user!.id, user!.id, user!.id).first() as {
      achievements_count: number;
      total_points: number;
      current_streak: number;
      longest_streak: number;
    } | null;

    return c.json({
      stats: stats || {
        achievements_count: 0,
        total_points: 0,
        current_streak: 0,
        longest_streak: 0
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get streaks
gamification.get('/streaks', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const streak = await DB.prepare(`
      SELECT * FROM user_streaks
      WHERE user_id = ?
    `).bind(user!.id).first();

    if (!streak) {
      return c.json({
        current_streak: 0,
        longest_streak: 0,
        last_activity: null
      });
    }

    return c.json(streak);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get points history
gamification.get('/points', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const points = await DB.prepare(`
      SELECT * FROM user_points
      WHERE user_id = ?
      ORDER BY earned_at DESC
      LIMIT 50
    `).bind(user!.id).all();

    const total = await DB.prepare(`
      SELECT COALESCE(SUM(points), 0) as total
      FROM user_points
      WHERE user_id = ?
    `).bind(user!.id).first() as { total: number };

    return c.json({
      history: points.results || [],
      total: total.total
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default gamification;
