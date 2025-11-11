# MoodMash Deployment Guide

## 🚀 Quick Deployment Checklist

### Prerequisites
- [ ] Cloudflare account created
- [ ] Cloudflare API token configured (call `setup_cloudflare_api_key`)
- [ ] GitHub account (optional, for version control)

### Step 1: Configure Cloudflare API Access

```bash
# This tool will configure CLOUDFLARE_API_TOKEN environment variable
# If it fails, go to Deploy tab to set up your API key
setup_cloudflare_api_key
```

### Step 2: Create Production Database

```bash
# Create production D1 database
npx wrangler d1 create moodmash-production

# Copy the database_id from output and update wrangler.jsonc
# Replace "your-database-id-here" with actual database ID
```

**Update `wrangler.jsonc`:**
```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "moodmash-production",
      "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  // Paste your actual ID here
    }
  ]
}
```

### Step 3: Apply Database Migrations

```bash
# Apply migrations to production database
npm run db:migrate:prod

# Optional: Seed with sample data (for testing)
npx wrangler d1 execute moodmash-production --file=./seed.sql
```

### Step 4: Create Cloudflare Pages Project

```bash
# Create the project (use main branch as production)
npx wrangler pages project create moodmash \
  --production-branch main \
  --compatibility-date 2025-11-11
```

### Step 5: Build and Deploy

```bash
# Build the application
npm run build

# Deploy to Cloudflare Pages
npm run deploy:prod

# You'll receive URLs like:
# - Production: https://random-id.moodmash.pages.dev
# - Branch: https://main.moodmash.pages.dev
```

### Step 6: Verify Deployment

```bash
# Test production API
curl https://your-project.pages.dev/api/health
curl https://your-project.pages.dev/api/stats

# Visit in browser
https://your-project.pages.dev
```

## 🔄 Updating Deployment

### For Code Changes

```bash
# Make your changes, test locally
npm run build
pm2 start ecosystem.config.cjs

# When ready, commit and deploy
git add .
git commit -m "Your commit message"
npm run deploy:prod
```

### For Database Schema Changes

```bash
# Create new migration file
# migrations/0002_your_migration_name.sql

# Test locally first
npm run db:migrate:local
npm run dev:sandbox

# Apply to production
npm run db:migrate:prod

# Deploy code
npm run deploy:prod
```

## 🌐 Custom Domain (Optional)

### Add Custom Domain to Cloudflare Pages

```bash
# Add your domain
npx wrangler pages domain add example.com --project-name moodmash

# Configure DNS
# Add CNAME record: www.example.com -> moodmash.pages.dev
```

## 🔑 Environment Variables & Secrets

### For Future API Integrations

```bash
# Add secrets (e.g., for OpenAI, Auth0, etc.)
npx wrangler pages secret put OPENAI_API_KEY --project-name moodmash
npx wrangler pages secret put AUTH0_SECRET --project-name moodmash

# List secrets
npx wrangler pages secret list --project-name moodmash
```

### Local Development Environment

Create `.dev.vars` file (not committed to git):
```
OPENAI_API_KEY=sk-your-key-here
AUTH0_SECRET=your-secret-here
```

## 📊 Monitoring Production

### Check Deployment Status

```bash
# List deployments
npx wrangler pages deployments list --project-name moodmash

# View logs (after deployment)
npx wrangler pages deployment tail --project-name moodmash
```

### Database Operations

```bash
# Query production database
npx wrangler d1 execute moodmash-production \
  --command="SELECT COUNT(*) as total FROM mood_entries"

# Backup production database (export to JSON)
npx wrangler d1 export moodmash-production --local --output=backup.json
```

## 🐛 Troubleshooting

### Issue: API Token Not Working

**Solution:**
```bash
# Verify token is set
npx wrangler whoami

# If not working, go to Deploy tab and reconfigure
setup_cloudflare_api_key
```

### Issue: Database Not Found

**Solution:**
```bash
# List all D1 databases
npx wrangler d1 list

# Verify database_id in wrangler.jsonc matches
```

### Issue: Build Fails

**Solution:**
```bash
# Clean build artifacts
rm -rf dist .wrangler node_modules

# Reinstall and rebuild
npm install
npm run build
```

### Issue: Migration Already Applied

**Solution:**
```bash
# List applied migrations
npx wrangler d1 migrations list moodmash-production

# To force reapply (WARNING: may cause issues)
# Not recommended for production
```

## 📈 Performance Optimization

### Enable Caching (Future)

Add KV namespace for caching:
```bash
npx wrangler kv:namespace create CACHE
npx wrangler kv:namespace create CACHE --preview
```

Update `wrangler.jsonc`:
```jsonc
{
  "kv_namespaces": [
    {
      "binding": "CACHE",
      "id": "your-kv-id",
      "preview_id": "your-preview-kv-id"
    }
  ]
}
```

### Database Optimization

- Add indexes for frequently queried fields
- Use prepared statements (already implemented)
- Cache statistics calculations
- Implement pagination for large datasets

## 🔐 Security Best Practices

### Database Security
- Never expose database_id publicly
- Use bound parameters (✅ already implemented)
- Validate all user inputs (✅ already implemented)
- Implement rate limiting (future enhancement)

### API Security
- Add CORS configuration (✅ already implemented)
- Implement authentication (future)
- Use HTTPS only (enforced by Cloudflare)
- Sanitize error messages in production

## 📦 Backup Strategy

### Automated Backups (Recommended)

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
npx wrangler d1 export moodmash-production --output=backups/backup_$DATE.json
EOF

# Make executable
chmod +x backup.sh

# Run weekly via cron (if using external server)
# 0 0 * * 0 /path/to/backup.sh
```

### Manual Backup

```bash
# Export to JSON
npx wrangler d1 export moodmash-production --output=backup.json

# Or use SQL dump
npx wrangler d1 execute moodmash-production \
  --command=".dump" > backup.sql
```

## 🎯 Next Steps After Deployment

1. **Set up monitoring**
   - Cloudflare Analytics dashboard
   - Error tracking (Sentry integration)
   - Performance monitoring

2. **Configure custom domain**
   - Purchase domain
   - Configure DNS
   - Set up SSL (automatic with Cloudflare)

3. **Add authentication**
   - Integrate Auth0 or Clerk
   - Update database for multi-user support
   - Implement user permissions

4. **Integrate AI/ML**
   - Add OpenAI API key
   - Implement mood pattern analysis
   - Generate personalized insights

5. **Mobile optimization**
   - Test on various devices
   - Add PWA manifest
   - Implement offline support

---

**Need Help?**
- Cloudflare Docs: https://developers.cloudflare.com/pages/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/
- D1 Database: https://developers.cloudflare.com/d1/

*Last Updated: 2025-11-11*
