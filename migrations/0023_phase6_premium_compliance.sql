-- Phase 6: Premium Features, AI Chatbot, Localization & Compliance
-- Created: 2026-01-17

-- =====================================================
-- SUBSCRIPTION TIERS
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_tiers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    features TEXT NOT NULL, -- JSON array of feature strings
    limits TEXT NOT NULL,   -- JSON object with limits
    price_monthly REAL DEFAULT 0,
    price_yearly REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Insert default tiers
INSERT OR IGNORE INTO subscription_tiers (id, name, description, features, limits) VALUES
('free', 'Free', 'Basic mood tracking for everyone', 
 '["Basic mood logging", "5 friends", "2 groups", "Basic insights", "Standard support"]',
 '{"moods_per_month": 30, "friends": 5, "groups": 2, "voice_journals": 0, "ai_messages": 0}'
),
('pro', 'Pro', 'Enhanced features for serious trackers',
 '["Unlimited mood logging", "50 friends", "10 groups", "Advanced insights", "Voice journals", "AI chatbot (50 msg/mo)", "Priority support"]',
 '{"moods_per_month": -1, "friends": 50, "groups": 10, "voice_journals": 20, "ai_messages": 50}'
),
('premium', 'Premium', 'Everything unlimited with premium features',
 '["Everything in Pro", "Unlimited friends", "Unlimited groups", "Unlimited voice journals", "Unlimited AI chatbot", "Custom exports", "API access", "Priority support"]',
 '{"moods_per_month": -1, "friends": -1, "groups": -1, "voice_journals": -1, "ai_messages": -1}'
);

-- =====================================================
-- USER SUBSCRIPTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier_id TEXT NOT NULL REFERENCES subscription_tiers(id) DEFAULT 'free',
    started_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON user_subscriptions(tier_id);

-- =====================================================
-- USAGE TRACKING
-- =====================================================
CREATE TABLE IF NOT EXISTS usage_tracking (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- Format: YYYY-MM
    moods_count INTEGER DEFAULT 0,
    friends_count INTEGER DEFAULT 0,
    groups_count INTEGER DEFAULT 0,
    voice_journals_count INTEGER DEFAULT 0,
    ai_messages_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_month ON usage_tracking(user_id, month);

-- =====================================================
-- CHATBOT CONVERSATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS chatbot_conversations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user ON chatbot_conversations(user_id);

-- =====================================================
-- CHATBOT MESSAGES
-- =====================================================
CREATE TABLE IF NOT EXISTS chatbot_messages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    conversation_id TEXT NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    is_voice INTEGER DEFAULT 0,
    language TEXT DEFAULT 'en',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation ON chatbot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_created ON chatbot_messages(created_at);

-- =====================================================
-- TRANSLATIONS (for dynamic content)
-- =====================================================
CREATE TABLE IF NOT EXISTS translations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    key TEXT NOT NULL,
    language TEXT NOT NULL,
    value TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(key, language)
);

CREATE INDEX IF NOT EXISTS idx_translations_language ON translations(language);
CREATE INDEX IF NOT EXISTS idx_translations_key ON translations(key);

-- =====================================================
-- LEGAL DOCUMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS legal_documents (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    type TEXT NOT NULL CHECK(type IN ('privacy', 'terms', 'cookies', 'dpa')),
    version TEXT NOT NULL,
    language TEXT DEFAULT 'en',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    effective_date TEXT NOT NULL,
    is_current INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(type, version, language)
);

CREATE INDEX IF NOT EXISTS idx_legal_documents_type ON legal_documents(type);
CREATE INDEX IF NOT EXISTS idx_legal_documents_current ON legal_documents(is_current);

-- =====================================================
-- COOKIE CONSENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS cookie_consents (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT,
    accepted INTEGER DEFAULT 0,
    analytics_accepted INTEGER DEFAULT 0,
    marketing_accepted INTEGER DEFAULT 0,
    functional_accepted INTEGER DEFAULT 1,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cookie_consents_user ON cookie_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_cookie_consents_session ON cookie_consents(session_id);

-- =====================================================
-- ANALYTICS EVENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_data TEXT, -- JSON
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address TEXT,
    session_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);

-- =====================================================
-- USER LANGUAGE PREFERENCES
-- =====================================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language TEXT DEFAULT 'en',
    theme TEXT DEFAULT 'system',
    timezone TEXT DEFAULT 'UTC',
    date_format TEXT DEFAULT 'YYYY-MM-DD',
    notifications_enabled INTEGER DEFAULT 1,
    email_notifications INTEGER DEFAULT 1,
    voice_enabled INTEGER DEFAULT 1,
    tts_rate REAL DEFAULT 1.0,
    accessibility_mode INTEGER DEFAULT 0,
    high_contrast INTEGER DEFAULT 0,
    reduce_motion INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_language ON user_preferences(language);

-- =====================================================
-- DAILY ANALYTICS AGGREGATES (for dashboard)
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_daily (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    date TEXT NOT NULL, -- YYYY-MM-DD
    total_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    moods_logged INTEGER DEFAULT 0,
    voice_journals_created INTEGER DEFAULT 0,
    chatbot_messages INTEGER DEFAULT 0,
    avg_session_duration REAL DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily(date);
