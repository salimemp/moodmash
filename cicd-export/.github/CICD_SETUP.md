# CI/CD Pipeline Setup Guide

## 🚀 Overview

MoodMash uses GitHub Actions for automated CI/CD pipelines with Cloudflare Pages deployment.

## 📋 Required GitHub Secrets

To enable automated deployments, you need to configure the following secrets in your GitHub repository:

### 1. CLOUDFLARE_API_TOKEN

**How to get it:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use the "Edit Cloudflare Workers" template
4. Set the following permissions:
   - Account > Cloudflare Pages > Edit
   - Account > D1 > Edit
5. Copy the generated token

**Add to GitHub:**
```
Settings → Secrets and variables → Actions → New repository secret
Name: CLOUDFLARE_API_TOKEN
Value: [paste your token]
```

### 2. CLOUDFLARE_ACCOUNT_ID

**How to get it:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account
3. The Account ID is visible on the right sidebar of the overview page
4. Or navigate to: Workers & Pages → Overview → Account ID

**Add to GitHub:**
```
Settings → Secrets and variables → Actions → New repository secret
Name: CLOUDFLARE_ACCOUNT_ID
Value: [paste your account ID]
```

## 🔧 GitHub Secrets Setup

### Via GitHub Web Interface

1. Navigate to: `https://github.com/salimemp/moodmash/settings/secrets/actions`
2. Click "New repository secret"
3. Add each secret:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

### Via GitHub CLI (gh)

If you have the GitHub CLI installed:

```bash
gh secret set CLOUDFLARE_API_TOKEN
# Paste your Cloudflare API token when prompted

gh secret set CLOUDFLARE_ACCOUNT_ID
# Paste your Cloudflare Account ID when prompted
```

## 📊 Available Workflows

### 1. CI - Continuous Integration (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs:**
- **Lint & Type Check**: Validates code quality
- **Build Validation**: Ensures project builds successfully
- **Security Audit**: Scans for npm vulnerabilities

**Manual trigger:**
```bash
# Not needed - runs automatically on push/PR
```

---

### 2. CD - Continuous Deployment (`.github/workflows/deploy.yml`)

**Triggers:**
- Push to `main` branch (automatic production deployment)
- Manual dispatch via GitHub UI

**Jobs:**
- **Deploy to Cloudflare Pages**: Builds and deploys to production
- **Post-Deployment Health Checks**: Validates deployment success

**Manual trigger:**
```bash
gh workflow run deploy.yml
```

**Via GitHub UI:**
```
Actions → CD - Continuous Deployment → Run workflow
```

---

### 3. Database Migrations (`.github/workflows/database-migrations.yml`)

**Triggers:**
- Manual dispatch only (for safety)

**Jobs:**
- **Validate Input**: Requires "MIGRATE" confirmation
- **Apply Migrations**: Runs D1 migrations on production
- **Post-Migration Health Check**: Validates database health

**Manual trigger:**
```bash
gh workflow run database-migrations.yml -f environment=production -f confirm=MIGRATE
```

**Via GitHub UI:**
```
Actions → Database Migrations → Run workflow
  Environment: production
  Confirm: MIGRATE
```

---

### 4. Dependency Management (`.github/workflows/dependency-management.yml`)

**Triggers:**
- Every Monday at 9:00 AM UTC (automatic)
- Manual dispatch via GitHub UI

**Jobs:**
- **Check Updates**: Lists outdated packages
- **Security Scan**: Audits for vulnerabilities
- **License Check**: Validates license compliance

**Manual trigger:**
```bash
gh workflow run dependency-management.yml
```

## 🔄 Deployment Flow

### Automatic Deployment (Recommended)

1. **Make changes** to your code locally
2. **Commit** your changes:
   ```bash
   git add .
   git commit -m "Your commit message"
   ```
3. **Push to GitHub**:
   ```bash
   git push origin main
   ```
4. **GitHub Actions automatically**:
   - ✅ Runs CI checks (lint, type-check, build)
   - ✅ Builds the project
   - ✅ Deploys to Cloudflare Pages
   - ✅ Runs health checks
5. **Deployment complete** - Check Actions tab for status

### Manual Deployment

If you need to deploy without pushing new code:

```bash
gh workflow run deploy.yml
```

Or via GitHub UI:
```
Actions → CD - Continuous Deployment → Run workflow → Run workflow
```

## 🗃️ Database Migrations

**IMPORTANT:** Database migrations should be run manually with explicit confirmation.

### To apply new migrations:

1. **Create migration file** in `migrations/` directory
2. **Commit and push** the migration file
3. **Run migration workflow**:
   ```bash
   gh workflow run database-migrations.yml -f environment=production -f confirm=MIGRATE
   ```
4. **Verify** migration success in Actions tab

### Rollback strategy:

Create a new migration file that reverses changes.

## 📈 Monitoring Workflows

### Check workflow status:

```bash
# List recent workflow runs
gh run list --limit 10

# Watch a specific workflow
gh run watch

# View logs for a run
gh run view [run-id]
```

### Via GitHub UI:

Navigate to: `https://github.com/salimemp/moodmash/actions`

## 🚨 Troubleshooting

### Deployment fails with "unauthorized"

- **Check:** Verify `CLOUDFLARE_API_TOKEN` is correct
- **Solution:** Regenerate token with correct permissions

### Build fails

- **Check:** Run `npm run build` locally first
- **Solution:** Fix any TypeScript or build errors

### Migration fails

- **Check:** Test migration locally:
  ```bash
  npx wrangler d1 migrations apply moodmash --local
  ```
- **Solution:** Fix SQL syntax errors in migration files

### Health checks fail

- **Wait:** Give deployment 30-60 seconds to stabilize
- **Check:** Manually test endpoints:
  ```bash
  curl https://moodmash.pages.dev/api/health/status
  ```

## 🔐 Security Best Practices

1. **Never commit secrets** to the repository
2. **Rotate API tokens** every 90 days
3. **Use least-privilege permissions** for tokens
4. **Monitor workflow logs** for suspicious activity
5. **Enable branch protection** for `main` branch

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloudflare Pages CI/CD](https://developers.cloudflare.com/pages/platform/github-integration/)
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

## ✅ Verification Checklist

After setup, verify:

- [ ] Secrets are configured in GitHub
- [ ] CI workflow runs successfully on push
- [ ] CD workflow deploys to Cloudflare Pages
- [ ] Health checks pass after deployment
- [ ] Database migrations can be run manually
- [ ] Dependency scans run weekly

---

**Need help?** Check workflow logs in the Actions tab or review this guide.
