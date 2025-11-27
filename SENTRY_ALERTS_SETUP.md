# Sentry Email Alerts & Slack Integration Setup

**Account:** salimemp (salimmakrana@gmail.com)  
**Project:** moodmash  
**Date:** 2025-11-27

---

## 📧 Part 1: Configure Email Alerts (5 minutes)

### **Step 1: Login to Sentry**

1. Go to: **https://sentry.io/auth/login/**
2. Login with: **salimmakrana@gmail.com**

### **Step 2: Go to Your Project**

1. Click **"Projects"** in the left sidebar
2. Click **"moodmash"** from the project list

### **Step 3: Create Alert Rule #1 - New Errors**

1. Click **"Alerts"** in the left sidebar
2. Click **"Create Alert"** button (top right)
3. Configure as follows:

```
┌─────────────────────────────────────────────┐
│ Create Alert Rule                           │
├─────────────────────────────────────────────┤
│                                             │
│ Alert Name:                                 │
│ [New Error Alert]                           │
│                                             │
│ Alert Type:                                 │
│ ○ Metric Alerts                            │
│ ● Issue Alerts  ← SELECT THIS             │
│                                             │
│ When:                                       │
│ [An event is first seen] ← SELECT          │
│                                             │
│ Then:                                       │
│ [Send a notification via] ← SELECT         │
│ [Email ▼] ← SELECT                         │
│ [to salimmakrana@gmail.com]                │
│                                             │
│ Action Interval:                            │
│ [Immediately]                               │
│                                             │
│ [ Cancel ]  [ Save Rule ]                   │
└─────────────────────────────────────────────┘
```

4. Click **"Save Rule"**

✅ **Result:** You'll get an email whenever a NEW type of error occurs!

### **Step 4: Create Alert Rule #2 - High Error Rate**

1. Still in **Alerts** page, click **"Create Alert"** again
2. Configure as follows:

```
┌─────────────────────────────────────────────┐
│ Create Alert Rule                           │
├─────────────────────────────────────────────┤
│                                             │
│ Alert Name:                                 │
│ [High Error Rate Alert]                     │
│                                             │
│ Alert Type:                                 │
│ ○ Metric Alerts                            │
│ ● Issue Alerts  ← SELECT THIS             │
│                                             │
│ When:                                       │
│ [The issue is seen more than] ← SELECT     │
│ [10] times in [1h]                         │
│                                             │
│ Then:                                       │
│ [Send a notification via] ← SELECT         │
│ [Email ▼] ← SELECT                         │
│ [to salimmakrana@gmail.com]                │
│                                             │
│ Action Interval:                            │
│ [Every 1 hour]                             │
│                                             │
│ [ Cancel ]  [ Save Rule ]                   │
└─────────────────────────────────────────────┘
```

3. Click **"Save Rule"**

✅ **Result:** You'll get an email when an error happens 10+ times in an hour!

### **Step 5: Create Alert Rule #3 - User Impact**

1. Click **"Create Alert"** again
2. Configure as follows:

```
┌─────────────────────────────────────────────┐
│ Create Alert Rule                           │
├─────────────────────────────────────────────┤
│                                             │
│ Alert Name:                                 │
│ [User Impact Alert]                         │
│                                             │
│ Alert Type:                                 │
│ ○ Metric Alerts                            │
│ ● Issue Alerts  ← SELECT THIS             │
│                                             │
│ When:                                       │
│ [The issue affects more than] ← SELECT     │
│ [5] users                                   │
│                                             │
│ Then:                                       │
│ [Send a notification via] ← SELECT         │
│ [Email ▼] ← SELECT                         │
│ [to salimmakrana@gmail.com]                │
│                                             │
│ Action Interval:                            │
│ [Immediately]                               │
│                                             │
│ [ Cancel ]  [ Save Rule ]                   │
└─────────────────────────────────────────────┘
```

3. Click **"Save Rule"**

✅ **Result:** You'll get an email when an error affects 5+ users!

### **Step 6: Configure Personal Email Preferences**

1. Click your **profile picture** (top right)
2. Click **"User Settings"**
3. Click **"Notifications"** in the left menu
4. Configure your preferences:

```
┌─────────────────────────────────────────────┐
│ Personal Notification Settings              │
├─────────────────────────────────────────────┤
│                                             │
│ Email Delivery:                             │
│ ☑ Send me email notifications              │
│                                             │
│ Workflow Notifications:                     │
│ ☑ Notify me about issues assigned to me    │
│ ☑ Notify me about deploy notifications     │
│ ☑ Notify me about issue state changes      │
│                                             │
│ Weekly Reports:                             │
│ ☑ Send me weekly reports on Monday         │
│                                             │
│ [ Save Changes ]                            │
└─────────────────────────────────────────────┘
```

