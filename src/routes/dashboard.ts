// Dashboard routes
import { Hono } from 'hono';
import type { Env, Variables, CurrentUser } from '../types';
import { requireAuth, getCurrentUser } from '../middleware/auth';
import { getMoodStats } from '../lib/db';

const dashboard = new Hono<{ Bindings: Env; Variables: Variables }>();

// Dashboard page (requires auth)
dashboard.get('/dashboard', requireAuth, async (c) => {
  const user = c.get('user') as CurrentUser;
  return c.html(dashboardPage(user));
});

// Log mood page
dashboard.get('/log', requireAuth, (c) => {
  const user = c.get('user') as CurrentUser;
  return c.html(logMoodPage(user));
});

// History page
dashboard.get('/history', requireAuth, (c) => {
  const user = c.get('user') as CurrentUser;
  return c.html(historyPage(user));
});

// Calendar page
dashboard.get('/calendar', requireAuth, (c) => {
  const user = c.get('user') as CurrentUser;
  return c.html(calendarPage(user));
});

// Dashboard HTML
function dashboardPage(user: CurrentUser): string {
  return pageLayout('Dashboard', user, `
    <div class="max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold mb-6">Welcome back${user.name ? ', ' + user.name : ''}! 👋</h2>
      
      <!-- Quick Log Button -->
      <a href="/log" class="block bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-6 hover:opacity-90 transition-opacity">
        <div class="text-xl font-semibold">📝 Log Your Mood</div>
        <p class="text-gray-200 mt-2">How are you feeling right now?</p>
      </a>
      
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-gray-800 rounded-lg p-4 text-center">
          <div id="stat-total" class="text-3xl font-bold text-blue-400">-</div>
          <div class="text-gray-400 text-sm">Total Entries</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 text-center">
          <div id="stat-avg" class="text-3xl font-bold text-green-400">-</div>
          <div class="text-gray-400 text-sm">Avg Intensity</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 text-center">
          <div id="stat-streak" class="text-3xl font-bold text-yellow-400">-</div>
          <div class="text-gray-400 text-sm">Day Streak</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 text-center">
          <div id="stat-week" class="text-3xl font-bold text-purple-400">-</div>
          <div class="text-gray-400 text-sm">This Week</div>
        </div>
      </div>
      
      <!-- Recent Moods -->
      <div class="bg-gray-800 rounded-lg p-6 mb-6">
        <h3 class="text-lg font-semibold mb-4">Recent Moods</h3>
        <div id="recent-moods" class="space-y-3">
          <div class="text-gray-400 text-center py-4">Loading...</div>
        </div>
      </div>
      
      <!-- Emotion Distribution -->
      <div class="bg-gray-800 rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">Emotion Distribution</h3>
        <div id="emotion-chart" class="space-y-2">
          <div class="text-gray-400 text-center py-4">Loading...</div>
        </div>
      </div>
    </div>
  `, 'loadDashboard();');
}

// Log Mood Page
function logMoodPage(user: CurrentUser): string {
  const emotions = [
    { value: 'happy', emoji: '😊', label: 'Happy' },
    { value: 'sad', emoji: '😢', label: 'Sad' },
    { value: 'anxious', emoji: '😰', label: 'Anxious' },
    { value: 'calm', emoji: '😌', label: 'Calm' },
    { value: 'energetic', emoji: '⚡', label: 'Energetic' },
    { value: 'tired', emoji: '😴', label: 'Tired' },
    { value: 'angry', emoji: '😠', label: 'Angry' },
    { value: 'peaceful', emoji: '🧘', label: 'Peaceful' },
    { value: 'neutral', emoji: '😐', label: 'Neutral' }
  ];
  
  const emotionButtons = emotions.map(e => `
    <button type="button" data-emotion="${e.value}" 
      class="emotion-btn p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-center transition-colors">
      <div class="text-3xl">${e.emoji}</div>
      <div class="text-sm mt-1">${e.label}</div>
    </button>
  `).join('');
  
  return pageLayout('Log Mood', user, `
    <div class="max-w-xl mx-auto">
      <h2 class="text-2xl font-bold mb-6 text-center">How are you feeling?</h2>
      
      <form id="moodForm" class="space-y-6">
        <!-- Emotion Selection -->
        <div>
          <label class="block text-sm font-medium mb-3">Select your emotion</label>
          <div class="grid grid-cols-3 gap-3">
            ${emotionButtons}
          </div>
          <input type="hidden" name="emotion" id="selectedEmotion" required>
        </div>
        
        <!-- Intensity Slider -->
        <div>
          <label class="block text-sm font-medium mb-3">
            Intensity: <span id="intensityValue">5</span>/10
          </label>
          <input type="range" name="intensity" min="1" max="10" value="5" 
            id="intensitySlider" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer">
        </div>
        
        <!-- Notes -->
        <div>
          <label class="block text-sm font-medium mb-2">Notes (optional)</label>
          <textarea name="notes" rows="3" 
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="What's on your mind?"></textarea>
        </div>
        
        <div id="error" class="text-red-400 text-sm hidden"></div>
        
        <button type="submit" 
          class="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          Save Mood Entry
        </button>
      </form>
    </div>
  `, 'initLogMood();');
}

