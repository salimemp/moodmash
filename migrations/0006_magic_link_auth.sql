-- MoodMash Magic Link Authentication
-- Migration 0006 - Passwordless authentication with magic links
-- Date: 2025-11-22

-- ============================================================================
-- MAGIC LINKS TABLE
-- ============================================================================

-- Store magic link tokens for passwordless authentication
CREATE TABLE IF NOT EXISTS magic_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);
CREATE INDEX IF NOT EXISTS idx_magic_links_expires ON magic_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_magic_links_user ON magic_links(user_id);

-- ============================================================================
-- TRIGGERS FOR CLEANUP
-- ============================================================================

-- Automatically clean up expired magic links (optional, can also be done via cron)
-- This is just the table structure; actual cleanup would be done by a scheduled job

-- ============================================================================
-- NOTES
-- ============================================================================

-- Magic Link Flow:
-- 1. User enters email address
-- 2. System generates unique token (UUID)
-- 3. Token stored in magic_links table with 15-minute expiration
-- 4. Email sent with link: https://moodmash.win/auth/magic?token=xxx
-- 5. User clicks link
-- 6. System verifies token and creates session
-- 7. Token marked as used (used_at timestamp)
-- 8. User logged in automatically

-- Security Features:
-- - Tokens expire after 15 minutes
-- - Single-use tokens (marked as used after verification)
-- - IP address and user agent logging
-- - Can be used for both login and registration
-- - Expired tokens automatically invalid
