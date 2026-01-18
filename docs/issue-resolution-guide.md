# MoodMash Issue Resolution Guide

> Quick reference for troubleshooting common issues without coding knowledge

---

## Quick Diagnostic Checklist

Before diving into specific issues, always check:

1. [ ] Is the internet working? (Try visiting google.com)
2. [ ] Is Cloudflare status OK? (Check status.cloudflare.com)
3. [ ] Have you made any recent changes?
4. [ ] Is the issue affecting all users or just some?
5. [ ] What error message are you seeing (exact text)?

---

## Common Issues & Solutions

### 1. App Not Loading

**Symptoms:**
- White screen
- Loading spinner never stops
- "This site can't be reached" error

**Quick Checks:**
1. Visit your app URL in incognito mode
2. Try a different browser
3. Check Cloudflare status page
4. Look at Cloudflare dashboard for errors

**Solutions:**
| Problem | Solution |
|---------|----------|
| Cloudflare outage | Wait for Cloudflare to resolve |
| Deployment failed | Check GitHub Actions, re-deploy |
| Domain issue | Verify DNS settings in Cloudflare |
| SSL certificate | Wait 24 hours for SSL propagation |

**Get Help:**
- Cloudflare Community: community.cloudflare.com
- Support Ticket: dash.cloudflare.com/support

---

### 2. Database Errors

**Symptoms:**
- "Database error" message
- Data not saving
- Missing user data

**Quick Checks:**
1. Check Cloudflare D1 dashboard
2. Look for recent deployment changes
3. Verify database bindings in wrangler.toml

**Solutions:**
| Problem | Solution |
|---------|----------|
| D1 outage | Wait for Cloudflare to resolve |
| Migration failed | Re-run migrations |
| Binding missing | Check wrangler.toml configuration |
| Data corruption | Restore from backup |

**How to Check D1:**
1. Log into Cloudflare Dashboard
2. Go to Workers & Pages > D1
3. Select your database
4. Check "Metrics" for errors

---

### 3. Authentication Issues

**Symptoms:**
- Can't log in
- Session expired unexpectedly
- OAuth login fails

**Quick Checks:**
1. Clear browser cookies
2. Try incognito mode
3. Check OAuth credentials in Cloudflare
4. Verify callback URLs

**Solutions:**
| Problem | Solution |
|---------|----------|
| Cookies blocked | Enable cookies in browser |
| OAuth expired | Regenerate OAuth credentials |
| Wrong callback URL | Update in Google/GitHub console |
| Session issues | Clear all cookies, try again |

**OAuth Troubleshooting:**

**Google OAuth:**
1. Go to console.cloud.google.com
2. APIs & Services > Credentials
3. Verify redirect URIs include your domain
4. Check if OAuth consent screen is verified

**GitHub OAuth:**
1. Go to github.com/settings/developers
2. OAuth Apps > Your App
3. Verify callback URL is correct
4. Regenerate secret if needed

---

### 4. Payment Issues (Stripe)

**Symptoms:**
- Payment not processing
- Subscription not activating
- Webhook errors

**Quick Checks:**
1. Log into Stripe Dashboard
2. Check "Developers" > "Events" for errors
3. Verify webhook endpoint
4. Check API keys in Cloudflare

**Solutions:**
| Problem | Solution |
|---------|----------|
| Wrong API key | Update in Cloudflare secrets |
| Webhook failing | Check endpoint URL, re-create webhook |
| Test vs Live mode | Ensure using correct mode |
| Card declined | User issue, not app issue |

**Stripe Dashboard Steps:**
1. Go to dashboard.stripe.com
2. Click "Developers" tab
3. Check "Events" for recent activity
4. Check "Webhooks" for failed deliveries

---

### 5. Email Not Sending (Resend)

**Symptoms:**
- Verification emails not received
- Password reset not working
- No emails in spam either

**Quick Checks:**
1. Log into Resend dashboard
2. Check email logs
3. Verify API key
4. Check domain verification

**Solutions:**
| Problem | Solution |
|---------|----------|
| API key wrong | Update in Cloudflare secrets |
| Domain not verified | Add DNS records in Resend |
| Rate limited | Wait and try again |
| Email bounced | Check user's email address |

**Resend Dashboard Steps:**
1. Go to resend.com/emails
2. View recent email attempts
3. Check for failed deliveries
4. Verify domain settings

---

### 6. Performance Issues

**Symptoms:**
- App loading slowly
- Timeouts
- Laggy interface

**Quick Checks:**
1. Check Cloudflare analytics
2. Test from different locations
3. Check if issue is global or regional

