// Yoga API Endpoints
import { Hono } from 'hono';
import type { Env, Variables } from '../../types';
import { getCurrentUser } from '../../middleware/auth';
import { yogaPoses, yogaCategories } from '../../data/yoga-poses';
import { yogaRoutines, routineCategories } from '../../data/yoga-routines';

const yoga = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get all yoga poses
yoga.get('/poses', async (c) => {
  try {
    const url = new URL(c.req.url);
    const category = url.searchParams.get('category');
    const difficulty = url.searchParams.get('difficulty');
    const search = url.searchParams.get('search');
    
    let poses = [...yogaPoses];
    
    // Filter by category
    if (category) {
      poses = poses.filter(p => p.category === category);
    }
    
    // Filter by difficulty
    if (difficulty) {
      poses = poses.filter(p => p.difficulty === difficulty);
    }
    
    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      poses = poses.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.sanskritName.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Simplify for list view
    const poseList = poses.map(({ instructions, precautions, benefits, ...rest }) => ({
      ...rest,
      benefitCount: benefits.length,
      instructionCount: instructions.length
    }));
    
    return c.json({
      success: true,
      poses: poseList,
      total: poseList.length
    });
  } catch (error) {
    console.error('Error fetching yoga poses:', error);
    return c.json({ success: false, error: 'Failed to fetch poses' }, 500);
  }
});

// Get single yoga pose
yoga.get('/poses/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const pose = yogaPoses.find(p => p.id === id);
    
    if (!pose) {
      return c.json({ success: false, error: 'Pose not found' }, 404);
    }
    
    return c.json({ success: true, pose });
  } catch (error) {
    console.error('Error fetching yoga pose:', error);
    return c.json({ success: false, error: 'Failed to fetch pose' }, 500);
  }
});

// Get pose categories
yoga.get('/pose-categories', async (c) => {
  try {
    return c.json({
      success: true,
      categories: yogaCategories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({ success: false, error: 'Failed to fetch categories' }, 500);
  }
});

// Get all yoga routines
yoga.get('/routines', async (c) => {
  try {
    const url = new URL(c.req.url);
    const category = url.searchParams.get('category');
    const difficulty = url.searchParams.get('difficulty');
    const duration = url.searchParams.get('duration');
    const search = url.searchParams.get('search');
    
    let routines = [...yogaRoutines];
    
    // Filter by category
    if (category) {
      routines = routines.filter(r => r.category === category);
    }
    
    // Filter by difficulty
    if (difficulty) {
      routines = routines.filter(r => r.difficulty === difficulty);
    }
    
    // Filter by max duration
    if (duration) {
      const maxDuration = parseInt(duration);
      routines = routines.filter(r => r.duration <= maxDuration);
    }
    
    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      routines = routines.filter(r => 
        r.title.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower) ||
        r.tags.some(t => t.toLowerCase().includes(searchLower))
      );
    }
    
    // Simplify for list view
    const routineList = routines.map(({ poseSequence, ...rest }) => ({
      ...rest,
      poseCount: poseSequence.length
    }));
    
    return c.json({
      success: true,
      routines: routineList,
      total: routineList.length
    });
  } catch (error) {
    console.error('Error fetching yoga routines:', error);
    return c.json({ success: false, error: 'Failed to fetch routines' }, 500);
  }
});

// Get single yoga routine with full details
yoga.get('/routines/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const routine = yogaRoutines.find(r => r.id === id);
    
    if (!routine) {
      return c.json({ success: false, error: 'Routine not found' }, 404);
    }
    
    // Expand pose details for each pose in the sequence
    const expandedSequence = routine.poseSequence.map(seq => {
      const pose = yogaPoses.find(p => p.id === seq.poseId);
      return {
        ...seq,
        pose: pose ? {
          id: pose.id,
          name: pose.name,
          sanskritName: pose.sanskritName,
          description: pose.description,
          instructions: pose.instructions,
          benefits: pose.benefits,
          precautions: pose.precautions,
          difficulty: pose.difficulty,
          category: pose.category
        } : null
      };
    });
    
    return c.json({
      success: true,
      routine: {
        ...routine,
        poseSequence: expandedSequence
      }
    });
  } catch (error) {
    console.error('Error fetching yoga routine:', error);
    return c.json({ success: false, error: 'Failed to fetch routine' }, 500);
  }
});

