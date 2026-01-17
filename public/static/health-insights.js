// Health Insights JavaScript

document.addEventListener('DOMContentLoaded', loadHealthInsights);

async function loadHealthInsights() {
  await loadWellnessScore();
  await loadInsights();
}

async function loadWellnessScore() {
  try {
    const res = await fetch('/api/health/wellness-score');
    const data = await res.json();
    
    // Animate wellness score circle
    const circle = document.getElementById('wellness-circle');
    const scoreEl = document.getElementById('wellness-score');
    const score = data.overall || 0;
    
    // Calculate stroke-dashoffset (283 is full circle)
    const offset = 283 - (283 * score / 100);
    circle.style.strokeDashoffset = offset;
    
    // Animate score number
    let current = 0;
    const interval = setInterval(() => {
      if (current >= score) {
        clearInterval(interval);
        return;
      }
      current++;
      scoreEl.textContent = current;
    }, 20);
    
    // Update component scores
    document.getElementById('activity-score').textContent = data.components.activity || '--';
    document.getElementById('sleep-score-card').textContent = data.components.sleep || '--';
    document.getElementById('mood-score').textContent = data.components.mood || '--';
    document.getElementById('stress-score').textContent = data.components.stress || '--';
  } catch (err) {
    console.error('Failed to load wellness score:', err);
  }
}

async function loadInsights() {
  try {
    const res = await fetch('/api/health/insights');
    const data = await res.json();
    const container = document.getElementById('insights-list');
    
    if (!data.insights || data.insights.length === 0) {
      container.innerHTML = '<div class="text-center text-gray-400">No insights available yet. Keep tracking your mood and activities!</div>';
      return;
    }
    
    container.innerHTML = data.insights.map(insight => {
      const icon = getInsightIcon(insight.type);
      const bgColor = getPriorityBg(insight.priority);
      const borderColor = getPriorityBorder(insight.priority);
      
      return `
        <div class="p-4 ${bgColor} border-l-4 ${borderColor} rounded-r-lg">
          <div class="flex items-start gap-3">
            <span class="text-2xl">${icon}</span>
            <div>
              <div class="font-medium">${insight.title}</div>
              <div class="text-sm text-gray-400 mt-1">${insight.description}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load insights:', err);
  }
}

function getInsightIcon(type) {
  const icons = {
    activity: '🏃',
    sleep: '😴',
    mood: '😊',
    general: '💡',
    stress: '🧘'
  };
  return icons[type] || '💡';
}

function getPriorityBg(priority) {
  const bgs = {
    high: 'bg-red-900/30',
    medium: 'bg-yellow-900/30',
    positive: 'bg-green-900/30',
    low: 'bg-gray-700/30'
  };
  return bgs[priority] || 'bg-gray-700/30';
}

function getPriorityBorder(priority) {
  const borders = {
    high: 'border-red-500',
    medium: 'border-yellow-500',
    positive: 'border-green-500',
    low: 'border-gray-500'
  };
  return borders[priority] || 'border-gray-500';
}
