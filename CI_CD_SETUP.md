# GitHub Actions CI/CD Setup Instructions

## ⚠️ Manual Setup Required

Due to GitHub App permission restrictions, the CI/CD workflow file needs to be added manually to your repository.

## Setup Steps

### 1. Add the Workflow File

Create the file `.github/workflows/ci.yml` in your repository with the contents from the file in this directory.

**Via GitHub Web Interface:**
1. Go to https://github.com/salimemp/moodmash
2. Click "Add file" → "Create new file"
3. Type `.github/workflows/ci.yml` as the filename
4. Copy the entire contents of `ci.yml` from this directory
5. Commit the file

**Via Git Command Line:**
```bash
# Navigate to your repository
cd /home/user/webapp

# Add the workflow file (already exists locally)
git add .github/workflows/ci.yml

# Commit
git commit -m "ci: Add comprehensive CI/CD pipeline with 10 automated jobs"

# Push to GitHub
git push origin main
```

### 2. Verify Workflow Permissions

Ensure your GitHub repository has the following permissions:
1. Go to https://github.com/salimemp/moodmash/settings
2. Navigate to "Actions" → "General"
3. Under "Workflow permissions", select "Read and write permissions"
4. Check "Allow GitHub Actions to create and approve pull requests"
5. Click "Save"

### 3. Monitor Workflow Execution

After pushing the workflow file:
1. Go to https://github.com/salimemp/moodmash/actions
2. You should see the "CI/CD Pipeline" workflow
3. Click on a workflow run to see detailed logs
4. All 10 jobs should execute automatically on every push to main

## Workflow Overview

The CI/CD pipeline includes 10 automated jobs:

### 1. **Build and Test**
- TypeScript type checking
- Production build
- Build artifact upload

### 2. **Security Audit**
- npm audit for vulnerabilities
- Dependency security scanning

### 3. **Code Quality Check**
- Code formatting verification
- Console.log detection

### 4. **API Health Check** (Production only)
- Health endpoint testing
- Authentication endpoint verification
- PWA manifest validation

### 5. **Performance Check** (Production only)
- Homepage response time
- API response time
- Static asset loading time

### 6. **Database Migration Check**
- Migration file validation
- Migration count reporting

### 7. **PWA Validation**
- Manifest.json validation
- Service Worker verification
- Advanced PWA features check

### 8. **Mobile Responsiveness Check**
- Viewport configuration validation
- Responsive CSS verification (21+ media queries)
- Mobile-specific features check (touch gestures, bottom nav)

### 9. **Platform Sync Status**
- Comprehensive sync report generation
- Build status verification
- PWA status verification
- Mobile status verification
- Platform compatibility matrix

### 10. **Deployment Status** (Production only)
- Final deployment report
- All-systems-operational confirmation

## Workflow Triggers

The pipeline runs on:
- **Push to main**: Full pipeline with production checks
- **Push to develop**: Build and test only
- **Pull requests**: Build and test validation
- **Manual trigger**: Via GitHub Actions UI

## Environment Variables

The workflow uses the following environment:
- **Node.js Version**: 20 (LTS)
- **Build Command**: `npm run build`
- **Test Commands**: Automated checks for all features

## Expected Results

After successful setup, every push to main should:
- ✅ Build successfully
- ✅ Pass security audit
- ✅ Pass code quality checks
- ✅ Verify production API health
- ✅ Measure performance metrics
- ✅ Validate PWA configuration
- ✅ Verify mobile responsiveness
- ✅ Generate platform sync report
- ✅ Confirm deployment status

## Troubleshooting

### Workflow Not Running
- Check that the file is in `.github/workflows/ci.yml`
- Verify workflow permissions in repository settings
- Check GitHub Actions status page

### Build Failures
- Review the specific job logs in GitHub Actions
- Check for dependency issues: `npm audit`
- Verify TypeScript compilation: `npx tsc --noEmit`

### Production Health Check Failures
- Ensure https://moodmash.win is accessible
- Verify API endpoints are working
- Check Cloudflare Pages deployment status

## Manual Workflow Execution

To manually trigger the workflow:
1. Go to https://github.com/salimemp/moodmash/actions
2. Select "CI/CD Pipeline"
3. Click "Run workflow"
4. Select branch (main)
5. Click "Run workflow"

## Artifacts

The workflow generates and uploads:
- **Build artifacts**: Production build files (retained for 7 days)
- **Platform sync report**: Comprehensive sync status (retained for 30 days)

Access artifacts:
1. Go to workflow run
2. Scroll to "Artifacts" section
3. Download artifact files

## Next Steps

After adding the workflow:
1. Push a change to main branch
2. Monitor the workflow execution
3. Review the generated reports
4. Fix any failing checks
5. Set up branch protection rules (optional)

## Support

For issues or questions:
- Review workflow logs: https://github.com/salimemp/moodmash/actions
- Check GitHub Actions documentation: https://docs.github.com/en/actions
- Review CI/CD best practices: https://docs.github.com/en/actions/guides

---

**Status**: Ready for manual setup  
**Workflow File**: `.github/workflows/ci.yml` (in this directory)  
**Repository**: https://github.com/salimemp/moodmash
