/**
 * Monitoring API Routes
 * Handles metrics endpoints
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';

const monitoring = new Hono<{ Bindings: Bindings }>();

// Get metrics (Prometheus format)
monitoring.get('/metrics', async (c) => {
  try {
    const { metricsCollector } = await import('../../services/metrics');
    const metrics = metricsCollector.toPrometheusFormat();
    
    return c.text(metrics, 200, {
      'Content-Type': 'text/plain; charset=utf-8'
    });
  } catch {
    // Return empty metrics if service not available
    return c.text('# No metrics available\n', 200, {
      'Content-Type': 'text/plain; charset=utf-8'
    });
  }
});

export default monitoring;
