// MoodMash Dashboard JavaScript

const API_BASE = '/api';

// Emotion configuration
const EMOTIONS = {
    happy: { icon: 'fa-smile', color: '#fbbf24', bgColor: '#fef3c7' },
    sad: { icon: 'fa-sad-tear', color: '#3b82f6', bgColor: '#dbeafe' },
    anxious: { icon: 'fa-dizzy', color: '#ef4444', bgColor: '#fee2e2' },
    calm: { icon: 'fa-smile-beam', color: '#10b981', bgColor: '#d1fae5' },
    energetic: { icon: 'fa-bolt', color: '#f59e0b', bgColor: '#fed7aa' },
    tired: { icon: 'fa-tired', color: '#6b7280', bgColor: '#f3f4f6' },
    angry: { icon: 'fa-angry', color: '#dc2626', bgColor: '#fecaca' },
    peaceful: { icon: 'fa-spa', color: '#8b5cf6', bgColor: '#ede9fe' },
    stressed: { icon: 'fa-frown', color: '#ef4444', bgColor: '#fee2e2' },
    neutral: { icon: 'fa-meh', color: '#64748b', bgColor: '#f1f5f9' }
};

// State
let moodData = [];
let statsData = null;
let moodChart = null;

// Initialize dashboard
async function init() {
    console.log('[Dashboard] Initializing...');
    console.log('[Dashboard] axios available:', typeof axios !== 'undefined');
    console.log('[Dashboard] i18n available:', typeof i18n !== 'undefined');
    console.log('[Dashboard] Chart available:', typeof Chart !== 'undefined');
    
    try {
        console.log('[Dashboard] Loading stats...');
        await loadStats();
        console.log('[Dashboard] Stats loaded:', statsData);
        
        console.log('[Dashboard] Loading moods...');
        await loadRecentMoods();
        console.log('[Dashboard] Moods loaded:', moodData.length, 'entries');
        
        console.log('[Dashboard] Rendering dashboard...');
        renderDashboard();
        console.log('[Dashboard] Dashboard rendered successfully!');
    } catch (error) {
        console.error('[Dashboard] Failed to initialize:', error);
        console.error('[Dashboard] Error details:', {
            message: error.message,
            stack: error.stack,
            response: error.response
        });
        
        // Safe error display with fallback
        const errorMsg = (typeof i18n !== 'undefined' && i18n.t) 
            ? i18n.t('error_loading_failed') 
            : 'Failed to load dashboard data';
        showError(errorMsg);
    }
}

// Load statistics
async function loadStats() {
    const response = await axios.get(`${API_BASE}/stats?days=30`);
    statsData = response.data.stats;
}

// Load recent moods
async function loadRecentMoods() {
    const response = await axios.get(`${API_BASE}/moods?limit=10`);
    moodData = response.data.moods;
}

// Render dashboard
function renderDashboard() {
    const app = document.getElementById('app');
    const loading = document.getElementById('loading');
    
    if (loading) loading.remove();
    
    app.innerHTML = `
        <div class="fade-in">
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                ${renderStatsCards()}
            </div>
            
            <!-- Charts Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                ${renderMoodChart()}
                ${renderIntensityChart()}
            </div>
            
            <!-- Insights Section -->
            ${renderInsights()}
            
            <!-- Recent Moods -->
            ${renderRecentMoods()}
        </div>
    `;
    
    // Initialize charts after DOM is ready
    setTimeout(() => {
        createMoodChart();
        createIntensityChart();
    }, 100);
}

