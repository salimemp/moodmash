# Grafana & Prometheus Integration Guide for MoodMash

## Overview

MoodMash provides Prometheus-compatible metrics endpoints and a built-in monitoring dashboard. This guide explains how to integrate with external Grafana and Prometheus instances.

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  MoodMash   │◄─────│  Prometheus  │◄─────│   Grafana   │
│  (Metrics)  │      │   (Scraper)  │      │ (Dashboard) │
└─────────────┘      └──────────────┘      └─────────────┘
```

## 🔥 Important: Cloudflare Limitations

**MoodMash runs on Cloudflare Pages/Workers, which has specific constraints:**

1. **Cannot run Prometheus/Grafana directly** - No long-running processes allowed
2. **Cannot access file system at runtime** - No persistent storage for time-series data
3. **10ms-30ms CPU time limit** - Cannot run resource-intensive monitoring services

**Solution: External Infrastructure Required**

- **Option 1**: Use Grafana Cloud (Free tier available)
- **Option 2**: Self-hosted on VPS/Cloud (AWS EC2, DigitalOcean, etc.)
- **Option 3**: Use Docker Compose on your local machine for development

## 📊 Available Metrics Endpoints

### 1. **Health Check** (Public)
```bash
curl https://moodmash.win/api/health/status
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-27T06:20:11.230Z",
  "api": "healthy",
  "database": "healthy",
  "auth": "healthy",
  "email": "configured",
  "storage": "healthy",
  "ai": "configured",
  "uptime": 4235
}
```

### 2. **Prometheus Metrics** (Public)
```bash
curl https://moodmash.win/api/monitoring/metrics
```

**Response:**
```json
{
  "requests_total": 12453,
  "requests_by_endpoint": {
    "/api/mood": 4231,
    "/api/auth/login": 823,
    "/api/ai/chat": 2341
  },
  "errors_total": 23,
  "errors_by_type": {
    "AUTH_ERROR": 12,
    "DB_ERROR": 8,
    "VALIDATION_ERROR": 3
  },
  "response_time_avg": 145.23,
  "response_time_p95": 342.12,
  "response_time_p99": 567.89,
  "active_users": 156,
  "database_queries": 8432,
  "timestamp": 1732686011230
}
```

### 3. **Performance Metrics** (Public)
```bash
curl https://moodmash.win/api/monitoring/performance
```

**Response:**
```json
{
  "last_hour": [
    {"timestamp": "2025-11-27T05:00:00Z", "avg_response_time": 142.5, "request_count": 523},
    {"timestamp": "2025-11-27T06:00:00Z", "avg_response_time": 156.2, "request_count": 612}
  ],
  "summary": {
    "avg_response_time": 149.35,
    "total_requests": 1135,
    "error_rate": 0.02
  }
}
```

### 4. **Built-in Monitoring Dashboard** (Public)
```
https://moodmash.win/monitoring
```

- Real-time metrics visualization with Chart.js
- System health status
- Performance graphs
- Error tracking
- No authentication required

## 🐳 Option 1: Docker Compose Setup (Easiest)

Create `docker-compose.yml` on your local machine or VPS:

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: moodmash-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: moodmash-grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
    depends_on:
      - prometheus
    restart: unless-stopped

volumes:
  prometheus-data:
  grafana-data:
```

Create `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'moodmash'
    scrape_interval: 30s
    metrics_path: '/api/monitoring/metrics'
    scheme: https
    static_configs:
      - targets: ['moodmash.win']
        labels:
          environment: 'production'
          service: 'moodmash-api'

  - job_name: 'moodmash-health'
    scrape_interval: 60s
    metrics_path: '/api/health/status'
    scheme: https
    static_configs:
      - targets: ['moodmash.win']
        labels:
          environment: 'production'
          service: 'moodmash-health'
```

**Start the monitoring stack:**

```bash
# Create directories
mkdir -p grafana/provisioning/datasources
mkdir -p grafana/provisioning/dashboards

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Access services
# Grafana: http://localhost:3001 (admin/admin123)
# Prometheus: http://localhost:9090
```

## 📈 Option 2: Grafana Cloud (Free Tier)

