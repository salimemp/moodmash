# Cloudflare Deployment Requirements

This document outlines all requirements for deploying MoodMash to Cloudflare Workers with automated CI/CD.

## Quick Start Checklist

- [ ] Cloudflare account with Workers and R2 enabled
- [ ] GitHub repository secrets configured
- [ ] D1 database created
- [ ] R2 buckets created
- [ ] OAuth credentials configured
- [ ] Environment variables set

---

## 1. Cloudflare Account Information

### Required from Cloudflare Dashboard

| Item | Where to Find | How to Set |
|------|--------------|------------|
| **Account ID** | Cloudflare Dashboard → Overview → Account ID | GitHub Secret: `CLOUDFLARE_ACCOUNT_ID` |
| **API Token** | Cloudflare Dashboard → Profile → API Tokens → Create Token | GitHub Secret: `CLOUDFLARE_API_TOKEN` |
| **Zone ID** | Cloudflare Dashboard → Your Domain → Overview → Zone ID | For custom domain routing |

### Creating an API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click your profile icon → **My Profile** → **API Tokens**
3. Click **Create Token**
4. Use the **Edit Cloudflare Workers** template, OR create custom with:
   - **Account** → Workers Scripts → Edit
   - **Account** → Workers KV Storage → Edit
   - **Account** → D1 → Edit
   - **Account** → Workers R2 Storage → Edit
   - **Account** → Cloudflare Pages → Edit
   - **Zone** → Workers Routes → Edit
5. Copy the token and save it securely

---

## 2. GitHub Repository Secrets

### Required Secrets

Go to: `https://github.com/YOUR_USERNAME/moodmash/settings/secrets/actions`

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers permissions | ✅ Yes |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | ✅ Yes |

### Setting GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its name and value

---

## 3. D1 Database Setup

### Create Production Database

```bash
# Create the database
npx wrangler d1 create moodmash

# You'll receive a database_id - update wrangler.jsonc with this ID
```

### Create Staging Database (Optional)

```bash
npx wrangler d1 create moodmash-staging
```

### Run Migrations

```bash
# Apply all migrations to production
npx wrangler d1 migrations apply moodmash --remote

# Or run specific migration file
npx wrangler d1 execute moodmash --remote --file=./migrations/0001_initial.sql
```

### Update wrangler.jsonc

Replace the `database_id` in `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "moodmash",
    "database_id": "YOUR_ACTUAL_DATABASE_ID"  // <-- Replace this
  }
]
```

---

## 4. R2 Storage Setup

### Create R2 Buckets

```bash
# Production buckets
npx wrangler r2 bucket create moodmash-assets
npx wrangler r2 bucket create moodmash-user-uploads
npx wrangler r2 bucket create moodmash-backups

# Staging buckets (optional)
npx wrangler r2 bucket create moodmash-assets-staging
npx wrangler r2 bucket create moodmash-user-uploads-staging
npx wrangler r2 bucket create moodmash-backups-staging
```

### R2 Bucket Use Cases

| Bucket | Binding | Purpose |
|--------|---------|----------|
| `moodmash-assets` | `ASSETS` | Static assets, meditation audio, yoga videos |
| `moodmash-user-uploads` | `USER_UPLOADS` | User profile pictures, voice recordings |
| `moodmash-backups` | `BACKUPS` | Database backups, user data exports |

### Configure Public Access (Optional)

For public assets, enable public access in Cloudflare Dashboard:

1. Go to **R2** → **moodmash-assets** → **Settings**
2. Enable **Public access**
3. Note the public URL: `https://pub-XXXX.r2.dev`

---

## 5. Environment Variables (Secrets)

### Required Environment Variables

Set these as secrets in Cloudflare Dashboard or via CLI:

