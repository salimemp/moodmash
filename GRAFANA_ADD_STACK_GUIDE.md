# How to Add/Create a Stack in Grafana Cloud

**The button is called "Add Stack" and it's in the LEFT SIDEBAR, not the main area.**

---

## Exact Location: Left Sidebar Menu

After logging into Grafana Cloud, look at the **LEFT side of the page**.

### What You Should See:

```
┌─────────────────────────────┐
│  LEFT SIDEBAR               │
│                             │
│  Overview                   │
│  ├─ Grafana Cloud          │
│  │  ├─ Add Stack ← HERE!  │  ⭐ CLICK THIS!
│  │  └─ [Your Stacks]       │
│  │                          │
│  ├─ Grafana IRM            │
│  └─ ...                     │
│                             │
└─────────────────────────────┘
```

---

## Step-by-Step Instructions

### Step 1: Log In
- Go to: https://grafana.com/auth/sign-in
- Enter your credentials
- Click "Sign in"

### Step 2: Look at the LEFT Sidebar
After login, you'll see the **Cloud Portal**.

**Look at the LEFT side** of the screen (not the center).

### Step 3: Find "Grafana Cloud" Section
In the left sidebar, find the section labeled:
```
Grafana Cloud
  ├─ Add Stack        ← Click this!
  └─ [Existing stacks if any]
```

### Step 4: Click "Add Stack"
- Click on **"Add Stack"** in the left menu
- A form will appear

### Step 5: Fill in Stack Details
You'll see a form with these fields:

```
Stack Name: _________________
  (e.g., "moodmash")

Stack URL: _________________
  (e.g., "moodmash" → becomes moodmash.grafana.net)

Region: [Dropdown]
  Choose: US East / EU West / Asia Pacific / etc.
  (Pick the one closest to you or your users)

Plan: Free (Forever)
  ✓ No credit card required
```

**Example:**
```
Stack Name: moodmash
Stack URL: moodmash
Region: US East (North Virginia)
Plan: Free
```

### Step 6: Click "Create Stack"
- Review your details
- Click the **"Create Stack"** button at the bottom
- Wait 1-2 minutes for creation

### Step 7: Stack is Ready!
You'll see a success message and your new stack will appear in:
- Left sidebar under "Grafana Cloud"
- Main area showing stack details

---

## Alternative: If You Don't See "Add Stack" in Sidebar

### Option A: Cloud Portal Main Page
If the left sidebar doesn't show "Add Stack", try this:

1. Look at the **main center area** after login
2. You might see a card that says:
   ```
   ┌───────────────────────────────┐
   │  Get started with Grafana      │
   │  Cloud                         │
   │                                │
   │  [Create a free account]       │
   └───────────────────────────────┘
   ```
3. Click any "Create" or "Get started" button

### Option B: Top Navigation
1. Look at the **top navigation bar**
2. Click on "**Stacks**" or "**Cloud**"
3. Look for "**+ Add Stack**" or "**Create Stack**" button

### Option C: Direct URL
Try going directly to:
```
https://grafana.com/orgs/[YOUR_ORG]/stacks/new
```

Or simply:
```
https://grafana.com/orgs
```
Then look for stack creation options.

---

## What If I Still Can't Find It?

### Possible Reason 1: Already Have a Stack
If you already created a stack during signup, it will be listed in:
- Left sidebar under "Grafana Cloud"
- Main area showing your existing stack

**What to do:**
- Look for your existing stack name in the left sidebar
- Click on it to open/use it
- You don't need to create another one

### Possible Reason 2: Different Interface Version
Grafana Cloud might show different interfaces based on:
- Account type
- Sign-up method
- Region

**What to do:**
- Try the direct URL approach above
- Contact Grafana support via chat (usually bottom-right corner)

### Possible Reason 3: Pending Account Activation
If your account is brand new:
- Check your email for activation link
- Click the link to activate
- Then log in again

---

## Visual Guide: Typical Layout After Login

```
┌──────────────────────────────────────────────────────────────┐
│  Grafana Cloud                        [Profile] [Notifications]│
├──────────┬───────────────────────────────────────────────────┤
│          │                                                    │
│ SIDEBAR  │  MAIN CONTENT AREA                                │
│          │                                                    │
│ Overview │  Welcome to Grafana Cloud                         │
│          │                                                    │
│ Grafana  │  Your Stacks:                                      │
│ Cloud    │  ┌─────────────────────────────────────┐          │
│ ├─ Add   │  │ [Stack Name]             [Launch]   │          │
│ │  Stack │  │ Status: Active                      │          │
│ │  ⭐    │  │ moodmash.grafana.net                │          │
│ └─ [List]│  └─────────────────────────────────────┘          │
│          │                                                    │
│ Grafana  │  OR if no stacks:                                 │
│ IRM      │  ┌─────────────────────────────────────┐          │
│          │  │ Get started                          │          │
│ Usage    │  │ [Create your first stack]            │          │
│          │  └─────────────────────────────────────┘          │
│ Billing  │                                                    │
│          │                                                    │
└──────────┴───────────────────────────────────────────────────┘
```

---

## After Creating Your Stack

Once your stack is created, you'll see it listed with three buttons:

```
┌───────────────────────────────────────┐
│  📊 moodmash                          │
│  Status: Active                       │
│  https://moodmash.grafana.net         │
│                                       │
│  [Launch]  [Configure]  [Details]    │
└───────────────────────────────────────┘
```

**Next step:** Click **[Launch]** to open your Grafana instance!

Then follow the previous guide to create Cloud Access Policies.

---

## Quick Checklist

- [ ] Logged into https://grafana.com
- [ ] On the Cloud Portal page
- [ ] Looking at LEFT sidebar
- [ ] Found "Grafana Cloud" section in sidebar
- [ ] Clicked "Add Stack"
- [ ] Filled in stack name (e.g., "moodmash")
- [ ] Selected region
- [ ] Clicked "Create Stack"
- [ ] Waited for creation (1-2 minutes)
- [ ] Stack appears in sidebar and main area

---

## Summary

**The key is the LEFT SIDEBAR:**
```
Left Sidebar → Grafana Cloud → Add Stack
```

If you still can't find it:
1. Take a screenshot of what you see after login
2. Share it so I can help identify where the button is
3. Or try: https://grafana.com/orgs (shows organization/stack management)

Once you create or find your stack, you can proceed to create the Cloud Access Policy for MoodMash monitoring!

