-- Phase 6 Enhancements: Compliance, CJK Localization, Currency & Taxation
-- Created: 2026-01-17

-- =====================================================
-- AUDIT LOGS (HIPAA, SOC 2 Compliance)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'export', 'login', 'logout'
    resource TEXT NOT NULL, -- 'user', 'mood', 'health_data', 'voice_journal', etc.
    resource_id TEXT,
    details TEXT, -- JSON with additional context
    ip_address TEXT,
    user_agent TEXT,
    session_id TEXT,
    severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);

-- =====================================================
-- DATA ACCESS LOGS (CCPA Compliance)
-- =====================================================
CREATE TABLE IF NOT EXISTS data_access_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_type TEXT NOT NULL, -- 'personal_info', 'health_data', 'mood_data', 'biometric'
    purpose TEXT NOT NULL, -- 'service_provision', 'analytics', 'marketing', 'third_party'
    accessor_type TEXT DEFAULT 'internal', -- 'internal', 'third_party', 'user'
    accessor_name TEXT,
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_data_access_logs_user ON data_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_type ON data_access_logs(data_type);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_created ON data_access_logs(created_at);

-- =====================================================
-- COMPLIANCE CONSENTS (CCPA, HIPAA)
-- =====================================================
CREATE TABLE IF NOT EXISTS compliance_consents (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL, -- 'data_collection', 'data_sharing', 'marketing', 'phi_disclosure', 'data_sale'
    version TEXT NOT NULL, -- Policy version consented to
    consented INTEGER DEFAULT 0,
    ip_address TEXT,
    user_agent TEXT,
    accepted_at TEXT,
    withdrawn_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, consent_type, version)
);

CREATE INDEX IF NOT EXISTS idx_compliance_consents_user ON compliance_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_consents_type ON compliance_consents(consent_type);

-- =====================================================
-- DATA RETENTION POLICIES
-- =====================================================
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    data_type TEXT NOT NULL UNIQUE, -- 'moods', 'voice_journals', 'health_data', 'audit_logs', 'sessions'
    retention_days INTEGER NOT NULL, -- -1 for indefinite
    policy_description TEXT,
    legal_basis TEXT, -- 'consent', 'contract', 'legal_obligation', 'legitimate_interest'
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Insert default retention policies
INSERT OR IGNORE INTO data_retention_policies (id, data_type, retention_days, policy_description, legal_basis) VALUES
('ret_moods', 'moods', -1, 'User mood entries are retained indefinitely until user requests deletion', 'consent'),
('ret_voice', 'voice_journals', 365, 'Voice recordings are retained for 1 year', 'consent'),
('ret_health', 'health_data', 2555, 'Health data retained for 7 years per HIPAA requirements', 'legal_obligation'),
('ret_audit', 'audit_logs', 2555, 'Audit logs retained for 7 years for compliance', 'legal_obligation'),
('ret_sessions', 'sessions', 30, 'Session data retained for 30 days', 'contract'),
('ret_analytics', 'analytics_events', 365, 'Analytics data retained for 1 year', 'legitimate_interest');

-- =====================================================
-- CCPA DATA REQUESTS
-- =====================================================
CREATE TABLE IF NOT EXISTS ccpa_data_requests (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK(request_type IN ('access', 'deletion', 'portability', 'opt_out', 'correction')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'rejected')),
    request_details TEXT, -- JSON
    verification_method TEXT, -- 'email', 'phone', 'identity_document'
    verified_at TEXT,
    completed_at TEXT,
    rejection_reason TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ccpa_requests_user ON ccpa_data_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ccpa_requests_status ON ccpa_data_requests(status);
CREATE INDEX IF NOT EXISTS idx_ccpa_requests_type ON ccpa_data_requests(request_type);

