# How to Find Your Grafana Cloud Stack

**Quick Answer**: Your "stack" is your Grafana Cloud instance. It's on the main page after you log in.

---

## Step-by-Step: Finding Your Stack

### Step 1: Log in to Grafana Cloud
1. Go to: https://grafana.com/auth/sign-in
2. Enter your email and password
3. Click "Sign in"

### Step 2: You'll See the Cloud Portal
After logging in, you'll land on the **Cloud Portal** page. This is the main dashboard.

### Step 3: Look for Your Stack

You should see one of these views:

#### **Option A: Stack Card View**
You'll see a card/box with information like:
```
┌─────────────────────────────────────┐
│  📊 [Your Stack Name]                │
│                                      │
│  Status: Active                      │
│  URL: https://xxxxx.grafana.net     │
│                                      │
│  [Launch]  [Configure]  [Details]   │
└─────────────────────────────────────┘
```

**What to do:**
- Click **"Launch"** to open your Grafana instance
- Click **"Configure"** to see settings
- Click **"Details"** to see endpoints

#### **Option B: List View**
You'll see a list/table with:
```
Name              | Status  | Plan      | Actions
------------------|---------|-----------|----------
[Your Stack Name] | Active  | Free/Pro  | [Launch]
```

**What to do:**
- Click on the **stack name** (clickable link)
- This opens the stack details page

#### **Option C: No Stack Yet**
If you just created your account, you might see:
```
┌─────────────────────────────────────┐
│  Welcome to Grafana Cloud           │
│                                      │
│  Get started by creating a stack    │
│                                      │
│  [Create a Free Stack]               │
└─────────────────────────────────────┘
```

**What to do:**
- Click **"Create a Free Stack"** button
- Follow the wizard to create your first stack

---

## What is a "Stack"?

A **stack** is your Grafana Cloud instance. It includes:
- **Grafana** (dashboards and visualization)
- **Prometheus/Mimir** (metrics storage)
- **Loki** (log storage)
- **Tempo** (traces storage)

Think of it as your personal Grafana Cloud environment.

---

## Common Stack Names

Your stack might be named:
- Your username (e.g., `john-smith-123`)
- Your organization name (e.g., `moodmash`)
- Default name (e.g., `grafanacloud-123456`)
- Custom name you chose during setup

---

## Visual Guide: Where is the Stack?

