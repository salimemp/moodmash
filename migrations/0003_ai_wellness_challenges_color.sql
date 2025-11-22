-- Migration for AI Wellness Tips, Challenges & Achievements, Color Psychology
-- Version 3.0 - November 2025

-- AI Wellness Tips table
CREATE TABLE IF NOT EXISTS ai_wellness_tips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  -- Tip content
  tip_text TEXT NOT NULL,
  category TEXT NOT NULL, -- mindfulness, exercise, sleep, nutrition, social
  mood_context TEXT, -- JSON of user's recent moods
  
  -- AI metadata
  ai_model TEXT DEFAULT 'gpt-4', -- AI model used
  prompt_version TEXT, -- Track prompt versions
  confidence_score REAL, -- 0-1 confidence
  
  -- User interaction
  is_helpful BOOLEAN,
  user_rating INTEGER CHECK(user_rating >= 1 AND user_rating <= 5),
  feedback TEXT,
  
  -- Timestamps
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  viewed_at DATETIME,
  rated_at DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Challenge details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK(challenge_type IN ('daily', 'weekly', 'monthly', 'custom')),
  category TEXT NOT NULL, -- streak, mood_variety, activity_completion, consistency
  
  -- Requirements
  goal_value INTEGER NOT NULL, -- Target value (e.g., 7 for "Log mood 7 days")
  goal_metric TEXT NOT NULL, -- What to count (entries, unique_moods, activities, etc.)
  duration_days INTEGER, -- How long the challenge lasts
  
  -- Rewards
  points INTEGER DEFAULT 0,
  badge_icon TEXT, -- Icon for badge
  badge_color TEXT, -- Color for badge
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')),
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User Challenge Progress table
CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  challenge_id INTEGER NOT NULL,
  
  -- Progress tracking
  current_value INTEGER DEFAULT 0, -- Current progress
  goal_value INTEGER NOT NULL, -- Target value
  is_completed BOOLEAN DEFAULT FALSE,
  completion_percentage REAL DEFAULT 0, -- 0-100
  
  -- Timestamps
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  expires_at DATETIME, -- For time-limited challenges
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
  UNIQUE(user_id, challenge_id)
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  -- Achievement details
  achievement_type TEXT NOT NULL, -- challenge_complete, streak_milestone, total_entries, etc.
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Badge
  badge_icon TEXT,
  badge_color TEXT,
  points INTEGER DEFAULT 0,
  
  -- Metadata
  metadata TEXT, -- JSON with additional info
  
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Points & Levels table
CREATE TABLE IF NOT EXISTS user_gamification (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  
  -- Points system
  total_points INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  points_to_next_level INTEGER DEFAULT 100,
  
  -- Streaks
  current_streak INTEGER DEFAULT 0, -- Days
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  
  -- Statistics
  total_challenges_completed INTEGER DEFAULT 0,
  total_achievements_unlocked INTEGER DEFAULT 0,
  
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Color Psychology Analysis table
CREATE TABLE IF NOT EXISTS color_psychology (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Color details
  color_code TEXT NOT NULL UNIQUE, -- Hex color code
  color_name TEXT NOT NULL,
  
  -- Psychology data (JSON)
  attributes TEXT NOT NULL, -- ["calm", "peaceful", "serene"]
  effects TEXT NOT NULL, -- Psychological effects
  cultural_notes TEXT, -- Cultural interpretations
  mood_associations TEXT NOT NULL, -- Associated emotions
  
  -- Usage recommendations
  recommended_for TEXT, -- When to use this color
  avoid_when TEXT, -- When not to use
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User Color Preferences table
CREATE TABLE IF NOT EXISTS user_color_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  color_code TEXT NOT NULL,
  
  -- Tracking
  use_count INTEGER DEFAULT 1,
  last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Context
  mood_when_selected TEXT, -- Emotion at time of selection
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, color_code)
);

-- Notification queue for challenges/achievements
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  -- Notification content
  notification_type TEXT NOT NULL CHECK(notification_type IN ('challenge', 'achievement', 'tip', 'reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related data
  related_id INTEGER, -- ID of challenge, achievement, etc.
  action_url TEXT, -- Where to navigate on click
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_wellness_tips_user_id ON ai_wellness_tips(user_id, generated_at);
CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(challenge_type, is_active);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_user ON user_challenge_progress(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id, unlocked_at);
CREATE INDEX IF NOT EXISTS idx_user_gamification_user ON user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_color_psychology_code ON color_psychology(color_code);
CREATE INDEX IF NOT EXISTS idx_user_color_preferences_user ON user_color_preferences(user_id, use_count);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at);
