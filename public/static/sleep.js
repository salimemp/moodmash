// Sleep Tracking JavaScript

document.addEventListener('DOMContentLoaded', loadSleepData);

async function loadSleepData() {
  try {
    const res = await fetch('/api/sleep/data?days=7');
    const data = await res.json();
    
    // Update summary
    document.getElementById('sleep-score').textContent = data.summary.avgQuality || '--';
    document.getElementById('avg-duration').textContent = data.summary.avgDurationFormatted || '--';
    
    // Update sleep stages (last night)
    if (data.sleep && data.sleep.length > 0) {
      const lastNight = data.sleep[0];
      const total = lastNight.duration_minutes || 1;
      
      document.getElementById('deep-bar').style.width = `${(lastNight.deep_minutes / total) * 100}%`;
      document.getElementById('light-bar').style.width = `${(lastNight.light_minutes / total) * 100}%`;
      document.getElementById('rem-bar').style.width = `${(lastNight.rem_minutes / total) * 100}%`;
      document.getElementById('awake-bar').style.width = `${(lastNight.awake_minutes / total) * 100}%`;
      
      document.getElementById('deep-time').textContent = formatMinutes(lastNight.deep_minutes);
      document.getElementById('light-time').textContent = formatMinutes(lastNight.light_minutes);
      document.getElementById('rem-time').textContent = formatMinutes(lastNight.rem_minutes);
      document.getElementById('awake-time').textContent = formatMinutes(lastNight.awake_minutes);
    }
    
    // Render weekly chart
    renderSleepChart(data.sleep);
    
    // Load trends and correlations
    loadSleepTrends();
  } catch (err) {
    console.error('Failed to load sleep data:', err);
  }
}

function renderSleepChart(sleepData) {
  const container = document.getElementById('sleep-chart');
  const labelsContainer = document.getElementById('sleep-chart-labels');
  
  if (!sleepData || sleepData.length === 0) {
    container.innerHTML = '<div class="text-center text-gray-400 w-full">No sleep data available</div>';
    return;
  }
  
  const maxDuration = 540; // 9 hours max display
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Sort by date
  const sorted = sleepData.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-7);
  
  container.innerHTML = sorted.map(s => {
    const duration = s.duration_minutes || 0;
    const height = Math.min((duration / maxDuration) * 100, 100);
    const quality = s.quality_score || 0;
    const color = quality >= 70 ? 'bg-green-500' : quality >= 50 ? 'bg-yellow-500' : 'bg-red-500';
    
    return `
      <div class="flex flex-col items-center flex-1 group relative">
        <div class="text-xs text-gray-400 mb-1">${formatMinutes(duration)}</div>
        <div class="w-full ${color} rounded-t transition-all duration-500 hover:opacity-80" 
             style="height: ${height}%"
             title="Quality: ${quality}%"></div>
      </div>
    `;
  }).join('');
  
  labelsContainer.innerHTML = sorted.map(s => {
    const date = new Date(s.date);
    return `<span>${days[date.getDay()]}</span>`;
  }).join('');
}

async function loadSleepTrends() {
  try {
    const res = await fetch('/api/sleep/trends');
    const data = await res.json();
    const container = document.getElementById('sleep-mood-correlation');
    
    const corr = data.correlation.sleepMood;
    const corrText = corr > 0.3 ? 'Strong positive' : 
                     corr > 0 ? 'Weak positive' : 
                     corr > -0.3 ? 'Weak negative' : 'Strong negative';
    const corrColor = corr > 0.3 ? 'text-green-400' : 
                      corr > 0 ? 'text-yellow-400' : 'text-red-400';
    
    container.innerHTML = `
      <div class="mb-4">
        <div class="text-4xl font-bold ${corrColor}">
          ${corr > 0 ? '+' : ''}${(corr * 100).toFixed(0)}%
        </div>
        <div class="text-gray-400">${corrText} correlation</div>
      </div>
      <div class="space-y-2 text-sm">
        ${data.insights.map(insight => `
          <div class="p-3 bg-gray-700/50 rounded-lg">${insight}</div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    console.error('Failed to load sleep trends:', err);
  }
}

function formatMinutes(minutes) {
  if (!minutes) return '--';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
