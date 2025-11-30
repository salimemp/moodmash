-- CCPA (California Consumer Privacy Act) Compliance Tables
-- Migration: 0016_ccpa_compliance.sql
-- Description: Implements CCPA user rights and data privacy controls

-- CCPA User Preferences (Do Not Sell/Share)
CREATE TABLE IF NOT EXISTS ccpa_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    
    -- CCPA Rights Flags
    do_not_sell BOOLEAN DEFAULT 0,  -- Right to opt-out of data sale
    do_not_share BOOLEAN DEFAULT 0, -- Right to opt-out of data sharing
    limit_use BOOLEAN DEFAULT 0,    -- Right to limit use of sensitive data
    
    -- Preference metadata
    ip_address TEXT,
    user_agent TEXT,
    geolocation TEXT,  -- State/Country for CCPA applicability
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for quick user lookups
CREATE INDEX IF NOT EXISTS idx_ccpa_preferences_user_id ON ccpa_preferences(user_id);

-- CCPA Data Requests (Right to Know, Right to Delete, etc.)
CREATE TABLE IF NOT EXISTS ccpa_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    
    -- Request type
    request_type TEXT NOT NULL CHECK(request_type IN (
        'access',      -- Right to know what data is collected
        'delete',      -- Right to delete personal information
        'portability', -- Right to data portability
        'correction',  -- Right to correct inaccurate data
        'opt_out'      -- Right to opt-out
    )),
    
    -- Request details
    description TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN (
        'pending',
        'verified',
        'rejected',
        'completed',
        'cancelled'
    )),
    
    -- Processing
    status TEXT DEFAULT 'submitted' CHECK(status IN (
        'submitted',
        'in_progress',
        'completed',
        'denied',
        'expired'
    )),
    
    -- Response
    response_data TEXT,  -- JSON data for access requests
    response_file_url TEXT,  -- URL to downloadable data package
    completion_date DATETIME,
    
    -- Tracking
    ip_address TEXT,
    user_agent TEXT,
    verification_code TEXT,  -- For email verification
    verification_expires_at DATETIME,
    
    -- Timestamps (CCPA requires 45-day response time)
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME,  -- Auto-calculated: requested_at + 45 days
    processed_at DATETIME,
    
    -- Admin notes
    admin_notes TEXT,
    processed_by INTEGER,  -- Admin user ID who processed
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ccpa_requests_user_id ON ccpa_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ccpa_requests_status ON ccpa_requests(status);
CREATE INDEX IF NOT EXISTS idx_ccpa_requests_type ON ccpa_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_ccpa_requests_due_date ON ccpa_requests(due_date);

-- CCPA Consent Log (Audit trail)
CREATE TABLE IF NOT EXISTS ccpa_consent_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    
    -- Consent details
    consent_type TEXT NOT NULL CHECK(consent_type IN (
        'marketing',
        'analytics',
        'third_party_sharing',
        'targeted_advertising',
        'sensitive_data_processing',
        'cookie_consent'
    )),
    
    -- Consent status
    consent_given BOOLEAN NOT NULL,
    consent_version TEXT DEFAULT '1.0',
    
    -- Context
    ip_address TEXT,
    user_agent TEXT,
    page_url TEXT,
    
    -- Timestamp
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_ccpa_consent_log_user_id ON ccpa_consent_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ccpa_consent_log_timestamp ON ccpa_consent_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_ccpa_consent_log_type ON ccpa_consent_log(consent_type);

-- CCPA Data Inventory (What data we collect and why)
CREATE TABLE IF NOT EXISTS ccpa_data_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Category information
    category_name TEXT NOT NULL UNIQUE,  -- e.g., 'mood_data', 'health_data'
    category_label TEXT NOT NULL,        -- Human-readable name
    description TEXT NOT NULL,
    
    -- CCPA classification
    is_sensitive BOOLEAN DEFAULT 0,  -- CPRA sensitive personal information
    is_sold BOOLEAN DEFAULT 0,       -- Whether this data type is sold
    is_shared BOOLEAN DEFAULT 0,     -- Whether this data type is shared
    
    -- Purpose and retention
    collection_purpose TEXT NOT NULL,  -- Why we collect it
    retention_period TEXT,             -- How long we keep it
    
    -- Third parties
    third_parties TEXT,  -- JSON array of third parties who receive this data
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default CCPA data categories for MoodMash
INSERT OR IGNORE INTO ccpa_data_categories (category_name, category_label, description, is_sensitive, is_sold, is_shared, collection_purpose, retention_period, third_parties) VALUES
('identifiers', 'Identifiers', 'Name, email, username, IP address', 0, 0, 0, 'Account creation and authentication', '5 years after account deletion', '[]'),
('mood_data', 'Mood Data', 'Mood entries, emotions, intensity ratings, notes', 1, 0, 0, 'Mood tracking and analytics', 'Until account deletion or user request', '[]'),
('health_data', 'Health Information', 'Sleep hours, activities, social interactions', 1, 0, 0, 'Wellness insights and recommendations', 'Until account deletion or user request', '[]'),
('usage_data', 'Usage Information', 'Pages visited, features used, session duration', 0, 0, 1, 'Product improvement and analytics', '2 years', '["Microsoft Clarity"]'),
('device_info', 'Device Information', 'Browser type, OS, screen size, device type', 0, 0, 1, 'Technical support and optimization', '1 year', '["Microsoft Clarity"]'),
('geolocation', 'Geolocation', 'Country, state, city (IP-based)', 0, 0, 0, 'Service localization and compliance', '6 months', '[]'),
('communications', 'Communications', 'Support tickets, feedback, emails', 0, 0, 0, 'Customer support and service improvement', '3 years', '[]'),
('inferences', 'Inferences', 'AI-generated insights and patterns from mood data', 1, 0, 0, 'Personalized recommendations', 'Until account deletion', '["Google Gemini API"]');

