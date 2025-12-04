-- Add OAuth columns to users table for simplified OAuth flow
-- Migration 0017
-- Date: 2025-12-04

-- Add oauth_provider and oauth_provider_id to users table
-- This allows us to track which OAuth provider the user signed up with
ALTER TABLE users ADD COLUMN oauth_provider TEXT;
ALTER TABLE users ADD COLUMN oauth_provider_id TEXT;

-- Create index for faster OAuth lookups
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_provider_id);
