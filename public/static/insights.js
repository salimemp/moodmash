// MoodMash Daily Mood Insights JavaScript

const API_BASE = '/api';

// State
let insightsData = null;
let timelineData = [];
let currentDate = new Date();
let selectedDateRange = 'week'; // week, month, year

// Initialize
async function init() {
    await waitForI18n(async () => {
        await loadInsights();
        await loadTimeline();
        render();
    });
}

function waitForI18n(callback) {
    if (window.i18n && window.i18n.currentLanguage) {
        callback();
    } else {
        setTimeout(() => waitForI18n(callback), 50);
    }
}

// Load insights data
async function loadInsights() {
    try {
        // Mock data for now - will be replaced with API call
        insightsData = {
            dominantMood: {
                emotion: 'neutral',
                emoji: '😐',
                label: i18n.t('emotion_neutral') || 'Neutral',
                count: 0
            },
            variability: {
                value: 0,
                label: i18n.t('variability_very_stable') || 'Very Stable',
                percentage: 0
            },
            intensity: {
                value: 50,
                label: i18n.t('intensity_moderate') || 'Moderate',
                percentage: 50
            },
            totalEntries: 0,
            summary: i18n.t('insights_generating') || 'Your mood insights are being generated. Try again later.',
            trends: {
                improving: false,
                stable: true,
                declining: false
            }
        };
    } catch (error) {
        console.error('Failed to load insights:', error);
    }
}

// Load timeline data
async function loadTimeline() {
    try {
        // Mock data - will be replaced with API call
        timelineData = [];
    } catch (error) {
        console.error('Failed to load timeline:', error);
    }
}

