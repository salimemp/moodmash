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

// Phase 3 routes
import friendRoutes from './routes/api/friends';
import groupRoutes from './routes/api/groups';
import socialRoutes from './routes/api/social';

// Phase 4 routes
import gamificationRoutes from './routes/api/gamification';

// Phase 5 routes
import securityRoutes from './routes/api/security';
import healthRoutes from './routes/api/health';

// Phase 6 routes
import subscriptionRoutes from './routes/api/subscription';
import chatbotRoutes from './routes/api/chatbot';
import voiceRoutes from './routes/api/voice';
import localizationRoutes from './routes/api/localization';
import legalRoutes from './routes/api/legal';
import analyticsRoutes from './routes/api/analytics';

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

// Mount Phase 3 routes
app.route('/', friendRoutes);
app.route('/', groupRoutes);
app.route('/', socialRoutes);

// Mount Phase 4 routes
app.route('/', gamificationRoutes);

// Mount Phase 5 routes
app.route('/api/security', securityRoutes);
app.route('/api', healthRoutes);

// Mount Phase 6 routes
app.route('/api/subscription', subscriptionRoutes);
app.route('/api/chatbot', chatbotRoutes);
app.route('/api/voice', voiceRoutes);
app.route('/api/translations', localizationRoutes);
app.route('/api/legal', legalRoutes);
app.route('/api/analytics', analyticsRoutes);

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

// Friends page
app.get('/friends', async (c) => {
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
  <title>Friends - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <nav class="bg-gray-800 p-4 shadow-lg">
    <div class="max-w-4xl mx-auto flex justify-between items-center">
      <a href="/dashboard" class="text-xl font-bold text-blue-400">MoodMash</a>
      <div class="flex gap-4">
        <a href="/dashboard" class="hover:text-blue-400">Dashboard</a>
        <a href="/feed" class="hover:text-blue-400">Feed</a>
        <a href="/friends" class="text-blue-400">Friends</a>
        <a href="/groups" class="hover:text-blue-400">Groups</a>
      </div>
    </div>
  </nav>
  
  <main class="max-w-4xl mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Friends</h1>
      <div class="flex gap-2">
        <input type="text" id="search-input" placeholder="Search users..." 
               class="px-4 py-2 bg-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
        <button id="search-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">Search</button>
      </div>
    </div>
    
    <div class="flex gap-2 mb-6">
      <button class="tab-btn px-4 py-2 rounded-lg bg-blue-600" data-tab="friends">My Friends</button>
      <button class="tab-btn px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600" data-tab="requests">Requests</button>
      <button class="tab-btn px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600" data-tab="suggestions">Suggestions</button>
    </div>
    
    <div id="friends-tab" class="tab-content">
      <div id="friends-list" class="space-y-4">
        <p class="text-gray-400">Loading friends...</p>
      </div>
    </div>
    
    <div id="requests-tab" class="tab-content hidden">
      <div id="requests-list" class="space-y-4">
        <p class="text-gray-400">Loading requests...</p>
      </div>
    </div>
    
    <div id="suggestions-tab" class="tab-content hidden">
      <div id="suggestions-list" class="space-y-4">
        <p class="text-gray-400">Loading suggestions...</p>
      </div>
    </div>
    
    <div id="search-results" class="hidden mt-6">
      <h2 class="text-xl font-bold mb-4">Search Results</h2>
      <div id="search-list" class="space-y-4"></div>
    </div>
  </main>
  
  <script src="/static/friends.js"></script>
</body>
</html>
`);
});

// Groups page
app.get('/groups', async (c) => {
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
  <title>Groups - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <nav class="bg-gray-800 p-4 shadow-lg">
    <div class="max-w-4xl mx-auto flex justify-between items-center">
      <a href="/dashboard" class="text-xl font-bold text-blue-400">MoodMash</a>
      <div class="flex gap-4">
        <a href="/dashboard" class="hover:text-blue-400">Dashboard</a>
        <a href="/feed" class="hover:text-blue-400">Feed</a>
        <a href="/friends" class="hover:text-blue-400">Friends</a>
        <a href="/groups" class="text-blue-400">Groups</a>
      </div>
    </div>
  </nav>
  
  <main class="max-w-4xl mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Groups</h1>
      <button id="create-group-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
        + Create Group
      </button>
    </div>
    
    <div class="flex gap-2 mb-6">
      <button class="tab-btn px-4 py-2 rounded-lg bg-blue-600" data-tab="joined">My Groups</button>
      <button class="tab-btn px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600" data-tab="discover">Discover</button>
    </div>
    
    <div id="joined-tab" class="tab-content">
      <div id="joined-groups" class="grid md:grid-cols-2 gap-4">
        <p class="text-gray-400">Loading groups...</p>
      </div>
    </div>
    
    <div id="discover-tab" class="tab-content hidden">
      <div id="discover-groups" class="grid md:grid-cols-2 gap-4">
        <p class="text-gray-400">Loading groups...</p>
      </div>
    </div>
    
    <!-- Create Group Modal -->
    <div id="create-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
      <div class="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
        <h2 class="text-xl font-bold mb-4">Create Group</h2>
        <form id="create-group-form" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Group Name</label>
            <input type="text" id="group-name" required minlength="3"
                   class="w-full px-4 py-3 bg-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Description</label>
            <textarea id="group-description" rows="3"
                      class="w-full px-4 py-3 bg-gray-700 rounded-lg outline-none resize-none"></textarea>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Privacy</label>
            <select id="group-privacy" class="w-full px-4 py-3 bg-gray-700 rounded-lg outline-none">
              <option value="public">Public - Anyone can join</option>
              <option value="private">Private - Invite only</option>
            </select>
          </div>
          <div class="flex gap-2">
            <button type="button" id="cancel-create" class="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg">
              Cancel
            </button>
            <button type="submit" class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  </main>
  
  <script src="/static/groups.js"></script>
</body>
</html>
`);
});

