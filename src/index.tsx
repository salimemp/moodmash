/**
 * MoodMash - Main Application Entry Point
 * Clean, modular architecture with separate route files
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Bindings } from './types';
import { renderHTML } from './template';

// Import route modules
import authRoutes from './routes/auth/oauth';
import authApiRoutes from './routes/api/auth';
import moodRoutes from './routes/api/mood';
import statsRoutes from './routes/api/stats';
import activitiesRoutes from './routes/api/activities';

// Import middleware
import { securityHeaders } from './middleware/security-headers';
import { analyticsMiddleware } from './middleware/analytics';

// Create main app
const app = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Global Middleware
// ============================================================================

// Security headers (HSTS, CSP, etc.)
app.use('*', securityHeaders);

// Analytics tracking
app.use('*', analyticsMiddleware);

// CORS for API routes
app.use('/api/*', cors({
  origin: ['https://moodmash.win', 'https://*.moodmash.pages.dev'],
  credentials: true,
}));

// ============================================================================
// Static Files
// ============================================================================

app.use('/static/*', serveStatic({ root: './public' }));
app.use('/icons/*', serveStatic({ root: './public' }));
app.use('/*.png', serveStatic({ root: './public' }));
app.use('/*.svg', serveStatic({ root: './public' }));
app.use('/*.ico', serveStatic({ root: './public' }));
app.use('/*.xml', serveStatic({ root: './public' }));
app.use('/*.txt', serveStatic({ root: './public' }));
app.use('/*.json', serveStatic({ root: './public' }));
app.use('/sw-*.js', serveStatic({ root: './public' }));

// ============================================================================
// Route Registration
// ============================================================================

// OAuth routes (/auth/google, /auth/github)
app.route('/auth', authRoutes);

// API routes
app.route('/api/auth', authApiRoutes);
app.route('/api/moods', moodRoutes);
app.route('/api/stats', statsRoutes);
app.route('/api/activities', activitiesRoutes);

// ============================================================================
// Page Routes (Server-Side Rendered)
// ============================================================================

// Homepage / Dashboard
app.get('/', (c) => {
  return c.html(renderHTML(
    'Dashboard',
    '<div id="app"></div>',
    ''
  ));
});

// Login page
app.get('/login', (c) => {
  return c.html(renderHTML(
    'Login',
    '<div id="auth-container"></div>',
    'login'
  ));
});

// Register page
app.get('/register', (c) => {
  return c.html(renderHTML(
    'Sign Up',
    '<div id="auth-container"></div>',
    'register'
  ));
});

// About page
app.get('/about', (c) => {
  return c.html(renderHTML(
    'About',
    `
    <div class="max-w-4xl mx-auto p-6">
      <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-6">About MoodMash</h1>
      <div class="prose dark:prose-invert max-w-none">
        <p class="text-lg text-gray-700 dark:text-gray-300 mb-4">
          MoodMash is an AI-powered mental wellness platform designed to help you track,
          understand, and improve your emotional wellbeing.
        </p>
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mt-8 mb-4">Features</h2>
        <ul class="space-y-2 text-gray-700 dark:text-gray-300">
          <li>📊 Track your moods with detailed analytics</li>
          <li>🎯 Discover personalized wellness activities</li>
          <li>🤖 AI-powered insights and recommendations</li>
          <li>📸 Attach photos to your mood entries</li>
          <li>🌍 Available in 13 languages</li>
          <li>🔒 Privacy-first design with HIPAA compliance</li>
        </ul>
      </div>
    </div>
    `,
    'about'
  ));
});

// AI Chat page
app.get('/ai-chat', (c) => {
  return c.html(renderHTML(
    'AI Chat',
    '<div id="ai-chat-page"></div>',
    'ai-chat'
  ));
});

// Activities page
app.get('/activities', (c) => {
  return c.html(renderHTML(
    'Activities',
    '<div id="activities-page"></div>',
    'activities'
  ));
});

// Log Mood page
app.get('/log', (c) => {
  return c.html(renderHTML(
    'Log Mood',
    '<div id="log-mood-page"></div>',
    'log'
  ));
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/api/health/status', async (c) => {
  const { DB } = c.env;
  
  try {
    // Test database connection
    await DB.prepare('SELECT 1').first();
    
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        api: 'up',
      },
    });
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      error: 'Database connection failed',
    }, 503);
  }
});

// ============================================================================
// 404 Handler
// ============================================================================

app.notFound((c) => {
  return c.html(renderHTML(
    '404 - Not Found',
    `
    <div class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center">
        <h1 class="text-6xl font-bold text-gray-800 dark:text-white mb-4">404</h1>
        <p class="text-xl text-gray-600 dark:text-gray-400 mb-8">Page not found</p>
        <a href="/" class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Go Home
        </a>
      </div>
    </div>
    `,
    ''
  ));
});

// ============================================================================
// Error Handler
// ============================================================================

app.onError((err, c) => {
  console.error('Application error:', err);
  
  return c.json({
    error: 'Internal server error',
    message: err.message,
  }, 500);
});

// ============================================================================
// Export
// ============================================================================

export default app;
