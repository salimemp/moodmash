-- Migration for Social Feed - Community Mood Sharing
-- Version 4.0 - November 2025

-- User profiles (extended user information for social features)
CREATE TABLE IF NOT EXISTS user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  
  -- Profile information
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  
  -- Privacy settings
  profile_visibility TEXT DEFAULT 'public' CHECK(profile_visibility IN ('public', 'friends', 'private')),
  allow_friend_requests BOOLEAN DEFAULT TRUE,
  show_mood_history BOOLEAN DEFAULT TRUE,
  
  -- Statistics
  total_posts INTEGER DEFAULT 0,
  total_followers INTEGER DEFAULT 0,
  total_following INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Social posts (shared mood updates)
CREATE TABLE IF NOT EXISTS social_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  mood_entry_id INTEGER, -- Optional link to mood entry
  
  -- Post content
  content TEXT NOT NULL,
  emotion TEXT, -- Primary emotion for the post
  emotion_intensity INTEGER CHECK(emotion_intensity >= 1 AND emotion_intensity <= 5),
  
  -- Media
  image_url TEXT,
  color_value TEXT, -- Color associated with mood
  
  -- Privacy
  visibility TEXT DEFAULT 'public' CHECK(visibility IN ('public', 'friends', 'private')),
  allow_comments BOOLEAN DEFAULT TRUE,
  
  -- Engagement metrics
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Flags
  is_pinned BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  is_reported BOOLEAN DEFAULT FALSE,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  edited_at DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mood_entry_id) REFERENCES mood_entries(id) ON DELETE SET NULL
);

-- Post likes
CREATE TABLE IF NOT EXISTS social_post_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(post_id, user_id)
);

-- Post comments
CREATE TABLE IF NOT EXISTS social_post_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  parent_comment_id INTEGER, -- For nested comments/replies
  
  -- Comment content
  content TEXT NOT NULL,
  
  -- Engagement
  like_count INTEGER DEFAULT 0,
  
  -- Flags
  is_edited BOOLEAN DEFAULT FALSE,
  is_reported BOOLEAN DEFAULT FALSE,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  edited_at DATETIME,
  
  FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES social_post_comments(id) ON DELETE CASCADE
);

-- Comment likes
CREATE TABLE IF NOT EXISTS social_comment_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (comment_id) REFERENCES social_post_comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(comment_id, user_id)
);

-- User follows/friendships
CREATE TABLE IF NOT EXISTS user_follows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  follower_id INTEGER NOT NULL, -- User who is following
  following_id INTEGER NOT NULL, -- User being followed
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'blocked')),
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  accepted_at DATETIME,
  
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(follower_id, following_id)
);

-- Post shares/reposts
CREATE TABLE IF NOT EXISTS social_post_shares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  
  -- Share content (optional comment on share)
  share_comment TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Feed preferences (customize what user sees in feed)
CREATE TABLE IF NOT EXISTS feed_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  
  -- Feed filters
  show_friends_only BOOLEAN DEFAULT FALSE,
  show_public_posts BOOLEAN DEFAULT TRUE,
  hide_emotions TEXT, -- JSON array of emotions to hide
  
  -- Notifications
  notify_on_like BOOLEAN DEFAULT TRUE,
  notify_on_comment BOOLEAN DEFAULT TRUE,
  notify_on_follow BOOLEAN DEFAULT TRUE,
  notify_on_mention BOOLEAN DEFAULT TRUE,
  
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Content reports (for moderation)
CREATE TABLE IF NOT EXISTS content_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL,
  
  -- Reported content
  content_type TEXT NOT NULL CHECK(content_type IN ('post', 'comment', 'profile')),
  content_id INTEGER NOT NULL,
  
  -- Report details
  reason TEXT NOT NULL CHECK(reason IN ('spam', 'harassment', 'inappropriate', 'false_info', 'other')),
  description TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by INTEGER,
  resolution_note TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Trending topics/hashtags (for discovery)
CREATE TABLE IF NOT EXISTS trending_topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Topic
  topic TEXT NOT NULL UNIQUE,
  category TEXT, -- emotion, activity, wellness
  
  -- Metrics
  post_count INTEGER DEFAULT 0,
  engagement_score REAL DEFAULT 0, -- Weighted score for trending
  
  -- Time window
  trending_date DATE NOT NULL,
  
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_visibility ON social_posts(visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_emotion ON social_posts(emotion, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON social_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON social_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON social_post_comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON social_post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON social_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id, status);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id, status);
CREATE INDEX IF NOT EXISTS idx_post_shares_post_id ON social_post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trending_topics_date ON trending_topics(trending_date, engagement_score DESC);
