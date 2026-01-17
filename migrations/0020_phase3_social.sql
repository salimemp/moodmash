-- Migration 0020: Phase 3 Social & Community Features
-- Consolidates and adds social features for MoodMash

-- ============================================================================
-- FRIENDSHIPS TABLE (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS friendships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  friend_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user_status ON friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_status ON friendships(friend_id, status);

-- ============================================================================
-- USER PROFILES TABLE (extended)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  profile_visibility TEXT DEFAULT 'public' CHECK(profile_visibility IN ('public', 'friends', 'private')),
  mood_visibility TEXT DEFAULT 'friends' CHECK(mood_visibility IN ('public', 'friends', 'private')),
  allow_friend_requests BOOLEAN DEFAULT TRUE,
  show_mood_history BOOLEAN DEFAULT TRUE,
  notification_preferences TEXT DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_visibility ON user_profiles(profile_visibility);

-- ============================================================================
-- GROUPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  privacy TEXT DEFAULT 'public' CHECK(privacy IN ('public', 'private')),
  avatar_url TEXT,
  created_by INTEGER NOT NULL,
  member_count INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_groups_privacy ON groups(privacy, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_groups_creator ON groups(created_by);

-- ============================================================================
-- GROUP MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS group_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'moderator', 'member')),
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- ============================================================================
-- GROUP POSTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS group_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  mood_entry_id INTEGER,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mood_entry_id) REFERENCES mood_entries(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_group_posts_group ON group_posts(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_posts_user ON group_posts(user_id);

-- ============================================================================
-- SHARED MOODS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS shared_moods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mood_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  shared_with TEXT DEFAULT 'friends' CHECK(shared_with IN ('public', 'friends', 'group')),
  group_id INTEGER,
  caption TEXT,
  privacy TEXT DEFAULT 'friends' CHECK(privacy IN ('public', 'friends', 'private')),
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mood_id) REFERENCES mood_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_shared_moods_user ON shared_moods(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_moods_privacy ON shared_moods(privacy, created_at DESC);

-- ============================================================================
-- ACTIVITIES TABLE (Activity Feed)
-- ============================================================================
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('mood_shared', 'friend_request', 'friend_accepted', 'group_joined', 'group_post', 'achievement', 'reaction', 'comment')),
  actor_id INTEGER,
  target_type TEXT,
  target_id INTEGER,
  data TEXT DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_unread ON activities(user_id, is_read);

-- ============================================================================
-- REACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_type TEXT NOT NULL CHECK(target_type IN ('shared_mood', 'group_post', 'comment')),
  target_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('like', 'love', 'support', 'hug', 'celebrate')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(target_type, target_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions(user_id);

-- ============================================================================
-- COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_type TEXT NOT NULL CHECK(target_type IN ('shared_mood', 'group_post')),
  target_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  parent_id INTEGER,
  like_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

-- ============================================================================
-- FRIEND SUGGESTIONS VIEW
-- ============================================================================
-- This view suggests friends based on mutual connections
CREATE VIEW IF NOT EXISTS friend_suggestions AS
SELECT DISTINCT 
  f1.user_id as user_id,
  f2.friend_id as suggested_friend_id,
  COUNT(*) as mutual_friends_count
FROM friendships f1
JOIN friendships f2 ON f1.friend_id = f2.user_id
WHERE f2.friend_id != f1.user_id
  AND f1.status = 'accepted'
  AND f2.status = 'accepted'
  AND NOT EXISTS (
    SELECT 1 FROM friendships f3 
    WHERE f3.user_id = f1.user_id 
    AND f3.friend_id = f2.friend_id
  )
GROUP BY f1.user_id, f2.friend_id
ORDER BY mutual_friends_count DESC;

-- ============================================================================
-- GROUP MOOD TRENDS VIEW
-- ============================================================================
CREATE VIEW IF NOT EXISTS group_mood_trends AS
SELECT 
  g.id as group_id,
  g.name as group_name,
  DATE(sm.created_at) as trend_date,
  me.emotion,
  COUNT(*) as mood_count,
  AVG(me.intensity) as avg_intensity
FROM groups g
JOIN shared_moods sm ON sm.group_id = g.id
JOIN mood_entries me ON sm.mood_id = me.id
GROUP BY g.id, DATE(sm.created_at), me.emotion
ORDER BY trend_date DESC;
