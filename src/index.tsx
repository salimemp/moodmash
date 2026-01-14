/**
 * MoodMash - Main Application Entry Point (Modular Version)
 * Clean, modular architecture with organized route imports for code splitting
 * 
 * Route Organization:
 * - 28 domain-specific route modules in src/routes/
 * - Proper separation of concerns
 * - TypeScript strict mode compliant
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Bindings, Variables } from './types';

// ============================================================================
// Import All Route Modules (Synchronous for Cloudflare Workers)
// ============================================================================

// Auth routes
import authApiRoutes from './routes/api/auth';
import oauthFlowRoutes from './routes/auth/oauth';

// Core API routes
import moodRoutes from './routes/api/mood';
import statsRoutes from './routes/api/stats';
import activitiesRoutes from './routes/api/activities';
import insightsRoutes from './routes/api/insights';

// Social routes
import socialRoutes from './routes/api/social';
import groupsRoutes from './routes/api/groups';

// AI routes
import aiRoutes from './routes/api/ai';
import chatRoutes from './routes/api/chat';

// Health & Compliance routes
import healthRoutes from './routes/api/health';
import hipaaRoutes from './routes/api/hipaa';
import securityRoutes from './routes/api/security';
import ccpaRoutes from './routes/api/ccpa';
import researchRoutes from './routes/api/research';

// User & Subscription routes
import userRoutes from './routes/api/user';
import subscriptionRoutes from './routes/api/subscription';
import tokensRoutes from './routes/api/tokens';

// Media & Files routes
import filesRoutes from './routes/api/files';
import mediaRoutes from './routes/api/media';

// Feature routes
import gamificationRoutes from './routes/api/gamification';
import voiceJournalRoutes from './routes/api/voice-journal';
import arRoutes from './routes/api/ar';
import biometricsApiRoutes from './routes/api/biometrics-routes';

// Support & Contact routes
import supportRoutes from './routes/api/support';
import contactRoutes from './routes/api/contact';

// Admin & Monitoring routes
import adminRoutes from './routes/api/admin';
import analyticsRoutes from './routes/api/analytics';
import performanceRoutes from './routes/api/performance';
import monitoringRoutes from './routes/api/monitoring';
import featureFlagsRoutes from './routes/api/feature-flags';
import oauthConfigRoutes from './routes/api/oauth-config';

// Utility routes
import captchaRoutes from './routes/api/captcha';
import secretsRoutes from './routes/api/secrets';

// Page routes
import pageRoutes from './routes/pages';

// Advanced features & Biometric auth
import advancedFeaturesRoutes from './routes/advanced-features';
import totpRoutes from './routes/totp';
import biometricsAuthRoutes from './routes/biometrics';

// ============================================================================
// Import Middleware
// ============================================================================

import { productionSecurityHeaders } from './middleware/security-headers';
import { sentryMiddleware, captureError } from './services/sentry';
import { securityMiddleware } from './middleware/security';
import { rateLimiter as apiRateLimiterMiddleware } from './middleware/rate-limiter';
import { cacheMiddleware } from './middleware/cache';
import { createMonitoring, monitoringMiddleware, type MonitoringEnv, type GrafanaMonitoring } from './lib/monitoring';

// ============================================================================
// Create Application
// ============================================================================

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ============================================================================
// Global Middleware
// ============================================================================

// Initialize Grafana Monitoring
app.use('*', async (c, next) => {
  try {
    const monitoring = createMonitoring(c.env as unknown as MonitoringEnv, 'moodmash', 'production');
    c.set('monitoring', monitoring);
  } catch {
    // Continue without monitoring if it fails
  }
  await next();
});

// Grafana Request Tracking
app.use('*', async (c, next) => {
  const monitoring = c.get('monitoring');
  if (monitoring) {
    await monitoringMiddleware(monitoring)(c, next);
  } else {
    await next();
  }
});

// Sentry Error Tracking
app.use('*', sentryMiddleware);

// Security Middleware
app.use('*', securityMiddleware);

// Security Headers (HSTS, CSP, etc.)
app.use('*', productionSecurityHeaders());

// CORS for API routes
app.use('/api/*', cors({
  origin: ['https://moodmash.win', 'https://*.moodmash.pages.dev', 'http://localhost:3000'],
  credentials: true,
}));

// Rate Limiting for API
app.use('/api/*', apiRateLimiterMiddleware);

// API Response Caching
app.use('/api/*', cacheMiddleware);

// ============================================================================
// Route Registration
// ============================================================================

// OAuth flows (legacy paths)
app.route('/auth', oauthFlowRoutes);

// API Auth routes
app.route('/api/auth', authApiRoutes);

// Core API routes
app.route('/api/moods', moodRoutes);
app.route('/api/stats', statsRoutes);
app.route('/api/activities', activitiesRoutes);
app.route('/api/insights', insightsRoutes);
app.route('/api/quick-select', insightsRoutes);  // Quick select shares insights routes
app.route('/api/wellness-tips', insightsRoutes); // Wellness tips in insights
app.route('/api/color-psychology', insightsRoutes); // Color psychology in insights

// Social routes
app.route('/api/social', socialRoutes);
app.route('/api/groups', groupsRoutes);

// AI routes
app.route('/api/ai', aiRoutes);
app.route('/api/chat', chatRoutes);

// Health & Compliance routes
app.route('/api/health', healthRoutes);
app.route('/api/hipaa', hipaaRoutes);
app.route('/api/security', securityRoutes);
app.route('/api/ccpa', ccpaRoutes);
app.route('/api/research', researchRoutes);

// User & Subscription routes
app.route('/api/user', userRoutes);
app.route('/api/subscription', subscriptionRoutes);
app.route('/api/tokens', tokensRoutes);
app.route('/api/consent', userRoutes); // Consent routes in user module

// Media & Files routes
app.route('/api/files', filesRoutes);
app.route('/api/media', mediaRoutes);

// Gamification routes
app.route('/api/gamification', gamificationRoutes);
app.route('/api/challenges', gamificationRoutes);
app.route('/api/achievements', gamificationRoutes);

// Voice & AR routes
app.route('/api/voice-journal', voiceJournalRoutes);
app.route('/api/ar-cards', arRoutes);
app.route('/api/avatar', arRoutes);

// Biometrics API routes
app.route('/api/biometrics', biometricsApiRoutes);

// Support & Contact routes
app.route('/api/support', supportRoutes);
app.route('/api/contact', contactRoutes);

// Admin & Monitoring routes
app.route('/api/admin', adminRoutes);
app.route('/api/analytics', analyticsRoutes);
app.route('/api/performance', performanceRoutes);
app.route('/api/monitoring', monitoringRoutes);
app.route('/api/oauth/config', oauthConfigRoutes);

// Feature flags routes
app.route('/api/feature-flags', featureFlagsRoutes);

// Utility routes
app.route('/api/captcha', captchaRoutes);
app.route('/api/secrets', secretsRoutes);

// Advanced features (TOTP, WebAuthn, etc.)
app.route('/api/totp', totpRoutes);
app.route('/api/webauthn', biometricsAuthRoutes);

// Page routes (HTML pages)
app.route('/', pageRoutes);

// Advanced features pages
app.route('/', advancedFeaturesRoutes);

// ============================================================================
// Special Routes
// ============================================================================

// Metrics endpoint (Prometheus format)
app.get('/metrics', async (c) => {
  try {
    const { metricsCollector } = await import('./services/metrics');
    return c.text(metricsCollector.toPrometheusFormat(), 200, {
      'Content-Type': 'text/plain; charset=utf-8'
    });
  } catch {
    return c.text('# No metrics available\n', 200, {
      'Content-Type': 'text/plain; charset=utf-8'
    });
  }
});

// PWA Manifest
app.get('/manifest.json', (c) => {
  return c.json({
    name: 'MoodMash',
    short_name: 'MoodMash',
    description: 'AI-powered mental wellness platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#4f46e5',
    icons: [
      { src: '/static/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/static/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  });
});

// Service Worker
app.get('/sw.js', (c) => {
  return c.text(`
    self.addEventListener('install', (e) => {
      e.waitUntil(caches.open('moodmash-v1').then(cache => 
        cache.addAll(['/static/styles.css', '/static/utils.js'])
      ));
    });
    self.addEventListener('fetch', (e) => {
      e.respondWith(
        caches.match(e.request).then(r => r || fetch(e.request))
      );
    });
  `, 200, { 'Content-Type': 'application/javascript' });
});

// ============================================================================
// 404 Handler
// ============================================================================

app.notFound((c) => {
  // Return JSON for API routes
  if (c.req.path.startsWith('/api/')) {
    return c.json({ error: 'Not found' }, 404);
  }
  
  // Return HTML for page routes
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 - Not Found | MoodMash</title>
      <link href="/static/tailwind-complete.css" rel="stylesheet">
    </head>
    <body class="min-h-screen bg-gray-100 flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <p class="text-xl text-gray-600 mb-8">Page not found</p>
        <a href="/" class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Go Home
        </a>
      </div>
    </body>
    </html>
  `, 404);
});

// ============================================================================
// Error Handler
// ============================================================================

app.onError((err, c) => {
  // Log to Sentry
  captureError(err, {
    request: c.req.raw,
    path: c.req.path,
    method: c.req.method,
  });
  
  // Log error in development
  if (c.env?.ENVIRONMENT === 'development') {
    console.error('Application error:', err);
  }
  
  // Return JSON for API routes
  if (c.req.path.startsWith('/api/')) {
    return c.json({
      error: 'Internal server error',
      message: c.env?.ENVIRONMENT === 'development' ? err.message : 'An error occurred'
    }, 500);
  }
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error | MoodMash</title>
      <link href="/static/tailwind-complete.css" rel="stylesheet">
    </head>
    <body class="min-h-screen bg-gray-100 flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-red-600 mb-4">Something went wrong</h1>
        <p class="text-gray-600 mb-8">Please try again later</p>
        <a href="/" class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Go Home
        </a>
      </div>
    </body>
    </html>
  `, 500);
});

// ============================================================================
// Export
// ============================================================================

export default app;
