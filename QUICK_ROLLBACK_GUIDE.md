# 🚨 QUICK ROLLBACK GUIDE - 5 MINUTES

## **PRODUCTION IS DOWN - FOLLOW THESE EXACT STEPS:**

### **Step 1: Open Cloudflare Dashboard**
Click this link:
https://dash.cloudflare.com/d65655738594c6ac1a7011998a73e77d/pages/view/moodmash

### **Step 2: Go to Deployments**
- Look for "Deployments" tab at the top
- Click it

### **Step 3: Find Working Deployment**
Scroll down and find this deployment:
```
ID: 5be8c75c-4018-4ed9-8ad4-ee4e7ea1adec
Branch: main
Commit: dc8023d
Status: 3 days ago
URL: https://5be8c75c.moodmash.pages.dev
```

### **Step 4: Rollback**
- Click the "..." (three dots) menu next to that deployment
- Select "Rollback to this deployment"
- Confirm when asked

### **Step 5: Wait 30 Seconds**
The rollback takes about 30 seconds to propagate

### **Step 6: Test**
Visit: https://moodmash.win

You should see the homepage (not a 404 error)

---

## **Alternative: Manual Promotion**

If "Rollback" option doesn't exist:

1. Click on the deployment `5be8c75c`
2. Look for "Promote to Production" button
3. Click it
4. Confirm

---

## **Verification**

After rollback, these should work:
- ✅ https://moodmash.win (homepage)
- ✅ https://moodmash.win/login (login page)
- ✅ https://moodmash.win/api/health/status (API)

---

**If you cannot access Cloudflare Dashboard, let me know immediately.**
