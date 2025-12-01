# Add Grafana Environment Variables to Cloudflare Pages

## Instructions

You need to add these environment variables to your Cloudflare Pages project `moodmash`:

### Step 1: Go to Cloudflare Dashboard

1. Login to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to: **Workers & Pages** → **moodmash**
3. Click on **Settings** tab
4. Scroll down to **Environment variables**
5. Click **Add variable** for each of the following:

### Step 2: Add These Variables (Production Environment)

```
Variable Name: GRAFANA_PROMETHEUS_URL
Value: https://prometheus-prod-53-prod-me-central-1.grafana.net/api/prom/push
```

```
Variable Name: GRAFANA_PROMETHEUS_USER
Value: 2832497
```

```
Variable Name: GRAFANA_PROMETHEUS_TOKEN
Value: glc_eyJvIjoiMTYwMzkyMCIsIm4iOiJzdGFjay0xNDU0MTMyLWhtLXdyaXRlLW1vb2RtYXNoIiwiayI6IjY3a2NjQzJXM3JtVEczc3I1MjBKMjFjSCIsIm0iOnsiciI6InByb2QtbWUtY2VudHJhbC0xIn19
```

```
Variable Name: GRAFANA_LOKI_URL
Value: https://logs-prod-033.grafana.net/loki/api/v1/push
```

```
Variable Name: GRAFANA_LOKI_USER
Value: 1411925
```

```
Variable Name: GRAFANA_LOKI_TOKEN
Value: glc_eyJvIjoiMTYwMzkyMCIsIm4iOiJzdGFjay0xNDU0MTMyLWhsLXJlYWQtbW9vZG1hc2giLCJrIjoiaTJPNkgxOTdldzI4SENiVjFnT3lDMThqIiwibSI6eyJyIjoicHJvZC1tZS1jZW50cmFsLTEifX0=
```

```
Variable Name: GRAFANA_STACK_URL
Value: https://salimmoodmash.grafana.net
```

### Step 3: Encrypt Sensitive Variables

- Mark `GRAFANA_PROMETHEUS_TOKEN` as **Encrypt** ✓
- Mark `GRAFANA_LOKI_TOKEN` as **Encrypt** ✓

### Step 4: Save and Deploy

Click **Save** after adding all variables. The next deployment will automatically use these credentials.

## Alternative: Using Wrangler CLI

You can also add these using the wrangler command line:

```bash
npx wrangler pages secret put GRAFANA_PROMETHEUS_URL --project-name moodmash
# Enter: https://prometheus-prod-53-prod-me-central-1.grafana.net/api/prom/push

npx wrangler pages secret put GRAFANA_PROMETHEUS_USER --project-name moodmash
# Enter: 2832497

npx wrangler pages secret put GRAFANA_PROMETHEUS_TOKEN --project-name moodmash
# Enter: glc_eyJvIjoiMTYwMzkyMCIsIm4iOiJzdGFjay0xNDU0MTMyLWhtLXdyaXRlLW1vb2RtYXNoIiwiayI6IjY3a2NjQzJXM3JtVEczc3I1MjBKMjFjSCIsIm0iOnsiciI6InByb2QtbWUtY2VudHJhbC0xIn19

npx wrangler pages secret put GRAFANA_LOKI_URL --project-name moodmash
# Enter: https://logs-prod-033.grafana.net/loki/api/v1/push

npx wrangler pages secret put GRAFANA_LOKI_USER --project-name moodmash
# Enter: 1411925

npx wrangler pages secret put GRAFANA_LOKI_TOKEN --project-name moodmash
# Enter: glc_eyJvIjoiMTYwMzkyMCIsIm4iOiJzdGFjay0xNDU0MTMyLWhsLXJlYWQtbW9vZG1hc2giLCJrIjoiaTJPNkgxOTdldzI4SENiVjFnT3lDMThqIiwibSI6eyJyIjoicHJvZC1tZS1jZW50cmFsLTEifX0=

npx wrangler pages secret put GRAFANA_STACK_URL --project-name moodmash
# Enter: https://salimmoodmash.grafana.net
```

## Verification

After adding the environment variables:

1. Deploy your application (the monitoring code will be added next)
2. Check logs in Grafana Cloud: https://salimmoodmash.grafana.net/explore
3. Check metrics in Grafana Cloud Prometheus

## Security Notes

✅ **DO**: Store these tokens as environment variables in Cloudflare
✅ **DO**: Use encrypted secrets for tokens
❌ **DON'T**: Commit tokens to git repository
❌ **DON'T**: Expose tokens in client-side code

## Next Steps

After adding these environment variables:
1. I will create the monitoring integration code
2. Deploy the updated application
3. Verify monitoring data in Grafana Cloud