// Render main page
function render() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
            <div class="max-w-4xl mx-auto space-y-6">
                <!-- Daily Mood Insight Card -->
                <div class="insight-card">
                    <div class="relative z-10">
                        <h2 class="text-2xl font-bold mb-2">
                            ${i18n.t('daily_mood_insight') || 'Daily Mood Insight'}
                        </h2>
                        <p class="text-purple-100 mb-6">
                            ${i18n.t('emotional_journey_today') || 'Emotional Journey Today'}
                        </p>

                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <div class="text-6xl">${insightsData.dominantMood.emoji}</div>
                                <div>
                                    <h3 class="text-3xl font-bold">${insightsData.dominantMood.label}</h3>
                                    <p class="text-purple-100">${i18n.t('dominant_mood_today') || 'Dominant Mood Today'}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-4xl font-bold">${insightsData.totalEntries}</div>
                                <p class="text-purple-100">${i18n.t('moods_tracked') || 'Moods Tracked'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Metrics Grid -->
                <div class="grid md:grid-cols-2 gap-6">
                    <!-- Variability Card -->
                    <div class="metric-card">
                        <div class="flex items-start justify-between mb-4">
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <i class="fas fa-chart-line text-primary"></i>
                                    <h3 class="font-semibold text-gray-800">
                                        ${i18n.t('variability_label') || 'Variability Label'}
                                    </h3>
                                </div>
                                <p class="text-2xl font-bold text-gray-800">${insightsData.variability.value}%</p>
                                <p class="text-gray-600 text-sm">${insightsData.variability.label}</p>
                            </div>
                            ${renderProgressRing(insightsData.variability.percentage, '#10b981')}
                        </div>
                    </div>

                    <!-- Intensity Card -->
                    <div class="metric-card">
                        <div class="flex items-start justify-between mb-4">
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <i class="fas fa-fire text-primary"></i>
                                    <h3 class="font-semibold text-gray-800">
                                        ${i18n.t('intensity_label') || 'Intensity Label'}
                                    </h3>
                                </div>
                                <p class="text-2xl font-bold text-gray-800">${insightsData.intensity.value}%</p>
                                <p class="text-gray-600 text-sm">${insightsData.intensity.label}</p>
                            </div>
                            ${renderProgressRing(insightsData.intensity.percentage, '#f59e0b')}
                        </div>
                    </div>
                </div>

                <!-- Daily Summary Card -->
                <div class="bg-white rounded-2xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
                        ${i18n.t('daily_summary') || 'Daily Summary'}
                    </h3>
                    <p class="text-gray-600 mb-4">${insightsData.summary}</p>
                    
                    <button onclick="window.location.href='/insights/detailed'" 
                            class="w-full py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2">
                        ${i18n.t('view_detailed_insights') || 'View Detailed Insights'}
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>

                <!-- Mood Timeline Section -->
                <div class="bg-white rounded-2xl shadow-lg p-6">
                    <div class="flex items-center justify-between mb-6">
                        <div>
                            <h3 class="text-2xl font-bold text-gray-800">
                                ${i18n.t('mood_timeline') || 'Mood Timeline'}
                            </h3>
                            <p class="text-gray-600">
                                ${i18n.t('emotional_journey_on') || 'Your emotional journey on'} ${formatDate(currentDate)}
                            </p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="navigateTimeline(-1)" 
                                    class="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                                <i class="fas fa-chevron-left text-gray-600"></i>
                            </button>
                            <button onclick="navigateTimeline(1)" 
                                    class="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                                <i class="fas fa-chevron-right text-gray-600"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Timeline Content -->
                    <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 mb-4">
                        <div class="flex items-center justify-between mb-4">
                            <h4 class="text-lg font-semibold text-gray-800">
                                ${getDayName(currentDate)}
                            </h4>
                            <span class="text-sm text-gray-600">${formatDate(currentDate, true)}</span>
                        </div>
                        
                        ${renderTimelineView()}
                    </div>

                    <!-- View Options -->
                    <div class="flex gap-2">
                        <button onclick="toggleTimelineView('calendar')" 
                                class="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium">
                            <i class="fas fa-calendar mr-2"></i>
                            ${i18n.t('calendar_view') || 'Calendar'}
                        </button>
                        <button onclick="toggleTimelineView('list')" 
                                class="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium">
                            <i class="fas fa-list mr-2"></i>
                            ${i18n.t('list_view') || 'List'}
                        </button>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="grid md:grid-cols-2 gap-4">
                    <button onclick="window.location.href='/log'" 
                            class="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition text-left group">
                        <div class="flex items-center justify-between mb-2">
                            <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center group-hover:scale-110 transition">
                                <i class="fas fa-plus text-white text-xl"></i>
                            </div>
                            <i class="fas fa-arrow-right text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-1">
                            ${i18n.t('log_new_mood') || 'Log New Mood'}
                        </h3>
                        <p class="text-sm text-gray-600">
                            ${i18n.t('track_current_state') || 'Track your current emotional state'}
                        </p>
                    </button>

                    <button onclick="window.location.href='/express'" 
                            class="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition text-left group">
                        <div class="flex items-center justify-between mb-2">
                            <div class="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                                <i class="fas fa-palette text-white text-xl"></i>
                            </div>
                            <i class="fas fa-arrow-right text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-1">
                            ${i18n.t('express_your_mood') || 'Express Your Mood'}
                        </h3>
                        <p class="text-sm text-gray-600">
                            ${i18n.t('multiple_ways_to_express') || 'Multiple ways to express how you feel'}
                        </p>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Render progress ring
function renderProgressRing(percentage, color) {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    
    return `
        <svg class="progress-ring w-24 h-24" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="${radius}" 
                    stroke="#e5e7eb" stroke-width="8" fill="none"/>
            <circle class="progress-ring-circle" 
                    cx="40" cy="40" r="${radius}"
                    stroke="${color}" stroke-width="8" fill="none"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${offset}"
                    stroke-linecap="round"/>
            <text x="50%" y="50%" text-anchor="middle" dy="0.3em" 
                  class="text-lg font-bold" fill="${color}">
                ${Math.round(percentage)}%
            </text>
        </svg>
    `;
}

// Render timeline view
function renderTimelineView() {
    if (timelineData.length === 0) {
        return `
            <div class="empty-state py-12">
                <div class="empty-state-icon">
                    📝
                </div>
                <p class="text-lg font-semibold text-gray-800 mb-2">
                    ${i18n.t('no_moods_recorded') || 'No moods recorded'}
                </p>
                <p class="text-gray-600 mb-6">
                    ${i18n.t('track_emotions_throughout_day') || 'Track your emotions throughout the day'}
                </p>
                <button onclick="window.location.href='/log'" 
                        class="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-indigo-700 transition">
                    <i class="fas fa-plus mr-2"></i>
                    ${i18n.t('log_first_mood') || 'Log Your First Mood'}
                </button>
            </div>
        `;
    }

    return `
        <div class="space-y-4">
            ${timelineData.map((entry, index) => `
                <div class="timeline-entry">
                    <div class="timeline-dot" style="background: ${entry.color}"></div>
                    <div class="bg-white rounded-xl p-4 shadow-sm">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-3">
                                <span class="text-3xl">${entry.emoji}</span>
                                <div>
                                    <h4 class="font-semibold text-gray-800">${entry.emotion}</h4>
                                    <p class="text-sm text-gray-600">${entry.time}</p>
                                </div>
                            </div>
                            <span class="text-sm font-medium text-gray-500">
                                ${i18n.t('intensity')}: ${entry.intensity}/5
                            </span>
                        </div>
                        ${entry.notes ? `<p class="text-gray-600 text-sm">${entry.notes}</p>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Date navigation
function navigateTimeline(direction) {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    currentDate = newDate;
    
    loadTimeline().then(() => {
        render();
    });
}

// Toggle timeline view
function toggleTimelineView(view) {
    if (view === 'calendar') {
        window.location.href = '/';
    } else {
        // Already in list view
    }
}

// Format date
function formatDate(date, includeDay = false) {
    const options = includeDay 
        ? { month: 'long', day: 'numeric', year: 'numeric' }
        : { month: 'long', day: 'numeric' };
    return date.toLocaleDateString(i18n.currentLanguage, options);
}

// Get day name
function getDayName(date) {
    const days = [
        i18n.t('day_sunday') || 'Sunday',
        i18n.t('day_monday') || 'Monday',
        i18n.t('day_tuesday') || 'Tuesday',
        i18n.t('day_wednesday') || 'Wednesday',
        i18n.t('day_thursday') || 'Thursday',
        i18n.t('day_friday') || 'Friday',
        i18n.t('day_saturday') || 'Saturday'
    ];
    return days[date.getDay()];
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
