-- Phase 4: Gamification & Engagement Features
-- Enhanced achievements, streaks, challenges, badges, and leaderboards

-- ============================================================================
-- ACHIEVEMENTS SYSTEM (Enhanced)
-- ============================================================================

-- Achievement definitions (system-wide)
CREATE TABLE IF NOT EXISTS achievement_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'milestone', 'streak', 'social', 'exploration', 'voice', 'engagement'
  icon TEXT NOT NULL DEFAULT '🏆',
  points INTEGER NOT NULL DEFAULT 10,
  rarity TEXT NOT NULL DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  criteria_type TEXT NOT NULL, -- 'mood_count', 'streak_days', 'friends_count', etc.
  criteria_value INTEGER NOT NULL, -- Target value to unlock
  is_hidden BOOLEAN DEFAULT FALSE, -- Secret achievements
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User achievements tracking
CREATE TABLE IF NOT EXISTS user_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  achievement_id INTEGER NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  unlocked_at DATETIME,
  notified BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(completed, unlocked_at);

-- ============================================================================
-- STREAKS SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_streaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  grace_day_used BOOLEAN DEFAULT FALSE,
  grace_day_date DATE,
  streak_frozen_until DATE, -- Premium feature: freeze streak
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_current ON user_streaks(current_streak DESC);

-- ============================================================================
-- CHALLENGES SYSTEM (Enhanced)
-- ============================================================================

-- Challenge definitions
CREATE TABLE IF NOT EXISTS challenge_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'group'
  goal_type TEXT NOT NULL, -- 'mood_count', 'voice_count', 'streak', 'share_count'
  goal_value INTEGER NOT NULL,
  reward_points INTEGER NOT NULL DEFAULT 50,
  icon TEXT DEFAULT '🎯',
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  is_recurring BOOLEAN DEFAULT FALSE,
  group_id INTEGER, -- For group challenges
  created_by INTEGER, -- User who created (for group challenges)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_challenge_definitions_type ON challenge_definitions(type, is_active);
CREATE INDEX IF NOT EXISTS idx_challenge_definitions_dates ON challenge_definitions(start_date, end_date);

-- User challenge participation
CREATE TABLE IF NOT EXISTS user_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  challenge_id INTEGER NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at DATETIME,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (challenge_id) REFERENCES challenge_definitions(id) ON DELETE CASCADE,
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge ON user_challenges(challenge_id);

-- ============================================================================
-- POINTS & LEVELS SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  level_name TEXT DEFAULT 'Bronze',
  rank_position INTEGER,
  weekly_points INTEGER DEFAULT 0,
  monthly_points INTEGER DEFAULT 0,
  show_on_leaderboard BOOLEAN DEFAULT TRUE,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_points_total ON user_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_level ON user_points(level DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_weekly ON user_points(weekly_points DESC);

-- Points history/transactions
CREATE TABLE IF NOT EXISTS point_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'mood_log', 'achievement', 'challenge', 'streak_bonus', etc.
  reference_type TEXT, -- 'mood', 'achievement', 'challenge', etc.
  reference_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id, created_at DESC);

-- ============================================================================
-- BADGES SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS badge_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🎖️',
  type TEXT NOT NULL, -- 'achievement', 'level', 'special', 'event'
  rarity TEXT DEFAULT 'common',
  is_showcase_eligible BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  badge_id INTEGER NOT NULL,
  is_showcased BOOLEAN DEFAULT FALSE,
  showcase_order INTEGER,
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badge_definitions(id) ON DELETE CASCADE,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_showcased ON user_badges(user_id, is_showcased);

