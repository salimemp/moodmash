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

export default app;
