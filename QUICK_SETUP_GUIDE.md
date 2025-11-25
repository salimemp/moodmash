# MoodMash - Quick Setup Guide for Missing APIs

## 🚀 Critical APIs Setup (Must Complete First)

### 1. OAuth Authentication (CRITICAL)
**Time: 2-3 hours**

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create new project "MoodMash"
3. Enable Google+ API
4. Create OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://moodmash.win/auth/google/callback` (production)
6. Copy Client ID and Secret
7. Set secrets:
   ```bash
   npx wrangler secret put GOOGLE_CLIENT_ID
   npx wrangler secret put GOOGLE_CLIENT_SECRET
   ```

#### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - Application name: MoodMash
   - Homepage URL: `https://moodmash.win`
   - Authorization callback URL: `https://moodmash.win/auth/github/callback`
4. Copy Client ID and generate Client Secret
5. Set secrets:
   ```bash
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   ```

#### Facebook OAuth
1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Create new app → "Consumer" type
3. Add "Facebook Login" product
4. Configure OAuth Redirect URIs: `https://moodmash.win/auth/facebook/callback`
5. Copy App ID and App Secret
6. Set secrets:
   ```bash
   npx wrangler secret put FACEBOOK_CLIENT_ID
   npx wrangler secret put FACEBOOK_CLIENT_SECRET
   ```

---

### 2. AI Wellness Tips (CRITICAL)
**Time: 30 minutes**

**Good News:** You already have a Gemini API key! ✅

**Current Key:** `AIzaSyDlbwOrgsn62F7be7yILDgB5nRVW9gdXwo`

**Setup:**
1. Set production secret:
   ```bash
   npx wrangler secret put GEMINI_API_KEY
   # Paste: AIzaSyDlbwOrgsn62F7be7yILDgB5nRVW9gdXwo
   ```

2. Replace mock implementation in `src/index.tsx` (around line 1083):
   ```typescript
   import { GoogleGenerativeAI } from '@google/generative-ai';
   
   app.post('/api/wellness-tips/generate', async (c) => {
     const { DB } = c.env;
     const { mood, categories } = await c.req.json();
     
     try {
       // Use Gemini API
       const genAI = new GoogleGenerativeAI(c.env.GEMINI_API_KEY);
       const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
       
       const prompt = `Generate 3 personalized wellness tips for someone feeling "${mood}". Focus on these categories: ${categories.join(', ')}. Each tip should be actionable, supportive, and 2-3 sentences long. Format as JSON array: [{"category": "...", "tip_text": "..."}]`;
       
       const result = await model.generateContent(prompt);
       const response = result.response.text();
       const tips = JSON.parse(response);
       
       // Store tips in database
       for (const tip of tips) {
         await DB.prepare(`
           INSERT INTO ai_wellness_tips (user_id, tip_text, category, mood_context, ai_model)
           VALUES (?, ?, ?, ?, ?)
         `).bind(1, tip.tip_text, tip.category, JSON.stringify({ mood }), 'gemini-pro').run();
       }
       
       return c.json({ tips });
     } catch (error: any) {
       console.error('AI tip generation error:', error);
       // Fallback to mock tips if AI fails
       const tips = generateMockTips(mood, categories);
       return c.json({ tips });
     }
   });
   ```

3. Rebuild and deploy:
   ```bash
   npm run build
   npx wrangler pages deploy dist --project-name=moodmash
   ```

---

### 3. Email Service (CRITICAL)
**Time: 1 hour**

**Recommended: Resend (easiest, 3,000 free emails/month)**

#### Setup Resend
1. Go to [Resend](https://resend.com/)
2. Sign up for free account
3. Verify your domain `moodmash.win` OR use resend.dev subdomain
4. Get API key from dashboard
5. Set secret:
   ```bash
   npx wrangler secret put EMAIL_API_KEY
   # Paste your Resend API key
   ```

#### Implement Email Sending
Create `src/utils/email.ts`:
```typescript
export async function sendEmail(
  apiKey: string,
  to: string,
  subject: string,
  html: string,
  from: string = 'MoodMash <noreply@moodmash.win>'
) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from, to, subject, html })
  });

  if (!response.ok) {
    throw new Error(`Email failed: ${response.status}`);
  }

  return await response.json();
}

export function generatePasswordResetEmail(resetLink: string): string {
  return `
    <h1>Reset Your Password</h1>
    <p>Click the link below to reset your MoodMash password:</p>
    <a href="${resetLink}">Reset Password</a>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;
}

