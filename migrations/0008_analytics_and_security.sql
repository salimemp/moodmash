-- =============================================
-- MoodMash v8.0 - Analytics, Security & Media
-- =============================================
-- Migration: 0008_analytics_and_security.sql
-- Date: 2025-11-23
-- Features: Analytics Engine, Security Monitoring, Media Processing

-- =============================================
-- ANALYTICS ENGINE
-- =============================================

-- Analytics Events Table (comprehensive event tracking)
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL, -- 'page_view', 'api_call', 'user_action', 'error', 'conversion'
  event_name TEXT NOT NULL, -- Specific event name
  user_id INTEGER,
  session_id TEXT,
  anonymous_id TEXT, -- For tracking before login
  
  -- Event metadata
  properties TEXT, -- JSON: additional event properties
  context TEXT, -- JSON: user agent, IP, location, device
  
  -- API-specific tracking
  api_endpoint TEXT,
  api_method TEXT, -- GET, POST, PUT, DELETE
  api_status_code INTEGER,
  api_response_time_ms INTEGER,
  
  -- Page-specific tracking
  page_url TEXT,
  page_title TEXT,
  referrer TEXT,
  
  -- Timestamp
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Page Views Analytics
CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  
  -- User context
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  browser TEXT,
  os TEXT,
  country TEXT,
  
  -- Engagement metrics
  time_on_page_seconds INTEGER DEFAULT 0,
  scroll_depth_percent INTEGER DEFAULT 0,
  interactions_count INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- API Metrics (detailed API performance tracking)
CREATE TABLE IF NOT EXISTS api_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  
  -- Request details
  user_id INTEGER,
  api_token_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  
  -- Request/Response size
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  
  -- Error tracking
  error_type TEXT,
  error_message TEXT,
  stack_trace TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User Analytics (aggregate user behavior)
CREATE TABLE IF NOT EXISTS user_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  
  -- Engagement metrics
  total_sessions INTEGER DEFAULT 0,
  total_page_views INTEGER DEFAULT 0,
  total_api_calls INTEGER DEFAULT 0,
  total_moods_logged INTEGER DEFAULT 0,
  total_activities_completed INTEGER DEFAULT 0,
  
  -- Time metrics
  total_time_spent_minutes INTEGER DEFAULT 0,
  average_session_duration_minutes INTEGER DEFAULT 0,
  last_active_at DATETIME,
  
  -- Feature usage
  features_used TEXT, -- JSON array of feature names
  favorite_features TEXT, -- JSON array of most used features
  
  -- Conversion metrics
  is_premium_user BOOLEAN DEFAULT 0,
  premium_conversion_date DATETIME,
  lifetime_value_usd DECIMAL(10,2) DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Error Logs (comprehensive error tracking)
CREATE TABLE IF NOT EXISTS error_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  error_type TEXT NOT NULL, -- 'application', 'database', 'api', 'authentication', 'validation'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  
  -- Error details
  error_code TEXT,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  
  -- Context
  user_id INTEGER,
  session_id TEXT,
  endpoint TEXT,
  method TEXT,
  request_body TEXT,
  
  -- Environment
  ip_address TEXT,
  user_agent TEXT,
  environment TEXT DEFAULT 'production', -- 'development', 'staging', 'production'
  
  -- Resolution
  resolved BOOLEAN DEFAULT 0,
  resolved_at DATETIME,
  resolved_by INTEGER,
  resolution_notes TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- Conversion Tracking (funnel analysis)
CREATE TABLE IF NOT EXISTS conversion_funnels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  funnel_name TEXT NOT NULL, -- 'signup', 'premium_upgrade', 'mood_logging'
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  
  user_id INTEGER,
  session_id TEXT NOT NULL,
  
  -- Completion status
  completed BOOLEAN DEFAULT 0,
  dropped_off BOOLEAN DEFAULT 0,
  
  -- Timing
  time_spent_seconds INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =============================================
-- APPLICATION SECURITY
-- =============================================