-- ============================================================================
-- LEADERBOARD CACHE (for performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS leaderboard_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL, -- 'global', 'weekly', 'monthly', 'friends', 'group'
  scope_id INTEGER, -- group_id for group leaderboards
  user_id INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  points INTEGER NOT NULL,
  streak INTEGER DEFAULT 0,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_type ON leaderboard_cache(type, scope_id, rank);

-- ============================================================================
-- SEED ACHIEVEMENT DEFINITIONS
-- ============================================================================

INSERT OR IGNORE INTO achievement_definitions (name, description, category, icon, points, rarity, criteria_type, criteria_value) VALUES
-- Milestone achievements
('First Mood', 'Log your first mood entry', 'milestone', '🌟', 10, 'common', 'mood_count', 1),
('Week Warrior', 'Maintain a 7-day streak', 'streak', '🔥', 50, 'common', 'streak_days', 7),
('Month Master', 'Maintain a 30-day streak', 'streak', '💪', 200, 'rare', 'streak_days', 30),
('Century Club', 'Log 100 mood entries', 'milestone', '💯', 500, 'epic', 'mood_count', 100),
('Year Champion', 'Maintain a 365-day streak', 'streak', '👑', 2000, 'legendary', 'streak_days', 365),

-- Social achievements
('Social Butterfly', 'Make 10 friends', 'social', '🦋', 100, 'rare', 'friends_count', 10),
('Group Leader', 'Create a group', 'social', '👥', 75, 'common', 'groups_created', 1),
('Sharing is Caring', 'Share 5 mood entries', 'social', '💝', 50, 'common', 'shares_count', 5),
('Community Builder', 'Have 25 friends', 'social', '🏘️', 300, 'epic', 'friends_count', 25),

-- Exploration achievements
('Mood Explorer', 'Log all 9 emotion types', 'exploration', '🧭', 75, 'rare', 'unique_emotions', 9),
('Night Owl', 'Log a mood after midnight', 'exploration', '🦉', 25, 'common', 'night_mood', 1),
('Early Bird', 'Log a mood before 6 AM', 'exploration', '🐦', 25, 'common', 'early_mood', 1),
('Weekend Warrior', 'Log moods on 10 weekends', 'exploration', '🎉', 50, 'common', 'weekend_moods', 10),

-- Voice achievements
('Voice Champion', 'Record 10 voice journals', 'voice', '🎤', 100, 'rare', 'voice_count', 10),
('Storyteller', 'Record 50 voice journals', 'voice', '📖', 300, 'epic', 'voice_count', 50),
('Podcast Pro', 'Record 100 voice journals', 'voice', '🎙️', 750, 'legendary', 'voice_count', 100),

-- Engagement achievements
('Insight Seeker', 'View insights 10 times', 'engagement', '🔍', 50, 'common', 'insights_views', 10),
('Data Lover', 'Export your data', 'engagement', '📊', 25, 'common', 'data_export', 1),
('Dedicated User', 'Use MoodMash for 30 days', 'engagement', '🏠', 150, 'rare', 'days_active', 30),
('Power User', 'Log 500 mood entries', 'milestone', '⚡', 1000, 'legendary', 'mood_count', 500);

-- ============================================================================
-- SEED BADGE DEFINITIONS
-- ============================================================================

INSERT OR IGNORE INTO badge_definitions (name, description, icon, type, rarity) VALUES
-- Level badges
('Bronze Member', 'Reached Bronze level', '🥉', 'level', 'common'),
('Silver Member', 'Reached Silver level', '🥈', 'level', 'common'),
('Gold Member', 'Reached Gold level', '🥇', 'level', 'rare'),
('Platinum Member', 'Reached Platinum level', '💎', 'level', 'epic'),
('Diamond Member', 'Reached Diamond level', '💠', 'level', 'legendary'),

-- Special badges
('Early Adopter', 'Joined in the early days', '🚀', 'special', 'rare'),
('Beta Tester', 'Helped test new features', '🧪', 'special', 'rare'),
('Bug Hunter', 'Found and reported a bug', '🐛', 'special', 'epic'),
('Feedback Champion', 'Provided valuable feedback', '💬', 'special', 'rare'),

-- Achievement badges (linked to achievements)
('Streak Master', 'Achieved a 30+ day streak', '🔥', 'achievement', 'rare'),
('Social Star', 'Very active in the community', '⭐', 'achievement', 'rare'),
('Voice Pioneer', 'Active voice journal user', '🎤', 'achievement', 'rare');

-- ============================================================================
-- SEED DEFAULT CHALLENGES
-- ============================================================================

INSERT OR IGNORE INTO challenge_definitions (name, description, type, goal_type, goal_value, reward_points, icon, is_active, is_recurring) VALUES
('Daily Check-in', 'Log at least one mood today', 'daily', 'mood_count', 1, 10, '✅', 1, 1),
('Weekly Wellness', 'Log 5 moods this week', 'weekly', 'mood_count', 5, 50, '📅', 1, 1),
('Voice Week', 'Record 3 voice journals this week', 'weekly', 'voice_count', 3, 75, '🎤', 1, 1),
('Social Week', 'Share 2 moods this week', 'weekly', 'share_count', 2, 40, '💝', 1, 1),
('Monthly Marathon', 'Log 20 moods this month', 'monthly', 'mood_count', 20, 200, '🏃', 1, 1),
('Streak Starter', 'Build a 7-day streak', 'weekly', 'streak', 7, 100, '🔥', 1, 0);
