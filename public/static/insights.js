// Insights Dashboard Frontend
(function() {
  let trendChart = null;
  let emotionChart = null;
  let currentPeriod = '7d';

  const periodBtns = document.querySelectorAll('.period-btn');
  const aiInsightsEl = document.getElementById('ai-insights');

  // Initialize
  loadInsights(currentPeriod);

  // Period button handlers
  periodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      periodBtns.forEach(b => {
        b.classList.remove('bg-blue-600');
        b.classList.add('bg-gray-700');
      });
      btn.classList.remove('bg-gray-700');
      btn.classList.add('bg-blue-600');
      currentPeriod = btn.dataset.period;
      loadInsights(currentPeriod);
    });
  });

  async function loadInsights(period) {
    try {
      const [insightsRes, trendsRes, emotionsRes] = await Promise.all([
        fetch(`/api/insights?period=${period}`),
        fetch(`/api/insights/trends?weeks=${period === '7d' ? 1 : period === '30d' ? 4 : 12}`),
        fetch(`/api/insights/emotions?period=${period}`)
      ]);

      const insights = await insightsRes.json();
      const trends = await trendsRes.json();
      const emotions = await emotionsRes.json();

      renderTrendChart(trends.trends || []);
      renderEmotionChart(emotions.emotions || []);
      renderAIInsights(insights.insights || []);

    } catch (err) {
      console.error('Error loading insights:', err);
      aiInsightsEl.innerHTML = '<p class="text-red-400">Failed to load insights</p>';
    }
  }

  function renderTrendChart(trends) {
    const ctx = document.getElementById('trend-chart').getContext('2d');

    if (trendChart) {
      trendChart.destroy();
    }

    const labels = trends.map(t => formatWeekLabel(t.date));
    const data = trends.map(t => t.avgIntensity);

    trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Avg Intensity',
          data,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#4f46e5',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            grid: { color: 'rgba(255,255,255,0.1)' },
            ticks: { color: '#9ca3af' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#9ca3af' }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  function renderEmotionChart(emotions) {
    const ctx = document.getElementById('emotion-chart').getContext('2d');

    if (emotionChart) {
      emotionChart.destroy();
    }

    const labels = emotions.map(e => capitalize(e.emotion));
    const data = emotions.map(e => e.count);
    const colors = emotions.map(e => getEmotionColor(e.emotion));

    emotionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#9ca3af', padding: 10 }
          }
        }
      }
    });
  }

  function renderAIInsights(insights) {
    if (insights.length === 0) {
      aiInsightsEl.innerHTML = '<p class="text-gray-400">Log more moods to get personalized insights!</p>';
      return;
    }

    aiInsightsEl.innerHTML = insights.map(insight => `
      <div class="bg-gray-700/50 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          ${getInsightIcon(insight.type)}
          <h3 class="font-semibold">${escapeHtml(insight.title)}</h3>
        </div>
        <p class="text-gray-300 text-sm">${escapeHtml(insight.description)}</p>
      </div>
    `).join('');
  }

  function getInsightIcon(type) {
    switch (type) {
      case 'trend':
        return '<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>';
      case 'pattern':
        return '<svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>';
      case 'suggestion':
        return '<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>';
      default:
        return '<svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    }
  }

  function getEmotionColor(emotion) {
    const colors = {
      happy: '#22c55e',
      sad: '#3b82f6',
      anxious: '#f59e0b',
      calm: '#06b6d4',
      angry: '#ef4444',
      excited: '#f97316',
      tired: '#8b5cf6',
      neutral: '#6b7280',
      peaceful: '#10b981'
    };
    return colors[emotion.toLowerCase()] || '#6b7280';
  }

  function formatWeekLabel(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();
