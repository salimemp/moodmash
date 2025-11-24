-- Migration 0010: Phase 2 - Simplified version
-- Version: 9.5.0

-- HIPAA Audit Logs
CREATE TABLE IF NOT EXISTS hipaa_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  contains_phi BOOLEAN DEFAULT 0,
  phi_fields TEXT,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT 1,
  failure_reason TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_hipaa_audit_user ON hipaa_audit_logs(user_id, timestamp DESC);

-- HIPAA Policies
CREATE TABLE IF NOT EXISTS hipaa_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_type TEXT NOT NULL,
  title TEXT NOT NULL,
  version TEXT NOT NULL,
  content TEXT NOT NULL,
  effective_date DATE NOT NULL,
  policy_status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Security Incidents
CREATE TABLE IF NOT EXISTS security_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_users_count INTEGER DEFAULT 0,
  phi_involved BOOLEAN DEFAULT 0,
  detected_at DATETIME NOT NULL,
  incident_status TEXT DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Encryption Verification
CREATE TABLE IF NOT EXISTS encryption_verification (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  component TEXT NOT NULL,
  encryption_type TEXT NOT NULL,
  is_encrypted BOOLEAN NOT NULL,
  last_verified DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Security Events
CREATE TABLE IF NOT EXISTS security_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  user_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT DEFAULT 'info',
  details TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type, timestamp DESC);

-- Failed Logins
CREATE TABLE IF NOT EXISTS failed_logins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username_or_email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  failure_reason TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_failed_logins_ip ON failed_logins(ip_address, timestamp DESC);

-- Rate Limit Hits
CREATE TABLE IF NOT EXISTS rate_limit_hits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  hit_count INTEGER DEFAULT 1,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Security Alerts
CREATE TABLE IF NOT EXISTS security_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  alert_status TEXT DEFAULT 'new',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Research Consents
CREATE TABLE IF NOT EXISTS research_consents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  consent_given BOOLEAN NOT NULL,
  consent_date DATETIME,
  revoked BOOLEAN DEFAULT 0,
  data_sharing_level TEXT DEFAULT 'moderate',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Anonymized Research Data
CREATE TABLE IF NOT EXISTS anonymized_research_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  participant_code TEXT NOT NULL,
  age_range TEXT,
  emotion TEXT,
  intensity INTEGER,
  date_recorded DATE,
  time_of_day TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_research_data_participant ON anonymized_research_data(participant_code);

-- Research Exports
CREATE TABLE IF NOT EXISTS research_exports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  researcher_id TEXT,
  export_type TEXT,
  record_count INTEGER,
  exported_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Research Participants
CREATE TABLE IF NOT EXISTS research_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  participant_code TEXT UNIQUE NOT NULL,
  enrollment_date DATE,
  total_contributions INTEGER DEFAULT 0,
  participant_status TEXT DEFAULT 'active'
);

-- Privacy Education Progress
CREATE TABLE IF NOT EXISTS privacy_education_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content_type TEXT,
  content_id TEXT NOT NULL,
  viewed BOOLEAN DEFAULT 1,
  completed BOOLEAN DEFAULT 0,
  viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Compliance Checklist
CREATE TABLE IF NOT EXISTS compliance_checklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  compliance_type TEXT NOT NULL,
  requirement_id TEXT NOT NULL,
  requirement_title TEXT NOT NULL,
  compliance_status TEXT DEFAULT 'partial',
  last_reviewed DATE,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
