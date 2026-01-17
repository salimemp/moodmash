# MoodMash 🎭

A modern mood tracking application built with Cloudflare Workers, Hono, and TypeScript.

## Status

- **Phase 1:** ✅ Complete (Authentication, Mood Logging, Dashboard, Calendar)
- **Phase 2:** ✅ Complete (Voice Journaling, Insights, Export, OAuth, Emails)
- **Phase 3:** ✅ Complete (Social & Community Features)
- **Phase 4:** ✅ Complete (Gamification & Engagement)
- **Phase 5:** ✅ Complete (Enhanced Security & Health Features)

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

### Phase 4: Gamification & Engagement ✅
- **Achievements System**
  - 20+ achievements across 6 categories
  - Automatic unlocking on mood logs
  - Progress tracking with milestones
  - Rarity levels (common, rare, epic, legendary)
  - Achievement notifications with animations

- **Streaks System**
  - Daily mood logging streaks
  - Longest streak tracking
  - Grace day (1-day recovery)
  - Streak bonus points at milestones
  - Streak leaderboard

- **Challenges System**
  - Daily, weekly, monthly challenges
  - Auto-join and progress tracking
  - Challenge completion rewards
  - Challenge history

- **Points & Levels**
  - Points for all activities
  - Level progression (Bronze → Diamond)
  - Weekly/monthly point tracking
  - Transaction history

- **Badges System**
  - Level badges, achievement badges, special badges
  - Showcase up to 5 badges on profile
  - Automatic badge earning

- **Leaderboards**
  - Global leaderboard (all-time, weekly, monthly)
  - Friends leaderboard
  - Group leaderboards
  - Streak leaderboard
  - Privacy controls (opt-in/out)

### Phase 5: Enhanced Security & Health Features ✅
- **Two-Factor Authentication (TOTP)**
  - Setup with QR code for authenticator apps
  - Google Authenticator, Authy compatible
  - 6-digit code verification
  - Enable/disable 2FA

- **Backup Codes**
  - 10 one-time recovery codes
  - Secure hashed storage
  - Download/print codes
  - Regenerate codes

- **Email 2FA**
  - 6-digit codes via email
  - 10-minute expiry
  - Alternative to TOTP

- **Security Dashboard**
  - Security score calculation
  - 2FA status overview
  - Active sessions list
  - Login history (30 days)
  - Security events log
  - Remote session termination

- **Wearables Integration (Mock Data)**
  - Connect Fitbit, Apple Watch, Garmin, Samsung, Xiaomi (UI demo)
  - Activity data: steps, heart rate, calories, active minutes
  - Weekly activity trends chart
  - Mood-activity correlation analysis

- **Sleep Tracking (Mock Data)**
  - Sleep quality score (0-100)
  - Sleep stages: deep, light, REM, awake
  - Duration tracking
  - Weekly sleep pattern chart
  - Sleep-mood correlation

- **Health Insights (Mock Data)**
  - Overall wellness score (0-100)
  - Component scores: activity, sleep, mood, stress
  - Personalized recommendations
  - Health trends dashboard

- **2D Mood Visualizations**
  - Mood heatmap (calendar view with colors)
  - Emotion radar/spider chart
  - Mood journey timeline
  - Emotion wheel visualization

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

### Gamification (Phase 4)

#### Achievements
- `GET /api/achievements` - List all achievement definitions
- `GET /api/achievements/user` - Get user's achievement progress
- `GET /api/achievements/:id/progress` - Get specific achievement progress
- `GET /api/achievements/new` - Get newly unlocked achievements

#### Streaks
- `GET /api/streaks` - Get user's streak info
- `GET /api/streaks/leaderboard` - Get streak leaderboard

#### Challenges
- `GET /api/challenges` - List all challenges
- `GET /api/challenges/active` - Get active challenges
- `POST /api/challenges/:id/join` - Join a challenge
- `GET /api/challenges/:id/progress` - Get challenge progress
- `GET /api/challenges/history` - Get completed challenges

#### Points & Levels
- `GET /api/points` - Get user points and level
- `POST /api/points/visibility` - Toggle leaderboard visibility

