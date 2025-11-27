# Sentry.io Setup Guide for MoodMash

**Account:** salimemp  
**Email:** salimmakrana@gmail.com

---

## 🚀 Quick Setup Steps

### Step 1: Create Sentry Project

1. **Login to Sentry.io:**
   - Go to https://sentry.io/auth/login/
   - Login with: salimmakrana@gmail.com

2. **Create New Project:**
   - Click "Projects" → "Create Project"
   - **Platform:** Select "Cloudflare Workers"
   - **Project Name:** `moodmash`
   - **Alert Frequency:** "Alert me on every new issue"
   - Click "Create Project"

3. **Get Your DSN (Data Source Name):**
   - After creating project, you'll see the DSN
   - Format: `https://[KEY]@[ORG].ingest.sentry.io/[PROJECT_ID]`
   - Example: `https://abc123def456@o123456.ingest.sentry.io/7890123`
   - **Copy this DSN** - you'll need it for configuration

---

## 🔧 Configuration in Cloudflare

### Method 1: Using Wrangler (Recommended)

```bash
# Add Sentry DSN as a secret
cd /home/user/webapp
npx wrangler secret put SENTRY_DSN --project-name moodmash

# When prompted, paste your DSN from Sentry
# Example: https://abc123def456@o123456.ingest.sentry.io/7890123
```

### Method 2: Using Cloudflare Dashboard

1. Go to https://dash.cloudflare.com/
2. Select "Workers & Pages"
3. Click on "moodmash" project
4. Go to "Settings" → "Environment Variables"
5. Click "Add Variable"
   - **Name:** `SENTRY_DSN`
   - **Value:** Paste your DSN from Sentry
   - **Type:** Secret (encrypted)
6. Click "Save"

---

## 🧪 Local Development Setup

For local testing, create `.dev.vars` file:

```bash
# .dev.vars (for local development only)
SENTRY_DSN=https://[KEY]@[ORG].ingest.sentry.io/[PROJECT_ID]
```

**Important:** `.dev.vars` is already in `.gitignore` - never commit secrets!

---

## 📊 Sentry Project Configuration

### Recommended Settings:

1. **Alert Rules:**
   - Go to "Alerts" → "Create Alert"
   - **Alert Type:** "Issues"
   - **Conditions:**
     - "When an event is first seen" → Notify immediately
     - "When event count >= 10 in 1 hour" → High error rate alert
   - **Actions:**
     - Email: salimmakrana@gmail.com
     - Slack: (optional - see below)

2. **Issue Grouping:**
   - Go to "Settings" → "Processing"
   - Enable "Stack Trace Rules"
   - Enable "Similar Issues Grouping"

3. **Data Scrubbing:**
   - Go to "Settings" → "Security & Privacy"
   - Enable "Use Default Scrubbers" (removes passwords, credit cards)
   - Add custom scrubbers for sensitive fields if needed

4. **Performance Monitoring:**
   - Go to "Settings" → "Performance"
   - Enable "Performance Monitoring"
   - Sample Rate: 10% (adjust based on traffic)

---

## 🔔 Slack Integration (Optional)

### Setup Slack Notifications:

1. **In Sentry:**
   - Go to "Settings" → "Integrations"
   - Search for "Slack"
   - Click "Install"

2. **In Slack:**
   - Select your Slack workspace
   - Authorize Sentry app
   - Choose channel (e.g., `#moodmash-alerts`)

3. **Configure Alert Routing:**
   - Go to "Alerts" → Edit existing alert
   - Add "Send notification to Slack: #moodmash-alerts"
   - Save

---

## 📧 Email Integration

**Already configured by default!**

You'll receive emails at `salimmakrana@gmail.com` for:
- New issues (first occurrence)
- Issue regressions (reappeared after resolved)
- High error rate alerts

**Customize:**
- Go to "Settings" → "Notifications"
- Adjust "Personal Notification Settings"
- Choose alert frequency

---

## 🎯 What Sentry Will Track

