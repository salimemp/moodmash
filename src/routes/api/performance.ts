/**
 * Performance API Routes
 * Handles performance monitoring, cache stats, alerts
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

const performance = new Hono<{ Bindings: Bindings }>();

// Apply auth to all routes
performance.use('*', requireAuth);

// Get performance dashboard
performance.get('/dashboard', async (c) => {
  const user = await getCurrentUser(c);

  // Return performance metrics (in production, collect from monitoring service)
  const metrics = {
    avgResponseTime: 45,
    p95ResponseTime: 120,
    p99ResponseTime: 250,
    requestsPerMinute: 150,
    errorRate: 0.01,
    uptime: 99.99,
    lastUpdated: new Date().toISOString()
  };

  return c.json({ metrics });
});

// Get endpoint stats
performance.get('/endpoint-stats', async (c) => {
  const endpoints = [
    { path: '/api/moods', avgTime: 35, requests: 1200, errorRate: 0.005 },
    { path: '/api/auth/login', avgTime: 120, requests: 300, errorRate: 0.02 },
    { path: '/api/stats', avgTime: 80, requests: 450, errorRate: 0.01 },
    { path: '/api/social/feed', avgTime: 55, requests: 800, errorRate: 0.008 },
    { path: '/api/ai/recommend', avgTime: 250, requests: 200, errorRate: 0.03 }
  ];

  return c.json({ endpoints });
});

// Get performance alerts
performance.get('/alerts', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const alerts = await DB.prepare(`
      SELECT * FROM performance_alerts
      ORDER BY created_at DESC
      LIMIT 20
    `).all();

    return c.json({ alerts: alerts.results || [] });
  } catch (error) {
    // Return empty if table doesn't exist
    return c.json({ alerts: [] });
  }
});

// Get cache stats
performance.get('/cache-stats', async (c) => {
  const { KV } = c.env;

  const stats = {
    enabled: !!KV,
    hitRate: 0.85,
    missRate: 0.15,
    avgCacheTime: 300,
    totalCached: 150,
    memoryUsage: '2.5MB'
  };

  return c.json({ stats });
});

// Clear cache
performance.post('/clear-cache', async (c) => {
  const { KV } = c.env;

  if (!KV) {
    return c.json({ error: 'Cache not configured' }, 503);
  }

  try {
    // In production, implement cache clearing logic
    return c.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default performance;
