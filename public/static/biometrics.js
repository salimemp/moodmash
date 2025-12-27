/**
 * Biometrics Dashboard
 * Health data tracking and mood correlations
 */

class BiometricsDashboard {
  constructor() {
    this.sources = [];
    this.biometricData = [];
    this.charts = {};
    this.init();
  }

  async init() {
    this.render();
    await this.loadSources();
    await this.loadBiometricData();
  }

  render() {
    const container = document.getElementById('app');
    container.innerHTML = `
      <div class="max-w-7xl mx-auto py-8 px-4">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-5xl font-bold text-gray-800 mb-4">
            <i class="fas fa-heartbeat text-red-500"></i>
            Health & Biometrics
          </h1>
          <p class="text-gray-600 text-xl">
            Track your health data and discover mood correlations
          </p>
        </div>

        <!-- Connected Devices -->
        <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-3xl font-bold text-gray-800 flex items-center">
              <i class="fas fa-mobile-alt text-blue-500 mr-3"></i>
              Connected Devices
            </h2>
            <button onclick="biometricsDashboard.showConnectModal()" 
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
              <i class="fas fa-plus"></i>
              Connect Device
            </button>
          </div>

          <div id="devices-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="text-center py-8 text-gray-500">
              <i class="fas fa-spinner fa-spin text-3xl mb-3"></i>
              <p>Loading devices...</p>
            </div>
          </div>
        </div>

        <!-- Health Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-2">
              <i class="fas fa-heartbeat text-4xl opacity-80"></i>
              <span id="avg-heart-rate" class="text-4xl font-bold">--</span>
            </div>
            <p class="text-red-100 text-sm">Avg Heart Rate</p>
            <p class="text-xs text-red-200 mt-1">Last 7 days</p>
          </div>

          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-2">
              <i class="fas fa-walking text-4xl opacity-80"></i>
              <span id="avg-steps" class="text-4xl font-bold">--</span>
            </div>
            <p class="text-blue-100 text-sm">Daily Steps</p>
            <p class="text-xs text-blue-200 mt-1">Weekly average</p>
          </div>

          <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-2">
              <i class="fas fa-bed text-4xl opacity-80"></i>
              <span id="avg-sleep" class="text-4xl font-bold">--</span>
            </div>
            <p class="text-purple-100 text-sm">Sleep Hours</p>
            <p class="text-xs text-purple-200 mt-1">Nightly average</p>
          </div>

          <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-2">
              <i class="fas fa-fire text-4xl opacity-80"></i>
              <span id="avg-calories" class="text-4xl font-bold">--</span>
            </div>
            <p class="text-green-100 text-sm">Calories Burned</p>
            <p class="text-xs text-green-200 mt-1">Daily average</p>
          </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Heart Rate Chart -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-chart-line text-red-500 mr-2"></i>
              Heart Rate Trend
            </h3>
            <canvas id="heart-rate-chart" height="200"></canvas>
          </div>

          <!-- Steps Chart -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-chart-bar text-blue-500 mr-2"></i>
              Daily Steps
            </h3>
            <canvas id="steps-chart" height="200"></canvas>
          </div>

          <!-- Sleep Chart -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-moon text-purple-500 mr-2"></i>
              Sleep Quality
            </h3>
            <canvas id="sleep-chart" height="200"></canvas>
          </div>

          <!-- Activity Chart -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-running text-green-500 mr-2"></i>
              Activity Calories
            </h3>
            <canvas id="calories-chart" height="200"></canvas>
          </div>
        </div>

        <!-- Mood Correlations -->
        <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center">
            <i class="fas fa-brain text-purple-500 mr-3"></i>
            AI-Discovered Insights
          </h2>
          <div id="correlations-container" class="space-y-4">
            <div class="text-center py-8 text-gray-500">
              <i class="fas fa-lightbulb text-4xl mb-3"></i>
              <p>We're analyzing your data to find patterns...</p>
              <p class="text-sm mt-2">Insights will appear as we collect more data</p>
            </div>
          </div>
        </div>

        <!-- Info Box -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 class="font-bold text-blue-900 mb-3 flex items-center">
            <i class="fas fa-info-circle mr-2"></i>
            About Health Tracking
          </h3>
          <ul class="text-blue-800 space-y-2 text-sm">
            <li>• Sync your fitness tracker to automatically import health data</li>
            <li>• We analyze correlations between your health metrics and mood</li>
            <li>• All data is private and encrypted</li>
            <li>• You can disconnect devices anytime</li>
            <li>• Requires at least 7 days of data for accurate insights</li>
          </ul>
        </div>
      </div>

      <!-- Connect Device Modal -->
      <div id="connect-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 p-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-800">Connect Health Device</h2>
            <button onclick="biometricsDashboard.hideConnectModal()" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Fitbit -->
            <button onclick="biometricsDashboard.connectDevice('fitbit')" 
              class="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
              <div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-2xl">
                <i class="fas fa-watch"></i>
              </div>
              <div class="text-left">
                <h3 class="font-bold text-gray-800">Fitbit</h3>
                <p class="text-xs text-gray-600">Connect your Fitbit device</p>
              </div>
            </button>

            <!-- Apple Health -->
            <button onclick="biometricsDashboard.connectDevice('apple_health')" 
              class="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-gray-500 hover:bg-gray-50 transition">
              <div class="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center text-white text-2xl">
                <i class="fab fa-apple"></i>
              </div>
              <div class="text-left">
                <h3 class="font-bold text-gray-800">Apple Health</h3>
                <p class="text-xs text-gray-600">Import from Apple Health</p>
              </div>
            </button>

            <!-- Samsung Health -->
            <button onclick="biometricsDashboard.connectDevice('samsung_health')" 
              class="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
              <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white text-2xl">
                <i class="fas fa-mobile-alt"></i>
              </div>
              <div class="text-left">
                <h3 class="font-bold text-gray-800">Samsung Health</h3>
                <p class="text-xs text-gray-600">Connect Samsung Health</p>
              </div>
            </button>

            <!-- Google Fit -->
            <button onclick="biometricsDashboard.connectDevice('google_fit')" 
              class="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition">
              <div class="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center text-white text-2xl">
                <i class="fab fa-google"></i>
              </div>
              <div class="text-left">
                <h3 class="font-bold text-gray-800">Google Fit</h3>
                <p class="text-xs text-gray-600">Connect Google Fit</p>
              </div>
            </button>

            <!-- Garmin -->
            <button onclick="biometricsDashboard.connectDevice('garmin')" 
              class="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-700 hover:bg-blue-50 transition">
              <div class="w-12 h-12 bg-blue-700 rounded-lg flex items-center justify-center text-white text-2xl">
                <i class="fas fa-running"></i>
              </div>
              <div class="text-left">
                <h3 class="font-bold text-gray-800">Garmin</h3>
                <p class="text-xs text-gray-600">Connect Garmin device</p>
              </div>
            </button>

            <!-- Manual Entry -->
            <button onclick="biometricsDashboard.connectDevice('manual')" 
              class="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition">
              <div class="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-white text-2xl">
                <i class="fas fa-edit"></i>
              </div>
              <div class="text-left">
                <h3 class="font-bold text-gray-800">Manual Entry</h3>
                <p class="text-xs text-gray-600">Enter data manually</p>
              </div>
            </button>
          </div>

          <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p class="text-sm text-yellow-800">
              <i class="fas fa-info-circle mr-2"></i>
              <strong>Note:</strong> OAuth integration requires API keys to be configured in production. 
              Manual entry is always available.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  async loadSources() {
    try {
      const response = await axios.get('/api/biometrics/sources', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('session_token')}` }
      });

      if (response.data.success) {
        this.sources = response.data.sources;
        this.renderSources();
      }
    } catch (error) {
      console.error('Failed to load sources:', error);
      document.getElementById('devices-container').innerHTML = `
        <div class="col-span-3 text-center py-8 text-gray-500">
          <i class="fas fa-exclamation-circle text-3xl mb-3"></i>
          <p>Failed to load devices</p>
        </div>
      `;
    }
  }

  renderSources() {
    const container = document.getElementById('devices-container');

    if (this.sources.length === 0) {
      container.innerHTML = `
        <div class="col-span-3 text-center py-8 text-gray-500">
          <i class="fas fa-mobile-alt text-4xl mb-3"></i>
          <p class="mb-4">No devices connected yet</p>
          <button onclick="biometricsDashboard.showConnectModal()" 
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Connect Your First Device
          </button>
        </div>
      `;
      return;
    }

    const sourceIcons = {
      'fitbit': 'fa-watch',
      'apple_health': 'fab fa-apple',
      'samsung_health': 'fa-mobile-alt',
      'google_fit': 'fab fa-google',
      'garmin': 'fa-running',
      'manual': 'fa-edit'
    };

    const sourceColors = {
      'fitbit': 'from-blue-500 to-blue-600',
      'apple_health': 'from-gray-700 to-gray-800',
      'samsung_health': 'from-blue-400 to-blue-500',
      'google_fit': 'from-red-500 to-red-600',
      'garmin': 'from-blue-700 to-blue-800',
      'manual': 'from-purple-500 to-purple-600'
    };

    container.innerHTML = this.sources.map(source => `
      <div class="bg-gradient-to-br ${sourceColors[source.source_type] || 'from-gray-500 to-gray-600'} rounded-xl shadow-lg p-6 text-white">
        <div class="flex items-center justify-between mb-4">
          <i class="fas ${sourceIcons[source.source_type] || 'fa-mobile-alt'} text-3xl opacity-80"></i>
          <div class="px-2 py-1 bg-white bg-opacity-20 rounded text-xs">
            ${source.is_active ? 'Active' : 'Inactive'}
          </div>
        </div>
        
        <h3 class="font-bold text-lg mb-2">${this.formatSourceType(source.source_type)}</h3>
        
        <div class="text-sm opacity-75 space-y-1">
          <p><i class="fas fa-sync mr-2"></i>Last sync: ${source.last_sync_at ? new Date(source.last_sync_at).toLocaleDateString() : 'Never'}</p>
          <p><i class="fas fa-calendar mr-2"></i>Connected: ${new Date(source.created_at).toLocaleDateString()}</p>
        </div>
        
        <button onclick="biometricsDashboard.disconnectSource(${source.id})" 
          class="mt-4 w-full px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm transition">
          Disconnect
        </button>
      </div>
    `).join('');
  }

  formatSourceType(type) {
    const names = {
      'fitbit': 'Fitbit',
      'apple_health': 'Apple Health',
      'samsung_health': 'Samsung Health',
      'google_fit': 'Google Fit',
      'garmin': 'Garmin',
      'manual': 'Manual Entry'
    };
    return names[type] || type;
  }

  async loadBiometricData() {
    try {
      const response = await axios.get('/api/biometrics/data?days=30', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('session_token')}` }
      });

      if (response.data.success) {
        this.biometricData = response.data.data;
        this.updateMetrics();
        this.renderCharts();
      }
    } catch (error) {
      console.error('Failed to load biometric data:', error);
    }
  }

  updateMetrics() {
    const heartRateData = this.biometricData.filter(d => d.data_type === 'heart_rate');
    const stepsData = this.biometricData.filter(d => d.data_type === 'steps');
    const sleepData = this.biometricData.filter(d => d.data_type === 'sleep');
    const caloriesData = this.biometricData.filter(d => d.data_type === 'calories');

    if (heartRateData.length > 0) {
      const avgHr = heartRateData.reduce((sum, d) => sum + d.value, 0) / heartRateData.length;
      document.getElementById('avg-heart-rate').textContent = Math.round(avgHr);
    }

    if (stepsData.length > 0) {
      const avgSteps = stepsData.reduce((sum, d) => sum + d.value, 0) / stepsData.length;
      document.getElementById('avg-steps').textContent = Math.round(avgSteps).toLocaleString();
    }

    if (sleepData.length > 0) {
      const avgSleep = sleepData.reduce((sum, d) => sum + d.value, 0) / sleepData.length;
      document.getElementById('avg-sleep').textContent = (avgSleep / 60).toFixed(1) + 'h';
    }

    if (caloriesData.length > 0) {
      const avgCalories = caloriesData.reduce((sum, d) => sum + d.value, 0) / caloriesData.length;
      document.getElementById('avg-calories').textContent = Math.round(avgCalories).toLocaleString();
    }
  }

  renderCharts() {
    // Only render if Chart.js is available
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded');
      return;
    }

    this.renderHeartRateChart();
    this.renderStepsChart();
    this.renderSleepChart();
    this.renderCaloriesChart();
  }

  renderHeartRateChart() {
    const ctx = document.getElementById('heart-rate-chart');
    if (!ctx) return;

    const data = this.biometricData
      .filter(d => d.data_type === 'heart_rate')
      .slice(-14)
      .map(d => ({
        x: new Date(d.recorded_at).toLocaleDateString(),
        y: d.value
      }));

    if (this.charts.heartRate) this.charts.heartRate.destroy();

    this.charts.heartRate = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.x),
        datasets: [{
          label: 'Heart Rate (BPM)',
          data: data.map(d => d.y),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  renderStepsChart() {
    const ctx = document.getElementById('steps-chart');
    if (!ctx) return;

    const data = this.biometricData
      .filter(d => d.data_type === 'steps')
      .slice(-7)
      .map(d => ({
        x: new Date(d.recorded_at).toLocaleDateString(),
        y: d.value
      }));

    if (this.charts.steps) this.charts.steps.destroy();

    this.charts.steps = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.x),
        datasets: [{
          label: 'Steps',
          data: data.map(d => d.y),
          backgroundColor: 'rgb(59, 130, 246)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  renderSleepChart() {
    const ctx = document.getElementById('sleep-chart');
    if (!ctx) return;

    const data = this.biometricData
      .filter(d => d.data_type === 'sleep')
      .slice(-7)
      .map(d => ({
        x: new Date(d.recorded_at).toLocaleDateString(),
        y: d.value / 60 // Convert to hours
      }));

    if (this.charts.sleep) this.charts.sleep.destroy();

    this.charts.sleep = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.x),
        datasets: [{
          label: 'Sleep Hours',
          data: data.map(d => d.y),
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  renderCaloriesChart() {
    const ctx = document.getElementById('calories-chart');
    if (!ctx) return;

    const data = this.biometricData
      .filter(d => d.data_type === 'calories')
      .slice(-7)
      .map(d => ({
        x: new Date(d.recorded_at).toLocaleDateString(),
        y: d.value
      }));

    if (this.charts.calories) this.charts.calories.destroy();

    this.charts.calories = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.x),
        datasets: [{
          label: 'Calories',
          data: data.map(d => d.y),
          backgroundColor: 'rgb(16, 185, 129)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  showConnectModal() {
    document.getElementById('connect-modal').classList.remove('hidden');
    document.getElementById('connect-modal').classList.add('flex');
  }

  hideConnectModal() {
    document.getElementById('connect-modal').classList.add('hidden');
    document.getElementById('connect-modal').classList.remove('flex');
  }

  async connectDevice(sourceType) {
    if (sourceType === 'manual') {
      alert('Manual entry feature coming soon! You will be able to manually input health data.');
      this.hideConnectModal();
      return;
    }

    // OAuth flow would go here
    alert(`OAuth integration for ${sourceType} requires API keys to be configured. This feature is ready for production deployment with proper credentials.`);
    
    // For demo, create a placeholder connection
    try {
      const response = await axios.post('/api/biometrics/connect', {
        source_type: sourceType
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('session_token')}` }
      });

      if (response.data.success) {
        this.hideConnectModal();
        await this.loadSources();
        alert(`${this.formatSourceType(sourceType)} connected successfully!`);
      }
    } catch (error) {
      console.error('Failed to connect device:', error);
      alert('Failed to connect device. Please try again.');
    }
  }

  async disconnectSource(sourceId) {
    if (!confirm('Are you sure you want to disconnect this device?')) return;

    // TODO: Implement disconnect API
    alert('Device disconnection will be implemented');
  }
}

// Initialize
const biometricsDashboard = new BiometricsDashboard();
