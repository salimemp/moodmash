# MoodMash 🎭

**AI-Powered Mental Wellness Tracking Platform**

A comprehensive mood tracking and mental wellness application with advanced AI insights, real-time analytics, and personalized recommendations.

---

## 🌐 Live Application

- **Production:** https://moodmash.win
- **Latest Build:** https://e10994bf.moodmash.pages.dev
- **Monitoring Dashboard:** https://moodmash.win/monitoring
- **AI Chat Assistant:** https://moodmash.win/ai-chat

---

## 📊 Project Overview

MoodMash is a full-stack mental wellness platform that helps users track their emotional states, identify patterns, and receive AI-powered insights for better mental health management.

### **Core Features**

#### 🎯 **Mood Tracking**
- Comprehensive emotion logging (happy, sad, anxious, calm, energetic, tired, etc.)
- Intensity levels (1-10 scale)
- Contextual data: weather, sleep quality, social interactions
- Activity tracking with categories and difficulty levels
- Photo attachments via R2 storage
- Private notes and reflections

#### 🤖 **AI-Powered Insights**
- **Gemini AI Integration** - Advanced natural language processing
- **Conversational AI Chat** - 24/7 mental wellness support
- Pattern detection and trend analysis
- Personalized wellness recommendations
- Mood correlation analysis (sleep, weather, activities)
- Crisis detection and support resources

#### 📈 **Analytics & Visualization**
- Interactive mood history charts
- Weekly/monthly trend analysis
- Pattern recognition (time-based, activity-based)
- Emotion distribution statistics
- Health metrics dashboard
- Exportable reports (CSV, iCal)

#### 🏥 **Mental Health Tools**
- Wellness activity recommendations
- Guided exercises and meditations
- Crisis hotline resources
- Progress tracking
- Goal setting and achievements
- Social support features

#### 🔒 **Security & Privacy**
- OAuth 2.0 authentication (Google)
- Email/password authentication with bcrypt
- Session-based auth with secure tokens
- Email verification system
- HIPAA-compliant data handling
- Research data anonymization
- Rate limiting and security monitoring
- Sentry.io error tracking

---

## 🛠️ Technology Stack

### **Frontend**
- **HTML/CSS/JavaScript** - Vanilla JS with modern ES6+
- **TailwindCSS** - Utility-first CSS framework (CDN)
- **Chart.js** - Data visualization
- **Font Awesome** - Icon library
- **Responsive Design** - Mobile-first approach

### **Backend**
- **Hono Framework** - Lightweight edge-first web framework
- **TypeScript** - Type-safe development
- **Cloudflare Workers** - Edge runtime platform
- **Cloudflare Pages** - Static site hosting

### **Database & Storage**
- **Cloudflare D1** - SQLite-based distributed database
- **Cloudflare R2** - S3-compatible object storage for images
- **In-Memory Cache** - Performance optimization with TTL

### **External Services**
- **Resend API** - Transactional email service
- **Google Gemini AI** - Natural language processing
- **Google OAuth** - Social authentication
- **Sentry.io** - Error tracking and monitoring

### **DevOps & Monitoring**
- **Wrangler** - Cloudflare CLI tool
- **PM2** - Process manager for development
- **Git** - Version control
- **Prometheus/Grafana** - Metrics collection (ready)
- **Sentry** - Real-time error tracking

---

## 📁 Project Structure

