// Wellness Dashboard JavaScript
// Main wellness hub for meditation, yoga, and music

(function() {
  'use strict';

  const Wellness = {
    // Initialize wellness dashboard
    async init() {
      this.setupEventListeners();
      await this.loadDashboard();
    },

    setupEventListeners() {
      // Tab navigation
      document.querySelectorAll('[data-wellness-tab]').forEach(tab => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          const tabName = e.currentTarget.dataset.wellnessTab;
          this.switchTab(tabName);
        });
      });

      // Quick action buttons
      document.querySelectorAll('[data-wellness-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = e.currentTarget.dataset.wellnessAction;
          this.handleQuickAction(action);
        });
      });
    },

    switchTab(tabName) {
      // Update tab styling
      document.querySelectorAll('[data-wellness-tab]').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.wellnessTab === tabName);
      });

      // Show/hide content
      document.querySelectorAll('[data-wellness-content]').forEach(content => {
        content.classList.toggle('hidden', content.dataset.wellnessContent !== tabName);
      });

      // Load tab content
      switch(tabName) {
        case 'meditation':
          if (window.Meditation) window.Meditation.loadSessions();
          break;
        case 'yoga':
          if (window.Yoga) window.Yoga.loadRoutines();
          break;
        case 'music':
          if (window.MusicTherapy) window.MusicTherapy.loadPlaylists();
          break;
      }
    },

    handleQuickAction(action) {
      switch(action) {
        case 'start-meditation':
          window.location.href = '/meditation';
          break;
        case 'start-yoga':
          window.location.href = '/yoga';
          break;
        case 'play-music':
          window.location.href = '/music';
          break;
        case 'view-progress':
          this.showProgressModal();
          break;
      }
    },

    async loadDashboard() {
      try {
        // Load wellness stats
        const [meditationProgress, yogaProgress, musicStats] = await Promise.all([
          this.fetchAPI('/api/meditation/progress').catch(() => null),
          this.fetchAPI('/api/yoga/progress').catch(() => null),
          this.fetchAPI('/api/music/stats').catch(() => null)
        ]);

        this.renderDashboard({
          meditation: meditationProgress,
          yoga: yogaProgress,
          music: musicStats
        });

        // Load recommendations
        await this.loadRecommendations();

      } catch (error) {
        console.error('Error loading wellness dashboard:', error);
        this.showError('Failed to load wellness data');
      }
    },

    renderDashboard(data) {
      // Update meditation stats
      if (data.meditation) {
        const streak = data.meditation.streak || {};
        this.updateElement('meditation-streak', streak.current_streak || 0);
        this.updateElement('meditation-total', streak.total_sessions || 0);
        this.updateElement('meditation-minutes', streak.total_minutes || 0);
      }

      // Update yoga stats
      if (data.yoga) {
        const streak = data.yoga.streak || {};
        this.updateElement('yoga-streak', streak.current_streak || 0);
        this.updateElement('yoga-total', streak.total_sessions || 0);
        this.updateElement('yoga-minutes', streak.total_minutes || 0);
      }

      // Update music stats
      if (data.music && data.music.stats) {
        const stats = data.music.stats;
        this.updateElement('music-minutes', stats.totalMinutes || 0);
        this.updateElement('music-plays', stats.totalPlays || 0);
        if (stats.favoriteCategory) {
          this.updateElement('music-category', stats.favoriteCategory.name || 'None');
        }
      }
    },

    async loadRecommendations() {
      try {
        // Get current mood from recent entry
        const moodResponse = await this.fetchAPI('/api/moods?limit=1').catch(() => null);
        const currentMood = moodResponse?.moods?.[0]?.mood || 'neutral';

        // Get recommendations
        const [meditationRecs, yogaRecs, musicRecs] = await Promise.all([
          this.fetchAPI(`/api/meditation/recommendations?mood=${currentMood}`).catch(() => null),
          this.fetchAPI(`/api/yoga/recommendations?goal=general`).catch(() => null),
          this.fetchAPI(`/api/music/recommendations?mood=${currentMood}`).catch(() => null)
        ]);

        this.renderRecommendations({
          meditation: meditationRecs?.recommendations || [],
          yoga: yogaRecs?.recommendations || [],
          music: musicRecs?.recommendations || []
        });

      } catch (error) {
        console.error('Error loading recommendations:', error);
      }
    },

    renderRecommendations(recs) {
      // Render meditation recommendations
      const medContainer = document.getElementById('meditation-recommendations');
      if (medContainer && recs.meditation.length > 0) {
        medContainer.innerHTML = recs.meditation.slice(0, 3).map(session => `
          <div class="recommendation-card" onclick="window.location.href='/meditation/${session.id}'">
            <div class="rec-icon">🧘</div>
            <div class="rec-content">
              <h4>${this.escapeHtml(session.title)}</h4>
              <p>${Math.round(session.duration / 60)} min • ${session.difficulty}</p>
            </div>
          </div>
        `).join('');
      }

      // Render yoga recommendations
      const yogaContainer = document.getElementById('yoga-recommendations');
      if (yogaContainer && recs.yoga.length > 0) {
        yogaContainer.innerHTML = recs.yoga.slice(0, 3).map(routine => `
          <div class="recommendation-card" onclick="window.location.href='/yoga/${routine.id}'">
            <div class="rec-icon">🧎</div>
            <div class="rec-content">
              <h4>${this.escapeHtml(routine.title)}</h4>
              <p>${Math.round(routine.duration / 60)} min • ${routine.poseCount} poses</p>
            </div>
          </div>
        `).join('');
      }

      // Render music recommendations
      const musicContainer = document.getElementById('music-recommendations');
      if (musicContainer && recs.music.length > 0) {
        musicContainer.innerHTML = recs.music.slice(0, 3).map(playlist => `
          <div class="recommendation-card" onclick="window.location.href='/music/${playlist.id}'">
            <div class="rec-icon">🎵</div>
            <div class="rec-content">
              <h4>${this.escapeHtml(playlist.title)}</h4>
              <p>${playlist.trackCount} tracks • ${playlist.category}</p>
            </div>
          </div>
        `).join('');
      }
    },

    showProgressModal() {
      // Implementation for progress modal
      const modal = document.getElementById('progress-modal');
      if (modal) {
        modal.classList.remove('hidden');
        this.loadDetailedProgress();
      }
    },

    async loadDetailedProgress() {
      // Load detailed progress for modal
      try {
        const [meditation, yoga, music] = await Promise.all([
          this.fetchAPI('/api/meditation/progress'),
          this.fetchAPI('/api/yoga/progress'),
          this.fetchAPI('/api/music/stats')
        ]);

        // Render detailed stats
        this.renderDetailedProgress({ meditation, yoga, music });
      } catch (error) {
        console.error('Error loading detailed progress:', error);
      }
    },

    renderDetailedProgress(data) {
      const container = document.getElementById('detailed-progress');
      if (!container) return;

      container.innerHTML = `
        <div class="progress-section">
          <h3>🧘 Meditation</h3>
          <div class="progress-stats">
            <div class="stat">
              <span class="stat-value">${data.meditation?.streak?.current_streak || 0}</span>
              <span class="stat-label">Day Streak</span>
            </div>
            <div class="stat">
              <span class="stat-value">${data.meditation?.streak?.total_sessions || 0}</span>
              <span class="stat-label">Sessions</span>
            </div>
            <div class="stat">
              <span class="stat-value">${data.meditation?.streak?.total_minutes || 0}</span>
              <span class="stat-label">Minutes</span>
            </div>
            <div class="stat">
              <span class="stat-value">${(data.meditation?.moodStats?.avg_improvement || 0).toFixed(1)}</span>
              <span class="stat-label">Mood Boost</span>
            </div>
          </div>
        </div>
        <div class="progress-section">
          <h3>🧎 Yoga</h3>
          <div class="progress-stats">
            <div class="stat">
              <span class="stat-value">${data.yoga?.streak?.current_streak || 0}</span>
              <span class="stat-label">Day Streak</span>
            </div>
            <div class="stat">
              <span class="stat-value">${data.yoga?.streak?.total_sessions || 0}</span>
              <span class="stat-label">Sessions</span>
            </div>
            <div class="stat">
              <span class="stat-value">${data.yoga?.streak?.total_minutes || 0}</span>
              <span class="stat-label">Minutes</span>
            </div>
          </div>
        </div>
        <div class="progress-section">
          <h3>🎵 Music</h3>
          <div class="progress-stats">
            <div class="stat">
              <span class="stat-value">${data.music?.stats?.totalMinutes || 0}</span>
              <span class="stat-label">Minutes</span>
            </div>
            <div class="stat">
              <span class="stat-value">${data.music?.stats?.totalPlays || 0}</span>
              <span class="stat-label">Plays</span>
            </div>
            <div class="stat">
              <span class="stat-value">${(data.music?.stats?.moodImprovement || 0).toFixed(1)}</span>
              <span class="stat-label">Mood Boost</span>
            </div>
          </div>
        </div>
      `;
    },

    // Helper methods
    updateElement(id, value) {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    },

    async fetchAPI(url) {
      const response = await fetch(url, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    showError(message) {
      const container = document.getElementById('wellness-error');
      if (container) {
        container.textContent = message;
        container.classList.remove('hidden');
      }
    }
  };

  // Export
  window.Wellness = Wellness;

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Wellness.init());
  } else {
    Wellness.init();
  }
})();
