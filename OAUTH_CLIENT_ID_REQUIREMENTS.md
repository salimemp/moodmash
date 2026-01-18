# OAuth Client ID Requirements: Web vs iOS vs Android

## Quick Answer

**YES, you need separate Client IDs for iOS and Android apps** (if you're building mobile apps in addition to your web app).

However, for **web-only applications like MoodMash**, you only need **ONE Client ID** (Web Application type).

---

## 📱 Client ID Requirements by Platform

### For Web Applications (Current MoodMash)

✅ **ONE Client ID** is sufficient
- Type: **Web Application**
- Redirect URI: `https://moodmash.win/auth/google/callback`
- Usage: Browser-based OAuth flow

### For iOS Applications

✅ **Separate Client ID required**
- Type: **iOS Application**
- Redirect URI: `com.googleusercontent.apps.CLIENT-ID:/oauth2redirect`
- Bundle ID required
- Usage: Native iOS app OAuth

### For Android Applications

✅ **Separate Client ID required**
- Type: **Android Application**
- Redirect URI: Package name + SHA-1 fingerprint
- Package name: e.g., `com.moodmash.win`
- Usage: Native Android app OAuth

---

## 🔧 Current MoodMash Setup (Web Only)

Since MoodMash is currently a **web application** deployed on Cloudflare Pages, you only need:

### 1. Google OAuth Web Application Client ID

**Setup Steps:**

1. **Go to Google Cloud Console**:
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Create OAuth 2.0 Client ID**:
   - Click "Create Credentials" → "OAuth Client ID"
   - Application type: **Web application**
   - Name: `MoodMash Web`
   
3. **Configure Authorized Redirect URIs**:
   ```
   https://moodmash.win/auth/google/callback
   https://b336f885.moodmash.pages.dev/auth/google/callback
   ```

4. **Copy Credentials**:
   ```
   Client ID: XXXXXXXXXX.apps.googleusercontent.com
   Client Secret: YYYYYYYYYYYYYY
   ```

5. **Set Environment Variables**:
   ```bash
   # Production
   npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name moodmash
   npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name moodmash
   npx wrangler pages secret put BASE_URL --project-name moodmash
   # (When prompted, enter: https://moodmash.win)
   ```

6. **Verify**:
   ```bash
   npx wrangler pages secret list --project-name moodmash
   ```

---

## 🚀 Future Mobile App Requirements

**IF** you decide to build iOS/Android apps later, you'll need:

### iOS App Setup

1. **Create iOS Client ID**:
   ```
   Google Cloud Console → Create Credentials → OAuth Client ID
   Type: iOS
   Bundle ID: com.moodmash.ios (your app's bundle ID)
   ```

2. **Get iOS Client ID**:
   ```
   XXXXX.apps.googleusercontent.com
   ```

3. **Configure in iOS app**:
   ```swift
   // Info.plist
   <key>CFBundleURLTypes</key>
   <array>
     <dict>
       <key>CFBundleURLSchemes</key>
       <array>
         <string>com.googleusercontent.apps.YOUR-CLIENT-ID</string>
       </array>
     </dict>
   </array>
   ```

### Android App Setup

1. **Get SHA-1 Fingerprint**:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore
   ```

2. **Create Android Client ID**:
   ```
   Google Cloud Console → Create Credentials → OAuth Client ID
   Type: Android
   Package name: com.moodmash.android
   SHA-1: YOUR_SHA1_FINGERPRINT
   ```

3. **Get Android Client ID**:
   ```
   XXXXX.apps.googleusercontent.com
   ```

---

## 🔐 Why Separate Client IDs?

### Security Reasons

1. **Different Redirect URIs**:
   - Web: `https://domain.com/callback`
   - iOS: `com.googleusercontent.apps.CLIENT-ID:/oauth2redirect`
   - Android: `com.app.package:/oauth2redirect`

2. **Platform Verification**:
   - Web: Domain verification
   - iOS: Bundle ID verification
   - Android: Package name + SHA-1 verification

3. **Security Isolation**:
   - If iOS app is compromised, web app remains secure
   - Different secret management per platform

4. **Permission Scopes**:
   - Different platforms may need different API scopes
   - Separate tracking and analytics

---

## 📋 Current MoodMash OAuth Status

### ✅ What's Done:

- OAuth error handling implemented
- Graceful degradation when OAuth not configured
- User-friendly error messages
- Comprehensive documentation

### ⚠️ What's Needed:

1. **Create Google OAuth Web Application Client ID** (5 minutes)
2. **Set environment variables** (2 minutes):
   ```bash
   GOOGLE_CLIENT_ID=your_web_client_id
   GOOGLE_CLIENT_SECRET=your_web_client_secret
   BASE_URL=https://moodmash.win
   ```
3. **Test OAuth login** (1 minute)

### 📚 Documentation:

- **Full Setup Guide**: `OAUTH_SETUP_GUIDE.md` (11,214 characters)
- **README Reference**: Updated with OAuth setup section
- **Error Handling**: Implemented in `src/auth.ts` and `src/index.tsx`

---

## 🎯 Summary for MoodMash

| Platform | Client ID Needed? | Type | Status |
|----------|-------------------|------|--------|
| **Web (Current)** | ✅ YES | Web Application | ⚠️ **Needs setup** |
| iOS | ❌ NO (not building iOS app yet) | iOS | N/A |
| Android | ❌ NO (not building Android app yet) | Android | N/A |

**Bottom Line**: For your current web-only MoodMash deployment, you only need **ONE Google OAuth Client ID** (Web Application type).

---

## 🔗 Quick Links

- **Google Cloud Console**: https://console.cloud.google.com/apis/credentials
- **OAuth Setup Guide**: `OAUTH_SETUP_GUIDE.md`
- **Production**: https://moodmash.win
- **Repository**: https://github.com/salimemp/moodmash

---

## ⚡ Next Steps

1. **Create Google Web Application Client ID** (5 min)
2. **Configure redirect URIs** (1 min)
3. **Set Cloudflare secrets** (2 min)
4. **Test OAuth login** (1 min)

**Total Time**: 9 minutes to enable Google OAuth

---

**Last Updated**: 2025-11-29
**Status**: Web OAuth implementation ready, awaiting credentials
