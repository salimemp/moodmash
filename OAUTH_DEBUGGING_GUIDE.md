# OAuth Login Debugging Guide

**Latest Deploy:** https://dc6cbd8d.moodmash.pages.dev  
**Production:** https://moodmash.win  
**Date:** December 4, 2025

---

## Recent Changes Made

### Fix #1: Changed Redirect Target
- **Before:** OAuth callbacks redirected to `/?login=success` (public page)
- **After:** OAuth callbacks redirect to `/log` (protected page)
- **Reason:** Public pages don't show authentication status

### Fix #2: Changed Cookie Setting Method
- **Before:** Used `setCookie()` helper from `hono/cookie`
- **After:** Using raw `c.header('Set-Cookie', ...)` header
- **Reason:** Better compatibility with Cloudflare Workers environment

---

## How to Debug OAuth Login

### Step 1: Open Browser DevTools

Before clicking "Continue with Google" or "Continue with GitHub":

1. Open your browser DevTools (F12 or Right-click → Inspect)
2. Go to the **Network** tab
3. Go to the **Application** tab → **Cookies** → `https://moodmash.win`
4. Clear any existing cookies

### Step 2: Test OAuth Flow

1. Go to https://moodmash.win
2. Click "Continue with Google" (or GitHub)
3. Complete the OAuth authorization

### Step 3: Check What Happened

#### Check Network Tab:
1. Find the request to `/auth/google/callback` or `/auth/github/callback`
2. Click on it
3. Look at the **Response Headers**
4. **Look for:** `Set-Cookie: session_token=...`

**Expected Response Headers:**
```
HTTP/1.1 302 Found
Location: /log
Set-Cookie: session_token=<UUID>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000
```

#### Check Application Tab:
1. Go to **Application** → **Cookies** → `https://moodmash.win`
2. **Look for:** A cookie named `session_token`

**Expected Cookie:**
```
Name: session_token
Value: <some-uuid-value>
Domain: moodmash.win
Path: /
Expires: <30 days from now>
HttpOnly: ✓
Secure: ✓
SameSite: Lax
```

#### Check Console Tab:
1. Look for any errors (red text)
2. Common issues:
   - CORS errors
   - Cookie rejection warnings
   - Security policy errors

### Step 4: Test Protected Page

After OAuth login:
1. You should be on `/log` page
2. You should see the "Log Mood" form
3. If you see a login page instead, the cookie wasn't set

---

## Common Issues & Solutions

### Issue 1: Cookie Not Being Set

**Symptoms:**
- No `session_token` cookie in DevTools
- `Set-Cookie` header missing in callback response

**Possible Causes:**
1. Browser blocking third-party cookies
2. HTTPS mismatch
3. Domain mismatch

**Solution:**
- Check browser cookie settings
- Ensure you're on `https://moodmash.win` (not HTTP)
- Check if browser extensions are blocking cookies

### Issue 2: Cookie Set But Not Sent

**Symptoms:**
- Cookie exists in DevTools
- But still asked to login on `/log` page

**Possible Causes:**
1. Cookie domain mismatch
2. Cookie path mismatch
3. SameSite policy blocking

**Solution:**
- Check cookie Domain field (should be `moodmash.win` or `.moodmash.win`)
- Check cookie Path (should be `/`)
- Check SameSite (should be `Lax`, not `Strict`)

### Issue 3: Cookie Sent But Not Validated

**Symptoms:**
- Cookie is sent in request headers
- Still redirected to login

**Possible Causes:**
1. Session expired in database
2. Database connection issue
3. Session validation logic error

**Solution:**
- Check database for session record
- Check session `expires_at` timestamp
- Check user `is_active` status

---

## Manual Testing Commands

### Test Database Session Creation

After OAuth login, check if session was created:

```sql
-- Connect to D1 database
wrangler d1 execute moodmash-production --local

-- Check recent sessions
SELECT s.id, s.session_token, s.user_id, u.email, u.name, s.created_at, s.expires_at
FROM sessions s
JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC
LIMIT 5;

-- Check specific user
SELECT * FROM users WHERE email = 'your-email@gmail.com';

-- Check user's sessions
SELECT * FROM sessions WHERE user_id = <user_id> ORDER BY created_at DESC;
```

### Test Cookie Manually

```bash
# Test with a valid session token (get from database)
curl -v -H "Cookie: session_token=<your-token>" https://moodmash.win/api/moods

# Expected: 200 OK with mood data (or empty array)
# If 401: Session not valid or expired
```

