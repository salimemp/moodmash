-- MoodMash Database Schema
-- Version 1.0 - MVP with future expansion capabilities

-- Users table (for future authentication)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Mood entries table (core feature)
CREATE TABLE IF NOT EXISTS mood_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER DEFAULT 1, -- Temporary: single user for MVP
  
  -- Core mood data
  emotion TEXT NOT NULL, -- happy, sad, anxious, calm, energetic, tired, angry, peaceful
  intensity INTEGER NOT NULL CHECK(intensity >= 1 AND intensity <= 5), -- 1-5 scale
  notes TEXT,
  
  -- Context factors (for future pattern analysis)
  weather TEXT, -- sunny, cloudy, rainy, snowy
  sleep_hours REAL,
  activities TEXT, -- JSON array of activities
  social_interaction TEXT, -- alone, friends, family, colleagues
  
  -- Timestamps
  logged_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Mood patterns table (for AI/ML future integration)
CREATE TABLE IF NOT EXISTS mood_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  -- Pattern metadata
  pattern_type TEXT NOT NULL, -- daily, weekly, monthly, seasonal
  pattern_data TEXT NOT NULL, -- JSON data for pattern insights
  confidence_score REAL, -- 0-1 for ML confidence (future)
  
  -- Timestamps
  detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Wellness activities table (recommendations)
CREATE TABLE IF NOT EXISTS wellness_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Activity details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- meditation, exercise, journaling, social, creative
  duration_minutes INTEGER,
  difficulty TEXT, -- easy, medium, hard
  
  -- Mood matching (which moods this helps with)
  target_emotions TEXT NOT NULL, -- JSON array of emotions
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User activity log (tracking what users try)
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  activity_id INTEGER NOT NULL,
  mood_entry_id INTEGER, -- Optional: link to mood before/after
  
  -- Feedback
  completed BOOLEAN DEFAULT FALSE,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  feedback TEXT,
  
  logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (activity_id) REFERENCES wellness_activities(id) ON DELETE CASCADE,
  FOREIGN KEY (mood_entry_id) REFERENCES mood_entries(id) ON DELETE SET NULL
);

-- Genomics placeholder (for future expansion)
CREATE TABLE IF NOT EXISTS genomics_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  
  -- Genomics metadata (actual data stored securely elsewhere)
  data_provider TEXT, -- 23andme, ancestry, etc.
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  consent_given BOOLEAN DEFAULT FALSE,
  consent_date DATETIME,
  
  -- Processing status
  processing_status TEXT DEFAULT 'pending', -- pending, processing, completed, error
  last_processed DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- API integrations log (for future AI/ML service calls)
CREATE TABLE IF NOT EXISTS api_integration_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  
  -- API call details
  service_name TEXT NOT NULL, -- openai, custom_ml, genomics_api
  endpoint TEXT NOT NULL,
  request_type TEXT NOT NULL, -- mood_analysis, pattern_detection, recommendation
  
  -- Status
  status TEXT NOT NULL, -- success, error, pending
  response_summary TEXT, -- Brief summary of response
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_entries_logged_at ON mood_entries(logged_at);
CREATE INDEX IF NOT EXISTS idx_mood_entries_emotion ON mood_entries(emotion);
CREATE INDEX IF NOT EXISTS idx_mood_patterns_user_id ON mood_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