```
moodmash/
├── src/
│   ├── index.tsx                    # Main Hono application (6,029 lines)
│   ├── types.ts                     # TypeScript type definitions
│   ├── middleware/
│   │   ├── analytics.ts             # Request tracking
│   │   ├── auth-wall.ts             # Authentication middleware
│   │   ├── premium.ts               # Premium feature checks
│   │   └── security.ts              # Security headers
│   ├── services/
│   │   ├── cache.ts                 # In-memory caching (MEMORY LEAK FIXED)
│   │   ├── metrics.ts               # Prometheus metrics (OPTIMIZED)
│   │   ├── sentry.ts                # Error tracking
│   │   ├── gemini-ai.ts             # AI integration
│   │   ├── health-metrics.ts        # Health calculations
│   │   ├── hipaa-compliance.ts      # Data privacy
│   │   └── security-monitoring.ts   # Security events
│   ├── utils/
│   │   ├── email.ts                 # Email sending (custom domain)
│   │   ├── email-verification.ts    # Email templates
│   │   └── calendar.ts              # iCal export
│   └── routes/
│       └── advanced-features.ts     # Advanced endpoints
├── public/
│   └── static/
│       ├── app.js                   # Frontend JavaScript
│       ├── styles.css               # Custom styles
│       ├── monitoring.js            # Monitoring dashboard
│       └── sentry-browser.js        # Client-side error tracking
├── migrations/                      # D1 database migrations
│   ├── 0001_initial_schema.sql
│   ├── 0002_add_ai_chat.sql
│   └── meta/
├── dist/                            # Build output
│   ├── _worker.js                   # Compiled worker
│   └── _routes.json                 # Routing config
├── .wrangler/                       # Local development files
│   └── state/v3/d1/                 # Local SQLite databases
├── wrangler.jsonc                   # Cloudflare configuration
├── vite.config.ts                   # Vite build config
├── ecosystem.config.cjs             # PM2 configuration
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── .gitignore                       # Git ignore rules
├── .dev.vars                        # Local env variables
└── README.md                        # This file
```

---

## 🗄️ Database Schema

### **Core Tables**

**users**
- User authentication and profile data
- OAuth provider info
- Email verification status
- Premium subscription status
- Created/updated timestamps

**mood_entries**
- Emotion type and intensity
- Weather, sleep quality, social interaction
- Activity associations
- Photo attachments (R2 URLs)
- Private notes
- Timestamps

**activities**
- Activity name and description
- Category (exercise, creative, social, etc.)
- Duration and difficulty
- Target emotions
- Wellness recommendations

**sessions**
- Session tokens (hashed)
- User ID foreign key
- Expiration timestamps
- Trust device flag

**chat_conversations**
- User chat sessions
- Conversation titles
- Created timestamps

**chat_messages**
- Conversation messages
- Role (user/assistant)
- Message content
- Timestamps

---

## 🚀 Getting Started

### **Prerequisites**

- Node.js 18+ and npm
- Cloudflare account
- Wrangler CLI
- Git

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/username/moodmash.git
   cd moodmash
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create `.dev.vars` file:
   ```bash
   RESEND_API_KEY=re_xxxxx
   GEMINI_API_KEY=xxxxx
   GOOGLE_CLIENT_ID=xxxxx
   GOOGLE_CLIENT_SECRET=xxxxx
   SESSION_SECRET=xxxxx
   SENTRY_DSN=https://xxxxx@xxxxx.ingest.de.sentry.io/xxxxx
   ```
   
   **OAuth Setup:** See [OAUTH_SETUP_GUIDE.md](./OAUTH_SETUP_GUIDE.md) for complete instructions on:
   - Setting up Google OAuth (Web/iOS/Android)
   - Setting up GitHub OAuth
   - Understanding platform-specific requirements
   - Security best practices
   - Troubleshooting common issues

4. **Set up D1 database**
   ```bash
   # Create production database
   npx wrangler d1 create moodmash-production
   
   # Apply migrations locally
   npm run db:migrate:local
   
   # Seed test data (optional)
   npm run db:seed
   ```

5. **Configure wrangler.jsonc**
   
   Update with your database ID:
   ```jsonc
   {
     "name": "moodmash",
     "d1_databases": [
       {
         "binding": "DB",
         "database_name": "moodmash-production",
         "database_id": "your-database-id-here"
       }
     ]
   }
   ```

### **Development**

```bash
# Build the project
npm run build

# Start local development server
npm run dev:sandbox

# Or use PM2 (recommended for sandbox)
pm2 start ecosystem.config.cjs
pm2 logs moodmash --nostream
```

**Access the app:**
- Local: http://localhost:3000
- Health: http://localhost:3000/api/health/status
- Monitoring: http://localhost:3000/monitoring

### **Testing**

```bash
# Test API health
curl http://localhost:3000/api/health/status

# Test email service
curl -X POST http://localhost:3000/api/email-test \
  -H "Content-Type: application/json" \
  -d '{"type":"welcome","email":"your@email.com"}'

# Test metrics
curl http://localhost:3000/api/monitoring/metrics

# Test Sentry error tracking
curl -X POST http://localhost:3000/api/sentry-test
```

---

## 📧 Email Configuration

### **Custom Domain Setup**

**Verified Domain:** `verify.moodmash.win`  
**Default From:** `MoodMash <noreply@verify.moodmash.win>`