// Group detail page
app.get('/groups/:id', async (c) => {
  const { getCurrentUser } = await import('./middleware/auth');
  const user = await getCurrentUser(c);
  
  if (!user) {
    return c.redirect('/login');
  }
  
  const groupId = c.req.param('id');
  
  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Group - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen" data-group-id="${groupId}">
  <nav class="bg-gray-800 p-4 shadow-lg">
    <div class="max-w-4xl mx-auto flex justify-between items-center">
      <a href="/dashboard" class="text-xl font-bold text-blue-400">MoodMash</a>
      <div class="flex gap-4">
        <a href="/dashboard" class="hover:text-blue-400">Dashboard</a>
        <a href="/feed" class="hover:text-blue-400">Feed</a>
        <a href="/groups" class="text-blue-400">Groups</a>
      </div>
    </div>
  </nav>
  
  <main class="max-w-4xl mx-auto p-4">
    <div id="group-header" class="bg-gray-800 rounded-xl p-6 mb-6">
      <p class="text-gray-400">Loading group...</p>
    </div>
    
    <div class="grid md:grid-cols-3 gap-6">
      <div class="md:col-span-2">
        <div class="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Share with Group</h2>
          <form id="post-form" class="space-y-4">
            <textarea id="post-content" rows="3" placeholder="What's on your mind?"
                      class="w-full px-4 py-3 bg-gray-700 rounded-lg outline-none resize-none"></textarea>
            <div class="flex justify-between items-center">
              <label class="flex items-center gap-2">
                <input type="checkbox" id="include-mood" class="rounded">
                <span class="text-sm text-gray-400">Include current mood</span>
              </label>
              <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">Post</button>
            </div>
          </form>
        </div>
        
        <h2 class="text-lg font-semibold mb-4">Posts</h2>
        <div id="group-posts" class="space-y-4">
          <p class="text-gray-400">Loading posts...</p>
        </div>
      </div>
      
      <div>
        <div class="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Group Mood</h2>
          <div id="group-mood-trends">
            <p class="text-gray-400">Loading trends...</p>
          </div>
        </div>
        
        <div class="bg-gray-800 rounded-xl p-6">
          <h2 class="text-lg font-semibold mb-4">Members</h2>
          <div id="group-members" class="space-y-2">
            <p class="text-gray-400">Loading members...</p>
          </div>
        </div>
      </div>
    </div>
  </main>
  
  <script src="/static/group-detail.js"></script>
</body>
</html>
`);
});

// Activity Feed page
app.get('/feed', async (c) => {
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
  <title>Feed - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <nav class="bg-gray-800 p-4 shadow-lg">
    <div class="max-w-4xl mx-auto flex justify-between items-center">
      <a href="/dashboard" class="text-xl font-bold text-blue-400">MoodMash</a>
      <div class="flex gap-4">
        <a href="/dashboard" class="hover:text-blue-400">Dashboard</a>
        <a href="/feed" class="text-blue-400">Feed</a>
        <a href="/friends" class="hover:text-blue-400">Friends</a>
        <a href="/groups" class="hover:text-blue-400">Groups</a>
        <a href="/profile" class="hover:text-blue-400">Profile</a>
      </div>
    </div>
  </nav>
  
  <main class="max-w-2xl mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Activity Feed</h1>
      <div id="notifications-badge" class="relative">
        <a href="#" id="notifications-btn" class="p-2 hover:bg-gray-700 rounded-lg">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span id="unread-count" class="hidden absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center"></span>
        </a>
      </div>
    </div>
    
    <div class="flex gap-2 mb-6">
      <button class="filter-btn px-4 py-2 rounded-lg bg-blue-600" data-filter="all">All</button>
      <button class="filter-btn px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600" data-filter="friends">Friends</button>
      <button class="filter-btn px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600" data-filter="groups">Groups</button>
    </div>
    
    <div id="feed-items" class="space-y-4">
      <p class="text-gray-400">Loading feed...</p>
    </div>
    
    <button id="load-more" class="w-full mt-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg hidden">
      Load More
    </button>
    
    <!-- Notifications Panel -->
    <div id="notifications-panel" class="fixed right-0 top-0 h-full w-80 bg-gray-800 shadow-xl transform translate-x-full transition-transform z-50">
      <div class="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 class="text-lg font-semibold">Notifications</h2>
        <button id="close-notifications" class="p-2 hover:bg-gray-700 rounded-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div id="notifications-list" class="p-4 space-y-3 overflow-y-auto" style="height: calc(100% - 60px);">
        <p class="text-gray-400">Loading...</p>
      </div>
    </div>
  </main>
  
  <script src="/static/feed.js"></script>
</body>
</html>
`);
});

// User Profile page
app.get('/profile', async (c) => {
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
  <title>Profile - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <nav class="bg-gray-800 p-4 shadow-lg">
    <div class="max-w-4xl mx-auto flex justify-between items-center">
      <a href="/dashboard" class="text-xl font-bold text-blue-400">MoodMash</a>
      <div class="flex gap-4">
        <a href="/dashboard" class="hover:text-blue-400">Dashboard</a>
        <a href="/feed" class="hover:text-blue-400">Feed</a>
        <a href="/friends" class="hover:text-blue-400">Friends</a>
        <a href="/profile" class="text-blue-400">Profile</a>
      </div>
    </div>
  </nav>
  
  <main class="max-w-2xl mx-auto p-4">
    <div class="bg-gray-800 rounded-xl p-6 mb-6">
      <div class="flex items-start gap-6">
        <div id="avatar-container" class="relative">
          <div id="avatar" class="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold">
            ${user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
          </div>
          <button id="change-avatar" class="absolute bottom-0 right-0 p-1 bg-gray-700 rounded-full hover:bg-gray-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </button>
        </div>
        <div class="flex-1">
          <h1 class="text-2xl font-bold">${user.name || 'Anonymous'}</h1>
          <p class="text-gray-400">${user.email}</p>
          <p id="bio" class="mt-2 text-gray-300"></p>
        </div>
        <button id="edit-profile-btn" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
          Edit Profile
        </button>
      </div>
    </div>
    
    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <div class="bg-gray-800 rounded-xl p-6">
        <h2 class="text-lg font-semibold mb-4">Profile Settings</h2>
        <form id="profile-form" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Display Name</label>
            <input type="text" id="display-name" 
                   class="w-full px-4 py-3 bg-gray-700 rounded-lg outline-none">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Bio</label>
            <textarea id="bio-input" rows="3"
                      class="w-full px-4 py-3 bg-gray-700 rounded-lg outline-none resize-none"></textarea>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Location</label>
            <input type="text" id="location" 
                   class="w-full px-4 py-3 bg-gray-700 rounded-lg outline-none">
          </div>
          <button type="submit" class="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg">
            Save Profile
          </button>
        </form>
      </div>
      
      <div class="bg-gray-800 rounded-xl p-6">
        <h2 class="text-lg font-semibold mb-4">Privacy Settings</h2>
        <form id="privacy-form" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Profile Visibility</label>
            <select id="profile-visibility" class="w-full px-4 py-3 bg-gray-700 rounded-lg outline-none">
              <option value="public">Public</option>
              <option value="friends">Friends Only</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Mood Visibility</label>
            <select id="mood-visibility" class="w-full px-4 py-3 bg-gray-700 rounded-lg outline-none">
              <option value="public">Public</option>
              <option value="friends">Friends Only</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" id="allow-requests" class="rounded" checked>
            <label for="allow-requests" class="text-sm">Allow friend requests</label>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" id="show-history" class="rounded" checked>
            <label for="show-history" class="text-sm">Show mood history on profile</label>
          </div>
          <button type="submit" class="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg">
            Save Privacy Settings
          </button>
        </form>
      </div>
    </div>
    
    <div class="bg-gray-800 rounded-xl p-6">
      <h2 class="text-lg font-semibold mb-4">Recent Shared Moods</h2>
      <div id="shared-moods" class="space-y-4">
        <p class="text-gray-400">Loading...</p>
      </div>
    </div>
  </main>
  
  <script src="/static/profile.js"></script>
</body>
</html>
`);
});

// View other user's profile
app.get('/users/:id', async (c) => {
  const { getCurrentUser } = await import('./middleware/auth');
  const user = await getCurrentUser(c);
  
  if (!user) {
    return c.redirect('/login');
  }
  
  const userId = c.req.param('id');
  
  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>User Profile - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen" data-user-id="${userId}">
  <nav class="bg-gray-800 p-4 shadow-lg">
    <div class="max-w-4xl mx-auto flex justify-between items-center">
      <a href="/dashboard" class="text-xl font-bold text-blue-400">MoodMash</a>
      <div class="flex gap-4">
        <a href="/dashboard" class="hover:text-blue-400">Dashboard</a>
        <a href="/feed" class="hover:text-blue-400">Feed</a>
        <a href="/friends" class="hover:text-blue-400">Friends</a>
      </div>
    </div>
  </nav>
  
  <main class="max-w-2xl mx-auto p-4">
    <div id="user-profile" class="bg-gray-800 rounded-xl p-6 mb-6">
      <p class="text-gray-400">Loading profile...</p>
    </div>
    
    <div id="user-moods" class="bg-gray-800 rounded-xl p-6">
      <h2 class="text-lg font-semibold mb-4">Shared Moods</h2>
      <div id="moods-list" class="space-y-4">
        <p class="text-gray-400">Loading...</p>
      </div>
    </div>
  </main>
  
  <script src="/static/user-profile.js"></script>
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

// ============================================================================
// PHASE 4: GAMIFICATION PAGES
// ============================================================================

// Achievements page
app.get('/achievements', async (c) => {
  const { getCurrentUser } = await import('./middleware/auth');
  const user = await getCurrentUser(c);
  if (!user) return c.redirect('/login');

  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Achievements - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <nav class="bg-gray-800 border-b border-gray-700 px-4 py-3">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <a href="/dashboard" class="text-xl font-bold">MoodMash</a>
      <div class="flex items-center gap-4">
        <a href="/challenges" class="text-gray-300 hover:text-white">Challenges</a>
        <a href="/leaderboard" class="text-gray-300 hover:text-white">Leaderboard</a>
        <a href="/dashboard" class="text-gray-300 hover:text-white">Dashboard</a>
      </div>
    </div>
  </nav>
  <main class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">🏆 Achievements</h1>
    <div id="achievements-container">
      <div class="text-center py-12 text-gray-400">Loading achievements...</div>
    </div>
  </main>
  <script src="/static/achievements.js"></script>
</body>
</html>
`);
});

