#!/bin/bash

# MoodMash Deployment Readiness Check Script
# This script verifies that all required configuration is in place for deployment

set -e

echo "========================================="
echo "🔍 MoodMash Deployment Readiness Check"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

# ==========================================
# 1. Check Node.js and npm
# ==========================================
echo "📦 Checking Node.js and npm..."
echo ""

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    check_pass "Node.js installed: $NODE_VERSION"
else
    check_fail "Node.js not installed"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    check_pass "npm installed: $NPM_VERSION"
else
    check_fail "npm not installed"
fi

echo ""

# ==========================================
# 2. Check Wrangler CLI
# ==========================================
echo "🔧 Checking Wrangler CLI..."
echo ""

if command -v wrangler &> /dev/null || npx wrangler --version &> /dev/null 2>&1; then
    WRANGLER_VERSION=$(npx wrangler --version 2>/dev/null || echo "installed")
    check_pass "Wrangler CLI available: $WRANGLER_VERSION"
else
    check_fail "Wrangler CLI not installed. Run: npm install -g wrangler"
fi

echo ""

# ==========================================
# 3. Check Configuration Files
# ==========================================
echo "📄 Checking configuration files..."
echo ""

if [ -f "wrangler.jsonc" ] || [ -f "wrangler.toml" ]; then
    check_pass "Wrangler configuration file exists"
else
    check_fail "Wrangler configuration file not found (wrangler.jsonc or wrangler.toml)"
fi

if [ -f "package.json" ]; then
    check_pass "package.json exists"
else
    check_fail "package.json not found"
fi

if [ -f "tsconfig.json" ]; then
    check_pass "tsconfig.json exists"
else
    check_warn "tsconfig.json not found"
fi

if [ -d ".github/workflows" ]; then
    check_pass "GitHub Actions workflows directory exists"
else
    check_warn "GitHub Actions workflows not configured"
fi

echo ""

# ==========================================
# 4. Check Database Configuration
# ==========================================
echo "🗄️  Checking D1 database configuration..."
echo ""

if [ -f "wrangler.jsonc" ]; then
    if grep -q '"database_id"' wrangler.jsonc; then
        DATABASE_ID=$(grep -o '"database_id":\s*"[^"]*"' wrangler.jsonc | head -1 | cut -d'"' -f4)
        if [ "$DATABASE_ID" != "" ] && [ "$DATABASE_ID" != "STAGING_DATABASE_ID_PLACEHOLDER" ]; then
            check_pass "D1 database ID configured: ${DATABASE_ID:0:8}..."
        else
            check_warn "D1 database ID may be a placeholder - verify it's correct"
        fi
    else
        check_fail "D1 database not configured in wrangler.jsonc"
    fi
fi

if [ -d "migrations" ]; then
    MIGRATION_COUNT=$(ls migrations/*.sql 2>/dev/null | wc -l || echo "0")
    check_pass "Migrations directory exists with $MIGRATION_COUNT migration files"
else
    check_warn "Migrations directory not found"
fi

echo ""

# ==========================================
# 5. Check R2 Storage Configuration
# ==========================================
echo "📦 Checking R2 storage configuration..."
echo ""

if [ -f "wrangler.jsonc" ]; then
    if grep -q '"r2_buckets"' wrangler.jsonc; then
        R2_COUNT=$(grep -c '"bucket_name"' wrangler.jsonc || echo "0")
        check_pass "R2 buckets configured: $R2_COUNT buckets"
    else
        check_warn "R2 storage not configured in wrangler.jsonc"
    fi
fi

echo ""

# ==========================================
# 6. Check Environment Variables
# ==========================================
echo "🔐 Checking environment variables..."
echo ""

# Check for .dev.vars (local development)
if [ -f ".dev.vars" ]; then
    check_pass "Local development variables file exists (.dev.vars)"
else
    check_warn ".dev.vars not found - needed for local development"
fi

# List expected environment variables
echo "  Expected environment variables (set via wrangler secret):"
echo "    - GEMINI_API_KEY (AI features)"
echo "    - RESEND_API_KEY (Email)"
echo "    - FROM_EMAIL (Email sender)"
echo "    - TURNSTILE_SECRET_KEY (Bot protection)"
echo "    - GOOGLE_CLIENT_ID (OAuth)"
echo "    - GOOGLE_CLIENT_SECRET (OAuth)"
echo "    - GOOGLE_REDIRECT_URI (OAuth)"
echo "    - GITHUB_CLIENT_ID (OAuth)"
echo "    - GITHUB_CLIENT_SECRET (OAuth)"
echo "    - GITHUB_REDIRECT_URI (OAuth)"
echo "    - APP_URL (Application URL)"
echo ""

# ==========================================
# 7. Check Build
# ==========================================
echo "🏗️  Checking build..."
echo ""

if [ -d "node_modules" ]; then
    check_pass "Dependencies installed (node_modules exists)"
else
    check_warn "Dependencies not installed. Run: npm ci"
fi

if [ -d "dist" ]; then
    check_pass "Build output exists (dist directory)"
    if [ -f "dist/_worker.js" ]; then
        WORKER_SIZE=$(ls -lh dist/_worker.js | awk '{print $5}')
        check_pass "Worker bundle exists: $WORKER_SIZE"
    fi
else
    check_warn "Build not performed. Run: npm run build"
fi

echo ""

# ==========================================
# 8. Check GitHub Actions Secrets (Info)
# ==========================================
echo "🔑 GitHub Actions Secrets Required:"
echo ""
echo "   Set these in your repository settings:"
echo "   https://github.com/YOUR_USERNAME/moodmash/settings/secrets/actions"
echo ""
echo "   - CLOUDFLARE_API_TOKEN"
echo "   - CLOUDFLARE_ACCOUNT_ID"
echo ""

# ==========================================
# 9. Test Build
# ==========================================
echo "🧪 Running build test..."
echo ""

if npm run build > /dev/null 2>&1; then
    check_pass "Build completed successfully"
else
    check_fail "Build failed - check for errors"
fi

echo ""

# ==========================================
# Summary
# ==========================================
echo "========================================="
echo "📊 Summary"
echo "========================================="
echo ""
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Deployment readiness check passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure GitHub repository secrets"
    echo "2. Set Cloudflare environment secrets (wrangler secret put)"
    echo "3. Push to main branch to trigger deployment"
    exit 0
else
    echo -e "${RED}⚠️  Some checks failed. Please fix the issues above.${NC}"
    exit 1
fi
