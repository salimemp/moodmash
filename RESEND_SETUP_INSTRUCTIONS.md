# 🎯 Resend API Key Setup - Quick Instructions

**You are here**: Code is complete, now let's configure your Resend API key!

---

## 📋 Prerequisites

✅ You have a Resend API key  
✅ Code changes are committed to Git  
✅ Ready to deploy to production

---

## 🚀 3-Step Setup Process

### **Step 1: Set Cloudflare Secret (2 minutes)**

Open your terminal and run:

```bash
npx wrangler secret put RESEND_API_KEY --project-name moodmash
```

**When prompted**, paste your Resend API key (starts with `re_...`) and press Enter.

**Verify it worked**:
```bash
npx wrangler secret list --project-name moodmash
```

You should see:
```
┌─────────────────┬────────────┐
│ Name            │ Value      │
├─────────────────┼────────────┤
│ RESEND_API_KEY  │ (secret)   │
└─────────────────┴────────────┘
```

---

### **Step 2: Update Local Development (Optional - 1 minute)**

For testing locally, update `.dev.vars`:

```bash
cd /home/user/webapp
nano .dev.vars  # or use your favorite editor
```

Update the line:
```env
RESEND_API_KEY=re_your_actual_resend_api_key_here
```

Save and exit.

---

### **Step 3: Build and Deploy (5 minutes)**

```bash
cd /home/user/webapp

# Build the application
npm run build

# Deploy to production
npm run deploy
```

Wait for deployment to complete (usually 2-3 minutes).

---

## ✅ Verification Steps

### **Test 1: Password Reset Email**
```bash
curl -X POST https://moodmash.win/api/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "If that email exists, a reset link has been sent"
}
```

**Check your email inbox** - you should receive a "Reset Your MoodMash Password" email within 5-10 seconds.

---

### **Test 2: Magic Link Email**
```bash
curl -X POST https://moodmash.win/api/auth/magic-link/request \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Magic link sent to your email"
}
```

**Check your email inbox** - you should receive a "🔐 Sign in to MoodMash" email.

---

## 🔧 Troubleshooting

### **Issue: "Email not received"**

1. **Check Resend Dashboard**:
   - Go to: [https://resend.com/emails](https://resend.com/emails)
   - Look for recent email attempts
   - Check status (Delivered, Bounced, etc.)

2. **Check Spam Folder**:
   - Emails might be filtered as spam initially
   - Mark as "Not Spam" to whitelist

3. **Verify Domain** (if using custom domain):
   - Go to: [https://resend.com/domains](https://resend.com/domains)
   - Ensure `moodmash.win` shows green checkmark
   - If not, add DNS records as instructed

4. **Check Cloudflare Logs**:
   ```bash
   npx wrangler tail --project-name moodmash
   ```
   Look for `[Email]` log messages

---

### **Issue: "API key invalid"**

1. **Verify secret is set**:
   ```bash
   npx wrangler secret list --project-name moodmash
   ```

2. **Re-add the secret**:
   ```bash
   npx wrangler secret put RESEND_API_KEY --project-name moodmash
   ```

3. **Check API key in Resend**:
   - Go to: [https://resend.com/api-keys](https://resend.com/api-keys)
   - Verify key is active (not revoked)
   - Create a new key if needed

---

### **Issue: "Domain not verified"**

**Option A: Use Resend Test Domain (Immediate)**
- Update `src/utils/email.ts`, line 23:
  ```typescript
  from = 'MoodMash <onboarding@resend.dev>'
  ```
- Rebuild and deploy
- **Limitation**: Can only send to verified email addresses in Resend

**Option B: Verify Your Domain (Recommended)**
- Add DNS records as shown in Resend dashboard
- Wait up to 48 hours for DNS propagation
- Check verification status regularly

---

## 📊 What Happens After Setup

Once configured, these emails will automatically be sent:

| **Event** | **Email Sent** | **Timing** |
|-----------|---------------|------------|
| User clicks "Forgot Password" | Password Reset | Immediate |
| User requests Magic Link | Magic Link Sign-in | Immediate |
| User creates new account | Welcome Email | Immediate |
| User enables 2FA | Backup Codes (future) | When implemented |

---

## 🎯 Success Checklist

- [ ] Resend API key set in Cloudflare secrets
- [ ] Application built successfully (`npm run build`)
- [ ] Deployed to production (`npm run deploy`)
- [ ] Password reset email received
- [ ] Magic link email received
- [ ] Emails look professional on mobile and desktop
- [ ] Links work and redirect correctly
- [ ] Welcome email sent on new registration

---

## 📞 Need Help?

**Resend Resources**:
- Dashboard: [https://resend.com/overview](https://resend.com/overview)
- Email Logs: [https://resend.com/emails](https://resend.com/emails)
- Documentation: [https://resend.com/docs](https://resend.com/docs)
- Support: [https://resend.com/support](https://resend.com/support)

**DNS Verification Help**:
- DNS Checker: [https://dnschecker.org](https://dnschecker.org)
- MX Toolbox: [https://mxtoolbox.com](https://mxtoolbox.com)

---

## 🚀 You're All Set!

After completing these 3 steps, your **Resend email service integration will be fully operational** in production!

Users will receive professional, branded emails for:
- ✉️ Password resets
- 🔐 Magic link authentication
- 🌈 Welcome messages

**Status**: ⏳ **Awaiting Your Setup** → ✅ **Production Ready**

---

**Last Updated**: November 25, 2025  
**Next Step**: Run `npx wrangler secret put RESEND_API_KEY --project-name moodmash`
