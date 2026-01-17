// Meditation API Endpoints
import { Hono } from 'hono';
import type { Env, Variables } from '../../types';
import { getCurrentUser } from '../../middleware/auth';
import { meditationSessions, meditationCategories, backgroundSounds } from '../../data/meditation-sessions';

const meditation = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get all meditation sessions
meditation.get('/sessions', async (c) => {
  try {
    const url = new URL(c.req.url);
    const category = url.searchParams.get('category');
    const difficulty = url.searchParams.get('difficulty');
    const duration = url.searchParams.get('duration');
    const search = url.searchParams.get('search');
    
    let sessions = [...meditationSessions];
    
    // Filter by category
    if (category) {
      sessions = sessions.filter(s => s.category === category);
    }
    
    // Filter by difficulty
    if (difficulty) {
      sessions = sessions.filter(s => s.difficulty === difficulty);
    }
    
    // Filter by duration (max duration in seconds)
    if (duration) {
      const maxDuration = parseInt(duration);
      sessions = sessions.filter(s => s.duration <= maxDuration);
    }
    
    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      sessions = sessions.filter(s => 
        s.title.toLowerCase().includes(searchLower) ||
        s.description.toLowerCase().includes(searchLower) ||
        s.tags.some(t => t.toLowerCase().includes(searchLower))
      );
    }
    
    // Remove script content for list view (save bandwidth)
    const sessionList = sessions.map(({ script, ...rest }) => rest);
    
    return c.json({
      success: true,
      sessions: sessionList,
      total: sessionList.length
    });
  } catch (error) {
    console.error('Error fetching meditation sessions:', error);
    return c.json({ success: false, error: 'Failed to fetch sessions' }, 500);
  }
});

// Get single meditation session
meditation.get('/sessions/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const session = meditationSessions.find(s => s.id === id);
    
    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }
    
    return c.json({ success: true, session });
  } catch (error) {
    console.error('Error fetching meditation session:', error);
    return c.json({ success: false, error: 'Failed to fetch session' }, 500);
  }
});

// Get meditation categories
meditation.get('/categories', async (c) => {
  try {
    return c.json({
      success: true,
      categories: meditationCategories,
      sounds: backgroundSounds
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({ success: false, error: 'Failed to fetch categories' }, 500);
  }
});

// Start meditation session
meditation.post('/start', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { sessionId, moodBefore } = body;
    
    if (!sessionId) {
      return c.json({ success: false, error: 'Session ID required' }, 400);
    }
    
    const session = meditationSessions.find(s => s.id === sessionId);
    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }
    
    // Create progress record
    const progressId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO meditation_progress (id, user_id, session_id, mood_before, started_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(progressId, user.id, sessionId, moodBefore || null).run();
    
    return c.json({
      success: true,
      progressId,
      session: {
        id: session.id,
        title: session.title,
        duration: session.duration,
        script: session.script,
        backgroundSound: session.backgroundSound
      }
    });
  } catch (error) {
    console.error('Error starting meditation:', error);
    return c.json({ success: false, error: 'Failed to start session' }, 500);
  }
});