// Get routine categories
yoga.get('/routine-categories', async (c) => {
  try {
    return c.json({
      success: true,
      categories: routineCategories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({ success: false, error: 'Failed to fetch categories' }, 500);
  }
});

// Start yoga routine
yoga.post('/start', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { routineId, moodBefore } = body;
    
    if (!routineId) {
      return c.json({ success: false, error: 'Routine ID required' }, 400);
    }
    
    const routine = yogaRoutines.find(r => r.id === routineId);
    if (!routine) {
      return c.json({ success: false, error: 'Routine not found' }, 404);
    }
    
    // Create progress record
    const progressId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO yoga_progress (id, user_id, routine_id, mood_before, started_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(progressId, user.id, routineId, moodBefore || null).run();
    
    return c.json({
      success: true,
      progressId,
      routine: {
        id: routine.id,
        title: routine.title,
        duration: routine.duration,
        poseCount: routine.poseSequence.length
      }
    });
  } catch (error) {
    console.error('Error starting yoga routine:', error);
    return c.json({ success: false, error: 'Failed to start routine' }, 500);
  }
});

// Complete yoga routine
yoga.post('/complete', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { progressId, moodAfter, notes, actualDuration, posesCompleted } = body;
    
    if (!progressId) {
      return c.json({ success: false, error: 'Progress ID required' }, 400);
    }
    
    // Update progress record
    await c.env.DB.prepare(`
      UPDATE yoga_progress 
      SET completed_at = datetime('now'),
          mood_after = ?,
          notes = ?,
          duration = ?,
          poses_completed = ?,
          is_completed = 1
      WHERE id = ? AND user_id = ?
    `).bind(
      moodAfter || null, 
      notes || null, 
      actualDuration || null, 
      posesCompleted || 0,
      progressId, 
      user.id
    ).run();
    
    // Update streak
    const today = new Date().toISOString().split('T')[0];
    const streakResult = await c.env.DB.prepare(`
      SELECT * FROM yoga_streaks WHERE user_id = ?
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
        UPDATE yoga_streaks 
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
        INSERT INTO yoga_streaks (id, user_id, current_streak, longest_streak, last_session_date, total_sessions, total_minutes)
        VALUES (?, ?, 1, 1, ?, 1, ?)
      `).bind(crypto.randomUUID(), user.id, today, Math.round((actualDuration || 0) / 60)).run();
    }
    
    // Check for achievements
    const achievements = await checkYogaAchievements(c.env.DB, String(user.id));
    
    return c.json({
      success: true,
      message: 'Routine completed',
      achievements
    });
  } catch (error) {
    console.error('Error completing yoga routine:', error);
    return c.json({ success: false, error: 'Failed to complete routine' }, 500);
  }
});

