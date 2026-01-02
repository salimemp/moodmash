# ✅ Cloudflare Pages Git Integration - Step-by-Step Setup

**Status**: Ready to configure  
**Repository**: https://github.com/salimemp/moodmash  
**Latest Commit**: Pushed ✅

---

## 📋 Pre-Setup Checklist

✅ **Code pushed to GitHub**
- Repository: `salimemp/moodmash`
- Branch: `main`
- Latest commit: All build fixes and documentation

✅ **Configuration files ready**
- `package.json` → Build script: `npm run build` ✓
- `wrangler.jsonc` → Output directory: `dist` ✓
- `pages.toml` → Cloudflare Pages config ✓
- `vite.config.ts` → Vite build configuration ✓

✅ **Environment variables documented**
- `GITHUB_CLIENT_ID` → OAuth
- `GITHUB_CLIENT_SECRET` → OAuth
- `GEMINI_API_KEY` → AI features
- `RESEND_API_KEY` → Email
- `SENTRY_DSN` → Error tracking

---

## 🚀 Setup Steps (Cloudflare Dashboard)

### **Step 1: Access Cloudflare Pages Dashboard**

1. Open your browser
2. Go to: https://dash.cloudflare.com/d65655738594c6ac1a7011998a73e77d/pages/view/moodmash
3. Log in if needed

---

### **Step 2: Navigate to Settings**

1. Click on the **"Settings"** tab (top navigation)
2. Scroll to **"Builds & deployments"** section

You should see:
```
Source: Direct Upload
Build configuration: Not configured
```

---

### **Step 3: Connect to Git**

1. In "Builds & deployments" section, click **"Connect to Git"** button

2. You'll see a popup: **"Connect a Git provider"**
   - Select: **GitHub**

3. Click **"Authorize Cloudflare Pages"**
   - You'll be redirected to GitHub
   - Log in to GitHub if needed

4. **Grant Permissions**
   - GitHub will ask: "Cloudflare Pages wants to access your repositories"
   - Click **"Authorize cloudflare"**
   
   **Note**: You may need to grant access to specific organizations:
   - Click **"Grant"** next to your account
   - Select repositories: Choose **"Only select repositories"**
   - Select: **"salimemp/moodmash"**
   - Click **"Install & Authorize"**

---

### **Step 4: Select Repository**

After authorization, you'll return to Cloudflare:

1. **Select account/organization**
   - Choose: `salimemp`

2. **Select repository**
   - Choose: `moodmash`

3. Click **"Begin setup"**

---

### **Step 5: Configure Build Settings**

Cloudflare will show a "Set up builds and deployments" form.

**Fill in exactly as shown**:

```yaml
Production branch:         main
Build command:             npm run build
Build output directory:    dist
Root directory:            / (leave empty or type slash)

Framework preset:          None (or select "Hono" if available)
```

**Advanced Options** (click to expand):
```yaml
Node.js version:           20
NPM version:               10 (or leave default)
```

**Environment variables (Production)**:

Click **"Add variable"** for each:

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `GITHUB_CLIENT_ID` | (your value) | GitHub OAuth |
| `GITHUB_CLIENT_SECRET` | (your value) | GitHub OAuth |
| `GEMINI_API_KEY` | (your value) | AI features |
| `RESEND_API_KEY` | (your value) | Email service |
| `SENTRY_DSN` | (your value) | Error tracking |

**Deployment controls**:
- ✅ Enable automatic deployments (when you push to main)
- ✅ Enable preview deployments (for branches)

---

### **Step 6: Save and Deploy**

1. Click **"Save and Deploy"** button at bottom

2. Cloudflare will:
   - Connect to GitHub
   - Pull latest code from `main` branch
   - Run `npm install`
   - Run `npm run build`
   - Deploy `dist/` directory

3. **Watch build logs** (automatically displayed)

---

## 📊 Expected Build Process

You should see output like this:

```
Initializing build environment...
✓ Node.js 20.x installed
✓ npm 10.x installed

Cloning repository...
✓ Cloned salimemp/moodmash (main branch)

Installing dependencies...
$ npm install
...
added 500 packages in 45s

Building application...
$ npm run build

> moodmash@1.0.0 build
> vite build

vite v6.4.1 building SSR bundle for production...
transforming...
✓ 146 modules transformed.
rendering chunks...
computing gzip size...
dist/_worker.js      450.23 kB │ gzip: 120.45 kB
dist/_routes.json    0.33 kB
✓ built in 4m 32s

Deploying...
✓ Uploaded 98 files
✓ Deployment complete

Success: Deployed to https://9cac252.moodmash.pages.dev
Production URL: https://moodmash.win
```

**Build time**: ~5-7 minutes (first build)  
**Subsequent builds**: ~3-5 minutes (with cache)