-- =====================================================
-- DO NOT SELL MY DATA (CCPA)
-- =====================================================
CREATE TABLE IF NOT EXISTS do_not_sell_preferences (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    email TEXT,
    opted_out INTEGER DEFAULT 1,
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_do_not_sell_user ON do_not_sell_preferences(user_id);

-- =====================================================
-- SECURITY INCIDENTS (SOC 2, HIPAA)
-- =====================================================
CREATE TABLE IF NOT EXISTS security_incidents (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    incident_type TEXT NOT NULL, -- 'breach', 'unauthorized_access', 'data_loss', 'system_failure', 'suspicious_activity'
    severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    affected_users INTEGER DEFAULT 0,
    affected_data_types TEXT, -- JSON array
    detection_method TEXT,
    detected_by TEXT,
    status TEXT DEFAULT 'detected' CHECK(status IN ('detected', 'investigating', 'contained', 'resolved', 'closed')),
    containment_actions TEXT, -- JSON
    remediation_actions TEXT, -- JSON
    notification_sent INTEGER DEFAULT 0,
    notification_date TEXT,
    resolved_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_security_incidents_type ON security_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);

-- =====================================================
-- VENDOR MANAGEMENT (SOC 2)
-- =====================================================
CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'cloud_provider', 'analytics', 'payment', 'communication', 'ai_ml'
    services_provided TEXT, -- JSON array
    data_access_level TEXT CHECK(data_access_level IN ('none', 'limited', 'full')),
    soc2_certified INTEGER DEFAULT 0,
    hipaa_compliant INTEGER DEFAULT 0,
    gdpr_compliant INTEGER DEFAULT 0,
    contract_start_date TEXT,
    contract_end_date TEXT,
    last_audit_date TEXT,
    risk_level TEXT DEFAULT 'medium' CHECK(risk_level IN ('low', 'medium', 'high')),
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Insert default vendors
INSERT OR IGNORE INTO vendors (id, name, category, services_provided, data_access_level, soc2_certified, hipaa_compliant) VALUES
('v_cloudflare', 'Cloudflare', 'cloud_provider', '["hosting", "cdn", "ddos_protection"]', 'limited', 1, 1),
('v_google', 'Google Cloud', 'ai_ml', '["gemini_api", "vertex_ai"]', 'limited', 1, 1),
('v_resend', 'Resend', 'communication', '["email_delivery"]', 'limited', 1, 0);

-- =====================================================
-- CURRENCIES
-- =====================================================
CREATE TABLE IF NOT EXISTS currencies (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    decimal_places INTEGER DEFAULT 2,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Insert currencies
INSERT OR IGNORE INTO currencies (code, name, symbol, decimal_places) VALUES
('USD', 'US Dollar', '$', 2),
('EUR', 'Euro', '€', 2),
('GBP', 'British Pound', '£', 2),
('JPY', 'Japanese Yen', '¥', 0),
('CNY', 'Chinese Yuan', '¥', 2),
('KRW', 'Korean Won', '₩', 0),
('AED', 'UAE Dirham', 'د.إ', 2),
('SAR', 'Saudi Riyal', 'ر.س', 2),
('CAD', 'Canadian Dollar', 'C$', 2),
('AUD', 'Australian Dollar', 'A$', 2),
('INR', 'Indian Rupee', '₹', 2),
('BRL', 'Brazilian Real', 'R$', 2),
('MXN', 'Mexican Peso', 'MX$', 2),
('CHF', 'Swiss Franc', 'CHF', 2),
('SGD', 'Singapore Dollar', 'S$', 2);

-- =====================================================
-- EXCHANGE RATES
-- =====================================================
CREATE TABLE IF NOT EXISTS exchange_rates (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    from_currency TEXT NOT NULL REFERENCES currencies(code),
    to_currency TEXT NOT NULL REFERENCES currencies(code),
    rate REAL NOT NULL,
    source TEXT DEFAULT 'manual',
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(from_currency, to_currency)
);

-- Insert default exchange rates (from USD)
INSERT OR IGNORE INTO exchange_rates (id, from_currency, to_currency, rate) VALUES
('er_usd_eur', 'USD', 'EUR', 0.92),
('er_usd_gbp', 'USD', 'GBP', 0.79),
('er_usd_jpy', 'USD', 'JPY', 149.50),
('er_usd_cny', 'USD', 'CNY', 7.24),
('er_usd_krw', 'USD', 'KRW', 1320.00),
('er_usd_aed', 'USD', 'AED', 3.67),
('er_usd_sar', 'USD', 'SAR', 3.75),
('er_usd_cad', 'USD', 'CAD', 1.36),
('er_usd_aud', 'USD', 'AUD', 1.53),
('er_usd_inr', 'USD', 'INR', 83.25),
('er_usd_brl', 'USD', 'BRL', 4.97),
('er_usd_mxn', 'USD', 'MXN', 17.15),
('er_usd_chf', 'USD', 'CHF', 0.88),
('er_usd_sgd', 'USD', 'SGD', 1.34);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_from ON exchange_rates(from_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_to ON exchange_rates(to_currency);

-- =====================================================
-- TAX RATES
-- =====================================================
CREATE TABLE IF NOT EXISTS tax_rates (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    region TEXT NOT NULL, -- 'US-CA', 'EU-DE', 'UK', 'JP', etc.
    region_name TEXT NOT NULL,
    tax_type TEXT NOT NULL CHECK(tax_type IN ('sales_tax', 'vat', 'gst', 'consumption_tax', 'hst')),
    rate REAL NOT NULL, -- Percentage as decimal (e.g., 0.0725 for 7.25%)
    effective_date TEXT NOT NULL,
    end_date TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(region, tax_type, effective_date)
);

-- Insert default tax rates
INSERT OR IGNORE INTO tax_rates (id, region, region_name, tax_type, rate, effective_date) VALUES
-- US States (sales tax)
('tx_us_ca', 'US-CA', 'California', 'sales_tax', 0.0725, '2020-01-01'),
('tx_us_ny', 'US-NY', 'New York', 'sales_tax', 0.08, '2020-01-01'),
('tx_us_tx', 'US-TX', 'Texas', 'sales_tax', 0.0625, '2020-01-01'),
('tx_us_fl', 'US-FL', 'Florida', 'sales_tax', 0.06, '2020-01-01'),
('tx_us_wa', 'US-WA', 'Washington', 'sales_tax', 0.065, '2020-01-01'),
-- EU (VAT)
('tx_eu_de', 'EU-DE', 'Germany', 'vat', 0.19, '2020-01-01'),
('tx_eu_fr', 'EU-FR', 'France', 'vat', 0.20, '2020-01-01'),
('tx_eu_es', 'EU-ES', 'Spain', 'vat', 0.21, '2020-01-01'),
('tx_eu_it', 'EU-IT', 'Italy', 'vat', 0.22, '2020-01-01'),
('tx_eu_nl', 'EU-NL', 'Netherlands', 'vat', 0.21, '2020-01-01'),
-- UK (VAT)
('tx_uk', 'UK', 'United Kingdom', 'vat', 0.20, '2020-01-01'),
-- Canada (GST/HST)
('tx_ca_on', 'CA-ON', 'Ontario', 'hst', 0.13, '2020-01-01'),
('tx_ca_bc', 'CA-BC', 'British Columbia', 'gst', 0.05, '2020-01-01'),
-- Australia (GST)
('tx_au', 'AU', 'Australia', 'gst', 0.10, '2020-01-01'),
-- India (GST)
('tx_in', 'IN', 'India', 'gst', 0.18, '2020-01-01'),
-- Japan (Consumption Tax)
('tx_jp', 'JP', 'Japan', 'consumption_tax', 0.10, '2020-01-01'),
-- Saudi Arabia (VAT)
('tx_sa', 'SA', 'Saudi Arabia', 'vat', 0.15, '2020-01-01'),
-- UAE (VAT)
('tx_ae', 'AE', 'UAE', 'vat', 0.05, '2020-01-01');

CREATE INDEX IF NOT EXISTS idx_tax_rates_region ON tax_rates(region);
CREATE INDEX IF NOT EXISTS idx_tax_rates_type ON tax_rates(tax_type);
CREATE INDEX IF NOT EXISTS idx_tax_rates_active ON tax_rates(is_active);

-- =====================================================
-- TAX EXEMPTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS tax_exemptions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    region TEXT NOT NULL,
    exemption_type TEXT NOT NULL, -- 'nonprofit', 'government', 'reseller', 'diplomatic'
    tax_id TEXT,
    document_url TEXT,
    verified INTEGER DEFAULT 0,
    verified_by TEXT,
    verified_at TEXT,
    expires_at TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, region)
);

CREATE INDEX IF NOT EXISTS idx_tax_exemptions_user ON tax_exemptions(user_id);

-- =====================================================
-- INVOICES
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    invoice_number TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id TEXT REFERENCES user_subscriptions(id),
    amount REAL NOT NULL, -- Base amount before tax
    currency TEXT NOT NULL DEFAULT 'USD' REFERENCES currencies(code),
    tax_region TEXT,
    tax_rate REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    total REAL NOT NULL, -- Amount + tax
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'cancelled', 'refunded', 'overdue')),
    billing_name TEXT,
    billing_email TEXT,
    billing_address TEXT, -- JSON
    billing_tax_id TEXT,
    payment_method TEXT,
    payment_id TEXT, -- External payment reference
    paid_at TEXT,
    due_date TEXT,
    period_start TEXT,
    period_end TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- =====================================================