-- Rate Limiting (track API rate limits)
CREATE TABLE IF NOT EXISTS rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identifier TEXT NOT NULL, -- IP address, user_id, or api_token
  identifier_type TEXT NOT NULL, -- 'ip', 'user', 'token'
  endpoint TEXT NOT NULL,
  
  -- Rate limit tracking
  request_count INTEGER DEFAULT 1,
  window_start DATETIME NOT NULL,
  window_end DATETIME NOT NULL,
  
  -- Limit exceeded
  limit_exceeded BOOLEAN DEFAULT 0,
  limit_exceeded_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Security Incidents (threat detection)
CREATE TABLE IF NOT EXISTS security_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_type TEXT NOT NULL, -- 'brute_force', 'sql_injection', 'xss_attempt', 'csrf_attempt', 'suspicious_activity'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  
  -- Threat details
  description TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  user_id INTEGER,
  
  -- Request details
  endpoint TEXT,
  method TEXT,
  request_headers TEXT, -- JSON
  request_body TEXT,
  
  -- Response
  blocked BOOLEAN DEFAULT 0,
  action_taken TEXT, -- 'blocked', 'warned', 'logged', 'throttled'
  
  -- Resolution
  resolved BOOLEAN DEFAULT 0,
  resolved_at DATETIME,
  resolved_by INTEGER,
  resolution_notes TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- CSRF Tokens (Cross-Site Request Forgery protection)
CREATE TABLE IF NOT EXISTS csrf_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  
  -- Token lifecycle
  used BOOLEAN DEFAULT 0,
  used_at DATETIME,
  expires_at DATETIME NOT NULL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- IP Blacklist (block malicious IPs)
CREATE TABLE IF NOT EXISTS ip_blacklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_address TEXT UNIQUE NOT NULL,
  reason TEXT NOT NULL,
  
  -- Auto-ban or manual
  auto_banned BOOLEAN DEFAULT 0,
  banned_by INTEGER, -- Admin user who banned this IP
  
  -- Expiration (NULL = permanent)
  expires_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (banned_by) REFERENCES users(id)
);

-- Content Security Policy Violations
CREATE TABLE IF NOT EXISTS csp_violations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  violated_directive TEXT NOT NULL,
  blocked_uri TEXT,
  document_uri TEXT,
  source_file TEXT,
  line_number INTEGER,
  
  -- User context
  user_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =============================================
-- MEDIA PROCESSING
-- =============================================

-- Media Files (comprehensive media management)
CREATE TABLE IF NOT EXISTS media_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  -- File identification
  file_key TEXT UNIQUE NOT NULL, -- R2 object key
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image', 'video', 'audio', 'document'
  mime_type TEXT NOT NULL,
  
  -- File properties
  file_size_bytes INTEGER NOT NULL,
  duration_seconds INTEGER, -- For video/audio
  width INTEGER, -- For images/videos
  height INTEGER, -- For images/videos
  
  -- Processing status
  processing_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  processed_at DATETIME,
  processing_error TEXT,
  
  -- Variants (thumbnails, different sizes)
  variants TEXT, -- JSON: {thumbnail: 'key', medium: 'key', large: 'key'}
  
  -- CDN URLs
  original_url TEXT,
  thumbnail_url TEXT,
  preview_url TEXT,
  
  -- Metadata
  metadata TEXT, -- JSON: EXIF, location, etc.
  alt_text TEXT, -- For accessibility
  
  -- Access control
  visibility TEXT DEFAULT 'private', -- 'private', 'public', 'friends'
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Image Processing Queue
CREATE TABLE IF NOT EXISTS image_processing_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_file_id INTEGER NOT NULL,
  
  -- Processing tasks
  task_type TEXT NOT NULL, -- 'thumbnail', 'resize', 'compress', 'watermark', 'blur_faces'
  task_params TEXT, -- JSON: processing parameters
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  started_at DATETIME,
  completed_at DATETIME,
  error_message TEXT,
  
  -- Priority
  priority INTEGER DEFAULT 5, -- 1-10 (10 = highest)
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (media_file_id) REFERENCES media_files(id)
);