// History Page
function historyPage(user: CurrentUser): string {
  return pageLayout('Mood History', user, `
    <div class="max-w-2xl mx-auto">
      <h2 class="text-2xl font-bold mb-6">Mood History</h2>
      
      <div id="mood-history" class="space-y-4">
        <div class="text-gray-400 text-center py-8">Loading...</div>
      </div>
      
      <div id="load-more-container" class="mt-6 text-center hidden">
        <button id="loadMoreBtn" class="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
          Load More
        </button>
      </div>
    </div>
  `, 'loadHistory();');
}

// Calendar Page
function calendarPage(user: CurrentUser): string {
  return pageLayout('Mood Calendar', user, `
    <div class="max-w-3xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <button id="prevMonth" class="p-2 hover:bg-gray-700 rounded-lg">← Prev</button>
        <h2 id="calendarTitle" class="text-2xl font-bold">Loading...</h2>
        <button id="nextMonth" class="p-2 hover:bg-gray-700 rounded-lg">Next →</button>
      </div>
      
      <div class="bg-gray-800 rounded-lg p-4">
        <div class="grid grid-cols-7 gap-1 mb-2 text-center text-gray-400 text-sm">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div id="calendar-grid" class="grid grid-cols-7 gap-1">
          <!-- Calendar days will be populated by JS -->
        </div>
      </div>
      
      <div class="mt-6 flex flex-wrap gap-4 justify-center text-sm">
        <div class="flex items-center gap-2"><span class="w-4 h-4 bg-green-500 rounded"></span> Positive</div>
        <div class="flex items-center gap-2"><span class="w-4 h-4 bg-yellow-500 rounded"></span> Neutral</div>
        <div class="flex items-center gap-2"><span class="w-4 h-4 bg-red-500 rounded"></span> Negative</div>
        <div class="flex items-center gap-2"><span class="w-4 h-4 bg-gray-600 rounded"></span> No Entry</div>
      </div>
    </div>
  `, 'initCalendar();');
}

// Shared page layout
function pageLayout(title: string, user: CurrentUser, content: string, onload = ''): string {
  return `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - MoodMash</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <!-- Navigation -->
  <nav class="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
      <a href="/dashboard" class="text-xl font-bold">🎭 MoodMash</a>
      <div class="flex items-center gap-4">
        <a href="/dashboard" class="hover:text-blue-400 transition-colors">Dashboard</a>
        <a href="/log" class="hover:text-blue-400 transition-colors">Log</a>
        <a href="/history" class="hover:text-blue-400 transition-colors">History</a>
        <a href="/calendar" class="hover:text-blue-400 transition-colors">Calendar</a>
        <button id="logoutBtn" class="text-gray-400 hover:text-red-400 transition-colors">Logout</button>
      </div>
    </div>
  </nav>
  
  <!-- Main Content -->
  <main class="p-4">
    ${content}
  </main>
  
  <script src="/static/app.js"></script>
  ${onload ? `<script>document.addEventListener('DOMContentLoaded', () => { ${onload} });</script>` : ''}
</body>
</html>
`;
}

export default dashboard;
