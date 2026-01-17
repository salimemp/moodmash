# MoodMash 🎭

A modern mood tracking application built with Cloudflare Workers, Hono, and TypeScript.

## Status

- **Phase 1:** ✅ Complete (Authentication, Mood Logging, Dashboard, Calendar)
- **Phase 2:** ✅ Complete (Voice Journaling, Insights, Export, OAuth, Emails)
- **Phase 3:** ✅ Complete (Social & Community Features)
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

### Phase 3: Social & Community Features ✅
- **Friends System**
  - Send/accept/decline friend requests
  - View friends list
  - Remove friends
  - Search for users
  - Friend suggestions based on mutual connections
  - Privacy settings for profiles and moods

- **Groups**
  - Create support groups (public/private)
  - Join/leave groups
  - Post in groups
  - Share moods in groups
  - Group mood trends
  - Admin controls (roles, member management)

- **Sharing**
  - Share mood entries with friends
  - Privacy controls (public/friends/private)
  - Captions for shared moods

- **Activity Feed**
  - View friends' activities
  - See shared moods and group posts
  - Notifications for social actions
  - Like/react to posts (like, love, support, hug, celebrate)
  - Comment on posts
  - Activity filters

- **User Profiles**
  - Edit profile (display name, bio, location)
  - Privacy settings
  - View other users' profiles
  - Recent shared moods

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

### Friends (Phase 3)
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/accept/:id` - Accept friend request
- `POST /api/friends/decline/:id` - Decline friend request
- `DELETE /api/friends/:id` - Remove friend
- `GET /api/friends` - Get friends list
- `GET /api/friends/suggestions` - Get friend suggestions
- `GET /api/friends/search` - Search for users
- `GET /api/users/:id/profile` - Get user profile
- `PUT /api/users/profile` - Update own profile
- `PUT /api/users/privacy` - Update privacy settings

### Groups (Phase 3)
- `POST /api/groups` - Create group
- `GET /api/groups` - List groups
- `GET /api/groups/:id` - Get group details
- `PUT /api/groups/:id` - Update group (admin)
- `DELETE /api/groups/:id` - Delete group (admin)
- `POST /api/groups/:id/join` - Join group
- `POST /api/groups/:id/leave` - Leave group
- `GET /api/groups/:id/posts` - Get group posts
- `POST /api/groups/:id/posts` - Create group post
- `GET /api/groups/:id/members` - Get group members
- `PUT /api/groups/:id/members/:userId` - Update member role (admin)
- `DELETE /api/groups/:id/members/:userId` - Remove member (admin)
- `GET /api/groups/:id/trends` - Get group mood trends

### Social (Phase 3)
- `POST /api/share/mood/:id` - Share mood entry
- `GET /api/feed` - Get activity feed
- `GET /api/activities` - Get notifications
- `POST /api/activities/read` - Mark activities as read
- `POST /api/reactions` - Add/toggle reaction
- `POST /api/comments` - Add comment
- `GET /api/comments` - Get comments
- `DELETE /api/comments/:id` - Delete comment
- `GET /api/shared-moods/:id` - Get shared mood details
- `DELETE /api/shared-moods/:id` - Delete shared mood

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
