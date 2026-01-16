# MoodMash - Minimal Mood Tracking App

A clean, minimal mood tracking application built with Hono, TypeScript, and Cloudflare Workers.

## ✅ What Works (MVP)

### Authentication
- ✅ User registration (email/password)
- ✅ User login with secure sessions
- ✅ Session management (database-backed)
- ✅ Logout functionality
- ✅ Session cookies with proper security settings

### Mood Logging
- ✅ Log mood with emotion selection (9 emotions)
- ✅ Set intensity (1-10 scale)
- ✅ Add optional notes
- ✅ Timestamp tracking
- ✅ View mood history
- ✅ Delete mood entries

### Dashboard
- ✅ Recent moods display
- ✅ Total mood count
- ✅ Average intensity
- ✅ Day streak calculation
- ✅ Emotion distribution chart
- ✅ Quick log button

### Calendar
- ✅ Monthly mood calendar view
- ✅ Color-coded mood indicators
- ✅ Navigate between months
- ✅ Mood legend

### UI/UX
- ✅ Clean, responsive dark mode design
- ✅ Local Tailwind-like CSS (no CDN)
- ✅ Simple, intuitive navigation
- ✅ Mobile-friendly layout

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Language**: TypeScript (strict mode)
- **Database**: D1 (SQLite)
- **Build**: Vite
- **Styling**: Custom CSS (Tailwind-like utilities)

## Project Structure

```
src/
  index.ts          # Main entry point
  types.ts          # TypeScript type definitions
  routes/
    auth.ts         # Login, register, logout routes
    moods.ts        # CRUD operations for moods
    dashboard.ts    # Dashboard and calendar pages
  middleware/
    auth.ts         # Session validation middleware
  lib/
    db.ts           # Database helper functions
public/
  static/
    app.js          # Client-side JavaScript
    styles.css      # CSS styles
migrations/         # Database migrations
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - End session
- `GET /api/auth/me` - Get current user

### Moods
- `GET /api/moods` - List user's moods
- `GET /api/moods/stats` - Get mood statistics
- `POST /api/moods` - Create new mood entry
- `DELETE /api/moods/:id` - Delete mood entry

### Pages
- `/` - Home (redirects to dashboard or login)
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Main dashboard
- `/log` - Log new mood
- `/history` - Mood history
- `/calendar` - Monthly mood calendar

## Development

```bash
# Install dependencies
npm install

# Run database migrations (local)
npm run db:migrate:local

# Build for production
npm run build

# Preview locally
npm run preview

# Deploy to Cloudflare Pages
npm run deploy
```

## Emotions Supported

| Emotion | Emoji | Category |
|---------|-------|----------|
| Happy | 😊 | Positive |
| Calm | 😌 | Positive |
| Peaceful | 🧘 | Positive |
| Energetic | ⚡ | Positive |
| Neutral | 😐 | Neutral |
| Sad | 😢 | Negative |
| Anxious | 😰 | Negative |
| Tired | 😴 | Negative |
| Angry | 😠 | Negative |

## Database Schema

Uses existing migrations with these key tables:
- `users` - User accounts with password hashing
- `sessions` - Session tokens for authentication
- `mood_entries` - Mood logs with emotion, intensity, notes

## Security Features

- Password hashing with bcrypt (10 rounds)
- Secure session cookies (httpOnly, secure, sameSite)
- Database-backed sessions with expiration
- CSRF protection via sameSite cookies

## Bundle Size

- Server bundle: ~61KB
- Client JS: ~8KB
- CSS: ~6KB
- Total: ~75KB (before gzip)

---

Built with ❤️ using Hono + TypeScript + Cloudflare Workers