// Get user progress
yoga.get('/progress', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    // Get streak data
    const streak = await c.env.DB.prepare(`
      SELECT * FROM yoga_streaks WHERE user_id = ?
    `).bind(user.id).first();
    
    // Get recent sessions
    const recentSessions = await c.env.DB.prepare(`
      SELECT * FROM yoga_progress 
      WHERE user_id = ? AND is_completed = 1
      ORDER BY completed_at DESC
      LIMIT 10
    `).bind(user.id).all();
    
    // Get mood improvement stats
    const moodStats = await c.env.DB.prepare(`
      SELECT 
        AVG(mood_after - mood_before) as avg_improvement,
        COUNT(*) as sessions_with_mood
      FROM yoga_progress
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
yoga.get('/favorites', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const favorites = await c.env.DB.prepare(`
      SELECT routine_id, pose_id FROM yoga_favorites WHERE user_id = ?
    `).bind(user.id).all();
    
    const favoriteRoutineIds = favorites.results
      ?.filter((f: Record<string, unknown>) => f.routine_id)
      .map((f: Record<string, unknown>) => f.routine_id) || [];
    const favoritePoseIds = favorites.results
      ?.filter((f: Record<string, unknown>) => f.pose_id)
      .map((f: Record<string, unknown>) => f.pose_id) || [];
    
    const favoriteRoutines = yogaRoutines
      .filter(r => favoriteRoutineIds.includes(r.id))
      .map(({ poseSequence, ...rest }) => ({ ...rest, poseCount: poseSequence.length }));
    
    const favoritePoses = yogaPoses
      .filter(p => favoritePoseIds.includes(p.id))
      .map(({ instructions, precautions, benefits, ...rest }) => rest);
    
    return c.json({
      success: true,
      routines: favoriteRoutines,
      poses: favoritePoses
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return c.json({ success: false, error: 'Failed to fetch favorites' }, 500);
  }
});

// Add routine favorite
yoga.post('/favorites/routine/:id', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const routineId = c.req.param('id');
    
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO yoga_favorites (id, user_id, routine_id)
      VALUES (?, ?, ?)
    `).bind(crypto.randomUUID(), user.id, routineId).run();
    
    return c.json({ success: true, message: 'Added to favorites' });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return c.json({ success: false, error: 'Failed to add favorite' }, 500);
  }
});

// Remove routine favorite
yoga.delete('/favorites/routine/:id', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const routineId = c.req.param('id');
    
    await c.env.DB.prepare(`
      DELETE FROM yoga_favorites WHERE user_id = ? AND routine_id = ?
    `).bind(user.id, routineId).run();
    
    return c.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return c.json({ success: false, error: 'Failed to remove favorite' }, 500);
  }
});

