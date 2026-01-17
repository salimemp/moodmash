// Analytics Dashboard (Admin)
(function() {
  'use strict';
  
  let userGrowthChart = null;
  let moodTrendsChart = null;
  let emotionChart = null;
  let subscriptionChart = null;
  
  async function init() {
    await loadDashboardData();
  }
  
  async function loadDashboardData() {
    try {
      const res = await fetch('/api/analytics/dashboard');
      const data = await res.json();
      
      if (!data.success) {
        if (res.status === 403) {
          document.querySelector('main').innerHTML = `
            <div class="text-center py-16">
              <h1 class="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
              <p class="text-gray-400">Admin access required to view analytics.</p>
              <a href="/dashboard" class="text-purple-400 hover:underline mt-4 inline-block">Return to Dashboard</a>
            </div>
          `;
          return;
        }
        throw new Error(data.error);
      }
      
      const { overview, charts } = data.dashboard;
      
      // Update overview metrics
      document.getElementById('total-users').textContent = overview.totalUsers.toLocaleString();
      document.getElementById('new-users-today').textContent = overview.newUsersToday;
      document.getElementById('dau').textContent = overview.dau.toLocaleString();
      document.getElementById('mau').textContent = overview.mau.toLocaleString();
      document.getElementById('total-moods').textContent = overview.totalMoods.toLocaleString();
      
      // Render charts
      renderUserGrowthChart(charts.userGrowth);
      renderMoodTrendsChart(charts.moodTrends);
      renderEmotionChart(charts.emotionDistribution);
      renderSubscriptionChart(charts.subscriptionDist);
      renderFeatureUsage(charts.featureUsage);
      renderTopPages(charts.pageViews);
      
    } catch (error) {
      console.error('Failed to load analytics:', error);
      document.querySelector('main').innerHTML += `
        <div class="bg-red-900/50 border border-red-500 rounded-xl p-4 mb-6">
          <p class="text-red-400">Failed to load analytics data. Please try again.</p>
        </div>
      `;
    }
  }
  
  function renderUserGrowthChart(data) {
    const ctx = document.getElementById('user-growth-chart')?.getContext('2d');
    if (!ctx) return;
    
    userGrowthChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.date),
        datasets: [{
          label: 'New Users',
          data: data.map(d => d.count),
          borderColor: '#8B5CF6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#9CA3AF' } },
          y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#9CA3AF' } }
        }
      }
    });
  }
  
  function renderMoodTrendsChart(data) {
    const ctx = document.getElementById('mood-trends-chart')?.getContext('2d');
    if (!ctx) return;
    
    moodTrendsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.date),
        datasets: [{
          label: 'Moods Logged',
          data: data.map(d => d.count),
          backgroundColor: '#10B981'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#9CA3AF' } },
          y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#9CA3AF' } }
        }
      }
    });
  }
  
  function renderEmotionChart(data) {
    const ctx = document.getElementById('emotion-chart')?.getContext('2d');
    if (!ctx) return;
    
    const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#6366F1', '#14B8A6'];
    
    emotionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.emotion),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: colors.slice(0, data.length)
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right', labels: { color: '#9CA3AF' } }
        }
      }
    });
  }
  
  function renderSubscriptionChart(data) {
    const ctx = document.getElementById('subscription-chart')?.getContext('2d');
    if (!ctx) return;
    
    subscriptionChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: data.map(d => d.tier_id?.charAt(0).toUpperCase() + d.tier_id?.slice(1) || 'Unknown'),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: ['#6B7280', '#8B5CF6', '#F59E0B']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right', labels: { color: '#9CA3AF' } }
        }
      }
    });
  }
  
  function renderFeatureUsage(data) {
    const container = document.getElementById('feature-usage');
    if (!container || !data.length) {
      container.innerHTML = '<p class="text-gray-400">No feature usage data yet.</p>';
      return;
    }
    
    const maxCount = Math.max(...data.map(d => d.count));
    
    container.innerHTML = data.map(d => `
      <div class="flex items-center gap-4">
        <span class="w-32 text-sm text-gray-400 truncate">${d.event_type}</span>
        <div class="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
          <div class="bg-purple-600 h-full transition-all duration-500" style="width: ${(d.count / maxCount) * 100}%"></div>
        </div>
        <span class="w-16 text-right text-sm">${d.count.toLocaleString()}</span>
      </div>
    `).join('');
  }
  
  function renderTopPages(data) {
    const container = document.getElementById('top-pages');
    if (!container || !data.length) {
      container.innerHTML = '<p class="text-gray-400">No page view data yet.</p>';
      return;
    }
    
    container.innerHTML = data.map((d, i) => `
      <div class="flex items-center justify-between py-2 ${i > 0 ? 'border-t border-gray-700' : ''}">
        <span class="text-gray-300 truncate">${d.page_url || 'Unknown'}</span>
        <span class="text-gray-400">${d.count.toLocaleString()} views</span>
      </div>
    `).join('');
  }
  
  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