#### Badges
- `GET /api/badges` - Get all badges with user status
- `GET /api/badges/user` - Get user's earned badges
- `POST /api/badges/showcase` - Update badge showcase

#### Leaderboards
- `GET /api/leaderboard/global` - Global points leaderboard
- `GET /api/leaderboard/friends` - Friends leaderboard
- `GET /api/leaderboard/group/:id` - Group leaderboard

#### Stats (Dashboard Widget)
- `GET /api/gamification/stats` - Get gamification summary

### Security (Phase 5)

#### 2FA - TOTP
- `POST /api/security/2fa/totp/setup` - Generate TOTP secret and QR code
- `POST /api/security/2fa/totp/verify` - Verify 6-digit code
- `POST /api/security/2fa/totp/enable` - Enable TOTP 2FA
- `POST /api/security/2fa/totp/disable` - Disable TOTP 2FA
- `GET /api/security/2fa/status` - Get 2FA status

#### Backup Codes
- `GET /api/security/2fa/backup-codes` - Get remaining codes count
- `POST /api/security/2fa/backup-codes/regenerate` - Regenerate codes
- `POST /api/security/2fa/backup-codes/verify` - Verify backup code

#### Email 2FA
- `POST /api/security/2fa/email/send` - Send verification code
- `POST /api/security/2fa/email/verify` - Verify email code
- `POST /api/security/2fa/email/enable` - Enable email 2FA

#### Sessions
- `GET /api/security/sessions` - List active sessions
- `DELETE /api/security/sessions/:id` - Terminate session
- `POST /api/security/sessions/terminate-all` - Terminate all other sessions

#### Security Dashboard
- `GET /api/security/dashboard` - Security overview
- `GET /api/security/login-history` - Login history (30 days)
- `GET /api/security/events` - Security events log

### Health & Wearables (Phase 5)

#### Wearables
- `GET /api/wearables` - List available wearables
- `POST /api/wearables/connect` - Connect wearable (mock)
- `DELETE /api/wearables/disconnect` - Disconnect wearable
- `GET /api/wearables/data` - Get activity data
- `GET /api/wearables/correlations` - Mood-activity correlations

#### Sleep
- `GET /api/sleep/data` - Get sleep data
- `GET /api/sleep/trends` - Get sleep trends

#### Health Insights
- `GET /api/health/metrics` - Get health metrics
- `GET /api/health/insights` - Get personalized insights
- `GET /api/health/wellness-score` - Get overall wellness score
- `GET /api/health/mood-heatmap` - Get mood calendar heatmap
- `GET /api/health/mood-radar` - Get emotion distribution radar

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
│   │       ├── password.ts
│   │       ├── friends.ts       # Phase 3
│   │       ├── groups.ts        # Phase 3
│   │       ├── social.ts        # Phase 3
│   │       ├── gamification.ts  # Phase 4
│   │       ├── security.ts      # Phase 5
│   │       └── health.ts        # Phase 5
│   └── services/
│       ├── gemini.ts     # Gemini AI service
│       └── resend.ts     # Email service
├── public/
│   └── static/
│       ├── styles.css
│       ├── app.js
│       ├── voice-journal.js
│       ├── insights.js
│       ├── achievements.js      # Phase 4
│       ├── challenges.js        # Phase 4
│       ├── leaderboard.js       # Phase 4
│       ├── gamification-widget.js
│       ├── security.js          # Phase 5
│       ├── 2fa-setup.js         # Phase 5
│       ├── wearables.js         # Phase 5
│       ├── sleep.js             # Phase 5
│       ├── health-insights.js   # Phase 5
│       └── visualizations.js    # Phase 5
├── migrations/
│   ├── 0001_initial_schema.sql
│   ├── 0002_phase2_features.sql
│   ├── 0020_phase3_social.sql
│   ├── 0021_phase4_gamification.sql
│   └── 0022_phase5_security_health.sql
└── TODO.md               # Feature roadmap
```

## Roadmap

See [TODO.md](./TODO.md) for the complete feature roadmap.

## License

MIT
