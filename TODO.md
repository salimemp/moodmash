# MoodMash Feature Roadmap

**Last Updated:** 2026-01-17  
**Current Branch:** rebuild-clean  
**Status:** Phase 1-4 Complete

---

## Phase 1: Core MVP ✅ COMPLETE

### 1.1 Authentication System ✅
| Feature | Description | Dependencies | Effort | Priority |
|---------|-------------|--------------|--------|----------|
| Email/Password Registration | Create account with email and password | bcryptjs | Done | P0 |
| Email/Password Login | Session-based authentication | Sessions table | Done | P0 |
| Session Management | 7-day sessions with secure tokens | D1 Database | Done | P0 |
| Logout | Clear session and cookies | Sessions table | Done | P0 |
| Protected Routes | Middleware for auth-required pages | auth.ts | Done | P0 |

### 1.2 Mood Tracking ✅
| Feature | Description | Dependencies | Effort | Priority |
|---------|-------------|--------------|--------|----------|
| Log Mood | Record emotion + intensity (1-5) | mood_entries table | Done | P0 |
| Add Notes | Optional notes for context | mood_entries table | Done | P0 |
| View History | List past mood entries | API endpoint | Done | P0 |
| Delete Entry | Remove mood entries | API endpoint | Done | P0 |

### 1.3 Dashboard ✅
| Feature | Description | Dependencies | Effort | Priority |
|---------|-------------|--------------|--------|----------|
| Mood Overview | Recent moods summary | getMoodStats | Done | P0 |
| Quick Stats | Total entries, avg intensity | API | Done | P0 |
| Emotion Distribution | Count by emotion type | API | Done | P0 |

### 1.4 Calendar View ✅
| Feature | Description | Dependencies | Effort | Priority |
|---------|-------------|--------------|--------|----------|
| Monthly Calendar | Visual mood calendar | mood-calendar.js | Done | P0 |
| Date Navigation | Previous/next month | UI | Done | P0 |
| Mood Indicators | Color-coded day cells | CSS | Done | P0 |

---

## Phase 2: Enhanced Features ✅ COMPLETE

### 2.1 Voice Journaling ✅
| Feature | Description | Dependencies | Effort | Priority |
|---------|-------------|--------------|--------|----------|
| Voice Recording | Record audio journals | Web Audio API | 4h | P1 |
| Audio Storage | Store audio in R2/base64 | Cloudflare R2 | 2h | P1 |
| Audio Playback | Play back recordings | HTML5 Audio | 1h | P1 |
| Transcription | Convert speech to text | Gemini API | 3h | P2 |
| Link to Moods | Associate voice with mood | Database | 1h | P1 |

### 2.2 Mood Insights & Analytics ✅
| Feature | Description | Dependencies | Effort | Priority |
|---------|-------------|--------------|--------|----------|
| Mood Trends | Weekly/monthly trends graph | Chart.js | 3h | P1 |
| Emotion Patterns | Identify recurring patterns | Analytics logic | 2h | P1 |
| Weekly Summary | Email/dashboard summary | Aggregation | 2h | P1 |
| AI Insights | Gemini-powered suggestions | Gemini API | 4h | P2 |
| Correlations | Mood vs time/day patterns | Statistics | 2h | P2 |

### 2.3 Data Export ✅
| Feature | Description | Dependencies | Effort | Priority |
|---------|-------------|--------------|--------|----------|
| Export to JSON | Download moods as JSON | API endpoint | 1h | P1 |
| Export to CSV | Download moods as CSV | API endpoint | 1h | P1 |
| Export Voice | Download voice journals | API endpoint | 2h | P2 |
| GDPR Compliant | Full data download | Privacy API | 2h | P1 |

### 2.4 OAuth Integration ✅
| Feature | Description | Dependencies | Effort | Priority |
|---------|-------------|--------------|--------|----------|
| Google OAuth | Sign in with Google | OAuth2 | 3h | P1 |
| GitHub OAuth | Sign in with GitHub | OAuth2 | 2h | P1 |
| Account Linking | Link social accounts | Database | 2h | P2 |
| OAuth Callbacks | Handle OAuth redirects | Routes | 2h | P1 |

