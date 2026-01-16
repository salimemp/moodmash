// MoodMash Client-Side JavaScript

// API helper
async function api(endpoint, options = {}) {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  
  return data;
}

// Show error message
function showError(message) {
  const errorEl = document.getElementById('error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }
}

// Hide error message
function hideError() {
  const errorEl = document.getElementById('error');
  if (errorEl) {
    errorEl.classList.add('hidden');
  }
}

// Emotion emoji mapping
const EMOTION_EMOJI = {
  happy: '😊',
  sad: '😢',
  anxious: '😰',
  calm: '😌',
  energetic: '⚡',
  tired: '😴',
  angry: '😠',
  peaceful: '🧘',
  neutral: '😐'
};

// Emotion color mapping
const EMOTION_COLOR = {
  happy: 'text-green-400',
  sad: 'text-blue-400',
  anxious: 'text-yellow-400',
  calm: 'text-cyan-400',
  energetic: 'text-orange-400',
  tired: 'text-gray-400',
  angry: 'text-red-400',
  peaceful: 'text-purple-400',
  neutral: 'text-gray-300'
};

// Format date
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Login form handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    
    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
      await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      window.location.href = '/dashboard';
    } catch (err) {
      showError(err.message);
    }
  });
}

// Register form handler
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    
    const formData = new FormData(registerForm);
    const email = formData.get('email');
    const password = formData.get('password');
    const name = formData.get('name');
    
    try {
      await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name: name || undefined })
      });
      window.location.href = '/dashboard';
    } catch (err) {
      showError(err.message);
    }
  });
}

// Logout handler
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
      window.location.href = '/login';
    }
  });
}