-- Video Processing Queue
CREATE TABLE IF NOT EXISTS video_processing_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_file_id INTEGER NOT NULL,
  
  -- Processing tasks
  task_type TEXT NOT NULL, -- 'transcode', 'thumbnail', 'compress', 'trim', 'add_captions'
  task_params TEXT, -- JSON: processing parameters
  output_format TEXT, -- 'mp4', 'webm', 'mov'
  
  -- Status
  status TEXT DEFAULT 'pending',
  progress_percent INTEGER DEFAULT 0,
  started_at DATETIME,
  completed_at DATETIME,
  error_message TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (media_file_id) REFERENCES media_files(id)
);

-- =============================================
-- SECRETS & CONFIGURATION
-- =============================================

-- Application Secrets (encrypted storage)
CREATE TABLE IF NOT EXISTS app_secrets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_name TEXT UNIQUE NOT NULL,
  encrypted_value TEXT NOT NULL, -- Encrypted secret value
  encryption_method TEXT DEFAULT 'AES-256', -- Encryption algorithm used
  
  -- Metadata
  description TEXT,
  category TEXT, -- 'api_key', 'database', 'oauth', 'encryption'
  
  -- Access control
  created_by INTEGER NOT NULL,
  last_accessed_at DATETIME,
  access_count INTEGER DEFAULT 0,
  
  -- Rotation
  rotation_required BOOLEAN DEFAULT 0,
  rotation_schedule_days INTEGER, -- Auto-rotate every N days
  last_rotated_at DATETIME,
  next_rotation_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Environment Variables (configuration management)
CREATE TABLE IF NOT EXISTS environment_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_name TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  environment TEXT NOT NULL, -- 'development', 'staging', 'production'
  
  -- Metadata
  description TEXT,
  is_sensitive BOOLEAN DEFAULT 0, -- Should be encrypted
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_api ON analytics_events(api_endpoint, api_method);

CREATE INDEX IF NOT EXISTS idx_page_views_user ON page_views(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_url ON page_views(page_url, created_at);

CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint ON api_metrics(endpoint, method, created_at);
CREATE INDEX IF NOT EXISTS idx_api_metrics_user ON api_metrics(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_api_metrics_status ON api_metrics(status_code, created_at);
CREATE INDEX IF NOT EXISTS idx_api_metrics_performance ON api_metrics(response_time_ms);

CREATE INDEX IF NOT EXISTS idx_user_analytics_user ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_active ON user_analytics(last_active_at);
CREATE INDEX IF NOT EXISTS idx_user_analytics_premium ON user_analytics(is_premium_user);

CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type, severity, created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);

-- Security indexes
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, identifier_type, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start, window_end);

CREATE INDEX IF NOT EXISTS idx_security_incidents_type ON security_incidents(incident_type, severity, created_at);
CREATE INDEX IF NOT EXISTS idx_security_incidents_ip ON security_incidents(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_security_incidents_resolved ON security_incidents(resolved);

CREATE INDEX IF NOT EXISTS idx_csrf_tokens_token ON csrf_tokens(token);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_user ON csrf_tokens(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_expiry ON csrf_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_ip_blacklist_ip ON ip_blacklist(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_blacklist_expiry ON ip_blacklist(expires_at);

-- Media indexes
CREATE INDEX IF NOT EXISTS idx_media_files_user ON media_files(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_media_files_type ON media_files(file_type, created_at);
CREATE INDEX IF NOT EXISTS idx_media_files_status ON media_files(processing_status);
CREATE INDEX IF NOT EXISTS idx_media_files_visibility ON media_files(visibility);

CREATE INDEX IF NOT EXISTS idx_image_queue_status ON image_processing_queue(status, priority);
CREATE INDEX IF NOT EXISTS idx_image_queue_media ON image_processing_queue(media_file_id);

CREATE INDEX IF NOT EXISTS idx_video_queue_status ON video_processing_queue(status, progress_percent);
CREATE INDEX IF NOT EXISTS idx_video_queue_media ON video_processing_queue(media_file_id);

-- Secrets indexes
CREATE INDEX IF NOT EXISTS idx_app_secrets_key ON app_secrets(key_name);
CREATE INDEX IF NOT EXISTS idx_app_secrets_category ON app_secrets(category);
CREATE INDEX IF NOT EXISTS idx_app_secrets_rotation ON app_secrets(rotation_required, next_rotation_at);

CREATE INDEX IF NOT EXISTS idx_env_config_key ON environment_config(key_name, environment);
