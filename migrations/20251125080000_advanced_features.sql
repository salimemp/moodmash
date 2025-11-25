-- Migration: Advanced Features (Push Notifications, Geolocation, Search, Calendar, Export)
-- Version: 10.6
-- Date: 2025-11-25

-- =============================================================================
-- PUSH NOTIFICATIONS
-- =============================================================================

-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME,
  is_active BOOLEAN DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  daily_reminder BOOLEAN DEFAULT 1,
  reminder_time TIME DEFAULT '20:00',
  wellness_tips BOOLEAN DEFAULT 1,
  challenge_updates BOOLEAN DEFAULT 1,
  streak_milestones BOOLEAN DEFAULT 1,
  social_interactions BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_id ON notification_preferences(user_id);

-- Notification history/log
CREATE TABLE IF NOT EXISTS notification_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  delivered BOOLEAN DEFAULT 0,
  clicked BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notification_log_user_id ON notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_sent_at ON notification_log(sent_at);

-- =============================================================================
-- GEOLOCATION
-- =============================================================================

-- Location data for mood entries (privacy-preserving)
CREATE TABLE IF NOT EXISTS mood_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mood_entry_id INTEGER NOT NULL UNIQUE,
  latitude REAL,
  longitude REAL,
  accuracy REAL,
  city TEXT,
  country TEXT,
  timezone TEXT,
  logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mood_entry_id) REFERENCES mood_entries(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mood_locations_entry_id ON mood_locations(mood_entry_id);
CREATE INDEX IF NOT EXISTS idx_mood_locations_city ON mood_locations(city);

-- Location preferences (privacy settings)
CREATE TABLE IF NOT EXISTS location_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  location_tracking BOOLEAN DEFAULT 0,
  precision_level TEXT DEFAULT 'city', -- 'precise', 'city', 'country', 'none'
  share_with_insights BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_location_prefs_user_id ON location_preferences(user_id);

-- =============================================================================
-- FULL-TEXT SEARCH (FTS5)
-- =============================================================================

-- Full-text search virtual table for mood entries
CREATE VIRTUAL TABLE IF NOT EXISTS mood_entries_fts USING fts5(
  emotion,
  notes,
  tags,
  content=mood_entries,
  content_rowid=id
);

-- Triggers to keep FTS index in sync with mood_entries
CREATE TRIGGER IF NOT EXISTS mood_entries_fts_insert AFTER INSERT ON mood_entries BEGIN
  INSERT INTO mood_entries_fts(rowid, emotion, notes, tags)
  VALUES (new.id, new.emotion, new.notes, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS mood_entries_fts_delete AFTER DELETE ON mood_entries BEGIN
  DELETE FROM mood_entries_fts WHERE rowid = old.id;
END;

CREATE TRIGGER IF NOT EXISTS mood_entries_fts_update AFTER UPDATE ON mood_entries BEGIN
  DELETE FROM mood_entries_fts WHERE rowid = old.id;
  INSERT INTO mood_entries_fts(rowid, emotion, notes, tags)
  VALUES (new.id, new.emotion, new.notes, new.tags);
END;

-- Search history
CREATE TABLE IF NOT EXISTS search_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  searched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at);

-- =============================================================================
-- CALENDAR & SCHEDULING
-- =============================================================================

-- Calendar events (for scheduling mood check-ins, activities, etc.)
CREATE TABLE IF NOT EXISTS calendar_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'mood_checkin', -- 'mood_checkin', 'activity', 'reminder', 'appointment'
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  recurrence TEXT, -- 'daily', 'weekly', 'monthly', 'yearly', or cron expression
  color TEXT,
  reminder_minutes INTEGER DEFAULT 15,
  completed BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);

-- =============================================================================
-- DATA EXPORT
-- =============================================================================

-- Export history (track user data exports for compliance)
CREATE TABLE IF NOT EXISTS export_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  export_type TEXT NOT NULL, -- 'json', 'csv', 'pdf', 'ical'
  date_from TEXT,
  date_to TEXT,
  file_size INTEGER,
  record_count INTEGER,
  exported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_export_history_user_id ON export_history(user_id);
CREATE INDEX IF NOT EXISTS idx_export_history_exported_at ON export_history(exported_at);

-- Export preferences
CREATE TABLE IF NOT EXISTS export_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  default_format TEXT DEFAULT 'json',
  include_notes BOOLEAN DEFAULT 1,
  include_activities BOOLEAN DEFAULT 1,
  include_insights BOOLEAN DEFAULT 1,
  include_location BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_export_prefs_user_id ON export_preferences(user_id);

-- =============================================================================
-- USER PREFERENCES (Enhanced)
-- =============================================================================

-- Feature flags for advanced features
CREATE TABLE IF NOT EXISTS feature_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  push_notifications_enabled BOOLEAN DEFAULT 0,
  location_tracking_enabled BOOLEAN DEFAULT 0,
  calendar_integration_enabled BOOLEAN DEFAULT 1,
  search_history_enabled BOOLEAN DEFAULT 1,
  auto_backup_enabled BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_feature_prefs_user_id ON feature_preferences(user_id);
