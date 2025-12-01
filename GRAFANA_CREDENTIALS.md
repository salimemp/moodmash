# Grafana Cloud Credentials - MoodMash

**Date**: 2025-11-30  
**Stack**: salimmoodmash  
**Status**: ✅ Credentials collected successfully

---

## Prometheus (Metrics)

**Data Source Name**: `grafanacloud-salimmakrana-prom`  
**Endpoint**: `https://prometheus-prod-53-prod-me-central-1.grafana.net/api/prom`  
**Instance ID**: `2832497`  
**Token**: `glc_eyJvIjoiMTYwMzkyMCIsIm4iOiJzdGFjay0xNDU0MTMyLWhtLXdyaXRlLW1vb2RtYXNoIiwiayI6IjY3a2NjQzJXM3JtVEczc3I1MjBKMjFjSCIsIm0iOnsiciI6InByb2QtbWUtY2VudHJhbC0xIn19`

---

## Loki (Logs)

**Data Source Name**: `grafanacloud-salimmakrana-logs`  
**Endpoint**: `https://logs-prod-033.grafana.net`  
**Instance ID**: `1411925`  
**Token**: `glc_eyJvIjoiMTYwMzkyMCIsIm4iOiJzdGFjay0xNDU0MTMyLWhsLXJlYWQtbW9vZG1hc2giLCJrIjoiaTJPNkgxOTdldzI4SENiVjFnT3lDMThqIiwibSI6eyJyIjoicHJvZC1tZS1jZW50cmFsLTEifX0=`

---

## Environment Variables for Cloudflare Pages

Add these to Cloudflare Pages → moodmash → Settings → Environment Variables:

```bash
# Grafana Cloud - Prometheus (Metrics)
GRAFANA_PROMETHEUS_URL=https://prometheus-prod-53-prod-me-central-1.grafana.net/api/prom/push
GRAFANA_PROMETHEUS_USER=2832497
GRAFANA_PROMETHEUS_TOKEN=glc_eyJvIjoiMTYwMzkyMCIsIm4iOiJzdGFjay0xNDU0MTMyLWhtLXdyaXRlLW1vb2RtYXNoIiwiayI6IjY3a2NjQzJXM3JtVEczc3I1MjBKMjFjSCIsIm0iOnsiciI6InByb2QtbWUtY2VudHJhbC0xIn19

# Grafana Cloud - Loki (Logs)
GRAFANA_LOKI_URL=https://logs-prod-033.grafana.net/loki/api/v1/push
GRAFANA_LOKI_USER=1411925
GRAFANA_LOKI_TOKEN=glc_eyJvIjoiMTYwMzkyMCIsIm4iOiJzdGFjay0xNDU0MTMyLWhsLXJlYWQtbW9vZG1hc2giLCJrIjoiaTJPNkgxOTdldzI4SENiVjFnT3lDMThqIiwibSI6eyJyIjoicHJvZC1tZS1jZW50cmFsLTEifX0=

# Grafana Stack URL (for dashboards)
GRAFANA_STACK_URL=https://salimmakrana.grafana.net
```

---

## Testing the Connection

### Test Prometheus (Metrics)

```bash
# Test authentication
curl -u 2832497:glc_eyJvIjoiMTYwMzkyMCIsIm4iOiJzdGFjay0xNDU0MTMyLWhtLXdyaXRlLW1vb2RtYXNoIiwiayI6IjY3a2NjQzJXM3JtVEczc3I1MjBKMjFjSCIsIm0iOnsiciI6InByb2QtbWUtY2VudHJhbC0xIn19 \
  https://prometheus-prod-53-prod-me-central-1.grafana.net/api/prom/api/v1/labels

# Send test metric
curl -X POST \
  -u 2832497:glc_eyJvIjoiMTYwMzkyMCIsIm4iOiJzdGFjay0xNDU0MTMyLWhtLXdyaXRlLW1vb2RtYXNoIiwiayI6IjY3a2NjQzJXM3JtVEczc3I1MjBKMjFjSCIsIm0iOnsiciI6InByb2QtbWUtY2VudHJhbC0xIn19 \
  -H "Content-Type: application/x-protobuf" \
  https://prometheus-prod-53-prod-me-central-1.grafana.net/api/prom/push
```

### Test Loki (Logs)

```bash
# Test authentication
curl -u 1411925:glc_eyJvIjoiMTYwMzkyMCIsIm4iOiJzdGFjay0xNDU0MTMyLWhsLXJlYWQtbW9vZG1hc2giLCJrIjoiaTJPNkgxOTdldzI4SENiVjFnT3lDMThqIiwibSI6eyJyIjoicHJvZC1tZS1jZW50cmFsLTEifX0= \
  https://logs-prod-033.grafana.net/loki/api/v1/labels
```

---

## Security Notes

⚠️ **IMPORTANT**: These tokens provide access to your Grafana Cloud data.

- ✅ Store in Cloudflare Pages environment variables (encrypted)
- ✅ Never commit to git
- ✅ Never expose in client-side code
- ✅ Rotate tokens regularly (every 90 days recommended)
- ❌ Do not share publicly
- ❌ Do not log token values

---

## Next Steps

1. **Add environment variables** to Cloudflare Pages (see section above)
2. **Implement Grafana integration** in MoodMash code
3. **Create dashboards** in Grafana for monitoring
4. **Set up alerts** for critical metrics
5. **Test integration** with real data

---

**Status**: ✅ Ready to integrate into MoodMash!

