// MoodMash - Minimal Mood Tracking App
// Entry point for Cloudflare Workers

import { Hono } from 'hono';
import type { Env, Variables } from './types';

// Import routes
import auth from './routes/auth';
import moods from './routes/moods';
import dashboard from './routes/dashboard';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Static files are served by Cloudflare Pages automatically from /public

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Mount routes
app.route('/', auth);
app.route('/', moods);
app.route('/', dashboard);

// Home page - redirect to dashboard or login
app.get('/', async (c) => {
  const { getCurrentUser } = await import('./middleware/auth');
  const user = await getCurrentUser(c);
  
  if (user) {
    return c.redirect('/dashboard');
  }
  return c.redirect('/login');
});

// 404 handler
app.notFound((c) => {
  const accept = c.req.header('Accept') || '';
  if (accept.includes('application/json')) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen flex items-center justify-center">
  <div class="text-center">
    <h1 class="text-6xl font-bold mb-4">404</h1>
    <p class="text-gray-400 mb-6">Page not found</p>
    <a href="/" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Go Home</a>
  </div>
</body>
</html>
`, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  const accept = c.req.header('Accept') || '';
  if (accept.includes('application/json')) {
    return c.json({ error: 'Internal server error' }, 500);
  }
  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen flex items-center justify-center">
  <div class="text-center">
    <h1 class="text-6xl font-bold mb-4">500</h1>
    <p class="text-gray-400 mb-6">Something went wrong</p>
    <a href="/" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Go Home</a>
  </div>
</body>
</html>
`, 500);
});

export default app;
