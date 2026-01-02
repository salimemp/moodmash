# How to Set Up Cloudflare Pages Git Integration

**Time**: 10-15 minutes  
**Difficulty**: Easy  
**Result**: Automatic builds and deployments on every git push

---

## 🎯 Why This Solves the Build Problem

**Current situation**:
- ❌ Sandbox can't build (resource limits)
- ❌ Manual builds are tedious
- ❌ No automatic deployments

**After setup**:
- ✅ Cloudflare builds automatically (unlimited resources)
- ✅ Every git push triggers deployment
- ✅ Preview deployments for branches
- ✅ Build logs in dashboard

---

## 📋 Prerequisites

1. ✅ GitHub repository: https://github.com/salimemp/moodmash
2. ✅ Cloudflare account
3. ✅ Cloudflare Pages project: `moodmash`

---

## 🚀 Setup Steps

### Step 1: Connect GitHub to Cloudflare

1. **Go to Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com/d65655738594c6ac1a7011998a73e77d/pages/view/moodmash
   ```

2. **Click "Settings" tab**

3. **Scroll to "Build & deployments" section**

4. **Click "Connect to Git"**

5. **Authorize Cloudflare**
   - Select "GitHub"
   - Click "Authorize Cloudflare"
   - Log in to GitHub if needed
   - Grant permissions

6. **Select Repository**
   - Choose: `salimemp/moodmash`
   - Click "Connect"

---

### Step 2: Configure Build Settings

Cloudflare will ask for build configuration:

```yaml
Production branch:     main
Build command:         npm run build
Build output directory: dist
Root directory:        /
Node version:          20
```

**Important**: Make sure these match your project structure!

---

### Step 3: Set Environment Variables

In Cloudflare dashboard under "Settings" → "Environment variables":

**Production**:
- `GITHUB_CLIENT_ID` → (your value)
- `GITHUB_CLIENT_SECRET` → (your value)
- `GEMINI_API_KEY` → (your value)
- `RESEND_API_KEY` → (your value)  
- `SENTRY_DSN` → (your value)

**Preview** (optional):
- Same variables or different test values

---

### Step 4: Trigger First Build

After connecting:

1. Cloudflare will automatically trigger a build
2. Watch build logs in real-time
3. Wait 5-10 minutes for completion
4. Check deployment URL

**Or manually trigger**:
- Go to "Deployments" tab
- Click "Create deployment"
- Select branch: `main`
- Click "Deploy"

---

### Step 5: Verify Deployment

1. **Check build logs**
   ```
   Cloudflare Dashboard → Pages → moodmash → Deployments
   → Click on latest deployment
   → View "Build logs"
   ```

2. **Test deployment URL**
   ```
   https://RANDOM_ID.moodmash.pages.dev
   ```

3. **Check production URL**
   ```
   https://moodmash.win
   ```

---

## 🔄 How It Works After Setup

### Automatic Deployments

Every time you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Cloudflare automatically:
1. Detects the push
2. Pulls latest code
3. Runs `npm install`
4. Runs `npm run build`
5. Deploys `dist/` to production
6. Updates https://moodmash.win

**Total time**: 5-10 minutes

---

### Preview Deployments

When you push to a branch:

```bash
git checkout -b feature/new-feature
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
```

Cloudflare creates a preview deployment:
```
https://feature-new-feature.moodmash.pages.dev
```

Test before merging to main!

---

## 🛠️ Troubleshooting

### Build Fails with "Command not found"

**Problem**: Missing dependencies

**Solution**: 
1. Check `package.json` has all dependencies
2. Push updated `package.json`
3. Rebuild

---

### Build Times Out

**Problem**: Build takes >25 minutes

**Solution**:
1. Optimize dependencies (remove unused)
2. Use `npm ci` instead of `npm install`
3. Enable build cache in Cloudflare settings

---

### Environment Variables Not Working

**Problem**: Variables not set in Cloudflare

**Solution**:
1. Go to Settings → Environment variables
2. Add missing variables
3. Redeploy (variables only apply to new builds)

---

### Deployment Successful but Site Broken

**Problem**: Missing `_worker.js` or build artifacts

**Solution**:
1. Check build logs for errors
2. Verify `dist/` has `_worker.js` and `_routes.json`
3. Check vite.config.ts is correct

---

## 🎯 Benefits of Git Integration

### Automatic Builds
- ✅ No manual `npm run build` needed
- ✅ No sandbox resource limits
- ✅ Consistent build environment

### Preview Deployments
- ✅ Test features before production
- ✅ Share preview URLs with team
- ✅ Easy to rollback

### Build Logs
- ✅ See exactly what went wrong
- ✅ Debug build failures
- ✅ Share logs for support

### Rollbacks
- ✅ One-click rollback to previous deployment
- ✅ Git history = deployment history
- ✅ No production downtime

---

## 📝 Alternative: GitHub Actions

If you prefer more control, use GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: d65655738594c6ac1a7011998a73e77d
          projectName: moodmash
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

**Setup**:
1. Add `CLOUDFLARE_API_TOKEN` to GitHub Secrets
2. Commit workflow file
3. Push to trigger

---

## ✅ Recommended Next Steps

1. **Set up Cloudflare Pages Git integration** (10 min)
2. **Test with a small commit** (5 min)
3. **Verify automatic deployment works** (5 min)
4. **Configure environment variables** (5 min)
5. **Done!** Future deployments are automatic

---

## 🔗 Useful Links

- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages/
- **Git Integration Guide**: https://developers.cloudflare.com/pages/get-started/git-integration/
- **Build Configuration**: https://developers.cloudflare.com/pages/configuration/build-configuration/
- **Environment Variables**: https://developers.cloudflare.com/pages/configuration/env-vars/

---

*Last updated: 2026-01-02 07:35 UTC*
