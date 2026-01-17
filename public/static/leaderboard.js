// Leaderboard Page - Phase 4 Gamification
'use strict';

const LeaderboardPage = {
  leaderboard: [],
  userRank: null,
  view: 'global', // 'global', 'friends', 'streaks'
  period: 'all', // 'all', 'weekly', 'monthly'
  
  async init() {
    await this.loadLeaderboard();
    this.render();
    this.setupEventListeners();
  },
  
  async loadLeaderboard() {
    try {
      let url = `/api/leaderboard/${this.view}`;
      if (this.view === 'global') {
        url += `?period=${this.period}`;
      }
      
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load leaderboard');
      
      const data = await response.json();
      this.leaderboard = data.leaderboard || [];
      this.userRank = data.user_rank;
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      this.showError('Failed to load leaderboard');
    }
  },
  
  render() {
    const container = document.getElementById('leaderboard-container');
    if (!container) return;
    
    const rankIcons = ['🥇', '🥈', '🥉'];
    
    container.innerHTML = `
      <!-- View Tabs -->
      <div class="flex gap-2 mb-6">
        <button class="view-btn px-6 py-2 rounded-lg font-medium transition-colors
          ${this.view === 'global' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
          data-view="global">
          🌍 Global
        </button>
        <button class="view-btn px-6 py-2 rounded-lg font-medium transition-colors
          ${this.view === 'friends' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
          data-view="friends">
          👥 Friends
        </button>
        <button class="view-btn px-6 py-2 rounded-lg font-medium transition-colors
          ${this.view === 'streaks' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
          data-view="streaks">
          🔥 Streaks
        </button>
      </div>
      
      <!-- Period Filter (for global only) -->
      ${this.view === 'global' ? `
        <div class="flex gap-2 mb-6">
          <button class="period-btn px-4 py-1 rounded-lg text-sm transition-colors
            ${this.period === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
            data-period="all">
            All Time
          </button>
          <button class="period-btn px-4 py-1 rounded-lg text-sm transition-colors
            ${this.period === 'monthly' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
            data-period="monthly">
            This Month
          </button>
          <button class="period-btn px-4 py-1 rounded-lg text-sm transition-colors
            ${this.period === 'weekly' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
            data-period="weekly">
            This Week
          </button>
        </div>
      ` : ''}
      
      <!-- Your Rank -->
      ${this.userRank ? `
        <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 mb-6">
          <div class="flex items-center gap-4">
            <div class="text-3xl font-bold text-white">#${this.userRank}</div>
            <div class="text-white">Your current rank</div>
          </div>
        </div>
      ` : ''}
      
      <!-- Leaderboard List -->
      <div class="bg-gray-800 rounded-xl overflow-hidden">
        ${this.leaderboard.length === 0 ? `
          <div class="text-center text-gray-400 py-12">
            <div class="text-4xl mb-4">📊</div>
            <p>No rankings available yet</p>
          </div>
        ` : `
          <div class="divide-y divide-gray-700">
            ${this.leaderboard.map((entry, index) => `
              <div class="flex items-center gap-4 p-4 ${index < 3 ? 'bg-gray-750' : ''} hover:bg-gray-700 transition-colors">
                <div class="w-12 text-center">
                  ${index < 3 
                    ? `<span class="text-2xl">${rankIcons[index]}</span>`
                    : `<span class="text-lg font-bold text-gray-400">${index + 1}</span>`
                  }
                </div>
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  ${entry.avatar_url 
                    ? `<img src="${entry.avatar_url}" alt="${entry.display_name || entry.name}" class="w-full h-full rounded-full object-cover">`
                    : (entry.display_name || entry.name || entry.email || '?').charAt(0).toUpperCase()
                  }
                </div>
                <div class="flex-1">
                  <div class="font-medium text-white">${entry.display_name || entry.name || entry.email?.split('@')[0]}</div>
                  <div class="flex items-center gap-2 text-sm">
                    <span class="px-2 py-0.5 rounded bg-gray-700 text-gray-300">${entry.level_name || 'Bronze'}</span>
                  </div>
                </div>
                <div class="text-right">
                  ${this.view === 'streaks' ? `
                    <div class="text-2xl font-bold text-orange-400">🔥 ${entry.current_streak}</div>
                    <div class="text-sm text-gray-400">Best: ${entry.longest_streak}</div>
                  ` : `
                    <div class="text-2xl font-bold text-yellow-400">${entry.points?.toLocaleString()}</div>
                    <div class="text-sm text-gray-400">points</div>
                  `}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
      
      <!-- Privacy Notice -->
      <div class="mt-6 text-center text-sm text-gray-500">
        <p>📋 Only users who opted-in appear on leaderboards</p>
        <a href="/settings" class="text-blue-400 hover:underline">Manage your visibility</a>
      </div>
    `;
  },
  
  setupEventListeners() {
    document.addEventListener('click', async (e) => {
      const viewBtn = e.target.closest('.view-btn');
      if (viewBtn) {
        const newView = viewBtn.dataset.view;
        if (newView === 'streaks') {
          // Fetch streaks leaderboard
          try {
            const response = await fetch('/api/streaks/leaderboard', { credentials: 'include' });
            const data = await response.json();
            this.leaderboard = data.leaderboard || [];
            this.userRank = null;
          } catch (error) {
            console.error('Error loading streaks:', error);
          }
        }
        this.view = newView;
        if (this.view !== 'streaks') {
          await this.loadLeaderboard();
        }
        this.render();
        this.setupEventListeners();
        return;
      }
      
      const periodBtn = e.target.closest('.period-btn');
      if (periodBtn) {
        this.period = periodBtn.dataset.period;
        await this.loadLeaderboard();
        this.render();
        this.setupEventListeners();
      }
    });
  },
  
  showError(message) {
    const container = document.getElementById('leaderboard-container');
    if (container) {
      container.innerHTML = `
        <div class="text-center text-red-400 py-12">
          <div class="text-4xl mb-4">⚠️</div>
          <p>${message}</p>
          <button onclick="LeaderboardPage.init()" class="mt-4 px-6 py-2 bg-blue-600 rounded-lg text-white">
            Retry
          </button>
        </div>
      `;
    }
  }
};

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => LeaderboardPage.init());
} else {
  LeaderboardPage.init();
}