---

## ✅ Verify Deployment

### **Test 1: Check Deployment URL**

1. Click on deployment URL in build logs
2. Example: `https://9cac252.moodmash.pages.dev`
3. Verify site loads

### **Test 2: Check Production URL**

1. Open: https://moodmash.win
2. Should show latest code

### **Test 3: Check API Health**

```bash
curl https://moodmash.win/api/health/status
```

Expected:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-02T08:00:00.000Z",
  "components": {
    "api": "healthy",
    "database": "healthy",
    ...
  }
}
```

### **Test 4: Check GitHub OAuth**

1. Go to: https://moodmash.win/login
2. Should see: "Continue with GitHub" button
3. Should NOT see: "Continue with Google" button (credentials deleted)

---

## 🎯 After Setup: How It Works

### **Automatic Deployments**

Every time you push to `main`:

```bash
git add .
git commit -m "Add new feature"
git push origin main
```

Cloudflare automatically:
1. ✅ Detects push
2. ✅ Pulls code
3. ✅ Runs build
4. ✅ Deploys to production
5. ✅ Updates https://moodmash.win

**No manual action needed!**

---

### **Preview Deployments**

Push to any other branch:

```bash
git checkout -b feature/new-ui
git add .
git commit -m "Update UI"
git push origin feature/new-ui
```

Cloudflare creates preview:
```
https://feature-new-ui.moodmash.pages.dev
```

**Test before merging to main!**

---

### **Managing Deployments**

**View all deployments**:
- Dashboard → Pages → moodmash → Deployments

**Rollback to previous**:
- Find deployment in list
- Click "..." → "Rollback to this deployment"
- Confirm

**Rebuild deployment**:
- Click "..." → "Retry deployment"

---

## 🛠️ Troubleshooting

### **Build Fails: "Command not found: vite"**

**Cause**: Dependencies not installed

**Solution**:
1. Check `package.json` has `vite` in `devDependencies`
2. Verify build command is `npm run build` (not `vite build` directly)
3. Check Node version is 20+

---

### **Build Fails: "Cannot find module"**

**Cause**: Missing dependencies or import errors

**Solution**:
1. Check build logs for specific module
2. Verify it's in `package.json`
3. Check import paths are correct
4. Try local build: `npm install && npm run build`

---

### **Build Times Out**

**Cause**: Build takes >25 minutes

**Solution**:
1. Optimize dependencies (remove unused)
2. Check for infinite loops in build
3. Contact Cloudflare support to increase timeout

---

### **Deployment Succeeds but Site Broken**

**Cause**: Missing `_worker.js` or environment variables

**Solution**:
1. Check build logs: `dist/_worker.js` should be listed
2. Verify environment variables are set:
   - Dashboard → Settings → Environment variables
3. Check browser console for errors

---

### **OAuth Not Working**

**Cause**: Missing environment variables or wrong redirect URI

**Solution**:
1. Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set
2. Check GitHub OAuth app settings:
   - Redirect URI: `https://moodmash.win/auth/github/callback`
3. Test: https://moodmash.win/api/oauth/config
   ```json
   {
     "providers": {"github": true, "google": false},
     "available": ["github"]
   }
   ```

---

## 📝 Post-Setup Checklist

After successful setup, verify:

- ✅ GitHub connection active
- ✅ First deployment successful
- ✅ Production URL working: https://moodmash.win
- ✅ API health check passing
- ✅ GitHub OAuth button visible
- ✅ Google OAuth button hidden
- ✅ Environment variables configured
- ✅ Automatic deployments enabled

---

## 🎉 Success!

Once setup is complete:

1. ✅ **Push to deploy** - `git push` triggers automatic deployment
2. ✅ **Preview branches** - Test features before merging
3. ✅ **Easy rollbacks** - One-click restore
4. ✅ **Build logs** - Debug any issues
5. ✅ **No sandbox limits** - Cloudflare has unlimited resources

**You're done!** Future code changes will automatically build and deploy.

---

## 🔗 Useful Links

- **Cloudflare Dashboard**: https://dash.cloudflare.com/d65655738594c6ac1a7011998a73e77d/pages/view/moodmash
- **GitHub Repository**: https://github.com/salimemp/moodmash
- **Production Site**: https://moodmash.win
- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages/

---

## 💬 Need Help?

If you encounter issues:

1. Check build logs in Cloudflare Dashboard
2. Verify all environment variables are set
3. Test build locally: `npm install && npm run build`
4. Check this guide's troubleshooting section
5. Ask me for help with specific error messages!

---

**Last Updated**: 2026-01-02 08:00 UTC  
**Status**: Ready to configure  
**Estimated Setup Time**: 10-15 minutes

---

🎯 **Next Step**: Follow Step 1 above and open the Cloudflare Dashboard!