// Challenges page
app.get('/challenges', async (c) => {
  const { getCurrentUser } = await import('./middleware/auth');
  const user = await getCurrentUser(c);
  if (!user) return c.redirect('/login');

  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Challenges - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <nav class="bg-gray-800 border-b border-gray-700 px-4 py-3">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <a href="/dashboard" class="text-xl font-bold">MoodMash</a>
      <div class="flex items-center gap-4">
        <a href="/achievements" class="text-gray-300 hover:text-white">Achievements</a>
        <a href="/leaderboard" class="text-gray-300 hover:text-white">Leaderboard</a>
        <a href="/dashboard" class="text-gray-300 hover:text-white">Dashboard</a>
      </div>
    </div>
  </nav>
  <main class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">🎯 Challenges</h1>
    <div id="challenges-container">
      <div class="text-center py-12 text-gray-400">Loading challenges...</div>
    </div>
  </main>
  <script src="/static/challenges.js"></script>
</body>
</html>
`);
});

// Leaderboard page
app.get('/leaderboard', async (c) => {
  const { getCurrentUser } = await import('./middleware/auth');
  const user = await getCurrentUser(c);
  if (!user) return c.redirect('/login');

  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Leaderboard - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <nav class="bg-gray-800 border-b border-gray-700 px-4 py-3">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <a href="/dashboard" class="text-xl font-bold">MoodMash</a>
      <div class="flex items-center gap-4">
        <a href="/achievements" class="text-gray-300 hover:text-white">Achievements</a>
        <a href="/challenges" class="text-gray-300 hover:text-white">Challenges</a>
        <a href="/dashboard" class="text-gray-300 hover:text-white">Dashboard</a>
      </div>
    </div>
  </nav>
  <main class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">📊 Leaderboard</h1>
    <div id="leaderboard-container">
      <div class="text-center py-12 text-gray-400">Loading leaderboard...</div>
    </div>
  </main>
  <script src="/static/leaderboard.js"></script>
</body>
</html>
`);
});

// ==================== PHASE 5 PAGES ====================

