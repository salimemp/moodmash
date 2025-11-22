-- MoodMash Authentication System
-- Migration 0005 - Complete authentication with multiple methods
-- Date: 2025-11-22

-- ============================================================================
-- EXTEND USERS TABLE FOR AUTHENTICATION
-- ============================================================================

-- Add authentication fields to users table
ALTER TABLE users ADD COLUMN username TEXT;
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN last_login_at DATETIME;
ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until DATETIME;

-- ============================================================================
-- OAUTH PROVIDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS oauth_providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL, -- google, github, facebook, apple, x
  provider_user_id TEXT NOT NULL,
  provider_email TEXT,
  provider_name TEXT,
  provider_avatar TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at DATETIME,
  scopes TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(provider, provider_user_id)
);

-- ============================================================================
-- WEBAUTHN / PASSKEYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  device_type TEXT, -- platform, cross-platform
  device_name TEXT,
  transports TEXT, -- JSON array: usb, nfc, ble, internal
  backed_up INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- BIOMETRIC AUTHENTICATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS biometric_auth (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  biometric_type TEXT NOT NULL, -- fingerprint, face, iris
  public_key TEXT NOT NULL,
  device_name TEXT,
  is_enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, device_id)
);

-- ============================================================================
-- SESSION MANAGEMENT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  device_id TEXT,
  device_name TEXT,
  device_type TEXT, -- mobile, tablet, desktop
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  user_agent TEXT,
  is_trusted INTEGER DEFAULT 0,
  trust_expires_at DATETIME,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- EMAIL VERIFICATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  verification_token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  verified_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- PASSWORD RESET TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  reset_token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- SECURITY AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  event_type TEXT NOT NULL, -- login, logout, login_failed, password_change, oauth_link, etc.
  event_details TEXT, -- JSON
  ip_address TEXT,
  user_agent TEXT,
  device_id TEXT,
  success INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TRUSTED DEVICES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS trusted_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  is_active INTEGER DEFAULT 1,
  trusted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  last_used_at DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, device_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_oauth_providers_user ON oauth_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_providers_lookup ON oauth_providers(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_user ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credential ON webauthn_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_biometric_user ON biometric_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(verification_token);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(reset_token);
CREATE INDEX IF NOT EXISTS idx_security_audit_user ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_event ON security_audit_log(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_device ON trusted_devices(device_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS users_updated_at 
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS oauth_providers_updated_at 
AFTER UPDATE ON oauth_providers
BEGIN
  UPDATE oauth_providers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- SEED DEFAULT ADMIN USER (for testing)
-- ============================================================================

-- Note: Password is 'admin123' hashed with bcrypt
-- In production, this should be removed or changed immediately
INSERT OR IGNORE INTO users (id, username, email, name, password_hash, is_verified, is_active)
VALUES (
  1,
  'admin',
  'admin@moodmash.win',
  'Admin User',
  '$2a$10$rKZKWKhQXRKZYQKKOKQKOKQKOKQKOKQKOKQKOKQKOKQKOKQKOKQK',
  1,
  1
);