// Dashboard functions
async function loadDashboard() {
  try {
    const stats = await api('/api/moods/stats');
    
    // Update stats
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-avg').textContent = stats.avgIntensity.toFixed(1);
    document.getElementById('stat-week').textContent = stats.last7Days.length;
    
    // Calculate streak (simplified - just count consecutive days)
    const streak = calculateStreak(stats.last7Days);
    document.getElementById('stat-streak').textContent = streak;
    
    // Show recent moods
    const recentContainer = document.getElementById('recent-moods');
    if (stats.last7Days.length === 0) {
      recentContainer.innerHTML = '<div class="text-gray-400 text-center py-4">No moods logged yet. <a href="/log" class="text-blue-400 hover:underline">Log your first mood!</a></div>';
    } else {
      recentContainer.innerHTML = stats.last7Days.slice(0, 5).map(mood => `
        <div class="flex items-center gap-4 p-3 bg-gray-700 rounded-lg">
          <div class="text-3xl">${EMOTION_EMOJI[mood.emotion] || '😐'}</div>
          <div class="flex-1">
            <div class="font-medium capitalize ${EMOTION_COLOR[mood.emotion] || ''}">${mood.emotion}</div>
            <div class="text-sm text-gray-400">${formatDate(mood.logged_at)}</div>
          </div>
          <div class="text-lg font-bold">${mood.intensity}/10</div>
        </div>
      `).join('');
    }
    
    // Show emotion distribution
    const chartContainer = document.getElementById('emotion-chart');
    const emotions = Object.entries(stats.emotionCounts);
    if (emotions.length === 0) {
      chartContainer.innerHTML = '<div class="text-gray-400 text-center py-4">No data yet</div>';
    } else {
      const maxCount = Math.max(...emotions.map(([, count]) => count));
      chartContainer.innerHTML = emotions.map(([emotion, count]) => {
        const percent = maxCount > 0 ? (count / maxCount) * 100 : 0;
        return `
          <div class="flex items-center gap-3">
            <div class="w-24 text-sm capitalize">${EMOTION_EMOJI[emotion] || ''} ${emotion}</div>
            <div class="flex-1 bg-gray-700 rounded-full h-4">
              <div class="h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" style="width: ${percent}%"></div>
            </div>
            <div class="w-8 text-sm text-gray-400">${count}</div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

function calculateStreak(moods) {
  if (moods.length === 0) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  const moodDates = new Set(
    moods.map(m => {
      const d = new Date(m.logged_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );
  
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    if (moodDates.has(checkDate.getTime())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  
  return streak;
}

// Log mood page
function initLogMood() {
  const emotionBtns = document.querySelectorAll('.emotion-btn');
  const intensitySlider = document.getElementById('intensitySlider');
  const intensityValue = document.getElementById('intensityValue');
  const moodForm = document.getElementById('moodForm');
  
  let selectedEmotion = null;
  
  // Emotion selection
  emotionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      emotionBtns.forEach(b => b.classList.remove('ring-2', 'ring-blue-500', 'bg-gray-600'));
      btn.classList.add('ring-2', 'ring-blue-500', 'bg-gray-600');
      selectedEmotion = btn.dataset.emotion;
      document.getElementById('selectedEmotion').value = selectedEmotion;
    });
  });
  
  // Intensity slider
  intensitySlider.addEventListener('input', () => {
    intensityValue.textContent = intensitySlider.value;
  });
  
  // Form submit
  moodForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    
    if (!selectedEmotion) {
      showError('Please select an emotion');
      return;
    }
    
    const formData = new FormData(moodForm);
    const notes = formData.get('notes');
    
    try {
      await api('/api/moods', {
        method: 'POST',
        body: JSON.stringify({
          emotion: selectedEmotion,
          intensity: parseInt(intensitySlider.value),
          notes: notes || undefined,
          logged_at: new Date().toISOString()
        })
      });
      window.location.href = '/dashboard';
    } catch (err) {
      showError(err.message);
    }
  });
}

// History page
let historyOffset = 0;
const HISTORY_LIMIT = 20;

async function loadHistory(append = false) {
  try {
    const data = await api(`/api/moods?limit=${HISTORY_LIMIT}&offset=${historyOffset}`);
    const container = document.getElementById('mood-history');
    const loadMoreContainer = document.getElementById('load-more-container');
    
    if (data.moods.length === 0 && !append) {
      container.innerHTML = '<div class="text-gray-400 text-center py-8">No moods logged yet. <a href="/log" class="text-blue-400 hover:underline">Log your first mood!</a></div>';
      return;
    }
    
    const moodsHtml = data.moods.map(mood => `
      <div class="bg-gray-800 rounded-lg p-4" data-mood-id="${mood.id}">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="text-4xl">${EMOTION_EMOJI[mood.emotion] || '😐'}</div>
            <div>
              <div class="font-semibold capitalize ${EMOTION_COLOR[mood.emotion] || ''}">${mood.emotion}</div>
              <div class="text-sm text-gray-400">${formatDate(mood.logged_at)}</div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-2xl font-bold">${mood.intensity}/10</div>
            <button class="delete-mood text-gray-500 hover:text-red-400 transition-colors" data-id="${mood.id}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        ${mood.notes ? `<div class="mt-3 text-gray-300 text-sm border-t border-gray-700 pt-3">${escapeHtml(mood.notes)}</div>` : ''}
      </div>
    `).join('');
    
    if (append) {
      container.insertAdjacentHTML('beforeend', moodsHtml);
    } else {
      container.innerHTML = moodsHtml;
    }
    
    // Show/hide load more button
    if (data.moods.length === HISTORY_LIMIT) {
      loadMoreContainer.classList.remove('hidden');
    } else {
      loadMoreContainer.classList.add('hidden');
    }
    
    // Add delete handlers
    document.querySelectorAll('.delete-mood').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (confirm('Delete this mood entry?')) {
          try {
            await api(`/api/moods/${id}`, { method: 'DELETE' });
            document.querySelector(`[data-mood-id="${id}"]`).remove();
          } catch (err) {
            alert('Failed to delete: ' + err.message);
          }
        }
      });
    });
  } catch (err) {
    console.error('History load error:', err);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Load more handler
const loadMoreBtn = document.getElementById('loadMoreBtn');
if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', () => {
    historyOffset += HISTORY_LIMIT;
    loadHistory(true);
  });
}

// Calendar functions
let currentMonth = new Date();
let calendarMoods = [];

async function initCalendar() {
  await loadCalendarMoods();
  renderCalendar();
  
  document.getElementById('prevMonth').addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    loadCalendarMoods().then(renderCalendar);
  });
  
  document.getElementById('nextMonth').addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    loadCalendarMoods().then(renderCalendar);
  });
}

async function loadCalendarMoods() {
  const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);
  
  try {
    const data = await api(`/api/moods?start_date=${start.toISOString()}&end_date=${end.toISOString()}`);
    calendarMoods = data.moods;
  } catch (err) {
    console.error('Calendar load error:', err);
    calendarMoods = [];
  }
}

function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  // Update title
  document.getElementById('calendarTitle').textContent = 
    currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  // Get first day and days in month
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Group moods by date
  const moodsByDate = {};
  calendarMoods.forEach(mood => {
    const date = new Date(mood.logged_at).getDate();
    if (!moodsByDate[date]) moodsByDate[date] = [];
    moodsByDate[date].push(mood);
  });
  
  // Build calendar grid
  let html = '';
  
  // Empty cells for days before first day
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="aspect-square"></div>';
  }
  
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const moods = moodsByDate[day] || [];
    let bgColor = 'bg-gray-700';
    let emoji = '';
    
    if (moods.length > 0) {
      // Get dominant emotion
      const avgIntensity = moods.reduce((sum, m) => sum + m.intensity, 0) / moods.length;
      const lastMood = moods[moods.length - 1];
      
      // Color based on emotion category
      const positive = ['happy', 'calm', 'peaceful', 'energetic'];
      const negative = ['sad', 'anxious', 'angry', 'tired'];
      
      if (positive.includes(lastMood.emotion)) {
        bgColor = 'bg-green-500/50';
      } else if (negative.includes(lastMood.emotion)) {
        bgColor = 'bg-red-500/50';
      } else {
        bgColor = 'bg-yellow-500/50';
      }
      
      emoji = EMOTION_EMOJI[lastMood.emotion] || '';
    }
    
    const isToday = day === new Date().getDate() && 
                    month === new Date().getMonth() && 
                    year === new Date().getFullYear();
    
    html += `
      <div class="aspect-square ${bgColor} rounded-lg flex flex-col items-center justify-center text-sm
        ${isToday ? 'ring-2 ring-blue-500' : ''}
        ${moods.length > 0 ? 'cursor-pointer hover:opacity-80' : ''}" 
        ${moods.length > 0 ? `title="${moods.length} mood(s) logged"` : ''}>
        <div class="${isToday ? 'font-bold' : ''}">${day}</div>
        ${emoji ? `<div class="text-lg">${emoji}</div>` : ''}
      </div>
    `;
  }
  
  document.getElementById('calendar-grid').innerHTML = html;
}
