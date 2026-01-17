-- Phase 2 Features Migration
-- Voice Journaling, OAuth, Email Verification

-- OAuth accounts table
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL, -- 'google', 'github'
  provider_account_id TEXT NOT NULL,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(provider, provider_account_id)
);

-- Voice journal entries table
CREATE TABLE IF NOT EXISTS voice_journals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  mood_entry_id INTEGER, -- optional link to mood
  title TEXT,
  transcript TEXT,
  audio_data TEXT, -- base64 encoded audio for small files
  audio_url TEXT, -- R2 URL for larger files
  duration_seconds INTEGER,
  emotion_detected TEXT, -- AI-detected emotion
  sentiment_score REAL, -- -1 to 1
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mood_entry_id) REFERENCES mood_entries(id) ON DELETE SET NULL
);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add email_verified column to users
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

-- Add avatar_url column to users  
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- Add oauth_provider column to users (for primary auth method)
ALTER TABLE users ADD COLUMN oauth_provider TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_oauth_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_provider ON oauth_accounts(provider, provider_account_id);
CREATE INDEX IF NOT EXISTS idx_voice_user_id ON voice_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_mood_id ON voice_journals(mood_entry_id);
CREATE INDEX IF NOT EXISTS idx_email_verif_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_resets(token);