// Security Dashboard
app.get('/security', async (c) => {
  const { getCurrentUser } = await import('./middleware/auth');
  const user = await getCurrentUser(c);
  if (!user) return c.redirect('/login');

  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <nav class="bg-gray-800 border-b border-gray-700 px-4 py-3">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <a href="/dashboard" class="text-xl font-bold">MoodMash</a>
      <div class="flex items-center gap-4">
        <a href="/health" class="text-gray-300 hover:text-white">Health</a>
        <a href="/wearables" class="text-gray-300 hover:text-white">Wearables</a>
        <a href="/dashboard" class="text-gray-300 hover:text-white">Dashboard</a>
      </div>
    </div>
  </nav>
  <main class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">🔒 Security Dashboard</h1>
    
    <!-- Security Score -->
    <div id="security-score" class="bg-gray-800 rounded-xl p-6 mb-6">
      <div class="text-center">
        <div class="text-6xl font-bold text-purple-400" id="score-value">--</div>
        <div class="text-gray-400 mt-2">Security Score</div>
      </div>
    </div>
    
    <!-- 2FA Section -->
    <div class="bg-gray-800 rounded-xl p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">🔐 Two-Factor Authentication</h2>
      <div id="2fa-status" class="space-y-4">
        <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
          <div>
            <div class="font-medium">Authenticator App (TOTP)</div>
            <div class="text-sm text-gray-400">Use Google Authenticator or Authy</div>
          </div>
          <button id="totp-btn" onclick="setup2FA('totp')" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg">
            Setup
          </button>
        </div>
        <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
          <div>
            <div class="font-medium">Email Verification</div>
            <div class="text-sm text-gray-400">Receive codes via email</div>
          </div>
          <button id="email-2fa-btn" onclick="setup2FA('email')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
            Enable
          </button>
        </div>
      </div>
    </div>
    
    <!-- Backup Codes -->
    <div class="bg-gray-800 rounded-xl p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">🗝️ Backup Codes</h2>
      <p class="text-gray-400 mb-4">Backup codes can be used if you lose access to your 2FA device.</p>
      <div id="backup-codes-status" class="mb-4">
        <span class="text-gray-400">Remaining codes: </span>
        <span id="backup-count" class="font-bold text-green-400">--</span>
      </div>
      <button onclick="regenerateBackupCodes()" class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg">
        Regenerate Codes
      </button>
    </div>
    
    <!-- Active Sessions -->
    <div class="bg-gray-800 rounded-xl p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">📱 Active Sessions</h2>
        <button onclick="terminateAllSessions()" class="text-sm text-red-400 hover:text-red-300">
          End all other sessions
        </button>
      </div>
      <div id="sessions-list" class="space-y-3">
        <div class="text-center py-4 text-gray-400">Loading sessions...</div>
      </div>
    </div>
    
    <!-- Login History -->
    <div class="bg-gray-800 rounded-xl p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">📜 Login History</h2>
      <div id="login-history" class="space-y-2 max-h-64 overflow-y-auto">
        <div class="text-center py-4 text-gray-400">Loading history...</div>
      </div>
    </div>
    
    <!-- Security Events -->
    <div class="bg-gray-800 rounded-xl p-6">
      <h2 class="text-xl font-semibold mb-4">⚡ Security Events</h2>
      <div id="security-events" class="space-y-2 max-h-64 overflow-y-auto">
        <div class="text-center py-4 text-gray-400">Loading events...</div>
      </div>
    </div>
  </main>
  <script src="/static/security.js"></script>
</body>
</html>
`);
});

// 2FA Setup Page
app.get('/2fa-setup', async (c) => {
  const { getCurrentUser } = await import('./middleware/auth');
  const user = await getCurrentUser(c);
  if (!user) return c.redirect('/login');

  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Setup 2FA - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="bg-gray-800 rounded-xl p-8 shadow-xl">
      <h1 class="text-2xl font-bold text-center mb-6">🔐 Setup Authenticator</h1>
      
      <!-- Step 1: QR Code -->
      <div id="step1" class="space-y-4">
        <p class="text-gray-400 text-center">Scan this QR code with your authenticator app:</p>
        <div id="qr-container" class="flex justify-center my-6">
          <div class="bg-white p-4 rounded-lg">
            <div id="qr-loading" class="w-48 h-48 flex items-center justify-center text-gray-400">
              Loading...
            </div>
            <img id="qr-code" class="w-48 h-48 hidden" alt="QR Code">
          </div>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-400 mb-2">Or enter this code manually:</p>
          <code id="manual-code" class="bg-gray-700 px-4 py-2 rounded text-purple-400 text-lg tracking-widest">
            ------
          </code>
        </div>
        <button onclick="showStep2()" class="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium mt-4">
          I've scanned the code
        </button>
      </div>
      
      <!-- Step 2: Verify -->
      <div id="step2" class="hidden space-y-4">
        <p class="text-gray-400 text-center">Enter the 6-digit code from your app:</p>
        <input type="text" id="totp-code" maxlength="6" pattern="[0-9]{6}"
               class="w-full px-4 py-3 bg-gray-700 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-purple-500 outline-none"
               placeholder="000000">
        <div id="verify-error" class="text-red-400 text-sm text-center hidden"></div>
        <button onclick="verifyTOTP()" class="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium">
          Verify & Enable 2FA
        </button>
        <button onclick="showStep1()" class="w-full py-2 text-gray-400 hover:text-white">
          Back
        </button>
      </div>
      
      <!-- Step 3: Backup Codes -->
      <div id="step3" class="hidden space-y-4">
        <div class="text-center text-green-400 mb-4">
          <span class="text-4xl">✓</span>
          <p class="font-medium mt-2">2FA Enabled Successfully!</p>
        </div>
        <p class="text-gray-400 text-center">Save these backup codes in a safe place:</p>
        <div id="backup-codes" class="bg-gray-700 p-4 rounded-lg font-mono text-sm grid grid-cols-2 gap-2">
        </div>
        <button onclick="downloadCodes()" class="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
          📥 Download Codes
        </button>
        <a href="/security" class="block w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium text-center">
          Done
        </a>
      </div>
    </div>
    <p class="text-center text-gray-400 mt-4">
      <a href="/security" class="text-purple-400 hover:underline">← Back to Security</a>
    </p>
  </div>
  <script src="/static/2fa-setup.js"></script>
</body>
</html>
`);
});

// Wearables Dashboard
app.get('/wearables', async (c) => {
  const { getCurrentUser } = await import('./middleware/auth');
  const user = await getCurrentUser(c);
  if (!user) return c.redirect('/login');

  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wearables - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <nav class="bg-gray-800 border-b border-gray-700 px-4 py-3">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <a href="/dashboard" class="text-xl font-bold">MoodMash</a>
      <div class="flex items-center gap-4">
        <a href="/health" class="text-gray-300 hover:text-white">Health</a>
        <a href="/sleep" class="text-gray-300 hover:text-white">Sleep</a>
        <a href="/dashboard" class="text-gray-300 hover:text-white">Dashboard</a>
      </div>
    </div>
  </nav>
  <main class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">⌚ Wearables</h1>
    
    <!-- Connect Devices -->
    <div class="bg-gray-800 rounded-xl p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Connect Your Devices</h2>
      <p class="text-gray-400 mb-4 text-sm">Connect wearables to track your activity and correlate with mood (demo mode).</p>
      <div id="devices-list" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="text-center py-8 text-gray-400">Loading devices...</div>
      </div>
    </div>
    
    <!-- Activity Summary -->
    <div class="bg-gray-800 rounded-xl p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">📊 Activity Summary</h2>
      <div id="activity-summary" class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-gray-700 rounded-lg p-4 text-center">
          <div class="text-3xl font-bold text-blue-400" id="avg-steps">--</div>
          <div class="text-sm text-gray-400">Avg Steps</div>
        </div>
        <div class="bg-gray-700 rounded-lg p-4 text-center">
          <div class="text-3xl font-bold text-red-400" id="avg-heart-rate">--</div>
          <div class="text-sm text-gray-400">Avg HR</div>
        </div>
        <div class="bg-gray-700 rounded-lg p-4 text-center">
          <div class="text-3xl font-bold text-orange-400" id="avg-calories">--</div>
          <div class="text-sm text-gray-400">Avg Calories</div>
        </div>
        <div class="bg-gray-700 rounded-lg p-4 text-center">
          <div class="text-3xl font-bold text-green-400" id="avg-active">--</div>
          <div class="text-sm text-gray-400">Avg Active Min</div>
        </div>
      </div>
    </div>
    
    <!-- Activity Trends Chart -->
    <div class="bg-gray-800 rounded-xl p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">📈 Weekly Trends</h2>
      <div id="activity-chart" class="h-64 flex items-end justify-around gap-2 pb-4">
        <div class="text-center py-8 text-gray-400 w-full">Loading chart...</div>
      </div>
      <div id="chart-labels" class="flex justify-around text-xs text-gray-400"></div>
    </div>
    
    <!-- Mood-Activity Correlation -->
    <div class="bg-gray-800 rounded-xl p-6">
      <h2 class="text-xl font-semibold mb-4">🔗 Mood-Activity Correlation</h2>
      <div id="correlation-container">
        <div class="text-center py-8 text-gray-400">Loading correlations...</div>
      </div>
    </div>
  </main>
  <script src="/static/wearables.js"></script>
</body>
</html>
`);
});

// Sleep Tracking Page
app.get('/sleep', async (c) => {
  const { getCurrentUser } = await import('./middleware/auth');
  const user = await getCurrentUser(c);
  if (!user) return c.redirect('/login');

  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sleep Tracking - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <nav class="bg-gray-800 border-b border-gray-700 px-4 py-3">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <a href="/dashboard" class="text-xl font-bold">MoodMash</a>
      <div class="flex items-center gap-4">
        <a href="/health" class="text-gray-300 hover:text-white">Health</a>
        <a href="/wearables" class="text-gray-300 hover:text-white">Wearables</a>
        <a href="/dashboard" class="text-gray-300 hover:text-white">Dashboard</a>
      </div>
    </div>
  </nav>
  <main class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">😴 Sleep Tracking</h1>
    
    <!-- Sleep Score -->
    <div class="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl p-6 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg text-gray-300">Sleep Quality Score</h2>
          <div class="text-5xl font-bold text-white" id="sleep-score">--</div>
        </div>
        <div class="text-right">
          <div class="text-gray-300">Avg Duration</div>
          <div class="text-2xl font-semibold" id="avg-duration">--</div>
        </div>
      </div>
    </div>
    
    <!-- Sleep Stages -->
    <div class="bg-gray-800 rounded-xl p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">🌙 Sleep Stages (Last Night)</h2>
      <div id="sleep-stages" class="space-y-3">
        <div class="flex items-center gap-4">
          <span class="w-20 text-sm text-gray-400">Deep</span>
          <div class="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
            <div id="deep-bar" class="bg-indigo-600 h-full transition-all duration-500" style="width: 0%"></div>
          </div>
          <span id="deep-time" class="w-16 text-right">--</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="w-20 text-sm text-gray-400">Light</span>
          <div class="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
            <div id="light-bar" class="bg-blue-400 h-full transition-all duration-500" style="width: 0%"></div>
          </div>
          <span id="light-time" class="w-16 text-right">--</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="w-20 text-sm text-gray-400">REM</span>
          <div class="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
            <div id="rem-bar" class="bg-purple-500 h-full transition-all duration-500" style="width: 0%"></div>
          </div>
          <span id="rem-time" class="w-16 text-right">--</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="w-20 text-sm text-gray-400">Awake</span>
          <div class="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
            <div id="awake-bar" class="bg-red-400 h-full transition-all duration-500" style="width: 0%"></div>
          </div>
          <span id="awake-time" class="w-16 text-right">--</span>
        </div>
      </div>
    </div>
    
    <!-- Weekly Sleep Chart -->
    <div class="bg-gray-800 rounded-xl p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">📊 Weekly Sleep Pattern</h2>
      <div id="sleep-chart" class="h-48 flex items-end justify-around gap-2 pb-4">
        <div class="text-center py-8 text-gray-400 w-full">Loading chart...</div>
      </div>
      <div id="sleep-chart-labels" class="flex justify-around text-xs text-gray-400 mt-2"></div>
    </div>
    
    <!-- Sleep-Mood Correlation -->
    <div class="bg-gray-800 rounded-xl p-6">
      <h2 class="text-xl font-semibold mb-4">😊 Sleep-Mood Connection</h2>
      <div id="sleep-mood-correlation" class="text-center py-8">
        <div class="text-gray-400">Loading correlation data...</div>
      </div>
    </div>
  </main>
  <script src="/static/sleep.js"></script>
</body>
</html>
`);
});

