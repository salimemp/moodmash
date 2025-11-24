#!/bin/bash

# Export all CI/CD workflow files for manual upload
# Usage: bash export-workflows.sh

echo "📦 Exporting CI/CD Workflow Files..."
echo "===================================="
echo ""

export_dir="./cicd-export"
mkdir -p "$export_dir"

# Copy workflow files
echo "📋 Copying workflow files..."
cp -r .github "$export_dir/"

# Create a checklist
cat > "$export_dir/UPLOAD_CHECKLIST.md" << 'EOF'
# CI/CD Files Upload Checklist

## 📋 Files to Upload to GitHub

Upload these files via GitHub web interface:

### Step 1: Create `.github/workflows/` directory structure

1. Go to: https://github.com/salimemp/moodmash
2. Click "Add file" → "Create new file"
3. Type: `.github/workflows/ci.yml` (this creates the directories)

### Step 2: Upload each workflow file

- [ ] `.github/workflows/ci.yml` (2.6 KB)
- [ ] `.github/workflows/deploy.yml` (3.5 KB)
- [ ] `.github/workflows/database-migrations.yml` (3.3 KB)
- [ ] `.github/workflows/dependency-management.yml` (3.2 KB)
- [ ] `.github/workflows/README.md` (2.7 KB)
- [ ] `.github/CICD_SETUP.md` (6.6 KB)

### Step 3: Configure GitHub Secrets

Go to: https://github.com/salimemp/moodmash/settings/secrets/actions

- [ ] CLOUDFLARE_API_TOKEN
- [ ] CLOUDFLARE_ACCOUNT_ID

### Step 4: Verify Setup

- [ ] Check Actions tab: https://github.com/salimemp/moodmash/actions
- [ ] Make test commit to trigger workflows
- [ ] Verify CI passes
- [ ] Verify CD deploys successfully

## 🎯 Quick Upload Instructions

For each file:
1. Open file in this export folder
2. Copy entire contents
3. Go to GitHub → Add file → Create new file
4. Paste file path as name (e.g., `.github/workflows/ci.yml`)
5. Paste contents
6. Commit directly to main

## ✅ Success Indicators

After setup:
- Workflows appear in Actions tab
- First push triggers CI
- Successful deployment to Cloudflare
- Health checks pass

---
Generated: $(date)
EOF

echo "✅ Export complete!"
echo ""
echo "📁 Files exported to: $export_dir/"
echo ""
echo "📋 Next steps:"
echo "  1. Review files in: $export_dir/"
echo "  2. Follow: $export_dir/UPLOAD_CHECKLIST.md"
echo "  3. Upload files to GitHub manually"
echo ""
echo "🔗 Quick links:"
echo "  - GitHub repo: https://github.com/salimemp/moodmash"
echo "  - Secrets: https://github.com/salimemp/moodmash/settings/secrets/actions"
echo "  - Actions: https://github.com/salimemp/moodmash/actions"
echo ""

# List exported files
echo "📦 Exported files:"
find "$export_dir" -type f | sort

echo ""
echo "✨ Ready for manual upload!"
