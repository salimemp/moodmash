// Mood tracking routes
import { Hono } from 'hono';
import type { Env, Variables, MoodInput, CurrentUser } from '../types';
import { requireAuth, getCurrentUser } from '../middleware/auth';
import { createMood, getUserMoods, deleteMood, getMoodStats, getUserMoodsByDateRange } from '../lib/db';
import { checkAndAwardAchievements, updateStreak, updateChallengeProgress, addPoints, POINTS_CONFIG } from './api/gamification';

const moods = new Hono<{ Bindings: Env; Variables: Variables }>();

// All mood routes require authentication
moods.use('/*', requireAuth);

// API: Create mood entry
moods.post('/api/moods', async (c) => {
  const user = c.get('user') as CurrentUser;
  
  try {
    const body = await c.req.json<MoodInput>();
    const { emotion, intensity, notes, logged_at } = body;
    
    // Validation
    if (!emotion || typeof intensity !== 'number') {
      return c.json({ error: 'Emotion and intensity are required' }, 400);
    }
    
    if (intensity < 1 || intensity > 10) {
      return c.json({ error: 'Intensity must be between 1 and 10' }, 400);
    }
    
    const validEmotions = ['happy', 'sad', 'anxious', 'calm', 'energetic', 'tired', 'angry', 'peaceful', 'neutral'];
    if (!validEmotions.includes(emotion)) {
      return c.json({ error: 'Invalid emotion' }, 400);
    }
    
    // Convert 1-10 to 1-5 for DB (DB uses 1-5)
    const dbIntensity = Math.ceil(intensity / 2);
    
    const mood = await createMood(c.env.DB, user.id, emotion, dbIntensity, notes, logged_at);
    
    if (!mood) {
      return c.json({ error: 'Failed to create mood entry' }, 500);
    }
    
    // Gamification: Award points, update streak, check achievements, update challenges
    try {
      await addPoints(c.env.DB, user.id, POINTS_CONFIG.mood_log, 'mood_log', 'mood', mood.id);
      const streakInfo = await updateStreak(c.env.DB, user.id);
      const newAchievements = await checkAndAwardAchievements(c.env.DB, user.id);
      const completedChallenges = await updateChallengeProgress(c.env.DB, user.id, 'mood_count', 1);
      
      // Return with original intensity scale and gamification data
      return c.json({
        success: true,
        mood: { ...mood, intensity: dbIntensity * 2 },
        gamification: {
          points_earned: POINTS_CONFIG.mood_log,
          streak: streakInfo,
          new_achievements: newAchievements.map(a => ({ name: a.name, icon: a.icon, points: a.points })),
          completed_challenges: completedChallenges.map(ch => ({ name: ch.name, icon: ch.icon, points: ch.reward_points })),
        }
      });
    } catch (gamError) {
      console.error('Gamification error:', gamError);
      // Still return success for mood creation even if gamification fails
      return c.json({
        success: true,
        mood: { ...mood, intensity: dbIntensity * 2 }
      });
    }
  } catch (error) {
    console.error('Create mood error:', error);
    return c.json({ error: 'Failed to create mood' }, 500);
  }
});

// API: Get user's moods
moods.get('/api/moods', async (c) => {
  const user = c.get('user') as CurrentUser;
  
  try {
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');
    
    let moodsList;
    if (startDate && endDate) {
      moodsList = await getUserMoodsByDateRange(c.env.DB, user.id, startDate, endDate);
    } else {
      moodsList = await getUserMoods(c.env.DB, user.id, limit, offset);
    }
    
    // Convert intensity back to 1-10 scale for frontend
    const moodsWithScale = moodsList.map(m => ({ ...m, intensity: m.intensity * 2 }));
    
    return c.json({ moods: moodsWithScale });
  } catch (error) {
    console.error('Get moods error:', error);
    return c.json({ error: 'Failed to get moods' }, 500);
  }
});

// API: Get mood stats
moods.get('/api/moods/stats', async (c) => {
  const user = c.get('user') as CurrentUser;
  
  try {
    const stats = await getMoodStats(c.env.DB, user.id);
    
    return c.json({
      total: stats.total,
      avgIntensity: Math.round(stats.avgIntensity * 2 * 10) / 10, // Convert to 1-10 scale
      emotionCounts: stats.emotionCounts,
      last7Days: stats.last7Days.map(m => ({ ...m, intensity: m.intensity * 2 }))
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return c.json({ error: 'Failed to get stats' }, 500);
  }
});

// API: Delete mood
moods.delete('/api/moods/:id', async (c) => {
  const user = c.get('user') as CurrentUser;
  const id = parseInt(c.req.param('id'));
  
  if (isNaN(id)) {
    return c.json({ error: 'Invalid mood ID' }, 400);
  }
  
  try {
    const deleted = await deleteMood(c.env.DB, id, user.id);
    
    if (!deleted) {
      return c.json({ error: 'Mood not found' }, 404);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete mood error:', error);
    return c.json({ error: 'Failed to delete mood' }, 500);
  }
});

export default moods;