### **Supported Email Types**

| Email Type | Template Function | Purpose |
|------------|------------------|---------|
| Welcome | `generateWelcomeEmail()` | New user onboarding |
| Verification | `generateVerificationEmail()` | Email verification |
| Password Reset | `generatePasswordResetEmail()` | Password recovery |
| Magic Link | `generateMagicLinkEmail()` | Passwordless login |
| 2FA Backup | `generate2FABackupCodesEmail()` | 2FA recovery |
| Contact Form | `generateContactConfirmationEmail()` | User confirmation |
| Admin Alert | `generateContactAdminNotificationEmail()` | Admin notifications |

### **Email Testing**

All 4 primary email types have been tested and verified:
- ✅ Welcome email
- ✅ Verification email
- ✅ Password reset email
- ✅ Magic link email

**Test Results:** All emails delivered successfully from `verify.moodmash.win`

---

## 🔐 Authentication & Security

### **Authentication Methods**
- Email/Password with bcrypt hashing
- Google OAuth 2.0
- Session-based auth with secure cookies
- Email verification required
- Magic link support (planned)

### **Security Features**
- Rate limiting on sensitive endpoints
- CSRF protection
- Security headers (CSP, HSTS, etc.)
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Session timeout (1 day default, 30 days with "trust device")

### **Privacy & Compliance**
- HIPAA-compliant data handling
- Research data anonymization
- PII scrubbing in error logs
- Secure password hashing (bcrypt)
- Email hashing in Sentry
- Password/token redaction

---

## 📊 Monitoring & Analytics

### **Built-in Monitoring**

**Prometheus-Compatible Metrics:**
- HTTP requests total
- HTTP errors total
- Response time (avg, p95, p99)
- Active users
- Database queries
- Auth attempts/failures

**Health Check Endpoint:**
- `/api/health/status` - Component-level health checks
- Database connectivity
- R2 storage status
- Email service status
- AI service status
- Uptime tracking

**Monitoring Dashboard:**
- Real-time metrics visualization
- System health overview
- Performance graphs
- Error tracking

### **Sentry Integration**

**Error Tracking:**
- Backend errors (Cloudflare Workers)
- Frontend errors (Browser)
- User context tracking
- Breadcrumbs for debugging
- Automatic PII scrubbing

**Sentry Configuration:**
- Account: salimemp
- Project: moodmash
- Region: Germany (de.sentry.io)
- DSN: Configured as secret

**Alert Channels:**
- Email: salimmakrana@gmail.com
- Slack: #moodmash-alerts (configurable)

### **Grafana/Prometheus Setup**

Ready for external monitoring:
- Prometheus scraping endpoint: `/metrics`
- Pre-configured dashboard JSON
- Alert rules for high error rates, slow responses
- Complete setup guide: `GRAFANA_PROMETHEUS_SETUP.md`

---

## 🐛 Memory Leak Fixes & Performance

### **Memory Optimizations (2025-11-27)**

**Cache Service (`src/services/cache.ts`):**
- ✅ Automatic cleanup every 5 minutes
- ✅ Lazy cleanup (5 entries per get)
- ✅ Size limit: 1000 entries (~2 MB max)
- ✅ LRU-style eviction
- **Result:** Memory growth eliminated

**Metrics Service (`src/services/metrics.ts`):**
- ✅ Circular buffer for response times (O(1) vs O(n))
- ✅ 100x performance improvement (0.5ms → 0.005ms)
- ✅ Label count limit (max 50 per metric)
- ✅ Fixed memory at ~8 KB
- **Result:** Much faster, no memory leaks

**Documentation:**
- `MEMORY_LEAK_ANALYSIS.md` - Detailed analysis
- `MEMORY_LEAK_EMAIL_TEST_REPORT.md` - Test results
- `CUSTOM_DOMAIN_EMAIL_SUCCESS.md` - Email config

---

## 🚀 Deployment

### **Production Deployment**

**Platform:** Cloudflare Pages  
**URL:** https://moodmash.win  
**Branch:** main

### **Deployment Steps**

1. **Setup Cloudflare API Key**
   ```bash
   # Configure authentication (required first)
   # Guide user to Deploy tab for API key setup
   ```

2. **Build the project**
   ```bash
   npm run build
   ```

3. **Deploy to production**
   ```bash
   npm run deploy:prod
   ```

