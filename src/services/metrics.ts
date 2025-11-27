// Metrics Service for MoodMash
// Prometheus-compatible metrics collection

export interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}

export interface MetricsSnapshot {
  requests_total: number;
  requests_by_endpoint: Record<string, number>;
  errors_total: number;
  errors_by_type: Record<string, number>;
  response_time_avg: number;
  response_time_p95: number;
  response_time_p99: number;
  active_users: number;
  database_queries: number;
  timestamp: number;
}

/**
 * In-memory metrics storage
 * Note: Resets on worker restart (stateless architecture)
 */
class MetricsCollector {
  private metrics: Map<string, Metric> = new Map();
  private responseTimes: number[] = [];
  private maxResponseTimes = 1000; // Keep last 1000 response times
  private responseTimeIndex = 0; // Memory leak fix: Circular buffer index
  
  constructor() {
    this.initializeMetrics();
  }
  
  private initializeMetrics() {
    // Initialize counter metrics
    this.set('http_requests_total', 'counter', 0);
    this.set('http_errors_total', 'counter', 0);
    this.set('database_queries_total', 'counter', 0);
    this.set('auth_attempts_total', 'counter', 0);
    this.set('auth_failures_total', 'counter', 0);
    
    // Initialize gauge metrics
    this.set('active_users', 'gauge', 0);
    this.set('response_time_ms', 'gauge', 0);
  }
  
  set(name: string, type: Metric['type'], value: number, labels?: Record<string, string>) {
    this.metrics.set(name, {
      name,
      type,
      value,
      labels,
      timestamp: Date.now()
    });
  }
  
  increment(name: string, amount: number = 1, labels?: Record<string, string>) {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.value += amount;
      metric.timestamp = Date.now();
      // Memory leak fix: Limit label count to prevent unbounded growth
      if (labels) {
        const currentLabelCount = Object.keys(metric.labels || {}).length;
        if (currentLabelCount < 50) { // Max 50 labels per metric
          metric.labels = { ...metric.labels, ...labels };
        }
      }
    } else {
      this.set(name, 'counter', amount, labels);
    }
  }
  
  recordResponseTime(ms: number) {
    // Memory leak fix: Use circular buffer instead of shift() - O(1) instead of O(n)
    if (this.responseTimes.length < this.maxResponseTimes) {
      this.responseTimes.push(ms);
    } else {
      // Overwrite oldest entry in circular buffer
      this.responseTimes[this.responseTimeIndex] = ms;
      this.responseTimeIndex = (this.responseTimeIndex + 1) % this.maxResponseTimes;
    }
    
    // Update average
    const avg = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
    this.set('response_time_ms', 'gauge', Math.round(avg));
  }
  
  getPercentile(percentile: number): number {
    if (this.responseTimes.length === 0) return 0;
    
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }
  
  getSnapshot(): MetricsSnapshot {
    const requests = this.metrics.get('http_requests_total')?.value || 0;
    const errors = this.metrics.get('http_errors_total')?.value || 0;
    const activeUsers = this.metrics.get('active_users')?.value || 0;
    const dbQueries = this.metrics.get('database_queries_total')?.value || 0;
    const avgResponseTime = this.metrics.get('response_time_ms')?.value || 0;
    
    return {
      requests_total: requests,
      requests_by_endpoint: {},
      errors_total: errors,
      errors_by_type: {},
      response_time_avg: avgResponseTime,
      response_time_p95: this.getPercentile(95),
      response_time_p99: this.getPercentile(99),
      active_users: activeUsers,
      database_queries: dbQueries,
      timestamp: Date.now()
    };
  }
  
  /**
   * Export metrics in Prometheus format
   */
  toPrometheusFormat(): string {
    let output = '';
    
    for (const [name, metric] of this.metrics) {
      // Add metric type
      output += `# TYPE ${name} ${metric.type}\n`;
      
      // Add metric value with labels
      if (metric.labels && Object.keys(metric.labels).length > 0) {
        const labels = Object.entries(metric.labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');
        output += `${name}{${labels}} ${metric.value}\n`;
      } else {
        output += `${name} ${metric.value}\n`;
      }
    }
    
    // Add percentile metrics
    output += `# TYPE http_response_time_p95 gauge\n`;
    output += `http_response_time_p95 ${this.getPercentile(95)}\n`;
    output += `# TYPE http_response_time_p99 gauge\n`;
    output += `http_response_time_p99 ${this.getPercentile(99)}\n`;
    
    return output;
  }
  
  reset() {
    this.metrics.clear();
    this.responseTimes = [];
    this.initializeMetrics();
  }
}

// Export singleton instance
export const metricsCollector = new MetricsCollector();

/**
 * Middleware to track HTTP metrics
 */
export function metricsMiddleware() {
  return async (c: any, next: any) => {
    const start = Date.now();
    const path = new URL(c.req.url).pathname;
    
    // Increment request counter
    metricsCollector.increment('http_requests_total', 1, {
      method: c.req.method,
      path: path
    });
    
    try {
      await next();
      
      // Record response time
      const duration = Date.now() - start;
      metricsCollector.recordResponseTime(duration);
      
    } catch (error) {
      // Increment error counter
      metricsCollector.increment('http_errors_total', 1, {
        path: path,
        error: error instanceof Error ? error.message : 'Unknown'
      });
      throw error;
    }
  };
}
