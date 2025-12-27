/**
 * Gamification Dashboard
 * Streaks, Achievements, Points, Levels, and Rewards
 */

class GamificationDashboard {
  constructor() {
    this.streaks = [];
    this.achievements = [];
    this.unlockedAchievements = [];
    this.points = [];
    this.init();
  }

  async init() {
    this.render();
    await Promise.all([
      this.loadStreaks(),
      this.loadAchievements(),
      this.loadPoints()
    ]);
  }

  render() {
    const container = document.getElementById('app');
    container.innerHTML = `
      <div class="max-w-7xl mx-auto py-8 px-4">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-5xl font-bold text-gray-800 mb-4">
            <i class="fas fa-trophy text-yellow-500"></i>
            Achievements & Progress
          </h1>
          <p class="text-gray-600 text-xl">
            Track your wellness journey and unlock rewards
          </p>
        </div>

        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-2">
              <i class="fas fa-fire text-4xl opacity-80"></i>
              <span id="longest-streak" class="text-5xl font-bold">0</span>
            </div>
            <p class="text-purple-100 text-sm">Longest Streak</p>
          </div>

          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-2">
              <i class="fas fa-award text-4xl opacity-80"></i>
              <span id="achievement-count" class="text-5xl font-bold">0</span>
            </div>
            <p class="text-blue-100 text-sm">Achievements</p>
          </div>

          <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-2">
              <i class="fas fa-star text-4xl opacity-80"></i>
              <span id="total-points" class="text-5xl font-bold">0</span>
            </div>
            <p class="text-green-100 text-sm">Total XP</p>
          </div>

          <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-2">
              <i class="fas fa-level-up-alt text-4xl opacity-80"></i>
              <span id="user-level" class="text-5xl font-bold">1</span>
            </div>
            <p class="text-orange-100 text-sm">Current Level</p>
          </div>
        </div>

        <!-- Streaks Section -->
        <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center">
            <i class="fas fa-fire text-orange-500 mr-3"></i>
            Your Streaks
          </h2>
          <div id="streaks-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="text-center py-8 text-gray-500">
              <i class="fas fa-spinner fa-spin text-3xl mb-3"></i>
              <p>Loading streaks...</p>
            </div>
          </div>
        </div>

        <!-- Level Progress -->
        <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center">
            <i class="fas fa-chart-line text-green-500 mr-3"></i>
            Level Progress
          </h2>
          <div id="level-progress-container">
            <div class="text-center py-8 text-gray-500">
              <i class="fas fa-spinner fa-spin text-3xl mb-3"></i>
              <p>Loading progress...</p>
            </div>
          </div>
        </div>

        <!-- Achievements Section -->
        <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center">
            <i class="fas fa-medal text-yellow-500 mr-3"></i>
            Achievements
          </h2>
          
          <!-- Achievement Categories -->
          <div class="flex gap-2 mb-6 overflow-x-auto">
            <button onclick="gamificationDashboard.filterAchievements('all')" id="filter-all" 
              class="achievement-filter px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
              All
            </button>
            <button onclick="gamificationDashboard.filterAchievements('streak')" id="filter-streak" 
              class="achievement-filter px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
              Streaks
            </button>
            <button onclick="gamificationDashboard.filterAchievements('social')" id="filter-social" 
              class="achievement-filter px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
              Social
            </button>
            <button onclick="gamificationDashboard.filterAchievements('wellness')" id="filter-wellness" 
              class="achievement-filter px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
              Wellness
            </button>
            <button onclick="gamificationDashboard.filterAchievements('ar')" id="filter-ar" 
              class="achievement-filter px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
              AR
            </button>
            <button onclick="gamificationDashboard.filterAchievements('voice')" id="filter-voice" 
              class="achievement-filter px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
              Voice
            </button>
          </div>

          <div id="achievements-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="text-center py-8 text-gray-500">
              <i class="fas fa-spinner fa-spin text-3xl mb-3"></i>
              <p>Loading achievements...</p>
            </div>
          </div>
        </div>

        <!-- Motivational Section -->
        <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-8 mb-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-4 text-center">
            <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
            Keep Going!
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white rounded-lg p-6 text-center">
              <div class="text-4xl mb-3">🎯</div>
              <h3 class="font-bold text-gray-800 mb-2">Daily Goals</h3>
              <p class="text-sm text-gray-600">Log your mood daily to maintain your streak</p>
            </div>
            <div class="bg-white rounded-lg p-6 text-center">
              <div class="text-4xl mb-3">🚀</div>
              <h3 class="font-bold text-gray-800 mb-2">Level Up</h3>
              <p class="text-sm text-gray-600">Earn XP through activities and achievements</p>
            </div>
            <div class="bg-white rounded-lg p-6 text-center">
              <div class="text-4xl mb-3">🏆</div>
              <h3 class="font-bold text-gray-800 mb-2">Unlock Rewards</h3>
              <p class="text-sm text-gray-600">Earn badges and special features</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async loadStreaks() {
    try {
      const response = await axios.get('/api/gamification/streaks', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('session_token')}` }
      });

      if (response.data.success) {
        this.streaks = response.data.streaks;
        this.renderStreaks();
        this.updateStats();
      }
    } catch (error) {
      console.error('Failed to load streaks:', error);
      document.getElementById('streaks-container').innerHTML = `
        <div class="col-span-4 text-center py-8 text-gray-500">
          <i class="fas fa-exclamation-circle text-3xl mb-3"></i>
          <p>Failed to load streaks</p>
        </div>
      `;
    }
  }

  renderStreaks() {
    const container = document.getElementById('streaks-container');

    if (this.streaks.length === 0) {
      container.innerHTML = `
        <div class="col-span-4 text-center py-8 text-gray-500">
          <i class="fas fa-fire text-4xl mb-3"></i>
          <p class="mb-4">No active streaks yet</p>
          <p class="text-sm">Start logging your mood daily to build your first streak!</p>
        </div>
      `;
      return;
    }

    const streakIcons = {
      'daily_log': 'fa-calendar-check',
      'activity': 'fa-running',
      'voice_journal': 'fa-microphone',
      'meditation': 'fa-spa'
    };

    const streakColors = {
      'daily_log': 'from-blue-500 to-blue-600',
      'activity': 'from-green-500 to-green-600',
      'voice_journal': 'from-purple-500 to-purple-600',
      'meditation': 'from-indigo-500 to-indigo-600'
    };

    container.innerHTML = this.streaks.map(streak => `
      <div class="bg-gradient-to-br ${streakColors[streak.streak_type] || 'from-gray-500 to-gray-600'} rounded-xl shadow-lg p-6 text-white">
        <div class="flex items-center justify-between mb-4">
          <i class="fas ${streakIcons[streak.streak_type] || 'fa-fire'} text-3xl opacity-80"></i>
          <div class="text-right">
            <div class="text-4xl font-bold">${streak.current_streak}</div>
            <div class="text-sm opacity-75">days</div>
          </div>
        </div>
        <h3 class="font-bold text-lg mb-1">${this.formatStreakType(streak.streak_type)}</h3>
        <p class="text-sm opacity-75">Best: ${streak.longest_streak} days</p>
        
        <!-- Streak Progress Bar -->
        <div class="mt-4">
          <div class="flex justify-between text-xs opacity-75 mb-1">
            <span>Current</span>
            <span>Next: ${this.getNextMilestone(streak.current_streak)} days</span>
          </div>
          <div class="w-full bg-white bg-opacity-20 rounded-full h-2">
            <div class="bg-white rounded-full h-2 transition-all" 
              style="width: ${this.getStreakProgress(streak.current_streak)}%"></div>
          </div>
        </div>
      </div>
    `).join('');
  }

  formatStreakType(type) {
    const names = {
      'daily_log': 'Daily Mood Log',
      'activity': 'Wellness Activities',
      'voice_journal': 'Voice Journal',
      'meditation': 'Meditation'
    };
    return names[type] || type;
  }

  getNextMilestone(current) {
    const milestones = [7, 30, 100, 365];
    return milestones.find(m => m > current) || current + 1;
  }

  getStreakProgress(current) {
    const next = this.getNextMilestone(current);
    const prev = [0, 7, 30, 100, 365].reverse().find(m => m <= current) || 0;
    return Math.min(((current - prev) / (next - prev)) * 100, 100);
  }

  async loadAchievements() {
    try {
      const response = await axios.get('/api/gamification/achievements', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('session_token')}` }
      });

      if (response.data.success) {
        this.unlockedAchievements = response.data.unlocked || [];
        this.achievements = response.data.all || [];
        this.renderAchievements();
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
      document.getElementById('achievements-container').innerHTML = `
        <div class="col-span-3 text-center py-8 text-gray-500">
          <i class="fas fa-exclamation-circle text-3xl mb-3"></i>
          <p>Failed to load achievements</p>
        </div>
      `;
    }
  }

  renderAchievements(filter = 'all') {
    const container = document.getElementById('achievements-container');
    
    // Update filter buttons
    document.querySelectorAll('.achievement-filter').forEach(btn => {
      btn.classList.remove('bg-purple-600', 'text-white');
      btn.classList.add('bg-gray-200', 'text-gray-700');
    });
    document.getElementById(`filter-${filter}`).classList.remove('bg-gray-200', 'text-gray-700');
    document.getElementById(`filter-${filter}`).classList.add('bg-purple-600', 'text-white');

    let filteredAchievements = this.achievements;
    if (filter !== 'all') {
      filteredAchievements = this.achievements.filter(a => a.category === filter);
    }

    if (filteredAchievements.length === 0) {
      container.innerHTML = `
        <div class="col-span-3 text-center py-8 text-gray-500">
          <i class="fas fa-medal text-4xl mb-3"></i>
          <p>No achievements in this category yet</p>
        </div>
      `;
      return;
    }

    const unlockedKeys = this.unlockedAchievements.map(a => a.achievement_key);

    container.innerHTML = filteredAchievements.map(achievement => {
      const isUnlocked = unlockedKeys.includes(achievement.achievement_key);
      const unlocked = this.unlockedAchievements.find(a => a.achievement_key === achievement.achievement_key);

      return `
        <div class="border-2 ${isUnlocked ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-gray-50'} rounded-xl p-6 transition-all hover:shadow-lg ${isUnlocked ? '' : 'opacity-60'}">
          <div class="flex items-start justify-between mb-4">
            <div class="w-16 h-16 rounded-full ${isUnlocked ? 'bg-yellow-400' : 'bg-gray-300'} flex items-center justify-center text-3xl">
              ${isUnlocked ? '🏆' : '🔒'}
            </div>
            ${isUnlocked ? '<div class="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">UNLOCKED</div>' : ''}
          </div>
          
          <h3 class="font-bold text-lg text-gray-800 mb-2">${achievement.name}</h3>
          <p class="text-sm text-gray-600 mb-4">${achievement.description}</p>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="fas fa-star text-yellow-500"></i>
              <span class="text-sm font-semibold text-gray-700">${achievement.points} XP</span>
            </div>
            ${isUnlocked && unlocked ? 
              `<div class="text-xs text-gray-500">${new Date(unlocked.unlocked_at).toLocaleDateString()}</div>` : 
              `<div class="text-xs text-gray-500">${achievement.requirement_type}: ${achievement.requirement_value}</div>`
            }
          </div>
        </div>
      `;
    }).join('');
  }

  filterAchievements(category) {
    this.renderAchievements(category);
  }

  async loadPoints() {
    try {
      const response = await axios.get('/api/gamification/points', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('session_token')}` }
      });

      if (response.data.success) {
        this.points = response.data.points || [];
        this.renderLevelProgress();
        this.updateStats();
      }
    } catch (error) {
      console.error('Failed to load points:', error);
      document.getElementById('level-progress-container').innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-exclamation-circle text-3xl mb-3"></i>
          <p>Failed to load level progress</p>
        </div>
      `;
    }
  }

  renderLevelProgress() {
    const container = document.getElementById('level-progress-container');
    
    if (this.points.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <p class="mb-4">Start earning XP to level up!</p>
          <p class="text-sm">Complete activities, unlock achievements, and maintain streaks</p>
        </div>
      `;
      return;
    }

    const xpData = this.points.find(p => p.points_type === 'xp') || { total_points: 0, level: 1, points_to_next_level: 100 };
    const progress = ((xpData.total_points % xpData.points_to_next_level) / xpData.points_to_next_level) * 100;
    const pointsInLevel = xpData.total_points % xpData.points_to_next_level;

    container.innerHTML = `
      <div class="space-y-6">
        <!-- XP Progress -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <div>
              <span class="text-3xl font-bold text-gray-800">Level ${xpData.level}</span>
              <span class="text-gray-600 ml-2">→ Level ${xpData.level + 1}</span>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-green-600">${xpData.total_points.toLocaleString()}</div>
              <div class="text-sm text-gray-600">Total XP</div>
            </div>
          </div>
          
          <div class="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
            <div class="bg-gradient-to-r from-green-500 to-green-600 h-6 rounded-full transition-all duration-500 flex items-center justify-center" 
              style="width: ${progress}%">
              <span class="text-white text-xs font-bold">${progress.toFixed(1)}%</span>
            </div>
          </div>
          
          <div class="flex justify-between text-sm text-gray-600 mt-2">
            <span>${pointsInLevel} XP</span>
            <span>${xpData.points_to_next_level - pointsInLevel} XP to next level</span>
          </div>
        </div>

        <!-- Other Point Types -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${this.points.filter(p => p.points_type !== 'xp').map(point => `
            <div class="bg-gradient-to-br ${this.getPointColor(point.points_type)} rounded-lg p-4 text-white">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm opacity-75">${this.formatPointType(point.points_type)}</div>
                  <div class="text-3xl font-bold">${point.total_points.toLocaleString()}</div>
                </div>
                <i class="fas ${this.getPointIcon(point.points_type)} text-4xl opacity-50"></i>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  getPointColor(type) {
    const colors = {
      'wellness_coins': 'from-blue-500 to-blue-600',
      'social_karma': 'from-purple-500 to-purple-600'
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  }

  getPointIcon(type) {
    const icons = {
      'wellness_coins': 'fa-coins',
      'social_karma': 'fa-heart'
    };
    return icons[type] || 'fa-star';
  }

  formatPointType(type) {
    const names = {
      'wellness_coins': 'Wellness Coins',
      'social_karma': 'Social Karma'
    };
    return names[type] || type;
  }

  updateStats() {
    // Update overview stats
    const longestStreak = Math.max(...this.streaks.map(s => s.longest_streak), 0);
    document.getElementById('longest-streak').textContent = longestStreak;
    
    document.getElementById('achievement-count').textContent = this.unlockedAchievements.length;
    
    const xpData = this.points.find(p => p.points_type === 'xp') || { total_points: 0, level: 1 };
    document.getElementById('total-points').textContent = xpData.total_points.toLocaleString();
    document.getElementById('user-level').textContent = xpData.level;
  }
}

// Initialize
const gamificationDashboard = new GamificationDashboard();
