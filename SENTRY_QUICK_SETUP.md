# Sentry Alerts & Slack - Quick Setup Card

**⏱️ Total Time: 15 minutes**

---

## 📧 Email Alerts (5 min)

### **Quick Steps:**

1. **Login:** https://sentry.io → salimmakrana@gmail.com
2. **Go to:** Projects → moodmash → Alerts
3. **Create 3 alert rules:**

**Alert #1: New Errors**
```
Name: New Error Alert
Type: Issue Alerts
When: An event is first seen
Then: Send email to salimmakrana@gmail.com
Action: Immediately
```

**Alert #2: High Error Rate**
```
Name: High Error Rate Alert
Type: Issue Alerts
When: Issue seen more than 10 times in 1h
Then: Send email to salimmakrana@gmail.com
Action: Every 1 hour
```

**Alert #3: User Impact**
```
Name: User Impact Alert
Type: Issue Alerts
When: Issue affects more than 5 users
Then: Send email to salimmakrana@gmail.com
Action: Immediately
```

4. **Save all three rules**

✅ **Done!** You'll now get emails for errors.

---

## 💬 Slack Integration (10 min)

### **Quick Steps:**

1. **Create Slack channel** (if needed):
   - Open Slack
   - Click "+" → Create channel
   - Name: `#moodmash-alerts`
   - Make it Public
   - Create

2. **Install Slack in Sentry:**
   - Sentry → Settings → Integrations
   - Search "Slack" → Install
   - Select your Slack workspace
   - Click "Allow"

3. **Configure channel:**
   - Default channel: `#moodmash-alerts`
   - Enable: Issue alerts, Deploy notifications
   - Save

4. **Update alert rules:**
   - Go to: Alerts
   - Edit each of the 3 rules you created
   - Add action: "Send notification via Slack"
   - Channel: `#moodmash-alerts`
   - Save

✅ **Done!** You'll now get Slack messages for errors.

---

## 🧪 Test It

```bash
# Trigger test error
curl -X POST https://moodmash.win/api/sentry-test \
  -H "Content-Type: application/json" \
  -d '{"type":"error"}'
```

**Check (within 1-2 minutes):**
- ✅ Email to: salimmakrana@gmail.com
- ✅ Slack message in: #moodmash-alerts
- ✅ Error in: https://sentry.io

---

## 🎯 What You'll Get

**Email notifications for:**
- 🔴 New errors (first occurrence)
- ⚠️ High error rates (10+ in 1 hour)
- 👥 User impact (5+ users affected)

**Slack notifications for:**
- Real-time error alerts
- Deploy notifications
- Clickable links to Sentry dashboard

---

## 📝 Visual Guide

### **Sentry Dashboard Navigation:**
```
Login → Projects → moodmash → Alerts → Create Alert
```

### **Alert Rule Template:**
```
┌─────────────────────────────────┐
│ Alert Name: [Your name here]    │
│ Type: ● Issue Alerts            │
│ When: [Select condition]        │
│ Then: [Send email/Slack]        │
│ Save Rule                       │
└─────────────────────────────────┘
```

### **Slack Integration Flow:**
```
Sentry → Settings → Integrations → Slack
  ↓
Select Workspace → Allow
  ↓
Configure Channel → Save
  ↓
Update Alert Rules → Add Slack action
```

---

## 🆘 Troubleshooting

**Not receiving emails?**
- Check spam folder
- Verify email: Settings → Account → Email

**Not receiving Slack messages?**
- Invite Sentry to channel: `/invite @Sentry`
- Verify integration: Settings → Integrations → Slack

**Too many alerts?**
- Increase thresholds (10 → 50)
- Add environment filter (production only)
- Change to daily digest

---

## ✅ Quick Checklist

**Email Setup:**
- [ ] Created "New Error Alert"
- [ ] Created "High Error Rate Alert"
- [ ] Created "User Impact Alert"
- [ ] Tested with curl command
- [ ] Received test email

**Slack Setup:**
- [ ] Created #moodmash-alerts channel
- [ ] Installed Slack integration
- [ ] Configured default channel
- [ ] Updated 3 alert rules
- [ ] Tested with curl command
- [ ] Received test Slack message

---

## 📚 Full Guide

Need more details? See: **SENTRY_ALERTS_SETUP.md**

---

**Questions? Just ask!** 😊