```bash
# Core functionality
npx wrangler secret put GEMINI_API_KEY --project-name moodmash
npx wrangler secret put RESEND_API_KEY --project-name moodmash
npx wrangler secret put FROM_EMAIL --project-name moodmash

# Bot protection
npx wrangler secret put TURNSTILE_SECRET_KEY --project-name moodmash

# OAuth - Google
npx wrangler secret put GOOGLE_CLIENT_ID --project-name moodmash
npx wrangler secret put GOOGLE_CLIENT_SECRET --project-name moodmash
npx wrangler secret put GOOGLE_REDIRECT_URI --project-name moodmash

# OAuth - GitHub
npx wrangler secret put GITHUB_CLIENT_ID --project-name moodmash
npx wrangler secret put GITHUB_CLIENT_SECRET --project-name moodmash
npx wrangler secret put GITHUB_REDIRECT_URI --project-name moodmash

# App configuration
npx wrangler secret put APP_URL --project-name moodmash

# Error tracking (optional)
npx wrangler secret put SENTRY_DSN --project-name moodmash
```

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google AI Gemini API key | `AIza...` |
| `RESEND_API_KEY` | Resend email service API key | `re_...` |
| `FROM_EMAIL` | Sender email address | `noreply@moodmash.win` |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret | `0x...` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-...` |
| `GOOGLE_REDIRECT_URI` | Google OAuth callback URL | `https://moodmash.win/api/auth/google/callback` |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | `Iv1.xxx` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | `xxx` |
| `GITHUB_REDIRECT_URI` | GitHub OAuth callback URL | `https://moodmash.win/api/auth/github/callback` |
| `APP_URL` | Application base URL | `https://moodmash.win` |
| `SENTRY_DSN` | Sentry error tracking DSN | `https://xxx@xxx.ingest.sentry.io/xxx` |

---

## 6. OAuth Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure:
   - Application type: **Web application**
   - Authorized JavaScript origins: `https://moodmash.win`
   - Authorized redirect URIs: `https://moodmash.win/api/auth/google/callback`
6. Copy Client ID and Client Secret

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Configure:
   - Application name: `MoodMash`
   - Homepage URL: `https://moodmash.win`
   - Authorization callback URL: `https://moodmash.win/api/auth/github/callback`
4. Copy Client ID and generate Client Secret

### Cloudflare Turnstile Setup

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Turnstile**
2. Click **Add site**
3. Configure:
   - Site name: `MoodMash`
   - Domain: `moodmash.win`
   - Widget type: **Managed**
4. Copy Site Key (for frontend) and Secret Key (for backend)

---

## 7. Custom Domain Configuration

### DNS Configuration

1. In Cloudflare Dashboard, go to your domain's DNS settings
2. Add CNAME record:
   - Name: `@` (or `www`)
   - Target: `moodmash.pages.dev`
   - Proxy: Enabled (orange cloud)

### Workers Routes (Alternative)

If using Workers instead of Pages:

```bash
npx wrangler deploy
```

Then configure routes in Cloudflare Dashboard → Workers → Routes.

---

## 8. Deployment Commands

### Manual Deployment

```bash
# Build and deploy to production
npm run build
npx wrangler pages deploy dist --project-name=moodmash

# Deploy to staging
npx wrangler pages deploy dist --project-name=moodmash-staging
```

### Automated Deployment

Push to `main` branch triggers automatic deployment via GitHub Actions.

```bash
git push origin main
```

### Database Migrations

```bash
# Create new migration
npx wrangler d1 migrations create moodmash "description"

# Apply migrations
npx wrangler d1 migrations apply moodmash --remote
```

---

## 9. Verification Checklist

### After Initial Setup

- [ ] GitHub Actions workflow runs successfully
- [ ] Application deploys without errors
- [ ] Health endpoint responds: `curl https://moodmash.win/api/health`
- [ ] Database connection works
- [ ] R2 storage is accessible
- [ ] OAuth login works (Google & GitHub)
- [ ] Email sending works (Resend)
- [ ] Bot protection works (Turnstile)

### Run Deployment Readiness Script

```bash
./scripts/check-deployment-readiness.sh
```

---

## 10. Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Authentication failed" | Check CLOUDFLARE_API_TOKEN has correct permissions |
| "Database not found" | Verify database_id in wrangler.jsonc matches created database |
| "R2 bucket not found" | Create buckets with `npx wrangler r2 bucket create` |
| "Secret not found" | Set secrets with `npx wrangler secret put` |
| "OAuth redirect error" | Verify redirect URIs match in OAuth provider settings |

### Logs and Debugging

```bash
# View real-time logs
npx wrangler pages deployment tail --project-name=moodmash

# View deployment history
npx wrangler pages deployment list --project-name=moodmash
```

---

## 11. Cost Estimates

### Cloudflare Services (Monthly)

| Service | Free Tier | Paid Tier |
|---------|-----------|------------|
| Workers | 100K requests/day | $5/10M requests |
| D1 | 5M rows read, 100K writes | $0.75/1M reads |
| R2 | 10GB storage, 10M reads | $0.015/GB storage |
| Pages | Unlimited sites | - |

### Third-Party Services

| Service | Free Tier | Notes |
|---------|-----------|-------|
| Resend | 100 emails/day | Email sending |
| Gemini | Free tier available | AI features |
| Sentry | 5K errors/month | Error tracking |

---

## Support

For issues or questions:
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