### 2.5 Transactional Emails ✅
| Feature | Description | Dependencies | Effort | Priority |
|---------|-------------|--------------|--------|----------|
| Welcome Email | Email on registration | Resend API | 2h | P1 |
| Password Reset | Reset password via email | Resend API | 3h | P1 |
| Weekly Summary | Mood summary email | Resend API | 3h | P2 |
| Account Alerts | Important notifications | Resend API | 1h | P2 |

---

## Phase 3: Social & Community Features ✅ COMPLETE

### 3.1 Friends System ✅
| Feature | Description | Status |
|---------|-------------|--------|
| Send Friend Requests | POST /api/friends/request | Done |
| Accept/Decline Requests | POST /api/friends/accept/:id, decline/:id | Done |
| View Friends List | GET /api/friends | Done |
| Remove Friends | DELETE /api/friends/:id | Done |
| Search Users | GET /api/friends/search | Done |
| Friend Suggestions | GET /api/friends/suggestions | Done |
| Privacy Settings | PUT /api/users/privacy | Done |

### 3.2 Groups ✅
| Feature | Description | Status |
|---------|-------------|--------|
| Create Support Groups | POST /api/groups | Done |
| Join/Leave Groups | POST /api/groups/:id/join, leave | Done |
| Group Chat/Posts | POST /api/groups/:id/posts | Done |
| Share Moods in Groups | Include mood in posts | Done |
| Group Mood Trends | GET /api/groups/:id/trends | Done |
| Group Admin Controls | PUT /api/groups/:id, members | Done |
| Private/Public Groups | Privacy settings | Done |

### 3.3 Sharing ✅
| Feature | Description | Status |
|---------|-------------|--------|
| Share Mood Entries | POST /api/share/mood/:id | Done |
| Share Mood Insights | Via shared moods | Done |
| Privacy Controls | public/friends/private | Done |

### 3.4 Activity Feed ✅
| Feature | Description | Status |
|---------|-------------|--------|
| View Friends' Activities | GET /api/feed | Done |
| See Shared Moods | Feed includes shared moods | Done |
| Group Activities | Feed includes group posts | Done |
| Activity Notifications | GET /api/activities | Done |
| Like/React to Posts | POST /api/reactions | Done |
| Comment on Posts | POST /api/comments | Done |
| Activity Filters | Filter by all/friends/groups | Done |

### 3.5 Frontend Pages ✅
| Page | Route | Status |
|------|-------|--------|
| Friends Page | /friends | Done |
| Groups Page | /groups | Done |
| Group Detail | /groups/:id | Done |
| Activity Feed | /feed | Done |
| User Profile | /profile | Done |
| Public Profile View | /users/:id | Done |

### 3.2 AI Chat Companion
| Feature | Description | Dependencies | Effort | Priority |
|---------|-------------|--------------|--------|----------|
| Chat Interface | Conversational UI | chat.js | 4h | P2 |
| Gemini Integration | AI-powered responses | Gemini API | 4h | P2 |
| Context Memory | Remember past conversations | Database | 3h | P2 |
| Wellness Tips | Mood-based suggestions | AI + DB | 3h | P2 |
| Crisis Detection | Flag concerning patterns | AI + Alerts | 4h | P1 |

### 3.3 Social Feed
| Feature | Description | Dependencies | Effort | Priority |
|---------|-------------|--------------|--------|----------|
| Activity Feed | See friends' shared moods | social-feed.js | 4h | P2 |
| Reactions | React to shared moods | reactions table | 2h | P3 |
| Comments | Comment on shared moods | comments table | 3h | P3 |

---

## Phase 4: Gamification & Engagement ✅ COMPLETE

