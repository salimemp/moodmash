// MoodMash - Minimal Mood Tracking App
// Entry point for Cloudflare Workers

import { Hono } from 'hono';
import type { Env, Variables } from './types';

// Import routes
import auth from './routes/auth';
import moods from './routes/moods';
import dashboard from './routes/dashboard';

// Phase 2 routes
import voiceJournals from './routes/api/voice-journals';
import insights from './routes/api/insights';
import exportRoutes from './routes/api/export';
import oauth from './routes/api/oauth';
import passwordRoutes from './routes/api/password';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Static files are served by Cloudflare Pages automatically from /public

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Mount Phase 1 routes
app.route('/', auth);
app.route('/', moods);
app.route('/', dashboard);

// Mount Phase 2 routes
app.route('/', voiceJournals);
app.route('/', insights);
app.route('/', exportRoutes);
app.route('/', oauth);
app.route('/', passwordRoutes);

// Home page - redirect to dashboard or login
app.get('/', async (c) => {
  const { getCurrentUser } = await import('./middleware/auth');
  const user = await getCurrentUser(c);
  
  if (user) {
    return c.redirect('/dashboard');
  }
  return c.redirect('/login');
});

// Reset password page
app.get('/reset-password', (c) => {
  const token = c.req.query('token');
  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen flex items-center justify-center p-4">
  <div class="w-full max-w-md bg-gray-800 rounded-xl p-8 shadow-xl">
    <h1 class="text-2xl font-bold text-center mb-6">Reset Password</h1>
    <form id="reset-form" class="space-y-4">
      <input type="hidden" id="token" value="${token || ''}">
      <div>
        <label class="block text-sm text-gray-400 mb-1">New Password</label>
        <input type="password" id="password" required minlength="8"
               class="w-full px-4 py-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
      </div>
      <div>
        <label class="block text-sm text-gray-400 mb-1">Confirm Password</label>
        <input type="password" id="confirm" required
               class="w-full px-4 py-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
      </div>
      <div id="error" class="text-red-400 text-sm hidden"></div>
      <div id="success" class="text-green-400 text-sm hidden"></div>
      <button type="submit" class="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
        Reset Password
      </button>
    </form>
    <p class="text-center text-gray-400 mt-4">
      <a href="/login" class="text-blue-400 hover:underline">Back to Login</a>
    </p>
  </div>
  <script>
    document.getElementById('reset-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = document.getElementById('token').value;
      const password = document.getElementById('password').value;
      const confirm = document.getElementById('confirm').value;
      const errorEl = document.getElementById('error');
      const successEl = document.getElementById('success');
      
      errorEl.classList.add('hidden');
      successEl.classList.add('hidden');
      
      if (password !== confirm) {
        errorEl.textContent = 'Passwords do not match';
        errorEl.classList.remove('hidden');
        return;
      }
      
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password })
        });
        const data = await res.json();
        
        if (data.success) {
          successEl.textContent = data.message;
          successEl.classList.remove('hidden');
          setTimeout(() => window.location.href = '/login', 2000);
        } else {
          errorEl.textContent = data.error || 'Reset failed';
          errorEl.classList.remove('hidden');
        }
      } catch (err) {
        errorEl.textContent = 'An error occurred';
        errorEl.classList.remove('hidden');
      }
    });
  </script>
</body>
</html>
`);
});

// Forgot password page
app.get('/forgot-password', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Forgot Password - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen flex items-center justify-center p-4">
  <div class="w-full max-w-md bg-gray-800 rounded-xl p-8 shadow-xl">
    <h1 class="text-2xl font-bold text-center mb-6">Forgot Password</h1>
    <p class="text-gray-400 text-center mb-6">Enter your email to receive a password reset link.</p>
    <form id="forgot-form" class="space-y-4">
      <div>
        <label class="block text-sm text-gray-400 mb-1">Email</label>
        <input type="email" id="email" required
               class="w-full px-4 py-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
      </div>
      <div id="message" class="text-green-400 text-sm hidden"></div>
      <button type="submit" class="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
        Send Reset Link
      </button>
    </form>
    <p class="text-center text-gray-400 mt-4">
      <a href="/login" class="text-blue-400 hover:underline">Back to Login</a>
    </p>
  </div>
  <script>
    document.getElementById('forgot-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const msgEl = document.getElementById('message');
      
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        msgEl.textContent = data.message || 'Check your email for the reset link.';
        msgEl.classList.remove('hidden');
      } catch (err) {
        msgEl.textContent = 'An error occurred. Please try again.';
        msgEl.classList.remove('hidden');
      }
    });
  </script>
</body>
</html>
`);
});

