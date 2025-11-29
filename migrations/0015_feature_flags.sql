-- =============================================
-- MoodMash v15.0 - Feature Flags System
-- =============================================
-- Migration: 0015_feature_flags.sql
-- Date: 2025-01-29
-- Features: Feature Flags, A/B Testing, Rollout Control

-- =============================================
-- FEATURE FLAGS TABLE
-- =============================================

-- Feature Flags (for A/B testing and gradual rollouts)
CREATE TABLE IF NOT EXISTS feature_flags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flag_name TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Flag status
  enabled BOOLEAN DEFAULT 0,
  rollout_percentage INTEGER DEFAULT 0, -- 0-100 (0 = disabled, 100 = all users)
  
  -- Targeting
  target_user_ids TEXT, -- JSON array: [123, 456, 789]
  target_segments TEXT, -- JSON array: ["premium", "beta_testers", "early_adopters"]
  target_countries TEXT, -- JSON array: ["US", "UK", "CA"]
  
  -- Environment
  environment TEXT DEFAULT 'production', -- 'development', 'staging', 'production', 'all'
  
  -- Metadata
  category TEXT, -- 'ui', 'feature', 'experiment', 'killswitch'
  tags TEXT, -- JSON array for organization: ["premium", "mobile", "ai"]
  
  -- Audit trail
  created_by INTEGER,
  updated_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Scheduling
  start_date DATETIME, -- When to automatically enable
  end_date DATETIME, -- When to automatically disable
  
  -- Analytics
  impressions_count INTEGER DEFAULT 0, -- How many times flag was checked
  enabled_count INTEGER DEFAULT 0, -- How many times it was true
  
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Feature Flag Events (audit log)
CREATE TABLE IF NOT EXISTS feature_flag_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flag_id INTEGER NOT NULL,
  flag_name TEXT NOT NULL,
  
  -- Event details
  event_type TEXT NOT NULL, -- 'created', 'enabled', 'disabled', 'updated', 'evaluated'
  user_id INTEGER, -- User who triggered the event (for evaluation) or modified it (for changes)
  
  -- Evaluation result (for 'evaluated' events)
  flag_enabled BOOLEAN, -- Was the flag enabled for this user?
  
  -- Context
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  
  -- Changes (for update events)
  changes TEXT, -- JSON: {field: {old: value, new: value}}
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (flag_id) REFERENCES feature_flags(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Feature Flag Overrides (per-user overrides)
CREATE TABLE IF NOT EXISTS feature_flag_overrides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flag_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  
  -- Override
  enabled BOOLEAN NOT NULL,
  reason TEXT, -- Why was this override created?
  
  -- Audit
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME, -- Optional expiration
  
  UNIQUE(flag_id, user_id),
  FOREIGN KEY (flag_id) REFERENCES feature_flags(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(flag_name, environment);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled, environment);
CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON feature_flags(category);
CREATE INDEX IF NOT EXISTS idx_feature_flags_schedule ON feature_flags(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_flag_events_flag ON feature_flag_events(flag_id, created_at);
CREATE INDEX IF NOT EXISTS idx_flag_events_user ON feature_flag_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_flag_events_type ON feature_flag_events(event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_flag_overrides_flag ON feature_flag_overrides(flag_id);
CREATE INDEX IF NOT EXISTS idx_flag_overrides_user ON feature_flag_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_flag_overrides_expires ON feature_flag_overrides(expires_at);

-- =============================================
-- DEFAULT FEATURE FLAGS
-- =============================================

-- Example feature flags (insert default flags)
INSERT OR IGNORE INTO feature_flags (flag_name, description, enabled, rollout_percentage, category, environment) VALUES
  ('dark_mode_v2', 'New dark mode theme with better contrast', 0, 0, 'ui', 'production'),
  ('ai_mood_insights', 'AI-powered mood insights with Gemini', 1, 100, 'feature', 'production'),
  ('social_feed', 'Social feed for sharing moods with friends', 0, 50, 'feature', 'production'),
  ('premium_features', 'Premium subscription features', 1, 100, 'feature', 'production'),
  ('biometric_auth', 'Biometric authentication (Face ID, Touch ID)', 1, 100, 'feature', 'production'),
  ('magic_link_auth', 'Passwordless magic link authentication', 1, 100, 'feature', 'production'),
  ('session_recordings', 'Microsoft Clarity session recordings', 1, 100, 'experiment', 'production'),
  ('new_onboarding', 'New user onboarding flow v2', 0, 10, 'experiment', 'production'),
  ('advanced_analytics', 'Advanced analytics dashboard', 0, 0, 'feature', 'production'),
  ('export_data_v2', 'Enhanced data export with more formats', 0, 25, 'feature', 'production');

-- =============================================
-- TRIGGER FOR UPDATED_AT
-- =============================================

CREATE TRIGGER IF NOT EXISTS update_feature_flags_timestamp
AFTER UPDATE ON feature_flags
FOR EACH ROW
BEGIN
  UPDATE feature_flags SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
