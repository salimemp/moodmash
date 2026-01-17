// Meditation JavaScript
// Handles meditation sessions, timer, and progress tracking

(function() {
  'use strict';

  const Meditation = {
    currentSession: null,
    progressId: null,
    timer: null,
    audioContext: null,
    backgroundAudio: null,
    isPlaying: false,
    isPaused: false,
    elapsedTime: 0,
    moodBefore: null,

    async init() {
      this.setupEventListeners();
      await this.loadCategories();
      await this.loadSessions();
    },

    setupEventListeners() {
      // Category filter
      document.querySelectorAll('[data-meditation-category]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const category = e.currentTarget.dataset.meditationCategory;
          this.filterByCategory(category);
        });
      });

      // Difficulty filter
      const difficultySelect = document.getElementById('meditation-difficulty');
      if (difficultySelect) {
        difficultySelect.addEventListener('change', () => this.applyFilters());
      }

      // Duration filter
      const durationSelect = document.getElementById('meditation-duration');
      if (durationSelect) {
        durationSelect.addEventListener('change', () => this.applyFilters());
      }

      // Search
      const searchInput = document.getElementById('meditation-search');
      if (searchInput) {
        searchInput.addEventListener('input', this.debounce(() => this.applyFilters(), 300));
      }

      // Timer controls
      document.getElementById('meditation-play')?.addEventListener('click', () => this.togglePlayPause());
      document.getElementById('meditation-stop')?.addEventListener('click', () => this.stopSession());
      document.getElementById('meditation-restart')?.addEventListener('click', () => this.restartSession());

      // Custom timer
      document.getElementById('start-custom-timer')?.addEventListener('click', () => this.startCustomTimer());

      // Mood tracking
      document.querySelectorAll('[data-mood-before]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.moodBefore = parseInt(e.currentTarget.dataset.moodBefore);
          document.querySelectorAll('[data-mood-before]').forEach(b => b.classList.remove('selected'));
          e.currentTarget.classList.add('selected');
        });
      });

      document.querySelectorAll('[data-mood-after]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const moodAfter = parseInt(e.currentTarget.dataset.moodAfter);
          this.completeMoodTracking(moodAfter);
        });
      });
    },

    async loadCategories() {
      try {
        const response = await this.fetchAPI('/api/meditation/categories');
        if (response.success) {
          this.renderCategories(response.categories);
          this.backgroundSounds = response.sounds;
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    },

    renderCategories(categories) {
      const container = document.getElementById('meditation-categories');
      if (!container) return;

      container.innerHTML = `
        <button class="category-btn active" data-meditation-category="all">
          <span class="category-icon">🎯</span>
          <span class="category-name">All</span>
        </button>
        ${categories.map(cat => `
          <button class="category-btn" data-meditation-category="${cat.id}">
            <span class="category-icon">${cat.icon}</span>
            <span class="category-name">${this.escapeHtml(cat.name)}</span>
          </button>
        `).join('')}
      `;

      // Re-attach event listeners
      container.querySelectorAll('[data-meditation-category]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const category = e.currentTarget.dataset.meditationCategory;
          this.filterByCategory(category);
        });
      });
    },

    async loadSessions(params = {}) {
      try {
        const queryParams = new URLSearchParams(params).toString();
        const url = `/api/meditation/sessions${queryParams ? '?' + queryParams : ''}`;
        const response = await this.fetchAPI(url);
        
        if (response.success) {
          this.renderSessions(response.sessions);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
        this.showError('Failed to load meditation sessions');
      }
    },

    renderSessions(sessions) {
      const container = document.getElementById('meditation-sessions');
      if (!container) return;

      if (sessions.length === 0) {
        container.innerHTML = '<p class="no-results">No sessions found matching your criteria.</p>';
        return;
      }

      container.innerHTML = sessions.map(session => `
        <div class="session-card" data-session-id="${session.id}">
          <div class="session-header">
            <span class="session-category">${this.getCategoryIcon(session.category)} ${session.category}</span>
            ${session.isPremium ? '<span class="premium-badge">✨ Premium</span>' : ''}
          </div>
          <h3 class="session-title">${this.escapeHtml(session.title)}</h3>
          <p class="session-description">${this.escapeHtml(session.description)}</p>
          <div class="session-meta">
            <span class="duration">⏱️ ${Math.round(session.duration / 60)} min</span>
            <span class="difficulty">${this.getDifficultyIcon(session.difficulty)} ${session.difficulty}</span>
            <span class="sound">🔊 ${session.backgroundSound}</span>
          </div>
          <div class="session-actions">
            <button class="btn btn-primary" onclick="Meditation.startSession('${session.id}')">
              ▶️ Start
            </button>
            <button class="btn btn-secondary" onclick="Meditation.toggleFavorite('${session.id}')">
              ❤️
            </button>
          </div>
        </div>
      `).join('');
    },

    filterByCategory(category) {
      // Update active state
      document.querySelectorAll('[data-meditation-category]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.meditationCategory === category);
      });

      this.applyFilters();
    },

    applyFilters() {
      const category = document.querySelector('[data-meditation-category].active')?.dataset.meditationCategory;
      const difficulty = document.getElementById('meditation-difficulty')?.value;
      const duration = document.getElementById('meditation-duration')?.value;
      const search = document.getElementById('meditation-search')?.value;

      const params = {};
      if (category && category !== 'all') params.category = category;
      if (difficulty && difficulty !== 'all') params.difficulty = difficulty;
      if (duration && duration !== 'all') params.duration = duration;
      if (search) params.search = search;

      this.loadSessions(params);
    },

    async startSession(sessionId) {
      try {
        // Show mood tracking first
        this.showMoodBeforeModal(sessionId);
      } catch (error) {
        console.error('Error starting session:', error);
        this.showError('Failed to start session');
      }
    },

    showMoodBeforeModal(sessionId) {
      const modal = document.getElementById('mood-before-modal');
      if (modal) {
        modal.dataset.sessionId = sessionId;
        modal.classList.remove('hidden');
      } else {
        // Skip mood tracking if modal doesn't exist
        this.beginSession(sessionId, null);
      }
    },

    async beginSession(sessionId, moodBefore) {
      try {
        const response = await this.fetchAPI('/api/meditation/start', {
          method: 'POST',
          body: JSON.stringify({ sessionId, moodBefore })
        });

        if (response.success) {
          this.currentSession = response.session;
          this.progressId = response.progressId;
          this.moodBefore = moodBefore;
          this.showPlayer();
        }
      } catch (error) {
        console.error('Error beginning session:', error);
        this.showError('Failed to begin session');
      }
    },

    showPlayer() {
      const modal = document.getElementById('mood-before-modal');
      if (modal) modal.classList.add('hidden');

      const player = document.getElementById('meditation-player');
      if (player) {
        player.classList.remove('hidden');
        this.renderPlayer();
        this.startTimer();
      }
    },

    renderPlayer() {
      const titleEl = document.getElementById('player-title');
      const scriptEl = document.getElementById('player-script');
      const durationEl = document.getElementById('player-duration');

      if (titleEl) titleEl.textContent = this.currentSession.title;
      if (scriptEl) scriptEl.innerHTML = this.formatScript(this.currentSession.script);
      if (durationEl) durationEl.textContent = this.formatTime(this.currentSession.duration);

      this.isPlaying = true;
      this.isPaused = false;
      this.elapsedTime = 0;
      this.updatePlayButton();
    },

    formatScript(script) {
      return script.split('\n\n').map(paragraph => 
        `<p class="script-paragraph">${this.escapeHtml(paragraph)}</p>`
      ).join('');
    },

    startTimer() {
      const timerEl = document.getElementById('player-timer');
      const progressEl = document.getElementById('player-progress');

      this.timer = setInterval(() => {
        if (!this.isPaused) {
          this.elapsedTime++;
          
          if (timerEl) timerEl.textContent = this.formatTime(this.elapsedTime);
          if (progressEl) {
            const progress = (this.elapsedTime / this.currentSession.duration) * 100;
            progressEl.style.width = `${Math.min(progress, 100)}%`;
          }

          // Session complete
          if (this.elapsedTime >= this.currentSession.duration) {
            this.completeSession();
          }
        }
      }, 1000);
    },

    togglePlayPause() {
      this.isPaused = !this.isPaused;
      this.updatePlayButton();
    },

    updatePlayButton() {
      const btn = document.getElementById('meditation-play');
      if (btn) {
        btn.textContent = this.isPaused ? '▶️ Resume' : '⏸️ Pause';
      }
    },

    stopSession() {
      if (confirm('Are you sure you want to end this session early?')) {
        this.completeSession(true);
      }
    },

    restartSession() {
      this.elapsedTime = 0;
      this.isPaused = false;
      this.updatePlayButton();
    },

    async completeSession(early = false) {
      clearInterval(this.timer);
      this.isPlaying = false;

      // Show mood after tracking
      const modal = document.getElementById('mood-after-modal');
      if (modal) {
        modal.dataset.early = early;
        modal.classList.remove('hidden');
      } else {
        await this.finishSession(null, early);
      }
    },

    async completeMoodTracking(moodAfter) {
      const modal = document.getElementById('mood-after-modal');
      const early = modal?.dataset.early === 'true';
      modal?.classList.add('hidden');

      await this.finishSession(moodAfter, early);
    },

    async finishSession(moodAfter, early) {
      try {
        const response = await this.fetchAPI('/api/meditation/complete', {
          method: 'POST',
          body: JSON.stringify({
            progressId: this.progressId,
            moodAfter,
            actualDuration: this.elapsedTime,
            notes: early ? 'Session ended early' : null
          })
        });

        if (response.success) {
          this.showCompletionScreen(response, moodAfter);
        }
      } catch (error) {
        console.error('Error completing session:', error);
      }

      // Hide player
      const player = document.getElementById('meditation-player');
      if (player) player.classList.add('hidden');

      // Reset state
      this.currentSession = null;
      this.progressId = null;
      this.elapsedTime = 0;
    },

    showCompletionScreen(response, moodAfter) {
      const screen = document.getElementById('completion-screen');
      if (!screen) return;

      const moodImprovement = this.moodBefore && moodAfter ? moodAfter - this.moodBefore : null;

      screen.innerHTML = `
        <div class="completion-content">
          <h2>🧘 Session Complete!</h2>
          <p>Great job on completing your meditation.</p>
          <div class="completion-stats">
            <div class="stat">
              <span class="value">${this.formatTime(this.elapsedTime)}</span>
              <span class="label">Duration</span>
            </div>
            ${moodImprovement !== null ? `
              <div class="stat">
                <span class="value ${moodImprovement > 0 ? 'positive' : moodImprovement < 0 ? 'negative' : ''}">${moodImprovement > 0 ? '+' : ''}${moodImprovement}</span>
                <span class="label">Mood Change</span>
              </div>
            ` : ''}
          </div>
          ${response.achievements && response.achievements.length > 0 ? `
            <div class="achievements-unlocked">
              <h3>🏆 Achievements Unlocked!</h3>
              ${response.achievements.map(a => `<p>${a}</p>`).join('')}
            </div>
          ` : ''}
          <button class="btn btn-primary" onclick="Meditation.closeCompletion()">Continue</button>
        </div>
      `;

      screen.classList.remove('hidden');
    },

    closeCompletion() {
      const screen = document.getElementById('completion-screen');
      if (screen) screen.classList.add('hidden');
    },

    async toggleFavorite(sessionId) {
      try {
        // Try to add first, if fails then remove
        const response = await this.fetchAPI(`/api/meditation/favorites/${sessionId}`, {
          method: 'POST'
        });
        
        if (response.success) {
          this.showSuccess('Added to favorites');
        }
      } catch (error) {
        // Try to remove
        try {
          await this.fetchAPI(`/api/meditation/favorites/${sessionId}`, {
            method: 'DELETE'
          });
          this.showSuccess('Removed from favorites');
        } catch (e) {
          console.error('Error toggling favorite:', e);
        }
      }
    },

    startCustomTimer() {
      const durationInput = document.getElementById('custom-duration');
      const soundSelect = document.getElementById('custom-sound');
      
      if (!durationInput) return;

      const duration = parseInt(durationInput.value) * 60; // Convert to seconds
      const sound = soundSelect?.value || 'silence';

      this.currentSession = {
        id: 'custom',
        title: 'Custom Timer',
        duration,
        script: 'Take this time to meditate in your own way. Focus on your breath and find your inner peace.',
        backgroundSound: sound
      };

      this.progressId = 'custom';
      this.moodBefore = null;
      this.showPlayer();
    },

    // Helper methods
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    getCategoryIcon(category) {
      const icons = {
        stress_relief: '😌',
        sleep: '😴',
        anxiety: '🌊',
        focus: '🎯',
        mindfulness: '🌸',
        breathing: '💨',
        body_scan: '🧬',
        loving_kindness: '💕',
        morning: '🌅',
        evening: '🌙'
      };
      return icons[category] || '🧘';
    },

    getDifficultyIcon(difficulty) {
      const icons = {
        beginner: '🌱',
        intermediate: '🌿',
        advanced: '🌳'
      };
      return icons[difficulty] || '🌱';
    },

    async fetchAPI(url, options = {}) {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    debounce(func, wait) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    },

    showSuccess(message) {
      // Simple success notification
      const toast = document.createElement('div');
      toast.className = 'toast success';
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    },

    showError(message) {
      const toast = document.createElement('div');
      toast.className = 'toast error';
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 5000);
    }
  };

  // Export
  window.Meditation = Meditation;

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Meditation.init());
  } else {
    Meditation.init();
  }
})();