// Complete meditation session
meditation.post('/complete', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { progressId, moodAfter, notes, actualDuration } = body;
    
    if (!progressId) {
      return c.json({ success: false, error: 'Progress ID required' }, 400);
    }
    
    // Update progress record
    await c.env.DB.prepare(`
      UPDATE meditation_progress 
      SET completed_at = datetime('now'),
          mood_after = ?,
          notes = ?,
          duration = ?,
          is_completed = 1
      WHERE id = ? AND user_id = ?
    `).bind(moodAfter || null, notes || null, actualDuration || null, progressId, user.id).run();
    
    // Update streak
    const today = new Date().toISOString().split('T')[0];
    const streakResult = await c.env.DB.prepare(`
      SELECT * FROM meditation_streaks WHERE user_id = ?
    `).bind(user.id).first();
    
    if (streakResult) {
      const lastDate = streakResult.last_session_date as string;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      let newStreak = 1;
      if (lastDate === yesterday) {
        newStreak = (streakResult.current_streak as number) + 1;
      } else if (lastDate === today) {
        newStreak = streakResult.current_streak as number;
      }
      
      const longestStreak = Math.max(newStreak, streakResult.longest_streak as number);
      
      await c.env.DB.prepare(`
        UPDATE meditation_streaks 
        SET current_streak = ?,
            longest_streak = ?,
            last_session_date = ?,
            total_sessions = total_sessions + 1,
            total_minutes = total_minutes + ?,
            updated_at = datetime('now')
        WHERE user_id = ?
      `).bind(newStreak, longestStreak, today, Math.round((actualDuration || 0) / 60), user.id).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO meditation_streaks (id, user_id, current_streak, longest_streak, last_session_date, total_sessions, total_minutes)
        VALUES (?, ?, 1, 1, ?, 1, ?)
      `).bind(crypto.randomUUID(), user.id, today, Math.round((actualDuration || 0) / 60)).run();
    }
    
    // Check for achievements
    const achievements = await checkMeditationAchievements(c.env.DB, String(user.id));
    
    return c.json({
      success: true,
      message: 'Session completed',
      achievements
    });
  } catch (error) {
    console.error('Error completing meditation:', error);
    return c.json({ success: false, error: 'Failed to complete session' }, 500);
  }
});

// Get user progress
meditation.get('/progress', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    // Get streak data
    const streak = await c.env.DB.prepare(`
      SELECT * FROM meditation_streaks WHERE user_id = ?
    `).bind(user.id).first();
    
    // Get recent sessions
    const recentSessions = await c.env.DB.prepare(`
      SELECT mp.*, ms.title as session_title, ms.category, ms.duration as session_duration
      FROM meditation_progress mp
      LEFT JOIN meditation_sessions ms ON mp.session_id = ms.id
      WHERE mp.user_id = ? AND mp.is_completed = 1
      ORDER BY mp.completed_at DESC
      LIMIT 10
    `).bind(user.id).all();
    
    // Get mood improvement stats
    const moodStats = await c.env.DB.prepare(`
      SELECT 
        AVG(mood_after - mood_before) as avg_improvement,
        COUNT(*) as sessions_with_mood
      FROM meditation_progress
      WHERE user_id = ? AND is_completed = 1 AND mood_before IS NOT NULL AND mood_after IS NOT NULL
    `).bind(user.id).first();
    
    return c.json({
      success: true,
      streak: streak || { current_streak: 0, longest_streak: 0, total_sessions: 0, total_minutes: 0 },
      recentSessions: recentSessions.results || [],
      moodStats: moodStats || { avg_improvement: 0, sessions_with_mood: 0 }
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return c.json({ success: false, error: 'Failed to fetch progress' }, 500);
  }
});

// Get favorites
meditation.get('/favorites', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const favorites = await c.env.DB.prepare(`
      SELECT session_id FROM meditation_favorites WHERE user_id = ?
    `).bind(user.id).all();
    
    const favoriteIds = favorites.results?.map((f: Record<string, unknown>) => f.session_id) || [];
    const favoriteSessions = meditationSessions
      .filter(s => favoriteIds.includes(s.id))
      .map(({ script, ...rest }) => rest);
    
    return c.json({
      success: true,
      favorites: favoriteSessions
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return c.json({ success: false, error: 'Failed to fetch favorites' }, 500);
  }
});

// Add favorite
meditation.post('/favorites/:id', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('id');
    
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO meditation_favorites (id, user_id, session_id)
      VALUES (?, ?, ?)
    `).bind(crypto.randomUUID(), user.id, sessionId).run();
    
    return c.json({ success: true, message: 'Added to favorites' });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return c.json({ success: false, error: 'Failed to add favorite' }, 500);
  }
});

// Remove favorite
meditation.delete('/favorites/:id', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('id');
    
    await c.env.DB.prepare(`
      DELETE FROM meditation_favorites WHERE user_id = ? AND session_id = ?
    `).bind(user.id, sessionId).run();
    
    return c.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return c.json({ success: false, error: 'Failed to remove favorite' }, 500);
  }
});

// Get streaks
meditation.get('/streaks', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const streak = await c.env.DB.prepare(`
      SELECT * FROM meditation_streaks WHERE user_id = ?
    `).bind(user.id).first();
    
    return c.json({
      success: true,
      streak: streak || {
        current_streak: 0,
        longest_streak: 0,
        last_session_date: null,
        total_sessions: 0,
        total_minutes: 0
      }
    });
  } catch (error) {
    console.error('Error fetching streaks:', error);
    return c.json({ success: false, error: 'Failed to fetch streaks' }, 500);
  }
});

