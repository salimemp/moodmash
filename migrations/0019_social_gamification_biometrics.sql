-- Migration: Social Support, Gamification, Biometrics, Voice Emotion Analysis
-- Created: 2025-12-27
-- Description: Comprehensive social features, gamification system, biometric integration, and AI voice analysis

-- =============================================================================
-- SOCIAL SUPPORT NETWORK
-- =============================================================================

-- User Connections (Friends/Support Network)
CREATE TABLE IF NOT EXISTS user_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  connected_user_id INTEGER NOT NULL,
  connection_type TEXT DEFAULT 'friend', -- 'friend', 'supporter', 'therapist', 'family'
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
  message TEXT, -- Optional connection request message
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  accepted_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (connected_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, connected_user_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_user_id ON user_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_connected_user ON user_connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON user_connections(status);

-- Direct Messages
CREATE TABLE IF NOT EXISTS direct_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  recipient_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT 0,
  is_deleted_by_sender BOOLEAN DEFAULT 0,
  is_deleted_by_recipient BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON direct_messages(created_at DESC);

-- Support Groups
CREATE TABLE IF NOT EXISTS support_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  creator_id INTEGER NOT NULL,
  is_private BOOLEAN DEFAULT 0,
  member_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_groups_creator ON support_groups(creator_id);

-- Group Memberships
CREATE TABLE IF NOT EXISTS group_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT DEFAULT 'member', -- 'admin', 'moderator', 'member'
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES support_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- Group Messages
CREATE TABLE IF NOT EXISTS group_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES support_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at DESC);

-- Shared Moods (opt-in sharing with connections)
CREATE TABLE IF NOT EXISTS shared_moods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mood_entry_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  visibility TEXT DEFAULT 'connections', -- 'connections', 'groups', 'public'
  group_id INTEGER, -- If sharing with specific group
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mood_entry_id) REFERENCES mood_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES support_groups(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shared_moods_user ON shared_moods(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_moods_group ON shared_moods(group_id);
CREATE INDEX IF NOT EXISTS idx_shared_moods_created_at ON shared_moods(created_at DESC);

-- =============================================================================
-- GAMIFICATION & STREAKS
-- =============================================================================

-- User Streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  streak_type TEXT NOT NULL, -- 'daily_log', 'activity', 'voice_journal', 'meditation'
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, streak_type)
);

CREATE INDEX IF NOT EXISTS idx_streaks_user ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_type ON user_streaks(streak_type);

-- Achievement Definitions (templates)
CREATE TABLE IF NOT EXISTS achievement_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  achievement_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'streak', 'social', 'wellness', 'ar', 'voice'
  icon TEXT,
  points INTEGER DEFAULT 0,
  requirement_type TEXT NOT NULL, -- 'streak', 'count', 'milestone'
  requirement_value INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_achievement_defs_category ON achievement_definitions(category);

-- User Unlocked Achievements (note: achievements table already exists from old migration)
CREATE TABLE IF NOT EXISTS user_unlocked_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  achievement_key TEXT NOT NULL,
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_unlocked_achievements_user ON user_unlocked_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_unlocked_achievements_date ON user_unlocked_achievements(unlocked_at DESC);

-- Points/XP System
CREATE TABLE IF NOT EXISTS user_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  points_type TEXT NOT NULL, -- 'xp', 'wellness_coins', 'social_karma'
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  points_to_next_level INTEGER DEFAULT 100,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, points_type)
);

CREATE INDEX IF NOT EXISTS idx_user_points_user ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_level ON user_points(level DESC);

-- Points History
CREATE TABLE IF NOT EXISTS points_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  points_type TEXT NOT NULL,
  points_earned INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'daily_log', 'achievement', 'social_support', etc.
  reference_id INTEGER, -- ID of related activity
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_points_history_user ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_created_at ON points_history(created_at DESC);

-- Rewards/Badges
CREATE TABLE IF NOT EXISTS rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reward_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_type TEXT NOT NULL, -- 'badge', 'avatar_item', 'theme', 'feature_unlock'
  icon TEXT,
  cost_points INTEGER DEFAULT 0,
  is_purchasable BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rewards_type ON rewards(reward_type);

-- User Rewards (earned/purchased)
CREATE TABLE IF NOT EXISTS user_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  reward_id INTEGER NOT NULL,
  acquired_method TEXT DEFAULT 'earned', -- 'earned', 'purchased', 'gifted'
  acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE,
  UNIQUE(user_id, reward_id)
);

CREATE INDEX IF NOT EXISTS idx_user_rewards_user ON user_rewards(user_id);

-- =============================================================================
-- BIOMETRIC INTEGRATION
-- =============================================================================

-- Biometric Sources
CREATE TABLE IF NOT EXISTS biometric_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  source_type TEXT NOT NULL, -- 'fitbit', 'apple_health', 'samsung_health', 'garmin', 'google_fit'
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at DATETIME,
  is_active BOOLEAN DEFAULT 1,
  last_sync_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_biometric_sources_user ON biometric_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_sources_type ON biometric_sources(source_type);

