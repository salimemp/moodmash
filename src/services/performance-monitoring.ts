/**
 * Performance Monitoring Service
 * Version: 10.0 (Phase 3 - Production Optimizations)
 * 
 * Features:
 * - Response time tracking
 * - Error rate monitoring
 * - Cache hit/miss tracking
 * - Database query performance
 * - API endpoint metrics
 */

import type { Bindings } from '../types';

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  response_time_ms: number;
  status_code: number;
  timestamp: string;
  user_id?: number;
  error_message?: string;
  cache_hit?: boolean;
}

export interface PerformanceStats {
  average_response_time: number;
  max_response_time: number;
  min_response_time: number;
  total_requests: number;
  error_count: number;
  error_rate: number;
  cache_hit_rate: number;
}

/**
 * Track API endpoint performance
 */
export async function trackPerformance(
  env: Bindings,
  metric: PerformanceMetric
): Promise<void> {
  try {
    // Store in performance_metrics table
    await env.DB.prepare(`
      INSERT INTO performance_metrics (
        endpoint, method, response_time_ms, status_code,
        user_id, error_message, cache_hit, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        metric.endpoint,
        metric.method,
        metric.response_time_ms,
        metric.status_code,
        metric.user_id || null,
        metric.error_message || null,
        metric.cache_hit ? 1 : 0,
        metric.timestamp
      )
      .run();

    // If response time is slow (>1000ms) or error, create alert
    if (metric.response_time_ms > 1000 || metric.status_code >= 500) {
      await createPerformanceAlert(env, metric);
    }
  } catch (error) {
    console.error('Failed to track performance:', error);
  }
}

/**
 * Get performance statistics for an endpoint
 */
export async function getEndpointStats(
  env: Bindings,
  endpoint: string,
  timeframe: 'hour' | 'day' | 'week' = 'hour'
): Promise<PerformanceStats> {
  const timeframeMinutes = {
    hour: 60,
    day: 1440,
    week: 10080,
  };

  const minutes = timeframeMinutes[timeframe];
  const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();

  const result = await env.DB.prepare(`
    SELECT
      AVG(response_time_ms) as avg_time,
      MAX(response_time_ms) as max_time,
      MIN(response_time_ms) as min_time,
      COUNT(*) as total_requests,
      SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count,
      SUM(CASE WHEN cache_hit = 1 THEN 1 ELSE 0 END) as cache_hits
    FROM performance_metrics
    WHERE endpoint = ?
      AND timestamp > ?
  `)
    .bind(endpoint, since)
    .first();

  const total = result?.total_requests || 0;
  const errors = result?.error_count || 0;
  const cacheHits = result?.cache_hits || 0;

  return {
    average_response_time: result?.avg_time || 0,
    max_response_time: result?.max_time || 0,
    min_response_time: result?.min_time || 0,
    total_requests: total,
    error_count: errors,
    error_rate: total > 0 ? (errors / total) * 100 : 0,
    cache_hit_rate: total > 0 ? (cacheHits / total) * 100 : 0,
  };
}

/**
 * Get system-wide performance dashboard
 */
export async function getPerformanceDashboard(
  env: Bindings
): Promise<any> {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Overall stats
  const overallStats = await env.DB.prepare(`
    SELECT
      COUNT(*) as total_requests,
      AVG(response_time_ms) as avg_response_time,
      MAX(response_time_ms) as max_response_time,
      SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count,
      SUM(CASE WHEN cache_hit = 1 THEN 1 ELSE 0 END) as cache_hits
    FROM performance_metrics
    WHERE timestamp > ?
  `)
    .bind(last24h)
    .first();

  // Slowest endpoints
  const slowestEndpoints = await env.DB.prepare(`
    SELECT
      endpoint,
      AVG(response_time_ms) as avg_time,
      COUNT(*) as request_count
    FROM performance_metrics
    WHERE timestamp > ?
    GROUP BY endpoint
    ORDER BY avg_time DESC
    LIMIT 10
  `)
    .bind(last24h)
    .all();

  // Most used endpoints
  const mostUsedEndpoints = await env.DB.prepare(`
    SELECT
      endpoint,
      COUNT(*) as request_count,
      AVG(response_time_ms) as avg_time
    FROM performance_metrics
    WHERE timestamp > ?
    GROUP BY endpoint
    ORDER BY request_count DESC
    LIMIT 10
  `)
    .bind(last24h)
    .all();

  // Error rate by endpoint
  const errorsByEndpoint = await env.DB.prepare(`
    SELECT
      endpoint,
      COUNT(*) as error_count,
      error_message
    FROM performance_metrics
    WHERE timestamp > ?
      AND status_code >= 400
    GROUP BY endpoint, error_message
    ORDER BY error_count DESC
    LIMIT 10
  `)
    .bind(last24h)
    .all();

  const total = overallStats?.total_requests || 0;
  const errors = overallStats?.error_count || 0;
  const cacheHits = overallStats?.cache_hits || 0;

  return {
    overall: {
      total_requests: total,
      average_response_time: overallStats?.avg_response_time || 0,
      max_response_time: overallStats?.max_response_time || 0,
      error_count: errors,
      error_rate: total > 0 ? ((errors / total) * 100).toFixed(2) : '0.00',
      cache_hit_rate: total > 0 ? ((cacheHits / total) * 100).toFixed(2) : '0.00',
    },
    slowest_endpoints: slowestEndpoints.results || [],
    most_used_endpoints: mostUsedEndpoints.results || [],
    errors_by_endpoint: errorsByEndpoint.results || [],
    last_updated: new Date().toISOString(),
  };
}

/**
 * Create performance alert
 */
async function createPerformanceAlert(
  env: Bindings,
  metric: PerformanceMetric
): Promise<void> {
  try {
    const alertType =
      metric.status_code >= 500
        ? 'server_error'
        : metric.response_time_ms > 2000
        ? 'critical_slowness'
        : 'high_latency';

    const title =
      alertType === 'server_error'
        ? `Server Error on ${metric.endpoint}`
        : `Slow Response on ${metric.endpoint}`;

    await env.DB.prepare(`
      INSERT INTO performance_alerts (
        alert_type, title, severity, endpoint, response_time_ms,
        status_code, error_message, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        alertType,
        title,
        metric.status_code >= 500 ? 'critical' : 'warning',
        metric.endpoint,
        metric.response_time_ms,
        metric.status_code,
        metric.error_message || null,
        metric.timestamp
      )
      .run();
  } catch (error) {
    console.error('Failed to create performance alert:', error);
  }
}

/**
 * Clean old performance metrics (keep last 7 days)
 */
export async function cleanOldMetrics(env: Bindings): Promise<void> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.prepare(`
      DELETE FROM performance_metrics
      WHERE timestamp < ?
    `)
      .bind(sevenDaysAgo)
      .run();
  } catch (error) {
    console.error('Failed to clean old metrics:', error);
  }
}

/**
 * Get performance alerts
 */
export async function getPerformanceAlerts(
  env: Bindings,
  limit: number = 50
): Promise<any[]> {
  try {
    const result = await env.DB.prepare(`
      SELECT *
      FROM performance_alerts
      ORDER BY timestamp DESC
      LIMIT ?
    `)
      .bind(limit)
      .all();

    return result.results || [];
  } catch (error) {
    console.error('Failed to get performance alerts:', error);
    return [];
  }
}
