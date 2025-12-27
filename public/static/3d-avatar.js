/**
 * 3D Mood Avatar
 * Uses Google Model Viewer for interactive 3D mood avatars
 */

class MoodAvatar {
  constructor() {
    this.currentEmotion = 'neutral';
    this.currentMoodScore = 5;
    this.init();
  }

  async init() {
    this.render();
    await this.loadAvatarState();
  }

  render() {
    const container = document.getElementById('app');
    container.innerHTML = `
      <div class="max-w-6xl mx-auto py-8 px-4">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-800 mb-4">
            <i class="fas fa-robot text-purple-600"></i>
            Your 3D Mood Avatar
          </h1>
          <p class="text-gray-600 text-lg">
            Watch your mood come to life in 3D! Your avatar reflects your emotional journey.
          </p>
        </div>

        <!-- Avatar Viewer -->
        <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div class="flex flex-col lg:flex-row gap-8">
            <!-- 3D Model Viewer -->
            <div class="flex-1">
              <div id="avatar-container" class="relative bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg overflow-hidden" style="height: 500px;">
                <model-viewer
                  id="avatar-viewer"
                  src="/models/neutral.glb"
                  alt="Mood Avatar"
                  auto-rotate
                  camera-controls
                  shadow-intensity="1"
                  exposure="1"
                  style="width: 100%; height: 100%;"
                  loading="eager"
                >
                  <div slot="progress-bar" class="absolute inset-0 flex items-center justify-center">
                    <div class="text-center">
                      <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
                      <p class="text-gray-600">Loading your avatar...</p>
                    </div>
                  </div>
                </model-viewer>
              </div>

              <!-- Controls -->
              <div class="mt-4 flex gap-2 justify-center">
                <button onclick="avatarManager.resetCamera()" class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition">
                  <i class="fas fa-undo"></i> Reset View
                </button>
                <button onclick="avatarManager.toggleAnimation()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                  <i class="fas fa-play"></i> Toggle Animation
                </button>
                <button onclick="avatarManager.captureScreenshot()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  <i class="fas fa-camera"></i> Snapshot
                </button>
              </div>
            </div>

            <!-- Avatar Info -->
            <div class="w-full lg:w-96">
              <div class="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Avatar Status</h3>
                
                <div class="space-y-4">
                  <!-- Current Emotion -->
                  <div>
                    <label class="text-sm font-semibold text-gray-700">Current Emotion</label>
                    <div id="current-emotion" class="mt-2 px-4 py-3 bg-white rounded-lg text-lg font-bold text-purple-600">
                      Loading...
                    </div>
                  </div>

                  <!-- Mood Score -->
                  <div>
                    <label class="text-sm font-semibold text-gray-700">Mood Score</label>
                    <div class="mt-2 flex items-center gap-3">
                      <div class="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div id="mood-bar" class="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all" style="width: 50%"></div>
                      </div>
                      <span id="mood-score-text" class="text-lg font-bold text-gray-800">5/10</span>
                    </div>
                  </div>

                  <!-- Avatar Color -->
                  <div>
                    <label class="text-sm font-semibold text-gray-700">Avatar Color</label>
                    <div class="mt-2 flex items-center gap-3">
                      <div id="avatar-color-display" class="w-12 h-12 rounded-lg border-2 border-gray-300" style="background: #6B7280;"></div>
                      <span id="avatar-color-name" class="text-gray-600">Neutral Gray</span>
                    </div>
                  </div>

                  <!-- Animation -->
                  <div>
                    <label class="text-sm font-semibold text-gray-700">Current Animation</label>
                    <div id="current-animation" class="mt-2 px-4 py-3 bg-white rounded-lg text-gray-600">
                      Idle
                    </div>
                  </div>
                </div>

                <!-- Emotion Selector -->
                <div class="mt-6">
                  <label class="text-sm font-semibold text-gray-700 mb-3 block">Change Emotion Preview</label>
                  <div class="grid grid-cols-2 gap-2">
                    ${this.getEmotionButtons()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Features -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6 text-center">
            <div class="text-4xl mb-3">🎨</div>
            <h3 class="font-bold text-gray-800 mb-2">Dynamic Colors</h3>
            <p class="text-sm text-gray-600">Your avatar's color changes based on your mood</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 text-center">
            <div class="text-4xl mb-3">✨</div>
            <h3 class="font-bold text-gray-800 mb-2">Smooth Animations</h3>
            <p class="text-sm text-gray-600">Watch emotions come alive with fluid animations</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 text-center">
            <div class="text-4xl mb-3">🔄</div>
            <h3 class="font-bold text-gray-800 mb-2">Real-time Updates</h3>
            <p class="text-sm text-gray-600">Syncs with your mood entries automatically</p>
          </div>
        </div>

        <!-- Info Box -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 class="font-bold text-blue-900 mb-2 flex items-center">
            <i class="fas fa-info-circle mr-2"></i>
            How It Works
          </h3>
          <ul class="text-blue-800 space-y-2">
            <li>• Your avatar reflects your recent mood entries and emotional patterns</li>
            <li>• Use your mouse or touch to rotate, zoom, and explore your 3D avatar</li>
            <li>• Different emotions trigger unique colors and animations</li>
            <li>• Take snapshots to share your emotional journey with friends</li>
          </ul>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  getEmotionButtons() {
    const emotions = [
      { name: 'happy', icon: '😊', color: '#FCD34D' },
      { name: 'sad', icon: '😢', color: '#3B82F6' },
      { name: 'anxious', icon: '😰', color: '#EF4444' },
      { name: 'calm', icon: '😌', color: '#10B981' },
      { name: 'excited', icon: '🤩', color: '#F59E0B' },
      { name: 'angry', icon: '😠', color: '#DC2626' },
      { name: 'peaceful', icon: '😇', color: '#8B5CF6' },
      { name: 'neutral', icon: '😐', color: '#6B7280' }
    ];

    return emotions.map(emotion => `
      <button 
        onclick="avatarManager.previewEmotion('${emotion.name}')" 
        class="px-3 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
        style="border-color: ${emotion.color};"
      >
        <span class="text-2xl">${emotion.icon}</span>
        <div class="text-xs font-semibold text-gray-700 mt-1">${emotion.name}</div>
      </button>
    `).join('');
  }

  setupEventListeners() {
    // Handle model viewer errors
    const modelViewer = document.getElementById('avatar-viewer');
    if (modelViewer) {
      modelViewer.addEventListener('error', (event) => {
        console.error('Model viewer error:', event);
        // Fallback to placeholder
        this.showPlaceholder();
      });

      modelViewer.addEventListener('load', () => {
        console.log('Model loaded successfully');
      });
    }
  }

  showPlaceholder() {
    const container = document.getElementById('avatar-container');
    container.innerHTML = `
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <div class="text-8xl mb-4">${this.getEmotionEmoji(this.currentEmotion)}</div>
          <p class="text-xl font-bold text-gray-800 mb-2">${this.capitalizeFirst(this.currentEmotion)}</p>
          <p class="text-gray-600">3D model preview</p>
          <p class="text-sm text-gray-500 mt-4">3D models will be available soon!</p>
        </div>
      </div>
    `;
  }

  async loadAvatarState() {
    try {
      const response = await axios.get('/api/avatar/state', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('session_token')}` }
      });

      if (response.data.success && response.data.avatar) {
        const avatar = response.data.avatar;
        this.currentEmotion = avatar.emotion;
        this.currentMoodScore = avatar.mood_score;

        this.updateAvatarDisplay(avatar);
      }
    } catch (error) {
      console.error('Failed to load avatar state:', error);
      // Show placeholder with default emotion
      this.showPlaceholder();
      this.updateAvatarInfo();
    }
  }

  updateAvatarDisplay(avatar) {
    // Update model viewer
    const modelViewer = document.getElementById('avatar-viewer');
    if (modelViewer) {
      // Try to load the model, fallback to placeholder if it doesn't exist
      modelViewer.src = avatar.model_url;
      
      // Set environment color based on emotion
      modelViewer.style.setProperty('--poster-color', avatar.color);
    }

    this.updateAvatarInfo();
  }

  updateAvatarInfo() {
    // Update emotion display
    const emotionEl = document.getElementById('current-emotion');
    if (emotionEl) {
      emotionEl.innerHTML = `${this.getEmotionEmoji(this.currentEmotion)} ${this.capitalizeFirst(this.currentEmotion)}`;
    }

    // Update mood score
    const moodBar = document.getElementById('mood-bar');
    const moodText = document.getElementById('mood-score-text');
    if (moodBar && moodText) {
      const percentage = (this.currentMoodScore / 10) * 100;
      moodBar.style.width = `${percentage}%`;
      moodText.textContent = `${this.currentMoodScore.toFixed(1)}/10`;
    }

    // Update color display
    const colorDisplay = document.getElementById('avatar-color-display');
    const colorName = document.getElementById('avatar-color-name');
    const color = this.getEmotionColor(this.currentEmotion);
    if (colorDisplay && colorName) {
      colorDisplay.style.background = color;
      colorName.textContent = this.getColorName(this.currentEmotion);
    }

    // Update animation
    const animationEl = document.getElementById('current-animation');
    if (animationEl) {
      animationEl.textContent = this.capitalizeFirst(this.getEmotionAnimation(this.currentEmotion));
    }
  }

  previewEmotion(emotion) {
    this.currentEmotion = emotion;
    this.showPlaceholder();
    this.updateAvatarInfo();

    // In production, this would load the actual 3D model for this emotion
    const modelViewer = document.getElementById('avatar-viewer');
    if (modelViewer) {
      modelViewer.src = `/models/${emotion}.glb`;
    }
  }

  resetCamera() {
    const modelViewer = document.getElementById('avatar-viewer');
    if (modelViewer) {
      modelViewer.resetTurntableRotation();
    }
  }

  toggleAnimation() {
    const modelViewer = document.getElementById('avatar-viewer');
    if (modelViewer) {
      const isRotating = modelViewer.getAttribute('auto-rotate') === 'true';
      modelViewer.setAttribute('auto-rotate', !isRotating);
    }
  }

  async captureScreenshot() {
    const modelViewer = document.getElementById('avatar-viewer');
    if (modelViewer && modelViewer.toBlob) {
      const blob = await modelViewer.toBlob({ idealAspect: true });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mood-avatar-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert('Screenshot feature is not available in this browser');
    }
  }

  getEmotionColor(emotion) {
    const colors = {
      'happy': '#FCD34D',
      'sad': '#3B82F6',
      'anxious': '#EF4444',
      'calm': '#10B981',
      'excited': '#F59E0B',
      'angry': '#DC2626',
      'peaceful': '#8B5CF6',
      'neutral': '#6B7280'
    };
    return colors[emotion] || colors['neutral'];
  }

  getEmotionAnimation(emotion) {
    const animations = {
      'happy': 'bounce',
      'sad': 'droop',
      'anxious': 'shake',
      'calm': 'float',
      'excited': 'spin',
      'angry': 'pulse',
      'peaceful': 'sway',
      'neutral': 'idle'
    };
    return animations[emotion] || 'idle';
  }

  getEmotionEmoji(emotion) {
    const emojis = {
      'happy': '😊',
      'sad': '😢',
      'anxious': '😰',
      'calm': '😌',
      'excited': '🤩',
      'angry': '😠',
      'peaceful': '😇',
      'neutral': '😐'
    };
    return emojis[emotion] || '😐';
  }

  getColorName(emotion) {
    const names = {
      'happy': 'Bright Yellow',
      'sad': 'Calming Blue',
      'anxious': 'Alert Red',
      'calm': 'Peaceful Green',
      'excited': 'Vibrant Orange',
      'angry': 'Intense Red',
      'peaceful': 'Serene Purple',
      'neutral': 'Neutral Gray'
    };
    return names[emotion] || 'Neutral Gray';
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Initialize
const avatarManager = new MoodAvatar();
