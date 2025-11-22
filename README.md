# MoodMash

**Intelligent Mood Tracking & Emotional Wellness Platform**

MoodMash is a modern web application for tracking your emotional wellbeing, identifying patterns, and discovering personalized wellness activities. Built with Hono, Cloudflare Pages, and D1 database.

## 🎯 Project Overview

- **Name**: MoodMash
- **Version**: 1.0.0 (MVP)
- **Goal**: Help users understand, track, and improve emotional wellbeing through data-driven insights
- **Tech Stack**: Hono + TypeScript + Cloudflare Pages + D1 Database + TailwindCSS + Chart.js

## 🌐 Live URLs

- **Sandbox Demo**: https://3000-ivyhev2bykdm8jd3g25um-5634da27.sandbox.novita.ai
- **API Health**: https://3000-ivyhev2bykdm8jd3g25um-5634da27.sandbox.novita.ai/api/health
- **GitHub**: https://github.com/salimemp/moodmash
- **Production**: (Coming soon to Cloudflare Pages)

## ✨ Current Features (MVP v1.0)

### ✅ Completed Features

1. **Mood Logging**
   - 10 emotion types (happy, sad, anxious, calm, energetic, tired, angry, peaceful, stressed, neutral)
   - 5-level intensity scale
   - Personal notes and context
   - Timestamp tracking

2. **Context Tracking**
   - Weather conditions
   - Sleep hours
   - Activities (work, exercise, social, etc.)
   - Social interactions (alone, friends, family, colleagues)

3. **Visual Dashboard**
   - Mood distribution chart (doughnut chart)
   - Intensity trend over time (line chart)
   - Statistics cards (total entries, most common emotion, average intensity, trend)
   - Recent mood history

4. **Mood Analytics**
   - Automatic pattern detection
   - Trend analysis (improving/declining/stable)
   - AI-powered insights and recommendations
   - 30-day statistics

5. **Wellness Activities**
   - 10+ evidence-based activities
   - Filter by target emotions
   - Categories: meditation, exercise, journaling, social, creative
   - Difficulty levels and duration tracking

6. **Responsive Design**
   - Mobile-first approach
   - Modern UI with TailwindCSS
   - Smooth animations and transitions
   - Color-coded emotions

7. **Internationalization (i18n)**
   - 13 language support (English, Spanish, Chinese, French, German, Italian, Arabic, Hindi, Bengali, Tamil, Japanese, Korean, Malay)
   - Complete translations for all UI elements
   - RTL (Right-to-Left) support for Arabic
   - Automatic language detection
   - Persistent language preferences
   - Real-time language switching

8. **Onboarding System**
   - Interactive 4-slide onboarding tour
   - Free tier feature showcase
   - Premium tier benefits ($4.99/month)
   - Animated transitions and progress indicators
   - Skip and navigation controls
   - First-visit detection with localStorage

9. **Multilingual Chatbot**
   - Floating chatbot interface
   - FAQ database with smart keyword matching
   - Quick action buttons
   - 13-language support
   - Context-aware responses
   - Smooth animations and typing indicators

10. **Accessibility Features**
    - Text-to-speech read aloud (Alt+R)
    - Adjustable font sizes (small/normal/large)
    - High contrast mode
    - Keyboard navigation support
    - ARIA labels and live regions
    - Screen reader optimized
    - WCAG 2.1 AA compliant
    - Reduced motion support

11. **Premium Tier ($4.99/month)**
    - Unlimited analytics history
    - AI-powered insights and predictions
    - Advanced pattern recognition
    - Export data to CSV/PDF
    - Custom themes and widgets
    - Cloud sync across devices
    - Priority support
    - Early access to new features

12. **Express Your Mood (NEW! 🎉)**
    - Multi-modal mood expression system
    - 5 input modes: Emoji, Color, Intensity Slider, Text, Voice
    - Privacy settings (Private, Friends, Public)
    - Mood tags and sharing options
    - Quick select from recently used emojis
    - Color psychology integration
    - Real-time voice recording
    - Beautiful gradient UI with animations

