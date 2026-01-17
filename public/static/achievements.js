// Achievements Page - Phase 4 Gamification
'use strict';

const AchievementsPage = {
  achievements: [],
  stats: { total: 0, completed: 0, points_earned: 0 },
  filter: 'all',
  
  async init() {
    await this.loadAchievements();
    this.render();
    this.setupEventListeners();
  },
  
  async loadAchievements() {
    try {
      const response = await fetch('/api/achievements/user', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load achievements');
      
      const data = await response.json();
      this.achievements = data.achievements || [];
      this.stats = data.stats || { total: 0, completed: 0, points_earned: 0 };
    } catch (error) {
      console.error('Error loading achievements:', error);
      this.showError('Failed to load achievements');
    }
  },
  
  render() {
    const container = document.getElementById('achievements-container');
    if (!container) return;
    
    const categories = ['all', 'milestone', 'streak', 'social', 'exploration', 'voice', 'engagement'];
    const filtered = this.filter === 'all' 
      ? this.achievements 
      : this.achievements.filter(a => a.category === this.filter);
    
    const rarityColors = {
      common: 'bg-gray-600',
      rare: 'bg-blue-600',
      epic: 'bg-purple-600',
      legendary: 'bg-yellow-600',
    };
    
    container.innerHTML = `
      <!-- Stats Header -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-gray-800 rounded-xl p-4 text-center">
          <div class="text-3xl font-bold text-green-400">${this.stats.completed}</div>
          <div class="text-gray-400 text-sm">Unlocked</div>
        </div>
        <div class="bg-gray-800 rounded-xl p-4 text-center">
          <div class="text-3xl font-bold text-blue-400">${this.stats.total}</div>
          <div class="text-gray-400 text-sm">Total</div>
        </div>
        <div class="bg-gray-800 rounded-xl p-4 text-center">
          <div class="text-3xl font-bold text-yellow-400">${this.stats.points_earned}</div>
          <div class="text-gray-400 text-sm">Points Earned</div>
        </div>
      </div>
      
      <!-- Category Filter -->
      <div class="flex flex-wrap gap-2 mb-6">
        ${categories.map(cat => `
          <button class="filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${this.filter === cat ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
            data-filter="${cat}">
            ${cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        `).join('')}
      </div>
      
      <!-- Achievements Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${filtered.map(ach => `
          <div class="achievement-card bg-gray-800 rounded-xl p-4 ${ach.completed ? 'border-2 border-green-500' : 'opacity-60'}
            hover:scale-[1.02] transition-transform cursor-pointer" data-id="${ach.id}">
            <div class="flex items-start gap-4">
              <div class="text-4xl ${ach.completed ? '' : 'grayscale'}">${ach.icon}</div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-bold text-white">${ach.name}</h3>
                  <span class="px-2 py-0.5 rounded text-xs ${rarityColors[ach.rarity]} text-white">
                    ${ach.rarity}
                  </span>
                </div>
                <p class="text-gray-400 text-sm mb-2">${ach.description}</p>
                <div class="flex items-center gap-4">
                  <span class="text-yellow-400 text-sm font-medium">+${ach.points} pts</span>
                  ${ach.completed 
                    ? `<span class="text-green-400 text-sm">✓ Unlocked ${new Date(ach.unlocked_at).toLocaleDateString()}</span>`
                    : `<div class="flex-1 bg-gray-700 rounded-full h-2">
                        <div class="bg-blue-500 rounded-full h-2" style="width: ${Math.min((ach.progress || 0) / ach.criteria_value * 100, 100)}%"></div>
                      </div>
                      <span class="text-gray-400 text-sm">${ach.progress || 0}/${ach.criteria_value}</span>`
                  }
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      ${filtered.length === 0 ? `
        <div class="text-center text-gray-400 py-12">
          <div class="text-4xl mb-4">🏆</div>
          <p>No achievements in this category yet</p>
        </div>
      ` : ''}
    `;
  },
  
  setupEventListeners() {
    document.addEventListener('click', (e) => {
      const filterBtn = e.target.closest('.filter-btn');
      if (filterBtn) {
        this.filter = filterBtn.dataset.filter;
        this.render();
        this.setupEventListeners();
      }
      
      const achievementCard = e.target.closest('.achievement-card');
      if (achievementCard) {
        this.showAchievementDetails(achievementCard.dataset.id);
      }
    });
  },
  
  async showAchievementDetails(id) {
    const ach = this.achievements.find(a => a.id == id);
    if (!ach) return;
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-gray-800 rounded-2xl p-6 max-w-md w-full achievement-modal">
        <div class="text-center mb-6">
          <div class="text-6xl mb-4 ${ach.completed ? 'achievement-unlock-animation' : 'grayscale'}">${ach.icon}</div>
          <h2 class="text-2xl font-bold text-white mb-2">${ach.name}</h2>
          <p class="text-gray-400">${ach.description}</p>
        </div>
        
        <div class="bg-gray-700 rounded-xl p-4 mb-6">
          <div class="flex justify-between mb-2">
            <span class="text-gray-400">Rarity</span>
            <span class="text-white capitalize">${ach.rarity}</span>
          </div>
          <div class="flex justify-between mb-2">
            <span class="text-gray-400">Category</span>
            <span class="text-white capitalize">${ach.category}</span>
          </div>
          <div class="flex justify-between mb-2">
            <span class="text-gray-400">Points</span>
            <span class="text-yellow-400">+${ach.points}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Progress</span>
            <span class="text-white">${ach.progress || 0} / ${ach.criteria_value}</span>
          </div>
        </div>
        
        ${ach.completed 
          ? `<div class="text-center text-green-400 mb-4">
              ✓ Unlocked on ${new Date(ach.unlocked_at).toLocaleDateString()}
            </div>` 
          : ''}
        
        <button class="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium close-modal">
          Close
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('close-modal')) {
        modal.remove();
      }
    });
  },
  
  showError(message) {
    const container = document.getElementById('achievements-container');
    if (container) {
      container.innerHTML = `
        <div class="text-center text-red-400 py-12">
          <div class="text-4xl mb-4">⚠️</div>
          <p>${message}</p>
          <button onclick="AchievementsPage.init()" class="mt-4 px-6 py-2 bg-blue-600 rounded-lg text-white">
            Retry
          </button>
        </div>
      `;
    }
  }
};

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AchievementsPage.init());
} else {
  AchievementsPage.init();
}