// Health Insights Page
app.get('/health', async (c) => {
  const { getCurrentUser } = await import('./middleware/auth');
  const user = await getCurrentUser(c);
  if (!user) return c.redirect('/login');

  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Health Insights - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <nav class="bg-gray-800 border-b border-gray-700 px-4 py-3">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <a href="/dashboard" class="text-xl font-bold">MoodMash</a>
      <div class="flex items-center gap-4">
        <a href="/visualizations" class="text-gray-300 hover:text-white">Visualizations</a>
        <a href="/wearables" class="text-gray-300 hover:text-white">Wearables</a>
        <a href="/sleep" class="text-gray-300 hover:text-white">Sleep</a>
        <a href="/dashboard" class="text-gray-300 hover:text-white">Dashboard</a>
      </div>
    </div>
  </nav>
  <main class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">💚 Health Insights</h1>
    
    <!-- Wellness Score -->
    <div class="bg-gradient-to-r from-green-900 to-emerald-900 rounded-xl p-8 mb-6">
      <div class="text-center">
        <h2 class="text-lg text-gray-300 mb-2">Overall Wellness Score</h2>
        <div class="relative inline-block">
          <svg class="w-40 h-40" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8"/>
            <circle id="wellness-circle" cx="50" cy="50" r="45" fill="none" stroke="#10B981" stroke-width="8"
                    stroke-linecap="round" stroke-dasharray="283" stroke-dashoffset="283"
                    transform="rotate(-90 50 50)" class="transition-all duration-1000"/>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <span id="wellness-score" class="text-4xl font-bold">--</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Component Scores -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-gray-800 rounded-xl p-4 text-center">
        <div class="text-3xl mb-2">🏃</div>
        <div class="text-2xl font-bold text-blue-400" id="activity-score">--</div>
        <div class="text-sm text-gray-400">Activity</div>
      </div>
      <div class="bg-gray-800 rounded-xl p-4 text-center">
        <div class="text-3xl mb-2">😴</div>
        <div class="text-2xl font-bold text-purple-400" id="sleep-score-card">--</div>
        <div class="text-sm text-gray-400">Sleep</div>
      </div>
      <div class="bg-gray-800 rounded-xl p-4 text-center">
        <div class="text-3xl mb-2">😊</div>
        <div class="text-2xl font-bold text-yellow-400" id="mood-score">--</div>
        <div class="text-sm text-gray-400">Mood</div>
      </div>
      <div class="bg-gray-800 rounded-xl p-4 text-center">
        <div class="text-3xl mb-2">🧘</div>
        <div class="text-2xl font-bold text-green-400" id="stress-score">--</div>
        <div class="text-sm text-gray-400">Relaxation</div>
      </div>
    </div>
    
    <!-- Insights & Recommendations -->
    <div class="bg-gray-800 rounded-xl p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">💡 Personalized Insights</h2>
      <div id="insights-list" class="space-y-4">
        <div class="text-center py-8 text-gray-400">Loading insights...</div>
      </div>
    </div>
    
    <!-- Quick Links -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <a href="/visualizations" class="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors text-center">
        <div class="text-3xl mb-2">📊</div>
        <div class="font-medium">Mood Visualizations</div>
      </a>
      <a href="/wearables" class="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors text-center">
        <div class="text-3xl mb-2">⌚</div>
        <div class="font-medium">Connect Devices</div>
      </a>
      <a href="/sleep" class="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors text-center">
        <div class="text-3xl mb-2">😴</div>
        <div class="font-medium">Sleep Analysis</div>
      </a>
    </div>
  </main>
  <script src="/static/health-insights.js"></script>
</body>
</html>
`);
});

// Mood Visualizations Page
app.get('/visualizations', async (c) => {
  const { getCurrentUser } = await import('./middleware/auth');
  const user = await getCurrentUser(c);
  if (!user) return c.redirect('/login');

  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mood Visualizations - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <nav class="bg-gray-800 border-b border-gray-700 px-4 py-3">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <a href="/dashboard" class="text-xl font-bold">MoodMash</a>
      <div class="flex items-center gap-4">
        <a href="/health" class="text-gray-300 hover:text-white">Health</a>
        <a href="/calendar" class="text-gray-300 hover:text-white">Calendar</a>
        <a href="/dashboard" class="text-gray-300 hover:text-white">Dashboard</a>
      </div>
    </div>
  </nav>
  <main class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">📊 Mood Visualizations</h1>
    
    <!-- Mood Heatmap Calendar -->
    <div class="bg-gray-800 rounded-xl p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">🗓️ Mood Heatmap</h2>
      <div id="mood-heatmap" class="overflow-x-auto">
        <div class="text-center py-8 text-gray-400">Loading heatmap...</div>
      </div>
      <div class="flex items-center justify-center gap-4 mt-4 text-sm">
        <span class="text-gray-400">Low</span>
        <div class="flex gap-1">
          <div class="w-4 h-4 rounded bg-gray-700"></div>
          <div class="w-4 h-4 rounded bg-purple-900"></div>
          <div class="w-4 h-4 rounded bg-purple-700"></div>
          <div class="w-4 h-4 rounded bg-purple-500"></div>
          <div class="w-4 h-4 rounded bg-purple-400"></div>
        </div>
        <span class="text-gray-400">High</span>
      </div>
    </div>
    
    <!-- Emotion Radar Chart -->
    <div class="bg-gray-800 rounded-xl p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">🎯 Emotion Distribution</h2>
      <div id="emotion-radar" class="flex justify-center">
        <div class="relative w-72 h-72">
          <svg viewBox="-110 -110 220 220" class="w-full h-full">
            <!-- Grid circles -->
            <circle cx="0" cy="0" r="25" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
            <circle cx="0" cy="0" r="50" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
            <circle cx="0" cy="0" r="75" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
            <circle cx="0" cy="0" r="100" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
            <!-- Radar polygon will be added by JS -->
            <polygon id="radar-polygon" fill="rgba(139, 92, 246, 0.3)" stroke="#8B5CF6" stroke-width="2"/>
          </svg>
          <!-- Labels positioned around -->
          <div id="radar-labels" class="absolute inset-0"></div>
        </div>
      </div>
    </div>
    
    <!-- Mood Timeline -->
    <div class="bg-gray-800 rounded-xl p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">📈 Mood Journey (Last 30 Days)</h2>
      <div id="mood-timeline" class="relative h-48">
        <div class="text-center py-8 text-gray-400">Loading timeline...</div>
      </div>
    </div>
    
    <!-- Emotion Wheel -->
    <div class="bg-gray-800 rounded-xl p-6">
      <h2 class="text-xl font-semibold mb-4">🎡 Emotion Wheel</h2>
      <div id="emotion-wheel" class="flex justify-center">
        <div class="relative w-64 h-64">
          <svg viewBox="-110 -110 220 220" class="w-full h-full">
            <g id="wheel-segments"></g>
          </svg>
        </div>
      </div>
      <div id="wheel-legend" class="flex flex-wrap justify-center gap-3 mt-4 text-sm"></div>
    </div>
  </main>
  <script src="/static/visualizations.js"></script>
</body>
</html>
`);
});