13. **Daily Mood Insights (NEW! 📊)**
    - Comprehensive mood analytics dashboard
    - Dominant mood tracking with statistics
    - Interactive mood timeline with intensity visualization
    - Weekly and monthly trend analysis
    - Mood stability indicators
    - Pattern detection and correlations
    - Personalized wellness recommendations
    - Export and share insights

14. **Quick Mood Select (NEW! ⚡)**
    - Fast one-tap mood logging
    - Recently used emojis for quick access
    - All emotions available in grid view
    - Seamless integration with dashboard
    - Auto-save functionality
    - Timestamp tracking
    - Lightweight and responsive

### 📋 Functional Entry URIs

**API Endpoints:**
- `GET /api/health` - Health check
- `GET /api/moods?limit=50&emotion=happy` - Get mood entries (with optional filters)
- `GET /api/moods/:id` - Get single mood entry
- `POST /api/moods` - Create new mood entry
- `PUT /api/moods/:id` - Update mood entry
- `DELETE /api/moods/:id` - Delete mood entry
- `GET /api/stats?days=30` - Get mood statistics
- `GET /api/activities?emotion=anxious` - Get wellness activities (with optional filter)
- `POST /api/activities/:id/log` - Log activity completion

**Web Pages:**
- `/` - Dashboard (mood stats and recent entries)
- `/log` - Log new mood entry
- `/express` - 🎉 NEW! Express Your Mood (multi-modal interface)
- `/insights` - 📊 NEW! Daily Mood Insights (analytics dashboard)
- `/quick-select` - ⚡ NEW! Quick Mood Select (fast logging)
- `/activities` - Browse wellness activities
- `/about` - About MoodMash and future vision

## 🗄️ Data Architecture

### Data Models

1. **Users** - User accounts (currently single-user MVP)
2. **Mood Entries** - Core mood tracking data
   - Emotion, intensity, notes
   - Context: weather, sleep, activities, social interaction
   - Timestamps
3. **Wellness Activities** - Recommended interventions
   - Title, description, category, duration
   - Target emotions, difficulty level
4. **Activity Log** - User activity tracking
5. **Mood Patterns** - Pattern detection (future AI/ML)
6. **Genomics Data** - Placeholder for future integration
7. **API Integration Log** - External service calls tracking

### Storage Services

- **Cloudflare D1 Database** - SQLite-based globally distributed database
  - Local development: `.wrangler/state/v3/d1` (automatic with `--local` flag)
  - Production: Cloudflare D1 instance
- **Future**: Cloudflare KV for caching, R2 for file storage

### Data Flow

1. User logs mood via `/log` page
2. Frontend sends POST request to `/api/moods`
3. Hono API validates and stores in D1 database
4. Dashboard fetches data via `/api/moods` and `/api/stats`
5. Chart.js renders visualizations
6. Insights generated from statistical analysis

## 🔐 OAuth Setup

### Get OAuth Credentials

1. **Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create a new project or select existing
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
   - Copy Client ID and Client Secret

2. **GitHub OAuth**
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Click "New OAuth App"
   - Set callback URL: `http://localhost:3000/auth/github/callback`
   - Copy Client ID and Client Secret

