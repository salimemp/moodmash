-- Migration: AR and Voice Journal Features
-- Created: 2025-12-27
-- Description: Add voice journal, AR mood cards, and 3D avatar support

-- =============================================================================
-- Voice Journal Entries Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS voice_journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  transcription TEXT NOT NULL,
  audio_url TEXT,
  duration_seconds INTEGER,
  emotion TEXT,
  mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_voice_journal_user_id ON voice_journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_journal_created_at ON voice_journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_journal_emotion ON voice_journal_entries(emotion);

-- =============================================================================
-- AR Mood Cards Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS ar_mood_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  emotion TEXT NOT NULL,
  mood_score INTEGER NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
  color TEXT DEFAULT '#4F46E5',
  message TEXT,
  marker_id TEXT,
  qr_code_url TEXT,
  print_count INTEGER DEFAULT 0,
  scan_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_scanned_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ar_cards_user_id ON ar_mood_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_ar_cards_emotion ON ar_mood_cards(emotion);
CREATE INDEX IF NOT EXISTS idx_ar_cards_marker_id ON ar_mood_cards(marker_id);
CREATE INDEX IF NOT EXISTS idx_ar_cards_created_at ON ar_mood_cards(created_at DESC);

-- =============================================================================
-- AR Experiences Table (for WebXR tracking)
-- =============================================================================

CREATE TABLE IF NOT EXISTS ar_experiences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  experience_type TEXT NOT NULL, -- 'emotion_visualization', 'mood_card_scan', 'avatar_view'
  duration_seconds INTEGER,
  interaction_count INTEGER DEFAULT 0,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  browser TEXT,
  ar_mode TEXT, -- 'webxr', 'arjs', 'model-viewer'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ar_experiences_user_id ON ar_experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_ar_experiences_type ON ar_experiences(experience_type);
CREATE INDEX IF NOT EXISTS idx_ar_experiences_created_at ON ar_experiences(created_at DESC);

-- =============================================================================
-- 3D Avatar States Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS avatar_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  emotion TEXT NOT NULL,
  mood_score REAL NOT NULL,
  model_url TEXT,
  color TEXT,
  animation TEXT,
  accessories TEXT, -- JSON array of unlocked accessories
  customization TEXT, -- JSON object with user customizations
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_avatar_states_user_id ON avatar_states(user_id);
CREATE INDEX IF NOT EXISTS idx_avatar_states_created_at ON avatar_states(created_at DESC);

-- =============================================================================
-- Voice Emotion Analysis Table (for future AI analysis)
-- =============================================================================

CREATE TABLE IF NOT EXISTS voice_emotion_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voice_journal_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  detected_emotion TEXT,
  confidence REAL, -- 0.0 to 1.0
  pitch_analysis TEXT, -- JSON object
  tone_analysis TEXT, -- JSON object
  keywords TEXT, -- JSON array
  sentiment_score REAL, -- -1.0 to 1.0
  ai_model TEXT, -- 'gemini', 'openai', etc.
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (voice_journal_id) REFERENCES voice_journal_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_voice_emotion_journal_id ON voice_emotion_analysis(voice_journal_id);
CREATE INDEX IF NOT EXISTS idx_voice_emotion_user_id ON voice_emotion_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_emotion_created_at ON voice_emotion_analysis(created_at DESC);

-- =============================================================================
-- AR Card Scans Table (track when users scan their AR cards)
-- =============================================================================

CREATE TABLE IF NOT EXISTS ar_card_scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  scan_location TEXT, -- JSON object with lat/lng if available
  device_type TEXT,
  browser TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES ar_mood_cards(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ar_card_scans_card_id ON ar_card_scans(card_id);
CREATE INDEX IF NOT EXISTS idx_ar_card_scans_user_id ON ar_card_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_ar_card_scans_created_at ON ar_card_scans(created_at DESC);
