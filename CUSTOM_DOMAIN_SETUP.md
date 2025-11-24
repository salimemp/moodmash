# Custom Domain Setup Guide

## Adding moodmash.win to Cloudflare Pages

**Note**: Custom domains must be added through the Cloudflare Dashboard (web interface), not via CLI.

### Steps to Add Custom Domain:

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com
   - Navigate to: Pages → moodmash project

2. **Add Custom Domain**
   - Click on "Custom domains" tab
   - Click "Set up a custom domain"
   - Enter: `moodmash.win`
   - Click "Continue"

3. **DNS Configuration**
   - Cloudflare will provide DNS records
   - Add these records to your DNS provider:
     ```
     Type: CNAME
     Name: moodmash.win (or @)
     Value: moodmash.pages.dev
     ```

4. **Verify Domain**
   - Wait for DNS propagation (5-30 minutes)
   - Cloudflare will automatically verify
   - SSL certificate will be issued automatically

### Current Deployment URLs:

- **Pages Dev**: https://90bb148a.moodmash.pages.dev
- **Custom Domain** (after setup): https://moodmash.win

### Alternative: Update wrangler.toml

If you have the domain in Cloudflare already, you can configure it in `wrangler.toml`:

```toml
name = "moodmash"
compatibility_date = "2025-11-11"
compatibility_flags = ["nodejs_compat"]

# Custom domain (requires manual DNS setup in dashboard)
routes = [
  { pattern = "moodmash.win", custom_domain = true }
]
```

### Verification:

After setup, test the custom domain:

```bash
# Check DNS
dig moodmash.win

# Test HTTPS
curl -I https://moodmash.win

# Test API
curl https://moodmash.win/api/security/dashboard
```

### Troubleshooting:

- **DNS not propagating**: Wait 30 minutes, clear DNS cache
- **SSL error**: Cloudflare auto-issues SSL, wait 10-15 minutes
- **404 error**: Verify DNS CNAME points to moodmash.pages.dev
- **502 error**: Check Cloudflare Pages deployment status

### Status:

⏳ **Pending Manual Setup** - Requires Cloudflare Dashboard access

Once configured, the custom domain will automatically point to the latest deployment.