// ==================== PHASE 6 PAGES ====================

// AI Chatbot Page
app.get('/chatbot', async (c) => {
  const { getCurrentUser } = await import('./middleware/auth');
  const user = await getCurrentUser(c);
  if (!user) return c.redirect('/login');

  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mood - AI Companion - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen flex flex-col">
  <!-- Skip to main content for accessibility -->
  <a href="#main-chat" class="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-blue-600 px-4 py-2 z-50">
    Skip to main content
  </a>
  
  <nav class="bg-gray-800 border-b border-gray-700 px-4 py-3" role="navigation" aria-label="Main navigation">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <a href="/dashboard" class="text-xl font-bold">MoodMash</a>
      <div class="flex items-center gap-4">
        <a href="/dashboard" class="text-gray-300 hover:text-white">Dashboard</a>
        <a href="/insights" class="text-gray-300 hover:text-white">Insights</a>
        <button id="language-btn" class="p-2 rounded-lg hover:bg-gray-700" aria-label="Change language">🌐</button>
      </div>
    </div>
  </nav>
  
  <main id="main-chat" class="flex-1 flex flex-col max-w-3xl mx-auto w-full p-4" role="main">
    <div class="flex items-center gap-4 mb-6">
      <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
        🌟
      </div>
      <div>
        <h1 class="text-2xl font-bold">Mood</h1>
        <p class="text-gray-400 text-sm" id="chatbot-status">Your empathetic AI companion</p>
      </div>
    </div>
    
    <!-- Conversations List -->
    <div id="conversations-list" class="mb-4 flex gap-2 overflow-x-auto pb-2">
      <button id="new-chat-btn" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg whitespace-nowrap flex-shrink-0" aria-label="Start new conversation">
        + New Chat
      </button>
    </div>
    
    <!-- Chat Messages -->
    <div id="chat-messages" class="flex-1 overflow-y-auto space-y-4 mb-4" role="log" aria-live="polite" aria-atomic="false">
      <div class="flex gap-3">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">🌟</div>
        <div class="bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
          <p>Hi there! I'm Mood, your supportive AI companion. 🌟</p>
          <p class="mt-2">I'm here to listen, help you understand your emotions, and offer support. How are you feeling today?</p>
        </div>
      </div>
    </div>
    
    <!-- Typing Indicator -->
    <div id="typing-indicator" class="hidden flex gap-3 mb-4">
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">🌟</div>
      <div class="bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3">
        <div class="flex gap-1">
          <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
          <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
          <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
        </div>
      </div>
    </div>
    
    <!-- Input Area -->
    <div class="bg-gray-800 rounded-2xl p-3">
      <form id="chat-form" class="flex items-end gap-2">
        <div class="flex-1 relative">
          <textarea id="chat-input" rows="1" placeholder="Type your message..." 
                    class="w-full bg-gray-700 rounded-xl px-4 py-3 pr-12 outline-none resize-none focus:ring-2 focus:ring-purple-500"
                    aria-label="Chat message"></textarea>
          <button type="button" id="voice-btn" class="absolute right-2 bottom-2 p-2 rounded-lg hover:bg-gray-600 transition-colors"
                  aria-label="Voice input">
            🎤
          </button>
        </div>
        <button type="submit" id="send-btn" class="p-3 bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors disabled:opacity-50"
                aria-label="Send message">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        </button>
      </form>
      <div class="flex items-center justify-between mt-2 text-xs text-gray-400 px-2">
        <div id="usage-info">
          <span id="messages-used">0</span>/<span id="messages-limit">50</span> messages this month
        </div>
        <button id="tts-toggle" class="flex items-center gap-1 hover:text-white transition-colors" aria-label="Toggle text-to-speech">
          🔊 <span id="tts-status">TTS Off</span>
        </button>
      </div>
    </div>
  </main>
  
  <!-- Voice Recording Modal -->
  <div id="voice-modal" class="fixed inset-0 bg-black bg-opacity-75 hidden items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="voice-modal-title">
    <div class="bg-gray-800 rounded-2xl p-8 text-center max-w-sm mx-4">
      <h2 id="voice-modal-title" class="text-xl font-bold mb-4">Recording...</h2>
      <div id="voice-visualizer" class="h-16 flex items-center justify-center gap-1 mb-4">
        <div class="w-1 bg-purple-500 rounded-full animate-pulse" style="height: 20px"></div>
        <div class="w-1 bg-purple-500 rounded-full animate-pulse" style="height: 40px; animation-delay: 0.1s"></div>
        <div class="w-1 bg-purple-500 rounded-full animate-pulse" style="height: 30px; animation-delay: 0.2s"></div>
        <div class="w-1 bg-purple-500 rounded-full animate-pulse" style="height: 50px; animation-delay: 0.3s"></div>
        <div class="w-1 bg-purple-500 rounded-full animate-pulse" style="height: 25px; animation-delay: 0.4s"></div>
      </div>
      <p id="voice-timer" class="text-2xl font-mono mb-4">00:00</p>
      <button id="stop-recording" class="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full mx-auto flex items-center justify-center">
        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12"/></svg>
      </button>
      <button id="cancel-recording" class="mt-4 text-gray-400 hover:text-white">Cancel</button>
    </div>
  </div>
  
  <!-- Language Selector Modal -->
  <div id="language-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50" role="dialog" aria-modal="true">
    <div class="bg-gray-800 rounded-xl p-6 max-w-sm mx-4">
      <h2 class="text-xl font-bold mb-4">Select Language</h2>
      <div class="space-y-2" id="language-options">
        <button class="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left" data-lang="en">🇺🇸 English</button>
        <button class="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left" data-lang="ar">🇸🇦 العربية</button>
        <button class="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left" data-lang="es">🇪🇸 Español</button>
        <button class="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left" data-lang="fr">🇫🇷 Français</button>
        <button class="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left" data-lang="de">🇩🇪 Deutsch</button>
      </div>
      <button id="close-language-modal" class="w-full mt-4 py-2 text-gray-400 hover:text-white">Close</button>
    </div>
  </div>
  
  <script src="/static/chatbot.js"></script>
</body>
</html>
`);
});

// Subscription Page
app.get('/subscription', async (c) => {
  const { getCurrentUser } = await import('./middleware/auth');
  const user = await getCurrentUser(c);
  if (!user) return c.redirect('/login');

  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <nav class="bg-gray-800 border-b border-gray-700 px-4 py-3">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <a href="/dashboard" class="text-xl font-bold">MoodMash</a>
      <div class="flex items-center gap-4">
        <a href="/dashboard" class="text-gray-300 hover:text-white">Dashboard</a>
        <a href="/settings" class="text-gray-300 hover:text-white">Settings</a>
      </div>
    </div>
  </nav>
  
  <main class="max-w-5xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-center mb-2">Choose Your Plan</h1>
    <p class="text-gray-400 text-center mb-8">Unlock more features to enhance your mood tracking journey</p>
    
    <!-- Current Usage -->
    <div class="bg-gray-800 rounded-xl p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">📊 Your Usage This Month</h2>
      <div id="usage-stats" class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="text-center p-4 bg-gray-700 rounded-lg">
          <div class="text-2xl font-bold text-purple-400" id="moods-used">--</div>
          <div class="text-sm text-gray-400">Moods Logged</div>
        </div>
        <div class="text-center p-4 bg-gray-700 rounded-lg">
          <div class="text-2xl font-bold text-blue-400" id="friends-used">--</div>
          <div class="text-sm text-gray-400">Friends</div>
        </div>
        <div class="text-center p-4 bg-gray-700 rounded-lg">
          <div class="text-2xl font-bold text-green-400" id="groups-used">--</div>
          <div class="text-sm text-gray-400">Groups</div>
        </div>
        <div class="text-center p-4 bg-gray-700 rounded-lg">
          <div class="text-2xl font-bold text-yellow-400" id="voice-used">--</div>
          <div class="text-sm text-gray-400">Voice Journals</div>
        </div>
        <div class="text-center p-4 bg-gray-700 rounded-lg">
          <div class="text-2xl font-bold text-pink-400" id="ai-used">--</div>
          <div class="text-sm text-gray-400">AI Messages</div>
        </div>
      </div>
    </div>
    
    <!-- Pricing Cards -->
    <div id="pricing-cards" class="grid md:grid-cols-3 gap-6">
      <!-- Free Tier -->
      <div class="bg-gray-800 rounded-xl p-6 border-2 border-gray-700 relative">
        <h3 class="text-xl font-bold mb-2">Free</h3>
        <p class="text-gray-400 text-sm mb-4">Get started with basic mood tracking</p>
        <div class="text-3xl font-bold mb-6">$0<span class="text-lg font-normal text-gray-400">/month</span></div>
        <ul class="space-y-3 mb-6" role="list">
          <li class="flex items-center gap-2"><span class="text-green-400">✓</span> 30 moods/month</li>
          <li class="flex items-center gap-2"><span class="text-green-400">✓</span> 5 friends</li>
          <li class="flex items-center gap-2"><span class="text-green-400">✓</span> 2 groups</li>
          <li class="flex items-center gap-2"><span class="text-green-400">✓</span> Basic insights</li>
          <li class="flex items-center gap-2 text-gray-500"><span>✗</span> Voice journals</li>
          <li class="flex items-center gap-2 text-gray-500"><span>✗</span> AI chatbot</li>
        </ul>
        <button class="w-full py-3 bg-gray-700 rounded-lg" disabled>Current Plan</button>
      </div>
      
      <!-- Pro Tier -->
      <div class="bg-gradient-to-b from-purple-900/50 to-gray-800 rounded-xl p-6 border-2 border-purple-500 relative transform scale-105">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 px-4 py-1 rounded-full text-sm font-medium">Most Popular</div>
        <h3 class="text-xl font-bold mb-2">Pro</h3>
        <p class="text-gray-400 text-sm mb-4">Enhanced features for serious trackers</p>
        <div class="text-3xl font-bold mb-6">$9.99<span class="text-lg font-normal text-gray-400">/month</span></div>
        <ul class="space-y-3 mb-6" role="list">
          <li class="flex items-center gap-2"><span class="text-green-400">✓</span> Unlimited moods</li>
          <li class="flex items-center gap-2"><span class="text-green-400">✓</span> 50 friends</li>
          <li class="flex items-center gap-2"><span class="text-green-400">✓</span> 10 groups</li>
          <li class="flex items-center gap-2"><span class="text-green-400">✓</span> Advanced insights</li>
          <li class="flex items-center gap-2"><span class="text-green-400">✓</span> 20 voice journals/mo</li>
          <li class="flex items-center gap-2"><span class="text-green-400">✓</span> 50 AI messages/mo</li>
        </ul>
        <button class="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium" onclick="selectPlan('pro')">
          Upgrade to Pro
        </button>
      </div>
      
      <!-- Premium Tier -->
      <div class="bg-gray-800 rounded-xl p-6 border-2 border-gray-700 relative">
        <h3 class="text-xl font-bold mb-2">Premium</h3>
        <p class="text-gray-400 text-sm mb-4">Everything unlimited for power users</p>
        <div class="text-3xl font-bold mb-6">$19.99<span class="text-lg font-normal text-gray-400">/month</span></div>
        <ul class="space-y-3 mb-6" role="list">
          <li class="flex items-center gap-2"><span class="text-green-400">✓</span> Everything in Pro</li>
          <li class="flex items-center gap-2"><span class="text-green-400">✓</span> Unlimited friends</li>
          <li class="flex items-center gap-2"><span class="text-green-400">✓</span> Unlimited groups</li>
          <li class="flex items-center gap-2"><span class="text-green-400">✓</span> Unlimited voice journals</li>
          <li class="flex items-center gap-2"><span class="text-green-400">✓</span> Unlimited AI chatbot</li>
          <li class="flex items-center gap-2"><span class="text-green-400">✓</span> API access</li>
        </ul>
        <button class="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium" onclick="selectPlan('premium')">
          Upgrade to Premium
        </button>
      </div>
    </div>
    
    <p class="text-center text-gray-400 text-sm mt-8">
      💳 Secure payment processing coming soon. For now, enjoy exploring the features!
    </p>
  </main>
  
  <script src="/static/subscription.js"></script>
</body>
</html>
`);
});

