# Domain Configuration Guide

## Overview

MoodMash uses **moodmash.win** as its primary domain. This guide covers how to configure the domain in Cloudflare.

## Cloudflare Configuration

### 1. DNS Settings

Add the following DNS records in your Cloudflare dashboard:

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| CNAME | @ | `<your-workers-subdomain>.workers.dev` | Proxied |
| CNAME | www | `moodmash.win` | Proxied |

### 2. Custom Domain for Cloudflare Workers/Pages

1. Go to **Workers & Pages** in Cloudflare dashboard
2. Select your **moodmash** project
3. Go to **Settings** → **Domains & Routes**
4. Click **Add Custom Domain**
5. Enter `moodmash.win`
6. Click **Add Domain**

### 3. SSL/TLS Configuration

1. Go to **SSL/TLS** in your domain settings
2. Set encryption mode to **Full (strict)**
3. Enable **Always Use HTTPS**
4. Enable **Automatic HTTPS Rewrites**

### 4. Configure www Redirect

Create a redirect rule:
1. Go to **Rules** → **Redirect Rules**
2. Create a new rule:
   - **If** hostname equals `www.moodmash.win`
   - **Then** redirect to `https://moodmash.win` + path
   - Type: **Dynamic redirect** (301)

### 5. Wrangler Configuration

Update `wrangler.toml` if needed:

```toml
routes = [
  { pattern = "moodmash.win", custom_domain = true },
  { pattern = "www.moodmash.win", custom_domain = true }
]
```

## OAuth Configuration

Update OAuth redirect URIs in your provider dashboards:

### Google OAuth
- Authorized redirect URI: `https://moodmash.win/api/auth/callback/google`

### GitHub OAuth
- Authorization callback URL: `https://moodmash.win/api/auth/callback/github`

## Email Configuration

If using Resend or other email services, update:
- From address: `noreply@moodmash.win`
- Support email: `support@moodmash.win`

Add SPF, DKIM, and DMARC records for email deliverability.

## Verification Checklist

- [ ] DNS records configured
- [ ] Custom domain added to Workers/Pages
- [ ] SSL/TLS set to Full (strict)
- [ ] www redirect configured
- [ ] OAuth redirect URIs updated
- [ ] Email configuration updated
- [ ] SPF/DKIM/DMARC records added

## Troubleshooting

### Domain Not Resolving
1. Check DNS propagation: `dig moodmash.win`
2. Ensure proxy status is enabled in Cloudflare
3. Wait up to 24 hours for DNS propagation

### SSL Certificate Issues
1. Verify SSL mode is "Full (strict)"
2. Check Edge Certificates are active
3. Disable and re-enable Universal SSL if needed

### OAuth Redirect Errors
1. Verify redirect URI matches exactly
2. Check for trailing slashes
3. Ensure HTTPS is used

## Contact

For technical support: support@moodmash.win