-- INVOICE LINE ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price REAL NOT NULL,
    amount REAL NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_line_items(invoice_id);

-- =====================================================
-- SUBSCRIPTION PRICES (Multi-Currency)
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_prices (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tier_id TEXT NOT NULL REFERENCES subscription_tiers(id),
    currency TEXT NOT NULL REFERENCES currencies(code),
    price_monthly REAL NOT NULL,
    price_yearly REAL NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(tier_id, currency)
);

-- Insert subscription prices in different currencies
INSERT OR IGNORE INTO subscription_prices (id, tier_id, currency, price_monthly, price_yearly) VALUES
-- Free tier (all currencies)
('sp_free_usd', 'free', 'USD', 0, 0),
-- Pro tier
('sp_pro_usd', 'pro', 'USD', 9.99, 99.99),
('sp_pro_eur', 'pro', 'EUR', 8.99, 89.99),
('sp_pro_gbp', 'pro', 'GBP', 7.99, 79.99),
('sp_pro_jpy', 'pro', 'JPY', 1490, 14900),
('sp_pro_cny', 'pro', 'CNY', 68, 680),
('sp_pro_krw', 'pro', 'KRW', 13200, 132000),
('sp_pro_aed', 'pro', 'AED', 36.99, 369.99),
('sp_pro_sar', 'pro', 'SAR', 37.99, 379.99),
('sp_pro_inr', 'pro', 'INR', 799, 7999),
-- Premium tier
('sp_premium_usd', 'premium', 'USD', 19.99, 199.99),
('sp_premium_eur', 'premium', 'EUR', 17.99, 179.99),
('sp_premium_gbp', 'premium', 'GBP', 15.99, 159.99),
('sp_premium_jpy', 'premium', 'JPY', 2980, 29800),
('sp_premium_cny', 'premium', 'CNY', 138, 1380),
('sp_premium_krw', 'premium', 'KRW', 26400, 264000),
('sp_premium_aed', 'premium', 'AED', 73.99, 739.99),
('sp_premium_sar', 'premium', 'SAR', 74.99, 749.99),
('sp_premium_inr', 'premium', 'INR', 1599, 15999);