-- Biometric Data
CREATE TABLE IF NOT EXISTS biometric_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  source_id INTEGER,
  data_type TEXT NOT NULL, -- 'heart_rate', 'steps', 'sleep', 'activity', 'calories', 'hrv', 'spo2'
  value REAL NOT NULL,
  unit TEXT, -- 'bpm', 'steps', 'hours', 'minutes', 'kcal', 'ms', '%'
  recorded_at DATETIME NOT NULL,
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT, -- JSON for additional data
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES biometric_sources(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_biometric_data_user ON biometric_data(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_data_type ON biometric_data(data_type);
CREATE INDEX IF NOT EXISTS idx_biometric_data_recorded_at ON biometric_data(recorded_at DESC);

-- Sleep Data (detailed)
CREATE TABLE IF NOT EXISTS sleep_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  source_id INTEGER,
  sleep_date DATE NOT NULL,
  total_minutes INTEGER,
  deep_sleep_minutes INTEGER,
  light_sleep_minutes INTEGER,
  rem_sleep_minutes INTEGER,
  awake_minutes INTEGER,
  sleep_quality_score INTEGER, -- 0-100
  bedtime DATETIME,
  wake_time DATETIME,
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES biometric_sources(id) ON DELETE SET NULL,
  UNIQUE(user_id, sleep_date)
);

CREATE INDEX IF NOT EXISTS idx_sleep_data_user ON sleep_data(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_data_date ON sleep_data(sleep_date DESC);

-- Activity Data (workouts)
CREATE TABLE IF NOT EXISTS activity_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  source_id INTEGER,
  activity_type TEXT NOT NULL, -- 'running', 'cycling', 'walking', 'yoga', 'strength'
  duration_minutes INTEGER,
  calories_burned INTEGER,
  distance_km REAL,
  average_heart_rate INTEGER,
  max_heart_rate INTEGER,
  started_at DATETIME NOT NULL,
  ended_at DATETIME,
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES biometric_sources(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_data_user ON activity_data(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_data_started_at ON activity_data(started_at DESC);

-- Biometric-Mood Correlations (AI insights)
CREATE TABLE IF NOT EXISTS biometric_mood_correlations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  biometric_type TEXT NOT NULL,
  mood_pattern TEXT NOT NULL,
  correlation_score REAL, -- -1.0 to 1.0
  sample_size INTEGER,
  last_calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, biometric_type, mood_pattern)
);

CREATE INDEX IF NOT EXISTS idx_correlations_user ON biometric_mood_correlations(user_id);

-- =============================================================================
-- VOICE EMOTION ANALYSIS (Enhanced)
-- =============================================================================

-- Update voice_emotion_analysis table with more fields
-- Note: This table was created in migration 0018, we're adding more insights here

CREATE TABLE IF NOT EXISTS voice_analysis_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voice_journal_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  audio_duration_seconds INTEGER,
  analysis_model TEXT DEFAULT 'gemini', -- 'gemini', 'openai', 'azure'
  
  -- Emotional Analysis
  primary_emotion TEXT,
  emotion_confidence REAL, -- 0.0 to 1.0
  emotion_scores TEXT, -- JSON: {happy: 0.1, sad: 0.7, etc}
  
  -- Voice Characteristics
  average_pitch_hz REAL,
  pitch_variance REAL,
  speaking_rate_wpm INTEGER, -- words per minute
  pause_count INTEGER,
  average_pause_duration_ms INTEGER,
  
  -- Sentiment Analysis
  sentiment_score REAL, -- -1.0 (negative) to 1.0 (positive)
  sentiment_magnitude REAL, -- 0.0 to infinity (intensity)
  
  -- Content Analysis
  word_count INTEGER,
  sentence_count INTEGER,
  keywords TEXT, -- JSON array
  topics TEXT, -- JSON array
  
  -- Mental Health Indicators
  stress_level TEXT, -- 'low', 'medium', 'high'
  energy_level TEXT, -- 'low', 'medium', 'high'
  cognitive_clarity TEXT, -- 'low', 'medium', 'high'
  
  -- AI Recommendations
  recommendations TEXT, -- JSON array of suggestions
  
  analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (voice_journal_id) REFERENCES voice_journal_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_voice_analysis_user ON voice_analysis_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_analysis_journal ON voice_analysis_sessions(voice_journal_id);
CREATE INDEX IF NOT EXISTS idx_voice_analysis_emotion ON voice_analysis_sessions(primary_emotion);
CREATE INDEX IF NOT EXISTS idx_voice_analysis_date ON voice_analysis_sessions(analyzed_at DESC);

-- Voice Emotion Trends
CREATE TABLE IF NOT EXISTS voice_emotion_trends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  emotion TEXT NOT NULL,
  average_confidence REAL,
  occurrence_count INTEGER DEFAULT 0,
  trend_direction TEXT, -- 'increasing', 'decreasing', 'stable'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_voice_trends_user ON voice_emotion_trends(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_trends_period ON voice_emotion_trends(period_end DESC);