-- CCPA Notice Log (When users were shown CCPA notices)
CREATE TABLE IF NOT EXISTS ccpa_notice_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    
    -- Notice details
    notice_type TEXT NOT NULL CHECK(notice_type IN (
        'collection',     -- Notice at collection
        'sale_opt_out',   -- Do Not Sell notice
        'share_opt_out',  -- Do Not Share notice
        'privacy_policy', -- Privacy policy update
        'rights_info'     -- Your Privacy Rights info
    )),
    
    -- Display context
    ip_address TEXT,
    user_agent TEXT,
    page_url TEXT,
    
    -- User action
    user_acknowledged BOOLEAN DEFAULT 0,
    acknowledged_at DATETIME,
    
    -- Timestamp
    displayed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for compliance queries
CREATE INDEX IF NOT EXISTS idx_ccpa_notice_log_user_id ON ccpa_notice_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ccpa_notice_log_type ON ccpa_notice_log(notice_type);

-- Add CCPA-related columns to users table (if not exists)
-- ALTER TABLE users ADD COLUMN ccpa_do_not_sell BOOLEAN DEFAULT 0;
-- ALTER TABLE users ADD COLUMN ccpa_verified_minor BOOLEAN DEFAULT 0;
-- ALTER TABLE users ADD COLUMN california_resident BOOLEAN DEFAULT 0;

-- Note: The above ALTER statements are commented out as they may fail if columns exist
-- They should be run manually or checked first in production

-- Trigger to update ccpa_preferences updated_at
CREATE TRIGGER IF NOT EXISTS update_ccpa_preferences_timestamp
AFTER UPDATE ON ccpa_preferences
FOR EACH ROW
BEGIN
    UPDATE ccpa_preferences SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to auto-calculate due_date for CCPA requests (45 days)
CREATE TRIGGER IF NOT EXISTS set_ccpa_request_due_date
AFTER INSERT ON ccpa_requests
FOR EACH ROW
WHEN NEW.due_date IS NULL
BEGIN
    UPDATE ccpa_requests 
    SET due_date = datetime(NEW.requested_at, '+45 days')
    WHERE id = NEW.id;
END;

-- Create a view for active CCPA opt-outs
CREATE VIEW IF NOT EXISTS active_ccpa_optouts AS
SELECT 
    u.id as user_id,
    u.email,
    u.username,
    cp.do_not_sell,
    cp.do_not_share,
    cp.limit_use,
    cp.updated_at as preference_updated_at
FROM users u
LEFT JOIN ccpa_preferences cp ON u.id = cp.user_id
WHERE cp.do_not_sell = 1 OR cp.do_not_share = 1 OR cp.limit_use = 1;

-- Create a view for pending CCPA requests
CREATE VIEW IF NOT EXISTS pending_ccpa_requests AS
SELECT 
    r.*,
    u.email,
    u.username,
    julianday(r.due_date) - julianday('now') as days_until_due
FROM ccpa_requests r
JOIN users u ON r.user_id = u.id
WHERE r.status IN ('submitted', 'in_progress')
AND r.due_date >= datetime('now')
ORDER BY r.due_date ASC;

-- CCPA Compliance Notes:
-- 1. All user data must be deletable within 45 days (ccpa_requests table handles this)
-- 2. Users can opt-out of data sale/sharing (ccpa_preferences table)
-- 3. Right to know: Users can request what data is collected (ccpa_data_categories)
-- 4. Right to portability: Data export functionality required (handled by API)
-- 5. Notice at collection: Must inform users at data collection point (ccpa_notice_log)
-- 6. Authorized agents: Users can designate agents to make requests on their behalf
-- 7. Non-discrimination: Cannot deny goods/services for exercising CCPA rights