CREATE INDEX IF NOT EXISTS idx_subscription_prices_tier ON subscription_prices(tier_id);
CREATE INDEX IF NOT EXISTS idx_subscription_prices_currency ON subscription_prices(currency);

-- =====================================================
-- UPDATE USER PREFERENCES (Add currency)
-- =====================================================
-- Add currency column if not exists (SQLite doesn't support IF NOT EXISTS for columns)
-- We'll handle this in code

-- =====================================================
-- ENCRYPTION KEYS METADATA (HIPAA - Key Management)
-- =====================================================
CREATE TABLE IF NOT EXISTS encryption_keys (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    key_type TEXT NOT NULL CHECK(key_type IN ('data', 'pii', 'phi', 'session')),
    key_version INTEGER NOT NULL,
    algorithm TEXT DEFAULT 'AES-256-GCM',
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'rotated', 'revoked')),
    activated_at TEXT DEFAULT (datetime('now')),
    rotated_at TEXT,
    revoked_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_encryption_keys_type ON encryption_keys(key_type);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_status ON encryption_keys(status);

-- Insert initial key metadata
INSERT OR IGNORE INTO encryption_keys (id, key_type, key_version, status) VALUES
('ek_data_v1', 'data', 1, 'active'),
('ek_pii_v1', 'pii', 1, 'active'),
('ek_phi_v1', 'phi', 1, 'active');