### 4.1 Achievements System ✅
| Feature | Description | Status |
|---------|-------------|--------|
| Achievement Definitions | 20+ achievements across 6 categories | Done |
| Automatic Achievement Awarding | Auto-check and award on mood log | Done |
| Achievement Progress Tracking | Track progress toward completion | Done |
| Achievement Categories | milestone, streak, social, exploration, voice, engagement | Done |
| Rarity Levels | common, rare, epic, legendary | Done |
| Achievement Notifications | Show unlock notifications | Done |
| API Endpoints | GET /api/achievements, /api/achievements/user, /api/achievements/:id/progress | Done |

### 4.2 Streaks System ✅
| Feature | Description | Status |
|---------|-------------|--------|
| Daily Mood Logging Streak | Track consecutive days | Done |
| Longest Streak Record | Remember best streak | Done |
| Grace Day (1-day recovery) | Miss one day without losing streak | Done |
| Streak Leaderboard | GET /api/streaks/leaderboard | Done |
| Streak Bonus Points | Extra points at 7, 30, 100 days | Done |
| API Endpoints | GET /api/streaks | Done |

### 4.3 Challenges System ✅
| Feature | Description | Status |
|---------|-------------|--------|
| Daily Challenges | Daily Check-in | Done |
| Weekly Challenges | Weekly Wellness, Voice Week, Social Week | Done |
| Monthly Challenges | Monthly Marathon | Done |
| Challenge Joining | POST /api/challenges/:id/join | Done |
| Progress Tracking | Auto-update progress on actions | Done |
| Challenge History | GET /api/challenges/history | Done |
| API Endpoints | GET /api/challenges, /api/challenges/active, /api/challenges/:id/progress | Done |

### 4.4 Points & Levels System ✅
| Feature | Description | Status |
|---------|-------------|--------|
| Points for Activities | 5 pts mood, 10 pts voice, 3 pts share | Done |
| Level System | Bronze → Silver → Gold → Platinum → Diamond | Done |
| Weekly/Monthly Points | Track points by time period | Done |
| Point Transactions | Full history of points earned | Done |
| Leaderboard Opt-out | Privacy control | Done |
| API Endpoints | GET /api/points, POST /api/points/visibility | Done |

### 4.5 Badges System ✅
| Feature | Description | Status |
|---------|-------------|--------|
| Badge Definitions | Level badges, achievement badges, special badges | Done |
| Badge Earning | Automatic on level-up and achievements | Done |
| Badge Showcase | Select up to 5 badges to display | Done |
| API Endpoints | GET /api/badges, /api/badges/user, POST /api/badges/showcase | Done |

### 4.6 Leaderboards ✅
| Feature | Description | Status |
|---------|-------------|--------|
| Global Leaderboard | All-time, weekly, monthly | Done |
| Friends Leaderboard | Compete with friends | Done |
| Group Leaderboards | GET /api/leaderboard/group/:id | Done |
| Streak Leaderboard | Top streakers | Done |
| Privacy Controls | Opt-in/out of public rankings | Done |
| API Endpoints | GET /api/leaderboard/global, /api/leaderboard/friends | Done |

### 4.7 Frontend Pages ✅
| Page | Route | Status |
|------|-------|--------|
| Achievements Page | /achievements | Done |
| Challenges Page | /challenges | Done |
| Leaderboard Page | /leaderboard | Done |
| Dashboard Widget | Points/Level/Streak display | Done |
| Unlock Animations | CSS animations for achievements | Done |

---

## Phase 5: Future Features ⏳ PLANNED

### 5.1 Biometric Integration
| Feature | Description | Dependencies | Effort | Priority |
|---------|-------------|--------------|--------|----------|
| Health APIs | Apple Health, Google Fit | OAuth | 8h | P3 |
| Sleep Data | Import sleep metrics | Health API | 4h | P3 |
| Heart Rate | Heart rate correlation | Health API | 4h | P3 |
| Activity Data | Steps, exercise data | Health API | 4h | P3 |
| Mood Correlation | Correlate health & mood | Analytics | 4h | P3 |

