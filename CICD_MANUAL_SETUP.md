# CI/CD Manual Setup Instructions

## 🚨 Important Notice

Due to GitHub App permissions, the workflow files need to be added manually to your repository. Follow these steps to complete the CI/CD setup.

## 📋 Step 1: Configure GitHub Secrets

Before adding workflow files, configure these secrets in your GitHub repository:

### Navigate to Settings
```
https://github.com/salimemp/moodmash/settings/secrets/actions
```

### Required Secrets

#### 1. CLOUDFLARE_API_TOKEN

**How to get:**
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use template: "Edit Cloudflare Workers"
4. Set permissions:
   - Account > Cloudflare Pages > Edit
   - Account > D1 > Edit
5. Copy the token

**Add to GitHub:**
```
Name: CLOUDFLARE_API_TOKEN
Value: [paste your token here]
```

#### 2. CLOUDFLARE_ACCOUNT_ID

**How to get:**
1. Go to: https://dash.cloudflare.com
2. Click on "Workers & Pages"
3. Account ID is shown on the right sidebar

**Add to GitHub:**
```
Name: CLOUDFLARE_ACCOUNT_ID
Value: [paste your account ID here]
```

## 📋 Step 2: Add Workflow Files to GitHub

### Option A: Via GitHub Web UI (Recommended)

For each workflow file below, follow these steps:

1. Navigate to: `https://github.com/salimemp/moodmash`
2. Click "Add file" → "Create new file"
3. Enter the file path (e.g., `.github/workflows/ci.yml`)
4. Copy and paste the content from the local files
5. Commit directly to `main` branch

**Files to create:**

1. `.github/workflows/ci.yml`
2. `.github/workflows/deploy.yml`
3. `.github/workflows/database-migrations.yml`
4. `.github/workflows/dependency-management.yml`
5. `.github/workflows/README.md`
6. `.github/CICD_SETUP.md`

### Option B: Via Git with Personal Access Token

If you have a Personal Access Token with `workflow` scope:

```bash
# Configure git to use PAT
git remote set-url origin https://YOUR_USERNAME:YOUR_PAT@github.com/salimemp/moodmash.git

# Push the changes
git push origin main

# Reset remote URL (for security)
git remote set-url origin https://github.com/salimemp/moodmash.git
```

**Create PAT with workflow scope:**
1. Go to: https://github.com/settings/tokens/new
2. Select scopes: `repo`, `workflow`
3. Generate token
4. Use in command above

### Option C: Local Files Reference

All workflow files are already created in your local repository at:
- `/home/user/webapp/.github/workflows/ci.yml`
- `/home/user/webapp/.github/workflows/deploy.yml`
- `/home/user/webapp/.github/workflows/database-migrations.yml`
- `/home/user/webapp/.github/workflows/dependency-management.yml`
- `/home/user/webapp/.github/workflows/README.md`
- `/home/user/webapp/.github/CICD_SETUP.md`

You can copy these files to your GitHub repository.

## 📋 Step 3: Verify Setup

Once workflows are added:

### 1. Check Actions Tab
```
https://github.com/salimemp/moodmash/actions
```

You should see:
- ✅ CI - Continuous Integration
- ✅ CD - Continuous Deployment
- ✅ Database Migrations
- ✅ Dependency Management

### 2. Trigger First Workflow

Make a small change and push:
```bash
echo "# CI/CD Test" >> README.md
git add README.md
git commit -m "Test CI/CD pipeline"
git push origin main
```

This will trigger:
1. CI workflow (lint, build, audit)
2. CD workflow (deploy to Cloudflare)

### 3. Monitor Workflow Execution

Watch the progress:
```
https://github.com/salimemp/moodmash/actions
```

Expected results:
- ✅ CI passes (green checkmark)
- ✅ CD deploys successfully
- ✅ Health checks pass

## 🎯 Quick File Upload Guide

To quickly add all workflow files via GitHub UI:

### File 1: `.github/workflows/ci.yml`
```bash
cat /home/user/webapp/.github/workflows/ci.yml
```
Copy output → GitHub → Create file → Paste → Commit

### File 2: `.github/workflows/deploy.yml`
```bash
cat /home/user/webapp/.github/workflows/deploy.yml
```
Copy output → GitHub → Create file → Paste → Commit

### File 3: `.github/workflows/database-migrations.yml`
```bash
cat /home/user/webapp/.github/workflows/database-migrations.yml
```
Copy output → GitHub → Create file → Paste → Commit

### File 4: `.github/workflows/dependency-management.yml`
```bash
cat /home/user/webapp/.github/workflows/dependency-management.yml
```
Copy output → GitHub → Create file → Paste → Commit

### File 5: `.github/workflows/README.md`
```bash
cat /home/user/webapp/.github/workflows/README.md
```
Copy output → GitHub → Create file → Paste → Commit

### File 6: `.github/CICD_SETUP.md`
```bash
cat /home/user/webapp/.github/CICD_SETUP.md
```
Copy output → GitHub → Create file → Paste → Commit

## ✅ Verification Checklist

After setup:

- [ ] CLOUDFLARE_API_TOKEN configured
- [ ] CLOUDFLARE_ACCOUNT_ID configured
- [ ] All 4 workflow files added (.yml files)
- [ ] Documentation files added (README.md, CICD_SETUP.md)
- [ ] First workflow run triggered
- [ ] CI workflow passes
- [ ] CD workflow deploys successfully
- [ ] Health checks pass
- [ ] Production site accessible

## 🚀 Post-Setup

Once everything is configured:

### Automatic Deployments
Every push to `main` will:
1. ✅ Run CI checks
2. ✅ Build the project
3. ✅ Deploy to Cloudflare Pages
4. ✅ Run health checks

### Manual Operations

**Deploy manually:**
```
Actions → CD - Continuous Deployment → Run workflow
```

**Run migrations:**
```
Actions → Database Migrations → Run workflow
  environment: production
  confirm: MIGRATE
```

**Check dependencies:**
```
Actions → Dependency Management → Run workflow
```

## 🆘 Troubleshooting

### Workflow doesn't appear
- Wait 1-2 minutes after adding files
- Refresh the Actions page
- Check if files are in correct location

### Secret not found
- Verify secret names match exactly
- Check they're repository secrets, not environment secrets
- Re-add if necessary

### Deployment fails
- Check Cloudflare API token permissions
- Verify account ID is correct
- Review workflow logs for details

### Need Help?
Review complete documentation in `.github/CICD_SETUP.md`

## 📊 Expected Results

After successful setup, you'll have:

✅ Automated CI/CD pipeline
✅ Zero-downtime deployments
✅ Automated security scanning
✅ Safe database migrations
✅ Weekly dependency updates
✅ Full audit trail

**Estimated Setup Time**: 10-15 minutes

---

**Status**: Ready for manual upload
**Last Updated**: 2025-11-24
**Version**: v10.2 (Mobile Optimization + CI/CD)
