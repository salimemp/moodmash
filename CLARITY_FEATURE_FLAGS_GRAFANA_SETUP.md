# Microsoft Clarity + Feature Flags + Grafana Setup Guide

## Overview

This guide covers the implementation of three powerful monitoring and feature management tools for MoodMash:

1. **Microsoft Clarity** - Session recordings & heatmaps (FREE)
2. **Feature Flags** - A/B testing & gradual rollouts (Custom, FREE)
3. **Grafana** - Real-time dashboards & alerting (FREE tier)

**Total Cost: $0** (all using free tiers or custom implementation)

---

## 1. Microsoft Clarity Setup

### What is Microsoft Clarity?

Microsoft Clarity is a FREE session recording and heatmap tool that provides:
- ✅ **Unlimited session recordings**
- ✅ **Click & scroll heatmaps**
- ✅ **User behavior insights**
- ✅ **GDPR compliant**
- ✅ **No event limits**
- ✅ **100% FREE forever**

### Setup Instructions

#### Step 1: Create Microsoft Clarity Account

1. Go to [https://clarity.microsoft.com/](https://clarity.microsoft.com/)
2. Click "Sign up" and use your Microsoft account (or create one)
3. Click "Add new project"
4. Fill in project details:
   - **Name**: MoodMash Production
   - **Website URL**: https://moodmash.win
   - **Category**: Health & Fitness

#### Step 2: Get Your Project ID

After creating the project, you'll see your Project ID in the setup screen:
```
Project ID: XXXXXXXXX (e.g., "abc123def")
```

Copy this ID for the next step.

#### Step 3: Configure Clarity in Your Application

The Clarity script is already integrated in `src/template.ts`. You just need to replace the placeholder:

```bash
# Open template.ts
cd /home/user/webapp
```

Find this line in `src/template.ts`:
```javascript
})(window, document, "clarity", "script", "CLARITY_PROJECT_ID");
```

Replace `"CLARITY_PROJECT_ID"` with your actual Project ID:
```javascript
})(window, document, "clarity", "script", "abc123def");
```

#### Step 4: Deploy to Production

```bash
# Build and deploy
npm run build
npm run deploy
```

#### Step 5: Verify Installation

1. Visit your website: https://moodmash.win
2. Go back to Clarity dashboard
3. Within 2 hours, you should see "Active" status
4. Data will start appearing within 2-4 hours

### Using Microsoft Clarity

#### View Session Recordings

1. Go to Clarity dashboard → Recordings
2. Filter by:
   - Date range
   - Device type (mobile, tablet, desktop)
   - Country
   - Rage clicks (frustrated users)
   - Dead clicks (broken UI)
   - Excessive scrolling

3. Click on any recording to watch:
   - User's mouse movements
   - Clicks and taps
   - Scrolling behavior
   - Form interactions
   - Page navigation

#### View Heatmaps

1. Go to Clarity dashboard → Heatmaps
2. Enter a specific URL (e.g., `/dashboard`)
3. View three types:
   - **Click heatmap**: Where users click
   - **Scroll heatmap**: How far users scroll
   - **Area heatmap**: Hot zones of engagement

#### Insights & Analysis

Clarity automatically detects:
- **Rage clicks**: Users clicking repeatedly (frustration)
- **Dead clicks**: Clicks that do nothing (broken UI)
- **Quick backs**: Users immediately leaving a page
- **Excessive scrolling**: Users lost or searching
- **JavaScript errors**: Console errors during session

### Privacy & Compliance

#### GDPR Compliance

Clarity is GDPR compliant by default, but you should:

1. Update your privacy policy to mention session recordings
2. Add to cookie consent banner (if not already there)

Example text:
```
We use Microsoft Clarity to understand how you interact with our 
website. Clarity records user sessions including mouse movements, 
clicks, and scrolling. This data is anonymized and helps us improve 
your experience. No personal data or sensitive information is recorded.
```

#### Mask Sensitive Data

To mask sensitive fields (passwords, credit cards):

```javascript
// Add to your HTML input fields
<input type="password" class="clarity-mask" />
<input type="email" class="clarity-mask" />
<input type="text" data-clarity-mask="true" />
```

Clarity automatically masks:
- Password fields
- Credit card inputs
- Any field with `clarity-mask` class

---

## 2. Feature Flags Setup

### What are Feature Flags?

Feature flags allow you to:
- ✅ **Enable/disable features** without deployment
- ✅ **Gradual rollouts** (10% → 50% → 100%)
- ✅ **A/B testing** (test variants)
- ✅ **User targeting** (premium users only)
- ✅ **Kill switches** (disable broken features instantly)

### Database Migration

The feature flags table is already created! Just apply the migration:

```bash
# For local development
cd /home/user/webapp
npm run db:migrate:local

# For production
npm run db:migrate:prod
```

This creates three tables:
- `feature_flags` - Flag definitions
- `feature_flag_events` - Audit log
- `feature_flag_overrides` - Per-user overrides

### Using Feature Flags

#### Check if a Feature is Enabled (Backend)

```typescript
// In your API route
import { isFeatureEnabled } from './utils/feature-flags';

app.get('/api/some-feature', async (c) => {
  const session = getCurrentUser(c);
  const userId = session?.userId ? parseInt(session.userId) : undefined;

  // Check if feature is enabled for this user
  const enabled = await isFeatureEnabled(c, 'new_dashboard_ui', userId, {
    segment: session?.isPremium ? 'premium' : 'free'
  });

  if (!enabled) {
    return c.json({ error: 'Feature not available' }, 403);
  }

  // Feature is enabled, continue...
});
```

#### Check Multiple Flags at Once

```typescript
import { getFeatureFlags } from './utils/feature-flags';

const flags = await getFeatureFlags(
  c,
  ['dark_mode_v2', 'ai_insights', 'social_feed'],
  userId
);

// Returns: { dark_mode_v2: true, ai_insights: true, social_feed: false }
```

#### Get All Enabled Flags for a User

```typescript
import { getAllEnabledFlags } from './utils/feature-flags';

const enabledFlags = await getAllEnabledFlags(c, userId);
// Returns: ['dark_mode_v2', 'ai_insights', 'premium_features']
```

### Managing Feature Flags

#### Via API (Admin Only)

**List all flags:**
```bash
curl https://moodmash.win/api/admin/feature-flags
```

**Create a new flag:**
```bash
curl -X POST https://moodmash.win/api/admin/feature-flags \
  -H "Content-Type: application/json" \
  -d '{
    "flag_name": "new_analytics_dashboard",
    "description": "New analytics dashboard with AI insights",
    "enabled": true,
    "rollout_percentage": 10,
    "category": "feature",
    "environment": "production"
  }'
```

**Update a flag (gradually increase rollout):**
```bash
curl -X POST https://moodmash.win/api/admin/feature-flags \
  -H "Content-Type: application/json" \
  -d '{
    "flag_name": "new_analytics_dashboard",
    "enabled": true,
    "rollout_percentage": 50
  }'
```

**Delete a flag:**
```bash
curl -X DELETE https://moodmash.win/api/admin/feature-flags/new_analytics_dashboard
```

**Get flag analytics:**
```bash
curl https://moodmash.win/api/admin/feature-flags/new_analytics_dashboard/analytics
```

#### Via Database (Direct Access)

```sql
-- Enable a feature for all users
UPDATE feature_flags 
SET enabled = 1, rollout_percentage = 100 
WHERE flag_name = 'dark_mode_v2';

-- Gradual rollout (25% of users)
UPDATE feature_flags 
SET rollout_percentage = 25 
WHERE flag_name = 'new_onboarding';

-- Target premium users only
UPDATE feature_flags 
SET target_segments = '["premium"]' 
WHERE flag_name = 'advanced_analytics';

-- Schedule a feature (auto-enable at date)
UPDATE feature_flags 
SET start_date = '2025-02-01 00:00:00',
    end_date = '2025-03-01 00:00:00'
WHERE flag_name = 'valentines_theme';
```

### Feature Flag Strategies

#### 1. Gradual Rollout

Start small, increase gradually:
```sql
-- Day 1: Beta testers (5%)
UPDATE feature_flags SET rollout_percentage = 5;

-- Day 3: Early adopters (25%)
UPDATE feature_flags SET rollout_percentage = 25;

-- Day 7: Half of users (50%)
UPDATE feature_flags SET rollout_percentage = 50;

-- Day 14: Everyone (100%)
UPDATE feature_flags SET rollout_percentage = 100;
```

#### 2. User Targeting

Target specific user groups:
```sql
-- Premium users only
UPDATE feature_flags 
SET target_segments = '["premium"]'
WHERE flag_name = 'advanced_features';

-- Beta testers
UPDATE feature_flags 
SET target_user_ids = '[123, 456, 789]'
WHERE flag_name = 'experimental_ui';

-- Specific countries
UPDATE feature_flags 
SET target_countries = '["US", "UK", "CA"]'
WHERE flag_name = 'localized_feature';
```

#### 3. A/B Testing

Create two flags for different variants:
```sql
-- Variant A: Blue button
INSERT INTO feature_flags (flag_name, enabled, rollout_percentage)
VALUES ('checkout_button_blue', 1, 50);

-- Variant B: Green button
INSERT INTO feature_flags (flag_name, enabled, rollout_percentage)
VALUES ('checkout_button_green', 1, 50);
```

Then in your code:
```typescript
const variantA = await isFeatureEnabled(c, 'checkout_button_blue', userId);
const variantB = await isFeatureEnabled(c, 'checkout_button_green', userId);

if (variantA) {
  // Show blue button
} else if (variantB) {
  // Show green button
} else {
  // Show default button
}
```

#### 4. Kill Switches

Instantly disable broken features:
```sql
-- Something broke? Disable immediately!
UPDATE feature_flags 
SET enabled = 0 
WHERE flag_name = 'broken_feature';

-- No deployment needed - instant!
```

### Default Feature Flags

MoodMash comes with these pre-configured flags:

| Flag Name | Description | Enabled | Rollout |
|-----------|-------------|---------|---------|
| `dark_mode_v2` | New dark mode theme | No | 0% |
| `ai_mood_insights` | AI-powered insights | Yes | 100% |
| `social_feed` | Social feed | No | 50% |
| `premium_features` | Premium subscription | Yes | 100% |
| `biometric_auth` | Face ID/Touch ID | Yes | 100% |
| `magic_link_auth` | Passwordless login | Yes | 100% |
| `session_recordings` | Microsoft Clarity | Yes | 100% |
| `new_onboarding` | New onboarding flow | No | 10% |
| `advanced_analytics` | Advanced analytics | No | 0% |
| `export_data_v2` | Enhanced data export | No | 25% |

---

## 3. Grafana Setup

### What is Grafana?

Grafana is a powerful dashboarding and visualization tool that provides:
- ✅ **Real-time dashboards**
- ✅ **Custom visualizations**
- ✅ **Alerting** (email, Slack, PagerDuty)
- ✅ **Multiple data sources**
- ✅ **FREE tier**: 10K series, 50GB logs

### Setup Instructions

#### Step 1: Create Grafana Cloud Account

1. Go to [https://grafana.com/products/cloud/](https://grafana.com/products/cloud/)
2. Click "Start for free"
3. Create account (GitHub/Google/Email)
4. Choose the **Free tier**:
   - 10,000 series metrics
   - 50 GB logs
   - 50 GB traces
   - 14 days retention

#### Step 2: Get Your Grafana Credentials

After creating your account, you'll receive:
- **Grafana URL**: `https://your-org.grafana.net`
- **Username**: Your email
- **API Key**: (we'll create this next)

#### Step 3: Create API Key

1. Go to your Grafana dashboard
2. Click your profile icon → "API Keys"
3. Click "New API Key"
4. Fill in:
   - **Name**: MoodMash Metrics
   - **Role**: Editor
   - **Time to live**: Never expire (or 1 year)
5. Click "Add"
6. **COPY THE KEY** (you won't see it again!)

#### Step 4: Add Data Source (Prometheus)

1. In Grafana, go to **Configuration** → **Data Sources**
2. Click "Add data source"
3. Select **Prometheus**
4. Configure:
   - **Name**: MoodMash Metrics
   - **URL**: `https://moodmash.win/metrics`
   - **Access**: Server (default)
   - **Scrape interval**: 30s
5. Click "Save & Test"

#### Step 5: Import Dashboard

1. Download the dashboard JSON: `grafana/dashboards/moodmash-overview.json`
2. In Grafana, click **+** → **Import**
3. Upload the JSON file or paste the contents
4. Select your data source: "MoodMash Metrics"
5. Click "Import"

### Available Dashboards

#### MoodMash Overview Dashboard

The included dashboard shows:
- **Total HTTP Requests** (counter)
- **Total Errors** (counter with thresholds)
- **Active Users** (gauge)
- **Average Response Time** (gauge with thresholds)
- **Request Rate** (graph, requests/second)
- **Response Time Percentiles** (graph, avg/p95/p99)
- **Error Rate** (graph with alerting)

### Creating Custom Dashboards

#### Add a New Panel

1. Click "Add panel" → "Add an empty panel"
2. Choose visualization type:
   - **Stat**: Single number
   - **Graph**: Time series
   - **Gauge**: Progress indicator
   - **Table**: Data table
   - **Heatmap**: Distribution

3. Write Prometheus query:
   ```promql
   # Request rate (requests per second)
   rate(http_requests_total[5m])
   
   # Error rate
   rate(http_errors_total[5m])
   
   # Average response time
   response_time_ms
   
   # P95 response time
   http_response_time_p95
   
   # Active users
   active_users
   ```

4. Configure panel:
   - **Title**: Panel name
   - **Description**: What this shows
   - **Unit**: ms, reqps, percent, etc.
   - **Thresholds**: Color coding (green/yellow/red)

5. Click "Apply"

### Setting Up Alerts

#### Create an Alert Rule

1. Edit a panel (e.g., "Error Rate")
2. Go to the "Alert" tab
3. Click "Create Alert"
4. Configure:
   - **Name**: High Error Rate
   - **Evaluate every**: 1m
   - **For**: 5m
   - **Conditions**:
     ```
     WHEN avg() OF query(A, 5m, now) IS ABOVE 5
     ```
   - **Message**: "Error rate is higher than 5 errors/second!"

5. Add notification channel (next step)

#### Add Notification Channel

1. Go to **Alerting** → **Notification channels**
2. Click "New channel"
3. Choose type:
   - **Email**: Your email address
   - **Slack**: Webhook URL
   - **PagerDuty**: Integration key
   - **Webhook**: Custom HTTP endpoint

4. **For Email**:
   - **Name**: Email Alerts
   - **Email addresses**: your@email.com
   - **Send test**: Verify it works

5. Save

6. Go back to your alert and select this channel

### Grafana Metrics Available

From `/metrics` endpoint (Prometheus format):

```promql
# Counters
http_requests_total                   # Total HTTP requests
http_errors_total                     # Total errors
database_queries_total                # Total DB queries
auth_attempts_total                   # Total auth attempts
auth_failures_total                   # Total auth failures

# Gauges
active_users                          # Current active users
response_time_ms                      # Average response time
http_response_time_p95                # 95th percentile response time
http_response_time_p99                # 99th percentile response time
```

### Example Queries

```promql
# Request rate over last 5 minutes
rate(http_requests_total[5m])

# Error percentage
(rate(http_errors_total[5m]) / rate(http_requests_total[5m])) * 100

# Slow requests (>500ms)
http_response_time_p95 > 500

# Active users trend
avg_over_time(active_users[1h])

# Database query rate
rate(database_queries_total[5m])

# Authentication failure rate
rate(auth_failures_total[5m]) / rate(auth_attempts_total[5m])
```

---

## Testing All Integrations

### 1. Test Microsoft Clarity

```bash
# Visit your site in different ways
open https://moodmash.win

# Click around, scroll, use features
# Wait 2-4 hours

# Check Clarity dashboard
open https://clarity.microsoft.com
```

### 2. Test Feature Flags

```bash
# Check if a flag is enabled
curl https://moodmash.win/api/feature-flags/dark_mode_v2

# Expected response:
{
  "success": true,
  "flagName": "dark_mode_v2",
  "enabled": false
}

# Get all flags for user
curl https://moodmash.win/api/feature-flags

# Expected response:
{
  "success": true,
  "flags": ["ai_mood_insights", "premium_features", ...],
  "count": 8
}
```

### 3. Test Grafana

```bash
# Test metrics endpoint
curl https://moodmash.win/metrics

# Expected output (Prometheus format):
# TYPE http_requests_total counter
http_requests_total 12345
# TYPE http_errors_total counter
http_errors_total 42
# TYPE response_time_ms gauge
response_time_ms 125
...

# Check Grafana dashboard
# Visit your Grafana URL and view the imported dashboard
# Verify panels are showing data (may take 1-2 minutes)
```

---

## Monitoring & Maintenance

### Microsoft Clarity

**Daily checks:**
- Review rage clicks (frustrated users)
- Check dead clicks (broken UI)
- Watch a few random sessions

**Weekly checks:**
- Heatmap analysis for main pages
- Identify drop-off points
- Review JavaScript errors

**Monthly checks:**
- Export session insights
- Share findings with team
- Plan UX improvements

### Feature Flags

**Daily checks:**
- Monitor flag evaluation metrics
- Check error rates for new features
- Review user feedback

**Weekly checks:**
- Increase rollout percentages for successful features
- Disable underperforming experiments
- Clean up old/unused flags

**Monthly checks:**
- Archive completed experiments
- Document learnings
- Plan next experiments

### Grafana

**Real-time:**
- Monitor alert notifications
- Respond to critical alerts

**Daily checks:**
- Review dashboard in morning
- Check for anomalies
- Investigate spikes/drops

**Weekly checks:**
- Review alert thresholds
- Adjust dashboards based on needs
- Export reports for stakeholders

---

## Troubleshooting

### Microsoft Clarity Not Showing Data

**Problem**: No sessions appearing after 4+ hours

**Solutions**:
1. Verify Project ID is correct in code
2. Check browser console for errors
3. Ensure script is loading (Network tab)
4. Try in incognito mode (extensions can block)
5. Whitelist Clarity in ad blockers

### Feature Flags Not Working

**Problem**: Flag always returns false

**Solutions**:
```sql
-- Check if flag exists
SELECT * FROM feature_flags WHERE flag_name = 'your_flag_name';

-- Check if enabled
SELECT enabled, rollout_percentage FROM feature_flags WHERE flag_name = 'your_flag_name';

-- Check evaluation log
SELECT * FROM feature_flag_events WHERE flag_name = 'your_flag_name' ORDER BY created_at DESC LIMIT 10;
```

### Grafana Not Showing Metrics

**Problem**: Dashboard panels show "No data"

**Solutions**:
1. Test metrics endpoint: `curl https://moodmash.win/metrics`
2. Verify data source connection in Grafana
3. Check Prometheus query syntax
4. Wait 1-2 minutes for initial data
5. Verify scrape interval (30s default)

---

## Cost Breakdown

| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| **Microsoft Clarity** | Free Forever | **$0/month** | Unlimited sessions, unlimited sites |
| **Feature Flags** | Custom (self-hosted) | **$0/month** | Unlimited flags, unlimited evaluations |
| **Grafana Cloud** | Free Tier | **$0/month** | 10K series, 50GB logs, 14d retention |
| **TOTAL** | | **$0/month** | |

**vs PostHog**: Save $5,165/month ($61,980/year) 🎉

---

## Next Steps

1. ✅ **Microsoft Clarity**: Get Project ID and update template.ts
2. ✅ **Feature Flags**: Run migrations and create first flag
3. ✅ **Grafana**: Create account and import dashboard
4. 📊 Start monitoring and iterating!

---

## Documentation & Support

- **Microsoft Clarity**: https://learn.microsoft.com/en-us/clarity/
- **Grafana**: https://grafana.com/docs/
- **Prometheus**: https://prometheus.io/docs/

---

**Last Updated**: January 2025  
**MoodMash Version**: 1.0  
**Status**: ✅ Production Ready
