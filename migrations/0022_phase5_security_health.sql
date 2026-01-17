-- =====================================================
-- Phase 5: Security & Health Features Migration
-- =====================================================

-- Two-Factor Authentication Settings
CREATE TABLE IF NOT EXISTS two_factor_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('totp', 'email', 'sms')),
    secret TEXT,
    enabled INTEGER DEFAULT 0,
    verified INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, type)
);

-- Backup Codes for 2FA Recovery
CREATE TABLE IF NOT EXISTS backup_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    code_hash TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    used_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Enhanced Session Tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    device_info TEXT,
    browser TEXT,
    os TEXT,
    ip_address TEXT,
    location TEXT,
    is_current INTEGER DEFAULT 0,
    last_activity TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Login History
CREATE TABLE IF NOT EXISTS login_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ip_address TEXT,
    device_info TEXT,
    browser TEXT,
    os TEXT,
    location TEXT,
    success INTEGER DEFAULT 1,
    failure_reason TEXT,
    two_factor_used TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Security Events Log
CREATE TABLE IF NOT EXISTS security_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    device_info TEXT,
    severity TEXT DEFAULT 'info' CHECK(severity IN ('info', 'warning', 'critical')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Email 2FA Codes
CREATE TABLE IF NOT EXISTS email_2fa_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Wearable Connections (Mock)
CREATE TABLE IF NOT EXISTS wearable_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    provider TEXT NOT NULL CHECK(provider IN ('fitbit', 'apple_watch', 'garmin', 'samsung', 'xiaomi')),
    connected INTEGER DEFAULT 1,
    last_sync TEXT,
    mock_data_seed INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, provider)
);

-- Sleep Data
CREATE TABLE IF NOT EXISTS sleep_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    duration_minutes INTEGER,
    quality_score INTEGER CHECK(quality_score BETWEEN 0 AND 100),
    deep_minutes INTEGER,
    light_minutes INTEGER,
    rem_minutes INTEGER,
    awake_minutes INTEGER,
    sleep_start TEXT,
    sleep_end TEXT,
    is_mock INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, date)
);

-- Health Metrics
CREATE TABLE IF NOT EXISTS health_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    steps INTEGER DEFAULT 0,
    heart_rate_avg INTEGER,
    heart_rate_min INTEGER,
    heart_rate_max INTEGER,
    calories_burned INTEGER DEFAULT 0,
    active_minutes INTEGER DEFAULT 0,
    distance_meters INTEGER DEFAULT 0,
    floors_climbed INTEGER DEFAULT 0,
    is_mock INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, date)
);

-- Wellness Scores
CREATE TABLE IF NOT EXISTS wellness_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    overall_score INTEGER CHECK(overall_score BETWEEN 0 AND 100),
    mood_score INTEGER CHECK(mood_score BETWEEN 0 AND 100),
    sleep_score INTEGER CHECK(sleep_score BETWEEN 0 AND 100),
    activity_score INTEGER CHECK(activity_score BETWEEN 0 AND 100),
    stress_score INTEGER CHECK(stress_score BETWEEN 0 AND 100),
    activity_mood_correlation REAL,
    sleep_mood_correlation REAL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, date)
);

-- Mood Visualizations Data (for complex visualizations)
CREATE TABLE IF NOT EXISTS mood_visualization_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    viz_type TEXT NOT NULL CHECK(viz_type IN ('heatmap', 'timeline', 'radar', 'journey')),
    data TEXT NOT NULL,
    period_start TEXT,
    period_end TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_two_factor_settings_user ON two_factor_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_codes_user ON backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created ON login_history(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_2fa_codes_user ON email_2fa_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_connections_user ON wearable_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_data_user_date ON sleep_data(user_id, date);
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_date ON health_metrics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_wellness_scores_user_date ON wellness_scores(user_id, date);
