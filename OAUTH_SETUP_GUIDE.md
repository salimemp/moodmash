# OAuth Setup Guide for MoodMash

## Overview

MoodMash supports OAuth 2.0 authentication with Google and GitHub. This guide explains how to set up OAuth for web, iOS, and Android platforms.

---

## ❓ Do I Need Separate Client IDs for iOS and Android?

### **Short Answer: YES, for production apps**

### **Long Answer:**

#### **Google OAuth:**
- **Web App**: Requires one Client ID (Web application type)
- **iOS App**: Requires a separate Client ID (iOS type)
- **Android App**: Requires a separate Client ID (Android type)

**Why?** Google's OAuth system differentiates between platforms for security reasons. Each platform has different redirect URI schemes:
- **Web**: `https://yourdomain.com/auth/google/callback`
- **iOS**: `com.googleusercontent.apps.YOUR-CLIENT-ID:/oauth2redirect`
- **Android**: Uses package name and SHA-1 certificate fingerprint

#### **GitHub OAuth:**
- **All Platforms**: Can use the same Client ID and Secret
- GitHub OAuth is more flexible and works across web, iOS, and Android with the same credentials
- However, for better security and analytics, you may still create separate OAuth apps per platform

---

## 🔧 Current Issue: OAuth Not Configured

The error you're seeing ("OAuth not yet configured") means the environment variables are missing. Here's how to fix it:

---

## 📱 Setup Instructions

### **Step 1: Set Up Google OAuth**

#### 1.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**

#### 1.2 Configure for Each Platform

**For Web Application:**
```
Application type: Web application
Name: MoodMash Web
Authorized JavaScript origins:
  - https://moodmash.win
  - https://e823b996.moodmash.pages.dev (your staging URLs)
  - http://localhost:3000 (for local development)

Authorized redirect URIs:
  - https://moodmash.win/auth/google/callback
  - https://e823b996.moodmash.pages.dev/auth/google/callback
  - http://localhost:3000/auth/google/callback
```

**For iOS Application:**
```
Application type: iOS
Name: MoodMash iOS
Bundle ID: com.yourdomain.moodmash
```

**For Android Application:**
```
Application type: Android
Name: MoodMash Android
Package name: com.yourdomain.moodmash
SHA-1 certificate fingerprint: (get from your keystore)
```

#### 1.3 Get Your Credentials

After creating each OAuth client, you'll receive:
- **Client ID**: `1234567890-abcdefgh.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxxxxxxxxx` (for web only, not needed for mobile)

---

### **Step 2: Set Up GitHub OAuth (Optional)**

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the details:

```
Application name: MoodMash
Homepage URL: https://moodmash.win
Authorization callback URL: https://moodmash.win/auth/github/callback
```

4. Click **Register application**
5. Note down your **Client ID** and generate a **Client Secret**

---

### **Step 3: Configure Environment Variables**

#### 3.1 For Production (Cloudflare Pages)

Set the secrets using Wrangler CLI:

```bash
# Google OAuth (Web)
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name moodmash
# Paste your Client ID when prompted

npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name moodmash
# Paste your Client Secret when prompted

# Google OAuth (iOS - if building mobile app)
npx wrangler pages secret put GOOGLE_IOS_CLIENT_ID --project-name moodmash

# Google OAuth (Android - if building mobile app)
npx wrangler pages secret put GOOGLE_ANDROID_CLIENT_ID --project-name moodmash

# GitHub OAuth (optional)
npx wrangler pages secret put GITHUB_CLIENT_ID --project-name moodmash
npx wrangler pages secret put GITHUB_CLIENT_SECRET --project-name moodmash

# Base URL for OAuth callbacks
npx wrangler pages secret put BASE_URL --project-name moodmash
# Enter: https://moodmash.win
```

#### 3.2 For Local Development

Create a `.dev.vars` file in your project root:

```bash
# .dev.vars
GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
BASE_URL=http://localhost:3000
```

**Important**: Add `.dev.vars` to your `.gitignore` file to prevent committing secrets!

---

### **Step 4: Update wrangler.jsonc (Documentation)**

Update the comments in `wrangler.jsonc` to document the OAuth secrets:

```jsonc
{
  // ... existing config ...
  
  // Environment Variables (configured via CLI or Cloudflare Dashboard)
  // OAuth Authentication:
  //   GOOGLE_CLIENT_ID - Google OAuth Web Client ID
  //   GOOGLE_CLIENT_SECRET - Google OAuth Web Client Secret
  //   GOOGLE_IOS_CLIENT_ID - (Optional) For iOS app
  //   GOOGLE_ANDROID_CLIENT_ID - (Optional) For Android app
  //   GITHUB_CLIENT_ID - GitHub OAuth Client ID
  //   GITHUB_CLIENT_SECRET - GitHub OAuth Client Secret
  //   BASE_URL - Your production domain (e.g., https://moodmash.win)
  
  // To set production secrets:
  //   npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name moodmash
  //   npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name moodmash
  
  // For local dev: Use .dev.vars file (see OAUTH_SETUP_GUIDE.md)
}
```

---

### **Step 5: Verify Setup**

#### 5.1 Test Locally

```bash
# Start local development server
cd /home/user/webapp
npm run dev:d1

# Open browser and try OAuth login
open http://localhost:3000
```

