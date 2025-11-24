-- ============================================================================
-- MoodMash Premium Subscriptions & Feature Gates
-- Version: 10.1 (Premium Features)
-- Created: 2025-11-24
-- ============================================================================

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly REAL NOT NULL,
  price_yearly REAL NOT NULL,
  features TEXT NOT NULL, -- JSON array of feature IDs
  max_moods_per_month INTEGER DEFAULT -1, -- -1 = unlimited
  max_groups INTEGER DEFAULT -1,
  max_friends INTEGER DEFAULT -1,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
  start_date TEXT NOT NULL,
  end_date TEXT,
  trial_end_date TEXT,
  auto_renew INTEGER DEFAULT 1,
  payment_method TEXT,
  last_payment_date TEXT,
  next_payment_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date ON user_subscriptions(end_date);

-- Payment History
CREATE TABLE IF NOT EXISTS payment_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  payment_provider TEXT, -- stripe, paypal, etc.
  transaction_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  receipt_url TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription ON payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);

-- Feature Usage Tracking
CREATE TABLE IF NOT EXISTS feature_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  feature_id TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  month TEXT NOT NULL, -- YYYY-MM format
  last_used_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, feature_id, month)
);

CREATE INDEX IF NOT EXISTS idx_feature_usage_user ON feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_month ON feature_usage(month);

-- Premium Feature Gates
CREATE TABLE IF NOT EXISTS premium_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  required_plan TEXT NOT NULL, -- free, basic, premium, enterprise
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);

-- Captcha Verifications
CREATE TABLE IF NOT EXISTS captcha_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  ip_address TEXT,
  action TEXT NOT NULL, -- login, signup, post_comment, etc.
  success INTEGER NOT NULL,
  challenge_ts TEXT,
  hostname TEXT,
  error_codes TEXT, -- JSON array
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_captcha_ip ON captcha_verifications(ip_address);
CREATE INDEX IF NOT EXISTS idx_captcha_action ON captcha_verifications(action);
CREATE INDEX IF NOT EXISTS idx_captcha_created ON captcha_verifications(created_at);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, features, max_moods_per_month, max_groups, max_friends, created_at) VALUES
  ('free', 'Free', 'Basic mood tracking and wellness features', 0, 0, '["mood_tracking", "basic_insights", "wellness_tips"]', 50, 3, 20, datetime('now')),
  ('basic', 'Basic', 'Enhanced features for serious mood tracking', 4.99, 49.99, '["mood_tracking", "basic_insights", "advanced_insights", "wellness_tips", "health_metrics", "data_export", "social_feed"]', 200, 10, 100, datetime('now')),
  ('premium', 'Premium', 'Full access to all features + AI insights', 9.99, 99.99, '["mood_tracking", "basic_insights", "advanced_insights", "ai_insights", "wellness_tips", "health_metrics", "data_export", "social_feed", "mood_groups", "research_data", "priority_support"]', -1, -1, -1, datetime('now')),
  ('enterprise', 'Enterprise', 'For organizations and teams', 29.99, 299.99, '["mood_tracking", "basic_insights", "advanced_insights", "ai_insights", "wellness_tips", "health_metrics", "data_export", "social_feed", "mood_groups", "research_data", "priority_support", "team_dashboard", "api_access", "white_label"]', -1, -1, -1, datetime('now'));

-- Insert premium feature definitions
INSERT INTO premium_features (feature_id, name, description, required_plan, created_at) VALUES
  ('mood_tracking', 'Mood Tracking', 'Track your daily moods', 'free', datetime('now')),
  ('basic_insights', 'Basic Insights', 'View mood trends and patterns', 'free', datetime('now')),
  ('wellness_tips', 'Wellness Tips', 'Get personalized wellness recommendations', 'free', datetime('now')),
  ('advanced_insights', 'Advanced Analytics', 'Detailed mood analytics and reports', 'basic', datetime('now')),
  ('health_metrics', 'Health Metrics', 'Track sleep, exercise, and vitals', 'basic', datetime('now')),
  ('data_export', 'Data Export', 'Export your data in multiple formats', 'basic', datetime('now')),
  ('social_feed', 'Social Feed', 'Connect and share with community', 'basic', datetime('now')),
  ('ai_insights', 'AI-Powered Insights', 'Get Gemini-powered mood analysis', 'premium', datetime('now')),
  ('mood_groups', 'Mood Groups', 'Join mood-synchronized group experiences', 'premium', datetime('now')),
  ('research_data', 'Research Participation', 'Contribute to mental health research', 'premium', datetime('now')),
  ('priority_support', 'Priority Support', '24/7 priority customer support', 'premium', datetime('now')),
  ('team_dashboard', 'Team Dashboard', 'Manage team mental wellness', 'enterprise', datetime('now')),
  ('api_access', 'API Access', 'Programmatic access to your data', 'enterprise', datetime('now')),
  ('white_label', 'White Label', 'Custom branding options', 'enterprise', datetime('now'));
