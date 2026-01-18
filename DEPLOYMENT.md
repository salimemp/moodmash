# Deployment Guide

This guide covers deploying MoodMash to Cloudflare Workers.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/) v9+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) v3+
- Cloudflare account

## Environment Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Wrangler

Create or update `wrangler.toml`:

```toml
name = "moodmash"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "moodmash-db"
database_id = "your-database-id"

[vars]
ENVIRONMENT = "production"
```

### 3. Environment Variables

Required secrets (set via `wrangler secret put`):

```bash
# Gemini AI API Key
wrangler secret put GEMINI_API_KEY

# Email Service (Resend)
wrangler secret put RESEND_API_KEY

# OAuth Credentials
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET

# Session Secret
wrangler secret put SESSION_SECRET

# Cloudflare Turnstile (Bot Protection)
wrangler secret put TURNSTILE_SECRET_KEY
```

## Database Setup

### 1. Create D1 Database

```bash
wrangler d1 create moodmash-db
```

### 2. Run Migrations

```bash
# List migrations
ls migrations/

# Apply all migrations
for f in migrations/*.sql; do
  wrangler d1 execute moodmash-db --file="$f"
done
```

### 3. Seed Default Data (Optional)

```bash
wrangler d1 execute moodmash-db --command="
INSERT INTO subscription_tiers (id, name, features, limits) VALUES
('free', 'Free', '[]', '{\"moods_per_month\": 30}');
"
```

## Deployment

### Development (Local)

```bash
npm run dev
# or
wrangler dev
```

### Staging

```bash
wrangler deploy --env staging
```

### Production

```bash
npm run deploy
# or
wrangler deploy
```

## Cloudflare Pages (Alternative)

If using Cloudflare Pages:

1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables in Pages settings

## Post-Deployment

### 1. Verify Health Check

```bash
curl https://your-domain.workers.dev/health
# Expected: {"status":"ok","timestamp":"..."}
```

### 2. Run Smoke Tests

```bash
# Test authentication
curl -X POST https://your-domain.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test mood logging
curl https://your-domain.workers.dev/api/moods \
  -H "Cookie: session=..."
```

### 3. Monitor Logs

```bash
wrangler tail
```

## Domain Configuration

### Custom Domain

1. Go to Cloudflare Dashboard > Workers > your-worker
2. Click "Custom Domains"
3. Add your domain (e.g., `app.moodmash.win`)
4. DNS records are configured automatically

### SSL/TLS

Cloudflare provides free SSL certificates automatically.

## Scaling

MoodMash is designed for Cloudflare's edge network:

- **Global Distribution**: Automatically deployed to 300+ edge locations
- **Auto-Scaling**: Handles traffic spikes automatically
- **D1 Database**: Distributed SQLite with automatic replication
- **KV Storage**: Optional for session caching

## Rollback

### Quick Rollback

```bash
# List previous versions
wrangler deployments list

# Rollback to previous version
wrangler rollback
```

### Manual Rollback

```bash
git checkout <previous-commit>
wrangler deploy
```

## Monitoring

### Cloudflare Analytics

- Request metrics
- Error rates
- Response times
- Geographic distribution

### Custom Logging

Enable logging in `wrangler.toml`:

```toml
[observability]
enabled = true
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify D1 binding in wrangler.toml
   - Check database ID matches

2. **Authentication Errors**
   - Verify SESSION_SECRET is set
   - Check cookie domain settings

3. **Gemini API Failures**
   - Verify GEMINI_API_KEY is correct
   - Check API quota limits

4. **OAuth Redirects**
   - Update callback URLs in provider settings
   - Ensure HTTPS is used

### Debug Mode

```bash
wrangler dev --log-level debug
```

## Security Checklist

- [ ] All secrets configured via `wrangler secret`
- [ ] HTTPS enforced (automatic on Cloudflare)
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] Bot protection (Turnstile) configured
- [ ] 2FA enabled for admin accounts

## Support

- Documentation: https://docs.moodmash.win
- Issues: https://github.com/your-org/moodmash/issues
- Email: support@moodmash.win