#### 5.2 Test in Production

After setting secrets and deploying:

```bash
# Deploy to production
npm run deploy

# Test OAuth endpoints
curl https://moodmash.win/auth/google
curl https://moodmash.win/auth/github
```

---

## 🔐 Security Best Practices

### 1. **Use Different Credentials for Each Environment**
```
Development: Use separate OAuth apps with localhost callbacks
Staging: Use separate OAuth apps with staging domain
Production: Use production OAuth apps with production domain
```

### 2. **Restrict Redirect URIs**
Only add the exact URLs you need:
- ✅ `https://moodmash.win/auth/google/callback`
- ❌ `https://moodmash.win/*` (too broad)

### 3. **Rotate Secrets Regularly**
- Change OAuth secrets every 90 days
- Immediately rotate if credentials are exposed

### 4. **Monitor OAuth Usage**
- Check Google Cloud Console for unusual activity
- Set up alerts for failed authentication attempts

### 5. **Use HTTPS Only**
- Never use OAuth with HTTP in production
- Local development with HTTP is okay for testing

---

## 📲 Mobile App Integration (Future)

When you build iOS/Android apps, you'll need to:

### **For iOS:**

1. Install Google Sign-In SDK:
```swift
// Using CocoaPods
pod 'GoogleSignIn'
```

2. Configure `Info.plist` with your iOS Client ID

3. Implement OAuth flow:
```swift
GIDSignIn.sharedInstance.signIn(with: config, presenting: self) { user, error in
  // Handle authentication
}
```

### **For Android:**

1. Add Google Sign-In dependency:
```gradle
implementation 'com.google.android.gms:play-services-auth:20.7.0'
```

2. Configure with your Android Client ID

3. Implement OAuth flow:
```kotlin
val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
    .requestIdToken(getString(R.string.google_client_id))
    .requestEmail()
    .build()
```

### **Backend API Integration:**

Your mobile apps will send the OAuth token to your backend:

```typescript
// In src/index.tsx - add mobile OAuth verification endpoint
app.post('/api/auth/mobile/google', async (c) => {
  const { idToken, platform } = await c.req.json();
  
  // Verify the ID token with Google
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
  );
  
  const payload = await response.json();
  
  // Verify the client ID matches your mobile app
  const expectedClientId = platform === 'ios' 
    ? c.env.GOOGLE_IOS_CLIENT_ID 
    : c.env.GOOGLE_ANDROID_CLIENT_ID;
  
  if (payload.aud !== expectedClientId) {
    return c.json({ error: 'Invalid client ID' }, 401);
  }
  
  // Create session and return session token
  const session = createSession({
    userId: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    provider: 'google',
    isPremium: false,
    createdAt: Date.now()
  });
  
  return c.json({ sessionToken: session });
});
```

---

## 🐛 Troubleshooting

### Error: "OAuth not yet configured"

**Solution**: Environment variables are not set.

```bash
# Check if secrets are set
npx wrangler pages secret list --project-name moodmash

# If empty, set them:
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name moodmash
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name moodmash
```

### Error: "redirect_uri_mismatch"

**Solution**: The callback URL doesn't match what's configured in Google Cloud Console.

1. Check your authorized redirect URIs in Google Cloud Console
2. Make sure they exactly match your deployment URL
3. Add all your deployment URLs (production, staging, dev)

### Error: "invalid_client"

**Solution**: Wrong Client ID or Secret.

1. Double-check you copied the correct credentials from Google Cloud Console
2. Make sure there are no extra spaces or line breaks
3. Regenerate the secret if needed

### Error: "access_denied"

**Solution**: User canceled the OAuth flow or OAuth consent screen needs configuration.

1. Check your OAuth consent screen configuration
2. Make sure your app is not in "Testing" mode (or add test users)
3. Verify required scopes are enabled

---

## 📚 Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Cloudflare Pages Secrets](https://developers.cloudflare.com/pages/platform/functions/bindings/#secrets)
- [Arctic OAuth Library](https://arctic.js.org/) (used in MoodMash)

---

## 📝 Quick Checklist

Before going live with OAuth:

- [ ] Created Google OAuth Web credentials
- [ ] Created iOS OAuth credentials (if building iOS app)
- [ ] Created Android OAuth credentials (if building Android app)
- [ ] Created GitHub OAuth app (optional)
- [ ] Set GOOGLE_CLIENT_ID in production
- [ ] Set GOOGLE_CLIENT_SECRET in production
- [ ] Set BASE_URL in production
- [ ] Added all redirect URIs to Google Cloud Console
- [ ] Tested OAuth login in production
- [ ] Verified user session creation
- [ ] Set up OAuth consent screen properly
- [ ] Added privacy policy and terms of service
- [ ] Configured .dev.vars for local development
- [ ] Added .dev.vars to .gitignore

---

## 🆘 Need Help?

If you're still having issues:

1. Check the browser console for detailed error messages
2. Check Cloudflare Pages logs: `npx wrangler pages deployment tail`
3. Verify secrets are set: `npx wrangler pages secret list --project-name moodmash`
4. Review OAuth consent screen settings in Google Cloud Console
5. Test with a simple redirect first before full OAuth flow

---

**Last Updated**: January 2025  
**MoodMash Version**: 1.0  
**OAuth Provider**: Arctic.js + Google/GitHub APIs
