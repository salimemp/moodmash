# GitHub Actions Auto-Deploy Setup

Since your Cloudflare Pages project uses "Direct Upload" mode, we can set up GitHub Actions to automatically build and deploy on every push.

## 🔧 Setup Steps

### Step 1: Get Cloudflare API Token

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"**
3. Use template: **"Edit Cloudflare Workers"** 
4. Or create custom token with:
   - **Permissions**: 
     - Account > Cloudflare Pages > Edit
   - **Account Resources**:
     - Include > Your Account
5. Click **"Continue to summary"**
6. Click **"Create Token"**
7. **Copy the token** (you won't see it again!)

### Step 2: Add Token to GitHub Secrets

1. Go to: https://github.com/salimemp/moodmash/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `CLOUDFLARE_API_TOKEN`
4. Value: (paste the token from Step 1)
5. Click **"Add secret"**

### Step 3: Push the Workflow File

The workflow file has been created at `.github/workflows/deploy.yml`

```bash
cd /home/user/webapp
git add .github/workflows/deploy.yml
git commit -m "feat: Add GitHub Actions auto-deploy workflow"
git push origin main
```

### Step 4: Verify Workflow Runs

1. Go to: https://github.com/salimemp/moodmash/actions
2. You should see a new workflow run
3. Click on it to see progress
4. Wait ~5-7 minutes for build and deploy

## ✅ After Setup

Every `git push` to `main` will:
1. ✅ Trigger GitHub Actions
2. ✅ Build your project
3. ✅ Deploy to Cloudflare Pages (moodmash project)
4. ✅ Update https://moodmash.win

## 🎯 Benefits

- ✅ Automatic deployments
- ✅ Build logs in GitHub
- ✅ Works with existing project
- ✅ No need to create new project
- ✅ Unlimited build resources (GitHub servers)

## 📊 Workflow Status

You can monitor deployments at:
- GitHub Actions: https://github.com/salimemp/moodmash/actions
- Cloudflare Pages: https://dash.cloudflare.com/.../pages/view/moodmash/deployments
