-- Biometric Authentication Tables
-- Stores WebAuthn credentials for biometric authentication

-- Table: biometric_credentials
-- Stores user's biometric credentials (public keys)
CREATE TABLE IF NOT EXISTS biometric_credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: biometric_challenges
-- Temporary storage for WebAuthn challenges (cleaned up after verification)
CREATE TABLE IF NOT EXISTS biometric_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  challenge TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_user_id ON biometric_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_credential_id ON biometric_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_biometric_challenges_user_id ON biometric_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_challenges_expires_at ON biometric_challenges(expires_at);

-- Cleanup job for expired challenges (run periodically)
-- DELETE FROM biometric_challenges WHERE expires_at < datetime('now');