### Test Auth Middleware

```bash
# Public endpoint (should work without cookie)
curl https://moodmash.win/

# Protected API (should return 401 without cookie)
curl https://moodmash.win/api/moods

# Protected page (should redirect to login without cookie)
curl -v https://moodmash.win/log
# Expected: 302 redirect to /login
```

---

## OAuth Flow Step-by-Step

### What Should Happen:

1. **User clicks "Continue with Google"**
   - Browser navigates to `/auth/google`
   - Server creates `oauth_state` cookie
   - Server redirects to Google authorization page

2. **User authorizes on Google**
   - Google redirects back to `/auth/google/callback?code=...&state=...`

3. **Backend processes callback**
   - Validates state parameter
   - Exchanges code for access token
   - Fetches user info from Google
   - Checks if user exists in database
   - Creates or updates user record
   - Creates session in database
   - **Sets `session_token` cookie**
   - Deletes `oauth_state` cookie
   - Redirects to `/log`

4. **Browser navigates to /log**
   - Sends `session_token` cookie in request
   - Auth middleware validates cookie against database
   - If valid: Shows protected content
   - If invalid: Redirects to login

---

## Check Production Logs

### In Cloudflare Dashboard:

1. Go to https://dash.cloudflare.com
2. Select your account
3. Go to **Workers & Pages** → **moodmash**
4. Click **Logs** tab
5. Look for:
   - `Google OAuth error:` or `GitHub OAuth error:`
   - Database query errors
   - Cookie setting errors

### In Grafana (if monitoring is active):

1. Go to https://salimmakrana.grafana.net
2. Navigate to **Explore** → **Loki**
3. Query: `{app="moodmash"} |= "OAuth"`
4. Look for error messages

---

## Current OAuth Configuration

### Google OAuth Callback:
```typescript
// src/index.tsx, line ~234

app.get('/auth/google/callback', async (c) => {
  // ... validation and user creation ...
  
  // Session creation
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  await DB.prepare(`
    INSERT INTO sessions (user_id, session_token, is_trusted, expires_at, ip_address, user_agent)
    VALUES (?, ?, 1, ?, ?, ?)
  `).bind(dbUser.id, sessionToken, expiresAt.toISOString(), ...).run();
  
  // Cookie setting
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  c.header('Set-Cookie', `session_token=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`);
  
  // Redirect
  return c.redirect('/log');
});
```

### Cookie Properties:
- **Name:** `session_token`
- **Value:** UUID v4 (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
- **Path:** `/` (available to all routes)
- **HttpOnly:** `true` (cannot be accessed by JavaScript)
- **Secure:** `true` (only sent over HTTPS)
- **SameSite:** `Lax` (allows OAuth redirects, blocks CSRF)
- **Max-Age:** `2592000` seconds (30 days)

---

## What to Report Back

If OAuth is still not working, please provide:

1. **Browser and Version**
   - Example: Chrome 120, Firefox 121, Safari 17

2. **Console Errors** (from DevTools Console tab)
   - Copy/paste any red error messages

3. **Network Request Details**
   - After clicking OAuth button, find the `/auth/google/callback` request
   - Copy the Response Headers
   - Note the Status Code (should be 302)

4. **Cookie Status**
   - Screenshot of Application → Cookies tab showing `moodmash.win`
   - Is there a `session_token` cookie?
   - What are its properties?

5. **What Page Are You On After OAuth?**
   - Are you on `/log` or back to `/` or `/login`?

6. **Database Check** (if possible)
   - Did a session get created in the database?
   - Does the user exist in the users table?

---

## Quick Diagnostic Script

Run this in your browser console on https://moodmash.win:

```javascript
// Check if cookie exists
console.log('Cookies:', document.cookie);

// Try to fetch protected API
fetch('/api/moods', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log('API Response:', data))
.catch(err => console.error('API Error:', err));

// Check current user
fetch('/api/auth/me', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log('Current User:', data))
.catch(err => console.error('Auth Error:', err));
```

---

## Production URLs

- **Main App:** https://moodmash.win
- **Latest Deploy:** https://dc6cbd8d.moodmash.pages.dev
- **Health Check:** https://moodmash.win/api/health
- **GitHub:** https://github.com/salimemp/moodmash
- **Grafana:** https://salimmakrana.grafana.net

---

**Need Help?** Provide the diagnostic information listed above.
