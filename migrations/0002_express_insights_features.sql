-- Migration for Express Your Mood and Insights features
-- Version 2.0 - November 2025

-- Add new columns to mood_entries for Express features
ALTER TABLE mood_entries ADD COLUMN privacy TEXT DEFAULT 'private' CHECK(privacy IN ('private', 'friends', 'public'));
ALTER TABLE mood_entries ADD COLUMN tags TEXT; -- JSON array of tags
ALTER TABLE mood_entries ADD COLUMN voice_note_url TEXT; -- URL to voice recording in R2
ALTER TABLE mood_entries ADD COLUMN color_value TEXT; -- Color code if selected via color mode
ALTER TABLE mood_entries ADD COLUMN text_entry TEXT; -- Full text entry from text mode
ALTER TABLE mood_entries ADD COLUMN entry_mode TEXT DEFAULT 'standard' CHECK(entry_mode IN ('standard', 'express', 'quick')); -- How mood was logged

-- Create mood insights cache table (for performance)
CREATE TABLE IF NOT EXISTS mood_insights_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  -- Cache period
  period_type TEXT NOT NULL CHECK(period_type IN ('daily', 'weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Cached insights (JSON)
  dominant_mood TEXT, -- Most frequent emotion
  mood_stability_score REAL, -- 0-1, higher is more stable
  average_intensity REAL,
  total_entries INTEGER,
  mood_distribution TEXT, -- JSON object with emotion counts
  
  -- Timeline data (JSON array)
  timeline_data TEXT, -- Pre-computed timeline for faster loading
  
  -- Calculated at
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, period_type, period_start)
);

-- Create quick select history table (for recently used emojis)
CREATE TABLE IF NOT EXISTS quick_select_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  emotion TEXT NOT NULL,
  last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  use_count INTEGER DEFAULT 1,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, emotion)
);

-- Create mood sharing table (for social features)
CREATE TABLE IF NOT EXISTS mood_shares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mood_entry_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  
  -- Sharing metadata
  share_type TEXT NOT NULL CHECK(share_type IN ('link', 'friends', 'public')),
  share_url TEXT UNIQUE, -- Generated share URL
  view_count INTEGER DEFAULT 0,
  
  -- Timestamps
  shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME, -- Optional expiration
  
  FOREIGN KEY (mood_entry_id) REFERENCES mood_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_mood_insights_cache_user_period ON mood_insights_cache(user_id, period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_quick_select_history_user ON quick_select_history(user_id, last_used_at);
CREATE INDEX IF NOT EXISTS idx_mood_shares_url ON mood_shares(share_url);
CREATE INDEX IF NOT EXISTS idx_mood_entries_privacy ON mood_entries(privacy);
CREATE INDEX IF NOT EXISTS idx_mood_entries_entry_mode ON mood_entries(entry_mode);
