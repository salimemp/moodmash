# MoodMash - Missing APIs and Components Analysis

## 📋 Executive Summary

**Analysis Date:** November 25, 2025  
**Project:** MoodMash v10.5  
**Status:** Production Ready with Several Missing External Integrations

This document provides a comprehensive analysis of **all missing external APIs, third-party services, and incomplete implementations** in the MoodMash application.

---

## 🔴 CRITICAL MISSING APIS (High Priority)

### 1. **OAuth Provider Credentials**
**Status:** ⚠️ **NOT CONFIGURED**  
**Impact:** OAuth authentication will fail for all users

**Missing Credentials:**
- `GOOGLE_CLIENT_ID` - Not configured
- `GOOGLE_CLIENT_SECRET` - Not configured
- `GITHUB_CLIENT_ID` - Not configured
- `GITHUB_CLIENT_SECRET` - Not configured
- `FACEBOOK_CLIENT_ID` - Not configured
- `FACEBOOK_CLIENT_SECRET` - Not configured

**Location:** `src/auth.ts` lines 11-25

**Current Implementation:**
```typescript
google: new Google(
    env.GOOGLE_CLIENT_ID || '',  // ❌ Empty string fallback
    env.GOOGLE_CLIENT_SECRET || '',
    `${baseUrl}/auth/google/callback`
)
```

**Required Actions:**
1. Create OAuth apps on Google Cloud Console, GitHub, and Facebook Developer Portal
2. Set credentials using `wrangler secret put`:
   ```bash
   npx wrangler secret put GOOGLE_CLIENT_ID
   npx wrangler secret put GOOGLE_CLIENT_SECRET
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   npx wrangler secret put FACEBOOK_CLIENT_ID
   npx wrangler secret put FACEBOOK_CLIENT_SECRET
   ```
3. Configure callback URLs in each OAuth provider:
   - Google: `https://moodmash.win/auth/google/callback`
   - GitHub: `https://moodmash.win/auth/github/callback`
   - Facebook: `https://moodmash.win/auth/facebook/callback`

**Setup Guides:**
- Google: https://console.cloud.google.com/apis/credentials
- GitHub: https://github.com/settings/developers
- Facebook: https://developers.facebook.com/apps

---

### 2. **AI/ML API for Wellness Tips**
**Status:** ⚠️ **MOCK IMPLEMENTATION**  
**Impact:** AI wellness tips feature not functional, returns hardcoded responses

**Current Issue:** `src/index.tsx` line 1081
```typescript
// In production, integrate with OpenAI API
// For now, return curated tips based on mood and category
const tips = generateMockTips(body.mood, body.categories);
```

**Missing Services:**
- OpenAI API (GPT-4, GPT-3.5-turbo) - Recommended
- Anthropic Claude API - Alternative
- Google Gemini API - Alternative (API key exists in `.dev.vars`)

**Available API Key:**
- ✅ `GEMINI_API_KEY` is configured in `.dev.vars`
- Value: `AIzaSyDlbwOrgsn62F7be7yILDgB5nRVW9gdXwo`

**Recommended Implementation:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

// Already installed in package.json!
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const prompt = `Generate wellness tips for someone feeling ${mood} in these categories: ${categories.join(', ')}`;
const result = await model.generateContent(prompt);
const tips = result.response.text();
```

**Required Actions:**
1. Use existing Gemini API key from `.dev.vars`
2. Set production secret: `npx wrangler secret put GEMINI_API_KEY`
3. Implement actual AI tip generation using `@google/generative-ai` package
4. Remove `generateMockTips()` function

---

### 3. **Email Service for Notifications**
**Status:** ❌ **NOT IMPLEMENTED**  
**Impact:** Password reset, magic link, and notification emails cannot be sent

**Missing Implementations:**

#### **3a. Password Reset Emails**
**Location:** `src/index.tsx` line 1592
```typescript
// In production, send email with reset link
console.log(`Password reset token for ${email}: ${resetToken}`);
```

#### **3b. Magic Link Emails**
**Location:** `src/index.tsx` line 1667
```typescript
// In production, send email with magic link
const magicLink = `https://...?token=${token}`;
console.log(`Magic link for ${email}: ${magicLink}`);
```

**Recommended Email Services:**
- **SendGrid** (Free tier: 100 emails/day)
  - API: `https://api.sendgrid.com/v3/mail/send`
  - Setup: https://sendgrid.com/
  
