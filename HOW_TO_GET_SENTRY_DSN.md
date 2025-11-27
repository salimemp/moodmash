# How to Get Your Sentry DSN - Step by Step Guide

**Account:** salimemp  
**Email:** salimmakrana@gmail.com

---

## 🎯 What is a DSN?

**DSN** = **Data Source Name**

It's a URL that tells your application where to send error data. It looks like this:

```
https://abc123def456@o123456.ingest.sentry.io/7890123
```

---

## 📋 Step-by-Step: Getting Your DSN

### **Step 1: Go to Sentry.io**

Open your browser and go to:
```
https://sentry.io/auth/login/
```

### **Step 2: Login**

- **Email:** salimmakrana@gmail.com
- **Password:** (your password)

If you don't have an account yet, click "Sign Up" and create one using:
- **Email:** salimmakrana@gmail.com
- **Username:** salimemp

### **Step 3: Create a New Project**

After logging in, you'll see the Sentry dashboard.

1. **Click "Projects"** in the left sidebar
2. **Click "Create Project"** button (top right)

### **Step 4: Choose Platform**

On the "Create Project" page:

1. **Select Platform:** 
   - Scroll down and find **"Cloudflare Workers"**
   - Click on it

2. **Set Alert Frequency:**
   - Choose **"Alert me on every new issue"**

3. **Name Your Project:**
   - Project Name: **moodmash**

4. **Select Team:**
   - Choose your default team (or create one)

5. **Click "Create Project"**

### **Step 5: Get Your DSN (This is What You Need!)**

After creating the project, you'll see a setup page with code examples.

**Your DSN will be displayed prominently at the top!**

Look for something like:

```javascript
Sentry.init({
  dsn: "https://abc123def456@o123456.ingest.sentry.io/7890123",
  // ... other options
});
```

**The DSN is the string inside the quotes!**

### **Step 6: Copy Your DSN**

