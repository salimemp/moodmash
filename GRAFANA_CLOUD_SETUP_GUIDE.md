# Grafana Cloud Setup Guide - MoodMash

**Date**: 2025-11-30  
**Purpose**: Configure Grafana Cloud for monitoring MoodMash platform

---

## Important Note: API Keys vs Cloud Access Policies

**⚠️ API Keys are Deprecated (as of February 2025)**

Grafana Cloud no longer uses traditional API keys. Instead, you must use:
- **Cloud Access Policies** (recommended for Grafana Cloud)
- **Service Account Tokens** (for Grafana instances)

For MoodMash integration with Grafana Cloud, we'll use **Cloud Access Policies**.

---

## Step-by-Step: Create Cloud Access Policy & Token

### Step 1: Sign in to Grafana Cloud
1. Go to https://grafana.com/auth/sign-in
2. Log in with your Grafana Cloud account
3. You'll be directed to the **Cloud Portal**

### Step 2: Navigate to Cloud Access Policies
1. In the **Cloud Portal**, select your **organization** from the dropdown (if you have multiple)
2. Click on your **stack** (e.g., "moodmash" or your stack name)
3. In the left sidebar, click **"Administration"**
4. Under Administration, click **"Users and access"**
5. Click **"Cloud access policies"**

**Alternative path:**
- From Cloud Portal → Click **"Configure"** on your stack
- Scroll down to **"Security"** section
- Click **"Cloud access policies"**

### Step 3: Create New Access Policy
1. Click **"Create access policy"** button
2. Fill in the following details:

**Policy Configuration:**
```
Name: moodmash-monitoring
Display name: MoodMash Monitoring Policy
```

**Scopes (permissions):**
Select the following scopes based on what you need:

For **basic monitoring** (recommended to start):
- ✅ `metrics:read` - Read metrics from Prometheus/Mimir
- ✅ `metrics:write` - Write metrics to Prometheus/Mimir
- ✅ `logs:read` - Read logs from Loki
- ✅ `logs:write` - Write logs to Loki
- ✅ `alerts:read` - Read alert rules
- ✅ `alerts:write` - Create/update alert rules

For **full access** (if needed later):
- ✅ `traces:read` - Read traces from Tempo
- ✅ `traces:write` - Write traces to Tempo
- ✅ `profiles:read` - Read profiles from Pyroscope
- ✅ `profiles:write` - Write profiles to Pyroscope

**Realms (where policy applies):**
- Select your **stack name** from the dropdown

3. Click **"Create"** to save the policy

### Step 4: Generate Access Token
1. After creating the policy, you'll see it in the list
2. Click on the **policy name** you just created
3. Click **"Add token"** button
4. Configure the token:

```
Token name: moodmash-app-token
Expiration: Choose based on your needs
  - No expiration (for production)
  - 30 days (for testing)
  - Custom date
```

5. Click **"Create token"**

### Step 5: Copy and Save the Token
**⚠️ CRITICAL: This token will only be shown ONCE!**

1. A token will appear like:
   ```
   glc_eyJrIjoiRXhhbXBsZVRva2VuMTIzIiwibCI6IjEyMzQ1Njc4OSIsIm4iOiJleGFtcGxlIn0=
   ```

2. **Copy the entire token immediately**
3. **Save it securely** - you won't be able to see it again
4. Click **"Close"** when done

---

## What You Need for MoodMash Integration

After creating the token, you'll need these values:

### 1. **Cloud Access Policy Token**
```
glc_eyJrIjoiRXhhbXBsZVRva2VuMTIzIiwibCI6IjEyMzQ1Njc4OSIsIm4iOiJleGFtcGxlIn0=
```
(The token you just created)

### 2. **Prometheus/Mimir Endpoint**
Find this in your Grafana Cloud portal:
1. Go to **Cloud Portal** → Your **Stack**
2. Click **"Details"** or **"Configuration"**
3. Look for **"Prometheus"** section
4. Copy the **"Remote Write Endpoint"**

Example format:
```
https://prometheus-prod-XX-prod-XX-XX.grafana.net/api/prom/push
```

### 3. **Loki Endpoint** (for logs)
Same location as Prometheus:
1. Find the **"Loki"** section
2. Copy the **"Endpoint URL"**

Example format:
```
https://logs-prod-XXX.grafana.net/loki/api/v1/push
```

### 4. **Instance ID / Username**
Found in the same configuration page:
- Usually a number like: `123456`
- Or username format: `123456` or `instance-12345`

---

## Configure MoodMash with Grafana Cloud

Once you have the token and endpoints, add them to your Cloudflare Pages environment variables:

### Environment Variables to Set

Go to **Cloudflare Pages** → **moodmash** → **Settings** → **Environment Variables**:

```bash
# Grafana Cloud Access Token
GRAFANA_CLOUD_TOKEN=glc_eyJrIjoiRXhhbXBsZVRva2VuMTIzIiwibCI6IjEyMzQ1Njc4OSIsIm4iOiJleGFtcGxlIn0=

# Grafana Cloud Endpoints
GRAFANA_PROMETHEUS_URL=https://prometheus-prod-XX-prod-XX-XX.grafana.net/api/prom/push
GRAFANA_LOKI_URL=https://logs-prod-XXX.grafana.net/loki/api/v1/push

# Grafana Cloud Instance ID (username for basic auth)
GRAFANA_INSTANCE_ID=123456
```

