# GitHub Actions CI/CD Setup Instructions

## Issue: Permission Error

The GitHub App used in this sandbox doesn't have permission to create workflow files.

## Solution: Manual Setup Required

### Step 1: Add Secrets to GitHub

Go to: https://github.com/salimemp/moodmash/settings/secrets/actions

Add these secrets:
1. **CLOUDFLARE_API_TOKEN**: Your Cloudflare API token
2. **CLOUDFLARE_ACCOUNT_ID**: `d65655738594c6ac1a7011998a73e77d`

### Step 2: Create Workflow File

1. Go to: https://github.com/salimemp/moodmash
2. Click: **Add file** → **Create new file**
3. Filename: `.github/workflows/ci-cd.yml`
4. Copy content from: `/home/user/webapp/.github/workflows/ci-cd.yml`
5. Commit the file

### Step 3: Workflow Will Run Automatically

The workflow will:
- ✅ Run on every push to main
- ✅ Deploy to Cloudflare Pages automatically
- ✅ Run health checks
- ✅ Create preview deployments for PRs

## Workflow File Location

The complete workflow file is ready at:
`/home/user/webapp/.github/workflows/ci-cd.yml`

You can view it in the sandbox or copy it manually to GitHub.

## What the Workflow Does

1. **Lint and Test**: Checks code quality, runs build
2. **Security Scan**: npm audit, secrets detection
3. **Deploy Production**: Auto-deploy to https://moodmash.win
4. **Deploy Preview**: Preview deployments for PRs
5. **Database Migrations**: Auto-run D1 migrations
6. **Health Check**: Verify deployment after deploy
7. **Notifications**: Report success/failure

## Monitor Workflows

After setup: https://github.com/salimemp/moodmash/actions
