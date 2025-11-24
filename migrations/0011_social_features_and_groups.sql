-- ============================================================================
-- Migration 0011: Social Features & Mood-Synchronized Groups
-- Phase 3 (v10.0)
-- ============================================================================

-- User Profiles (extended user information)
CREATE TABLE IF NOT EXISTS user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  mood_sharing_default TEXT DEFAULT 'friends',
  notification_preferences TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Friendships (bidirectional friend connections)
CREATE TABLE IF NOT EXISTS friendships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  friend_id INTEGER NOT NULL,
  friendship_status TEXT DEFAULT 'pending',
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  accepted_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id, friendship_status);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id, friendship_status);

-- Mood Shares (shared mood entries with privacy controls)
CREATE TABLE IF NOT EXISTS mood_shares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mood_entry_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  share_type TEXT DEFAULT 'friends',
  caption TEXT,
  allow_comments BOOLEAN DEFAULT 1,
  shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mood_entry_id) REFERENCES mood_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mood_shares_user ON mood_shares(user_id, shared_at DESC);
CREATE INDEX IF NOT EXISTS idx_mood_shares_entry ON mood_shares(mood_entry_id);

-- Comments (on shared moods)
CREATE TABLE IF NOT EXISTS mood_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mood_share_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  comment_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mood_share_id) REFERENCES mood_shares(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mood_comments_share ON mood_comments(mood_share_id, created_at DESC);

-- Reactions (likes, supports, hugs on shared moods)
CREATE TABLE IF NOT EXISTS mood_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mood_share_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mood_share_id) REFERENCES mood_shares(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(mood_share_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_mood_reactions_share ON mood_reactions(mood_share_id);

-- Notifications (activity notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  related_id INTEGER,
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================================================
-- MOOD-SYNCHRONIZED GROUPS
-- ============================================================================

-- Mood Groups (public/private groups for mood sharing)
CREATE TABLE IF NOT EXISTS mood_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  group_type TEXT DEFAULT 'public',
  creator_id INTEGER NOT NULL,
  avatar_url TEXT,
  member_count INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mood_groups_type ON mood_groups(group_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mood_groups_creator ON mood_groups(creator_id);

-- Group Members (users in groups)
CREATE TABLE IF NOT EXISTS group_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  member_role TEXT DEFAULT 'member',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES mood_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id, joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- Group Moods (mood entries shared in groups)
CREATE TABLE IF NOT EXISTS group_moods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  mood_entry_id INTEGER NOT NULL,
  caption TEXT,
  is_synchronized BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES mood_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mood_entry_id) REFERENCES mood_entries(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_group_moods_group ON group_moods(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_moods_user ON group_moods(user_id);

-- Group Activities (synchronized activities)
CREATE TABLE IF NOT EXISTS group_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  activity_type TEXT NOT NULL,
  activity_name TEXT NOT NULL,
  description TEXT,
  scheduled_at DATETIME,
  duration_minutes INTEGER,
  participant_count INTEGER DEFAULT 0,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES mood_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_group_activities_group ON group_activities(group_id, scheduled_at DESC);

-- Group Challenges (shared challenges for groups)
CREATE TABLE IF NOT EXISTS group_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  challenge_name TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL,
  target_value INTEGER,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  participant_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES mood_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_group_challenges_group ON group_challenges(group_id, start_date DESC);

-- Group Challenge Participants
CREATE TABLE IF NOT EXISTS group_challenge_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  current_progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT 0,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (challenge_id) REFERENCES group_challenges(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON group_challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON group_challenge_participants(user_id);

-- ============================================================================
-- PRODUCTION OPTIMIZATIONS
-- ============================================================================

-- Performance Metrics (for monitoring)
CREATE TABLE IF NOT EXISTS performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  response_time_ms INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint ON performance_metrics(endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_time ON performance_metrics(created_at DESC);

-- API Rate Limits (enhanced rate limiting)
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, ip_address, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user ON api_rate_limits(user_id, window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON api_rate_limits(ip_address, window_start);
