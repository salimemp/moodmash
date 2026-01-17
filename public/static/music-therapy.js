// Music Therapy JavaScript
// Handles playlists, playback, and mood-based recommendations

(function() {
  'use strict';

  const MusicTherapy = {
    currentPlaylist: null,
    currentTrackIndex: 0,
    isPlaying: false,
    audioElement: null,
    moodBefore: null,
    playStartTime: null,

    async init() {
      this.audioElement = document.getElementById('music-audio') || new Audio();
      this.setupEventListeners();
      await this.loadCategories();
      await this.loadPlaylists();
      await this.loadRecommendations();
    },

    setupEventListeners() {
      // Category filter
      document.querySelectorAll('[data-music-category]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const category = e.currentTarget.dataset.musicCategory;
          this.filterByCategory(category);
        });
      });

      // Search
      const searchInput = document.getElementById('music-search');
      if (searchInput) {
        searchInput.addEventListener('input', this.debounce(() => this.applyFilters(), 300));
      }

      // Player controls
      document.getElementById('music-play')?.addEventListener('click', () => this.togglePlayPause());
      document.getElementById('music-next')?.addEventListener('click', () => this.nextTrack());
      document.getElementById('music-prev')?.addEventListener('click', () => this.previousTrack());
      document.getElementById('music-shuffle')?.addEventListener('click', () => this.toggleShuffle());
      document.getElementById('music-repeat')?.addEventListener('click', () => this.toggleRepeat());

      // Volume control
      const volumeSlider = document.getElementById('music-volume');
      if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
          this.setVolume(e.target.value / 100);
        });
      }

      // Progress bar
      const progressBar = document.getElementById('music-progress');
      if (progressBar) {
        progressBar.addEventListener('click', (e) => {
          const rect = progressBar.getBoundingClientRect();
          const percent = (e.clientX - rect.left) / rect.width;
          this.seekTo(percent);
        });
      }

      // Audio events
      this.audioElement.addEventListener('ended', () => this.onTrackEnd());
      this.audioElement.addEventListener('timeupdate', () => this.updateProgress());
      this.audioElement.addEventListener('loadedmetadata', () => this.updateDuration());
    },

    async loadCategories() {
      try {
        const response = await this.fetchAPI('/api/music/categories');
        if (response.success) {
          this.renderCategories(response.categories);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    },

    renderCategories(categories) {
      const container = document.getElementById('music-categories');
      if (!container) return;

      container.innerHTML = `
        <button class="category-btn active" data-music-category="all">
          <span class="category-icon">🎵</span>
          <span class="category-name">All</span>
        </button>
        ${categories.map(cat => `
          <button class="category-btn" data-music-category="${cat.id}">
            <span class="category-icon">${cat.icon}</span>
            <span class="category-name">${this.escapeHtml(cat.name)}</span>
          </button>
        `).join('')}
      `;

      container.querySelectorAll('[data-music-category]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const category = e.currentTarget.dataset.musicCategory;
          this.filterByCategory(category);
        });
      });
    },

    async loadPlaylists(params = {}) {
      try {
        const queryParams = new URLSearchParams(params).toString();
        const url = `/api/music/playlists${queryParams ? '?' + queryParams : ''}`;
        const response = await this.fetchAPI(url);
        
        if (response.success) {
          this.renderPlaylists(response.playlists);
        }
      } catch (error) {
        console.error('Error loading playlists:', error);
        this.showError('Failed to load playlists');
      }
    },

    renderPlaylists(playlists) {
      const container = document.getElementById('music-playlists');
      if (!container) return;

      if (playlists.length === 0) {
        container.innerHTML = '<p class="no-results">No playlists found.</p>';
        return;
      }

      container.innerHTML = playlists.map(playlist => `
        <div class="playlist-card" data-playlist-id="${playlist.id}">
          <div class="playlist-header">
            <span class="playlist-category">${this.getCategoryIcon(playlist.category)} ${playlist.category}</span>
            ${playlist.isPremium ? '<span class="premium-badge">✨ Premium</span>' : ''}
          </div>
          <h3 class="playlist-title">${this.escapeHtml(playlist.title)}</h3>
          <p class="playlist-description">${this.escapeHtml(playlist.description)}</p>
          <div class="playlist-meta">
            <span class="tracks">🎵 ${playlist.trackCount} tracks</span>
            <span class="duration">⏱️ ${Math.round(playlist.duration / 60)} min</span>
          </div>
          <div class="playlist-tags">
            ${playlist.moodTags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
          <div class="playlist-actions">
            <button class="btn btn-primary" onclick="MusicTherapy.playPlaylist('${playlist.id}')">
              ▶️ Play
            </button>
            <button class="btn btn-secondary" onclick="MusicTherapy.toggleFavorite('${playlist.id}')">
              ❤️
            </button>
          </div>
        </div>
      `).join('');
    },

    async loadRecommendations() {
      try {
        // Get current mood
        const moodResponse = await this.fetchAPI('/api/moods?limit=1').catch(() => null);
        const currentMood = moodResponse?.moods?.[0]?.mood || 'neutral';

        const response = await this.fetchAPI(`/api/music/recommendations?mood=${currentMood}`);
        
        if (response.success) {
          this.renderRecommendations(response.recommendations);
        }
      } catch (error) {
        console.error('Error loading recommendations:', error);
      }
    },

    renderRecommendations(recommendations) {
      const container = document.getElementById('music-recommendations');
      if (!container || recommendations.length === 0) return;

      container.innerHTML = `
        <h3>Recommended for You</h3>
        <div class="recommendations-grid">
          ${recommendations.slice(0, 4).map(playlist => `
            <div class="rec-card" onclick="MusicTherapy.playPlaylist('${playlist.id}')">
              <span class="rec-icon">${this.getCategoryIcon(playlist.category)}</span>
              <h4>${this.escapeHtml(playlist.title)}</h4>
              <p>${playlist.trackCount} tracks</p>
            </div>
          `).join('')}
        </div>
      `;
    },

    filterByCategory(category) {
      document.querySelectorAll('[data-music-category]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.musicCategory === category);
      });
      this.applyFilters();
    },

    applyFilters() {
      const category = document.querySelector('[data-music-category].active')?.dataset.musicCategory;
      const search = document.getElementById('music-search')?.value;

      const params = {};
      if (category && category !== 'all') params.category = category;
      if (search) params.search = search;

      this.loadPlaylists(params);
    },

    async playPlaylist(playlistId) {
      try {
        const response = await this.fetchAPI(`/api/music/playlists/${playlistId}`);
        
        if (response.success) {
          this.currentPlaylist = response.playlist;
          this.currentTrackIndex = 0;
          this.playStartTime = Date.now();
          this.showPlayer();
          this.playCurrentTrack();
        }
      } catch (error) {
        console.error('Error loading playlist:', error);
        this.showError('Failed to load playlist');
      }
    },

    showPlayer() {
      const player = document.getElementById('music-player');
      if (player) {
        player.classList.remove('hidden');
        this.updatePlayerUI();
      }
    },

    hidePlayer() {
      const player = document.getElementById('music-player');
      if (player) player.classList.add('hidden');
    },

    updatePlayerUI() {
      const track = this.currentPlaylist?.tracks[this.currentTrackIndex];
      if (!track) return;

      const titleEl = document.getElementById('player-track-title');
      const artistEl = document.getElementById('player-artist');
      const playlistEl = document.getElementById('player-playlist');
      const progressEl = document.getElementById('player-track-progress');

      if (titleEl) titleEl.textContent = track.title;
      if (artistEl) artistEl.textContent = track.artist;
      if (playlistEl) playlistEl.textContent = this.currentPlaylist.title;
      if (progressEl) progressEl.textContent = `Track ${this.currentTrackIndex + 1} of ${this.currentPlaylist.tracks.length}`;

      this.updatePlayButton();
    },

    playCurrentTrack() {
      const track = this.currentPlaylist?.tracks[this.currentTrackIndex];
      if (!track) return;

      // In a real app, this would load actual audio
      // For demo, we simulate with a timer
      this.isPlaying = true;
      this.updatePlayerUI();

      // Simulate track duration (in real app, load actual audio)
      // this.audioElement.src = track.audioUrl;
      // this.audioElement.play();

      console.log(`Now playing: ${track.title} by ${track.artist}`);
    },

    togglePlayPause() {
      this.isPlaying = !this.isPlaying;
      
      if (this.isPlaying) {
        // this.audioElement.play();
      } else {
        // this.audioElement.pause();
      }

      this.updatePlayButton();
    },

    updatePlayButton() {
      const btn = document.getElementById('music-play');
      if (btn) btn.textContent = this.isPlaying ? '⏸️' : '▶️';
    },

    nextTrack() {
      const tracks = this.currentPlaylist?.tracks || [];
      
      if (this.currentTrackIndex < tracks.length - 1) {
        this.currentTrackIndex++;
        this.playCurrentTrack();
      } else if (this.repeat) {
        this.currentTrackIndex = 0;
        this.playCurrentTrack();
      }
    },

    previousTrack() {
      if (this.currentTrackIndex > 0) {
        this.currentTrackIndex--;
        this.playCurrentTrack();
      }
    },

    onTrackEnd() {
      this.logPlay();
      this.nextTrack();
    },

    toggleShuffle() {
      this.shuffle = !this.shuffle;
      const btn = document.getElementById('music-shuffle');
      if (btn) btn.classList.toggle('active', this.shuffle);
    },

    toggleRepeat() {
      this.repeat = !this.repeat;
      const btn = document.getElementById('music-repeat');
      if (btn) btn.classList.toggle('active', this.repeat);
    },

    setVolume(level) {
      this.audioElement.volume = level;
    },

    seekTo(percent) {
      if (this.audioElement.duration) {
        this.audioElement.currentTime = this.audioElement.duration * percent;
      }
    },

    updateProgress() {
      const progressBar = document.getElementById('music-progress-fill');
      const currentTime = document.getElementById('music-current-time');
      
      if (progressBar && this.audioElement.duration) {
        const percent = (this.audioElement.currentTime / this.audioElement.duration) * 100;
        progressBar.style.width = `${percent}%`;
      }
      
      if (currentTime) {
        currentTime.textContent = this.formatTime(this.audioElement.currentTime);
      }
    },

    updateDuration() {
      const durationEl = document.getElementById('music-duration');
      if (durationEl && this.audioElement.duration) {
        durationEl.textContent = this.formatTime(this.audioElement.duration);
      }
    },

    async logPlay() {
      if (!this.currentPlaylist) return;

      const duration = Math.round((Date.now() - this.playStartTime) / 1000);
      const track = this.currentPlaylist.tracks[this.currentTrackIndex];

      try {
        await this.fetchAPI('/api/music/play', {
          method: 'POST',
          body: JSON.stringify({
            playlistId: this.currentPlaylist.id,
            trackId: track?.id,
            duration,
            completed: true
          })
        });
      } catch (error) {
        console.error('Error logging play:', error);
      }

      this.playStartTime = Date.now();
    },

    async toggleFavorite(playlistId) {
      try {
        await this.fetchAPI(`/api/music/favorites/${playlistId}`, {
          method: 'POST'
        });
        this.showSuccess('Added to favorites');
      } catch (error) {
        try {
          await this.fetchAPI(`/api/music/favorites/${playlistId}`, {
            method: 'DELETE'
          });
          this.showSuccess('Removed from favorites');
        } catch (e) {
          console.error('Error toggling favorite:', e);
        }
      }
    },

    // Helper methods
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    getCategoryIcon(category) {
      const icons = {
        calming: '😌',
        energizing: '⚡',
        focus: '🎯',
        sleep: '😴',
        anxiety: '🌊',
        depression: '🌅',
        meditation: '🧘',
        nature: '🌲',
        binaural: '🧠',
        classical: '🎻',
        ambient: '🌌'
      };
      return icons[category] || '🎵';
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
  window.MusicTherapy = MusicTherapy;

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MusicTherapy.init());
  } else {
    MusicTherapy.init();
  }
})();
