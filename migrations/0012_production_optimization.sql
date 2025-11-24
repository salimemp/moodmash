-- ============================================================================
-- MoodMash Production Optimization Migration
-- Version: 10.0 (Phase 3)
-- Created: 2025-11-24
-- ============================================================================

-- Performance Metrics Tracking
DROP TABLE IF EXISTS performance_metrics;
CREATE TABLE performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  response_time_ms INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  user_id INTEGER,
  error_message TEXT,
  cache_hit INTEGER DEFAULT 0,
  timestamp TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_performance_endpoint ON performance_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_performance_timestamp ON performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_status ON performance_metrics(status_code);

-- Performance Alerts
DROP TABLE IF EXISTS performance_alerts;
CREATE TABLE performance_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  endpoint TEXT,
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  acknowledged INTEGER DEFAULT 0,
  timestamp TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alerts_severity ON performance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON performance_alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON performance_alerts(acknowledged);

-- System Health Checks
DROP TABLE IF EXISTS system_health_checks;
CREATE TABLE system_health_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  response_time_ms INTEGER,
  details TEXT,
  timestamp TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_health_checks_name ON system_health_checks(check_name);
CREATE INDEX IF NOT EXISTS idx_health_checks_timestamp ON system_health_checks(timestamp);