### 5.2 AR/XR Features (Experimental)
| Feature | Description | Dependencies | Effort | Priority |
|---------|-------------|--------------|--------|----------|
| 3D Mood Avatars | Visual mood representation | Three.js | 8h | P4 |
| AR Mood Cards | Printable AR markers | AR.js | 8h | P4 |
| AR Dashboard | Immersive experience | WebXR | 12h | P4 |

## Phase 6: Premium & Enterprise ⏳ PLANNED

### 5.1 Premium Features
| Feature | Description | Dependencies | Effort | Priority |
|---------|-------------|--------------|--------|----------|
| Subscription System | Stripe integration | Stripe API | 8h | P3 |
| Premium Insights | Advanced analytics | Analytics | 6h | P3 |
| Unlimited History | Remove entry limits | Database | 1h | P3 |
| Priority Support | Premium support channel | Support system | 4h | P3 |
| Custom Themes | Personalized UI themes | CSS/DB | 4h | P4 |

### 5.2 Localization
| Feature | Description | Dependencies | Effort | Priority |
|---------|-------------|--------------|--------|----------|
| Multi-language | Support 10+ languages | i18n system | 12h | P3 |
| Currency Support | Multiple currencies | Localization | 2h | P3 |
| Date Formats | Locale-aware dates | i18n | 2h | P3 |
| RTL Support | Arabic, Hebrew layout | CSS/HTML | 4h | P3 |

### 5.3 Compliance
| Feature | Description | Dependencies | Effort | Priority |
|---------|-------------|--------------|--------|----------|
| GDPR Tools | Data deletion requests | Privacy API | 4h | P2 |
| CCPA Compliance | California privacy | Privacy API | 4h | P2 |
| HIPAA Foundation | Healthcare compliance | Security audit | 8h | P3 |
| Audit Logs | Security event logging | Logging system | 4h | P2 |

---

## Phase 6: PWA & Mobile ⏳ PLANNED

### 6.1 Progressive Web App
| Feature | Description | Dependencies | Effort | Priority |
|---------|-------------|--------------|--------|----------|
| Service Worker | Offline support | sw.js | 4h | P2 |
| App Manifest | Installable PWA | manifest.json | 1h | P2 |
| Push Notifications | Browser notifications | Push API | 6h | P2 |
| Background Sync | Sync when online | Service Worker | 4h | P3 |

### 6.2 Mobile Optimization
| Feature | Description | Dependencies | Effort | Priority |
|---------|-------------|--------------|--------|----------|
| Responsive UI | Mobile-first design | CSS | 4h | P1 |
| Touch Gestures | Swipe interactions | touch-gestures.js | 3h | P2 |
| Bottom Navigation | Mobile nav bar | UI | 2h | P2 |
| Quick Actions | Home screen shortcuts | PWA | 2h | P3 |

---

## Technical Debt & Improvements

### Completed ✅
- [x] TypeScript strict mode
- [x] Basic error handling
- [x] Session management
- [x] Database schema

### Pending ⏳
- [ ] Comprehensive test suite
- [ ] Rate limiting per route
- [ ] Request validation (Zod)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Database migrations system
- [ ] API documentation

---

## Environment Variables Needed

### Phase 2 Requirements
```env
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# OAuth - Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-domain/api/auth/google/callback

# OAuth - GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=https://your-domain/api/auth/github/callback

# Transactional Emails
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@your-domain.com

# Storage (for voice journals)
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=moodmash-audio
```

---

## Summary

| Phase | Status | Features | Est. Effort |
|-------|--------|----------|-------------|
| Phase 1 | ✅ Complete | Auth, Mood, Dashboard, Calendar | Done |
| Phase 2 | 🚧 In Progress | Voice, Insights, Export, OAuth, Email | ~40h |
| Phase 3 | ⏳ Planned | Social, AI Chat, Feed | ~50h |
| Phase 4 | ⏳ Planned | Biometrics, Gamification, AR | ~60h |
| Phase 5 | ⏳ Planned | Premium, Localization, Compliance | ~40h |
| Phase 6 | ⏳ Planned | PWA, Mobile | ~25h |

**Total Estimated Remaining:** ~215 hours
