# Changelog

All notable changes to MoodMash are documented in this file.

## [1.2.0] - 2026-01-17

### 🔐 Turnstile Bot Protection & 🔍 SEO Optimization

#### Cloudflare Turnstile Implementation ✅
- **Backend Verification**
  - Server-side Turnstile token verification on login and registration
  - Automatic localhost bypass for development
  - Client IP detection via CF-Connecting-IP header
  - Graceful fallback when secret key not configured

- **Bot Detection System**
  - Automatic IP blocking after 5 failed Turnstile attempts
  - Progressive block duration (1-24 hours)
  - Bot detection logging with metadata
  - IP unblocking after cooldown period

- **Turnstile API Endpoints**
  - `POST /api/turnstile/verify` - Verify Turnstile token
  - `GET /api/turnstile/stats` - Get verification statistics
  - `GET /api/turnstile/check-ip` - Check if IP is blocked

- **Database Tables**
  - `turnstile_logs` - Verification attempt logging
  - `bot_detections` - Blocked IPs tracking

#### Comprehensive SEO Optimization ✅
- **Meta Tags (All Pages)**
  - Primary meta tags (title, description, keywords)
  - Open Graph tags (og:title, og:description, og:image, etc.)
  - Twitter Card tags (summary_large_image)
  - Language alternate tags (hreflang for 8 languages)
  - Canonical URLs
  - Robots directives

- **Structured Data (JSON-LD)**
  - Organization schema
  - WebApplication schema
  - FAQPage schema
  - Product schema (for pricing)
  - Aggregate rating schema

- **Technical SEO**
  - Dynamic sitemap.xml generation
  - robots.txt configuration
  - Multi-language support (8 languages)
  - Mobile-friendly viewport
  - PWA manifest

- **SEO API Endpoints**
  - `GET /sitemap.xml` - Dynamic XML sitemap
  - `GET /robots.txt` - Robots configuration
  - `GET /api/seo/metadata/:page` - Page metadata
  - `GET /api/seo/schema/organization` - Organization JSON-LD
  - `GET /api/seo/schema/application` - WebApp JSON-LD
  - `GET /api/seo/schema/faq` - FAQ JSON-LD

- **Database Tables**
  - `seo_metadata` - Page-specific SEO metadata
  - `sitemap_urls` - Sitemap URL management

#### Competitive Analysis Document ✅
- **Comprehensive 15-section analysis**
  - Executive summary
  - Market overview ($4.2B market)
  - Top 10 competitors detailed analysis
  - Feature comparison matrix
  - MoodMash competitive advantages
  - SWOT analysis
  - Pricing comparison
  - Technology stack comparison
  - Compliance comparison
  - Growth opportunities
  - Recommendations

- **Key Findings**
  - MoodMash is the ONLY app combining AI + Voice + Social + Gamification
  - Best language support (8 languages including CJK, Arabic)
  - Enterprise-grade compliance (HIPAA, CCPA, SOC 2)
  - Most affordable premium tier ($4.99/mo)

---

## [1.1.0] - 2026-01-17

### 🔒 Phase 6 Enhancements: Compliance, CJK Localization, Currency & Taxation

#### Compliance Framework ✅
- **CCPA Compliance (California Consumer Privacy Act)**
  - Data access request portal (`GET /api/compliance/data-request`)
  - Data deletion request (`POST /api/compliance/data-deletion`)
  - Data portability export (`GET /api/compliance/export-portable`)
  - "Do Not Sell My Personal Information" option
  - Consumer request tracking
  - Consent management system

- **HIPAA Compliance (Healthcare Data Protection)**
  - PHI (Protected Health Information) inventory tracking
  - Encryption at rest (AES-256-GCM)
  - Encryption in transit (HTTPS/TLS 1.3)
  - Audit logging for all data access
  - Data retention policies (7-year health data retention)
  - Business Associate Agreement template
  - Breach notification procedures
  - Minimum necessary access principle

- **SOC 2 Compliance (Security Controls)**
  - Security policies documentation
  - Access control policies with RBAC
  - Change management procedures
  - Incident response plan
  - Vendor management and tracking
  - Risk assessment framework
  - Comprehensive audit logging
  - Security monitoring and alerting

- **Compliance Documentation (8+ Legal Documents)**
  - CCPA Privacy Notice
  - HIPAA Notice of Privacy Practices
  - SOC 2 Security Policies
  - Data Processing Agreement (DPA)
  - Business Associate Agreement (BAA)
  - Incident Response Plan
  - Data Retention Policy
  - Acceptable Use Policy

#### CJK Localization ✅
- **3 New Languages Added**
  - Chinese Simplified (zh-CN) - 中文(简体)
  - Japanese (ja) - 日本語
  - Korean (ko) - 한국어
- **Total Languages: 14**
  - English, Spanish, Chinese (Traditional), Chinese (Simplified), French, German, Italian, Arabic, Hindi, Bengali, Tamil, Japanese, Korean, Malay
- **CJK-Specific Features**
  - Proper font support (Noto Sans CJK)
  - UTF-8 character encoding
  - Locale-specific date/time formatting
  - Currency formatting per locale

#### Multi-Currency Support ✅
- **15 Currencies Supported**
  - USD (US Dollar)
  - EUR (Euro)
  - GBP (British Pound)
  - JPY (Japanese Yen)
  - CNY (Chinese Yuan)
  - KRW (Korean Won)
  - AED (UAE Dirham)
  - SAR (Saudi Riyal)
  - CAD (Canadian Dollar)
  - AUD (Australian Dollar)
  - INR (Indian Rupee)
  - BRL (Brazilian Real)
  - MXN (Mexican Peso)
  - CHF (Swiss Franc)
  - SGD (Singapore Dollar)