// Get recommendations based on mood
meditation.get('/recommendations', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const url = new URL(c.req.url);
    const mood = url.searchParams.get('mood') || 'neutral';
    const timeOfDay = url.searchParams.get('timeOfDay') || getTimeOfDay();
    
    // Mood to category mapping
    const moodCategories: Record<string, string[]> = {
      happy: ['mindfulness', 'loving_kindness', 'morning'],
      sad: ['loving_kindness', 'body_scan', 'evening'],
      anxious: ['anxiety', 'breathing', 'stress_relief'],
      stressed: ['stress_relief', 'breathing', 'body_scan'],
      tired: ['sleep', 'evening', 'body_scan'],
      energetic: ['morning', 'focus', 'mindfulness'],
      calm: ['mindfulness', 'loving_kindness', 'body_scan'],
      neutral: ['mindfulness', 'breathing', 'focus']
    };
    
    // Time of day preferences
    const timeCategories: Record<string, string[]> = {
      morning: ['morning', 'focus', 'breathing'],
      afternoon: ['focus', 'stress_relief', 'mindfulness'],
      evening: ['evening', 'sleep', 'body_scan'],
      night: ['sleep', 'body_scan', 'anxiety']
    };
    
    const moodCats = moodCategories[mood] || moodCategories.neutral;
    const timeCats = timeCategories[timeOfDay] || timeCategories.afternoon;
    
    // Combine and prioritize
    const recommendedCategories = [...new Set([...moodCats, ...timeCats])];
    
    // Get sessions from recommended categories
    let recommendations = meditationSessions
      .filter(s => recommendedCategories.includes(s.category))
      .map(({ script, ...rest }) => rest)
      .slice(0, 6);
    
    // If not enough, add general mindfulness
    if (recommendations.length < 6) {
      const additional = meditationSessions
        .filter(s => !recommendations.some(r => r.id === s.id))
        .map(({ script, ...rest }) => rest)
        .slice(0, 6 - recommendations.length);
      recommendations = [...recommendations, ...additional];
    }
    
    return c.json({
      success: true,
      recommendations,
      basedOn: { mood, timeOfDay }
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return c.json({ success: false, error: 'Failed to fetch recommendations' }, 500);
  }
});

// Save meditation journal entry
meditation.post('/journal', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { sessionId, reflection, insights, moodBefore, moodAfter, tags } = body;
    
    const journalId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO meditation_journal (id, user_id, session_id, reflection, insights, mood_before, mood_after, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      journalId, 
      user.id, 
      sessionId || null, 
      reflection || null, 
      insights || null, 
      moodBefore || null, 
      moodAfter || null,
      tags ? JSON.stringify(tags) : null
    ).run();
    
    return c.json({ success: true, journalId });
  } catch (error) {
    console.error('Error saving journal:', error);
    return c.json({ success: false, error: 'Failed to save journal' }, 500);
  }
});

// Get meditation journal entries
meditation.get('/journal', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const entries = await c.env.DB.prepare(`
      SELECT * FROM meditation_journal 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).bind(user.id).all();
    
    return c.json({
      success: true,
      entries: entries.results || []
    });
  } catch (error) {
    console.error('Error fetching journal:', error);
    return c.json({ success: false, error: 'Failed to fetch journal' }, 500);
  }
});

// Helper function to check achievements
async function checkMeditationAchievements(db: D1Database, userId: string): Promise<string[]> {
  const unlockedAchievements: string[] = [];
  
  try {
    // Get user stats
    const stats = await db.prepare(`
      SELECT * FROM meditation_streaks WHERE user_id = ?
    `).bind(userId).first();
    
    if (!stats) return [];
    
    const totalSessions = stats.total_sessions as number;
    const currentStreak = stats.current_streak as number;
    
    // Check session-based achievements
    const sessionAchievements = [
      { id: 'ach_zen_beginner', threshold: 1 },
      { id: 'ach_meditation_10', threshold: 10 },
      { id: 'ach_meditation_50', threshold: 50 },
      { id: 'ach_zen_master', threshold: 100 }
    ];
    
    for (const achievement of sessionAchievements) {
      if (totalSessions >= achievement.threshold) {
        const existing = await db.prepare(`
          SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?
        `).bind(userId, achievement.id).first();
        
        if (!existing) {
          await db.prepare(`
            INSERT INTO user_achievements (id, user_id, achievement_id, unlocked_at)
            VALUES (?, ?, ?, datetime('now'))
          `).bind(crypto.randomUUID(), userId, achievement.id).run();
          unlockedAchievements.push(achievement.id);
        }
      }
    }
    
    // Check streak-based achievements
    const streakAchievements = [
      { id: 'ach_meditation_streak_7', threshold: 7 },
      { id: 'ach_meditation_streak_30', threshold: 30 }
    ];
    
    for (const achievement of streakAchievements) {
      if (currentStreak >= achievement.threshold) {
        const existing = await db.prepare(`
          SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?
        `).bind(userId, achievement.id).first();
        
        if (!existing) {
          await db.prepare(`
            INSERT INTO user_achievements (id, user_id, achievement_id, unlocked_at)
            VALUES (?, ?, ?, datetime('now'))
          `).bind(crypto.randomUUID(), userId, achievement.id).run();
          unlockedAchievements.push(achievement.id);
        }
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
  
  return unlockedAchievements;
}

// Helper function to get time of day
function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export default meditation;