- **Resend** (Free tier: 3,000 emails/month) - Recommended for developers
  - API: `https://api.resend.com/emails`
  - Setup: https://resend.com/
  
- **Mailgun** (Free tier: 1,000 emails/month)
  - API: `https://api.mailgun.net/v3/`
  - Setup: https://www.mailgun.com/

**Required Actions:**
1. Choose email service provider
2. Create account and get API key
3. Set secret: `npx wrangler secret put EMAIL_API_KEY`
4. Implement email sending functions
5. Create email templates for:
   - Password reset
   - Magic link login
   - 2FA backup codes (optional)
   - Welcome email (optional)

**Implementation Example (Resend):**
```typescript
async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.EMAIL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'noreply@moodmash.win',
      to,
      subject,
      html
    })
  });
  return await response.json();
}
```

---

## 🟡 MEDIUM PRIORITY MISSING APIS

### 4. **SMS Service for 2FA (Optional)**
**Status:** ❌ **NOT IMPLEMENTED**  
**Impact:** No SMS-based 2FA option for users

**Recommended Services:**
- **Twilio** (Pay-as-you-go, ~$0.0075/SMS in US)
  - API: `https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json`
  - Setup: https://www.twilio.com/
  
- **Vonage (Nexmo)** (Pay-as-you-go)
  - API: `https://rest.nexmo.com/sms/json`
  - Setup: https://www.vonage.com/

**Required Credentials:**
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

**Implementation Notes:**
- Not critical since TOTP and hardware tokens are implemented
- Would enhance accessibility for non-technical users
- Consider cost per SMS before implementing

---

### 5. **Payment Gateway for Subscriptions**
**Status:** ⚠️ **DATABASE READY, API NOT INTEGRATED**  
**Impact:** Premium subscription features cannot be purchased

**Database Status:**
- ✅ Subscription tables exist (from migration `0013_premium_subscriptions.sql`)
- ✅ Schema includes: `subscriptions`, `subscription_plans`, `payment_transactions`
- ❌ No payment processing implementation

**Recommended Services:**

#### **Stripe** (Recommended) - Industry Standard
- **Setup:** https://stripe.com/
- **API:** `https://api.stripe.com/v1/`
- **Required Secrets:**
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`

**Implementation Requirements:**
1. Create Stripe account
2. Set up subscription products
3. Implement checkout session creation
4. Handle webhook events for:
   - Payment success
   - Subscription cancellation
   - Payment failures
5. Update user's `isPremium` status in database

**Frontend Integration:**
```html
<script src="https://js.stripe.com/v3/"></script>
```

**Backend API Example:**
```typescript
app.post('/api/subscriptions/checkout', async (c) => {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price: 'price_premium_monthly',
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: 'https://moodmash.win/subscription/success',
    cancel_url: 'https://moodmash.win/subscription/cancel',
  });
  
  return c.json({ sessionId: session.id });
});
```

---

### 6. **Analytics & Monitoring Services**
**Status:** ⚠️ **PARTIAL IMPLEMENTATION**  
**Impact:** Limited production monitoring and error tracking

**Current Status:**
- ✅ Custom analytics implemented in `src/middleware/analytics.ts`
- ✅ Database logging for API metrics, page views, errors
- ❌ No external monitoring/alerting service

**Recommended Services:**

#### **6a. Error Monitoring - Sentry**
- **Purpose:** Real-time error tracking and alerts
- **Setup:** https://sentry.io/
- **Free Tier:** 5,000 errors/month
- **Implementation:**
```typescript
import * as Sentry from '@sentry/cloudflare';

