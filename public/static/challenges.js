// Challenges Page - Phase 4 Gamification
'use strict';

const ChallengesPage = {
  challenges: [],
  activeChallenges: [],
  history: [],
  view: 'available', // 'available', 'active', 'history'
  
  async init() {
    await this.loadChallenges();
    this.render();
    this.setupEventListeners();
  },
  
  async loadChallenges() {
    try {
      const [allRes, activeRes, historyRes] = await Promise.all([
        fetch('/api/challenges', { credentials: 'include' }),
        fetch('/api/challenges/active', { credentials: 'include' }),
        fetch('/api/challenges/history', { credentials: 'include' }),
      ]);
      
      const [allData, activeData, historyData] = await Promise.all([
        allRes.json(),
        activeRes.json(),
        historyRes.json(),
      ]);
      
      this.challenges = allData.challenges || [];
      this.activeChallenges = activeData.challenges || [];
      this.history = historyData.challenges || [];
    } catch (error) {
      console.error('Error loading challenges:', error);
      this.showError('Failed to load challenges');
    }
  },
  
  render() {
    const container = document.getElementById('challenges-container');
    if (!container) return;
    
    const typeIcons = { daily: '📅', weekly: '📆', monthly: '🗓️', group: '👥' };
    
    container.innerHTML = `
      <!-- Tabs -->
      <div class="flex gap-2 mb-6 border-b border-gray-700 pb-4">
        <button class="tab-btn px-6 py-2 rounded-lg font-medium transition-colors
          ${this.view === 'available' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
          data-view="available">
          Available
        </button>
        <button class="tab-btn px-6 py-2 rounded-lg font-medium transition-colors
          ${this.view === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
          data-view="active">
          Active (${this.activeChallenges.length})
        </button>
        <button class="tab-btn px-6 py-2 rounded-lg font-medium transition-colors
          ${this.view === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
          data-view="history">
          Completed
        </button>
      </div>
      
      ${this.view === 'available' ? this.renderAvailable(typeIcons) : ''}
      ${this.view === 'active' ? this.renderActive(typeIcons) : ''}
      ${this.view === 'history' ? this.renderHistory(typeIcons) : ''}
    `;
  },
  
  renderAvailable(typeIcons) {
    const available = this.challenges.filter(c => !c.joined_at);
    
    if (available.length === 0) {
      return `
        <div class="text-center text-gray-400 py-12">
          <div class="text-4xl mb-4">🎯</div>
          <p>You've joined all available challenges!</p>
        </div>
      `;
    }
    
    return `
      <div class="grid gap-4">
        ${available.map(ch => `
          <div class="bg-gray-800 rounded-xl p-4 hover:bg-gray-750 transition-colors">
            <div class="flex items-center gap-4">
              <div class="text-3xl">${ch.icon || typeIcons[ch.type]}</div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-bold text-white">${ch.name}</h3>
                  <span class="px-2 py-0.5 rounded text-xs bg-gray-600 text-gray-300 capitalize">${ch.type}</span>
                </div>
                <p class="text-gray-400 text-sm mb-2">${ch.description}</p>
                <div class="flex items-center gap-4">
                  <span class="text-yellow-400 font-medium">+${ch.reward_points} pts</span>
                  <span class="text-gray-400 text-sm">Goal: ${ch.goal_value}</span>
                  ${ch.end_date ? `<span class="text-gray-400 text-sm">Ends: ${new Date(ch.end_date).toLocaleDateString()}</span>` : ''}
                </div>
              </div>
              <button class="join-btn px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-medium"
                data-id="${ch.id}">
                Join
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },
  
  renderActive(typeIcons) {
    if (this.activeChallenges.length === 0) {
      return `
        <div class="text-center text-gray-400 py-12">
          <div class="text-4xl mb-4">🎯</div>
          <p>No active challenges. Join some from the Available tab!</p>
        </div>
      `;
    }
    
    return `
      <div class="grid gap-4">
        ${this.activeChallenges.map(ch => {
          const progress = Math.min((ch.progress / ch.goal_value) * 100, 100);
          return `
            <div class="bg-gray-800 rounded-xl p-4">
              <div class="flex items-center gap-4 mb-3">
                <div class="text-3xl">${ch.icon || typeIcons[ch.type]}</div>
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-bold text-white">${ch.name}</h3>
                    <span class="px-2 py-0.5 rounded text-xs bg-gray-600 text-gray-300 capitalize">${ch.type}</span>
                  </div>
                  <p class="text-gray-400 text-sm">${ch.description}</p>
                </div>
                <span class="text-yellow-400 font-bold">+${ch.reward_points} pts</span>
              </div>
              
              <div class="relative">
                <div class="bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div class="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full transition-all duration-500"
                    style="width: ${progress}%"></div>
                </div>
                <div class="flex justify-between mt-2 text-sm">
                  <span class="text-gray-400">Progress</span>
                  <span class="text-white font-medium">${ch.progress} / ${ch.goal_value}</span>
                </div>
              </div>
              
              ${ch.end_date ? `
                <div class="mt-3 text-sm text-gray-400">
                  ⏰ Ends ${new Date(ch.end_date).toLocaleDateString()}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  },
  
  renderHistory(typeIcons) {
    if (this.history.length === 0) {
      return `
        <div class="text-center text-gray-400 py-12">
          <div class="text-4xl mb-4">📜</div>
          <p>No completed challenges yet. Keep going!</p>
        </div>
      `;
    }
    
    return `
      <div class="grid gap-4">
        ${this.history.map(ch => `
          <div class="bg-gray-800 rounded-xl p-4 border-2 border-green-500/50">
            <div class="flex items-center gap-4">
              <div class="text-3xl">${ch.icon || typeIcons[ch.type]}</div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-bold text-white">${ch.name}</h3>
                  <span class="text-green-400">✓ Completed</span>
                </div>
                <p class="text-gray-400 text-sm">${ch.description}</p>
                <div class="text-sm text-gray-400 mt-1">
                  Completed on ${new Date(ch.completed_at).toLocaleDateString()}
                </div>
              </div>
              <span class="text-yellow-400 font-bold">+${ch.reward_points} pts</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },
  
  setupEventListeners() {
    document.addEventListener('click', async (e) => {
      const tabBtn = e.target.closest('.tab-btn');
      if (tabBtn) {
        this.view = tabBtn.dataset.view;
        this.render();
        this.setupEventListeners();
        return;
      }
      
      const joinBtn = e.target.closest('.join-btn');
      if (joinBtn) {
        await this.joinChallenge(joinBtn.dataset.id);
      }
    });
  },
  
  async joinChallenge(id) {
    try {
      const response = await fetch(`/api/challenges/${id}/join`, {
        method: 'POST',
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join challenge');
      }
      
      this.showToast(`Joined: ${data.challenge.name}`, 'success');
      await this.loadChallenges();
      this.view = 'active';
      this.render();
      this.setupEventListeners();
    } catch (error) {
      console.error('Error joining challenge:', error);
      this.showToast(error.message, 'error');
    }
  },
  
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-lg z-50 animate-slide-up
      ${type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'} text-white`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
  },
  
  showError(message) {
    const container = document.getElementById('challenges-container');
    if (container) {
      container.innerHTML = `
        <div class="text-center text-red-400 py-12">
          <div class="text-4xl mb-4">⚠️</div>
          <p>${message}</p>
          <button onclick="ChallengesPage.init()" class="mt-4 px-6 py-2 bg-blue-600 rounded-lg text-white">
            Retry
          </button>
        </div>
      `;
    }
  }
};

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ChallengesPage.init());
} else {
  ChallengesPage.init();
}
