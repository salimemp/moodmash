# MoodMash 🎭

A modern mood tracking application built with Cloudflare Workers, Hono, and TypeScript.

## Status

- **Phase 1:** ✅ Complete (Authentication, Mood Logging, Dashboard, Calendar)
- **Phase 2:** ✅ Complete (Voice Journaling, Insights, Export, OAuth, Emails)
- **Phase 3:** 🚧 Planned (Social Features, AI Chat)
- **Phase 4:** 🚧 Planned (Advanced Features)

## Features

### Phase 1: Core MVP ✅
- **Authentication**
  - Email/password registration and login
  - Session management with secure cookies
  - Protected routes

- **Mood Tracking**
  - Log moods with emotion and intensity (1-5)
  - Add notes to entries
  - View mood history
  - Delete entries

- **Dashboard**
  - Mood overview and statistics
  - Emotion distribution
  - Quick stats

- **Calendar View**
  - Monthly mood calendar
  - Color-coded day cells
  - Date navigation

### Phase 2: Enhanced Features ✅
- **Voice Journaling**
  - Record audio journals using Web Audio API
  - Speech-to-text transcription
  - AI emotion analysis (Gemini)
  - Link voice entries to moods

- **Mood Insights & Analytics**
  - Weekly/monthly mood trends
  - Emotion distribution charts
  - AI-powered insights (Gemini)
  - Time-of-day correlations

- **Data Export**
  - Export moods as JSON
  - Export moods as CSV
  - GDPR-compliant full data export
  - Data deletion (right to be forgotten)

- **OAuth Integration**
  - Google OAuth login
  - GitHub OAuth login
  - Account linking

- **Transactional Emails (Resend)**
  - Welcome emails on registration
  - Password reset emails
  - Weekly mood summaries

## Tech Stack

- **Runtime:** Cloudflare Workers
- **Framework:** Hono
- **Database:** Cloudflare D1 (SQLite)
- **Language:** TypeScript (strict mode)
- **AI:** Google Gemini API
- **Email:** Resend
- **Storage:** Cloudflare R2 (for audio)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/github` - GitHub OAuth

### Moods
- `POST /api/moods` - Create mood entry
- `GET /api/moods` - List mood history
- `DELETE /api/moods/:id` - Delete entry
- `GET /api/moods/stats` - Get mood statistics

### Voice Journals
- `GET /api/voice-journals` - List voice journals
- `POST /api/voice-journals` - Create voice journal
- `GET /api/voice-journals/:id` - Get voice journal
- `PUT /api/voice-journals/:id` - Update voice journal
- `DELETE /api/voice-journals/:id` - Delete voice journal
- `POST /api/voice-journals/:id/analyze` - AI analysis

### Insights
- `GET /api/insights` - Get mood analytics
- `GET /api/insights/trends` - Get weekly trends
- `GET /api/insights/emotions` - Get emotion distribution
- `GET /api/insights/correlations` - Get time correlations

### Export
- `GET /api/export/json` - Export as JSON
- `GET /api/export/csv` - Export as CSV
- `GET /api/export/full` - GDPR full export
- `DELETE /api/export/delete-all` - Delete all data

## Environment Variables

```env
# Required
DB=D1 database binding

# Gemini AI (optional)
GEMINI_API_KEY=your_gemini_api_key

# OAuth - Google (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-domain/api/auth/google/callback

# OAuth - GitHub (optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=https://your-domain/api/auth/github/callback

# Email - Resend (optional)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@your-domain.com
APP_URL=https://your-domain.com

# Storage (optional)
R2_BUCKET=R2 bucket binding for audio storage
```

## Development

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build
npm run build

# Deploy
npm run deploy
```

## Database Migrations

```bash
# Apply migrations
wrangler d1 migrations apply moodmash-db

# List migrations
wrangler d1 migrations list moodmash-db
```

## Project Structure

```
moodmash/
├── src/
│   ├── index.ts          # App entry point
│   ├── types.ts          # TypeScript types
│   ├── lib/
│   │   └── db.ts         # Database helpers
│   ├── middleware/
│   │   └── auth.ts       # Auth middleware
│   ├── routes/
│   │   ├── auth.ts       # Auth routes
│   │   ├── moods.ts      # Mood routes
│   │   ├── dashboard.ts  # Dashboard routes
│   │   └── api/
│   │       ├── voice-journals.ts
│   │       ├── insights.ts
│   │       ├── export.ts
│   │       ├── oauth.ts
│   │       └── password.ts
│   └── services/
│       ├── gemini.ts     # Gemini AI service
│       └── resend.ts     # Email service
├── public/
│   └── static/
│       ├── styles.css
│       ├── app.js
│       ├── voice-journal.js
│       └── insights.js
├── migrations/
│   ├── 0001_initial_schema.sql
│   └── 0002_phase2_features.sql
└── TODO.md               # Feature roadmap
```

## Roadmap

See [TODO.md](./TODO.md) for the complete feature roadmap.

## License

MIT
