// Gamification API - Phase 4 Features
// Achievements, Streaks, Challenges, Points, Badges, Leaderboards

import { Hono } from 'hono';
import type { Env, Variables } from '../../types';
import { getCurrentUser } from '../../middleware/auth';

// ============================================================================
// TYPES
// ============================================================================

interface AchievementDef {
  id: number;
  name: string;
  description: string;
  category: string;
  icon: string;
  points: number;
  rarity: string;
  criteria_type: string;
  criteria_value: number;
  is_hidden: boolean;
}

interface UserAchievement {
  id: number;
  user_id: number;
  achievement_id: number;
  progress: number;
  completed: boolean;
  unlocked_at: string | null;
}

interface UserStreak {
  id: number;
  user_id: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  grace_day_used: boolean;
}

interface ChallengeDef {
  id: number;
  name: string;
  description: string;
  type: string;
  goal_type: string;
  goal_value: number;
  reward_points: number;
  icon: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

interface UserChallenge {
  id: number;
  user_id: number;
  challenge_id: number;
  progress: number;
  completed: boolean;
  completed_at: string | null;
}

interface UserPoints {
  id: number;
  user_id: number;
  total_points: number;
  level: number;
  level_name: string;
  rank_position: number | null;
  weekly_points: number;
  monthly_points: number;
  show_on_leaderboard: boolean;
}

interface BadgeDef {
  id: number;
  name: string;
  description: string;
  icon: string;
  type: string;
  rarity: string;
}

interface UserBadge {
  id: number;
  user_id: number;
  badge_id: number;
  is_showcased: boolean;
  showcase_order: number | null;
  earned_at: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LEVELS = [
  { level: 1, name: 'Bronze', minPoints: 0 },
  { level: 2, name: 'Silver', minPoints: 500 },
  { level: 3, name: 'Gold', minPoints: 2000 },
  { level: 4, name: 'Platinum', minPoints: 5000 },
  { level: 5, name: 'Diamond', minPoints: 10000 },
];

const POINTS_CONFIG = {
  mood_log: 5,
  voice_journal: 10,
  share_mood: 3,
  streak_bonus_7: 25,
  streak_bonus_30: 100,
  streak_bonus_100: 500,
  view_insights: 1,
  friend_added: 5,
};

// ============================================================================
// HELPERS
// ============================================================================

function getLevelInfo(points: number): { level: number; name: string; progress: number; nextLevel: number | null } {
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1] || null;
  
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] || null;
      break;
    }
  }
  
  const progress = nextLevel 
    ? Math.floor(((points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100)
    : 100;
  
  return {
    level: currentLevel.level,
    name: currentLevel.name,
    progress,
    nextLevel: nextLevel?.minPoints ?? null,
  };
}

async function ensureUserPoints(db: D1Database, userId: number): Promise<void> {
  const existing = await db.prepare(
    'SELECT id FROM user_points WHERE user_id = ?'
  ).bind(userId).first();
  
  if (!existing) {
    await db.prepare(
      `INSERT INTO user_points (user_id, total_points, level, level_name) VALUES (?, 0, 1, 'Bronze')`
    ).bind(userId).run();
  }
}

async function ensureUserStreak(db: D1Database, userId: number): Promise<void> {
  const existing = await db.prepare(
    'SELECT id FROM user_streaks WHERE user_id = ?'
  ).bind(userId).first();
  
  if (!existing) {
    await db.prepare(
      `INSERT INTO user_streaks (user_id, current_streak, longest_streak) VALUES (?, 0, 0)`
    ).bind(userId).run();
  }
}

async function addPoints(
  db: D1Database, 
  userId: number, 
  points: number, 
  reason: string,
  refType?: string,
  refId?: number
): Promise<void> {
  await ensureUserPoints(db, userId);
  
  // Add transaction
  await db.prepare(
    `INSERT INTO point_transactions (user_id, points, reason, reference_type, reference_id)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(userId, points, reason, refType || null, refId || null).run();
  
  // Update totals
  await db.prepare(
    `UPDATE user_points 
     SET total_points = total_points + ?,
         weekly_points = weekly_points + ?,
         monthly_points = monthly_points + ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(points, points, points, userId).run();
  
  // Update level
  const userPoints = await db.prepare(
    'SELECT total_points FROM user_points WHERE user_id = ?'
  ).bind(userId).first<{ total_points: number }>();
  
  if (userPoints) {
    const levelInfo = getLevelInfo(userPoints.total_points);
    await db.prepare(
      `UPDATE user_points SET level = ?, level_name = ? WHERE user_id = ?`
    ).bind(levelInfo.level, levelInfo.name, userId).run();
    
    // Award level badge if new level
    await awardLevelBadge(db, userId, levelInfo.level);
  }
}

async function awardLevelBadge(db: D1Database, userId: number, level: number): Promise<void> {
  const badgeNames: Record<number, string> = {
    1: 'Bronze Member',
    2: 'Silver Member',
    3: 'Gold Member',
    4: 'Platinum Member',
    5: 'Diamond Member',
  };
  
  const badgeName = badgeNames[level];
  if (!badgeName) return;
  
  const badge = await db.prepare(
    'SELECT id FROM badge_definitions WHERE name = ?'
  ).bind(badgeName).first<{ id: number }>();
  
  if (badge) {
    await db.prepare(
      `INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)`
    ).bind(userId, badge.id).run();
  }
}

// ============================================================================
// ACHIEVEMENT CHECKER
// ============================================================================

export async function checkAndAwardAchievements(db: D1Database, userId: number): Promise<AchievementDef[]> {
  const newlyUnlocked: AchievementDef[] = [];
  
  // Get all achievement definitions
  const achievements = await db.prepare(
    'SELECT * FROM achievement_definitions'
  ).all<AchievementDef>();
  
  if (!achievements.results) return newlyUnlocked;
  
  // Get user stats
  const moodCount = await db.prepare(
    'SELECT COUNT(*) as count FROM mood_entries WHERE user_id = ?'
  ).bind(userId).first<{ count: number }>();
  
  const uniqueEmotions = await db.prepare(
    'SELECT COUNT(DISTINCT emotion) as count FROM mood_entries WHERE user_id = ?'
  ).bind(userId).first<{ count: number }>();
  
  const voiceCount = await db.prepare(
    'SELECT COUNT(*) as count FROM voice_journals WHERE user_id = ?'
  ).bind(userId).first<{ count: number }>();
  
  const friendsCount = await db.prepare(
    `SELECT COUNT(*) as count FROM friendships 
     WHERE (user_id = ? OR friend_id = ?) AND status = 'accepted'`
  ).bind(userId, userId).first<{ count: number }>();
  
  const groupsCreated = await db.prepare(
    'SELECT COUNT(*) as count FROM groups WHERE owner_id = ?'
  ).bind(userId).first<{ count: number }>();
  
  const sharesCount = await db.prepare(
    'SELECT COUNT(*) as count FROM mood_shares WHERE user_id = ?'
  ).bind(userId).first<{ count: number }>();
  
  const streak = await db.prepare(
    'SELECT current_streak FROM user_streaks WHERE user_id = ?'
  ).bind(userId).first<{ current_streak: number }>();
  
  // Get last mood time for night/early bird
  const lastMood = await db.prepare(
    `SELECT created_at FROM mood_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`
  ).bind(userId).first<{ created_at: string }>();
  
  let nightMood = 0;
  let earlyMood = 0;
  if (lastMood) {
    const hour = new Date(lastMood.created_at).getHours();
    if (hour >= 0 && hour < 5) nightMood = 1;
    if (hour >= 5 && hour < 6) earlyMood = 1;
  }
  
  // Map criteria to values
  const criteriaValues: Record<string, number> = {
    mood_count: moodCount?.count || 0,
    unique_emotions: uniqueEmotions?.count || 0,
    voice_count: voiceCount?.count || 0,
    friends_count: friendsCount?.count || 0,
    groups_created: groupsCreated?.count || 0,
    shares_count: sharesCount?.count || 0,
    streak_days: streak?.current_streak || 0,
    night_mood: nightMood,
    early_mood: earlyMood,
    insights_views: 0, // Would need tracking
    data_export: 0, // Would need tracking
    days_active: 0, // Would need tracking
    weekend_moods: 0, // Would need calculation
  };
  
  for (const achievement of achievements.results) {
    // Get or create user achievement progress
    let userAch = await db.prepare(
      'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?'
    ).bind(userId, achievement.id).first<UserAchievement>();
    
    if (!userAch) {
      await db.prepare(
        `INSERT INTO user_achievements (user_id, achievement_id, progress, completed)
         VALUES (?, ?, 0, FALSE)`
      ).bind(userId, achievement.id).run();
      
      userAch = {
        id: 0,
        user_id: userId,
        achievement_id: achievement.id,
        progress: 0,
        completed: false,
        unlocked_at: null,
      };
    }
    
    if (userAch.completed) continue;
    
    // Get current progress value
    const currentValue = criteriaValues[achievement.criteria_type] || 0;
    
    // Update progress
    await db.prepare(
      `UPDATE user_achievements SET progress = ? WHERE user_id = ? AND achievement_id = ?`
    ).bind(currentValue, userId, achievement.id).run();
    
    // Check if completed
    if (currentValue >= achievement.criteria_value) {
      await db.prepare(
        `UPDATE user_achievements 
         SET completed = TRUE, unlocked_at = CURRENT_TIMESTAMP, notified = FALSE
         WHERE user_id = ? AND achievement_id = ?`
      ).bind(userId, achievement.id).run();
      
      // Award points
      await addPoints(db, userId, achievement.points, 'achievement', 'achievement', achievement.id);
      
      newlyUnlocked.push(achievement);
    }
  }
  
  return newlyUnlocked;
}

// ============================================================================
// STREAK HANDLER
// ============================================================================

export async function updateStreak(db: D1Database, userId: number): Promise<{ current: number; longest: number; isNew: boolean }> {
  await ensureUserStreak(db, userId);
  
  const today = new Date().toISOString().split('T')[0];
  
  const streak = await db.prepare(
    'SELECT * FROM user_streaks WHERE user_id = ?'
  ).bind(userId).first<UserStreak>();
  
  if (!streak) {
    return { current: 1, longest: 1, isNew: true };
  }
  
  const lastActivity = streak.last_activity_date;
  
  // Already logged today
  if (lastActivity === today) {
    return { current: streak.current_streak, longest: streak.longest_streak, isNew: false };
  }
  
  let newStreak = 1;
  let isNew = true;
  
  if (lastActivity) {
    const lastDate = new Date(lastActivity);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Consecutive day
      newStreak = streak.current_streak + 1;
    } else if (diffDays === 2 && !streak.grace_day_used) {
      // Grace day - missed one day but continuing
      newStreak = streak.current_streak + 1;
      await db.prepare(
        `UPDATE user_streaks SET grace_day_used = TRUE, grace_day_date = ? WHERE user_id = ?`
      ).bind(today, userId).run();
    }
    // else: streak reset to 1
  }
  
  const newLongest = Math.max(newStreak, streak.longest_streak);
  
  await db.prepare(
    `UPDATE user_streaks 
     SET current_streak = ?, longest_streak = ?, last_activity_date = ?, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(newStreak, newLongest, today, userId).run();
  
  // Award streak bonuses
  if (newStreak === 7) {
    await addPoints(db, userId, POINTS_CONFIG.streak_bonus_7, 'streak_bonus', 'streak', 7);
  } else if (newStreak === 30) {
    await addPoints(db, userId, POINTS_CONFIG.streak_bonus_30, 'streak_bonus', 'streak', 30);
  } else if (newStreak === 100) {
    await addPoints(db, userId, POINTS_CONFIG.streak_bonus_100, 'streak_bonus', 'streak', 100);
  }
  
  return { current: newStreak, longest: newLongest, isNew };
}

// ============================================================================
// CHALLENGE PROGRESS HANDLER
// ============================================================================

export async function updateChallengeProgress(
  db: D1Database, 
  userId: number, 
  goalType: string,
  increment: number = 1
): Promise<ChallengeDef[]> {
  const completed: ChallengeDef[] = [];
  
  // Get active challenges the user has joined
  const userChallenges = await db.prepare(
    `SELECT uc.*, cd.* FROM user_challenges uc
     JOIN challenge_definitions cd ON uc.challenge_id = cd.id
     WHERE uc.user_id = ? AND uc.completed = FALSE AND cd.is_active = TRUE
     AND cd.goal_type = ?
     AND (cd.end_date IS NULL OR cd.end_date >= DATE('now'))`
  ).bind(userId, goalType).all<UserChallenge & ChallengeDef>();
  
  if (!userChallenges.results) return completed;
  
  for (const challenge of userChallenges.results) {
    const newProgress = challenge.progress + increment;
    
    if (newProgress >= challenge.goal_value) {
      // Challenge completed
      await db.prepare(
        `UPDATE user_challenges 
         SET progress = ?, completed = TRUE, completed_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND challenge_id = ?`
      ).bind(newProgress, userId, challenge.challenge_id).run();
      
      // Award points
      await addPoints(db, userId, challenge.reward_points, 'challenge', 'challenge', challenge.challenge_id);
      
      completed.push(challenge);
    } else {
      await db.prepare(
        `UPDATE user_challenges SET progress = ? WHERE user_id = ? AND challenge_id = ?`
      ).bind(newProgress, userId, challenge.challenge_id).run();
    }
  }
  
  return completed;
}

// ============================================================================
// ROUTES
// ============================================================================

const gamificationRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ============================================================================
// ACHIEVEMENTS ENDPOINTS
// ============================================================================

// Get all achievements (definitions)
gamificationRoutes.get('/api/achievements', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const achievements = await c.env.DB.prepare(
    `SELECT * FROM achievement_definitions WHERE is_hidden = FALSE ORDER BY category, points`
  ).all<AchievementDef>();
  
  return c.json({
    achievements: achievements.results || [],
    categories: ['milestone', 'streak', 'social', 'exploration', 'voice', 'engagement'],
  });
});

// Get user's achievement progress
gamificationRoutes.get('/api/achievements/user', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const achievements = await c.env.DB.prepare(
    `SELECT ad.*, ua.progress, ua.completed, ua.unlocked_at
     FROM achievement_definitions ad
     LEFT JOIN user_achievements ua ON ad.id = ua.achievement_id AND ua.user_id = ?
     WHERE ad.is_hidden = FALSE
     ORDER BY ua.completed DESC, ad.category, ad.points`
  ).bind(user.id).all();
  
  const stats = await c.env.DB.prepare(
    `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) as completed,
       SUM(CASE WHEN completed = TRUE THEN ad.points ELSE 0 END) as points_earned
     FROM user_achievements ua
     JOIN achievement_definitions ad ON ua.achievement_id = ad.id
     WHERE ua.user_id = ?`
  ).bind(user.id).first();
  
  return c.json({
    achievements: achievements.results || [],
    stats: {
      total: stats?.total || 0,
      completed: stats?.completed || 0,
      points_earned: stats?.points_earned || 0,
    },
  });
});

// Get specific achievement progress
gamificationRoutes.get('/api/achievements/:id/progress', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const achievementId = parseInt(c.req.param('id'));
  
  const achievement = await c.env.DB.prepare(
    `SELECT ad.*, ua.progress, ua.completed, ua.unlocked_at
     FROM achievement_definitions ad
     LEFT JOIN user_achievements ua ON ad.id = ua.achievement_id AND ua.user_id = ?
     WHERE ad.id = ?`
  ).bind(user.id, achievementId).first();
  
  if (!achievement) {
    return c.json({ error: 'Achievement not found' }, 404);
  }
  
  return c.json({ achievement });
});

// Get new unlocked achievements (for notifications)
gamificationRoutes.get('/api/achievements/new', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const newAchievements = await c.env.DB.prepare(
    `SELECT ad.*, ua.unlocked_at
     FROM user_achievements ua
     JOIN achievement_definitions ad ON ua.achievement_id = ad.id
     WHERE ua.user_id = ? AND ua.completed = TRUE AND ua.notified = FALSE
     ORDER BY ua.unlocked_at DESC`
  ).bind(user.id).all();
  
  // Mark as notified
  if (newAchievements.results && newAchievements.results.length > 0) {
    await c.env.DB.prepare(
      `UPDATE user_achievements SET notified = TRUE WHERE user_id = ? AND notified = FALSE`
    ).bind(user.id).run();
  }
  
  return c.json({ achievements: newAchievements.results || [] });
});

// ============================================================================
// STREAKS ENDPOINTS
// ============================================================================

// Get user's streak info
gamificationRoutes.get('/api/streaks', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  await ensureUserStreak(c.env.DB, user.id);
  
  const streak = await c.env.DB.prepare(
    `SELECT * FROM user_streaks WHERE user_id = ?`
  ).bind(user.id).first<UserStreak>();
  
  // Get streak history (last 30 days of activity)
  const history = await c.env.DB.prepare(
    `SELECT DATE(created_at) as date, COUNT(*) as count
     FROM mood_entries
     WHERE user_id = ? AND created_at >= DATE('now', '-30 days')
     GROUP BY DATE(created_at)
     ORDER BY date DESC`
  ).bind(user.id).all();
  
  return c.json({
    current_streak: streak?.current_streak || 0,
    longest_streak: streak?.longest_streak || 0,
    last_activity: streak?.last_activity_date,
    grace_day_available: !streak?.grace_day_used,
    history: history.results || [],
  });
});

// Get streak leaderboard
gamificationRoutes.get('/api/streaks/leaderboard', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const limit = parseInt(c.req.query('limit') || '20');
  
  const leaderboard = await c.env.DB.prepare(
    `SELECT us.current_streak, us.longest_streak, u.id, u.name, u.email,
            up.display_name, up.avatar_url
     FROM user_streaks us
     JOIN users u ON us.user_id = u.id
     LEFT JOIN user_profiles up ON u.id = up.user_id
     WHERE us.current_streak > 0
     ORDER BY us.current_streak DESC, us.longest_streak DESC
     LIMIT ?`
  ).bind(limit).all();
  
  return c.json({ leaderboard: leaderboard.results || [] });
});

// ============================================================================
// CHALLENGES ENDPOINTS
// ============================================================================

// Get all available challenges
gamificationRoutes.get('/api/challenges', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const challenges = await c.env.DB.prepare(
    `SELECT cd.*, uc.progress, uc.completed, uc.joined_at
     FROM challenge_definitions cd
     LEFT JOIN user_challenges uc ON cd.id = uc.challenge_id AND uc.user_id = ?
     WHERE cd.is_active = TRUE
     AND (cd.end_date IS NULL OR cd.end_date >= DATE('now'))
     ORDER BY cd.type, cd.reward_points DESC`
  ).bind(user.id).all();
  
  return c.json({ challenges: challenges.results || [] });
});

// Get active challenges for user
gamificationRoutes.get('/api/challenges/active', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const challenges = await c.env.DB.prepare(
    `SELECT cd.*, uc.progress, uc.joined_at
     FROM user_challenges uc
     JOIN challenge_definitions cd ON uc.challenge_id = cd.id
     WHERE uc.user_id = ? AND uc.completed = FALSE AND cd.is_active = TRUE
     AND (cd.end_date IS NULL OR cd.end_date >= DATE('now'))
     ORDER BY uc.joined_at DESC`
  ).bind(user.id).all();
  
  return c.json({ challenges: challenges.results || [] });
});

// Join a challenge
gamificationRoutes.post('/api/challenges/:id/join', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const challengeId = parseInt(c.req.param('id'));
  
  // Check if challenge exists and is active
  const challenge = await c.env.DB.prepare(
    `SELECT * FROM challenge_definitions WHERE id = ? AND is_active = TRUE`
  ).bind(challengeId).first<ChallengeDef>();
  
  if (!challenge) {
    return c.json({ error: 'Challenge not found or inactive' }, 404);
  }
  
  // Check if already joined
  const existing = await c.env.DB.prepare(
    `SELECT * FROM user_challenges WHERE user_id = ? AND challenge_id = ?`
  ).bind(user.id, challengeId).first();
  
  if (existing) {
    return c.json({ error: 'Already joined this challenge' }, 400);
  }
  
  // Join the challenge
  await c.env.DB.prepare(
    `INSERT INTO user_challenges (user_id, challenge_id, progress) VALUES (?, ?, 0)`
  ).bind(user.id, challengeId).run();
  
  return c.json({ 
    success: true, 
    message: `Joined challenge: ${challenge.name}`,
    challenge,
  });
});

// Get challenge progress
gamificationRoutes.get('/api/challenges/:id/progress', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const challengeId = parseInt(c.req.param('id'));
  
  const challenge = await c.env.DB.prepare(
    `SELECT cd.*, uc.progress, uc.completed, uc.completed_at, uc.joined_at
     FROM challenge_definitions cd
     LEFT JOIN user_challenges uc ON cd.id = uc.challenge_id AND uc.user_id = ?
     WHERE cd.id = ?`
  ).bind(user.id, challengeId).first();
  
  if (!challenge) {
    return c.json({ error: 'Challenge not found' }, 404);
  }
  
  return c.json({ challenge });
});

// Get completed challenges history
gamificationRoutes.get('/api/challenges/history', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const challenges = await c.env.DB.prepare(
    `SELECT cd.*, uc.progress, uc.completed_at
     FROM user_challenges uc
     JOIN challenge_definitions cd ON uc.challenge_id = cd.id
     WHERE uc.user_id = ? AND uc.completed = TRUE
     ORDER BY uc.completed_at DESC`
  ).bind(user.id).all();
  
  return c.json({ challenges: challenges.results || [] });
});

// ============================================================================
// POINTS ENDPOINTS
// ============================================================================

// Get user points and level
gamificationRoutes.get('/api/points', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  await ensureUserPoints(c.env.DB, user.id);
  
  const points = await c.env.DB.prepare(
    `SELECT * FROM user_points WHERE user_id = ?`
  ).bind(user.id).first<UserPoints>();
  
  const levelInfo = getLevelInfo(points?.total_points || 0);
  
  // Get recent transactions
  const transactions = await c.env.DB.prepare(
    `SELECT * FROM point_transactions 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT 20`
  ).bind(user.id).all();
  
  return c.json({
    total_points: points?.total_points || 0,
    level: levelInfo.level,
    level_name: levelInfo.name,
    progress_to_next: levelInfo.progress,
    next_level_points: levelInfo.nextLevel,
    weekly_points: points?.weekly_points || 0,
    monthly_points: points?.monthly_points || 0,
    transactions: transactions.results || [],
    levels: LEVELS,
  });
});

// Toggle leaderboard visibility
gamificationRoutes.post('/api/points/visibility', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const { show } = await c.req.json<{ show: boolean }>();
  
  await ensureUserPoints(c.env.DB, user.id);
  
  await c.env.DB.prepare(
    `UPDATE user_points SET show_on_leaderboard = ? WHERE user_id = ?`
  ).bind(show ? 1 : 0, user.id).run();
  
  return c.json({ success: true, show_on_leaderboard: show });
});

// ============================================================================
// LEADERBOARD ENDPOINTS
// ============================================================================

// Global leaderboard
gamificationRoutes.get('/api/leaderboard/global', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const period = c.req.query('period') || 'all'; // 'all', 'weekly', 'monthly'
  const limit = parseInt(c.req.query('limit') || '50');
  
  let orderBy = 'total_points';
  if (period === 'weekly') orderBy = 'weekly_points';
  if (period === 'monthly') orderBy = 'monthly_points';
  
  const leaderboard = await c.env.DB.prepare(
    `SELECT up.${orderBy} as points, up.level, up.level_name, 
            u.id, u.name, u.email, upr.display_name, upr.avatar_url
     FROM user_points up
     JOIN users u ON up.user_id = u.id
     LEFT JOIN user_profiles upr ON u.id = upr.user_id
     WHERE up.show_on_leaderboard = TRUE AND up.${orderBy} > 0
     ORDER BY up.${orderBy} DESC
     LIMIT ?`
  ).bind(limit).all();
  
  // Get current user's rank
  const userRank = await c.env.DB.prepare(
    `SELECT COUNT(*) + 1 as rank 
     FROM user_points 
     WHERE ${orderBy} > (SELECT ${orderBy} FROM user_points WHERE user_id = ?)
     AND show_on_leaderboard = TRUE`
  ).bind(user.id).first<{ rank: number }>();
  
  return c.json({
    leaderboard: leaderboard.results || [],
    user_rank: userRank?.rank || null,
    period,
  });
});

// Friends leaderboard
gamificationRoutes.get('/api/leaderboard/friends', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const leaderboard = await c.env.DB.prepare(
    `SELECT up.total_points as points, up.level, up.level_name,
            u.id, u.name, u.email, upr.display_name, upr.avatar_url
     FROM user_points up
     JOIN users u ON up.user_id = u.id
     LEFT JOIN user_profiles upr ON u.id = upr.user_id
     WHERE (up.user_id = ? OR up.user_id IN (
       SELECT CASE WHEN user_id = ? THEN friend_id ELSE user_id END
       FROM friendships
       WHERE (user_id = ? OR friend_id = ?) AND status = 'accepted'
     ))
     AND up.show_on_leaderboard = TRUE
     ORDER BY up.total_points DESC
     LIMIT 50`
  ).bind(user.id, user.id, user.id, user.id).all();
  
  return c.json({ leaderboard: leaderboard.results || [] });
});

// Group leaderboard
gamificationRoutes.get('/api/leaderboard/group/:id', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const groupId = parseInt(c.req.param('id'));
  
  // Check if user is member of group
  const membership = await c.env.DB.prepare(
    `SELECT * FROM group_members WHERE group_id = ? AND user_id = ?`
  ).bind(groupId, user.id).first();
  
  if (!membership) {
    return c.json({ error: 'Not a member of this group' }, 403);
  }
  
  const leaderboard = await c.env.DB.prepare(
    `SELECT up.total_points as points, up.level, up.level_name,
            u.id, u.name, u.email, upr.display_name, upr.avatar_url
     FROM user_points up
     JOIN users u ON up.user_id = u.id
     JOIN group_members gm ON u.id = gm.user_id
     LEFT JOIN user_profiles upr ON u.id = upr.user_id
     WHERE gm.group_id = ? AND up.show_on_leaderboard = TRUE
     ORDER BY up.total_points DESC`
  ).bind(groupId).all();
  
  return c.json({ leaderboard: leaderboard.results || [] });
});

// ============================================================================
// BADGES ENDPOINTS
// ============================================================================

// Get all badges
gamificationRoutes.get('/api/badges', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const badges = await c.env.DB.prepare(
    `SELECT bd.*, ub.earned_at, ub.is_showcased, ub.showcase_order
     FROM badge_definitions bd
     LEFT JOIN user_badges ub ON bd.id = ub.badge_id AND ub.user_id = ?
     ORDER BY ub.earned_at IS NOT NULL DESC, bd.rarity DESC, bd.name`
  ).bind(user.id).all();
  
  return c.json({ badges: badges.results || [] });
});

// Get user's badges
gamificationRoutes.get('/api/badges/user', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const badges = await c.env.DB.prepare(
    `SELECT bd.*, ub.earned_at, ub.is_showcased, ub.showcase_order
     FROM user_badges ub
     JOIN badge_definitions bd ON ub.badge_id = bd.id
     WHERE ub.user_id = ?
     ORDER BY ub.is_showcased DESC, ub.showcase_order, ub.earned_at DESC`
  ).bind(user.id).all();
  
  return c.json({ badges: badges.results || [] });
});

// Update badge showcase
gamificationRoutes.post('/api/badges/showcase', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const { badge_ids } = await c.req.json<{ badge_ids: number[] }>();
  
  if (!badge_ids || badge_ids.length > 5) {
    return c.json({ error: 'Can showcase up to 5 badges' }, 400);
  }
  
  // Reset all showcases
  await c.env.DB.prepare(
    `UPDATE user_badges SET is_showcased = FALSE, showcase_order = NULL WHERE user_id = ?`
  ).bind(user.id).run();
  
  // Set new showcases
  for (let i = 0; i < badge_ids.length; i++) {
    await c.env.DB.prepare(
      `UPDATE user_badges SET is_showcased = TRUE, showcase_order = ? 
       WHERE user_id = ? AND badge_id = ?`
    ).bind(i + 1, user.id, badge_ids[i]).run();
  }
  
  return c.json({ success: true, showcased: badge_ids });
});

// ============================================================================
// GAMIFICATION STATS (Dashboard widget)
// ============================================================================

gamificationRoutes.get('/api/gamification/stats', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  await ensureUserPoints(c.env.DB, user.id);
  await ensureUserStreak(c.env.DB, user.id);
  
  const points = await c.env.DB.prepare(
    `SELECT * FROM user_points WHERE user_id = ?`
  ).bind(user.id).first<UserPoints>();
  
  const streak = await c.env.DB.prepare(
    `SELECT * FROM user_streaks WHERE user_id = ?`
  ).bind(user.id).first<UserStreak>();
  
  const achievementStats = await c.env.DB.prepare(
    `SELECT COUNT(*) as completed FROM user_achievements 
     WHERE user_id = ? AND completed = TRUE`
  ).bind(user.id).first<{ completed: number }>();
  
  const totalAchievements = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM achievement_definitions WHERE is_hidden = FALSE`
  ).first<{ total: number }>();
  
  const activeChallenges = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM user_challenges uc
     JOIN challenge_definitions cd ON uc.challenge_id = cd.id
     WHERE uc.user_id = ? AND uc.completed = FALSE AND cd.is_active = TRUE`
  ).bind(user.id).first<{ count: number }>();
  
  const showcasedBadges = await c.env.DB.prepare(
    `SELECT bd.* FROM user_badges ub
     JOIN badge_definitions bd ON ub.badge_id = bd.id
     WHERE ub.user_id = ? AND ub.is_showcased = TRUE
     ORDER BY ub.showcase_order
     LIMIT 5`
  ).bind(user.id).all();
  
  const levelInfo = getLevelInfo(points?.total_points || 0);
  
  return c.json({
    points: {
      total: points?.total_points || 0,
      level: levelInfo.level,
      level_name: levelInfo.name,
      progress: levelInfo.progress,
      next_level: levelInfo.nextLevel,
    },
    streak: {
      current: streak?.current_streak || 0,
      longest: streak?.longest_streak || 0,
    },
    achievements: {
      completed: achievementStats?.completed || 0,
      total: totalAchievements?.total || 0,
    },
    active_challenges: activeChallenges?.count || 0,
    showcased_badges: showcasedBadges.results || [],
  });
});

export default gamificationRoutes;
export { addPoints, POINTS_CONFIG };
