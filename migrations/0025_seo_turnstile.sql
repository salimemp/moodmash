-- Migration: 0025_seo_turnstile.sql
-- Purpose: SEO metadata, Turnstile bot protection, and sitemap management
-- Date: 2026-01-17

-- ============================================================================
-- SEO METADATA TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_metadata (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    page_path TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    keywords TEXT,
    og_title TEXT,
    og_description TEXT,
    og_image TEXT,
    og_type TEXT DEFAULT 'website',
    twitter_card TEXT DEFAULT 'summary_large_image',
    twitter_title TEXT,
    twitter_description TEXT,
    twitter_image TEXT,
    schema_data TEXT, -- JSON-LD structured data
    canonical_url TEXT,
    robots TEXT DEFAULT 'index, follow',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_seo_metadata_page ON seo_metadata(page_path);

-- ============================================================================
-- TURNSTILE VERIFICATION LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS turnstile_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    ip_address TEXT NOT NULL,
    success INTEGER NOT NULL DEFAULT 0,
    challenge_ts TEXT,
    hostname TEXT,
    error_codes TEXT, -- JSON array of error codes
    action TEXT, -- login, register, contact, etc.
    user_agent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS idx_turnstile_logs_ip ON turnstile_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_turnstile_logs_success ON turnstile_logs(success);
CREATE INDEX IF NOT EXISTS idx_turnstile_logs_created ON turnstile_logs(created_at);

-- ============================================================================
-- BOT DETECTION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bot_detections (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    reason TEXT NOT NULL, -- turnstile_failed, rate_limit, suspicious_pattern
    blocked_until TEXT,
    attempt_count INTEGER DEFAULT 1,
    metadata TEXT, -- JSON with additional details
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bot_detections_ip ON bot_detections(ip_address);
CREATE INDEX IF NOT EXISTS idx_bot_detections_blocked ON bot_detections(blocked_until);

-- ============================================================================
-- SITEMAP URLS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sitemap_urls (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    url TEXT NOT NULL UNIQUE,
    priority REAL DEFAULT 0.5,
    changefreq TEXT DEFAULT 'weekly', -- always, hourly, daily, weekly, monthly, yearly, never
    lastmod TEXT DEFAULT CURRENT_TIMESTAMP,
    include_in_sitemap INTEGER DEFAULT 1,
    page_type TEXT DEFAULT 'page', -- page, blog, feature, legal
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_sitemap_urls_include ON sitemap_urls(include_in_sitemap);
CREATE INDEX IF NOT EXISTS idx_sitemap_urls_priority ON sitemap_urls(priority DESC);

-- ============================================================================
-- INSERT DEFAULT SEO DATA
-- ============================================================================
INSERT OR REPLACE INTO seo_metadata (page_path, title, description, keywords, og_title, og_description, og_type) VALUES
('/', 'MoodMash - AI-Powered Mood Tracking & Mental Wellness App', 'Track your mood, emotions, and mental health journey with MoodMash. Features AI coaching, voice journaling, social support, and gamification. HIPAA compliant.', 'mood tracker, mood tracking app, mental health app, mood journal, emotional wellness, mood diary, anxiety tracker, depression tracker', 'MoodMash - Your AI-Powered Mental Wellness Companion', 'Track moods, get AI insights, connect with friends, and achieve your emotional wellness goals.', 'website'),
('/login', 'Login - MoodMash Mood Tracker', 'Sign in to your MoodMash account to continue tracking your mood and emotional wellness journey.', 'mood tracker login, mental health app login', 'Login to MoodMash', 'Access your personalized mood tracking dashboard and wellness insights.', 'website'),
('/register', 'Create Account - MoodMash Mood Tracker', 'Join MoodMash for free and start your journey to better emotional health with AI-powered mood tracking.', 'create mood tracker account, sign up mental health app', 'Join MoodMash Today', 'Start tracking your mood with AI insights, social support, and gamification.', 'website'),
('/dashboard', 'Dashboard - MoodMash', 'View your mood tracking dashboard with insights, statistics, and personalized recommendations.', 'mood dashboard, mood statistics, emotional analytics', 'Your Mood Dashboard', 'Track your emotional journey with detailed analytics and insights.', 'website'),
('/features', 'Features - MoodMash Mood Tracking App', 'Discover MoodMash features: AI chatbot, voice journaling, social groups, gamification, multi-language support, and HIPAA compliance.', 'mood tracker features, mental health app features, AI mood coach', 'MoodMash Features', 'AI chatbot, voice journals, social features, 8 languages, HIPAA compliant.', 'website'),
('/pricing', 'Pricing - MoodMash Plans', 'Choose the perfect MoodMash plan for your mental wellness journey. Free tier available with premium upgrades.', 'mood tracker pricing, mental health app cost, premium mood tracker', 'MoodMash Pricing', 'Free and premium plans for every wellness journey.', 'website'),
('/about', 'About MoodMash - Our Mission', 'Learn about MoodMash''s mission to make mental health tracking accessible, engaging, and effective for everyone.', 'about mood tracker, mental health mission', 'About MoodMash', 'Our mission is to empower emotional wellness through technology.', 'website'),
('/faq', 'FAQ - MoodMash Support', 'Find answers to frequently asked questions about MoodMash mood tracking, features, privacy, and account management.', 'mood tracker FAQ, mental health app questions', 'MoodMash FAQ', 'Get answers to common questions about mood tracking and mental wellness.', 'website'),
('/contact', 'Contact Us - MoodMash Support', 'Get in touch with the MoodMash team for support, feedback, or partnership inquiries.', 'contact mood tracker support, mental health app help', 'Contact MoodMash', 'We''re here to help with your mental wellness journey.', 'website'),
('/privacy', 'Privacy Policy - MoodMash', 'Read MoodMash''s privacy policy. We are committed to protecting your personal health data with HIPAA and CCPA compliance.', 'mood tracker privacy, HIPAA compliant app, data protection', 'MoodMash Privacy Policy', 'Your data privacy is our top priority. HIPAA & CCPA compliant.', 'website'),
('/terms', 'Terms of Service - MoodMash', 'Review MoodMash''s terms of service for using our mood tracking and mental wellness platform.', 'mood tracker terms, mental health app terms of service', 'MoodMash Terms of Service', 'Terms and conditions for using MoodMash.', 'website');

-- ============================================================================
-- INSERT DEFAULT SITEMAP URLS
-- ============================================================================
INSERT OR REPLACE INTO sitemap_urls (url, priority, changefreq, page_type) VALUES
('/', 1.0, 'daily', 'page'),
('/login', 0.8, 'monthly', 'page'),
('/register', 0.8, 'monthly', 'page'),
('/features', 0.9, 'weekly', 'feature'),
('/pricing', 0.9, 'weekly', 'page'),
('/about', 0.7, 'monthly', 'page'),
('/faq', 0.7, 'weekly', 'page'),
('/contact', 0.6, 'monthly', 'page'),
('/privacy', 0.5, 'yearly', 'legal'),
('/terms', 0.5, 'yearly', 'legal'),
('/dashboard', 0.6, 'daily', 'page'),
('/achievements', 0.7, 'weekly', 'feature'),
('/challenges', 0.7, 'weekly', 'feature'),
('/leaderboard', 0.7, 'daily', 'feature'),
('/friends', 0.6, 'daily', 'page'),
('/groups', 0.6, 'daily', 'page'),
('/insights', 0.8, 'daily', 'feature'),
('/voice-journal', 0.8, 'weekly', 'feature');
