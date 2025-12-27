/**
 * AR Experience Dashboard
 * Central hub for all AR features: Voice Journal, AR Cards, and 3D Avatars
 */

class ARDashboard {
  constructor() {
    this.init();
  }

  async init() {
    this.render();
    await this.loadStats();
  }

  render() {
    const container = document.getElementById('app');
    container.innerHTML = `
      <div class="max-w-7xl mx-auto py-8 px-4">
        <!-- Header -->
        <div class="text-center mb-12">
          <h1 class="text-5xl font-bold text-gray-800 mb-4">
            <i class="fas fa-cube text-purple-600"></i>
            AR Experience Dashboard
          </h1>
          <p class="text-gray-600 text-xl">
            Explore your emotions in augmented reality
          </p>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-2">
              <i class="fas fa-microphone text-3xl opacity-80"></i>
              <span id="voice-count" class="text-4xl font-bold">0</span>
            </div>
            <p class="text-purple-100 text-sm">Voice Journals</p>
          </div>

          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-2">
              <i class="fas fa-id-card text-3xl opacity-80"></i>
              <span id="card-count" class="text-4xl font-bold">0</span>
            </div>
            <p class="text-blue-100 text-sm">AR Mood Cards</p>
          </div>

          <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-2">
              <i class="fas fa-robot text-3xl opacity-80"></i>
              <span id="avatar-views" class="text-4xl font-bold">0</span>
            </div>
            <p class="text-green-100 text-sm">Avatar Views</p>
          </div>

          <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-2">
              <i class="fas fa-eye text-3xl opacity-80"></i>
              <span id="ar-scans" class="text-4xl font-bold">0</span>
            </div>
            <p class="text-orange-100 text-sm">AR Scans</p>
          </div>
        </div>

        <!-- Main Features -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <!-- Voice Journal -->
          <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
            <div class="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
              <i class="fas fa-microphone text-4xl mb-4"></i>
              <h2 class="text-2xl font-bold">Voice Journal</h2>
              <p class="text-purple-100 text-sm mt-2">
                Speak your feelings, we'll transcribe and analyze
              </p>
            </div>
            <div class="p-6">
              <ul class="space-y-3 mb-6">
                <li class="flex items-start">
                  <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span class="text-gray-700">AI-powered transcription</span>
                </li>
                <li class="flex items-start">
                  <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span class="text-gray-700">Emotion detection from voice</span>
                </li>
                <li class="flex items-start">
                  <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span class="text-gray-700">Private and secure storage</span>
                </li>
              </ul>
              <a href="/voice-journal" class="block w-full text-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                Open Voice Journal
              </a>
            </div>
          </div>

          <!-- AR Mood Cards -->
          <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
            <div class="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <i class="fas fa-id-card text-4xl mb-4"></i>
              <h2 class="text-2xl font-bold">AR Mood Cards</h2>
              <p class="text-blue-100 text-sm mt-2">
                Print and scan cards to visualize emotions in AR
              </p>
            </div>
            <div class="p-6">
              <ul class="space-y-3 mb-6">
                <li class="flex items-start">
                  <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span class="text-gray-700">Create custom mood cards</span>
                </li>
                <li class="flex items-start">
                  <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span class="text-gray-700">Printable with QR codes</span>
                </li>
                <li class="flex items-start">
                  <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span class="text-gray-700">AR experience with phone</span>
                </li>
              </ul>
              <a href="/ar-cards" class="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Create AR Cards
              </a>
            </div>
          </div>

          <!-- 3D Avatar -->
          <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
            <div class="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
              <i class="fas fa-robot text-4xl mb-4"></i>
              <h2 class="text-2xl font-bold">3D Mood Avatar</h2>
              <p class="text-green-100 text-sm mt-2">
                Your emotions visualized as a 3D character
              </p>
            </div>
            <div class="p-6">
              <ul class="space-y-3 mb-6">
                <li class="flex items-start">
                  <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span class="text-gray-700">Real-time mood reflection</span>
                </li>
                <li class="flex items-start">
                  <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span class="text-gray-700">Interactive 3D experience</span>
                </li>
                <li class="flex items-start">
                  <i class="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span class="text-gray-700">Share avatar snapshots</span>
                </li>
              </ul>
              <a href="/3d-avatar" class="block w-full text-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                View Your Avatar
              </a>
            </div>
          </div>
        </div>

        <!-- Technology Stack -->
        <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-8 mb-12">
          <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
            <i class="fas fa-code text-purple-600 mr-2"></i>
            Powered by Cutting-Edge Technology
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white rounded-lg p-6 text-center">
              <img src="https://raw.githubusercontent.com/AR-js-org/AR.js/master/logo.png" alt="AR.js" class="h-16 mx-auto mb-4" onerror="this.style.display='none'">
              <h3 class="font-bold text-gray-800 mb-2">AR.js</h3>
              <p class="text-sm text-gray-600">Marker-based augmented reality for mood cards</p>
            </div>
            <div class="bg-white rounded-lg p-6 text-center">
              <div class="text-4xl mb-4">🎨</div>
              <h3 class="font-bold text-gray-800 mb-2">Google Model Viewer</h3>
              <p class="text-sm text-gray-600">Interactive 3D model rendering with AR support</p>
            </div>
            <div class="bg-white rounded-lg p-6 text-center">
              <div class="text-4xl mb-4">🌐</div>
              <h3 class="font-bold text-gray-800 mb-2">WebXR Device API</h3>
              <p class="text-sm text-gray-600">Future-ready immersive experiences (coming soon)</p>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">
            <i class="fas fa-history text-blue-600 mr-2"></i>
            Recent AR Activity
          </h2>
          <div id="recent-activity" class="space-y-4">
            <div class="text-center py-8 text-gray-500">
              <i class="fas fa-spinner fa-spin text-3xl mb-3"></i>
              <p>Loading activity...</p>
            </div>
          </div>
        </div>

        <!-- Getting Started Guide -->
        <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
            <i class="fas fa-rocket text-blue-600 mr-2"></i>
            Getting Started with AR Features
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white rounded-lg p-6">
              <div class="text-3xl mb-3">1️⃣</div>
              <h3 class="font-bold text-gray-800 mb-2">Try Voice Journal</h3>
              <p class="text-sm text-gray-600">
                Start by recording your first voice entry. Speak naturally about your day and emotions.
              </p>
            </div>
            <div class="bg-white rounded-lg p-6">
              <div class="text-3xl mb-3">2️⃣</div>
              <h3 class="font-bold text-gray-800 mb-2">Create AR Cards</h3>
              <p class="text-sm text-gray-600">
                Generate mood cards, print them, and scan with your phone to see AR visualizations.
              </p>
            </div>
            <div class="bg-white rounded-lg p-6">
              <div class="text-3xl mb-3">3️⃣</div>
              <h3 class="font-bold text-gray-800 mb-2">Meet Your Avatar</h3>
              <p class="text-sm text-gray-600">
                Watch your 3D avatar reflect your emotional state and interact with it in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.loadRecentActivity();
  }

  async loadStats() {
    try {
      const token = localStorage.getItem('session_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Load voice journal count
      const voiceResponse = await axios.get('/api/voice-journal', { headers });
      if (voiceResponse.data.success) {
        document.getElementById('voice-count').textContent = voiceResponse.data.entries.length;
      }

      // Load AR cards count
      const cardsResponse = await axios.get('/api/ar-cards', { headers });
      if (cardsResponse.data.success) {
        document.getElementById('card-count').textContent = cardsResponse.data.cards.length;
      }

      // Mock stats for now
      document.getElementById('avatar-views').textContent = Math.floor(Math.random() * 50);
      document.getElementById('ar-scans').textContent = Math.floor(Math.random() * 25);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  async loadRecentActivity() {
    const container = document.getElementById('recent-activity');
    
    try {
      const token = localStorage.getItem('session_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Get recent voice journals
      const voiceResponse = await axios.get('/api/voice-journal', { headers });
      const voiceEntries = voiceResponse.data.success ? voiceResponse.data.entries.slice(0, 3) : [];

      // Get recent AR cards
      const cardsResponse = await axios.get('/api/ar-cards', { headers });
      const cardEntries = cardsResponse.data.success ? cardsResponse.data.cards.slice(0, 3) : [];

      if (voiceEntries.length === 0 && cardEntries.length === 0) {
        container.innerHTML = `
          <div class="text-center py-8 text-gray-500">
            <i class="fas fa-inbox text-4xl mb-3"></i>
            <p>No activity yet. Start exploring AR features!</p>
          </div>
        `;
        return;
      }

      const activities = [
        ...voiceEntries.map(entry => ({
          type: 'voice',
          icon: 'microphone',
          color: 'purple',
          title: 'Voice Journal Entry',
          description: entry.transcription.substring(0, 100) + '...',
          time: this.formatTime(entry.created_at)
        })),
        ...cardEntries.map(card => ({
          type: 'card',
          icon: 'id-card',
          color: 'blue',
          title: 'AR Mood Card Created',
          description: `${card.emotion} - Mood Score: ${card.mood_score}/10`,
          time: this.formatTime(card.created_at)
        }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

      container.innerHTML = activities.map(activity => `
        <div class="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
          <div class="flex-shrink-0 w-12 h-12 bg-${activity.color}-100 rounded-full flex items-center justify-center">
            <i class="fas fa-${activity.icon} text-${activity.color}-600"></i>
          </div>
          <div class="flex-1">
            <h4 class="font-semibold text-gray-800">${activity.title}</h4>
            <p class="text-sm text-gray-600 mt-1">${activity.description}</p>
            <p class="text-xs text-gray-500 mt-2">${activity.time}</p>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Failed to load recent activity:', error);
      container.innerHTML = `
        <div class="text-center py-8 text-red-500">
          <i class="fas fa-exclamation-circle text-3xl mb-3"></i>
          <p>Failed to load activity</p>
        </div>
      `;
    }
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }
}

// Initialize
const arDashboard = new ARDashboard();