**Solutions:**
| Problem | Solution |
|---------|----------|
| High traffic spike | May need to upgrade plan |
| Large database queries | Optimize data usage |
| Asset loading slow | Check CDN settings |
| Regional outage | Wait for Cloudflare resolution |

---

### 7. Deployment Issues

**Symptoms:**
- Changes not appearing
- Build failing
- Deploy stuck

**Quick Checks:**
1. Check GitHub Actions status
2. Look at build logs
3. Verify Cloudflare API token

**Solutions:**
| Problem | Solution |
|---------|----------|
| Build failed | Check GitHub Actions logs |
| Token expired | Regenerate Cloudflare API token |
| Branch protection | Check GitHub settings |
| Tests failing | Fix tests before deploy |

**GitHub Actions Steps:**
1. Go to github.com/your-repo/actions
2. Click on the latest run
3. Look for red X marks
4. Click to see error details

---

## Emergency Contacts & Resources

### Official Support:

| Service | Contact | Response Time |
|---------|---------|---------------|
| Cloudflare | dash.cloudflare.com/support | 24-48 hours |
| Stripe | support.stripe.com | 24-48 hours |
| Resend | resend.com/contact | 24-48 hours |
| GitHub | support.github.com | 24-72 hours |

### Community Resources:

| Platform | Link | Best For |
|----------|------|----------|
| Cloudflare Discord | discord.gg/cloudflaredev | Quick questions |
| Stack Overflow | stackoverflow.com | Technical issues |
| Indie Hackers | indiehackers.com | Business advice |
| Reddit r/webdev | reddit.com/r/webdev | General help |

### Freelance Emergency Help:

| Platform | Cost Range | Speed |
|----------|-----------|-------|
| Upwork (Urgent) | $50-150/hour | Same day |
| Fiverr Pro | $100-300/task | 24-48 hours |
| Toptal | $100-200/hour | Same day |

---

## Monitoring Setup Guide

### Free Monitoring Tools:

**1. Cloudflare Analytics (Built-in):**
- Traffic patterns
- Error rates
- Geographic distribution
- Performance metrics

**2. Google Analytics 4:**
- User behavior
- Conversion tracking
- Custom events
- Free forever

**3. UptimeRobot (Free tier):**
- Uptime monitoring
- 5-minute intervals
- Email alerts
- Status page

**4. Sentry (Free tier):**
- Error tracking
- Performance monitoring
- Email alerts
- 5K events/month free

### Setting Up Alerts:

**Cloudflare:**
1. Dashboard > Notifications
2. Add notification
3. Select "Workers" and "Pages"
4. Add email address
5. Save

**UptimeRobot:**
1. Sign up at uptimerobot.com
2. Add new monitor
3. Enter your app URL
4. Set check interval
5. Add alert contact

---

## Backup & Recovery

### What to Backup:

| Item | Where | How Often |
|------|-------|--------|
| Database | Cloudflare D1 | Daily (auto) |
| Code | GitHub | Every commit |
| Secrets | Local secure storage | On change |
| Analytics | Export to CSV | Monthly |

### How to Restore:

**Database (D1):**
1. Go to Cloudflare D1 dashboard
2. Select database
3. Go to "Backups" tab
4. Select backup point
5. Click "Restore"

**Code (GitHub):**
1. Go to repository
2. Click "Commits"
3. Find working commit
4. Click "Browse files"
5. Create new branch from that point

---

## Issue Escalation Path

### Level 1: Self-Service (0-15 minutes)
1. Check this guide
2. Search documentation
3. Try basic troubleshooting
4. Check status pages

### Level 2: Community Help (15-60 minutes)
1. Ask on Discord/community
2. Search Stack Overflow
3. Check Reddit
4. Post question with details

### Level 3: Official Support (1-24 hours)
1. Submit support ticket
2. Include all error details
3. Document steps to reproduce
4. Wait for response

### Level 4: Emergency Freelance (1-4 hours)
1. Post urgent job on Upwork
2. Contact known developers
3. Offer premium rate for speed
4. Document the fix for future

---

## Prevention Checklist

### Weekly:
- [ ] Quick check of app functionality
- [ ] Review Cloudflare analytics
- [ ] Check for security updates
- [ ] Read user feedback

### Monthly:
- [ ] Review all error logs
- [ ] Check backup status
- [ ] Update dependencies (carefully)
- [ ] Review security settings

### Quarterly:
- [ ] Full security audit
- [ ] Review and update this guide
- [ ] Test disaster recovery
- [ ] Update documentation

---

*Last updated: January 18, 2026*