// Add pose favorite
yoga.post('/favorites/pose/:id', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const poseId = c.req.param('id');
    
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO yoga_favorites (id, user_id, pose_id)
      VALUES (?, ?, ?)
    `).bind(crypto.randomUUID(), user.id, poseId).run();
    
    return c.json({ success: true, message: 'Added to favorites' });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return c.json({ success: false, error: 'Failed to add favorite' }, 500);
  }
});

// Remove pose favorite
yoga.delete('/favorites/pose/:id', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const poseId = c.req.param('id');
    
    await c.env.DB.prepare(`
      DELETE FROM yoga_favorites WHERE user_id = ? AND pose_id = ?
    `).bind(user.id, poseId).run();
    
    return c.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return c.json({ success: false, error: 'Failed to remove favorite' }, 500);
  }
});

// Get streaks
yoga.get('/streaks', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const streak = await c.env.DB.prepare(`
      SELECT * FROM yoga_streaks WHERE user_id = ?
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

// Get recommendations based on goals
yoga.get('/recommendations', async (c) => {
  try {
    const url = new URL(c.req.url);
    const goal = url.searchParams.get('goal') || 'general';
    const difficulty = url.searchParams.get('difficulty') || 'beginner';
    const maxDuration = parseInt(url.searchParams.get('duration') || '1800');
    
    // Goal to category mapping
    const goalCategories: Record<string, string[]> = {
      stress: ['stress_relief', 'anxiety', 'evening'],
      sleep: ['sleep', 'evening', 'stress_relief'],
      flexibility: ['flexibility', 'beginner', 'intermediate'],
      strength: ['strength', 'core', 'intermediate', 'advanced'],
      energy: ['morning', 'strength', 'intermediate'],
      back: ['back_pain', 'beginner', 'stress_relief'],
      general: ['beginner', 'morning', 'flexibility']
    };
    
    const categories = goalCategories[goal] || goalCategories.general;
    
    let recommendations = yogaRoutines
      .filter(r => 
        categories.includes(r.category) &&
        (difficulty === 'any' || r.difficulty === difficulty) &&
        r.duration <= maxDuration
      )
      .map(({ poseSequence, ...rest }) => ({ ...rest, poseCount: poseSequence.length }))
      .slice(0, 6);
    
    // If not enough, add general routines
    if (recommendations.length < 6) {
      const additional = yogaRoutines
        .filter(r => 
          !recommendations.some(rec => rec.id === r.id) &&
          r.difficulty === difficulty &&
          r.duration <= maxDuration
        )
        .map(({ poseSequence, ...rest }) => ({ ...rest, poseCount: poseSequence.length }))
        .slice(0, 6 - recommendations.length);
      recommendations = [...recommendations, ...additional];
    }
    
    return c.json({
      success: true,
      recommendations,
      basedOn: { goal, difficulty, maxDuration }
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return c.json({ success: false, error: 'Failed to fetch recommendations' }, 500);
  }
});

// Create custom routine
yoga.post('/custom-routine', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { title, description, category, difficulty, poseSequence } = body;
    
    if (!title || !poseSequence || poseSequence.length === 0) {
      return c.json({ success: false, error: 'Title and pose sequence required' }, 400);
    }
    
    // Calculate total duration
    const totalDuration = poseSequence.reduce((sum: number, pose: { duration: number }) => sum + pose.duration, 0);
    
    const routineId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO yoga_routines (id, title, description, category, difficulty, duration, pose_count, is_custom, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).bind(
      routineId,
      title,
      description || '',
      category || 'custom',
      difficulty || 'intermediate',
      totalDuration,
      poseSequence.length,
      user.id
    ).run();
    
    // Insert pose sequence
    for (let i = 0; i < poseSequence.length; i++) {
      const pose = poseSequence[i];
      await c.env.DB.prepare(`
        INSERT INTO yoga_routine_poses (id, routine_id, pose_id, pose_order, duration, side, instructions)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        routineId,
        pose.poseId,
        i + 1,
        pose.duration,
        pose.side || null,
        pose.instructions || null
      ).run();
    }
    
    return c.json({
      success: true,
      routineId,
      message: 'Custom routine created'
    });
  } catch (error) {
    console.error('Error creating custom routine:', error);
    return c.json({ success: false, error: 'Failed to create routine' }, 500);
  }
});

// Save yoga journal entry
yoga.post('/journal', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { routineId, reflection, flexibilityNotes, strengthNotes, moodBefore, moodAfter, tags } = body;
    
    const journalId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO yoga_journal (id, user_id, routine_id, reflection, flexibility_notes, strength_notes, mood_before, mood_after, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      journalId,
      user.id,
      routineId || null,
      reflection || null,
      flexibilityNotes || null,
      strengthNotes || null,
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

// Get yoga journal entries
yoga.get('/journal', async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const entries = await c.env.DB.prepare(`
      SELECT * FROM yoga_journal 
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
async function checkYogaAchievements(db: D1Database, userId: string): Promise<string[]> {
  const unlockedAchievements: string[] = [];
  
  try {
    const stats = await db.prepare(`
      SELECT * FROM yoga_streaks WHERE user_id = ?
    `).bind(userId).first();
    
    if (!stats) return [];
    
    const totalSessions = stats.total_sessions as number;
    const currentStreak = stats.current_streak as number;
    
    // Check session-based achievements
    const sessionAchievements = [
      { id: 'ach_yoga_beginner', threshold: 1 },
      { id: 'ach_yoga_25', threshold: 25 },
      { id: 'ach_yoga_warrior', threshold: 50 }
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
      { id: 'ach_yoga_streak_7', threshold: 7 },
      { id: 'ach_yoga_streak_30', threshold: 30 }
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

export default yoga;
