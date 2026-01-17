// Gamification Widget - Dashboard Integration
'use strict';

const GamificationWidget = {
  stats: null,
  
  async init() {
    const container = document.getElementById('gamification-widget');
    if (!container) return;
    
    await this.loadStats();
    this.render(container);
  },
  
  async loadStats() {
    try {
      const response = await fetch('/api/gamification/stats', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load stats');
      this.stats = await response.json();
    } catch (error) {
      console.error('Error loading gamification stats:', error);
      this.stats = null;
    }
  },
  
  render(container) {
    if (!this.stats) {
      container.innerHTML = '';
      return;
    }
    
    const { points, streak, achievements, active_challenges, showcased_badges } = this.stats;
    
    container.innerHTML = `
      <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-white">Your Progress</h3>
          <a href="/achievements" class="text-blue-400 hover:underline text-sm">View All →</a>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <!-- Level -->
          <div class="bg-gray-700/50 rounded-lg p-3 text-center">
            <div class="text-2xl font-bold text-yellow-400">${points.level_name}</div>
            <div class="text-gray-400 text-xs">Level ${points.level}</div>
            <div class="mt-2 bg-gray-600 rounded-full h-1.5">
              <div class="bg-yellow-400 rounded-full h-1.5" style="width: ${points.progress}%"></div>
            </div>
          </div>
          
          <!-- Points -->
          <div class="bg-gray-700/50 rounded-lg p-3 text-center">
            <div class="text-2xl font-bold text-blue-400">${points.total.toLocaleString()}</div>
            <div class="text-gray-400 text-xs">Total Points</div>
          </div>
          
          <!-- Streak -->
          <div class="bg-gray-700/50 rounded-lg p-3 text-center">
            <div class="text-2xl font-bold text-orange-400">🔥 ${streak.current}</div>
            <div class="text-gray-400 text-xs">Day Streak</div>
          </div>
          
          <!-- Achievements -->
          <div class="bg-gray-700/50 rounded-lg p-3 text-center">
            <div class="text-2xl font-bold text-green-400">${achievements.completed}/${achievements.total}</div>
            <div class="text-gray-400 text-xs">Achievements</div>
          </div>
        </div>
        
        <!-- Showcased Badges -->
        ${showcased_badges.length > 0 ? `
          <div class="flex items-center gap-2 mb-4">
            <span class="text-gray-400 text-sm">Badges:</span>
            ${showcased_badges.map(b => `
              <span class="text-2xl" title="${b.name}">${b.icon}</span>
            `).join('')}
          </div>
        ` : ''}
        
        <!-- Active Challenges -->
        ${active_challenges > 0 ? `
          <div class="flex items-center justify-between bg-gray-700/30 rounded-lg p-3">
            <span class="text-gray-300">Active Challenges</span>
            <a href="/challenges" class="flex items-center gap-2 text-blue-400 hover:underline">
              ${active_challenges} in progress →
            </a>
          </div>
        ` : ''}
      </div>
    `;
  },
  
  // Show achievement unlock notification
  showUnlockNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-yellow-600 to-orange-500 rounded-xl p-4 shadow-2xl z-50 animate-slide-down';
    notification.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="text-4xl achievement-unlock-animation">${achievement.icon}</div>
        <div>
          <div class="text-white font-bold">Achievement Unlocked!</div>
          <div class="text-yellow-100">${achievement.name}</div>
          <div class="text-yellow-200 text-sm">+${achievement.points} points</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Play sound if available
    try {
      const audio = new Audio('/static/sounds/achievement.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {}
    
    setTimeout(() => {
      notification.classList.add('animate-fade-out');
      setTimeout(() => notification.remove(), 500);
    }, 4000);
  },
  
  // Show challenge completion notification
  showChallengeNotification(challenge) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-600 to-teal-500 rounded-xl p-4 shadow-2xl z-50 animate-slide-down';
    notification.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="text-4xl">🎯</div>
        <div>
          <div class="text-white font-bold">Challenge Completed!</div>
          <div class="text-green-100">${challenge.name}</div>
          <div class="text-green-200 text-sm">+${challenge.points} points</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('animate-fade-out');
      setTimeout(() => notification.remove(), 500);
    }, 4000);
  },
  
  // Show streak notification
  showStreakNotification(streak) {
    if (!streak.isNew || streak.current <= 1) return;
    
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 shadow-2xl z-50 animate-slide-down';
    notification.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="text-4xl">🔥</div>
        <div>
          <div class="text-white font-bold">${streak.current} Day Streak!</div>
          <div class="text-orange-100">Keep it going!</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('animate-fade-out');
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  }
};

// Handle gamification responses from mood logging
window.handleGamificationResponse = function(gamification) {
  if (!gamification) return;
  
  // Show streak notification
  if (gamification.streak) {
    GamificationWidget.showStreakNotification(gamification.streak);
  }
  
  // Show achievement notifications
  if (gamification.new_achievements && gamification.new_achievements.length > 0) {
    gamification.new_achievements.forEach((ach, i) => {
      setTimeout(() => GamificationWidget.showUnlockNotification(ach), i * 1000);
    });
  }
  
  // Show challenge notifications
  if (gamification.completed_challenges && gamification.completed_challenges.length > 0) {
    const offset = (gamification.new_achievements?.length || 0) * 1000;
    gamification.completed_challenges.forEach((ch, i) => {
      setTimeout(() => GamificationWidget.showChallengeNotification(ch), offset + i * 1000);
    });
  }
  
  // Refresh widget
  GamificationWidget.init();
};

// Initialize widget on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => GamificationWidget.init());
} else {
  GamificationWidget.init();
}