Sentry.init({
  dsn: env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

#### **6b. Application Monitoring - Datadog**
- **Purpose:** Performance monitoring, metrics, dashboards
- **Setup:** https://www.datadoghq.com/
- **Alternative:** New Relic, AppDynamics

#### **6c. Analytics - Google Analytics 4**
- **Purpose:** User behavior analytics
- **Setup:** https://analytics.google.com/
- **Free:** Unlimited events
- **Implementation:** Add tracking code to frontend HTML

**Required Actions:**
1. Choose monitoring service(s)
2. Set up accounts and get credentials
3. Install SDKs and configure
4. Create dashboards and alerts

---

### 7. **CDN/Asset Hosting for Large Files**
**Status:** ⚠️ **R2 CONFIGURED, NEEDS SETUP**  
**Impact:** Voice notes, media uploads may not work optimally

**Current Status:**
- ✅ R2 bucket configured in `wrangler.jsonc`
- ✅ Upload/download functions in `src/utils/media.ts`
- ⚠️ R2 bucket needs to be created

**Required Actions:**
```bash
# Create R2 bucket
npx wrangler r2 bucket create moodmash-storage

# Verify bucket exists
npx wrangler r2 bucket list
```

**Alternative Services (if R2 not sufficient):**
- AWS S3
- Google Cloud Storage
- Cloudinary (image/video optimization)

---

## 🟢 LOW PRIORITY / OPTIONAL APIS

### 8. **Push Notifications**
**Status:** ⚠️ **FRONTEND CODE EXISTS, BACKEND NOT IMPLEMENTED**  
**Impact:** Browser push notifications don't work

**Current Status:**
- ✅ Frontend PWA code in `public/static/pwa-advanced.js`
- ✅ Service worker with push notification handlers
- ❌ Backend push notification server not implemented

**Recommended Services:**
- **Firebase Cloud Messaging (FCM)** - Free
- **OneSignal** - Free tier available
- **Pusher** - Free for development

**Required Implementation:**
1. Set up push notification service
2. Store push subscriptions in database
3. Create API to send notifications
4. Implement notification triggers (mood reminders, etc.)

---

### 9. **Geolocation Services (Optional)**
**Status:** ❌ **NOT IMPLEMENTED**  
**Impact:** No location-based features

**Potential Use Cases:**
- Weather-based mood correlations
- Local wellness activity recommendations
- Timezone handling

**Recommended Services:**
- **OpenWeatherMap API** - Free tier: 60 calls/min
- **Google Maps Geolocation API**
- **ipapi.co** - Free: 1,000 requests/day

---

### 10. **CAPTCHA/Bot Protection**
**Status:** ❌ **NOT IMPLEMENTED**  
**Impact:** No protection against automated attacks

**Recommended Services:**

#### **Cloudflare Turnstile** (Recommended - Free)
- Native Cloudflare integration
- Privacy-friendly alternative to reCAPTCHA
- Setup: https://dash.cloudflare.com/turnstile

#### **hCaptcha** - Alternative
- Privacy-focused
- Free tier available

**Implementation Location:**
- Login form
- Registration form
- Password reset form
- Contact/support forms

---

### 11. **Search Service (Optional)**
**Status:** ❌ **NOT IMPLEMENTED**  
**Impact:** No full-text search for mood entries, activities

**Recommended Services:**
- **Algolia** - Fast, hosted search (free tier: 10k requests/month)
- **Elasticsearch** - Self-hosted
- **Cloudflare D1 Full-Text Search** - Built-in (when available)

**Potential Implementation:**
- Search mood entries by notes/tags
- Search wellness activities
- Search community posts (if social features active)

---

### 12. **Calendar Integration (Optional)**
**Status:** ❌ **NOT IMPLEMENTED**  
**Impact:** No calendar export/import for mood tracking

**Potential Integrations:**
- Google Calendar API
- Microsoft Outlook Calendar API
- Apple Calendar (.ics export)

---

### 13. **Data Export Services (Optional)**
**Status:** ❌ **NOT IMPLEMENTED**  
**Impact:** Users cannot export their data to other formats

**Missing Features:**
- CSV export
- PDF report generation
- JSON API for data portability
- GDPR compliance export

**Recommended Tools:**
- **jsPDF** for PDF generation
- **papaparse** for CSV export
- Custom JSON export endpoint

---

## 📊 Implementation Status Summary

### By Priority

| Priority | Category | Missing Items | Status |
|----------|----------|---------------|--------|
| 🔴 Critical | OAuth | 3 providers (6 credentials) | Not configured |
| 🔴 Critical | AI/ML | Wellness tips AI integration | Mock implementation |
| 🔴 Critical | Email | Password reset, magic links | Console logging only |
| 🟡 Medium | SMS | 2FA via SMS | Not implemented |
| 🟡 Medium | Payments | Stripe integration | DB ready, API missing |
| 🟡 Medium | Monitoring | Sentry, analytics | Partial (custom only) |
| 🟡 Medium | Storage | R2 bucket setup | Configured, needs creation |
| 🟢 Low | Push | Backend push server | Frontend ready |
| 🟢 Low | Geolocation | Weather/location APIs | Not implemented |
| 🟢 Low | CAPTCHA | Bot protection | Not implemented |
| 🟢 Low | Search | Full-text search | Not implemented |
| 🟢 Low | Calendar | Calendar integrations | Not implemented |
| 🟢 Low | Export | Data export features | Not implemented |

---

## 🔧 Quick Setup Priority List

### **Phase 1: Critical (Must Have for Production)**
1. ✅ Set up OAuth credentials (Google, GitHub, Facebook)
2. ✅ Implement AI wellness tips using Gemini API
3. ✅ Set up email service (Resend recommended)
4. ✅ Create R2 bucket for file storage

**Estimated Time:** 4-6 hours

### **Phase 2: Important (Enhance Core Features)**
5. ✅ Implement payment gateway (Stripe)
6. ✅ Set up error monitoring (Sentry)
7. ✅ Add bot protection (Cloudflare Turnstile)

**Estimated Time:** 6-8 hours

### **Phase 3: Nice to Have (Additional Features)**
8. ⏳ Push notification backend
9. ⏳ SMS 2FA (Twilio)
10. ⏳ Data export features
11. ⏳ Full-text search

**Estimated Time:** 8-12 hours

---

## 📝 Environment Variables Needed

### **Production Secrets (wrangler secret put)**
```bash
# OAuth
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
FACEBOOK_CLIENT_ID
FACEBOOK_CLIENT_SECRET

# AI/ML
GEMINI_API_KEY  # Already have: AIzaSyDlbwOrgsn62F7be7yILDgB5nRVW9gdXwo

# Email
EMAIL_API_KEY  # Resend, SendGrid, or Mailgun
EMAIL_FROM_ADDRESS  # e.g., noreply@moodmash.win

# Payments (if implementing)
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET

# Monitoring (optional)
SENTRY_DSN

# SMS (optional)
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
```

### **Public Environment Variables (wrangler.jsonc)**
```jsonc
{
  "vars": {
    "BASE_URL": "https://moodmash.win",
    "ENVIRONMENT": "production"
  }
}
```

---

## 🚨 Security Recommendations

### **1. Secrets Management**
- ✅ Never commit secrets to git
- ✅ Use `wrangler secret put` for production
- ✅ Use `.dev.vars` for local development
- ✅ Rotate secrets regularly (especially OAuth)

### **2. API Key Protection**
- ✅ Validate all API keys before use
- ✅ Implement rate limiting
- ✅ Log API key usage
- ✅ Monitor for unauthorized access

### **3. Third-Party Service Security**
- ✅ Use HTTPS only
- ✅ Validate webhook signatures (Stripe, etc.)
- ✅ Implement CSRF protection
- ✅ Set up proper CORS policies

---

## 📋 Complete TODO List

### **Backend Implementation**
- [ ] Configure OAuth credentials for Google, GitHub, Facebook
- [ ] Implement Gemini AI integration for wellness tips
- [ ] Set up email service (Resend) for password reset and magic links
- [ ] Create R2 bucket and verify file upload functionality
- [ ] Integrate Stripe for payment processing
- [ ] Set up Sentry for error monitoring
- [ ] Implement push notification backend
- [ ] Add Cloudflare Turnstile for bot protection
- [ ] Create data export endpoints (CSV, PDF, JSON)
- [ ] Implement SMS 2FA with Twilio (optional)

### **Frontend Implementation**
- [ ] Add Stripe.js integration for subscription checkout
- [ ] Implement Google Analytics 4 tracking
- [ ] Add CAPTCHA to forms
- [ ] Create data export UI
- [ ] Add calendar export functionality

### **DevOps/Infrastructure**
- [ ] Set all production secrets via `wrangler secret put`
- [ ] Create monitoring dashboards
- [ ] Set up automated backups
- [ ] Configure domain email (noreply@moodmash.win)
- [ ] Set up uptime monitoring

---

## 🎯 Conclusion

**Total Missing APIs: 13+ integrations**

The MoodMash application is **production-ready** from a code perspective, but requires **critical external API integrations** to be fully functional. The most urgent needs are:

1. **OAuth credentials** (authentication will fail without these)
2. **AI/ML integration** (wellness tips feature is mocked)
3. **Email service** (password reset and magic links don't work)

All other integrations are **optional** or **low priority** and can be added incrementally based on user needs and feature prioritization.

---

**Last Updated:** November 25, 2025  
**Next Review:** After Phase 1 implementation  
**Maintainer:** Development Team
