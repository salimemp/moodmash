// Yoga JavaScript
// Handles yoga poses, routines, and progress tracking

(function() {
  'use strict';

  const Yoga = {
    currentRoutine: null,
    currentPoseIndex: 0,
    progressId: null,
    timer: null,
    poseTimer: 0,
    isPlaying: false,
    isPaused: false,

    async init() {
      this.setupEventListeners();
      await this.loadCategories();
      await this.loadRoutines();
    },

    setupEventListeners() {
      // Category filter
      document.querySelectorAll('[data-yoga-category]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const category = e.currentTarget.dataset.yogaCategory;
          this.filterByCategory(category);
        });
      });

      // Difficulty filter
      const difficultySelect = document.getElementById('yoga-difficulty');
      if (difficultySelect) {
        difficultySelect.addEventListener('change', () => this.applyFilters());
      }

      // Duration filter
      const durationSelect = document.getElementById('yoga-duration');
      if (durationSelect) {
        durationSelect.addEventListener('change', () => this.applyFilters());
      }

      // Search
      const searchInput = document.getElementById('yoga-search');
      if (searchInput) {
        searchInput.addEventListener('input', this.debounce(() => this.applyFilters(), 300));
      }

      // Player controls
      document.getElementById('yoga-play')?.addEventListener('click', () => this.togglePlayPause());
      document.getElementById('yoga-next')?.addEventListener('click', () => this.nextPose());
      document.getElementById('yoga-prev')?.addEventListener('click', () => this.previousPose());
      document.getElementById('yoga-stop')?.addEventListener('click', () => this.stopRoutine());

      // View toggle
      document.getElementById('view-routines')?.addEventListener('click', () => this.showRoutines());
      document.getElementById('view-poses')?.addEventListener('click', () => this.showPoses());
    },

    async loadCategories() {
      try {
        const response = await this.fetchAPI('/api/yoga/routine-categories');
        if (response.success) {
          this.renderCategories(response.categories);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    },

    renderCategories(categories) {
      const container = document.getElementById('yoga-categories');
      if (!container) return;

      container.innerHTML = `
        <button class="category-btn active" data-yoga-category="all">
          <span class="category-icon">🎯</span>
          <span class="category-name">All</span>
        </button>
        ${categories.map(cat => `
          <button class="category-btn" data-yoga-category="${cat.id}">
            <span class="category-icon">${cat.icon}</span>
            <span class="category-name">${this.escapeHtml(cat.name)}</span>
          </button>
        `).join('')}
      `;

      container.querySelectorAll('[data-yoga-category]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const category = e.currentTarget.dataset.yogaCategory;
          this.filterByCategory(category);
        });
      });
    },

    async loadRoutines(params = {}) {
      try {
        const queryParams = new URLSearchParams(params).toString();
        const url = `/api/yoga/routines${queryParams ? '?' + queryParams : ''}`;
        const response = await this.fetchAPI(url);
        
        if (response.success) {
          this.renderRoutines(response.routines);
        }
      } catch (error) {
        console.error('Error loading routines:', error);
        this.showError('Failed to load yoga routines');
      }
    },

    renderRoutines(routines) {
      const container = document.getElementById('yoga-routines');
      if (!container) return;

      if (routines.length === 0) {
        container.innerHTML = '<p class="no-results">No routines found matching your criteria.</p>';
        return;
      }

      container.innerHTML = routines.map(routine => `
        <div class="routine-card" data-routine-id="${routine.id}">
          <div class="routine-header">
            <span class="routine-category">${this.getCategoryIcon(routine.category)} ${routine.category}</span>
            ${routine.isPremium ? '<span class="premium-badge">✨ Premium</span>' : ''}
          </div>
          <h3 class="routine-title">${this.escapeHtml(routine.title)}</h3>
          <p class="routine-description">${this.escapeHtml(routine.description)}</p>
          <div class="routine-meta">
            <span class="duration">⏱️ ${Math.round(routine.duration / 60)} min</span>
            <span class="poses">🧘 ${routine.poseCount} poses</span>
            <span class="difficulty">${this.getDifficultyIcon(routine.difficulty)} ${routine.difficulty}</span>
          </div>
          <div class="routine-actions">
            <button class="btn btn-primary" onclick="Yoga.startRoutine('${routine.id}')">
              ▶️ Start
            </button>
            <button class="btn btn-secondary" onclick="Yoga.toggleFavorite('${routine.id}')">
              ❤️
            </button>
            <button class="btn btn-secondary" onclick="Yoga.viewRoutineDetails('${routine.id}')">
              👁️ Preview
            </button>
          </div>
        </div>
      `).join('');
    },

    async loadPoses(params = {}) {
      try {
        const queryParams = new URLSearchParams(params).toString();
        const url = `/api/yoga/poses${queryParams ? '?' + queryParams : ''}`;
        const response = await this.fetchAPI(url);
        
        if (response.success) {
          this.renderPoses(response.poses);
        }
      } catch (error) {
        console.error('Error loading poses:', error);
      }
    },

    renderPoses(poses) {
      const container = document.getElementById('yoga-poses');
      if (!container) return;

      container.innerHTML = poses.map(pose => `
        <div class="pose-card" onclick="Yoga.viewPoseDetails('${pose.id}')">
          <div class="pose-category">${pose.category}</div>
          <h4 class="pose-name">${this.escapeHtml(pose.name)}</h4>
          <p class="pose-sanskrit">${this.escapeHtml(pose.sanskritName)}</p>
          <div class="pose-meta">
            <span>${this.getDifficultyIcon(pose.difficulty)}</span>
            <span>⏱️ ${pose.duration}s</span>
          </div>
        </div>
      `).join('');
    },

    filterByCategory(category) {
      document.querySelectorAll('[data-yoga-category]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.yogaCategory === category);
      });
      this.applyFilters();
    },

    applyFilters() {
      const category = document.querySelector('[data-yoga-category].active')?.dataset.yogaCategory;
      const difficulty = document.getElementById('yoga-difficulty')?.value;
      const duration = document.getElementById('yoga-duration')?.value;
      const search = document.getElementById('yoga-search')?.value;

      const params = {};
      if (category && category !== 'all') params.category = category;
      if (difficulty && difficulty !== 'all') params.difficulty = difficulty;
      if (duration && duration !== 'all') params.duration = duration;
      if (search) params.search = search;

      this.loadRoutines(params);
    },

    showRoutines() {
      document.getElementById('yoga-routines')?.classList.remove('hidden');
      document.getElementById('yoga-poses')?.classList.add('hidden');
      document.getElementById('view-routines')?.classList.add('active');
      document.getElementById('view-poses')?.classList.remove('active');
      this.loadRoutines();
    },

    showPoses() {
      document.getElementById('yoga-routines')?.classList.add('hidden');
      document.getElementById('yoga-poses')?.classList.remove('hidden');
      document.getElementById('view-routines')?.classList.remove('active');
      document.getElementById('view-poses')?.classList.add('active');
      this.loadPoses();
    },

    async startRoutine(routineId) {
      try {
        // Get full routine details
        const response = await this.fetchAPI(`/api/yoga/routines/${routineId}`);
        
        if (response.success) {
          this.currentRoutine = response.routine;
          this.currentPoseIndex = 0;
          
          // Start progress tracking
          const startResponse = await this.fetchAPI('/api/yoga/start', {
            method: 'POST',
            body: JSON.stringify({ routineId })
          });
          
          if (startResponse.success) {
            this.progressId = startResponse.progressId;
            this.showPlayer();
          }
        }
      } catch (error) {
        console.error('Error starting routine:', error);
        this.showError('Failed to start routine');
      }
    },

    showPlayer() {
      const player = document.getElementById('yoga-player');
      if (player) {
        player.classList.remove('hidden');
        this.renderCurrentPose();
        this.startPoseTimer();
      }
    },

    renderCurrentPose() {
      const sequence = this.currentRoutine.poseSequence;
      const current = sequence[this.currentPoseIndex];
      const pose = current.pose;

      const titleEl = document.getElementById('player-pose-name');
      const sanskritEl = document.getElementById('player-sanskrit');
      const instructionsEl = document.getElementById('player-instructions');
      const progressEl = document.getElementById('player-pose-progress');
      const sideEl = document.getElementById('player-side');

      if (titleEl) titleEl.textContent = pose?.name || 'Pose';
      if (sanskritEl) sanskritEl.textContent = pose?.sanskritName || '';
      if (instructionsEl && pose?.instructions) {
        instructionsEl.innerHTML = pose.instructions.map(i => `<li>${this.escapeHtml(i)}</li>`).join('');
      }
      if (progressEl) progressEl.textContent = `Pose ${this.currentPoseIndex + 1} of ${sequence.length}`;
      if (sideEl) sideEl.textContent = current.side ? `(${current.side} side)` : '';

      this.poseTimer = current.duration;
      this.isPlaying = true;
      this.isPaused = false;
      this.updateTimerDisplay();
    },

    startPoseTimer() {
      this.timer = setInterval(() => {
        if (!this.isPaused && this.poseTimer > 0) {
          this.poseTimer--;
          this.updateTimerDisplay();
          
          if (this.poseTimer <= 0) {
            this.nextPose();
          }
        }
      }, 1000);
    },

    updateTimerDisplay() {
      const timerEl = document.getElementById('player-timer');
      if (timerEl) timerEl.textContent = this.formatTime(this.poseTimer);
    },

    togglePlayPause() {
      this.isPaused = !this.isPaused;
      const btn = document.getElementById('yoga-play');
      if (btn) btn.textContent = this.isPaused ? '▶️ Resume' : '⏸️ Pause';
    },

    nextPose() {
      const sequence = this.currentRoutine.poseSequence;
      
      if (this.currentPoseIndex < sequence.length - 1) {
        this.currentPoseIndex++;
        this.renderCurrentPose();
      } else {
        this.completeRoutine();
      }
    },

    previousPose() {
      if (this.currentPoseIndex > 0) {
        this.currentPoseIndex--;
        this.renderCurrentPose();
      }
    },

    stopRoutine() {
      if (confirm('Are you sure you want to end this routine early?')) {
        this.completeRoutine(true);
      }
    },

    async completeRoutine(early = false) {
      clearInterval(this.timer);
      this.isPlaying = false;

      try {
        const response = await this.fetchAPI('/api/yoga/complete', {
          method: 'POST',
          body: JSON.stringify({
            progressId: this.progressId,
            posesCompleted: this.currentPoseIndex + 1,
            notes: early ? 'Routine ended early' : null
          })
        });

        if (response.success) {
          this.showCompletionScreen(response);
        }
      } catch (error) {
        console.error('Error completing routine:', error);
      }

      const player = document.getElementById('yoga-player');
      if (player) player.classList.add('hidden');

      this.currentRoutine = null;
      this.progressId = null;
      this.currentPoseIndex = 0;
    },

    showCompletionScreen(response) {
      const screen = document.getElementById('completion-screen');
      if (!screen) return;

      screen.innerHTML = `
        <div class="completion-content">
          <h2>🧘 Routine Complete!</h2>
          <p>Great job on completing your yoga practice!</p>
          ${response.achievements && response.achievements.length > 0 ? `
            <div class="achievements-unlocked">
              <h3>🏆 Achievements Unlocked!</h3>
              ${response.achievements.map(a => `<p>${a}</p>`).join('')}
            </div>
          ` : ''}
          <button class="btn btn-primary" onclick="Yoga.closeCompletion()">Continue</button>
        </div>
      `;

      screen.classList.remove('hidden');
    },

    closeCompletion() {
      const screen = document.getElementById('completion-screen');
      if (screen) screen.classList.add('hidden');
    },

    async viewRoutineDetails(routineId) {
      try {
        const response = await this.fetchAPI(`/api/yoga/routines/${routineId}`);
        
        if (response.success) {
          this.showRoutinePreview(response.routine);
        }
      } catch (error) {
        console.error('Error loading routine details:', error);
      }
    },

    showRoutinePreview(routine) {
      const modal = document.getElementById('routine-preview-modal');
      if (!modal) return;

      const content = modal.querySelector('.modal-content');
      if (content) {
        content.innerHTML = `
          <button class="modal-close" onclick="this.closest('.modal').classList.add('hidden')">&times;</button>
          <h2>${this.escapeHtml(routine.title)}</h2>
          <p>${this.escapeHtml(routine.description)}</p>
          <div class="routine-meta">
            <span>⏱️ ${Math.round(routine.duration / 60)} min</span>
            <span>🧘 ${routine.poseSequence.length} poses</span>
            <span>${this.getDifficultyIcon(routine.difficulty)} ${routine.difficulty}</span>
          </div>
          <h3>Pose Sequence:</h3>
          <ol class="pose-sequence">
            ${routine.poseSequence.map((seq, i) => `
              <li>
                <strong>${seq.pose?.name || 'Pose'}</strong>
                ${seq.side ? `(${seq.side} side)` : ''}
                - ${seq.duration}s
              </li>
            `).join('')}
          </ol>
          <button class="btn btn-primary" onclick="Yoga.startRoutine('${routine.id}'); this.closest('.modal').classList.add('hidden');">
            ▶️ Start Routine
          </button>
        `;
      }

      modal.classList.remove('hidden');
    },

    async viewPoseDetails(poseId) {
      try {
        const response = await this.fetchAPI(`/api/yoga/poses/${poseId}`);
        
        if (response.success) {
          this.showPoseModal(response.pose);
        }
      } catch (error) {
        console.error('Error loading pose details:', error);
      }
    },

    showPoseModal(pose) {
      const modal = document.getElementById('pose-modal');
      if (!modal) return;

      const content = modal.querySelector('.modal-content');
      if (content) {
        content.innerHTML = `
          <button class="modal-close" onclick="this.closest('.modal').classList.add('hidden')">&times;</button>
          <h2>${this.escapeHtml(pose.name)}</h2>
          <p class="sanskrit">${this.escapeHtml(pose.sanskritName)}</p>
          <p>${this.escapeHtml(pose.description)}</p>
          
          <h3>Benefits:</h3>
          <ul>${pose.benefits.map(b => `<li>${this.escapeHtml(b)}</li>`).join('')}</ul>
          
          <h3>Instructions:</h3>
          <ol>${pose.instructions.map(i => `<li>${this.escapeHtml(i)}</li>`).join('')}</ol>
          
          <h3>Precautions:</h3>
          <ul class="precautions">${pose.precautions.map(p => `<li>⚠️ ${this.escapeHtml(p)}</li>`).join('')}</ul>
          
          <div class="pose-meta">
            <span>Category: ${pose.category}</span>
            <span>Difficulty: ${pose.difficulty}</span>
            <span>Hold: ${pose.duration}s</span>
          </div>
        `;
      }

      modal.classList.remove('hidden');
    },

    async toggleFavorite(routineId) {
      try {
        await this.fetchAPI(`/api/yoga/favorites/routine/${routineId}`, {
          method: 'POST'
        });
        this.showSuccess('Added to favorites');
      } catch (error) {
        try {
          await this.fetchAPI(`/api/yoga/favorites/routine/${routineId}`, {
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
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    getCategoryIcon(category) {
      const icons = {
        morning: '🌅',
        evening: '🌙',
        stress_relief: '😌',
        anxiety: '🌊',
        flexibility: '🧘',
        strength: '💪',
        back_pain: '🔙',
        sleep: '😴',
        beginner: '🌱',
        intermediate: '🌿',
        advanced: '🌳'
      };
      return icons[category] || '🧎';
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
  window.Yoga = Yoga;

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Yoga.init());
  } else {
    Yoga.init();
  }
})();
