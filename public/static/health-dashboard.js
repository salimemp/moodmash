// Configure axios to send cookies with all requests
if (typeof axios !== 'undefined') { axios.defaults.withCredentials = true; }

/**
 * Health Dashboard - Frontend
 * Comprehensive health metrics visualization and tracking
 * Version: 9.0.0
 */

console.log('[Health Dashboard] Initializing...');

let healthData = null;
let trendsData = null;
let healthChart = null;
let trendChart = null;

// Initialize dashboard
async function init() {
  console.log('[Health Dashboard] Starting initialization...');
  
  await loadHealthMetrics();
  await loadTrends('30d');
  
  renderHealthDashboard();
  setupEventListeners();
  
  console.log('[Health Dashboard] Ready!');
}

// Load current health metrics
async function loadHealthMetrics() {
  try {
    const response = await axios.get('/api/health/metrics');
    if (response.data.success) {
      healthData = response.data.data;
      console.log('[Health Dashboard] Metrics loaded:', healthData);
    }
  } catch (error) {
    console.error('[Health Dashboard] Error loading metrics:', error);
    showError('Failed to load health metrics');
  }
}

// Load trend data
async function loadTrends(period = '30d') {
  try {
    const response = await axios.get(`/api/health/trends/${period}`);
    if (response.data.success) {
      trendsData = response.data.data;
      console.log('[Health Dashboard] Trends loaded:', trendsData);
    }
  } catch (error) {
    console.error('[Health Dashboard] Error loading trends:', error);
  }
}

// Render the complete dashboard
function renderHealthDashboard() {
  const container = document.getElementById('app');
  if (!container) return;
  
  container.innerHTML = `
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">
          <i class="fas fa-heartbeat mr-2 text-pink-500"></i>
          Health Dashboard
        </h1>
        <p class="text-gray-600">Comprehensive mental wellness metrics and insights</p>
      </div>
      
      <!-- Crisis Risk Alert (if needed) -->
      ${renderCrisisAlert()}
      
      <!-- Main Metrics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        ${renderMetricCard('Mental Health Score', healthData?.mental_health_score, 100, 'brain', 'purple')}
        ${renderMetricCard('Mood Stability', (healthData?.mood_stability_index * 100).toFixed(0), 100, 'balance-scale', 'blue')}
        ${renderMetricCard('Sleep Quality', healthData?.sleep_quality_score?.toFixed(1), 10, 'bed', 'indigo')}
        ${renderMetricCard('Stress Level', healthData?.stress_level, 5, 'exclamation-triangle', 'red', true)}
      </div>
      
      <!-- Detailed Metrics -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Mood Trend Card -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">
            <i class="fas fa-chart-line mr-2 text-green-500"></i>
            Mood Trend
          </h2>
          ${renderTrendIndicator()}
        </div>
        
        <!-- Time of Day Analysis -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">
            <i class="fas fa-clock mr-2 text-orange-500"></i>
            Best & Worst Times
          </h2>
          ${renderTimeOfDayAnalysis()}
        </div>
      </div>
      
      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Emotion Distribution -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">
            <i class="fas fa-pie-chart mr-2 text-blue-500"></i>
            Emotion Distribution
          </h2>
          <canvas id="emotionChart" width="400" height="300"></canvas>
        </div>
        
        <!-- 30-Day Trend -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">
            <i class="fas fa-chart-area mr-2 text-purple-500"></i>
            30-Day Health Trend
          </h2>
          <canvas id="trendChart" width="400" height="300"></canvas>
        </div>
      </div>
      
      <!-- Additional Insights -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        ${renderInsightCard('Activity Consistency', (healthData?.activity_consistency * 100).toFixed(0) + '%', 'running', 'green')}
        ${renderInsightCard('Data Points', healthData?.data_points_used, 'database', 'gray')}
        ${renderInsightCard('Analysis Period', healthData?.calculation_period_days + ' days', 'calendar', 'blue')}
      </div>
      
      <!-- Export & Actions -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-download mr-2 text-green-500"></i>
          Export & Actions
        </h2>
        <div class="flex flex-wrap gap-4">
          <button onclick="exportHealthReport('pdf')" class="btn-primary">
            <i class="fas fa-file-pdf mr-2"></i>Export PDF Report
          </button>
          <button onclick="exportHealthReport('csv')" class="btn-secondary">
            <i class="fas fa-file-csv mr-2"></i>Export CSV Data
          </button>
          <button onclick="refreshMetrics()" class="btn-secondary">
            <i class="fas fa-sync mr-2"></i>Refresh Metrics
          </button>
        </div>
      </div>
      
      <!-- Professional Support Link (if needed) -->
      ${renderProfessionalSupportBanner()}
    </div>
  `;
  
  // Initialize charts after DOM is ready
  setTimeout(() => {
    initializeCharts();
  }, 100);
}

