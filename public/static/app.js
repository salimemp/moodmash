// MoodMash Dashboard JavaScript

const API_BASE = '/api';

// Configure axios to send cookies with all requests
if (typeof axios !== 'undefined') {
    axios.defaults.withCredentials = true;
}

// =============================================================================
// SERVICE WORKER REGISTRATION (PWA Support)
// =============================================================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('[ServiceWorker] Registered successfully:', registration.scope);
                
                // Check for updates every hour
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000);
            })
            .catch(error => {
                console.error('[ServiceWorker] Registration failed:', error);
            });
    });
}

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
        
        // If 401 Unauthorized, show landing page
        if (error.response && error.response.status === 401) {
            console.log('[Dashboard] User not authenticated, showing landing page');
            renderLandingPage();
            return;
        }
        
        // Safe error display with fallback
        const errorMsg = (typeof i18n !== 'undefined' && i18n.t) 
            ? i18n.t('error_loading_failed') 
            : 'Failed to load dashboard data';
        showError(errorMsg);
    }
}

// Load statistics
async function loadStats() {
    const response = await fetch(`${API_BASE}/stats?days=30`, {
        credentials: 'include', // Critical: Send cookies
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    statsData = data.stats;
}

// Load recent moods
async function loadRecentMoods() {
    const response = await fetch(`${API_BASE}/moods?limit=10`, {
        credentials: 'include', // Critical: Send cookies
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    moodData = data.moods;
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
            
            <!-- More Features Section -->
            ${renderMoreFeatures()}
            
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

// Render more features
function renderMoreFeatures() {
    const features = [
        {
            title: 'Express Your Mood',
            description: 'Share your emotions creatively',
            icon: 'fa-paint-brush',
            color: 'purple',
            url: '/express'
        },
        {
            title: 'Daily Mood Insights',
            description: 'Get personalized insights',
            icon: 'fa-chart-line',
            color: 'blue',
            url: '/insights'
        },
        {
            title: 'Quick Mood Select',
            description: 'Log mood in seconds',
            icon: 'fa-bolt',
            color: 'yellow',
            url: '/quick-select'
        },
        {
            title: 'AI-Powered Wellness Tips',
            description: 'Personalized wellness advice',
            icon: 'fa-robot',
            color: 'green',
            url: '/wellness-tips'
        },
        {
            title: 'Challenges & Achievements',
            description: 'Track your progress',
            icon: 'fa-trophy',
            color: 'orange',
            url: '/challenges'
        },
        {
            title: 'Color Psychology',
            description: 'Explore mood colors',
            icon: 'fa-palette',
            color: 'pink',
            url: '/color-psychology'
        },
        {
            title: 'Social Feed',
            description: 'Connect with community',
            icon: 'fa-users',
            color: 'indigo',
            url: '/social-feed'
        },
        {
            title: '🤖 AI Insights',
            description: 'Advanced mood intelligence',
            icon: 'fa-brain',
            color: 'purple',
            url: '/ai-insights'
        },
        {
            title: '🏥 Health Dashboard',
            description: 'Comprehensive health metrics',
            icon: 'fa-heartbeat',
            color: 'pink',
            url: '/health-dashboard'
        },
        {
            title: '🔒 Privacy Center',
            description: 'Manage your data & privacy',
            icon: 'fa-shield-alt',
            color: 'green',
            url: '/privacy-center'
        },
        {
            title: '📞 Support Resources',
            description: 'Get help & guidance',
            icon: 'fa-hands-helping',
            color: 'red',
            url: '/support'
        },
        {
            title: '🛡️ HIPAA Compliance',
            description: 'Audit logs & BAA generation',
            icon: 'fa-shield-alt',
            color: 'orange',
            url: '/hipaa-compliance'
        },
        {
            title: '🔐 Security Monitoring',
            description: 'Real-time threat detection',
            icon: 'fa-lock',
            color: 'red',
            url: '/security-monitoring'
        },
        {
            title: '🔬 Research Center',
            description: 'Anonymized data & consents',
            icon: 'fa-flask',
            color: 'purple',
            url: '/research-center'
        },
        {
            title: '🎓 Privacy Education',
            description: 'Learn about your rights',
            icon: 'fa-graduation-cap',
            color: 'blue',
            url: '/privacy-education'
        },
        {
            title: '👥 Social Feed',
            description: 'Share & connect with community',
            icon: 'fa-users',
            color: 'purple',
            url: '/social-feed'
        },
        {
            title: '🤝 Mood Groups',
            description: 'Synchronized group experiences',
            icon: 'fa-user-friends',
            color: 'pink',
            url: '/mood-groups'
        },
        {
            title: '👑 Premium',
            description: 'Upgrade & manage subscription',
            icon: 'fa-crown',
            color: 'yellow',
            url: '/subscription'
        }
    ];
    
    const colorClasses = {
        purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
        blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
        yellow: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
        green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
        orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
        pink: 'from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700',
        indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
        red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
    };
    
    return `
        <div class="mb-8">
            <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                <i class="fas fa-star text-yellow-500 mr-2"></i>
                More Features
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                ${features.map(feature => `
                    <a href="${feature.url}" 
                       class="block bg-gradient-to-br ${colorClasses[feature.color]} text-white rounded-lg shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-200 p-6">
                        <div class="flex items-start">
                            <div class="flex-shrink-0">
                                <i class="fas ${feature.icon} text-3xl mb-3"></i>
                            </div>
                        </div>
                        <h4 class="text-lg font-semibold mb-2">${feature.title}</h4>
                        <p class="text-sm opacity-90">${feature.description}</p>
                    </a>
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
// Render landing page for unauthenticated users
function renderLandingPage() {
    const app = document.getElementById('app');
    const loading = document.getElementById('loading');
    if (loading) loading.remove();
    
    app.innerHTML = `
        <div class="max-w-6xl mx-auto fade-in">
            <!-- Hero Section -->
            <div class="text-center py-16">
                <h1 class="text-5xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-heart text-purple-600 mr-3"></i>
                    Welcome to MoodMash
                </h1>
                <p class="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                    Track your emotional wellness journey with AI-powered insights and personalized recommendations
                </p>
                <div class="flex gap-4 justify-center">
                    <a href="/register" class="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-lg font-semibold">
                        <i class="fas fa-user-plus mr-2"></i>
                        Get Started Free
                    </a>
                    <a href="/login" class="px-8 py-4 bg-white border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition text-lg font-semibold">
                        <i class="fas fa-sign-in-alt mr-2"></i>
                        Sign In
                    </a>
                </div>
            </div>

            <!-- Features Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
                <div class="bg-white rounded-lg p-6 shadow-sm text-center">
                    <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-brain text-purple-600 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">AI Insights</h3>
                    <p class="text-gray-600">Get personalized insights powered by Gemini AI to understand your mood patterns</p>
                </div>

                <div class="bg-white rounded-lg p-6 shadow-sm text-center">
                    <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-chart-line text-blue-600 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Track Progress</h3>
                    <p class="text-gray-600">Visualize your emotional wellness journey with beautiful charts and analytics</p>
                </div>

                <div class="bg-white rounded-lg p-6 shadow-sm text-center">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-spa text-green-600 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Wellness Tips</h3>
                    <p class="text-gray-600">Receive personalized wellness activities and coping strategies</p>
                </div>
            </div>

            <!-- CTA Section -->
            <div class="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-12 text-center text-white my-12">
                <h2 class="text-3xl font-bold mb-4">Start Your Wellness Journey Today</h2>
                <p class="text-lg mb-6 opacity-90">Join thousands of users improving their mental health with MoodMash</p>
                <a href="/register" class="inline-block px-8 py-4 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition text-lg font-semibold">
                    Sign Up Now - It's Free
                </a>
            </div>
        </div>
    `;
}

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
