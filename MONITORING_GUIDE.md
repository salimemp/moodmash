# MoodMash Monitoring & Metrics Guide

## 🎯 Overview

MoodMash provides comprehensive monitoring capabilities with **Prometheus-compatible metrics** and a **built-in monitoring dashboard**.

**Status**: ✅ **PRODUCTION READY**

---

## 📊 Built-In Monitoring Dashboard

### **Access**
- **URL**: https://moodmash.win/monitoring
- **Local**: http://localhost:3000/monitoring
- **Auth**: Requires login

### **Features**
✅ Real-time metrics visualization  
✅ Auto-refresh every 5 seconds  
✅ Interactive charts (Chart.js)  
✅ Health status indicators  
✅ Performance tracking  
✅ Error monitoring  

### **Metrics Displayed**
1. **Health Status Cards**
   - API Health
   - Database Health
   - Auth Service Health
   - Email Service Health

2. **Key Metrics**
   - Total Requests
   - Total Errors
   - Average Response Time
   - Active Users

3. **Charts**
   - Response Time (Avg & P95)
   - Request Rate
   - Error Rate
   - Active Users

---

## 🔗 Prometheus Integration

### **Metrics Endpoint**

**URL**: `https://moodmash.win/metrics`

**Format**: Prometheus text format (version 0.0.4)

**Authentication**: Public (for Prometheus scraping)

### **Available Metrics**

#### **Request Metrics**
```
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/api/stats"} 1523

# TYPE http_errors_total counter
http_errors_total{path="/api/login"} 12
```

#### **Performance Metrics**
```
# TYPE response_time_ms gauge
response_time_ms 45

# TYPE http_response_time_p95 gauge
http_response_time_p95 120

# TYPE http_response_time_p99 gauge
http_response_time_p99 250
```

#### **Database Metrics**
```
# TYPE database_queries_total counter
database_queries_total 5432
```

#### **Authentication Metrics**
```
# TYPE auth_attempts_total counter
auth_attempts_total 234

# TYPE auth_failures_total counter
auth_failures_total 12
```

#### **Application Metrics**
```
# TYPE active_users gauge
active_users 42
```

---

## 🐳 External Prometheus Setup

### **Option 1: Docker Compose**

Create `prometheus-stack/docker-compose.yml`:

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=15d'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
    depends_on:
      - prometheus
    restart: unless-stopped

volumes:
  prometheus-data:
  grafana-data:
```

### **Prometheus Configuration**

Create `prometheus-stack/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'moodmash'
    metrics_path: '/metrics'
    scrape_interval: 10s
    static_configs:
      - targets: ['moodmash.win:443']
    scheme: https
    
  - job_name: 'moodmash-dev'
    metrics_path: '/metrics'
    scrape_interval: 10s
    static_configs:
      - targets: ['localhost:3000']
    scheme: http
```

### **Start Prometheus & Grafana**

```bash
cd prometheus-stack
docker-compose up -d

# Access Prometheus: http://localhost:9090
# Access Grafana: http://localhost:3001 (admin/admin)
```

---

## 📈 Grafana Dashboard Setup

### **1. Add Prometheus Data Source**

1. Open Grafana: http://localhost:3001
2. Login (admin/admin)
3. Go to Configuration → Data Sources
4. Click "Add data source"
5. Select "Prometheus"
6. Set URL: `http://prometheus:9090`
7. Click "Save & Test"

### **2. Import MoodMash Dashboard**

Create `grafana/dashboards/moodmash.json`:

```json
{
  "dashboard": {
    "title": "MoodMash Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_errors_total[5m])"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Response Time P95",
        "targets": [
          {
            "expr": "http_response_time_p95"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Active Users",
        "targets": [
          {
            "expr": "active_users"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

---

## 🔍 Health Check Endpoint

### **Endpoint**: `/api/health/status`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-26T10:30:00.000Z",
  "api": "healthy",
  "database": "healthy",
  "auth": "healthy",
  "email": "configured",
  "storage": "healthy",
  "ai": "configured",
  "uptime": 3600
}
```

**Status Values**:
- `healthy` - Service is operational
- `degraded` - Some issues detected
- `unhealthy` - Service is down
- `configured` - Service is configured but not health-checked
- `not_configured` - Service not configured

---

## 📊 Querying Metrics

### **Using Prometheus Query Language (PromQL)**

