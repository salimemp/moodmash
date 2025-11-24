-- Migration 0009: Health Dashboard, Privacy Center, and Support Resources
-- Version: 9.0.0
-- Date: 2025-01-24
-- Description: Adds tables for health metrics tracking, professional support, user consent management, data export logs, and support resources access tracking

-- ============================================================================
-- HEALTH METRICS TRACKING
-- ============================================================================

-- Health metrics calculated from mood data
CREATE TABLE IF NOT EXISTS health_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  -- Core health indicators (calculated daily/weekly)
  mental_health_score INTEGER CHECK(mental_health_score >= 0 AND mental_health_score <= 100), -- Overall mental health score (0-100)
  mood_stability_index REAL CHECK(mood_stability_index >= 0 AND mood_stability_index <= 1), -- How stable moods are (0=volatile, 1=stable)
  sleep_quality_score REAL CHECK(sleep_quality_score >= 0 AND sleep_quality_score <= 10), -- Sleep quality rating (0-10)
  activity_consistency REAL CHECK(activity_consistency >= 0 AND activity_consistency <= 1), -- How consistent activity patterns are
  stress_level INTEGER CHECK(stress_level >= 1 AND stress_level <= 5), -- Current stress level (1=low, 5=critical)
  
  -- Risk assessment
  crisis_risk_level TEXT CHECK(crisis_risk_level IN ('low', 'moderate', 'high', 'critical')), -- Current crisis risk level
  
  -- Trend indicators
  mood_trend TEXT CHECK(mood_trend IN ('improving', 'stable', 'declining', 'critical')), -- Overall mood trend
  positive_emotion_ratio REAL, -- Ratio of positive to total emotions
  negative_emotion_ratio REAL, -- Ratio of negative to total emotions
  
  -- Time-based metrics
  best_time_of_day TEXT, -- Best performing time (morning/afternoon/evening/night)
  worst_time_of_day TEXT, -- Worst performing time
  
  -- Calculation metadata
  data_points_used INTEGER, -- Number of mood entries used in calculation
  calculation_period_days INTEGER, -- Period analyzed (e.g., 7, 30, 90 days)
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_date ON health_metrics(user_id, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_metrics_risk ON health_metrics(crisis_risk_level, user_id);

-- ============================================================================
-- PROFESSIONAL SUPPORT CONNECTIONS
-- ============================================================================

-- Track connections with mental health professionals
CREATE TABLE IF NOT EXISTS professional_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  -- Professional details
  professional_name TEXT,
  professional_type TEXT CHECK(professional_type IN ('therapist', 'counselor', 'psychiatrist', 'psychologist', 'social_worker', 'coach')),
  specialty TEXT, -- e.g., "CBT", "trauma", "anxiety"
  contact_info TEXT, -- Phone/email (encrypted in production)
  practice_name TEXT,
  location TEXT,
  
  -- Session tracking
  session_frequency TEXT, -- "weekly", "biweekly", "monthly"
  last_session_date DATE,
  next_session_date DATE,
  total_sessions INTEGER DEFAULT 0,
  
  -- Connection status
  status TEXT CHECK(status IN ('active', 'inactive', 'ended')) DEFAULT 'active',
  started_date DATE,
  ended_date DATE,
  
  -- Notes and reports
  notes TEXT, -- Private notes about the connection
  share_reports BOOLEAN DEFAULT 0, -- Whether to share MoodMash reports with professional
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_professional_connections_user ON professional_connections(user_id, status);

-- ============================================================================
-- USER CONSENT MANAGEMENT (Privacy & GDPR Compliance)
-- ============================================================================

-- Track user consent for various data practices
CREATE TABLE IF NOT EXISTS user_consents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  -- Consent details
  consent_type TEXT NOT NULL CHECK(consent_type IN (
    'privacy_policy',
    'terms_of_service',
    'data_collection',
    'ai_analysis',
    'research_participation',
    'marketing_emails',
    'push_notifications',
    'data_sharing',
    'third_party_integrations',
    'professional_report_sharing'
  )),
  
  -- Consent status
  consent_given BOOLEAN DEFAULT 0,
  consent_date DATETIME,
  consent_version TEXT, -- Version of policy/terms accepted (e.g., "v2.0")
  
  -- Withdrawal tracking
  revoked_date DATETIME,
  revoked_reason TEXT,
  
  -- Metadata
  ip_address TEXT, -- For legal compliance
  user_agent TEXT, -- Browser/device used for consent
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, consent_type) -- One consent record per type per user
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_type ON user_consents(user_id, consent_type);

-- ============================================================================
-- DATA EXPORT LOGS (GDPR Article 20 - Right to Data Portability)
-- ============================================================================

-- Track data export requests for compliance and auditing
CREATE TABLE IF NOT EXISTS data_exports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  -- Export details
  export_type TEXT CHECK(export_type IN ('json', 'csv', 'pdf', 'full_archive')),
  export_scope TEXT CHECK(export_scope IN ('moods', 'activities', 'all_data', 'health_metrics', 'professional_connections')),
  
  -- Export metadata
  file_size_bytes INTEGER, -- Size of exported file
  records_count INTEGER, -- Number of records exported
  date_range_start DATE, -- Start date of data included
  date_range_end DATE, -- End date of data included
  
  -- Status tracking
  status TEXT CHECK(status IN ('requested', 'processing', 'completed', 'failed')) DEFAULT 'requested',
  download_url TEXT, -- URL to download file (temporary, expires after 24h)
  download_expires_at DATETIME,
  downloaded_at DATETIME,
  
  -- Compliance
  request_ip TEXT,
  export_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_data_exports_user ON data_exports(user_id, export_date DESC);

-- ============================================================================
-- SUPPORT RESOURCES ACCESS LOG
-- ============================================================================

-- Track when users access support resources (crisis hotlines, articles, etc.)
CREATE TABLE IF NOT EXISTS support_access_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER, -- Can be NULL for anonymous access
  
  -- Resource details
  resource_type TEXT CHECK(resource_type IN (
    'crisis_hotline',
    'therapy_finder',
    'self_help_guide',
    'article',
    'video',
    'breathing_exercise',
    'emergency_contact',
    'community_group'
  )),
  resource_id TEXT, -- Internal ID or external URL
  resource_title TEXT,
  
  -- Access context
  accessed_from TEXT, -- e.g., "crisis_alert", "support_page", "ai_recommendation"
  user_mood_state TEXT, -- Mood at time of access (if available)
  
  -- Privacy-conscious tracking (no PII)
  accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_access_user ON support_access_log(user_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_access_type ON support_access_log(resource_type, accessed_at DESC);

-- ============================================================================
-- SEED DATA: Default User Consents (for new users)
-- ============================================================================

-- Note: These will be added via application logic when user registers
-- Default consent statuses:
-- - privacy_policy: MUST be accepted (required for signup)
-- - terms_of_service: MUST be accepted (required for signup)
-- - data_collection: Default YES (can be revoked)
-- - ai_analysis: Default YES (can be revoked)
-- - research_participation: Default NO (opt-in)
-- - marketing_emails: Default NO (opt-in)

-- ============================================================================
-- DATA RETENTION POLICIES
-- ============================================================================

-- Add trigger to clean up old health metrics (keep last 365 days only)
-- This will be implemented in application logic, not SQL trigger
-- to maintain Cloudflare Workers compatibility

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Migration 0009 applied successfully
-- Tables created: health_metrics, professional_connections, user_consents, data_exports, support_access_log