// Privacy Policy Page
app.get('/legal/privacy', async (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <nav class="bg-gray-800 border-b border-gray-700 px-4 py-3">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <a href="/dashboard" class="text-xl font-bold">MoodMash</a>
      <div class="flex items-center gap-4">
        <a href="/legal/terms" class="text-gray-300 hover:text-white">Terms</a>
        <a href="/legal/cookies" class="text-gray-300 hover:text-white">Cookies</a>
      </div>
    </div>
  </nav>
  
  <main class="max-w-3xl mx-auto px-4 py-8">
    <article id="privacy-content" class="prose prose-invert max-w-none">
      <div class="text-center py-8 text-gray-400">Loading privacy policy...</div>
    </article>
    
    <!-- Read Aloud Button -->
    <div class="fixed bottom-8 right-8">
      <button id="read-aloud-btn" class="p-4 bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg" aria-label="Read aloud">
        🔊
      </button>
    </div>
  </main>
  
  <script src="/static/legal.js"></script>
</body>
</html>
`);
});

// Terms of Service Page
app.get('/legal/terms', async (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <nav class="bg-gray-800 border-b border-gray-700 px-4 py-3">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <a href="/dashboard" class="text-xl font-bold">MoodMash</a>
      <div class="flex items-center gap-4">
        <a href="/legal/privacy" class="text-gray-300 hover:text-white">Privacy</a>
        <a href="/legal/cookies" class="text-gray-300 hover:text-white">Cookies</a>
      </div>
    </div>
  </nav>
  
  <main class="max-w-3xl mx-auto px-4 py-8">
    <article id="terms-content" class="prose prose-invert max-w-none">
      <div class="text-center py-8 text-gray-400">Loading terms of service...</div>
    </article>
    
    <div class="fixed bottom-8 right-8">
      <button id="read-aloud-btn" class="p-4 bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg" aria-label="Read aloud">
        🔊
      </button>
    </div>
  </main>
  
  <script src="/static/legal.js"></script>
</body>
</html>
`);
});