#### **Total Requests**
```promql
http_requests_total
```

#### **Request Rate (per second)**
```promql
rate(http_requests_total[5m])
```

#### **Error Percentage**
```promql
(rate(http_errors_total[5m]) / rate(http_requests_total[5m])) * 100
```

#### **Average Response Time**
```promql
response_time_ms
```

#### **Top 5 Slowest Endpoints**
```promql
topk(5, http_response_time_p99)
```

---

## 🚨 Alerting Rules

### **Prometheus Alerts**

Create `prometheus-stack/alerts.yml`:

```yaml
groups:
  - name: moodmash_alerts
    interval: 30s
    rules:
      # High Error Rate
      - alert: HighErrorRate
        expr: (rate(http_errors_total[5m]) / rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}% over the last 5 minutes"
      
      # Slow Response Time
      - alert: SlowResponseTime
        expr: http_response_time_p95 > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow response time detected"
          description: "P95 response time is {{ $value }}ms"
      
      # Database Down
      - alert: DatabaseUnhealthy
        expr: up{job="moodmash"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"
          description: "MoodMash database has been down for 2 minutes"
      
      # High Authentication Failures
      - alert: HighAuthFailures
        expr: rate(auth_failures_total[5m]) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High authentication failure rate"
          description: "{{ $value }} auth failures per second"
```

---

## 📱 Alertmanager Integration

### **Setup Alertmanager**

Add to `docker-compose.yml`:

```yaml
  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
    restart: unless-stopped
```

### **Configure Alertmanager**

Create `alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m

route:
  receiver: 'email'
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h

receivers:
  - name: 'email'
    email_configs:
      - to: 'alerts@moodmash.win'
        from: 'prometheus@moodmash.win'
        smarthost: 'smtp.example.com:587'
        auth_username: 'alerts@moodmash.win'
        auth_password: 'your-password'
```

---

## 🔧 Metrics Collection Architecture

### **Flow**
```
User Request
    ↓
MoodMash API (Cloudflare Workers)
    ↓
Metrics Middleware (collects data)
    ↓
In-Memory Storage (metricsCollector)
    ↓
/metrics Endpoint (Prometheus format)
    ↓
Prometheus (scrapes every 10s)
    ↓
Grafana (visualizes)
```

### **Important Notes**

⚠️ **Stateless Architecture**  
- Metrics are stored in-memory
- Reset on worker restart
- Use Prometheus for long-term storage

⚠️ **Cloudflare Limitations**  
- Cannot run Prometheus/Grafana directly
- Must use external monitoring infrastructure
- Metrics endpoint is the integration point

✅ **Best Practices**  
- Scrape metrics every 10-15 seconds
- Store in Prometheus for history
- Use Grafana for visualization
- Set up alerts for critical issues

---

## 📈 Key Performance Indicators (KPIs)

### **Availability**
- Target: 99.9% uptime
- Monitor: `up` metric

### **Performance**
- P95 Response Time: < 200ms
- P99 Response Time: < 500ms
- Monitor: `http_response_time_p95`, `http_response_time_p99`

### **Reliability**
- Error Rate: < 1%
- Monitor: `http_errors_total / http_requests_total`

### **User Experience**
- Active Users
- Authentication Success Rate
- Monitor: `active_users`, `auth_attempts_total / auth_failures_total`

---

## 🚀 Quick Start

### **1. View Built-In Dashboard**
```bash
# Open in browser
https://moodmash.win/monitoring
```

### **2. Check Metrics Endpoint**
```bash
curl https://moodmash.win/metrics
```

### **3. Setup External Monitoring**
```bash
# Clone monitoring stack
git clone <monitoring-repo>
cd prometheus-stack

# Start services
docker-compose up -d

# Access Grafana
open http://localhost:3001
```

---

## 📝 Summary

✅ **Built-In Dashboard** - Real-time metrics visualization  
✅ **Prometheus Metrics** - `/metrics` endpoint for scraping  
✅ **Health Checks** - `/api/health/status` endpoint  
✅ **Performance Tracking** - Request/response metrics  
✅ **Error Monitoring** - Error rate tracking  
✅ **Alerting Ready** - Prometheus alert rules provided  
✅ **Grafana Compatible** - Dashboard templates included  

**Status**: Monitoring infrastructure is **PRODUCTION READY** and can be integrated with external Prometheus/Grafana instances.

---

**Last Updated**: November 26, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
