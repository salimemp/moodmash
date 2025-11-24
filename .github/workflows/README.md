# GitHub Actions Workflows

This directory contains automated CI/CD workflows for MoodMash.

## 📁 Workflow Files

### `ci.yml` - Continuous Integration
- **Purpose**: Automated testing and validation
- **Triggers**: Push/PR to `main` or `develop`
- **Jobs**:
  - Lint & Type Check
  - Build Validation
  - Security Audit

### `deploy.yml` - Continuous Deployment
- **Purpose**: Automated deployment to Cloudflare Pages
- **Triggers**: Push to `main` (auto) or manual
- **Jobs**:
  - Build & Deploy
  - Post-Deployment Health Checks

### `database-migrations.yml` - Database Management
- **Purpose**: Safe production database migrations
- **Triggers**: Manual only (requires confirmation)
- **Jobs**:
  - Validate confirmation
  - Apply migrations
  - Health check

### `dependency-management.yml` - Dependency Scanning
- **Purpose**: Track updates and vulnerabilities
- **Triggers**: Weekly (Mondays 9 AM UTC) or manual
- **Jobs**:
  - Check outdated packages
  - Security scan
  - License compliance

## 🚀 Quick Start

### 1. Configure Secrets

Required secrets (see [CICD_SETUP.md](../CICD_SETUP.md)):
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### 2. Enable Workflows

Workflows are automatically enabled when pushed to GitHub.

### 3. Monitor Execution

Check workflow status:
- GitHub UI: Actions tab
- CLI: `gh run list`

## 🔄 Workflow Dependencies

```
Push to main
    │
    ├─→ CI (ci.yml)
    │       ├─→ Lint & Type Check
    │       ├─→ Build Validation
    │       └─→ Security Audit
    │
    └─→ CD (deploy.yml)
            ├─→ Deploy to Cloudflare
            └─→ Health Checks
```

## 📊 Status Badges

Add to your README.md:

```markdown
[![CI](https://github.com/salimemp/moodmash/actions/workflows/ci.yml/badge.svg)](https://github.com/salimemp/moodmash/actions/workflows/ci.yml)
[![CD](https://github.com/salimemp/moodmash/actions/workflows/deploy.yml/badge.svg)](https://github.com/salimemp/moodmash/actions/workflows/deploy.yml)
```

## 🛠️ Customization

### Modify deployment target:

Edit `deploy.yml`:
```yaml
command: pages deploy dist --project-name=your-project-name
```

### Change schedule:

Edit `dependency-management.yml`:
```yaml
schedule:
  - cron: '0 9 * * 1'  # Customize schedule
```

### Add new jobs:

Follow GitHub Actions syntax:
```yaml
jobs:
  your-job:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Your steps here
```

## 🔒 Security

- Secrets are encrypted at rest
- Logs are accessible only to repo collaborators
- API tokens have minimal required permissions

## 📚 Learn More

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Cloudflare Wrangler Action](https://github.com/cloudflare/wrangler-action)
- [Setup Guide](../CICD_SETUP.md)