// Voice journal page
app.get('/voice-journal', async (c) => {
  const { getCurrentUser } = await import('./middleware/auth');
  const user = await getCurrentUser(c);
  
  if (!user) {
    return c.redirect('/login');
  }
  
  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Voice Journal - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <nav class="bg-gray-800 p-4 shadow-lg">
    <div class="max-w-4xl mx-auto flex justify-between items-center">
      <a href="/dashboard" class="text-xl font-bold text-blue-400">MoodMash</a>
      <div class="flex gap-4">
        <a href="/dashboard" class="hover:text-blue-400">Dashboard</a>
        <a href="/insights" class="hover:text-blue-400">Insights</a>
        <a href="/voice-journal" class="text-blue-400">Voice</a>
      </div>
    </div>
  </nav>
  
  <main class="max-w-4xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Voice Journal</h1>
    
    <div class="bg-gray-800 rounded-xl p-6 mb-6">
      <div id="recorder" class="text-center">
        <button id="record-btn" class="w-24 h-24 rounded-full bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center mx-auto mb-4">
          <svg class="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </button>
        <p id="status" class="text-gray-400">Click to start recording</p>
        <p id="timer" class="text-2xl font-mono mt-2 hidden">00:00</p>
      </div>
      
      <div id="transcript-area" class="mt-4 hidden">
        <label class="block text-sm text-gray-400 mb-1">Transcript</label>
        <textarea id="transcript" rows="4" class="w-full px-4 py-3 bg-gray-700 rounded-lg outline-none resize-none"></textarea>
      </div>
      
      <div id="title-area" class="mt-4 hidden">
        <label class="block text-sm text-gray-400 mb-1">Title (optional)</label>
        <input type="text" id="title" class="w-full px-4 py-3 bg-gray-700 rounded-lg outline-none">
      </div>
      
      <button id="save-btn" class="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium hidden">
        Save Journal Entry
      </button>
    </div>
    
    <h2 class="text-xl font-bold mb-4">Recent Entries</h2>
    <div id="entries" class="space-y-4">
      <p class="text-gray-400">Loading...</p>
    </div>
  </main>
  
  <script src="/static/voice-journal.js"></script>
</body>
</html>
`);
});

// Insights page
app.get('/insights', async (c) => {
  const { getCurrentUser } = await import('./middleware/auth');
  const user = await getCurrentUser(c);
  
  if (!user) {
    return c.redirect('/login');
  }
  
  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Insights - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <nav class="bg-gray-800 p-4 shadow-lg">
    <div class="max-w-4xl mx-auto flex justify-between items-center">
      <a href="/dashboard" class="text-xl font-bold text-blue-400">MoodMash</a>
      <div class="flex gap-4">
        <a href="/dashboard" class="hover:text-blue-400">Dashboard</a>
        <a href="/insights" class="text-blue-400">Insights</a>
        <a href="/voice-journal" class="hover:text-blue-400">Voice</a>
      </div>
    </div>
  </nav>
  
  <main class="max-w-4xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Mood Insights</h1>
    
    <div class="flex gap-2 mb-6">
      <button class="period-btn px-4 py-2 rounded-lg bg-blue-600" data-period="7d">7 Days</button>
      <button class="period-btn px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600" data-period="30d">30 Days</button>
      <button class="period-btn px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600" data-period="90d">90 Days</button>
    </div>
    
    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <div class="bg-gray-800 rounded-xl p-6">
        <h2 class="text-lg font-semibold mb-4">Mood Trend</h2>
        <canvas id="trend-chart"></canvas>
      </div>
      <div class="bg-gray-800 rounded-xl p-6">
        <h2 class="text-lg font-semibold mb-4">Emotion Distribution</h2>
        <canvas id="emotion-chart"></canvas>
      </div>
    </div>
    
    <div class="bg-gray-800 rounded-xl p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">AI Insights</h2>
      <div id="ai-insights" class="space-y-4">
        <p class="text-gray-400">Loading insights...</p>
      </div>
    </div>
    
    <div class="bg-gray-800 rounded-xl p-6">
      <h2 class="text-lg font-semibold mb-4">Export Your Data</h2>
      <div class="flex flex-wrap gap-2">
        <a href="/api/export/json" class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg">Export JSON</a>
        <a href="/api/export/csv?type=moods" class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg">Export CSV</a>
        <a href="/api/export/full" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg">Full GDPR Export</a>
      </div>
    </div>
  </main>
  
  <script src="/static/insights.js"></script>
</body>
</html>
`);
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