// Render metric card
function renderMetricCard(title, value, maxValue, icon, color, inverse = false) {
  if (!healthData) {
    return `<div class="bg-white rounded-lg shadow-lg p-6 animate-pulse">
      <div class="h-20 bg-gray-200 rounded"></div>
    </div>`;
  }
  
  const percentage = (value / maxValue) * 100;
  const colorClass = inverse ? 
    (percentage < 40 ? 'text-green-500' : percentage < 70 ? 'text-yellow-500' : 'text-red-500') :
    (percentage < 40 ? 'text-red-500' : percentage < 70 ? 'text-yellow-500' : 'text-green-500');
  
  return `
    <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div class="flex items-center justify-between mb-2">
        <span class="text-gray-600 text-sm font-medium">${title}</span>
        <i class="fas fa-${icon} text-${color}-500 text-xl"></i>
      </div>
      <div class="text-3xl font-bold ${colorClass} mb-2">${value}</div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div class="bg-${color}-500 h-2 rounded-full transition-all duration-500" 
             style="width: ${Math.min(percentage, 100)}%"></div>
      </div>
      <div class="text-xs text-gray-500 mt-1">out of ${maxValue}</div>
    </div>
  `;
}

// Render crisis alert
function renderCrisisAlert() {
  if (!healthData || healthData.crisis_risk_level === 'low') return '';
  
  const alertColors = {
    'moderate': 'bg-yellow-50 border-yellow-300 text-yellow-800',
    'high': 'bg-orange-50 border-orange-300 text-orange-800',
    'critical': 'bg-red-50 border-red-300 text-red-800'
  };
  
  const alertIcons = {
    'moderate': 'exclamation-circle',
    'high': 'exclamation-triangle',
    'critical': 'heart-broken'
  };
  
  const color = alertColors[healthData.crisis_risk_level] || alertColors.moderate;
  const icon = alertIcons[healthData.crisis_risk_level] || alertIcons.moderate;
  
  return `
    <div class="mb-6 p-6 border-l-4 rounded ${color}">
      <div class="flex items-start">
        <i class="fas fa-${icon} text-2xl mr-4 mt-1"></i>
        <div class="flex-1">
          <h3 class="text-lg font-bold mb-2">Mental Health Alert: ${healthData.crisis_risk_level.toUpperCase()} Risk</h3>
          <p class="mb-4">Your mental health metrics indicate ${healthData.crisis_risk_level} risk. Please consider reaching out for support.</p>
          <div class="flex gap-3">
            <a href="/support" class="btn-primary">
              <i class="fas fa-phone mr-2"></i>Get Support Now
            </a>
            <a href="/ai-insights" class="btn-secondary">
              <i class="fas fa-lightbulb mr-2"></i>View AI Insights
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Render trend indicator
function renderTrendIndicator() {
  if (!healthData) return '<div>Loading...</div>';
  
  const trendInfo = {
    'improving': { icon: 'arrow-up', color: 'green', text: 'Your mood is improving! Keep up the good work.' },
    'stable': { icon: 'equals', color: 'blue', text: 'Your mood is stable. Maintain your current routines.' },
    'declining': { icon: 'arrow-down', color: 'orange', text: 'Your mood is declining. Consider seeking support.' },
    'critical': { icon: 'exclamation-triangle', color: 'red', text: 'Critical trend detected. Please seek professional help.' }
  };
  
  const info = trendInfo[healthData.mood_trend];
  
  return `
    <div class="flex items-center mb-4">
      <div class="bg-${info.color}-100 rounded-full p-4 mr-4">
        <i class="fas fa-${info.icon} text-${info.color}-600 text-3xl"></i>
      </div>
      <div>
        <div class="text-2xl font-bold text-${info.color}-600 capitalize">${healthData.mood_trend}</div>
        <div class="text-gray-600">${info.text}</div>
      </div>
    </div>
    <div class="mt-4 p-4 bg-gray-50 rounded-lg">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <span class="text-gray-600 text-sm">Positive Emotions</span>
          <div class="text-xl font-bold text-green-600">${(healthData.positive_emotion_ratio * 100).toFixed(0)}%</div>
        </div>
        <div>
          <span class="text-gray-600 text-sm">Negative Emotions</span>
          <div class="text-xl font-bold text-red-600">${(healthData.negative_emotion_ratio * 100).toFixed(0)}%</div>
        </div>
      </div>
    </div>
  `;
}

// Render time of day analysis
function renderTimeOfDayAnalysis() {
  if (!healthData) return '<div>Loading...</div>';
  
  const timeIcons = {
    'morning': '☀️',
    'afternoon': '🌤️',
    'evening': '🌆',
    'night': '🌙'
  };
  
  return `
    <div class="space-y-4">
      <div class="flex items-center justify-between p-4 bg-green-50 rounded-lg">
        <div class="flex items-center">
          <span class="text-3xl mr-3">${timeIcons[healthData.best_time_of_day]}</span>
          <div>
            <div class="text-sm text-gray-600">Best Time of Day</div>
            <div class="text-xl font-bold text-green-600 capitalize">${healthData.best_time_of_day}</div>
          </div>
        </div>
        <i class="fas fa-check-circle text-green-500 text-2xl"></i>
      </div>
      
      <div class="flex items-center justify-between p-4 bg-red-50 rounded-lg">
        <div class="flex items-center">
          <span class="text-3xl mr-3">${timeIcons[healthData.worst_time_of_day]}</span>
          <div>
            <div class="text-sm text-gray-600">Most Challenging Time</div>
            <div class="text-xl font-bold text-red-600 capitalize">${healthData.worst_time_of_day}</div>
          </div>
        </div>
        <i class="fas fa-exclamation-circle text-red-500 text-2xl"></i>
      </div>
      
      <div class="p-4 bg-blue-50 rounded-lg">
        <p class="text-sm text-gray-700">
          <i class="fas fa-lightbulb mr-2 text-yellow-500"></i>
          <strong>Tip:</strong> Plan important activities during your best time (${healthData.best_time_of_day}) 
          and practice self-care during ${healthData.worst_time_of_day}.
        </p>
      </div>
    </div>
  `;
}

// Render insight card
function renderInsightCard(title, value, icon, color) {
  return `
    <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div class="flex items-center justify-between mb-2">
        <i class="fas fa-${icon} text-${color}-500 text-2xl"></i>
      </div>
      <div class="text-2xl font-bold text-gray-800 mb-1">${value}</div>
      <div class="text-sm text-gray-600">${title}</div>
    </div>
  `;
}

// Render professional support banner
function renderProfessionalSupportBanner() {
  if (!healthData || (healthData.crisis_risk_level === 'low' && healthData.stress_level < 3)) {
    return '';
  }
  
  return `
    <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-lg p-6 border border-purple-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <i class="fas fa-user-md text-purple-600 text-3xl mr-4"></i>
          <div>
            <h3 class="text-lg font-bold text-gray-800 mb-1">Consider Professional Support</h3>
            <p class="text-gray-600 text-sm">Connect with a mental health professional for personalized guidance</p>
          </div>
        </div>
        <a href="/support" class="btn-primary whitespace-nowrap">
          Find Help <i class="fas fa-arrow-right ml-2"></i>
        </a>
      </div>
    </div>
  `;
}

// Initialize charts
function initializeCharts() {
  if (!healthData) return;
  
  // Emotion Distribution Chart
  const emotionCtx = document.getElementById('emotionChart');
  if (emotionCtx) {
    healthChart = new Chart(emotionCtx, {
      type: 'doughnut',
      data: {
        labels: ['Positive', 'Negative', 'Neutral'],
        datasets: [{
          data: [
            (healthData.positive_emotion_ratio * 100).toFixed(0),
            (healthData.negative_emotion_ratio * 100).toFixed(0),
            ((1 - healthData.positive_emotion_ratio - healthData.negative_emotion_ratio) * 100).toFixed(0)
          ],
          backgroundColor: ['#10b981', '#ef4444', '#6b7280'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
  
  // Trend Chart (placeholder - will be enhanced with historical data)
  const trendCtx = document.getElementById('trendChart');
  if (trendCtx) {
    trendChart = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          label: 'Mental Health Score',
          data: [
            healthData.mental_health_score - 10,
            healthData.mental_health_score - 5,
            healthData.mental_health_score + 2,
            healthData.mental_health_score
          ],
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
}

// Export health report
async function exportHealthReport(format) {
  console.log(`[Health Dashboard] Exporting report as ${format}...`);
  
  if (format === 'csv') {
    const csv = convertToCSV(healthData);
    downloadFile(csv, `health-report-${Date.now()}.csv`, 'text/csv');
  } else if (format === 'pdf') {
    alert('PDF export coming soon! For now, please use Print to PDF from your browser.');
    window.print();
  }
}

// Convert health data to CSV
function convertToCSV(data) {
  const headers = Object.keys(data).join(',');
  const values = Object.values(data).join(',');
  return `${headers}\n${values}`;
}

// Download file
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Refresh metrics
async function refreshMetrics() {
  console.log('[Health Dashboard] Refreshing metrics...');
  await loadHealthMetrics();
  await loadTrends('30d');
  renderHealthDashboard();
}

// Setup event listeners
function setupEventListeners() {
  // Add any additional event listeners here
}

// Show error message
function showError(message) {
  const container = document.getElementById('app');
  if (!container) return;
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded';
  errorDiv.innerHTML = `
    <div class="flex items-center">
      <i class="fas fa-exclamation-circle text-red-500 mr-3"></i>
      <p class="text-red-700">${message}</p>
    </div>
  `;
  container.insertBefore(errorDiv, container.firstChild);
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('[Health Dashboard] Script loaded');