4. **Apply database migrations**
   ```bash
   npm run db:migrate:prod
   ```

5. **Configure secrets**
   ```bash
   npx wrangler pages secret put RESEND_API_KEY
   npx wrangler pages secret put GEMINI_API_KEY
   npx wrangler pages secret put GOOGLE_CLIENT_ID
   npx wrangler pages secret put GOOGLE_CLIENT_SECRET
   npx wrangler pages secret put SESSION_SECRET
   npx wrangler pages secret put SENTRY_DSN
   ```

### **Deployment Verification**

```bash
# Check health status
curl https://moodmash.win/api/health/status

# Test email service
curl -X POST https://moodmash.win/api/email-test \
  -H "Content-Type: application/json" \
  -d '{"type":"welcome","email":"test@example.com"}'

# Check metrics
curl https://moodmash.win/api/monitoring/metrics

# Test Sentry
curl -X POST https://moodmash.win/api/sentry-test
```

---

## 📦 NPM Scripts

```json
{
  "dev": "vite",
  "dev:sandbox": "wrangler pages dev dist --ip 0.0.0.0 --port 3000",
  "dev:d1": "wrangler pages dev dist --d1=moodmash-production --local --ip 0.0.0.0 --port 3000",
  "build": "vite build",
  "preview": "wrangler pages dev dist",
  "deploy": "npm run build && wrangler pages deploy dist",
  "deploy:prod": "npm run build && wrangler pages deploy dist --project-name moodmash",
  "clean-port": "fuser -k 3000/tcp 2>/dev/null || true",
  "test": "curl http://localhost:3000",
  "db:migrate:local": "wrangler d1 migrations apply moodmash-production --local",
  "db:migrate:prod": "wrangler d1 migrations apply moodmash-production",
  "db:seed": "wrangler d1 execute moodmash-production --local --file=./seed.sql",
  "db:reset": "rm -rf .wrangler/state/v3/d1 && npm run db:migrate:local && npm run db:seed",
  "db:console:local": "wrangler d1 execute moodmash-production --local",
  "db:console:prod": "wrangler d1 execute moodmash-production"
}
```

---

## 🎯 API Endpoints

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/google` - Google OAuth initiation
- `GET /api/auth/google/callback` - OAuth callback
- `POST /api/auth/resend-verification` - Resend verification email
- `GET /api/auth/verify-email` - Email verification

### **Mood Tracking**
- `POST /api/mood` - Create mood entry
- `GET /api/mood` - Get user's mood entries
- `GET /api/mood/:id` - Get specific mood entry
- `PUT /api/mood/:id` - Update mood entry
- `DELETE /api/mood/:id` - Delete mood entry

### **Analytics**
- `GET /api/stats` - User mood statistics
- `GET /api/patterns` - Detected mood patterns
- `GET /api/health/metrics` - Health metrics calculation
- `GET /api/health/trends/:period` - Trend analysis
- `GET /api/mood/calendar` - Calendar view data

### **AI Features**
- `POST /api/ai/analyze` - AI mood analysis
- `GET /api/chat/conversations` - Get chat conversations
- `POST /api/chat/conversations` - Create new conversation
- `POST /api/chat/:conversationId/messages` - Send chat message
- `GET /api/chat/:conversationId/messages` - Get conversation history

### **Wellness**
- `GET /api/activities` - Get wellness activities
- `GET /api/activities/recommendations` - Get personalized recommendations
- `POST /api/activities/complete` - Mark activity as completed

### **Monitoring**
- `GET /api/health/status` - System health check
- `GET /api/monitoring/metrics` - Prometheus metrics (JSON)
- `GET /metrics` - Prometheus metrics (text format)
- `GET /monitoring` - Monitoring dashboard (HTML)
- `POST /api/sentry-test` - Test Sentry error tracking
- `POST /api/email-test` - Test email service

### **User Management**
- `GET /api/user` - Get user profile
- `PUT /api/user` - Update user profile
- `DELETE /api/user` - Delete user account

---

## 🔧 Configuration Files

### **wrangler.jsonc**
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "moodmash",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "moodmash-production",
      "database_id": "0483fe1c-facc-4e05-8123-48205b4561f4"
    }
  ],
  "r2_buckets": [
    {
      "binding": "R2",
      "bucket_name": "moodmash-storage"
    }
  ]
}
```

