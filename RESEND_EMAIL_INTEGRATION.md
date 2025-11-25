# ✉️ Resend Email Service Integration Guide

**Status**: ✅ Code Integration Complete | ⏳ Setup Required

---

## 📋 Overview

MoodMash now includes **Resend email service integration** for:
- **Password Reset Emails** - Secure password reset links (60-minute expiry)
- **Magic Link Authentication** - Passwordless sign-in links (15-minute expiry)  
- **Welcome Emails** - Onboarding emails for new users
- **2FA Backup Codes** - Email delivery support (ready for future use)

---

## 🚀 Quick Setup (5 Minutes)

### **Step 1: Get Your Resend API Key**

1. Go to [https://resend.com/api-keys](https://resend.com/api-keys)
2. Sign in or create a free account
3. Click **"Create API Key"**
4. Name it: `MoodMash Production`
5. **Copy the API key** (starts with `re_...`)

---

### **Step 2: Configure Cloudflare Production Secret**

Run this command and paste your Resend API key when prompted:

```bash
npx wrangler secret put RESEND_API_KEY --project-name moodmash
```

**Verify it's set:**
```bash
npx wrangler secret list --project-name moodmash
```

You should see `RESEND_API_KEY` in the list.

---

### **Step 3: Configure Resend Domain (IMPORTANT)**

By default, emails are sent from `noreply@moodmash.win`. You need to:

#### **Option A: Use Your Own Domain (Recommended)**
1. Go to [https://resend.com/domains](https://resend.com/domains)
2. Click **"Add Domain"**
3. Enter your domain: `moodmash.win`
4. Add the DNS records Resend provides:
   - **SPF**: TXT record for email authentication
   - **DKIM**: TXT record for email signing
   - **DMARC**: TXT record for email policy

#### **Option B: Use Resend's Test Domain (Development Only)**
- Free tier includes `onboarding@resend.dev` sender
- **Limitation**: Can only send to verified email addresses
- Good for testing, but not production

---

### **Step 4: Update Email Sender (If Using Different Domain)**

If you're not using `moodmash.win`, update the sender in `/home/user/webapp/src/utils/email.ts`:

```typescript
// Line 23 - Change the 'from' default:
from = 'MoodMash <noreply@YOUR-DOMAIN.com>'
```

---

## 📧 Email Templates

### **1. Password Reset Email**
- **Subject**: "Reset Your MoodMash Password"
- **Link Expiry**: 60 minutes
- **Trigger**: User clicks "Forgot Password"
- **Endpoint**: `POST /api/auth/password-reset/request`

### **2. Magic Link Email**
- **Subject**: "🔐 Sign in to MoodMash"
- **Link Expiry**: 15 minutes
- **Trigger**: User requests passwordless sign-in
- **Endpoint**: `POST /api/auth/magic-link/request`

### **3. Welcome Email**
- **Subject**: "🌈 Welcome to MoodMash!"
- **Trigger**: New user registration
- **Endpoint**: `POST /api/auth/register`

---

## 🧪 Testing Email Functionality

### **Local Development Testing**

1. **Set up `.dev.vars` file:**
```bash
cd /home/user/webapp
cp .dev.vars.example .dev.vars
```

2. **Add your Resend API key to `.dev.vars`:**
```bash
RESEND_API_KEY=re_your_actual_key_here
```

3. **Build and run locally:**
```bash
npm run build
pm2 start ecosystem.config.cjs
```

4. **Test password reset:**
```bash
curl -X POST https://localhost:3000/api/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

5. **Check PM2 logs for email confirmation:**
```bash
pm2 logs --nostream | grep Email
```

---

### **Production Testing**

1. **Deploy to Cloudflare:**
```bash
npm run deploy
```

2. **Test from production:**
```bash
curl -X POST https://moodmash.win/api/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

3. **Check your inbox** - you should receive the email within 5 seconds

---

## 🔍 Troubleshooting

### **"Email not sending"**
- ✅ Verify `RESEND_API_KEY` is set: `npx wrangler secret list --project-name moodmash`
- ✅ Check domain is verified in Resend dashboard
- ✅ Check Resend logs: [https://resend.com/emails](https://resend.com/emails)
- ✅ Verify sender email matches verified domain

### **"Domain not verified"**
- DNS records can take up to 48 hours to propagate
- Use `dig TXT _resend.yourdomain.com` to check DNS
- Temporarily use `onboarding@resend.dev` for testing

### **"Rate limit exceeded"**
- Free tier: 100 emails/day, 1 email/second
- Upgrade to paid plan for higher limits
- Check Resend dashboard for quota usage

---

## 📊 Implementation Details

### **Code Changes**
- **New File**: `src/utils/email.ts` (13.8 KB)
  - `sendEmail()` - Main email sending function
  - `generatePasswordResetEmail()` - HTML template
  - `generateMagicLinkEmail()` - HTML template  
  - `generateWelcomeEmail()` - HTML template
  - `generate2FABackupCodesEmail()` - HTML template

- **Modified Files**:
  - `src/index.tsx` - Integrated email sending into auth routes
  - `.dev.vars` - Local development environment variables
  - `wrangler.jsonc` - Environment variable documentation

### **Authentication Routes Updated**
- `POST /api/auth/register` - Sends welcome email
- `POST /api/auth/password-reset/request` - Sends reset email
- `POST /api/auth/magic-link/request` - Sends magic link email

### **Error Handling**
- Emails fail **silently** - authentication flow continues even if email fails
- Errors are logged to console with `[Email]` prefix
- Production: Check Cloudflare logs for email errors

---

## 🎨 Email Design Features

All email templates include:
- ✨ Professional HTML/CSS design
- 📱 Mobile-responsive layout
- 🔒 Security warnings and tips
- ⏰ Expiration time display
- 🌈 MoodMash branding
- 🔗 Clickable buttons + fallback links

---

## 🔐 Security Best Practices

- ✅ All links use HTTPS
- ✅ Tokens are UUID v4 (cryptographically secure)
- ✅ Expiration times enforced in database
- ✅ Email enumeration prevented (always returns success)
- ✅ Links are single-use (marked as used in DB)
- ✅ Sender domain authentication (SPF/DKIM)

---

## 📈 Next Steps

1. ✅ **Integrate Resend API key** (You have it!)
2. ⏳ **Set Cloudflare secret**: `npx wrangler secret put RESEND_API_KEY --project-name moodmash`
3. ⏳ **Verify domain in Resend** (if using custom domain)
4. ⏳ **Build and deploy**: `npm run build && npm run deploy`
5. ⏳ **Test production emails**
6. ✨ **Done!**

---

## 📞 Support

- **Resend Documentation**: [https://resend.com/docs](https://resend.com/docs)
- **Resend Email Logs**: [https://resend.com/emails](https://resend.com/emails)
- **DNS Checker**: [https://dnschecker.org](https://dnschecker.org)

---

**Status**: ✅ **CODE READY** | ⏳ **AWAITING API KEY SETUP**

After you set the `RESEND_API_KEY` in Cloudflare secrets, email functionality will be **fully operational**!