### Backend (Cloudflare Workers):
- ✅ API errors with stack traces
- ✅ Database query errors
- ✅ Authentication failures
- ✅ Gemini AI API errors
- ✅ Email service failures
- ✅ Slow API responses (>1s)

### Frontend (Browser):
- ✅ JavaScript errors
- ✅ API call failures
- ✅ User navigation errors
- ✅ Form submission errors
- ✅ Chat UI errors

### User Context:
- ✅ User ID
- ✅ Email (hashed for privacy)
- ✅ Username
- ✅ Current page
- ✅ Browser/OS info

### Performance:
- ✅ API response times
- ✅ Database query duration
- ✅ External API calls (Gemini)
- ✅ Page load times

---

## 🔐 Security & Privacy

### Data Scrubbing (Automatic):
- Passwords (removed)
- Credit card numbers (removed)
- Social security numbers (removed)
- API keys (removed)
- Session tokens (hashed)

### User Privacy:
- Emails are hashed before sending to Sentry
- PII fields are scrubbed automatically
- GDPR compliant

### Data Retention:
- Free tier: 30 days
- Upgrade for longer retention if needed

---

## 📊 Sentry Dashboard Overview

### Key Metrics You'll See:

1. **Issues Tab:**
   - All errors grouped by type
   - Error frequency and trends
   - Affected users count
   - Stack traces with source code

2. **Performance Tab:**
   - Transaction performance
   - Slow API endpoints
   - Database query times
   - External API call duration

3. **Releases Tab:**
   - Errors per deployment
   - New errors in latest release
   - Regression tracking

4. **Discover Tab:**
   - Custom queries
   - Error analysis
   - User impact reports

---

## 🚀 Deployment Checklist

After setting up Sentry project:

- [ ] Copy DSN from Sentry project
- [ ] Add `SENTRY_DSN` secret to Cloudflare (via `wrangler secret put`)
- [ ] Create `.dev.vars` file with DSN for local testing
- [ ] Deploy to production (`npm run deploy`)
- [ ] Test error capturing (trigger a test error)
- [ ] Verify errors appear in Sentry dashboard
- [ ] Configure Slack alerts (optional)
- [ ] Review and adjust alert rules

---

## 🧪 Testing Sentry Integration

### Test Backend Error Capturing:

```bash
# Trigger a test error
curl -X POST https://moodmash.win/api/sentry-test \
  -H "Content-Type: application/json"
```

### Test Frontend Error Capturing:

1. Open https://moodmash.win in browser
2. Open browser console
3. Type: `Sentry.captureMessage('Test error from frontend')`
4. Check Sentry dashboard for the error

### Verify in Sentry:

1. Go to https://sentry.io/organizations/[YOUR_ORG]/issues/
2. You should see the test errors
3. Click on an error to see details, stack trace, user context

---

## 📞 Support & Resources

- **Sentry Docs:** https://docs.sentry.io/platforms/javascript/guides/cloudflare/
- **Cloudflare Integration:** https://docs.sentry.io/platforms/javascript/guides/cloudflare/
- **Your Dashboard:** https://sentry.io/organizations/[YOUR_ORG]/projects/moodmash/

---

## 🎉 Benefits You'll Get

1. **Instant Error Alerts** - Know about issues before users complain
2. **Full Stack Traces** - Debug production errors easily
3. **User Impact** - See which users are affected
4. **Performance Insights** - Find slow endpoints
5. **Release Tracking** - Errors per deployment
6. **Smart Grouping** - Similar errors grouped together

---

## 📝 Next Steps After Configuration

1. **Get your DSN from Sentry project**
2. **Add as Cloudflare secret:** `npx wrangler secret put SENTRY_DSN`
3. **Paste DSN when prompted**
4. **Deploy to production:** `npm run deploy`
5. **Test error capturing**
6. **Configure alerts and Slack integration**

---

**Status:** ⏳ Waiting for Sentry DSN  
**Account:** salimemp (salimmakrana@gmail.com)  
**Project:** moodmash  

---

*Once you provide the DSN, I'll complete the integration and deploy!*
