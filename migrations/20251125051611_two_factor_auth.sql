-- Two-Factor Authentication Tables
-- TOTP (Time-based) and HOTP (Counter-based) support

-- Table: totp_secrets
-- Stores TOTP secrets for app-based authenticators (Google Authenticator, Authy, etc.)
CREATE TABLE IF NOT EXISTS totp_secrets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT 0,
  verified BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: backup_codes
-- Stores hashed backup codes for account recovery
CREATE TABLE IF NOT EXISTS backup_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  used BOOLEAN DEFAULT 0,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: hardware_tokens
-- Stores HOTP counters for hardware tokens (YubiKey, etc.)
CREATE TABLE IF NOT EXISTS hardware_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  token_name TEXT,
  secret TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_totp_secrets_user_id ON totp_secrets(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_codes_user_id ON backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_codes_used ON backup_codes(user_id, used);
CREATE INDEX IF NOT EXISTS idx_hardware_tokens_user_id ON hardware_tokens(user_id);