// Render stats cards
function renderStatsCards() {
    if (!statsData) return '';
    
    // Safely access i18n with fallbacks
    const t = (key, fallback = key) => {
        try {
            return (typeof i18n !== 'undefined' && i18n.t) ? i18n.t(key) : fallback;
        } catch (e) {
            return fallback;
        }
    };
    
    const trendIcon = statsData.recent_trend === 'improving' ? 'fa-arrow-up text-green-500' :
                     statsData.recent_trend === 'declining' ? 'fa-arrow-down text-red-500' :
                     'fa-minus text-gray-500';
    
    const trendText = statsData.recent_trend === 'improving' ? t('trend_improving', 'Improving') :
                     statsData.recent_trend === 'declining' ? t('trend_declining', 'Declining') : t('trend_stable', 'Stable');
    
    const emotionConfig = EMOTIONS[statsData.most_common_emotion] || EMOTIONS.neutral;
    
    return `
        <div class="bg-white rounded-lg shadow-md p-6 card-hover">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600">${i18n.t('stats_total_entries')}</span>
                <i class="fas fa-clipboard-list text-primary"></i>
            </div>
            <div class="text-3xl font-bold text-gray-800">${statsData.total_entries}</div>
            <p class="text-xs text-gray-500 mt-1">${i18n.t('stats_last_30_days')}</p>
        </div>
        
        <div class="bg-white rounded-lg shadow-md p-6 card-hover">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600">${i18n.t('stats_most_common')}</span>
                <i class="fas ${emotionConfig.icon}" style="color: ${emotionConfig.color}"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800">${i18n.t(`emotion_${statsData.most_common_emotion}`)}</div>
            <p class="text-xs text-gray-500 mt-1">${i18n.t('stats_primary_emotion')}</p>
        </div>
        
        <div class="bg-white rounded-lg shadow-md p-6 card-hover">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600">${i18n.t('stats_avg_intensity')}</span>
                <i class="fas fa-signal text-secondary"></i>
            </div>
            <div class="text-3xl font-bold text-gray-800">${statsData.average_intensity.toFixed(1)}</div>
            <p class="text-xs text-gray-500 mt-1">${i18n.t('stats_out_of_5')}</p>
        </div>
        
        <div class="bg-white rounded-lg shadow-md p-6 card-hover">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600">${i18n.t('stats_trend')}</span>
                <i class="fas ${trendIcon}"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800">${trendText}</div>
            <p class="text-xs text-gray-500 mt-1">${i18n.t('stats_30_day_trend')}</p>
        </div>
    `;
}

// Render mood distribution chart
function renderMoodChart() {
    return `
        <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">${i18n.t('chart_mood_distribution')}</h3>
            <div class="chart-container">
                <canvas id="moodChart"></canvas>
            </div>
        </div>
    `;
}

// Render intensity chart
function renderIntensityChart() {
    return `
        <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">${i18n.t('chart_intensity_trend')}</h3>
            <div class="chart-container">
                <canvas id="intensityChart"></canvas>
            </div>
        </div>
    `;
}