**Step 1:** Sign up at [https://grafana.com/auth/sign-up](https://grafana.com/auth/sign-up)

**Step 2:** Get your Prometheus endpoint:
- Go to **Configuration** > **Data Sources**
- Select **Prometheus**
- Copy your **Remote Write URL** (e.g., `https://prometheus-xxx.grafana.net/api/prom/push`)

**Step 3:** Configure Prometheus to forward metrics:

```yaml
# prometheus.yml
remote_write:
  - url: https://prometheus-xxx.grafana.net/api/prom/push
    basic_auth:
      username: YOUR_GRAFANA_CLOUD_USERNAME
      password: YOUR_GRAFANA_CLOUD_API_KEY

scrape_configs:
  - job_name: 'moodmash'
    scrape_interval: 30s
    metrics_path: '/api/monitoring/metrics'
    scheme: https
    static_configs:
      - targets: ['moodmash.win']
```

**Step 4:** Install local Prometheus (or use Docker):

```bash
# macOS
brew install prometheus
prometheus --config.file=prometheus.yml

# Linux
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
cd prometheus-*
./prometheus --config.file=prometheus.yml

# Docker
docker run -d -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

## 🖥️ Option 3: Self-Hosted on VPS

**Install on Ubuntu/Debian:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xvfz prometheus-2.45.0.linux-amd64.tar.gz
sudo mv prometheus-2.45.0.linux-amd64 /opt/prometheus
sudo useradd --no-create-home --shell /bin/false prometheus
sudo chown -R prometheus:prometheus /opt/prometheus

# Create systemd service
sudo tee /etc/systemd/system/prometheus.service << 'EOF'
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/opt/prometheus/prometheus \
  --config.file=/opt/prometheus/prometheus.yml \
  --storage.tsdb.path=/opt/prometheus/data

[Install]
WantedBy=multi-user.target
EOF

# Start Prometheus
sudo systemctl daemon-reload
sudo systemctl start prometheus
sudo systemctl enable prometheus

# Install Grafana
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install grafana

# Start Grafana
sudo systemctl start grafana-server
sudo systemctl enable grafana-server

# Access services
# Prometheus: http://your-vps-ip:9090
# Grafana: http://your-vps-ip:3000 (admin/admin)
```

## 📊 Grafana Dashboard Configuration

### Add Prometheus Data Source

1. **Login to Grafana** (http://localhost:3001 or your Grafana URL)
2. **Go to Configuration** > **Data Sources**
3. **Click "Add data source"**
4. **Select "Prometheus"**
5. **Configure:**
   - Name: `MoodMash Prometheus`
   - URL: `http://prometheus:9090` (Docker) or `http://localhost:9090` (local)
   - Access: `Server (default)`
6. **Click "Save & Test"**

### Import MoodMash Dashboard

1. **Go to Dashboards** > **Import**
2. **Upload JSON** or paste this dashboard configuration:

```json
{
  "dashboard": {
    "title": "MoodMash Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(moodmash_requests_total[5m])",
            "legendFormat": "{{endpoint}}"
          }
        ],
        "gridPos": {"x": 0, "y": 0, "w": 12, "h": 8}
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(moodmash_errors_total[5m])",
            "legendFormat": "{{error_type}}"
          }
        ],
        "gridPos": {"x": 12, "y": 0, "w": 12, "h": 8}
      },
      {
        "title": "Response Time (P95)",
        "targets": [
          {
            "expr": "moodmash_response_time_p95"
          }
        ],
        "gridPos": {"x": 0, "y": 8, "w": 12, "h": 8}
      },
      {
        "title": "Active Users",
        "targets": [
          {
            "expr": "moodmash_active_users"
          }
        ],
        "gridPos": {"x": 12, "y": 8, "w": 12, "h": 8}
      }
    ]
  }
}
```

### Key Metrics to Monitor

| Metric | Description | Query Example |
|--------|-------------|---------------|
| **Request Rate** | Requests per second | `rate(requests_total[5m])` |
| **Error Rate** | Errors per second | `rate(errors_total[5m])` |
| **Response Time P95** | 95th percentile latency | `response_time_p95` |
| **Response Time P99** | 99th percentile latency | `response_time_p99` |
| **Active Users** | Current active sessions | `active_users` |
| **DB Queries** | Database query count | `database_queries` |

## 🚨 Alerting Rules

Create `alert_rules.yml`:

```yaml
groups:
  - name: moodmash_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(moodmash_errors_total[5m]) > 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"

      - alert: SlowResponseTime
        expr: moodmash_response_time_p95 > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow API response time"
          description: "P95 response time is {{ $value }}ms"

      - alert: ServiceDown
        expr: up{job="moodmash"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "MoodMash service is down"
          description: "Service has been unreachable for 2 minutes"
```

Update `prometheus.yml`:

```yaml
rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']
```

## 📱 Notification Channels

### Slack Integration

1. Create Slack webhook: https://api.slack.com/messaging/webhooks
2. Configure Alertmanager (`alertmanager.yml`):

```yaml
global:
  slack_api_url: 'YOUR_SLACK_WEBHOOK_URL'

route:
  receiver: 'slack-notifications'

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - channel: '#monitoring'
        title: 'MoodMash Alert'
        text: '{{ .CommonAnnotations.summary }}'
```

### Email Alerts

```yaml
receivers:
  - name: 'email-notifications'
    email_configs:
      - to: 'alerts@moodmash.com'
        from: 'monitoring@moodmash.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'monitoring@moodmash.com'
        auth_password: 'YOUR_APP_PASSWORD'
```

## 🔐 Security Best Practices

1. **Restrict Prometheus access:**
   ```yaml
   # prometheus.yml
   web:
     listen_address: '127.0.0.1:9090'
   ```

2. **Enable Grafana authentication:**
   ```ini
   # grafana.ini
   [auth.anonymous]
   enabled = false
   ```

3. **Use reverse proxy with SSL:**
   ```nginx
   # nginx.conf
   server {
       listen 443 ssl;
       server_name monitoring.moodmash.com;
       
       ssl_certificate /etc/ssl/certs/monitoring.crt;
       ssl_certificate_key /etc/ssl/private/monitoring.key;
       
       location / {
           proxy_pass http://localhost:3001;
       }
   }
   ```

## 📊 Example Queries

### Request Rate by Endpoint
```promql
sum(rate(moodmash_requests_total[5m])) by (endpoint)
```

### Error Percentage
```promql
(sum(rate(moodmash_errors_total[5m])) / sum(rate(moodmash_requests_total[5m]))) * 100
```

### Average Response Time
```promql
avg(moodmash_response_time_avg)
```

### Top 5 Slowest Endpoints
```promql
topk(5, moodmash_response_time_p95)
```

## 🎯 Next Steps

1. ✅ **Deploy Prometheus + Grafana** (Docker Compose recommended)
2. ✅ **Import MoodMash dashboard** to Grafana
3. ✅ **Configure alerting** for critical metrics
4. ✅ **Set up notification channels** (Slack, Email)
5. ✅ **Monitor and iterate** on dashboard layout

## 📚 Resources

- **Prometheus Documentation**: https://prometheus.io/docs/
- **Grafana Documentation**: https://grafana.com/docs/
- **MoodMash Metrics**: https://moodmash.win/api/monitoring/metrics
- **Built-in Dashboard**: https://moodmash.win/monitoring

## 🆘 Troubleshooting

### Prometheus can't scrape metrics
- Check if `https://moodmash.win/api/monitoring/metrics` is accessible
- Verify `prometheus.yml` configuration
- Check Prometheus logs: `docker-compose logs prometheus`

### Grafana shows "No data"
- Verify Prometheus data source connection
- Check if Prometheus is successfully scraping: http://localhost:9090/targets
- Verify query syntax in Grafana panels

### High memory usage
- Reduce `scrape_interval` in `prometheus.yml`
- Limit retention period: `--storage.tsdb.retention.time=15d`
- Use remote storage for production

---

**Status:** ✅ Monitoring infrastructure ready  
**Last Updated:** 2025-11-27  
**Maintainer:** MoodMash DevOps Team