### **vite.config.ts**
```typescript
import { defineConfig } from 'vite'
import pages from '@hono/vite-cloudflare-pages'

export default defineConfig({
  plugins: [pages()],
  build: {
    outDir: 'dist'
  }
})
```

---

## 📚 Documentation

### **Project Documentation**
- `README.md` - This file (project overview)
- `MEMORY_LEAK_ANALYSIS.md` - Memory leak analysis and fixes
- `MEMORY_LEAK_EMAIL_TEST_REPORT.md` - Comprehensive test results
- `CUSTOM_DOMAIN_EMAIL_SUCCESS.md` - Email domain configuration
- `MONITORING_GUIDE.md` - Monitoring setup guide
- `MONITORING_STATUS.md` - Current monitoring status
- `GRAFANA_PROMETHEUS_SETUP.md` - Grafana/Prometheus setup
- `SENTRY_SETUP_GUIDE.md` - Sentry integration guide
- `SENTRY_INTEGRATION.md` - Sentry technical details
- `SENTRY_ALERTS_SETUP.md` - Alert configuration
- `SENTRY_QUICK_SETUP.md` - Quick start guide
- `HOW_TO_GET_SENTRY_DSN.md` - DSN retrieval guide
- `SENTRY_DEPLOYMENT_SUCCESS.md` - Deployment status

---

## 🎯 Current Status

### **Completed Features** ✅

- ✅ User authentication (email/password + Google OAuth)
- ✅ Email verification system
- ✅ Mood entry creation with full context
- ✅ Photo uploads (R2 storage)
- ✅ Mood history and calendar view
- ✅ Analytics dashboard with charts
- ✅ Pattern detection and insights
- ✅ Wellness activity recommendations
- ✅ AI-powered mood analysis (Gemini)
- ✅ Conversational AI chat assistant
- ✅ Health metrics calculation
- ✅ Trend analysis (weekly/monthly)
- ✅ Export functionality (CSV, iCal)
- ✅ Premium subscription system
- ✅ Contact form
- ✅ Prometheus/Grafana monitoring ready
- ✅ Sentry error tracking (backend + frontend)
- ✅ Memory leak fixes (cache + metrics)
- ✅ Custom email domain (verify.moodmash.win)
- ✅ Email service fully operational (4 types tested)
- ✅ Production deployment at moodmash.win

### **System Health** 🟢

All services operational:
- ✅ API: healthy
- ✅ Database: healthy (Cloudflare D1)
- ✅ Auth: healthy (OAuth + email/password)
- ✅ Email: configured (verify.moodmash.win)
- ✅ Storage: healthy (Cloudflare R2)
- ✅ AI: configured (Google Gemini)
- ✅ Monitoring: active (Prometheus + Sentry)
- ✅ Error Tracking: active (Sentry.io)

### **Performance Metrics**

- Memory usage: Capped at ~2 MB (cache service)
- Response time recording: 100x faster (O(1) circular buffer)
- Cache cleanup: Automatic every 5 minutes
- Metrics collection: Label limit enforced (max 50)
- No memory leaks detected

### **In Progress / Planned** 🚧

- ⚪ Magic link authentication
- ⚪ Two-factor authentication (2FA)
- ⚪ Social features (friend support network)
- ⚪ Gamification (achievements, streaks)
- ⚪ Mobile app (PWA)
- ⚪ Advanced AI recommendations
- ⚪ Group therapy features
- ⚪ Therapist portal
- ⚪ Data export/import (full backup)
- ⚪ Internationalization (i18n)

---

## 🤝 Contributing

This is a private project. For feature requests or bug reports, please contact the development team.

---

## 📄 License

Proprietary - All rights reserved

---

## 👥 Contact

- **Email:** support@moodmash.win
- **Website:** https://moodmash.win
- **Sentry:** https://sentry.io/organizations/o4508950853189632/projects/moodmash/
- **Monitoring:** https://moodmash.win/monitoring

---

## 🙏 Acknowledgments

- **Hono Framework** - Lightweight edge-first web framework
- **Cloudflare** - Workers, Pages, D1, R2 platform
- **Google Gemini AI** - Natural language processing
- **Resend** - Transactional email service
- **Sentry.io** - Error tracking and monitoring
- **TailwindCSS** - Utility-first CSS framework
- **Chart.js** - Data visualization library

---

**Last Updated:** 2025-11-27  
**Version:** 1.0.0  
**Status:** Production Ready ✅
