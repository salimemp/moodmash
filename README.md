# 🌈 MoodMash

> Track your mood, understand yourself, grow together.

MoodMash is a comprehensive mood tracking and mental wellness application built with modern web technologies. It features AI-powered insights, voice journaling, social features, gamification, and a supportive AI chatbot companion.

![MoodMash](https://img.shields.io/badge/MoodMash-v1.0.0-purple)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### Core Features
- **Mood Logging** - Track 9 emotions with intensity levels
- **Dashboard** - Beautiful statistics and insights
- **Calendar View** - Visual mood history
- **Dark Mode** - Easy on the eyes

### AI-Powered
- **AI Chatbot "Mood"** - Empathetic AI companion powered by Gemini
- **Voice Journaling** - Record and transcribe voice entries
- **Mood Insights** - AI-generated pattern analysis
- **Text-to-Speech** - Listen to content read aloud

### Social & Gamification
- **Friends** - Connect with others on their mood journey
- **Groups** - Share moods in supportive communities
- **Achievements** - 40+ badges to unlock
- **Leaderboards** - Compete with friends
- **Challenges** - Daily and weekly goals

### Security & Health
- **Two-Factor Auth** - TOTP and email 2FA
- **Health Tracking** - Sleep and activity integration
- **Data Export** - GDPR-compliant data portability
- **Privacy Controls** - Granular sharing settings

### Premium Features
- **Free Tier** - 30 moods/month, 5 friends, basic insights
- **Pro Tier** - Unlimited moods, 50 friends, voice journals, 50 AI messages/month
- **Premium Tier** - Everything unlimited + API access

### Accessibility & Localization
- **5 Languages** - English, Arabic (RTL), Spanish, French, German
- **WCAG AA** - Screen reader support, keyboard navigation
- **Read Aloud** - Text-to-speech for content

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Cloudflare account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/moodmash.git
cd moodmash

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables

```env
# Required
GEMINI_API_KEY=your_gemini_api_key
SESSION_SECRET=your_session_secret

# Optional (for full features)
RESEND_API_KEY=your_resend_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
TURNSTILE_SECRET_KEY=your_turnstile_key
```

## 📚 API Documentation

### Authentication
```http
POST /api/auth/register    # Create account
POST /api/auth/login       # Sign in
POST /api/auth/logout      # Sign out
GET  /api/auth/me          # Current user
```

### Moods
```http
GET  /api/moods            # List moods
POST /api/moods            # Log mood
GET  /api/moods/:id        # Get mood
DELETE /api/moods/:id      # Delete mood
GET  /api/moods/stats      # Get statistics
```

### AI Chatbot
```http
GET  /api/chatbot/conversations       # List conversations
POST /api/chatbot/conversations       # New conversation
GET  /api/chatbot/messages/:convId    # Get messages
POST /api/chatbot/messages            # Send message
```

### Subscription
```http
GET  /api/subscription/tiers          # Get all tiers
GET  /api/subscription/current        # Current subscription
GET  /api/subscription/usage          # Usage stats
POST /api/subscription/check-limit    # Check limit
```

### Voice
```http
POST /api/voice/speech-to-text        # Transcribe audio
POST /api/tts                         # Text-to-speech config
GET  /api/voice/languages             # Supported languages
```

### Localization
```http
GET  /api/translations/languages      # Supported languages
GET  /api/translations/:lang          # Get translations
POST /api/translations/preferences    # Set language preference
```

### Legal
```http
GET  /api/legal/privacy               # Privacy policy
GET  /api/legal/terms                 # Terms of service
GET  /api/legal/cookies               # Cookie policy
POST /api/legal/cookie-consent        # Record consent
```

## 🏗️ Architecture

```
moodmash/
├── src/
│   ├── index.ts           # Application entry point
│   ├── routes/            # API routes
│   │   └── api/           # REST endpoints
│   ├── middleware/        # Auth, rate limiting
│   ├── services/          # Gemini, Resend
│   └── types.ts           # TypeScript types
├── public/
│   └── static/            # Frontend assets
│       ├── i18n/          # Language files
│       └── *.js           # Client scripts
├── migrations/            # D1 database migrations
└── wrangler.toml          # Cloudflare config
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Cloudflare Workers |
| Framework | Hono |
| Language | TypeScript |
| Database | Cloudflare D1 (SQLite) |
| AI | Google Gemini |
| Email | Resend |
| Auth | Custom + OAuth |

## 🌍 Localization

MoodMash supports 5 languages with full translations:

| Language | Code | Direction |
|----------|------|-----------|
| English | `en` | LTR |
| Arabic | `ar` | RTL |
| Spanish | `es` | LTR |
| French | `fr` | LTR |
| German | `de` | LTR |

### Adding a New Language

1. Create translation file: `public/static/i18n/{code}.json`
2. Add to supported languages in `src/routes/api/localization.ts`
3. Add voice support in `src/routes/api/voice.ts`

## ♿ Accessibility

MoodMash follows WCAG 2.1 AA guidelines:

- ✅ Semantic HTML
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ Screen reader support
- ✅ Skip to main content
- ✅ Color contrast (4.5:1+)
- ✅ Focus trap in modals

## 🔒 Security

- **Passwords** - bcrypt hashing
- **Sessions** - Secure HTTP-only cookies
- **2FA** - TOTP + Email verification
- **HTTPS** - Enforced via Cloudflare
- **Rate Limiting** - Per-endpoint limits
- **Bot Protection** - Cloudflare Turnstile
- **Data Encryption** - At rest and in transit

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

```bash
# Deploy to Cloudflare Workers
npm run deploy
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write tests for new features
- Update documentation
- Follow existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file.

## 🙏 Acknowledgments

- [Hono](https://hono.dev/) - Web framework
- [Cloudflare Workers](https://workers.cloudflare.com/) - Edge runtime
- [Google Gemini](https://ai.google.dev/) - AI capabilities
- [Chart.js](https://www.chartjs.org/) - Visualizations

---

Made with 💜 by the MoodMash Team

*Track your mood, understand yourself, grow together.*