```
After Login → You Land Here:
═══════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────┐
│  GRAFANA CLOUD                             [Profile] │
├─────────────────────────────────────────────────────┤
│                                                       │
│  Home  |  Stacks  |  Usage  |  Billing  |  Support  │ ← Top Navigation
│                                                       │
├─────────────────────────────────────────────────────┤
│                                                       │
│  Your Stacks                                          │
│                                                       │
│  ┌───────────────────────────────────────────────┐  │
│  │  📊 moodmash-stack                   [Launch] │  │ ← YOUR STACK HERE!
│  │                                                │  │
│  │  Status: Active                                │  │
│  │  https://moodmash.grafana.net                  │  │
│  │                                                │  │
│  │  [Configure]  [Details]  [Delete]             │  │
│  └───────────────────────────────────────────────┘  │
│                                                       │
│  [+ Create New Stack]                                 │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## If You Don't See Any Stacks

### Reason 1: Brand New Account
If you just created your Grafana Cloud account, you need to create a stack first.

**How to Create a Stack:**
1. Look for **"Create a Free Stack"** or **"+ Create Stack"** button
2. Click it
3. Fill in:
   - **Stack name**: `moodmash` (or your preferred name)
   - **Stack URL**: `moodmash` (will become `moodmash.grafana.net`)
   - **Region**: Choose closest to you (e.g., US East, EU West)
4. Click **"Create Stack"**
5. Wait 1-2 minutes for setup
6. Your stack will appear!

### Reason 2: Wrong Organization
If you're part of multiple organizations, you might be viewing the wrong one.

**How to Switch Organizations:**
1. Look for organization selector (usually top-right corner)
2. Click on current organization name
3. Select the correct organization from dropdown
4. Your stacks should appear

### Reason 3: No Permission
If someone else created the stack and didn't give you access.

**What to Do:**
1. Ask the account owner to invite you
2. Or create your own free stack

---

## What to Do After Finding Your Stack

Once you see your stack:

### Option 1: Launch Grafana (to use dashboards)
- Click **"Launch"** button
- Opens your Grafana instance in new tab
- You can create dashboards here

### Option 2: Configure Stack (to create access policies)
- Click **"Configure"** or **"Details"** button
- Scroll down to see endpoints (Prometheus, Loki, etc.)
- Look for **"Cloud access policies"** link

### Option 3: Access from Stack Itself
1. Click **"Launch"** to open your Grafana
2. Inside Grafana, left sidebar → **"Administration"**
3. **"Users and access"** → **"Cloud access policies"**

---

## Still Can't Find It?

### Try These URLs Directly

**Main Cloud Portal:**
```
https://grafana.com/orgs/[YOUR_ORG_NAME]
```

**Stacks List:**
```
https://grafana.com/orgs/[YOUR_ORG_NAME]/stacks
```

**Your Grafana Instance (if you know the stack name):**
```
https://[your-stack-name].grafana.net
```

### Check Your Email
When you created your Grafana Cloud account, you should have received an email with:
- Welcome message
- Stack URL
- Link to access your stack

---

## Screenshot Guide (What You Should See)

### 1. After Login - Cloud Portal Home
```
┌─────────────────────────────────────────┐
│ Grafana Cloud                 [Profile] │
├─────────────────────────────────────────┤
│ Home | Stacks | Usage | Billing         │ ← Click "Stacks" here
├─────────────────────────────────────────┤
│                                         │
│ Quick Links:                            │
│ • Launch Stack                          │ ← Or click here
│ • View Usage                            │
│ • Manage Billing                        │
│                                         │
└─────────────────────────────────────────┘
```

### 2. Stacks Page
```
┌─────────────────────────────────────────┐
│ Stacks                                  │
├─────────────────────────────────────────┤
│                                         │
│ [+ Create Stack]                        │
│                                         │
│ Active Stacks:                          │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ moodmash                         │   │ ← Your stack
│ │ https://moodmash.grafana.net     │   │
│ │ [Launch] [Configure] [Details]   │   │
│ └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### 3. Inside Stack - Administration
```
After clicking "Launch":
┌─────────────────────────────────────────┐
│ [Menu] moodmash.grafana.net             │
├─────────────────────────────────────────┤
│ Left Sidebar:                           │
│ • Home                                  │
│ • Dashboards                            │
│ • Explore                               │
│ • Alerting                              │
│ • Administration  ← Click here          │
│   ├─ Users and access                   │
│   │  └─ Cloud access policies ← Then here
│   ├─ Plugins                            │
│   └─ Settings                           │
└─────────────────────────────────────────┘
```

---

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| **"I don't see any stacks"** | Create a new free stack with "+ Create Stack" button |
| **"Page is blank"** | Try refreshing or clearing browser cache |
| **"Access denied"** | Ask account owner to give you permissions |
| **"Can't remember stack name"** | Check welcome email or try https://grafana.com/stacks |
| **"Wrong organization"** | Switch org using dropdown in top-right corner |

---

## Summary: Quick Path to Access Policies

Once you find your stack:

```
Method 1 (From Cloud Portal):
Login → Find Stack → Click "Launch" → Administration → Users and access → Cloud access policies

Method 2 (From Cloud Portal):
Login → Find Stack → Click "Configure" → Scroll to Security → Cloud access policies

Method 3 (From Stacks Page):
Login → Click "Stacks" tab → Click Stack Name → Details → Find endpoints and access policies link
```

---

## Need More Help?

If you still can't find your stack:
1. Share a screenshot of what you see after logging in
2. Check if you received a welcome email from Grafana
3. Verify you're using the correct email address to log in
4. Try logging out and back in

---

**Once you find your stack, follow the previous guide (GRAFANA_QUICK_START.txt) to create the access policy and token!**