3. **Facebook OAuth**
   - Go to [Facebook Developers](https://developers.facebook.com/apps/)
   - Create a new app
   - Add Facebook Login product
   - Set redirect URI: `http://localhost:3000/auth/facebook/callback`
   - Copy App ID and App Secret

### Configure Environment Variables

```bash
# Copy example file
cp .dev.vars.example .dev.vars

# Edit .dev.vars and add your OAuth credentials
nano .dev.vars
```

**Example .dev.vars:**
```bash
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
SESSION_SECRET=your_random_session_secret
BASE_URL=http://localhost:3000
```

**For Production Deployment:**
```bash
# Set secrets using Wrangler
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name moodmash
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name moodmash
npx wrangler pages secret put GITHUB_CLIENT_ID --project-name moodmash
npx wrangler pages secret put GITHUB_CLIENT_SECRET --project-name moodmash
npx wrangler pages secret put FACEBOOK_CLIENT_ID --project-name moodmash
npx wrangler pages secret put FACEBOOK_CLIENT_SECRET --project-name moodmash
npx wrangler pages secret put SESSION_SECRET --project-name moodmash
npx wrangler pages secret put BASE_URL --project-name moodmash
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Wrangler CLI (installed via npm)
- Cloudflare account (for production deployment)
- OAuth credentials (Google, GitHub, Facebook) - see OAuth Setup above

### Local Development

```bash
# Install dependencies (already done if you cloned)
npm install

# Initialize local database
npm run db:migrate:local
npm run db:seed

# Build the application
npm run build

# Start development server
npm run dev:sandbox

# Or use PM2 (recommended)
pm2 start ecosystem.config.cjs
pm2 logs moodmash

# Test the API
curl http://localhost:3000/api/health
```

### Database Commands

```bash
# Apply migrations to local database
npm run db:migrate:local

# Seed local database with test data
npm run db:seed

# Reset local database (WARNING: deletes all data)
npm run db:reset

# Execute SQL query on local database
npm run db:console:local -- --command="SELECT * FROM mood_entries LIMIT 5"

# Apply migrations to production (after wrangler setup)
npm run db:migrate:prod

# Execute SQL query on production
npm run db:console:prod -- --command="SELECT COUNT(*) FROM users"
```

## 📦 Deployment

### Cloudflare Pages Deployment

**Prerequisites:**
1. Call `setup_cloudflare_api_key` to configure authentication
2. Create production D1 database: `npx wrangler d1 create moodmash-production`
3. Update `database_id` in `wrangler.jsonc`

```bash
# Build the application
npm run build

# Create Cloudflare Pages project
npx wrangler pages project create moodmash \
  --production-branch main \
  --compatibility-date 2025-11-11

# Apply migrations to production database
npm run db:migrate:prod

# Seed production database (optional)
npx wrangler d1 execute moodmash-production --file=./seed.sql

# Deploy to Cloudflare Pages
npm run deploy:prod

# Set environment variables (if needed)
npx wrangler pages secret put API_KEY --project-name moodmash
```

**Deployment URLs:**
- Production: `https://moodmash.pages.dev`
- Branch: `https://main.moodmash.pages.dev`

## 🔮 Features Not Yet Implemented (Future Vision)

### Phase 2: AI/ML Integration
- [ ] Advanced mood pattern recognition
- [ ] Predictive mood forecasting
- [ ] Causal factor identification
- [ ] Integration with OpenAI/Anthropic APIs
- [ ] Custom ML models for mood analysis

### Phase 3: Genomics & Health MOT
- [ ] 23andMe/Ancestry data import
- [ ] Genetic risk factor analysis
- [ ] Personalized wellness recommendations based on genomics
- [ ] Health dashboard with integrated metrics
- [ ] Wearable device integration (Fitbit, Apple Watch)

### Phase 4: Social Features
- [ ] Anonymous mood sharing
- [ ] Mood compatibility matching
- [ ] Group mood challenges
- [ ] Global mood map visualization
- [ ] Community support features

### Phase 5: Professional Integration
- [ ] Therapist dashboard
- [ ] Crisis detection and intervention
- [ ] Professional resource connections
- [ ] HIPAA compliance for healthcare integration

### Phase 6: Advanced Features
- [x] OAuth 2.0 authentication (Google, GitHub, Facebook) ✨ NEW
- [ ] Real-time mood notifications
- [ ] AR/VR mood environments
- [ ] Voice mood logging
- [ ] Mood journal with rich text
- [ ] Export data to CSV/PDF

## 🛠️ Recommended Next Steps

1. **User Authentication**
   - Integrate Auth0 or Clerk for user management
   - Add user registration and login
   - Implement user-specific data isolation

2. **Enhanced Analytics**
   - Add more chart types (heatmaps, calendars)
   - Implement correlation analysis (mood vs. weather, sleep)
   - Weekly/monthly mood reports

3. **AI/ML Integration**
   - Connect to OpenAI API for insights generation
   - Build pattern recognition algorithms
   - Predictive mood forecasting

4. **Mobile App**
   - React Native or Flutter mobile app
   - Push notifications for mood reminders
   - Offline mood logging

5. **Social Features**
   - Anonymous mood sharing
   - Community challenges
   - Peer support groups

## 📚 User Guide

### How to Use MoodMash

1. **Choose Your Language**
   - Click the language selector (🌐 icon) in navigation
   - Select from 13 available languages
   - Interface automatically switches to your chosen language
   - Language preference saved for future visits
   - Supported languages:
     - 🇺🇸 English
     - 🇪🇸 Español (Spanish)
     - 🇨🇳 中文 (Chinese)
     - 🇫🇷 Français (French)
     - 🇩🇪 Deutsch (German)
     - 🇮🇹 Italiano (Italian)
     - 🇸🇦 العربية (Arabic) - with RTL support
     - 🇮🇳 हिन्दी (Hindi)
     - 🇧🇩 বাংলা (Bengali)
     - 🇮🇳 தமிழ் (Tamil)
     - 🇯🇵 日本語 (Japanese)
     - 🇰🇷 한국어 (Korean)
     - 🇲🇾 Bahasa Melayu (Malay)

2. **Log Your First Mood**
   - Click "Log Mood" in navigation
   - Select your current emotion
   - Adjust intensity (1-5 scale)
   - Add optional context (weather, sleep, activities)
   - Click "Save Mood"

3. **View Your Dashboard**
   - See mood distribution chart
   - Track intensity trends over time
   - Review personalized insights
   - Browse recent mood entries

4. **Explore Wellness Activities**
   - Click "Activities" in navigation
   - Filter by your current emotion
   - Start recommended activities
   - Track completed activities

5. **Analyze Your Patterns**
   - Dashboard shows 30-day statistics
   - Most common emotion identified
   - Trend analysis (improving/declining/stable)
   - AI-generated insights and recommendations

6. **Use the Chatbot**
   - Click the purple chat icon (bottom right)
   - Ask questions about features, premium, or languages
   - Use quick action buttons
   - Get instant answers in your language

7. **Enable Accessibility Features**
   - Click the green accessibility icon (bottom left)
   - Toggle read aloud (or press Alt+R)
   - Adjust font size (small/normal/large)
   - Enable high contrast mode
   - Use keyboard shortcuts (Tab, Enter, Esc)

8. **Upgrade to Premium**
   - Click "Upgrade to Premium" in onboarding or chatbot
   - Unlock unlimited history, AI insights, and exports
   - Only $4.99/month with 7-day free trial
   - Cancel anytime

## 🔐 Privacy & Security

- All mood data stored in Cloudflare D1 with encryption
- Single-user MVP mode (no multi-user data leakage)
- Future: End-to-end encryption for sensitive data
- Future: GDPR and HIPAA compliance for healthcare integration
- No third-party tracking or analytics (privacy-first)

## 📊 Technology Details

### Backend
- **Hono** - Fast, lightweight web framework
- **TypeScript** - Type-safe development
- **Cloudflare D1** - Serverless SQLite database
- **Wrangler** - Cloudflare CLI tool

### Frontend
- **Vanilla JavaScript** - No framework overhead
- **TailwindCSS** - Utility-first CSS via CDN
- **Chart.js** - Beautiful data visualizations
- **Font Awesome** - Icon library
- **Day.js** - Date manipulation
- **Axios** - HTTP client

### Infrastructure
- **Cloudflare Pages** - Global edge deployment
- **Cloudflare Workers** - Serverless compute
- **PM2** - Process manager for local development
- **Git** - Version control

## 📈 Performance

- **Edge deployment** - Global CDN with <50ms latency
- **Serverless** - Auto-scaling to millions of requests
- **Database** - D1 SQLite with global replication
- **Bundle size** - <50KB compressed JavaScript

## 🤝 Contributing

Future: This project will be open-sourced. Contributions welcome!

## 📄 License

Future: To be determined

## 📞 Support

For questions or feedback, contact the development team.

---

**Built with ❤️ using Hono + Cloudflare Pages**

*Last Updated: 2025-11-22*