// Create mood distribution chart
function createMoodChart() {
    if (!statsData) return;
    
    const ctx = document.getElementById('moodChart');
    if (!ctx) return;
    
    const emotions = Object.keys(statsData.mood_distribution);
    const counts = Object.values(statsData.mood_distribution);
    const colors = emotions.map(e => EMOTIONS[e]?.color || '#64748b');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: emotions.map(e => i18n.t(`emotion_${e}`)),
            datasets: [{
                data: counts,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

// Create intensity trend chart
function createIntensityChart() {
    if (!moodData || moodData.length === 0) return;
    
    const ctx = document.getElementById('intensityChart');
    if (!ctx) return;
    
    // Sort by date and take last 10
    const sortedMoods = [...moodData].sort((a, b) => 
        new Date(a.logged_at) - new Date(b.logged_at)
    );
    
    const labels = sortedMoods.map(m => 
        dayjs(m.logged_at).format('MMM D')
    );
    const intensities = sortedMoods.map(m => m.intensity);
    const colors = sortedMoods.map(m => EMOTIONS[m.emotion]?.color || '#64748b');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Intensity',
                data: intensities,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                pointBackgroundColor: colors,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1
                    }
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

// Render insights
function renderInsights() {
    if (!statsData || !statsData.insights.length) return '';
    
    return `
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
                ${i18n.t('insights_title')}
            </h3>
            <div class="space-y-3">
                ${statsData.insights.map(insight => `
                    <div class="flex items-start bg-indigo-50 rounded-lg p-4">
                        <i class="fas fa-check-circle text-primary mt-1 mr-3"></i>
                        <p class="text-gray-700">${insight}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Render recent moods
function renderRecentMoods() {
    if (!moodData || moodData.length === 0) {
        return `
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">${i18n.t('recent_moods_title')}</h3>
                <p class="text-gray-500 text-center py-8">${i18n.t('recent_moods_empty')} <a href="/log" class="text-primary hover:underline">${i18n.t('recent_moods_log_first')}</a></p>
            </div>
        `;
    }
    
    return `
        <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-800">${i18n.t('recent_moods_title')}</h3>
                <a href="/log" class="text-primary hover:text-secondary text-sm font-medium">
                    <i class="fas fa-plus mr-1"></i>${i18n.t('btn_log_new')}
                </a>
            </div>
            <div class="space-y-3">
                ${moodData.map(mood => renderMoodCard(mood)).join('')}
            </div>
        </div>
    `;
}

// Render individual mood card
function renderMoodCard(mood) {
    const emotionConfig = EMOTIONS[mood.emotion] || EMOTIONS.neutral;
    const date = dayjs(mood.logged_at).format('MMM D, YYYY h:mm A');
    
    return `
        <div class="flex items-start p-4 rounded-lg border border-gray-200 hover:border-primary transition-all">
            <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4" 
                 style="background-color: ${emotionConfig.bgColor}">
                <i class="fas ${emotionConfig.icon} text-2xl" style="color: ${emotionConfig.color}"></i>
            </div>
            <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                    <span class="font-semibold text-gray-800">${i18n.t(`emotion_${mood.emotion}`)}</span>
                    <span class="text-sm text-gray-500">${date}</span>
                </div>
                <div class="flex items-center mb-2">
                    <span class="text-sm text-gray-600 mr-2">${i18n.t('intensity_label')}</span>
                    ${renderIntensityStars(mood.intensity)}
                </div>
                ${mood.notes ? `<p class="text-sm text-gray-600">${mood.notes}</p>` : ''}
                ${renderMoodContext(mood)}
            </div>
        </div>
    `;
}

// Render intensity stars
function renderIntensityStars(intensity) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        const filled = i <= intensity ? 'fas text-yellow-500' : 'far text-gray-300';
        stars += `<i class="${filled} fa-star"></i>`;
    }
    return `<div class="flex">${stars}</div>`;
}

// Render mood context
function renderMoodContext(mood) {
    const contexts = [];
    
    if (mood.weather) {
        contexts.push(`<span class="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
            <i class="fas fa-cloud-sun mr-1"></i>${i18n.t(`weather_${mood.weather}`)}
        </span>`);
    }
    
    if (mood.sleep_hours) {
        contexts.push(`<span class="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">
            <i class="fas fa-bed mr-1"></i>${mood.sleep_hours}h sleep
        </span>`);
    }
    
    if (mood.social_interaction) {
        contexts.push(`<span class="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
            <i class="fas fa-users mr-1"></i>${mood.social_interaction}
        </span>`);
    }
    
    if (contexts.length === 0) return '';
    
    return `<div class="flex flex-wrap gap-2 mt-2">${contexts.join('')}</div>`;
}

// Show error message
function showError(message) {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <i class="fas fa-exclamation-circle text-red-500 text-4xl mb-3"></i>
            <p class="text-red-700 font-semibold">${message}</p>
            <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                ${i18n.t('btn_retry')}
            </button>
        </div>
    `;
}

// Initialize on page load - wait for i18n to be available
function waitForI18n(callback) {
    if (typeof i18n !== 'undefined' && i18n.translations) {
        callback();
    } else {
        setTimeout(() => waitForI18n(callback), 50);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    waitForI18n(init);
});
