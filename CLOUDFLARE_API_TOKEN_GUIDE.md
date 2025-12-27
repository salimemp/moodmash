# Cloudflare API Token Configuration Guide

**Report Date**: 2025-12-27  
**Project**: MoodMash  
**Purpose**: Complete guide for creating and configuring Cloudflare API tokens for GitHub Actions CI/CD

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Required Permissions](#required-permissions)
3. [Zone Resources Configuration](#zone-resources-configuration)
4. [Client IP Address Filtering](#client-ip-address-filtering)
5. [TTL (Time To Live)](#ttl-time-to-live)
6. [Step-by-Step Token Creation](#step-by-step-token-creation)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Token Templates](#token-templates)

---

## Executive Summary

### Quick Reference

**For Cloudflare Pages Deployment (Recommended):**

```yaml
Permissions:
  - Account Settings: Read
  - Cloudflare Pages: Edit

Account Resources:
  - Include: Specific account
  - Account: [Your Account Name] (d65655738594c6ac1a7011998a73e77d)

Zone Resources:
  - Not required for Pages deployment

Client IP Filtering:
  - Optional: GitHub Actions IP ranges (for enhanced security)
  - Recommended: Leave blank for simplicity

TTL (Time To Live):
  - Recommended: No expiration (permanent)
  - Alternative: 1 year (rotate annually)
  - Security-focused: 90 days (rotate quarterly)
```

---

## Required Permissions

### 1. Cloudflare Pages Deployment (Primary Use Case)

**Minimum Required Permissions:**

| Permission | Level | Purpose |
|------------|-------|---------|
| **Account Settings** | Read | Access account information |
| **Cloudflare Pages** | Edit | Deploy and manage Pages projects |

**Permission Details:**

#### Account Settings: Read
```yaml
Permission: Account Settings
Access Level: Read
Purpose: 
  - Query account information
  - List available resources
  - Verify account ownership
Required for: All Cloudflare operations
```

#### Cloudflare Pages: Edit
```yaml
Permission: Cloudflare Pages
Access Level: Edit
Purpose:
  - Create new deployments
  - Update existing deployments
  - Manage Pages projects
  - Upload build artifacts
  - Configure environment variables
  - Manage custom domains (optional)
Required for: Deployment via wrangler pages deploy
```

### 2. Additional Permissions (Optional)

Depending on your use case, you may need additional permissions:

#### Workers Scripts: Edit
```yaml
Permission: Workers Scripts
Access Level: Edit
Purpose:
  - Deploy Workers scripts
  - Update Workers code
  - Manage Workers KV namespaces
Required for: Workers-only deployments (not needed for Pages)
```

#### D1: Edit (If Using D1 Database)
```yaml
Permission: D1
Access Level: Edit
Purpose:
  - Create databases
  - Run migrations
  - Execute queries
  - Manage database resources
Required for: Projects using Cloudflare D1
Note: Usually managed via wrangler locally, not in CI/CD
```

#### KV Storage: Edit (If Using KV)
```yaml
Permission: Workers KV Storage
Access Level: Edit
Purpose:
  - Create KV namespaces
  - Write/read KV data
  - Manage KV resources
Required for: Projects using Cloudflare KV
```

#### R2: Edit (If Using R2 Storage)
```yaml
Permission: R2
Access Level: Edit
Purpose:
  - Create R2 buckets
  - Upload/manage objects
  - Configure bucket settings
Required for: Projects using Cloudflare R2
```

### 3. Permission Levels Explained

| Level | Description | Use Case |
|-------|-------------|----------|
| **Read** | View resources only | Health checks, monitoring |
| **Edit** | Create, update, delete | Deployments, CI/CD |
| **Admin** | Full control + billing | Account management |

**Recommendation:** Use **Edit** level for CI/CD deployments (minimum required).

---

## Zone Resources Configuration

### Understanding Zones vs Accounts

```
Cloudflare Structure:
├── Account (d65655738594c6ac1a7011998a73e77d)
│   ├── Cloudflare Pages Projects
│   │   └── moodmash
│   ├── Workers Scripts
│   ├── D1 Databases
│   ├── KV Namespaces
│   └── R2 Buckets
└── Zones (Domains)
    ├── moodmash.win
    ├── example.com
    └── ... (other domains)
```

### For Cloudflare Pages Deployment

**Zone Resources: NOT REQUIRED**

```yaml
Zone Resources Configuration:
  Include/Exclude: Not applicable
  Specific zones: Not needed
  
Reason:
  - Pages projects are account-level resources
  - Not tied to specific zones/domains
  - Custom domains managed separately
```

### When Zone Resources ARE Required

Zone resources are only needed if you're managing DNS, CDN, or zone-specific settings:

#### Use Case 1: DNS Management
```yaml
Permissions:
  - Zone: DNS: Edit
  
Zone Resources:
  - Include: Specific zone
  - Zone: moodmash.win
  
Purpose: Manage DNS records via API
```

#### Use Case 2: CDN/Cache Purge
```yaml
Permissions:
  - Zone: Cache Purge: Purge
  
Zone Resources:
  - Include: Specific zone
  - Zone: moodmash.win
  
Purpose: Clear CDN cache after deployment
```

#### Use Case 3: SSL/Certificate Management
```yaml
Permissions:
  - Zone: SSL and Certificates: Edit
  
Zone Resources:
  - Include: Specific zone
  - Zone: moodmash.win
  
Purpose: Manage SSL certificates
```

### Recommended Configuration for MoodMash

**For Standard Pages Deployment:**

```yaml
Account Resources:
  Include: Specific account
  Account: [Your Account] (d65655738594c6ac1a7011998a73e77d)

Zone Resources:
  Configuration: Not included (leave blank)
  
Why: Pages deployment only requires account-level access
```

**If You Need Custom Domain Management:**

```yaml
Account Resources:
  Include: Specific account
  Account: [Your Account] (d65655738594c6ac1a7011998a73e77d)

Additional Permissions:
  - Zone: DNS: Edit

Zone Resources:
  Include: Specific zone
  Zone: moodmash.win
  
Why: Allows Pages to configure custom domain DNS
```

---

## Client IP Address Filtering

### Overview

Client IP filtering restricts API token usage to specific IP addresses or ranges.

### Options

#### Option 1: No IP Filtering (Recommended for GitHub Actions)

```yaml
Client IP Address Filtering: Not configured
Status: Token works from any IP address

Pros:
  ✅ Works with GitHub Actions (dynamic IPs)
  ✅ No maintenance required
  ✅ Works with self-hosted runners
  ✅ Simple setup

Cons:
  ⚠️ Less secure if token is compromised
  ⚠️ Can be used from anywhere
```

**Recommendation:** Use for GitHub Actions unless you have specific security requirements.

#### Option 2: GitHub Actions IP Ranges (Enhanced Security)

```yaml
Client IP Address Filtering: GitHub Actions IP ranges
Status: Token only works from GitHub infrastructure

GitHub Actions IP Ranges (Periodically Updated):
  # Americas
  - 140.82.112.0/20
  - 143.55.64.0/20
  - 185.199.108.0/22
  - 192.30.252.0/22
  
  # Europe
  - 140.82.121.0/20
  - 143.55.64.0/20
  
  # Asia Pacific
  - 140.82.112.0/20
  
  # Full list: https://api.github.com/meta

Pros:
  ✅ More secure (GitHub IPs only)
  ✅ Prevents unauthorized use
  ✅ Auditability

Cons:
  ⚠️ Requires periodic updates
  ⚠️ May break if GitHub changes IPs
  ⚠️ Doesn't work with self-hosted runners
```

**How to Get Current GitHub IP Ranges:**

```bash
# Fetch current GitHub Actions IP ranges
curl https://api.github.com/meta | jq '.actions'

# Expected output:
{
  "actions": [
    "13.64.0.0/16",
    "13.65.0.0/16",
    "13.66.0.0/16",
    ... (many more)
  ]
}
```

#### Option 3: Specific IP Addresses (Self-Hosted Runners)

```yaml
Client IP Address Filtering: Your runner IPs
Status: Token only works from specified IPs

Example:
  - 203.0.113.10
  - 203.0.113.11
  - 198.51.100.0/24

Pros:
  ✅ Maximum security
  ✅ Full control
  ✅ Ideal for self-hosted infrastructure

Cons:
  ⚠️ Requires static IPs
  ⚠️ Maintenance overhead
  ⚠️ Doesn't work with GitHub-hosted runners
```

### Recommended Configuration

**For MoodMash Project:**

```yaml
Client IP Address Filtering: Not configured (blank)

Reasoning:
  1. GitHub Actions uses dynamic IP addresses
  2. GitHub IP ranges change periodically
  3. Simplicity and reliability over marginal security gain
  4. Token is stored as GitHub secret (already secure)
  5. Token has minimal permissions (account + Pages only)

Security Mitigation:
  - Token stored as encrypted GitHub secret
  - Limited to Pages Edit permission
  - Account-specific (not organization-wide)
  - Can be revoked instantly if compromised
  - Monitor usage in Cloudflare dashboard
```

### How to Add IP Filtering (If Needed)

**Step 1:** Get GitHub Actions IP ranges:
```bash
curl https://api.github.com/meta | jq -r '.actions[]'
```

**Step 2:** In Cloudflare token creation:
- Scroll to "Client IP Address Filtering"
- Click "Add"
- Enter each IP range on a new line
- Click "Continue"

**Step 3:** Test token:
```bash
# Should work from GitHub Actions
curl -X GET "https://api.cloudflare.com/client/v4/user" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should fail from your local machine (if IP restricted)
```

---

## TTL (Time To Live)

### Overview

TTL determines when the API token automatically expires.

### Options

#### Option 1: No Expiration (Permanent) - Recommended for Production

```yaml
TTL: No expiration
Expiration Date: Never

Pros:
  ✅ No maintenance required
  ✅ No unexpected CI/CD failures
  ✅ Reliable long-term automation
  ✅ Set-and-forget

Cons:
  ⚠️ Must manually rotate if compromised
  ⚠️ Requires periodic security reviews

Best for:
  - Production deployments
  - Critical CI/CD pipelines
  - Long-running projects
  - Teams with manual rotation policies
```

**Recommendation:** Use for MoodMash production deployments.

#### Option 2: 1 Year - Balanced Approach

```yaml
TTL: 1 year
Expiration Date: 2025-12-27 (set annually)

Pros:
  ✅ Forced annual security review
  ✅ Regular credential rotation
  ✅ Compliance-friendly
  ✅ Long enough to avoid frequent updates

Cons:
  ⚠️ Must remember to rotate annually
  ⚠️ CI/CD breaks if not renewed
  ⚠️ Requires calendar reminders

Best for:
  - Compliance requirements
  - Annual security audits
  - Regulated industries
  - Organizations with rotation policies

Calendar Reminder:
  - Set reminder 2 weeks before expiration
  - Create new token
  - Update GitHub secret
  - Test deployment
  - Revoke old token
```

#### Option 3: 90 Days - High Security

```yaml
TTL: 90 days (3 months)
Expiration Date: Rolling 90-day window

Pros:
  ✅ Maximum security
  ✅ Frequent credential rotation
  ✅ Limits exposure window
  ✅ PCI-DSS compliant

Cons:
  ⚠️ Requires quarterly rotation
  ⚠️ High maintenance overhead
  ⚠️ Risk of forgotten rotation
  ⚠️ Frequent CI/CD disruption

Best for:
  - High-security environments
  - Financial applications
  - Healthcare (HIPAA)
  - PCI-DSS compliance
  - Government projects

Automation Recommended:
  - Use automated token rotation
  - Set up monitoring alerts
  - Document rotation procedure
  - Maintain rotation calendar
```

#### Option 4: 30 Days - Testing/Development

```yaml
TTL: 30 days (1 month)
Expiration Date: Rolling 30-day window

Pros:
  ✅ Short-lived for testing
  ✅ Minimal risk if compromised
  ✅ Good for temporary projects

Cons:
  ⚠️ Monthly rotation required
  ⚠️ Not suitable for production
  ⚠️ High maintenance burden

Best for:
  - Development environments
  - Testing/staging deployments
  - Temporary projects
  - POC/demos
```

### Recommended Configuration for MoodMash

```yaml
TTL Configuration:

Production Token:
  TTL: No expiration
  Reason: Reliability and low maintenance
  Mitigation: 
    - Manual security review every 90 days
    - Monitor usage in Cloudflare dashboard
    - Revoke immediately if suspicious activity
    - Document in SECURITY_AUDIT_REPORT.md

Development Token (if separate):
  TTL: 90 days
  Reason: More frequent rotation for testing
  Mitigation:
    - Set calendar reminder 2 weeks before expiry
    - Documented rotation procedure
    - Backup token overlap period
```

### Token Rotation Strategy

**Recommended Approach (Even with No Expiration):**

```yaml
Rotation Schedule: Every 90 days (quarterly)

Process:
  Week 1: Create new token
    - Generate new token with same permissions
    - Document token ID and creation date
    - Test token locally with wrangler
  
  Week 2: Update GitHub secret
    - Update CLOUDFLARE_API_TOKEN secret
    - Trigger test deployment
    - Verify deployment succeeds
    - Monitor for issues
  
  Week 3: Grace period
    - Keep old token active
    - Monitor both tokens
    - Ensure no fallback usage
  
  Week 4: Revoke old token
    - Revoke old token in Cloudflare
    - Remove from local environments
    - Document rotation in security log

Automation:
  - Set calendar reminder 85 days from creation
  - Create ticket/issue for rotation
  - Update SECURITY_AUDIT_REPORT.md
  - Notify team via Slack/email
```

### Monitoring Token Expiration

**Cloudflare Dashboard:**
```
Navigate to: Profile → API Tokens
View: Token list with expiration dates
Filter: Expiring soon (within 30 days)
Action: Rotate tokens proactively
```

**Automated Monitoring (Optional):**
```bash
# Check token expiration via API
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Response includes expiration info:
{
  "success": true,
  "result": {
    "id": "token_id",
    "status": "active",
    "not_before": "2024-12-27T00:00:00Z",
    "expires_on": null  # null = no expiration
  }
}
```

---

## Step-by-Step Token Creation

### Complete Process for MoodMash Deployment

#### Step 1: Access Cloudflare API Tokens

1. Log in to Cloudflare: https://dash.cloudflare.com
2. Click on your profile icon (top right)
3. Select **"API Tokens"**
4. Or visit directly: https://dash.cloudflare.com/profile/api-tokens

#### Step 2: Create New Token

1. Click **"Create Token"** button
2. You'll see template options (recommended to start from template)

#### Step 3: Choose Template (Recommended)

**Option A: Use "Edit Cloudflare Workers" Template**

```yaml
Template: Edit Cloudflare Workers
Status: Pre-configured with recommended permissions
Action: Click "Use template"

Pre-configured Permissions:
  - Account Settings: Read ✅
  - Workers Scripts: Edit (change to "Cloudflare Pages: Edit")
```

**Option B: Create Custom Token**

```yaml
Template: Create Custom Token
Status: Manual configuration required
Action: Click "Create Custom Token"
```

#### Step 4: Configure Token Permissions

**Token Name:**
```yaml
Name: GitHub Actions - MoodMash Deployment
Purpose: Clearly identifies token purpose
Format: [Use Case] - [Project Name] [Environment]

Examples:
  - "GitHub Actions - MoodMash Production"
  - "CI/CD - MoodMash Pages Deploy"
  - "Auto-Deploy - MoodMash Main Branch"
```

**Permissions:**
```yaml
Add Permissions:

1. Account Settings
   Scope: Account
   Level: Read
   Action: Select from dropdown

2. Cloudflare Pages
   Scope: Account
   Level: Edit
   Action: Select from dropdown

Result: 2 permissions configured
```

**Visual Representation:**
```
┌─────────────────────────────────────────────┐
│ Permissions                                  │
├─────────────────────────────────────────────┤
│ Account Settings             [Read    ▼]    │
│ Cloudflare Pages            [Edit    ▼]    │
│                                    [+ Add]  │
└─────────────────────────────────────────────┘
```

#### Step 5: Configure Account Resources

**Account Resources:**
```yaml
Resource Type: Account
Configuration: Include
Scope: Specific account

Action:
  1. Select "Include" from dropdown
  2. Choose "Specific account"
  3. Select your account from list
     Example: [Your Account Name] (d65655738594c6ac1a7011998a73e77d)

Result: Token restricted to your specific account
```

**Visual Representation:**
```
┌─────────────────────────────────────────────┐
│ Account Resources                            │
├─────────────────────────────────────────────┤
│ [Include ▼] [Specific account ▼]           │
│                                              │
│ ☑ [Your Account Name]                       │
│   Account ID: d65655738594c6ac...           │
└─────────────────────────────────────────────┘
```

#### Step 6: Configure Zone Resources (Skip)

**Zone Resources:**
```yaml
Configuration: Not needed for Pages deployment
Action: Leave blank / Skip this section

Visual:
┌─────────────────────────────────────────────┐
│ Zone Resources                               │
├─────────────────────────────────────────────┤
│ Not required for this token                 │
│                                              │
│ [Skip] ←                                     │
└─────────────────────────────────────────────┘
```

#### Step 7: Configure Client IP Filtering (Optional)

**Recommended for MoodMash:**
```yaml
Client IP Address Filtering: Leave blank
Action: Skip this section

Visual:
┌─────────────────────────────────────────────┐
│ Client IP Address Filtering                 │
├─────────────────────────────────────────────┤
│ (Optional) Restrict token to specific IPs  │
│                                              │
│ [No restrictions] ← Recommended              │
└─────────────────────────────────────────────┘
```

**If Enhanced Security Needed:**
```yaml
Action:
  1. Click "Add IP address"
  2. Enter GitHub Actions IP ranges:
     - 140.82.112.0/20
     - 143.55.64.0/20
     - 185.199.108.0/22
     - 192.30.252.0/22
  3. Click "Add" for each range

Note: Requires periodic updates as GitHub IPs change
```

#### Step 8: Configure TTL

**Recommended for Production:**
```yaml
TTL: No expiration
Action: Leave at default "No expiration"

Visual:
┌─────────────────────────────────────────────┐
│ TTL (Time to Live)                          │
├─────────────────────────────────────────────┤
│ ⦿ No expiration (Recommended)               │
│ ○ Expires on: [Date picker]                │
│                                              │
│ Manual rotation: Every 90 days              │
└─────────────────────────────────────────────┘
```

**Alternative (Annual Rotation):**
```yaml
TTL: Expires on
Action: 
  1. Select "Expires on"
  2. Click date picker
  3. Select date 1 year from now
     Example: 2025-12-27
  4. Set calendar reminder 2 weeks before
```

#### Step 9: Review and Create

1. Review all settings:
```yaml
Summary:
  Name: GitHub Actions - MoodMash Deployment
  Permissions:
    - Account Settings: Read
    - Cloudflare Pages: Edit
  Account Resources:
    - [Your Account] (d65655738594c6ac1a7011998a73e77d)
  Zone Resources: None
  IP Filtering: None
  TTL: No expiration
```

2. Click **"Continue to summary"**

3. Review final summary page

4. Click **"Create Token"**

#### Step 10: Save Token (CRITICAL)

**⚠️ IMPORTANT: Token is only shown once!**

```yaml
Action Required:
  1. Copy token immediately (40-character string)
  2. Store in password manager
  3. Add to GitHub secrets
  4. Do NOT close page until saved

Token Format:
  Example: abc123def456ghi789jkl012mno345pqr678stu9

Length: 40 characters
Characters: Alphanumeric (a-z, A-Z, 0-9)
```

**Storage Locations:**

1. **GitHub Secrets** (Primary - Required):
```
Repository: github.com/salimemp/moodmash
Path: Settings → Secrets and variables → Actions
Name: CLOUDFLARE_API_TOKEN
Value: [40-character token]
```

2. **Password Manager** (Backup - Recommended):
```
Services: 1Password, LastPass, Bitwarden, etc.
Entry Name: Cloudflare API Token - MoodMash GitHub Actions
Fields:
  - Token: [40-character token]
  - Account ID: d65655738594c6ac1a7011998a73e77d
  - Created: 2025-12-27
  - Purpose: CI/CD deployment to Cloudflare Pages
  - Rotation: Every 90 days (2025-03-27)
```

3. **Local Development** (.dev.vars - Optional):
```bash
# /home/user/webapp/.dev.vars
CLOUDFLARE_API_TOKEN=abc123def456ghi789jkl012mno345pqr678stu9
CLOUDFLARE_ACCOUNT_ID=d65655738594c6ac1a7011998a73e77d
```

**⚠️ Never commit tokens to git:**
```bash
# Ensure .dev.vars is in .gitignore
echo ".dev.vars" >> .gitignore
```

#### Step 11: Test Token

**Local Test:**
```bash
# Set token as environment variable
export CLOUDFLARE_API_TOKEN="your-token-here"

# Test authentication
npx wrangler whoami

# Expected output:
# Getting User settings...
# 👋 You are logged in with an API Token, associated with the email 'your@email.com'!
# ┌──────────────────────┬──────────────────────────────────┐
# │ Account Name         │ Account ID                        │
# ├──────────────────────┼──────────────────────────────────┤
# │ [Your Account]       │ d65655738594c6ac1a7011998a73e77d │
# └──────────────────────┴──────────────────────────────────┘
```

**GitHub Actions Test:**
```bash
# After adding token to GitHub secrets
git commit --allow-empty -m "ci: Test Cloudflare token"
git push origin main

# Monitor workflow
# Visit: https://github.com/salimemp/moodmash/actions
# Verify: Deploy to Production job succeeds
```

#### Step 12: Document Token

**Create Token Record:**
```yaml
Token Documentation:
  Location: SECURITY_AUDIT_REPORT.md or password manager
  
  Token ID: [From Cloudflare dashboard]
  Token Name: GitHub Actions - MoodMash Deployment
  Created Date: 2025-12-27
  Created By: [Your Name/Email]
  Expiration: No expiration
  Next Rotation: 2025-03-27 (90 days)
  
  Permissions:
    - Account Settings: Read
    - Cloudflare Pages: Edit
  
  Account: [Your Account] (d65655738594c6ac1a7011998a73e77d)
  
  Used By:
    - GitHub Actions (salimemp/moodmash)
    - Project: MoodMash PWA
    - Workflow: .github/workflows/ci.yml
  
  Status: Active
  Last Verified: 2025-12-27
  
  Rotation Schedule:
    - Frequency: Every 90 days
    - Next Rotation: 2025-03-27
    - Reminder: Set 2 weeks before (2025-03-13)
  
  Security:
    - IP Filtering: None (GitHub Actions)
    - Storage: GitHub Secrets (encrypted)
    - Access: Repository admins only
    - Monitoring: Cloudflare dashboard
```

---

## Security Best Practices

### Token Security Checklist

```yaml
✅ Minimum Permissions:
   - Only grant permissions actually needed
   - Use Read instead of Edit when possible
   - Avoid Admin permissions for CI/CD

✅ Scope Restrictions:
   - Limit to specific accounts
   - Don't use "All accounts"
   - Limit to specific zones if needed

✅ TTL Configuration:
   - Set expiration for high-security environments
   - Use "No expiration" with manual rotation for production
   - Document rotation schedule

✅ IP Filtering (Optional):
   - Consider for enhanced security
   - Use GitHub Actions IP ranges
   - Keep IP list updated

✅ Secure Storage:
   - Store in GitHub Secrets (encrypted)
   - Never commit to git
   - Use password manager for backup
   - Add to .gitignore (.dev.vars, .env)

✅ Access Control:
   - Limit who can view/edit GitHub secrets
   - Use repository protection rules
   - Audit secret access logs

✅ Monitoring:
   - Review token usage in Cloudflare dashboard
   - Set up alerts for unusual activity
   - Monitor API request logs
   - Track deployment frequency

✅ Rotation:
   - Rotate every 90 days (recommended)
   - Set calendar reminders
   - Document rotation procedure
   - Keep backup token during transition

✅ Revocation:
   - Revoke immediately if compromised
   - Revoke unused/old tokens
   - Revoke when team members leave
   - Document revocation reasons

✅ Documentation:
   - Document token purpose
   - Record creation date
   - Track rotation schedule
   - Maintain security audit log
```

### Emergency Response Plan

**If Token is Compromised:**

```yaml
Step 1: Immediate Revocation (0-5 minutes)
  1. Log in to Cloudflare dashboard
  2. Navigate to Profile → API Tokens
  3. Find compromised token
  4. Click "Revoke" immediately
  5. Confirm revocation

Step 2: Assess Impact (5-15 minutes)
  1. Check Cloudflare audit logs
  2. Review recent deployments
  3. Check for unauthorized changes
  4. Document suspicious activity
  5. Notify team/management

Step 3: Create New Token (15-25 minutes)
  1. Follow token creation process
  2. Use same permissions
  3. Update GitHub secrets
  4. Test deployment
  5. Verify functionality

Step 4: Investigation (25-60 minutes)
  1. How was token compromised?
  2. What systems were affected?
  3. Were other tokens compromised?
  4. Update security procedures
  5. Document incident

Step 5: Prevention (Ongoing)
  1. Review all token permissions
  2. Audit access logs
  3. Update security policies
  4. Train team members
  5. Implement additional safeguards
```

### Token Storage Security

**DO:**
```yaml
✅ Store in GitHub Secrets (encrypted at rest)
✅ Use password manager for backup (1Password, LastPass, Bitwarden)
✅ Use environment variables for local development (.dev.vars)
✅ Add token files to .gitignore
✅ Encrypt backup copies
✅ Use separate tokens for dev/staging/production
✅ Document token locations and purposes
```

**DON'T:**
```yaml
❌ Commit tokens to git repositories
❌ Share tokens via email/Slack/chat
❌ Store in plaintext files
❌ Use same token across multiple projects
❌ Share tokens between team members
❌ Log tokens in application logs
❌ Display tokens in UI/dashboards
❌ Store in browser localStorage/cookies
❌ Include in error messages
❌ Post in public forums/Stack Overflow
```

### Monitoring and Auditing

**Regular Security Audits:**

```yaml
Weekly:
  - Review recent API activity
  - Check for unusual deployment patterns
  - Verify token status (active/revoked)

Monthly:
  - Full token inventory
  - Remove unused tokens
  - Update documentation
  - Review access logs

Quarterly (Every 90 days):
  - Rotate all active tokens
  - Security team review
  - Update security procedures
  - Train new team members

Annually:
  - Comprehensive security audit
  - Review all token permissions
  - Update security policies
  - External security assessment
```

**Cloudflare Dashboard Monitoring:**

```
Navigate to: Account → Analytics → Logs

Monitor:
  - API request frequency
  - Failed authentication attempts
  - Unusual IP addresses
  - Off-hours activity
  - Deployment patterns

Set Alerts for:
  - Multiple failed auth attempts
  - Deployments from new IPs
  - API rate limit hits
  - Unusual request patterns
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "Authentication Error" in GitHub Actions

**Symptoms:**
```
Error: Authentication error
Error: 10000: Authentication error
```

**Possible Causes:**
1. Token not added to GitHub secrets
2. Incorrect token value (copy/paste error)
3. Token expired
4. Token revoked
5. Wrong account ID

**Solutions:**
```yaml
Solution 1: Verify GitHub Secret Exists
  1. Go to: github.com/salimemp/moodmash/settings/secrets/actions
  2. Confirm CLOUDFLARE_API_TOKEN exists
  3. Check creation/update date
  4. Re-add if missing

Solution 2: Verify Token is Active
  1. Log in to Cloudflare dashboard
  2. Go to: Profile → API Tokens
  3. Check token status (should be "Active")
  4. If "Revoked" or "Expired", create new token

Solution 3: Test Token Locally
  export CLOUDFLARE_API_TOKEN="your-token"
  npx wrangler whoami
  
  If fails: Token is invalid, create new one
  If succeeds: Issue is with GitHub configuration

Solution 4: Verify Account ID
  1. Check CLOUDFLARE_ACCOUNT_ID secret
  2. Should be: d65655738594c6ac1a7011998a73e77d
  3. Verify in Cloudflare dashboard
  4. Update if incorrect

Solution 5: Create New Token
  1. Revoke old token
  2. Create new token (follow guide above)
  3. Update GitHub secrets
  4. Test deployment
```

#### Issue 2: "Insufficient Permissions"

**Symptoms:**
```
Error: Insufficient permissions
Error: You do not have permission to perform this action
```

**Cause:** Token doesn't have required permissions

**Solution:**
```yaml
Step 1: Check Required Permissions
  Required:
    - Account Settings: Read
    - Cloudflare Pages: Edit

Step 2: Verify Token Permissions
  1. Cloudflare Dashboard → Profile → API Tokens
  2. Find token
  3. Click "Edit" or view details
  4. Verify permissions match requirements

Step 3: Create New Token with Correct Permissions
  If permissions are wrong:
    1. Cannot edit existing token permissions
    2. Must create new token
    3. Follow Step-by-Step guide above
    4. Add correct permissions
    5. Update GitHub secrets
    6. Revoke old token
```

#### Issue 3: "Account Not Found"

**Symptoms:**
```
Error: Account not found
Error: Invalid account ID
```

**Cause:** Wrong account ID in configuration

**Solution:**
```yaml
Step 1: Get Correct Account ID
  Method 1: Cloudflare Dashboard
    1. Log in to Cloudflare
    2. Go to any page
    3. Check URL: dash.cloudflare.com/[ACCOUNT_ID]/...
    4. Copy account ID
  
  Method 2: API
    curl -X GET "https://api.cloudflare.com/client/v4/accounts" \
      -H "Authorization: Bearer YOUR_TOKEN" | jq '.result[].id'

Step 2: Update Account ID
  For MoodMash: d65655738594c6ac1a7011998a73e77d
  
  Update in:
    1. GitHub secret: CLOUDFLARE_ACCOUNT_ID
    2. wrangler.jsonc (if hardcoded)
    3. CI/CD workflow (if referenced)

Step 3: Test
  git push origin main
  Monitor: github.com/salimemp/moodmash/actions
```

#### Issue 4: Token Works Locally but Fails in CI/CD

**Symptoms:**
```
Local: ✅ npx wrangler whoami succeeds
CI/CD: ❌ Authentication error
```

**Possible Causes:**
1. IP filtering blocking GitHub Actions IPs
2. GitHub secret not configured
3. Typo in secret name
4. Account resource restriction

**Solutions:**
```yaml
Solution 1: Check IP Filtering
  1. Cloudflare Dashboard → Profile → API Tokens
  2. View token details
  3. Check "Client IP Address Filtering"
  4. If restricted:
     - Add GitHub Actions IP ranges
     - Or remove IP filtering

Solution 2: Verify Secret Name
  In .github/workflows/ci.yml:
    Should be: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    Not: ${{ secrets.CLOUDFLARE_TOKEN }}
    Not: ${{ secrets.CF_API_TOKEN }}
  
  Secret name must match exactly

Solution 3: Check Account Resources
  1. Cloudflare Dashboard → API Tokens
  2. View token account resources
  3. Should include your account
  4. If "All accounts" or wrong account, recreate token

Solution 4: Test in Workflow
  Add debug step to workflow:
    - name: Debug Token
      run: |
        echo "Token length: ${#CLOUDFLARE_API_TOKEN}"
        npx wrangler whoami
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

#### Issue 5: Token Expired

**Symptoms:**
```
Error: Token expired
Error: 10000: Authentication error (token expired)
```

**Solution:**
```yaml
Step 1: Verify Expiration
  1. Cloudflare Dashboard → Profile → API Tokens
  2. Check token "Expires" column
  3. If expired, will show past date

Step 2: Create New Token
  1. Cannot extend expired tokens
  2. Must create new token
  3. Follow Step-by-Step guide
  4. Update GitHub secrets
  5. Test deployment

Step 3: Set Reminders
  For future tokens:
    1. Use "No expiration" for production
    2. Or set calendar reminder 2 weeks before expiry
    3. Document rotation schedule
    4. Automate reminder process
```

#### Issue 6: Rate Limiting

**Symptoms:**
```
Error: Rate limit exceeded
Error: Too many requests
```

**Solution:**
```yaml
Understanding Rate Limits:
  Cloudflare API: 1,200 requests per 5 minutes
  Per endpoint: Varies by endpoint
  Deployment: Usually well within limits

If Hit Rate Limit:
  1. Wait 5 minutes
  2. Check for deployment loops
  3. Review workflow triggers
  4. Avoid rapid re-deployments

Prevention:
  - Don't trigger multiple deployments simultaneously
  - Use deployment conditions in workflow
  - Cache build artifacts
  - Optimize workflow
```

---

## Token Templates

### Template 1: Production Deployment (Recommended)

```yaml
Token Name: GitHub Actions - MoodMash Production
Purpose: Automated deployment to Cloudflare Pages

Permissions:
  - Account Settings: Read
  - Cloudflare Pages: Edit

Account Resources:
  Include: Specific account
  Account: [Your Account] (d65655738594c6ac1a7011998a73e77d)

Zone Resources: None

Client IP Filtering: None
  Reason: GitHub Actions uses dynamic IPs

TTL: No expiration
  Rotation: Manual every 90 days

Use Case:
  - CI/CD deployment via GitHub Actions
  - Automatic deployment on push to main
  - Production environment

Security Level: Medium-High
  - Minimal permissions (Pages Edit only)
  - Account-specific
  - Stored as encrypted GitHub secret
  - Regular manual rotation
```

### Template 2: Enhanced Security with IP Filtering

```yaml
Token Name: GitHub Actions - MoodMash Secure Deploy
Purpose: High-security automated deployment

Permissions:
  - Account Settings: Read
  - Cloudflare Pages: Edit

Account Resources:
  Include: Specific account
  Account: [Your Account] (d65655738594c6ac1a7011998a73e77d)

Zone Resources: None

Client IP Filtering: GitHub Actions IP ranges
  IPs:
    - 140.82.112.0/20
    - 143.55.64.0/20
    - 185.199.108.0/22
    - 192.30.252.0/22
  Maintenance: Update quarterly

TTL: 90 days
  Rotation: Automatic every 90 days

Use Case:
  - High-security production deployment
  - Compliance requirements
  - Sensitive applications

Security Level: High
  - IP-restricted to GitHub Actions
  - Quarterly rotation
  - Audit logging
  
Maintenance:
  - Update IP ranges every 90 days
  - Rotate token on schedule
  - Monitor usage weekly
```

### Template 3: Development/Testing

```yaml
Token Name: MoodMash Development - Local Testing
Purpose: Local development and testing

Permissions:
  - Account Settings: Read
  - Cloudflare Pages: Edit
  - D1: Edit (if needed)
  - KV Storage: Edit (if needed)

Account Resources:
  Include: Specific account
  Account: [Your Account] (d65655738594c6ac1a7011998a73e77d)

Zone Resources: None

Client IP Filtering: Your office/home IP
  IPs:
    - 203.0.113.10 (your IP)

TTL: 30 days
  Reason: Short-lived for testing

Use Case:
  - Local development
  - Testing deployments
  - Database migrations
  - Development environment

Security Level: Medium
  - Limited to developer IP
  - Short TTL
  - More permissions for testing
  
Note: Do NOT use for production
```

### Template 4: Manual Deployment

```yaml
Token Name: MoodMash Manual Deploy - Emergency
Purpose: Manual emergency deployments

Permissions:
  - Account Settings: Read
  - Cloudflare Pages: Edit

Account Resources:
  Include: Specific account
  Account: [Your Account] (d65655738594c6ac1a7011998a73e77d)

Zone Resources: None

Client IP Filtering: None
  Reason: May need to deploy from anywhere

TTL: 24 hours
  Reason: Emergency use only

Use Case:
  - Emergency hotfixes
  - CI/CD outages
  - Urgent manual deployments
  - Disaster recovery

Security Level: Medium
  - Short-lived (24 hours)
  - Minimal permissions
  - Create only when needed
  
Process:
  1. Create token only during emergency
  2. Deploy manually via wrangler
  3. Revoke immediately after use
  4. Document usage in incident log
```

### Template 5: Read-Only Monitoring

```yaml
Token Name: MoodMash Monitoring - Read Only
Purpose: Monitoring and health checks

Permissions:
  - Account Settings: Read
  - Cloudflare Pages: Read (not Edit)

Account Resources:
  Include: Specific account
  Account: [Your Account] (d65655738594c6ac1a7011998a73e77d)

Zone Resources: None

Client IP Filtering: Monitoring service IP
  IPs:
    - [Your monitoring service IPs]

TTL: 1 year
  Reason: Long-lived for continuous monitoring

Use Case:
  - Health checks
  - Status monitoring
  - Deployment verification
  - Analytics collection

Security Level: Low-risk (Read-only)
  - Cannot modify anything
  - Safe for long-term use
  - Suitable for third-party monitoring
```

---

## Summary and Recommendations

### For MoodMash Project

**Recommended Configuration:**

```yaml
Token Setup:
  Name: GitHub Actions - MoodMash Deployment
  
  Permissions:
    - Account Settings: Read ✅
    - Cloudflare Pages: Edit ✅
  
  Account Resources:
    - Include: Specific account ✅
    - Account ID: d65655738594c6ac1a7011998a73e77d ✅
  
  Zone Resources:
    - Not required ✅
  
  Client IP Filtering:
    - Not configured (blank) ✅
    - Reason: GitHub Actions compatibility
  
  TTL:
    - No expiration ✅
    - Manual rotation: Every 90 days
    - Next rotation: 2025-03-27

Security Measures:
  - Stored as GitHub secret (encrypted)
  - Minimal permissions (only what's needed)
  - Account-specific (not org-wide)
  - Regular manual rotation
  - Monitoring via Cloudflare dashboard
  - Documented in security audit

Implementation:
  1. Create token following guide above
  2. Add to GitHub secrets as CLOUDFLARE_API_TOKEN
  3. Add account ID as CLOUDFLARE_ACCOUNT_ID
  4. Test deployment
  5. Document in SECURITY_AUDIT_REPORT.md
  6. Set 90-day rotation reminder
```

### Quick Start Checklist

```yaml
☐ Create Cloudflare API token
  ☐ Navigate to: dash.cloudflare.com/profile/api-tokens
  ☐ Click "Create Token"
  ☐ Use "Edit Cloudflare Workers" template
  ☐ Change to "Cloudflare Pages: Edit"

☐ Configure permissions
  ☐ Account Settings: Read
  ☐ Cloudflare Pages: Edit

☐ Configure resources
  ☐ Account: d65655738594c6ac1a7011998a73e77d
  ☐ Zone: Not required
  ☐ IP Filtering: None
  ☐ TTL: No expiration

☐ Save token securely
  ☐ Copy 40-character token
  ☐ Add to GitHub secrets: CLOUDFLARE_API_TOKEN
  ☐ Add account ID: CLOUDFLARE_ACCOUNT_ID
  ☐ Save backup in password manager

☐ Test token
  ☐ Local: npx wrangler whoami
  ☐ CI/CD: git push origin main
  ☐ Verify deployment succeeds

☐ Document
  ☐ Update SECURITY_AUDIT_REPORT.md
  ☐ Set 90-day rotation reminder
  ☐ Add to team documentation
```

---

## Additional Resources

### Official Documentation

- **Cloudflare API Tokens**: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
- **Cloudflare Pages Deployment**: https://developers.cloudflare.com/pages/platform/deploy-via-api/
- **Wrangler Configuration**: https://developers.cloudflare.com/workers/wrangler/configuration/
- **GitHub Actions Secrets**: https://docs.github.com/en/actions/security-guides/encrypted-secrets

### Project Documentation

- **SECURITY_AUDIT_REPORT.md**: Complete security audit
- **GITHUB_SECRETS_VALIDATION.md**: GitHub secrets verification
- **CI_CD_STATUS_REPORT.md**: CI/CD pipeline status
- **DEPLOYMENT_SETUP.md**: Deployment configuration

### Support

- **Cloudflare Community**: https://community.cloudflare.com/
- **Cloudflare Support**: https://dash.cloudflare.com/support
- **GitHub Support**: https://support.github.com/

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-27  
**Maintained By**: MoodMash Development Team  
**Review Schedule**: Quarterly (every 90 days)

---

**END OF GUIDE**