// Cookie Policy Page
app.get('/legal/cookies', async (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cookie Policy - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <nav class="bg-gray-800 border-b border-gray-700 px-4 py-3">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <a href="/dashboard" class="text-xl font-bold">MoodMash</a>
      <div class="flex items-center gap-4">
        <a href="/legal/privacy" class="text-gray-300 hover:text-white">Privacy</a>
        <a href="/legal/terms" class="text-gray-300 hover:text-white">Terms</a>
      </div>
    </div>
  </nav>
  
  <main class="max-w-3xl mx-auto px-4 py-8">
    <article id="cookies-content" class="prose prose-invert max-w-none">
      <div class="text-center py-8 text-gray-400">Loading cookie policy...</div>
    </article>
  </main>
  
  <script src="/static/legal.js"></script>
</body>
</html>
`);
});

// Analytics Dashboard (Admin)
app.get('/admin/analytics', async (c) => {
  const { getCurrentUser } = await import('./middleware/auth');
  const user = await getCurrentUser(c);
  if (!user) return c.redirect('/login');

  return c.html(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analytics Dashboard - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <nav class="bg-gray-800 border-b border-gray-700 px-4 py-3">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <a href="/dashboard" class="text-xl font-bold">MoodMash Admin</a>
      <div class="flex items-center gap-4">
        <a href="/dashboard" class="text-gray-300 hover:text-white">Dashboard</a>
      </div>
    </div>
  </nav>
  
  <main class="max-w-6xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">📊 Analytics Dashboard</h1>
    
    <!-- Key Metrics -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      <div class="bg-gray-800 rounded-xl p-4">
        <div class="text-3xl font-bold text-blue-400" id="total-users">--</div>
        <div class="text-sm text-gray-400">Total Users</div>
      </div>
      <div class="bg-gray-800 rounded-xl p-4">
        <div class="text-3xl font-bold text-green-400" id="new-users-today">--</div>
        <div class="text-sm text-gray-400">New Today</div>
      </div>
      <div class="bg-gray-800 rounded-xl p-4">
        <div class="text-3xl font-bold text-purple-400" id="dau">--</div>
        <div class="text-sm text-gray-400">DAU</div>
      </div>
      <div class="bg-gray-800 rounded-xl p-4">
        <div class="text-3xl font-bold text-yellow-400" id="mau">--</div>
        <div class="text-sm text-gray-400">MAU</div>
      </div>
      <div class="bg-gray-800 rounded-xl p-4">
        <div class="text-3xl font-bold text-pink-400" id="total-moods">--</div>
        <div class="text-sm text-gray-400">Total Moods</div>
      </div>
    </div>
    
    <!-- Charts -->
    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <div class="bg-gray-800 rounded-xl p-6">
        <h2 class="text-lg font-semibold mb-4">User Growth (30 Days)</h2>
        <canvas id="user-growth-chart"></canvas>
      </div>
      <div class="bg-gray-800 rounded-xl p-6">
        <h2 class="text-lg font-semibold mb-4">Mood Trends (30 Days)</h2>
        <canvas id="mood-trends-chart"></canvas>
      </div>
    </div>
    
    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <div class="bg-gray-800 rounded-xl p-6">
        <h2 class="text-lg font-semibold mb-4">Emotion Distribution</h2>
        <canvas id="emotion-chart"></canvas>
      </div>
      <div class="bg-gray-800 rounded-xl p-6">
        <h2 class="text-lg font-semibold mb-4">Subscription Distribution</h2>
        <canvas id="subscription-chart"></canvas>
      </div>
    </div>
    
    <!-- Feature Usage -->
    <div class="bg-gray-800 rounded-xl p-6 mb-8">
      <h2 class="text-lg font-semibold mb-4">Feature Usage</h2>
      <div id="feature-usage" class="space-y-3">
        <div class="text-center py-4 text-gray-400">Loading...</div>
      </div>
    </div>
    
    <!-- Top Pages -->
    <div class="bg-gray-800 rounded-xl p-6">
      <h2 class="text-lg font-semibold mb-4">Top Pages</h2>
      <div id="top-pages" class="space-y-2">
        <div class="text-center py-4 text-gray-400">Loading...</div>
      </div>
    </div>
  </main>
  
  <script src="/static/analytics-dashboard.js"></script>
</body>
</html>
`);
});

export default app;