1. **Find the DSN** (it starts with `https://` and ends with numbers)
2. **Click the "Copy" button** next to it
3. **Save it somewhere safe** (you'll need it in the next step)

---

## 🔍 Alternative Ways to Find Your DSN

### **Method 1: From Project Settings**

If you already created the project but can't see the DSN:

1. **Go to Projects** (left sidebar)
2. **Click on "moodmash"** project
3. **Click the gear icon** ⚙️ (Settings)
4. **Click "Client Keys (DSN)"** in the left menu
5. **Copy the DSN** from the "Client Keys" section

### **Method 2: From Organization Settings**

1. **Click your profile picture** (top right)
2. **Click "Organization Settings"**
3. **Click "Projects"** in left menu
4. **Find "moodmash"** and click it
5. **Click "Client Keys (DSN)"**
6. **Copy the DSN**

---

## 🎬 Visual Guide

Here's exactly what you'll see (screen by screen):

### **Screen 1: Login Page**
```
┌─────────────────────────────────────┐
│     🔒 Login to Sentry              │
│                                     │
│  Email: salimmakrana@gmail.com     │
│  Password: ************            │
│                                     │
│  [ Login Button ]                  │
└─────────────────────────────────────┘
```

### **Screen 2: Dashboard (After Login)**
```
┌─────────────────────────────────────┐
│  Projects    Issues    Performance  │
│                                     │
│  [ Create Project ]  ← CLICK HERE  │
│                                     │
│  Your Projects:                     │
│  (empty if first time)             │
└─────────────────────────────────────┘
```

### **Screen 3: Create Project**
```
┌─────────────────────────────────────┐
│  Choose Your Platform               │
│                                     │
│  [ ] Node.js                       │
│  [ ] React                         │
│  [✓] Cloudflare Workers ← SELECT   │
│  [ ] Python                        │
│                                     │
│  Project Name: moodmash            │
│  Alert me on: [Every new issue]    │
│                                     │
│  [ Create Project ]  ← CLICK       │
└─────────────────────────────────────┘
```

### **Screen 4: Setup Page (YOU'LL SEE YOUR DSN HERE!)**
```
┌─────────────────────────────────────┐
│  Configure Cloudflare Workers       │
│                                     │
│  Your DSN:                         │
│  ┌─────────────────────────────┐  │
│  │ https://abc123@o123.ingest  │  │
│  │ .sentry.io/7890123          │  │
│  │                   [📋 Copy] │  │
│  └─────────────────────────────┘  │
│                                     │
│  Installation:                     │
│  npm install @sentry/cloudflare    │
│                                     │
│  Configuration:                    │
│  Sentry.init({                     │
│    dsn: "https://..."              │
│  });                               │
└─────────────────────────────────────┘
```

**👆 THIS IS WHERE YOU COPY THE DSN!**

---

## 📝 What to Do with the DSN

Once you have your DSN (e.g., `https://abc123@o123.ingest.sentry.io/7890123`):

### **Option A: Tell Me the DSN**

Just reply with:
```
My Sentry DSN is: https://abc123@o123.ingest.sentry.io/7890123
```

I'll configure it for you!

### **Option B: Configure It Yourself**

Run this command in your terminal:

```bash
cd /home/user/webapp
npx wrangler secret put SENTRY_DSN --project-name moodmash
```

When prompted, **paste your DSN** and press Enter.

Then deploy:
```bash
npm run build
npx wrangler pages deploy dist --project-name moodmash
```

---

## 🆘 Troubleshooting

### **Problem 1: "I don't see Cloudflare Workers in the platform list"**

**Solution:** 
- Use the search box at the top of platform selection
- Type "Cloudflare"
- Or scroll down - it's in alphabetical order

### **Problem 2: "I created the project but didn't see the DSN"**

**Solution:**
1. Go to https://sentry.io
2. Click "Projects" in left sidebar
3. Click "moodmash"
4. Click ⚙️ Settings
5. Click "Client Keys (DSN)" in left menu
6. Your DSN is there!

### **Problem 3: "I forgot to copy the DSN"**

**Solution:**
- No worries! You can always find it again:
- Projects → moodmash → Settings → Client Keys (DSN)

### **Problem 4: "I don't have a Sentry account yet"**

**Solution:**
1. Go to https://sentry.io/signup/
2. Sign up with: salimmakrana@gmail.com
3. Choose username: salimemp
4. Verify your email
5. Then follow steps above to create project

---

## 🎯 Quick Checklist

- [ ] Go to https://sentry.io/auth/login/
- [ ] Login with salimmakrana@gmail.com
- [ ] Click "Projects" → "Create Project"
- [ ] Select "Cloudflare Workers" platform
- [ ] Name project: "moodmash"
- [ ] Click "Create Project"
- [ ] **COPY THE DSN** (it will be displayed prominently)
- [ ] Send me the DSN or configure it yourself

---

## 💡 Example DSN Format

Your DSN will look **exactly** like one of these:

```
https://1234567890abcdef1234567890abcdef@o123456.ingest.sentry.io/1234567
https://a1b2c3d4e5f6@sentry.io/7890123
https://examplekey@o123456.ingest.us.sentry.io/4567890
```

**Key characteristics:**
- ✅ Starts with `https://`
- ✅ Contains `@` symbol
- ✅ Contains `.sentry.io`
- ✅ Ends with numbers (your project ID)

---

## 📞 Need Help?

If you're stuck at any step:

1. **Take a screenshot** of what you see
2. **Send it to me** along with your question
3. I'll guide you through it!

Or just reply with:
- "I'm on the login page, what next?"
- "I created the project, where's the DSN?"
- "I can't find Cloudflare Workers platform"

---

## ⚡ TL;DR (Too Long, Didn't Read)

1. Go to https://sentry.io/auth/login/
2. Login with salimmakrana@gmail.com
3. Click "Create Project"
4. Choose "Cloudflare Workers"
5. Name it "moodmash"
6. **COPY THE DSN** (you'll see it right after creating the project)
7. Send it to me or run: `npx wrangler secret put SENTRY_DSN`

**That's it!** 🎉

---

**The DSN is literally displayed on the screen right after you create the project. You can't miss it!**

**It will say something like:**
```
"Use this DSN in your application:"
https://abc123@o123456.ingest.sentry.io/7890123
```

**Just copy that entire URL and you're done!**

---

*Last Updated: 2025-11-27*  
*Questions? Just ask!* 😊