5. Click **"Save Changes"**

---

## 💬 Part 2: Slack Integration Setup (10 minutes)

### **Prerequisites:**
- You need a Slack workspace
- You need admin permissions in that workspace
- If you don't have a Slack workspace, create one at: https://slack.com/create

### **Step 1: Go to Sentry Integrations**

1. Still logged into Sentry (https://sentry.io)
2. Click your **organization name** (top left)
3. Click **"Settings"** in the dropdown
4. Click **"Integrations"** in the left sidebar

### **Step 2: Find and Install Slack**

1. In the search box, type: **"Slack"**
2. Find **"Slack"** integration
3. Click **"Install"** button

```
┌─────────────────────────────────────────────┐
│ Slack Integration                           │
├─────────────────────────────────────────────┤
│                                             │
│ Connect your Sentry organization with       │
│ Slack to receive notifications.             │
│                                             │
│ Features:                                   │
│ • Get notified about new issues             │
│ • Receive alerts in Slack channels          │
│ • Link Sentry issues to Slack threads       │
│                                             │
│ [ Install ]                                 │
└─────────────────────────────────────────────┘
```

### **Step 3: Authorize Slack**

1. You'll be redirected to **Slack OAuth page**
2. Select your **Slack workspace** from dropdown
3. Review permissions:
   - ✅ Post messages to channels
   - ✅ Read channel information
   - ✅ Add shortcuts and slash commands

4. Click **"Allow"** button

```
┌─────────────────────────────────────────────┐
│ Slack Authorization                         │
├─────────────────────────────────────────────┤
│                                             │
│ Sentry wants to access your workspace:      │
│ [Your Workspace Name ▼]                     │
│                                             │
│ Sentry will be able to:                     │
│ • Post messages as @Sentry                  │
│ • Access information about public channels  │
│ • Add shortcuts and slash commands          │
│                                             │
│ [ Cancel ]  [ Allow ]                       │
└─────────────────────────────────────────────┘
```

### **Step 4: Create or Select a Slack Channel**

**Option A: Use Existing Channel**
- Choose an existing channel like `#general` or `#engineering`

**Option B: Create New Channel (Recommended)**
1. Open Slack
2. Click **"+"** next to "Channels"
3. Click **"Create a channel"**
4. Name it: **`#moodmash-alerts`** or **`#sentry-alerts`**
5. Make it **Public** or **Private** (your choice)
6. Click **"Create"**

### **Step 5: Configure Slack Channel in Sentry**

1. After authorizing, you're back in Sentry
2. You'll see Slack integration settings:

```
┌─────────────────────────────────────────────┐
│ Slack Configuration                         │
├─────────────────────────────────────────────┤
│                                             │
│ Default Channel:                            │
│ [#moodmash-alerts ▼] ← SELECT              │
│                                             │
│ Notifications to send:                      │
│ ☑ Issue alerts                             │
│ ☑ Deploy notifications                     │
│ ☑ Comments                                 │
│                                             │
│ [ Save Configuration ]                      │
└─────────────────────────────────────────────┘
```

3. Select your channel: **`#moodmash-alerts`**
4. Check all notification types you want
5. Click **"Save Configuration"**

### **Step 6: Update Alert Rules to Include Slack**

Now go back and update your alert rules to include Slack:

1. Go to **Alerts** (left sidebar)
2. Click on **"New Error Alert"** (the one you created earlier)
3. Click **"Edit Rule"**
4. In the **"Then"** section, click **"Add action"**
5. Select **"Send a notification via Slack"**
6. Choose channel: **`#moodmash-alerts`**
7. Click **"Save Rule"**

Repeat for the other two alert rules:
- High Error Rate Alert
- User Impact Alert

```
┌─────────────────────────────────────────────┐
│ Edit Alert Rule                             │
├─────────────────────────────────────────────┤
│                                             │
│ Alert Name:                                 │
│ [New Error Alert]                           │
│                                             │
│ When:                                       │
│ [An event is first seen]                    │
│                                             │
│ Then:                                       │
│ 1. [Send a notification via Email]          │
│    [to salimmakrana@gmail.com]             │
│                                             │
│ 2. [Send a notification via Slack]          │
│    [to #moodmash-alerts]  ← NEW!           │
│                                             │
│ [ Add action ]                              │
│                                             │
│ [ Cancel ]  [ Save Rule ]                   │
└─────────────────────────────────────────────┘
```

---

## 🧪 Part 3: Test Your Alerts

### **Test 1: Trigger a Test Error**

```bash
# Send a test error to Sentry
curl -X POST https://moodmash.win/api/sentry-test \
  -H "Content-Type: application/json" \
  -d '{"type":"error"}'
```

**Expected Results (within 1-2 minutes):**
1. ✅ Error appears in Sentry dashboard
2. ✅ Email sent to: salimmakrana@gmail.com
3. ✅ Slack message posted to: #moodmash-alerts

### **Test 2: Check Your Email**

1. Open your email: salimmakrana@gmail.com
2. Look for email from: **alerts@sentry.io**
3. Subject: **[moodmash] Sentry test error - This is intentional for testing**
4. Email should contain:
   - Error message
   - Stack trace
   - Link to Sentry dashboard
   - "View on Sentry" button

### **Test 3: Check Your Slack Channel**

1. Open Slack
2. Go to **#moodmash-alerts** channel
3. Look for message from **@Sentry** bot
4. Message should contain:
   - Error title
   - Project name (moodmash)
   - Link to Sentry dashboard
   - "View Issue" button

---

## 📊 What Each Alert Does

### **Alert #1: New Error Alert**
- **Triggers:** First time a new error type is seen
- **Use Case:** Discover new bugs immediately
- **Frequency:** Once per unique error
- **Example:** User clicks "Submit" and gets a new database error

### **Alert #2: High Error Rate Alert**
- **Triggers:** Error happens 10+ times in 1 hour
- **Use Case:** Detect when something is seriously broken
- **Frequency:** Once per hour if threshold is met
- **Example:** API endpoint failing repeatedly

### **Alert #3: User Impact Alert**
- **Triggers:** Error affects 5+ different users
- **Use Case:** Know when errors impact many users
- **Frequency:** Immediately when threshold is reached
- **Example:** Login bug affecting multiple users

---

## 📧 Email Examples

### **New Error Email:**
```
From: alerts@sentry.io
To: salimmakrana@gmail.com
Subject: [moodmash] New Error: Database connection failed

──────────────────────────────────────
🔴 New Issue in moodmash
──────────────────────────────────────

Error: Database connection failed

First seen: Nov 27, 2025 at 8:30 AM
Users affected: 1
Occurrences: 1

──────────────────────────────────────
Stack Trace:
  at connectDatabase (worker.js:234:15)
  at handleRequest (worker.js:456:8)
──────────────────────────────────────

[View on Sentry] [Ignore] [Resolve]
```

### **High Error Rate Email:**
```
From: alerts@sentry.io
To: salimmakrana@gmail.com
Subject: [moodmash] High Error Rate: API timeout

──────────────────────────────────────
⚠️  High Error Rate Alert
──────────────────────────────────────

Error: API timeout after 30 seconds

Occurrences: 23 times in the last hour
Users affected: 12
Trend: ↑ Increasing

──────────────────────────────────────

This error has crossed the threshold of 10
occurrences in 1 hour.

[View on Sentry] [Snooze] [Resolve]
```

---

## 💬 Slack Message Examples

### **New Error Slack Message:**
```
┌─────────────────────────────────────────┐
│ Sentry APP  8:30 AM                     │
├─────────────────────────────────────────┤
│ 🔴 New Issue in moodmash                │
│                                         │
│ Database connection failed              │
│                                         │
│ First seen just now                     │
│ 1 user affected • 1 occurrence          │
│                                         │
│ [View Issue] [Ignore] [Resolve]         │
└─────────────────────────────────────────┘
```

### **High Error Rate Slack Message:**
```
┌─────────────────────────────────────────┐
│ Sentry APP  9:15 AM                     │
├─────────────────────────────────────────┤
│ ⚠️  High Error Rate Alert               │
│                                         │
│ API timeout after 30 seconds            │
│                                         │
│ 23 occurrences in the last hour        │
│ 12 users affected                       │
│                                         │
│ [View Issue] [Snooze]                   │
└─────────────────────────────────────────┘
```

---

## 🔧 Advanced Configuration (Optional)

### **Custom Alert Conditions:**

You can create more sophisticated alerts:

**Alert for Specific Endpoints:**
- Condition: "URL path contains `/api/payment`"
- Use Case: Monitor critical payment endpoints

**Alert for Specific Error Types:**
- Condition: "Error message contains 'Out of memory'"
- Use Case: Detect resource exhaustion

**Alert for Production Only:**
- Condition: "Environment equals production"
- Use Case: Ignore development errors

**Alert for High Severity:**
- Condition: "Level equals error or fatal"
- Use Case: Focus on critical errors only

### **To Create Custom Alert:**

1. Go to **Alerts** → **Create Alert**
2. Select **"Issue Alerts"**
3. Click **"Add condition"** for more filters
4. Available conditions:
   - Event attribute
   - Tag value
   - Level
   - First seen
   - Change in state
   - Regression

---

## 🎯 Best Practices

### **Email Management:**

1. **Create email filters:**
   - Filter: `from:alerts@sentry.io`
   - Label: "Sentry Alerts"
   - Importance: High

2. **Set up inbox rules:**
   - Critical errors → Inbox + notification
   - New errors → Inbox
   - High rate → Folder + notification

### **Slack Management:**

1. **Mute during off-hours:**
   - Slack → Channel settings → Notifications
   - Mute: 10 PM - 8 AM

2. **Use threads:**
   - Sentry posts in threads automatically
   - Keep discussions organized

3. **Set channel notifications:**
   - @mentions only (if too noisy)
   - All messages (for critical projects)

### **Alert Tuning:**

If you're getting too many alerts:

1. **Increase thresholds:**
   - 10 errors/hour → 50 errors/hour
   - 5 affected users → 20 affected users

2. **Add conditions:**
   - Only production environment
   - Only fatal/error level
   - Exclude specific errors

3. **Adjust action intervals:**
   - Immediately → Every 1 hour
   - Every 1 hour → Once per day

---

## 📋 Checklist

### **Email Alerts:**
- [ ] Logged into Sentry (https://sentry.io)
- [ ] Created "New Error Alert" rule
- [ ] Created "High Error Rate Alert" rule
- [ ] Created "User Impact Alert" rule
- [ ] Configured personal email preferences
- [ ] Tested with curl command
- [ ] Received test email

### **Slack Integration:**
- [ ] Created/selected Slack channel (#moodmash-alerts)
- [ ] Installed Slack integration in Sentry
- [ ] Authorized Sentry app in Slack
- [ ] Configured default Slack channel
- [ ] Updated alert rules to include Slack
- [ ] Tested with curl command
- [ ] Received test Slack message

---

## 🆘 Troubleshooting

### **Problem: Not receiving emails**

**Solutions:**
1. Check spam/junk folder
2. Add alerts@sentry.io to contacts
3. Verify email in Sentry: Settings → Account → Email
4. Check alert rules: Alerts → View rules → Verify email is configured

### **Problem: Not receiving Slack messages**

**Solutions:**
1. Check if Sentry bot is in your channel: `/invite @Sentry`
2. Verify integration: Settings → Integrations → Slack → Test
3. Check channel permissions: Public channels work better
4. Re-authorize if needed: Settings → Integrations → Slack → Reinstall

### **Problem: Too many alerts**

**Solutions:**
1. Increase thresholds (10 → 50 errors)
2. Add environment filter (production only)
3. Mute non-critical alerts
4. Change to daily digest

### **Problem: Alerts not triggering**

**Solutions:**
1. Verify rules are enabled: Alerts → View rules → Check status
2. Test with curl: `curl -X POST https://moodmash.win/api/sentry-test`
3. Check Sentry dashboard: Are errors appearing?
4. Wait 1-2 minutes: Alerts have slight delay

---

## 📞 Need Help?

If you get stuck:

1. **Sentry Documentation:**
   - Email: https://docs.sentry.io/product/alerts/notifications/
   - Slack: https://docs.sentry.io/product/integrations/notification-incidents/slack/

2. **Sentry Support:**
   - https://sentry.io/support/

3. **Screenshots Help:**
   - Take a screenshot of where you're stuck
   - Send it along with your question

---

## ✅ Summary

Once configured, you'll have:

- ✅ **Email alerts** for new errors, high error rates, and user impact
- ✅ **Slack notifications** in real-time to #moodmash-alerts
- ✅ **Instant visibility** into production issues
- ✅ **Actionable notifications** with links to fix errors

**Total setup time:** 15 minutes  
**Value:** Priceless! 🎉

---

*Last Updated: 2025-11-27*  
*Questions? Just ask!* 😊
