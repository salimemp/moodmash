/**
 * Grafana Cloud Monitoring Integration for MoodMash
 * 
 * This module provides:
 * - Prometheus metrics collection and export
 * - Loki log aggregation and shipping
 * - Performance monitoring
 * - Error tracking
 */

// Types for Cloudflare environment bindings
export interface MonitoringEnv {
  GRAFANA_PROMETHEUS_URL?: string;
  GRAFANA_PROMETHEUS_USER?: string;
  GRAFANA_PROMETHEUS_TOKEN?: string;
  GRAFANA_LOKI_URL?: string;
  GRAFANA_LOKI_USER?: string;
  GRAFANA_LOKI_TOKEN?: string;
  GRAFANA_STACK_URL?: string;
}

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// Metric types
export interface Metric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}

// Log entry
export interface LogEntry {
  level: LogLevel;
  message: string;
  labels?: Record<string, string>;
  metadata?: Record<string, any>;
  timestamp?: number;
}

/**
 * Grafana Monitoring Client
 */
export class GrafanaMonitoring {
  private env: MonitoringEnv;
  private appName: string = 'moodmash';
  private environment: string = 'production';

  constructor(env: MonitoringEnv, appName?: string, environment?: string) {
    this.env = env;
    if (appName) this.appName = appName;
    if (environment) this.environment = environment;
  }

  /**
   * Check if monitoring is enabled (all required credentials present)
   */
  isEnabled(): boolean {
    return !!(
      this.env.GRAFANA_PROMETHEUS_URL &&
      this.env.GRAFANA_PROMETHEUS_USER &&
      this.env.GRAFANA_PROMETHEUS_TOKEN &&
      this.env.GRAFANA_LOKI_URL &&
      this.env.GRAFANA_LOKI_USER &&
      this.env.GRAFANA_LOKI_TOKEN
    );
  }

  /**
   * Send metrics to Prometheus
   */
  async sendMetrics(metrics: Metric[]): Promise<void> {
    if (!this.isEnabled()) {
      console.warn('Grafana monitoring not enabled, skipping metrics');
      return;
    }

    try {
      const prometheusData = this.formatPrometheusMetrics(metrics);
      
      const response = await fetch(this.env.GRAFANA_PROMETHEUS_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Authorization': `Bearer ${this.env.GRAFANA_PROMETHEUS_USER}:${this.env.GRAFANA_PROMETHEUS_TOKEN}`,
        },
        body: prometheusData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Prometheus push failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Failed to send metrics to Grafana:', error);
      // Don't throw - monitoring failures shouldn't break the application
    }
  }

  /**
   * Send logs to Loki
   */
  async sendLogs(logs: LogEntry[]): Promise<void> {
    if (!this.isEnabled()) {
      console.warn('Grafana monitoring not enabled, skipping logs');
      return;
    }

    try {
      const lokiData = this.formatLokiLogs(logs);
      
      const response = await fetch(this.env.GRAFANA_LOKI_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.env.GRAFANA_LOKI_USER}:${this.env.GRAFANA_LOKI_TOKEN}`,
        },
        body: JSON.stringify(lokiData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Loki push failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Failed to send logs to Grafana:', error);
      // Don't throw - monitoring failures shouldn't break the application
    }
  }

  /**
   * Log a single message (convenience method)
   */
  async log(level: LogLevel, message: string, metadata?: Record<string, any>): Promise<void> {
    await this.sendLogs([{
      level,
      message,
      metadata,
      labels: {
        app: this.appName,
        environment: this.environment,
      },
      timestamp: Date.now(),
    }]);
  }

  /**
   * Track a metric (convenience method)
   */
  async trackMetric(name: string, value: number, labels?: Record<string, string>): Promise<void> {
    await this.sendMetrics([{
      name,
      value,
      labels: {
        app: this.appName,
        environment: this.environment,
        ...labels,
      },
      timestamp: Date.now(),
    }]);
  }

  /**
   * Track HTTP request metrics
   */
  async trackRequest(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    userId?: string
  ): Promise<void> {
    const labels: Record<string, string> = {
      method,
      path,
      status_code: statusCode.toString(),
      app: this.appName,
      environment: this.environment,
    };

    if (userId) {
      labels.user_id = userId;
    }

    // Send both metrics and logs
    await Promise.all([
      this.sendMetrics([
        {
          name: 'http_requests_total',
          value: 1,
          labels,
        },
        {
          name: 'http_request_duration_ms',
          value: durationMs,
          labels,
        },
      ]),
      this.sendLogs([{
        level: statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO,
        message: `${method} ${path} ${statusCode} ${durationMs}ms`,
        labels,
        metadata: {
          method,
          path,
          statusCode,
          durationMs,
          userId,
        },
      }]),
    ]);
  }

  /**
   * Track errors
   */
  async trackError(error: Error, context?: Record<string, any>): Promise<void> {
    await this.sendLogs([{
      level: LogLevel.ERROR,
      message: error.message,
      labels: {
        app: this.appName,
        environment: this.environment,
        error_type: error.name,
      },
      metadata: {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        ...context,
      },
    }]);

    // Also increment error counter
    await this.sendMetrics([{
      name: 'errors_total',
      value: 1,
      labels: {
        app: this.appName,
        environment: this.environment,
        error_type: error.name,
      },
    }]);
  }

  /**
   * Format metrics for Prometheus remote write
   */
  private formatPrometheusMetrics(metrics: Metric[]): string {
    const now = Date.now();
    return metrics
      .map(metric => {
        const labels = metric.labels || {};
        const labelStr = Object.entries(labels)
          .map(([key, value]) => `${key}="${value}"`)
          .join(',');
        
        const timestamp = metric.timestamp || now;
        return `${metric.name}{${labelStr}} ${metric.value} ${timestamp}`;
      })
      .join('\n');
  }

  /**
   * Format logs for Loki
   */
  private formatLokiLogs(logs: LogEntry[]): any {
    const streams: Record<string, any[]> = {};

    for (const log of logs) {
      const labels = {
        app: this.appName,
        environment: this.environment,
        level: log.level,
        ...log.labels,
      };

      const labelKey = JSON.stringify(labels);
      
      if (!streams[labelKey]) {
        streams[labelKey] = [];
      }

      const timestamp = log.timestamp || Date.now();
      const logLine = JSON.stringify({
        message: log.message,
        ...log.metadata,
      });

      streams[labelKey].push([
        `${timestamp}000000`, // Loki expects nanosecond timestamps
        logLine,
      ]);
    }

    return {
      streams: Object.entries(streams).map(([labelKey, values]) => ({
        stream: JSON.parse(labelKey),
        values,
      })),
    };
  }
}

/**
 * Create monitoring instance from environment
 */
export function createMonitoring(env: MonitoringEnv, appName?: string, environment?: string): GrafanaMonitoring {
  return new GrafanaMonitoring(env, appName, environment);
}

/**
 * Middleware to track HTTP requests
 */
export function monitoringMiddleware(monitoring: GrafanaMonitoring) {
  return async (c: any, next: any) => {
    const startTime = Date.now();
    
    try {
      await next();
    } finally {
      const durationMs = Date.now() - startTime;
      const method = c.req.method;
      const path = c.req.path;
      const statusCode = c.res?.status || 500;
      
      // Extract user ID from session if available
      let userId: string | undefined;
      try {
        const session = c.get('session');
        userId = session?.userId;
      } catch {
        // No session available
      }

      // Track request asynchronously (don't block response)
      c.executionCtx?.waitUntil(
        monitoring.trackRequest(method, path, statusCode, durationMs, userId)
      );
    }
  };
}