---

## Testing Your Configuration

### Test 1: Verify Token Works
Use curl to test your token:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  https://prometheus-prod-XX.grafana.net/api/prom/api/v1/labels
```

**Expected response**: JSON with label names (or empty array if no data yet)

### Test 2: Send Test Metric
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '[{"name":"test_metric","value":1}]' \
  https://prometheus-prod-XX.grafana.net/api/prom/push
```

### Test 3: View in Grafana
1. Go to your Grafana Cloud instance (the UI)
2. Click **"Explore"** in the left sidebar
3. Select **"Prometheus"** as data source
4. Run query: `test_metric`
5. You should see your test metric

---

## Troubleshooting

### Issue: "Cannot find API Keys"
**Solution**: API Keys are deprecated. Use Cloud Access Policies instead (this guide).

### Issue: "Unauthorized" Error
**Causes:**
- Token expired
- Wrong token copied
- Token doesn't have correct scopes
- Endpoint URL is incorrect

**Solution:**
1. Verify token is copied completely
2. Check token hasn't expired
3. Regenerate token if needed
4. Verify scopes include `metrics:write` and `logs:write`

### Issue: "Cannot find Cloud Access Policies"
**Causes:**
- Using old Grafana Cloud interface
- Insufficient permissions (need org admin)

**Solution:**
1. Ensure you're logged into Grafana Cloud (not self-hosted Grafana)
2. Check you have **Admin** or **Editor** role in organization
3. Try accessing via: https://grafana.com/orgs/YOUR_ORG_NAME/access-policies

### Issue: "Token creation failed"
**Solution:**
1. Ensure policy was created first
2. Refresh the page and try again
3. Check you have correct permissions

---

## Alternative: Using Service Accounts (For Grafana Instance API)

If you need to use the **Grafana HTTP API** (not Cloud API), use Service Accounts:

### Step 1: Create Service Account
1. In your Grafana instance (not Cloud Portal)
2. Click **"Administration"** → **"Users and access"** → **"Service accounts"**
3. Click **"Add service account"**
4. Name it: `moodmash-api`
5. Set role: **Editor** or **Admin**
6. Click **"Create"**

### Step 2: Add Service Account Token
1. Click on the service account you created
2. Click **"Add service account token"**
3. Name: `moodmash-app-token`
4. Click **"Generate token"**
5. **Copy the token immediately** (starts with `glsa_`)

### Step 3: Use Service Account Token
```bash
curl -H "Authorization: Bearer glsa_YOUR_TOKEN" \
  https://YOUR_STACK.grafana.net/api/dashboards/home
```

---

## Security Best Practices

### Token Management
1. ✅ **Never commit tokens to git**
2. ✅ **Use environment variables** for tokens
3. ✅ **Set expiration dates** for tokens (30-90 days recommended)
4. ✅ **Rotate tokens regularly**
5. ✅ **Revoke unused tokens** immediately

### Access Policy Scope
1. ✅ **Use minimum required scopes** (principle of least privilege)
2. ✅ **Create separate policies** for different services
3. ✅ **Review scopes periodically**

### Monitoring
1. ✅ **Monitor token usage** in Grafana Cloud
2. ✅ **Set up alerts** for unauthorized access attempts
3. ✅ **Audit access logs** regularly

---

## Next Steps After Setup

Once you have the token configured:

1. **Implement Grafana Integration in MoodMash**
   - Add Grafana client library
   - Configure metrics/logs export
   - Set up error tracking

2. **Create Dashboards**
   - Application performance
   - User activity
   - Error rates
   - API response times

3. **Set Up Alerts**
   - Error rate thresholds
   - Response time alerts
   - Database connection issues
   - Authentication failures

4. **Test Integration**
   - Send test metrics
   - Verify data appears in Grafana
   - Check alert rules work

---

## Quick Reference: Where to Find Things

| What You Need | Where to Find It |
|---------------|------------------|
| Cloud Access Policies | Cloud Portal → Stack → Administration → Users and access → Cloud access policies |
| Prometheus Endpoint | Cloud Portal → Stack → Details → Prometheus section |
| Loki Endpoint | Cloud Portal → Stack → Details → Loki section |
| Instance ID | Cloud Portal → Stack → Details → Instance details |
| Service Accounts | Grafana Instance → Administration → Users and access → Service accounts |
| Dashboards | Grafana Instance → Dashboards → Browse |
| Explore Data | Grafana Instance → Explore |

---

## Additional Resources

- **Grafana Cloud Documentation**: https://grafana.com/docs/grafana-cloud/
- **Access Policies Guide**: https://grafana.com/docs/grafana-cloud/security-and-account-management/authentication-and-permissions/access-policies/
- **Prometheus Remote Write**: https://grafana.com/docs/grafana-cloud/send-data/metrics/
- **Loki Push API**: https://grafana.com/docs/loki/latest/reference/api/

---

## Summary

**What you need from Grafana Cloud:**
1. ✅ Cloud Access Policy Token (starts with `glc_`)
2. ✅ Prometheus Remote Write Endpoint
3. ✅ Loki Push Endpoint
4. ✅ Instance ID

**Where to put them:**
- Cloudflare Pages Environment Variables
- Never commit to git
- Use secure secrets management

**Next action:**
- Once you have the token, share the endpoints and I'll help integrate them into MoodMash!

---

**End of Guide**