- **Currency Features**
  - User currency preference setting
  - Real-time currency conversion
  - Subscription pricing in local currency
  - Formatted currency display

#### Taxation System ✅
- **Tax Regions Supported**
  - US (State-level sales tax: CA, NY, TX, FL, WA)
  - EU (VAT: Germany, France, Spain, Italy, Netherlands)
  - UK (VAT)
  - Canada (GST/HST: Ontario, BC)
  - Australia (GST)
  - India (GST)
  - Japan (Consumption Tax)
  - Saudi Arabia (VAT)
  - UAE (VAT)
- **Tax Features**
  - Automatic tax calculation by region
  - Tax exemption handling
  - Tax ID validation
  - Invoice generation with tax
  - Tax compliance reports

#### New API Endpoints (20+)
- `GET /api/compliance/data-request` - CCPA data access
- `POST /api/compliance/data-deletion` - CCPA deletion
- `POST /api/compliance/do-not-sell` - Opt-out of data sales
- `GET /api/compliance/audit-logs` - View audit logs
- `POST /api/compliance/consent` - Manage consent
- `GET /api/compliance/dashboard` - Compliance overview
- `GET /api/compliance/retention-policies` - Data retention info
- `GET /api/compliance/vendors` - Vendor management
- `GET /api/currencies` - List all currencies
- `GET /api/currencies/rates` - Exchange rates
- `GET /api/currencies/convert` - Convert currency
- `POST /api/currencies/set` - Set user preference
- `GET /api/currencies/prices` - Subscription prices
- `GET /api/tax/calculate` - Calculate tax
- `GET /api/tax/regions` - List tax regions
- `GET /api/tax/exemption` - Check exemption
- `POST /api/tax/exemption` - Apply for exemption
- `POST /api/currencies/invoices/generate` - Generate invoice
- `GET /api/currencies/invoices/:id` - Get invoice
- `GET /api/currencies/invoices` - List invoices

#### Database Schema Updates
- `audit_logs` - Comprehensive audit trail
- `data_access_logs` - CCPA data access tracking
- `compliance_consents` - Consent management
- `data_retention_policies` - Retention rules
- `ccpa_data_requests` - CCPA request tracking
- `do_not_sell_preferences` - CCPA opt-out
- `security_incidents` - Incident tracking
- `vendors` - Vendor management
- `currencies` - Currency definitions
- `exchange_rates` - Currency rates
- `tax_rates` - Regional tax rates
- `tax_exemptions` - Tax exemption records
- `invoices` - Invoice management
- `invoice_line_items` - Invoice details
- `subscription_prices` - Multi-currency pricing
- `encryption_keys` - Key metadata
- `phi_data_inventory` - PHI tracking
- `business_associate_agreements` - BAA records
- `breach_notifications` - HIPAA notifications

---

## [1.0.0] - 2026-01-17

### 🎉 Initial Full Release - All Phases Complete

#### Phase 6: Premium Features, Localization & Compliance ✅
- **Subscription System**
  - Three tiers: Free, Pro, Premium
  - Usage tracking and limits per tier
  - Monthly reset system
  - Upgrade prompts when limits reached
- **AI Chatbot "Mood"**
  - Empathetic AI companion powered by Gemini
  - Context-aware responses (mood history)
  - Conversation history and threading
  - Typing indicators
  - Voice input support
- **Voice Features**
  - Speech-to-text for chatbot (Web Speech API + Gemini)
  - Text-to-speech for responses
  - Read-aloud for content pages
  - Language-aware pronunciation (5 languages)
- **Full Localization**
  - 5 languages: English, Arabic (RTL), Spanish, French, German
  - All UI elements translated
  - Dynamic language switching
- **Accessibility (WCAG AA)**
  - ARIA labels on all interactive elements
  - Keyboard navigation (Tab, Enter, Escape)
  - Screen reader support
  - Skip to main content links
  - Focus indicators
- **Legal Documents**
  - Privacy Policy (GDPR-aware)
  - Terms of Service
  - Cookie Policy
  - Data Processing Agreement
- **Cookie Consent Banner**
  - Friendly message with privacy link
  - Accept/Decline options
  - Persistent choice storage
- **Analytics Dashboard (Admin)**
  - User growth metrics (DAU, MAU)
  - Feature usage stats
  - Emotion distribution
  - Subscription analytics

#### Phase 5: Security & Health Integration ✅
- Two-factor authentication (TOTP + Email)
- Session management
- Login history tracking
- Security events monitoring
- Wearable device integration
- Sleep tracking
- Health insights dashboard
- Mood visualizations (heatmap, radar, timeline)

#### Phase 4: Gamification ✅
- Points system for actions
- Achievement badges (40+ achievements)
- Daily/weekly challenges
- Global and friend leaderboards
- Streak tracking
- Level progression

#### Phase 3: Social Features ✅
- Friend connections
- Mood groups
- Activity feed
- Real-time notifications
- Group mood sharing
- User profiles

#### Phase 2: Voice & AI Insights ✅
- Voice journaling
- Gemini AI integration
- Mood pattern analysis
- Data export (JSON, CSV, GDPR)
- OAuth (Google, GitHub)
- Password reset flow

#### Phase 1: Core MVP ✅
- User authentication
- Mood logging (9 emotions)
- Dashboard with statistics
- Calendar view
- History tracking
- Dark mode

### Technical Highlights
- **Stack**: Hono, TypeScript, Cloudflare Workers, D1
- **Bundle Size**: ~287KB (optimized)
- **API Endpoints**: 100+
- **TypeScript Errors**: 0 (strict mode)
- **Test Coverage**: 131+ tests

---

## [0.1.0] - 2026-01-15

### Initial Development
- Project scaffolding
- Database schema design
- Core authentication system
- Basic mood tracking
