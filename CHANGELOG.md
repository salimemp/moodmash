# Changelog

All notable changes to MoodMash are documented in this file.

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