export function generateMagicLinkEmail(magicLink: string): string {
  return `
    <h1>Sign in to MoodMash</h1>
    <p>Click the link below to sign in:</p>
    <a href="${magicLink}">Sign In</a>
    <p>This link expires in 15 minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;
}
```

#### Update Password Reset Endpoint
In `src/index.tsx` line 1592, replace:
```typescript
// Replace this:
console.log(`Password reset token for ${email}: ${resetToken}`);

// With this:
import { sendEmail, generatePasswordResetEmail } from './utils/email';

const resetLink = `https://moodmash.win/reset-password?token=${resetToken}`;
await sendEmail(
  c.env.EMAIL_API_KEY,
  email,
  'Reset Your MoodMash Password',
  generatePasswordResetEmail(resetLink)
);
```

#### Update Magic Link Endpoint
In `src/index.tsx` line 1667, replace:
```typescript
// Replace this:
console.log(`Magic link for ${email}: ${magicLink}`);

// With this:
await sendEmail(
  c.env.EMAIL_API_KEY,
  email,
  'Sign in to MoodMash',
  generateMagicLinkEmail(magicLink)
);
```

---

### 4. R2 Bucket Creation (CRITICAL)
**Time: 5 minutes**

```bash
# Create the bucket
npx wrangler r2 bucket create moodmash-storage

# Verify it exists
npx wrangler r2 bucket list

# Should see: moodmash-storage
```

**Done!** Your R2 storage is now ready for file uploads.

---

## 🎯 Phase 1 Complete Checklist

After completing the above:

- [ ] OAuth works for Google login
- [ ] OAuth works for GitHub login  
- [ ] OAuth works for Facebook login
- [ ] AI wellness tips generate real suggestions
- [ ] Password reset emails are sent
- [ ] Magic link emails are sent
- [ ] File uploads work to R2 storage

**Test URLs:**
- OAuth: `https://moodmash.win/auth/google` (should redirect to Google)
- AI Tips: POST to `https://moodmash.win/api/wellness-tips/generate`
- Password Reset: POST to `https://moodmash.win/api/auth/password-reset/request`

---

## 🟡 Phase 2: Medium Priority (Optional)

### 5. Stripe Payment Integration
**Time: 3-4 hours**

1. Create [Stripe account](https://stripe.com/)
2. Get test keys from dashboard
3. Create subscription products
4. Install Stripe on backend (already in package.json? Check if needed)
5. Implement checkout and webhooks

**Secrets needed:**
```bash
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_PUBLISHABLE_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

---

### 6. Sentry Error Monitoring
**Time: 30 minutes**

1. Create [Sentry account](https://sentry.io/)
2. Create new project "MoodMash"
3. Get DSN from project settings
4. Set secret:
   ```bash
   npx wrangler secret put SENTRY_DSN
   ```
5. Install Sentry SDK:
   ```bash
   npm install @sentry/cloudflare
   ```
6. Initialize in `src/index.tsx`:
   ```typescript
   import * as Sentry from '@sentry/cloudflare';
   
   if (c.env.SENTRY_DSN) {
     Sentry.init({ dsn: c.env.SENTRY_DSN });
   }
   ```

---

### 7. Cloudflare Turnstile (CAPTCHA)
**Time: 1 hour**

1. Go to [Cloudflare Turnstile](https://dash.cloudflare.com/turnstile)
2. Create new site widget
3. Add to login, register, reset password forms
4. Validate on server side

---

## 🔧 Quick Commands Reference

### Set All Critical Secrets
```bash
# OAuth
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put FACEBOOK_CLIENT_ID
npx wrangler secret put FACEBOOK_CLIENT_SECRET

# AI
npx wrangler secret put GEMINI_API_KEY

# Email
npx wrangler secret put EMAIL_API_KEY

# R2 Bucket
npx wrangler r2 bucket create moodmash-storage
```

### Rebuild and Deploy
```bash
npm run build
npx wrangler pages deploy dist --project-name=moodmash
```

### Test Endpoints
```bash
# Test OAuth
curl https://moodmash.win/auth/google

# Test AI tips
curl -X POST https://moodmash.win/api/wellness-tips/generate \
  -H "Content-Type: application/json" \
  -d '{"mood":"anxious","categories":["mindfulness","exercise"]}'

# Test password reset
curl -X POST https://moodmash.win/api/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## 📞 Support Resources

### API Documentation
- **Google OAuth:** https://developers.google.com/identity/protocols/oauth2
- **GitHub OAuth:** https://docs.github.com/en/developers/apps/building-oauth-apps
- **Facebook OAuth:** https://developers.facebook.com/docs/facebook-login
- **Gemini API:** https://ai.google.dev/docs
- **Resend API:** https://resend.com/docs
- **Cloudflare R2:** https://developers.cloudflare.com/r2/
- **Stripe API:** https://stripe.com/docs/api

### Troubleshooting
- **OAuth fails:** Check callback URLs match exactly
- **AI tips fail:** Verify Gemini API key is valid
- **Emails not sending:** Check Resend API key and domain verification
- **R2 uploads fail:** Ensure bucket exists with correct name

---

## ✅ Success Criteria

Phase 1 is complete when:
1. Users can log in with Google/GitHub/Facebook
2. AI wellness tips generate real suggestions
3. Password reset emails arrive in inbox
4. Magic link emails arrive in inbox
5. File uploads work without errors

**Estimated Total Time: 4-6 hours**

---

**Last Updated:** November 25, 2025  
**Next Steps:** Complete Phase 1 setup, then proceed to Phase 2 (payments, monitoring)
