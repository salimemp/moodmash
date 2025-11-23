-- MoodMash API Tokens System
-- Migration 0007 - Account and User API tokens for public API access
-- Date: 2025-11-22

-- ============================================================================
-- ACCOUNT API TOKENS (Admin/Service Level)
-- ============================================================================

-- Account-level tokens for administrative access and service integrations
CREATE TABLE IF NOT EXISTS account_api_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  token TEXT UNIQUE NOT NULL,
  token_hash TEXT NOT NULL, -- bcrypt hash for validation
  
  -- Permissions
  permissions TEXT NOT NULL, -- JSON array: ["read", "write", "delete", "admin"]
  scopes TEXT, -- JSON array: ["moods", "users", "analytics", "files"]
  
  -- Rate limiting
  rate_limit_per_hour INTEGER DEFAULT 1000,
  rate_limit_per_day INTEGER DEFAULT 10000,
  
  -- Status and metadata
  is_active INTEGER DEFAULT 1,
  last_used_at DATETIME,
  usage_count INTEGER DEFAULT 0,
  
  -- Security
  allowed_ips TEXT, -- JSON array of allowed IP addresses
  allowed_origins TEXT, -- JSON array of allowed domains
  
  -- Timestamps
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Created by
  created_by_user_id INTEGER,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- USER API TOKENS (Personal Access Tokens)
-- ============================================================================

-- User-level tokens for personal API access
CREATE TABLE IF NOT EXISTS user_api_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  token TEXT UNIQUE NOT NULL,
  token_hash TEXT NOT NULL,
  
  -- Permissions (limited to user's own data)
  permissions TEXT NOT NULL, -- JSON array: ["read", "write", "delete"]
  scopes TEXT, -- JSON array: ["moods", "activities", "profile"]
  
  -- Rate limiting
  rate_limit_per_hour INTEGER DEFAULT 100,
  rate_limit_per_day INTEGER DEFAULT 1000,
  
  -- Status and metadata
  is_active INTEGER DEFAULT 1,
  last_used_at DATETIME,
  usage_count INTEGER DEFAULT 0,
  
  -- Security
  allowed_ips TEXT, -- JSON array
  
  -- Timestamps
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- API TOKEN USAGE LOG
-- ============================================================================

-- Track API token usage for analytics and security
CREATE TABLE IF NOT EXISTS api_token_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_type TEXT NOT NULL, -- 'account' or 'user'
  token_id INTEGER NOT NULL,
  
  -- Request details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL, -- GET, POST, PUT, DELETE
  status_code INTEGER,
  response_time_ms INTEGER,
  
  -- Client info
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT,
  
  -- Usage tracking
  request_size INTEGER,
  response_size INTEGER,
  
  -- Error tracking
  error_message TEXT,
  
  -- Timestamp
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FILE UPLOADS TABLE (R2 Storage)
-- ============================================================================

-- Track uploaded files in R2 bucket
CREATE TABLE IF NOT EXISTS file_uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  
  -- File metadata
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_key TEXT UNIQUE NOT NULL, -- R2 object key
  file_size INTEGER NOT NULL, -- bytes
  mime_type TEXT NOT NULL,
  
  -- File type categorization
  file_type TEXT NOT NULL, -- 'avatar', 'mood_image', 'voice_note', 'document'
  
  -- Related entity
  related_type TEXT, -- 'mood_entry', 'user', 'activity'
  related_id INTEGER,
  
  -- Storage info
  bucket_name TEXT DEFAULT 'moodmash-storage',
  storage_class TEXT DEFAULT 'Standard',
  
  -- Access control
  is_public INTEGER DEFAULT 0,
  access_url TEXT,
  
  -- Timestamps
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME, -- For temporary files
  deleted_at DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Account API tokens
CREATE INDEX IF NOT EXISTS idx_account_tokens_token ON account_api_tokens(token);
CREATE INDEX IF NOT EXISTS idx_account_tokens_active ON account_api_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_account_tokens_expires ON account_api_tokens(expires_at);

-- User API tokens
CREATE INDEX IF NOT EXISTS idx_user_tokens_token ON user_api_tokens(token);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user ON user_api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_active ON user_api_tokens(is_active);

-- Token usage log
CREATE INDEX IF NOT EXISTS idx_token_usage_token ON api_token_usage(token_type, token_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_created ON api_token_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_token_usage_endpoint ON api_token_usage(endpoint);

-- File uploads
CREATE INDEX IF NOT EXISTS idx_file_uploads_user ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_key ON file_uploads(file_key);
CREATE INDEX IF NOT EXISTS idx_file_uploads_type ON file_uploads(file_type);
CREATE INDEX IF NOT EXISTS idx_file_uploads_related ON file_uploads(related_type, related_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS account_api_tokens_updated_at 
AFTER UPDATE ON account_api_tokens
BEGIN
  UPDATE account_api_tokens SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS user_api_tokens_updated_at 
AFTER UPDATE ON user_api_tokens
BEGIN
  UPDATE user_api_tokens SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- NOTES
-- ============================================================================

-- API Token Formats:
-- Account tokens: moodmash_acct_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
-- User tokens: moodmash_user_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

-- Token Usage:
-- Authorization: Bearer moodmash_acct_xxx
-- Authorization: Bearer moodmash_user_xxx

-- Rate Limiting:
-- Tracked per token
-- Returns 429 Too Many Requests when exceeded
-- Resets hourly/daily

-- File Upload Flow:
-- 1. Generate pre-signed upload URL
-- 2. Client uploads directly to R2
-- 3. Server validates and records in database
-- 4. Generate public access URL if needed
