-- Migration: Email Verification System
-- Version: 10.6.1
-- Date: 2025-11-25
-- Purpose: Require email verification before allowing password-based login

-- =============================================================================
-- EMAIL VERIFICATION TABLE
-- =============================================================================

-- Store email verification tokens
CREATE TABLE IF NOT EXISTS email_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  verification_token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  verified_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(verification_token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);

-- =============================================================================
-- NOTES
-- =============================================================================

-- This migration adds email verification requirement for password-based authentication
-- 
-- Behavior changes:
-- 1. New users register with is_verified = 0
-- 2. Verification email sent immediately upon registration
-- 3. Login blocked until email is verified (returns 403 with EMAIL_NOT_VERIFIED code)
-- 4. Users can request new verification emails (rate limited: 3 per hour)
-- 5. Verification tokens expire after 1 hour
-- 6. Magic link authentication bypasses email verification (auto-verifies on first use)
-- 
-- Email verification flow:
-- 1. User registers -> email sent with verification link
-- 2. User clicks link -> email verified -> welcome email sent
-- 3. User can now log in with password
-- 
-- Rate limiting:
-- - Max 3 verification emails per user per hour
-- - Prevents abuse and spam