-- =====================================================
-- PHI DATA TRACKING (HIPAA)
-- =====================================================
CREATE TABLE IF NOT EXISTS phi_data_inventory (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    table_name TEXT NOT NULL,
    column_name TEXT NOT NULL,
    data_category TEXT NOT NULL, -- 'demographic', 'health', 'payment', 'biometric'
    sensitivity_level TEXT NOT NULL CHECK(sensitivity_level IN ('low', 'medium', 'high', 'critical')),
    encryption_required INTEGER DEFAULT 1,
    retention_policy TEXT REFERENCES data_retention_policies(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(table_name, column_name)
);

-- Insert PHI inventory
INSERT OR IGNORE INTO phi_data_inventory (id, table_name, column_name, data_category, sensitivity_level) VALUES
('phi_user_email', 'users', 'email', 'demographic', 'medium'),
('phi_user_name', 'users', 'name', 'demographic', 'medium'),
('phi_health_bp', 'health_metrics', 'blood_pressure_systolic', 'health', 'high'),
('phi_health_hr', 'health_metrics', 'heart_rate', 'health', 'high'),
('phi_health_weight', 'health_metrics', 'weight', 'health', 'medium'),
('phi_mood_notes', 'moods', 'notes', 'health', 'high'),
('phi_voice', 'voice_journals', 'audio_url', 'health', 'critical'),
('phi_biometric', 'biometric_credentials', 'credential_id', 'biometric', 'critical');

-- =====================================================
-- BUSINESS ASSOCIATE AGREEMENTS (HIPAA)
-- =====================================================
CREATE TABLE IF NOT EXISTS business_associate_agreements (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    vendor_id TEXT REFERENCES vendors(id),
    agreement_version TEXT NOT NULL,
    signed_date TEXT NOT NULL,
    effective_date TEXT NOT NULL,
    expiration_date TEXT,
    document_url TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('draft', 'pending', 'active', 'expired', 'terminated')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_baa_vendor ON business_associate_agreements(vendor_id);
CREATE INDEX IF NOT EXISTS idx_baa_status ON business_associate_agreements(status);

-- =====================================================
-- BREACH NOTIFICATIONS (HIPAA)
-- =====================================================
CREATE TABLE IF NOT EXISTS breach_notifications (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    incident_id TEXT NOT NULL REFERENCES security_incidents(id),
    notification_type TEXT NOT NULL CHECK(notification_type IN ('individual', 'media', 'hhs', 'state_ag')),
    recipient TEXT,
    sent_at TEXT,
    delivery_method TEXT, -- 'email', 'mail', 'website', 'media'
    content_summary TEXT,
    acknowledgment_received INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_breach_notifications_incident ON breach_notifications(incident_id);
CREATE INDEX IF NOT EXISTS idx_breach_notifications_type ON breach_notifications(notification_type);
