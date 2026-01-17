// Wearables Dashboard JavaScript

document.addEventListener('DOMContentLoaded', loadWearables);

async function loadWearables() {
  await loadDevices();
  await loadActivityData();
  await loadCorrelations();
}

async function loadDevices() {
  try {
    const res = await fetch('/api/wearables');
    const data = await res.json();
    const container = document.getElementById('devices-list');
    
    container.innerHTML = data.providers.map(device => `
      <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
        <div class="flex items-center gap-3">
          <span class="text-2xl">${device.icon}</span>
          <div>
            <div class="font-medium">${device.name}</div>
            <div class="text-sm text-gray-400">
              ${device.connected ? 'Connected' : 'Not connected'}
              ${device.lastSync ? ` • Last sync: ${formatDate(device.lastSync)}` : ''}
            </div>
          </div>
        </div>
        ${device.connected ? `
          <button onclick="disconnectDevice('${device.id}')" 
                  class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm">
            Disconnect
          </button>
        ` : `
          <button onclick="connectDevice('${device.id}')" 
                  class="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm">
            Connect
          </button>
        `}
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load devices:', err);
  }
}

async function connectDevice(provider) {
  try {
    const res = await fetch('/api/wearables/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider })
    });
    const data = await res.json();
    
    if (data.success) {
      alert(data.message + (data.note ? '\n\n' + data.note : ''));
      loadWearables();
    } else {
      alert(data.error || 'Failed to connect');
    }
  } catch (err) {
    alert('Connection failed');
  }
}

async function disconnectDevice(provider) {
  if (!confirm('Disconnect this device?')) return;
  
  try {
    const res = await fetch('/api/wearables/disconnect', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider })
    });
    const data = await res.json();
    
    if (data.success) {
      loadWearables();
    } else {
      alert(data.error || 'Failed to disconnect');
    }
  } catch (err) {
    alert('Disconnection failed');
  }
}

async function loadActivityData() {
  try {
    const res = await fetch('/api/wearables/data?days=7');
    const data = await res.json();
    
    // Update summary
    document.getElementById('avg-steps').textContent = formatNumber(data.summary.avgSteps);
    document.getElementById('avg-heart-rate').textContent = data.summary.avgHeartRate || '--';
    document.getElementById('avg-calories').textContent = formatNumber(data.summary.avgCalories);
    document.getElementById('avg-active').textContent = data.summary.avgActiveMinutes || '--';
    
    // Update chart
    renderActivityChart(data.metrics);
  } catch (err) {
    console.error('Failed to load activity data:', err);
  }
}

function renderActivityChart(metrics) {
  const container = document.getElementById('activity-chart');
  const labelsContainer = document.getElementById('chart-labels');
  
  if (!metrics || metrics.length === 0) {
    container.innerHTML = '<div class="text-center text-gray-400 w-full">No data available. Connect a device to start tracking!</div>';
    return;
  }
  
  const maxSteps = Math.max(...metrics.map(m => m.steps || 0));
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Sort by date and take last 7
  const sorted = metrics.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-7);
  
  container.innerHTML = sorted.map(m => {
    const height = maxSteps ? (m.steps / maxSteps) * 100 : 0;
    return `
      <div class="flex flex-col items-center flex-1">
        <div class="text-xs text-gray-400 mb-1">${formatNumber(m.steps)}</div>
        <div class="w-full bg-blue-500 rounded-t transition-all duration-500" 
             style="height: ${height}%"></div>
      </div>
    `;
  }).join('');
  
  labelsContainer.innerHTML = sorted.map(m => {
    const date = new Date(m.date);
    return `<span>${days[date.getDay()]}</span>`;
  }).join('');
}

async function loadCorrelations() {
  try {
    const res = await fetch('/api/wearables/correlations');
    const data = await res.json();
    const container = document.getElementById('correlation-container');
    
    const corr = data.correlations;
    container.innerHTML = `
      <div class="grid grid-cols-3 gap-4 mb-4">
        <div class="text-center p-4 bg-gray-700 rounded-lg">
          <div class="text-2xl font-bold ${getCorrelationColor(corr.stepsMood)}">
            ${formatCorrelation(corr.stepsMood)}
          </div>
          <div class="text-sm text-gray-400">Steps ↔ Mood</div>
        </div>
        <div class="text-center p-4 bg-gray-700 rounded-lg">
          <div class="text-2xl font-bold ${getCorrelationColor(corr.activityMood)}">
            ${formatCorrelation(corr.activityMood)}
          </div>
          <div class="text-sm text-gray-400">Activity ↔ Mood</div>
        </div>
        <div class="text-center p-4 bg-gray-700 rounded-lg">
          <div class="text-2xl font-bold ${getCorrelationColor(corr.heartRateMood)}">
            ${formatCorrelation(corr.heartRateMood)}
          </div>
          <div class="text-sm text-gray-400">Heart Rate ↔ Mood</div>
        </div>
      </div>
      <div class="space-y-2">
        ${data.insights.map(insight => `
          <div class="p-3 bg-gray-700/50 rounded-lg text-sm">${insight}</div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    console.error('Failed to load correlations:', err);
  }
}

function formatNumber(num) {
  if (!num) return '--';
  return num.toLocaleString();
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString();
}

function formatCorrelation(value) {
  if (value === undefined || value === null) return '--';
  return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
}

function getCorrelationColor(value) {
  if (!value) return 'text-gray-400';
  if (value > 0.3) return 'text-green-400';
  if (value < -0.3) return 'text-red-400';
  return 'text-yellow-400';
}
