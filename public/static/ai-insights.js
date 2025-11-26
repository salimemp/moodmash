// Configure axios to send cookies with all requests
if (typeof axios !== 'undefined') { axios.defaults.withCredentials = true; }

// MoodMash AI Insights - Powered by Gemini 2.0 Flash
// Advanced mood intelligence and predictive analytics

console.log('[AI Insights] Initializing...');

let currentAnalysis = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (typeof i18n !== 'undefined' && typeof axios !== 'undefined') {
        init();
    } else {
        setTimeout(() => init(), 100);
    }
});

async function init() {
    console.log('[AI Insights] Starting initialization');
    renderDashboard();
    await loadAllInsights();
}

function renderDashboard() {
    const app = document.getElementById('app');
    const loading = document.getElementById('loading');
    if (loading) loading.remove();

    app.innerHTML = `
        <div class="fade-in">
            <!-- Header -->
            <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg p-8 mb-8">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-3xl font-bold mb-2">
                            <i class="fas fa-brain mr-3"></i>
                            AI-Powered Mood Intelligence
                        </h1>
                        <p class="text-purple-100">Advanced analytics powered by Gemini 2.0 Flash</p>
                    </div>
                    <button onclick="refreshAllInsights()" 
                            class="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all">
                        <i class="fas fa-sync-alt mr-2"></i>
                        Refresh Analysis
                    </button>
                </div>
            </div>

            <!-- Feature Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                ${renderFeatureCard('patterns', 'Pattern Recognition', 'fa-chart-line', 'purple')}
                ${renderFeatureCard('forecast', 'Mood Forecast', 'fa-crystal-ball', 'blue')}
                ${renderFeatureCard('context', 'Context Analysis', 'fa-project-diagram', 'green')}
                ${renderFeatureCard('causes', 'Causal Factors', 'fa-search', 'yellow')}
                ${renderFeatureCard('recommend', 'Recommendations', 'fa-lightbulb', 'orange')}
                ${renderFeatureCard('crisis', 'Crisis Check', 'fa-shield-alt', 'red')}
                ${renderFeatureCard('risk', 'Risk Detection', 'fa-exclamation-triangle', 'pink')}
                ${renderFeatureCard('analytics', 'Advanced Analytics', 'fa-chart-pie', 'indigo')}
            </div>

            <!-- Main Content Area -->
            <div id="insights-content" class="space-y-6">
                <!-- Content will be loaded dynamically -->
            </div>
        </div>
    `;
}

function renderFeatureCard(id, title, icon, color) {
    const colors = {
        purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
        blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
        green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
        yellow: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
        orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
        red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
        pink: 'from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700',
        indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700'
    };

    return `
        <button onclick="loadFeature('${id}')" 
                class="bg-gradient-to-br ${colors[color]} text-white rounded-lg shadow-md hover:shadow-xl 
                       transform hover:scale-105 transition-all p-6 text-left">
            <i class="fas ${icon} text-3xl mb-3"></i>
            <h3 class="text-lg font-semibold">${title}</h3>
        </button>
    `;
}

async function loadAllInsights() {
    const content = document.getElementById('insights-content');
    content.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-4xl text-primary"></i><p class="mt-4 text-gray-600">Loading AI insights...</p></div>';

    try {
        // Load Pattern Recognition by default
        await loadFeature('patterns');
    } catch (error) {
        console.error('[AI Insights] Error loading insights:', error);
        content.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-3"></i>
                <p class="text-red-700">Failed to load AI insights. Please try again.</p>
                <button onclick="loadAllInsights()" class="mt-4 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600">
                    Retry
                </button>
            </div>
        `;
    }
}

async function loadFeature(featureId) {
    const content = document.getElementById('insights-content');
    content.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-4xl text-primary"></i></div>';

    try {
        let result;
        switch (featureId) {
            case 'patterns':
                result = await axios.post('/api/ai/patterns');
                renderPatternAnalysis(result.data.data);
                break;
            case 'forecast':
                result = await axios.post('/api/ai/forecast', {});
                renderForecast(result.data.data);
                break;
            case 'context':
                result = await axios.post('/api/ai/context');
                renderContextAnalysis(result.data.data);
                break;
            case 'causes':
                result = await axios.post('/api/ai/causes');
                renderCausalFactors(result.data.data);
                break;
            case 'recommend':
                result = await axios.post('/api/ai/recommend', {
                    currentMood: 'calm',
                    intensity: 3
                });
                renderRecommendations(result.data.data);
                break;
            case 'crisis':
                result = await axios.post('/api/ai/crisis-check');
                renderCrisisCheck(result.data.data);
                break;
            case 'risk':
                result = await axios.post('/api/ai/risk-detect');
                renderRiskDetection(result.data.data);
                break;
            case 'analytics':
                result = await axios.post('/api/ai/analytics');
                renderAdvancedAnalytics(result.data.data);
                break;
        }
    } catch (error) {
        console.error(`[AI Insights] Error loading ${featureId}:`, error);
        content.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-6">
                <i class="fas fa-exclamation-triangle text-red-500 text-xl mb-2"></i>
                <p class="text-red-700">Failed to load ${featureId}. Error: ${error.message}</p>
            </div>
        `;
    }
}

function renderPatternAnalysis(data) {
    const content = document.getElementById('insights-content');
    content.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">
                <i class="fas fa-chart-line text-purple-500 mr-2"></i>
                Mood Pattern Recognition
            </h2>
            
            <!-- Patterns -->
            <div class="mb-6">
                <h3 class="text-lg font-semibold text-gray-700 mb-3">Identified Patterns</h3>
                <div class="space-y-2">
                    ${data.patterns.map(pattern => `
                        <div class="flex items-start bg-purple-50 rounded-lg p-4">
                            <i class="fas fa-check-circle text-purple-500 mt-1 mr-3"></i>
                            <p class="text-gray-700">${pattern}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Frequency Chart -->
            <div class="mb-6">
                <h3 class="text-lg font-semibold text-gray-700 mb-3">Mood Frequency</h3>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    ${Object.entries(data.frequency).map(([mood, freq]) => `
                        <div class="bg-gray-50 rounded-lg p-4 text-center">
                            <p class="text-2xl font-bold text-primary">${(freq * 100).toFixed(0)}%</p>
                            <p class="text-gray-600 capitalize">${mood}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Insights -->
            <div>
                <h3 class="text-lg font-semibold text-gray-700 mb-3">Key Insights</h3>
                <div class="space-y-2">
                    ${data.insights.map(insight => `
                        <div class="flex items-start bg-indigo-50 rounded-lg p-4">
                            <i class="fas fa-lightbulb text-yellow-500 mt-1 mr-3"></i>
                            <p class="text-gray-700">${insight}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderForecast(data) {
    const content = document.getElementById('insights-content');
    content.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">
                <i class="fas fa-crystal-ball text-blue-500 mr-2"></i>
                7-Day Mood Forecast
            </h2>
            
            <div class="space-y-4 mb-6">
                ${data.next_7_days.map(day => `
                    <div class="bg-blue-50 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-semibold text-gray-800">${new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                            <span class="text-sm text-gray-600">Confidence: ${(day.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <p class="text-lg font-bold text-primary capitalize mb-1">${day.predicted_mood}</p>
                        <p class="text-sm text-gray-600">${day.reasoning}</p>
                    </div>
                `).join('')}
            </div>

            ${data.risk_days && data.risk_days.length > 0 ? `
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h3 class="font-semibold text-yellow-800 mb-2">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Risk Days to Watch
                    </h3>
                    <ul class="list-disc list-inside text-yellow-700">
                        ${data.risk_days.map(day => `<li>${day}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 class="font-semibold text-green-800 mb-2">
                    <i class="fas fa-check-circle mr-2"></i>
                    Recommendations
                </h3>
                <ul class="list-disc list-inside text-green-700">
                    ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

function renderContextAnalysis(data) {
    const content = document.getElementById('insights-content');
    content.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">
                <i class="fas fa-project-diagram text-green-500 mr-2"></i>
                Contextual Mood Analysis
            </h2>
            
            <div class="bg-green-50 rounded-lg p-6 mb-6">
                <h3 class="font-semibold text-gray-800 mb-2">Analysis Summary</h3>
                <p class="text-gray-700">${data.analysis}</p>
            </div>

            <h3 class="text-lg font-semibold text-gray-700 mb-4">Mood Correlations</h3>
            <div class="space-y-3">
                ${data.correlations.map(corr => {
                    const strengthColors = {
                        high: 'red',
                        moderate: 'yellow',
                        low: 'blue'
                    };
                    const color = strengthColors[corr.strength];
                    return `
                        <div class="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                            <div class="flex-1">
                                <p class="font-semibold text-gray-800">${corr.factor}</p>
                                <p class="text-sm text-gray-600">${corr.impact}</p>
                            </div>
                            <span class="px-3 py-1 bg-${color}-100 text-${color}-700 rounded-full text-sm font-semibold">
                                ${corr.strength}
                            </span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function renderCausalFactors(data) {
    const content = document.getElementById('insights-content');
    content.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">
                <i class="fas fa-search text-yellow-500 mr-2"></i>
                Causal Factor Analysis
            </h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <!-- Positive Triggers -->
                <div>
                    <h3 class="text-lg font-semibold text-green-700 mb-3">
                        <i class="fas fa-arrow-up mr-2"></i>
                        Positive Triggers
                    </h3>
                    <div class="space-y-2">
                        ${data.positive_triggers.map(trigger => `
                            <div class="bg-green-50 rounded-lg p-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-gray-800">${trigger.factor}</span>
                                    <span class="text-green-600 font-semibold">${(trigger.impact_score * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Negative Triggers -->
                <div>
                    <h3 class="text-lg font-semibold text-red-700 mb-3">
                        <i class="fas fa-arrow-down mr-2"></i>
                        Negative Triggers
                    </h3>
                    <div class="space-y-2">
                        ${data.negative_triggers.map(trigger => `
                            <div class="bg-red-50 rounded-lg p-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-gray-800">${trigger.factor}</span>
                                    <span class="text-red-600 font-semibold">${(trigger.impact_score * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 class="font-semibold text-blue-800 mb-2">
                    <i class="fas fa-lightbulb mr-2"></i>
                    Actionable Recommendations
                </h3>
                <ul class="list-disc list-inside text-blue-700">
                    ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>

            <div class="mt-4 text-center text-gray-600">
                <p>Analysis Confidence: <span class="font-semibold">${(data.confidence * 100).toFixed(0)}%</span></p>
            </div>
        </div>
    `;
}

function renderRecommendations(data) {
    const content = document.getElementById('insights-content');
    content.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">
                <i class="fas fa-lightbulb text-orange-500 mr-2"></i>
                Personalized Recommendations
            </h2>
            
            <div class="bg-orange-50 rounded-lg p-6 mb-6">
                <p class="text-gray-700 text-lg">${data.personalized_message}</p>
            </div>

            <h3 class="text-lg font-semibold text-gray-700 mb-4">Recommended Activities</h3>
            <div class="space-y-4">
                ${data.activities.map((activity, index) => `
                    <div class="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-200">
                        <div class="flex items-start justify-between mb-3">
                            <div>
                                <h4 class="text-xl font-bold text-gray-800">${index + 1}. ${activity.name}</h4>
                                <p class="text-gray-600">${activity.description}</p>
                            </div>
                            <span class="px-3 py-1 bg-orange-500 text-white rounded-full text-sm font-semibold">
                                ${(activity.effectiveness * 100).toFixed(0)}% effective
                            </span>
                        </div>
                        <div class="flex items-center text-sm text-gray-600 mb-2">
                            <i class="fas fa-clock mr-2"></i>
                            <span>${activity.duration}</span>
                        </div>
                        <p class="text-sm text-gray-600 italic">${activity.reasoning}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderCrisisCheck(data) {
    const riskColors = {
        low: 'green',
        moderate: 'yellow',
        high: 'orange',
        critical: 'red'
    };
    const color = riskColors[data.risk_level];
    
    const content = document.getElementById('insights-content');
    content.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">
                <i class="fas fa-shield-alt text-red-500 mr-2"></i>
                Crisis Intervention Check
            </h2>
            
            <div class="bg-${color}-100 border-2 border-${color}-300 rounded-lg p-6 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-2xl font-bold text-${color}-800">Risk Level: ${data.risk_level.toUpperCase()}</h3>
                    <span class="text-3xl font-bold text-${color}-600">${data.risk_score.toFixed(1)}/10</span>
                </div>
                ${data.immediate_action_required ? `
                    <div class="bg-red-600 text-white rounded-lg p-4 mb-4">
                        <p class="font-bold text-lg mb-2">
                            <i class="fas fa-exclamation-triangle mr-2"></i>
                            IMMEDIATE ACTION REQUIRED
                        </p>
                        <p>Please reach out to a mental health professional or crisis hotline immediately.</p>
                    </div>
                ` : ''}
            </div>

            ${data.indicators.length > 0 ? `
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-700 mb-3">Warning Indicators</h3>
                    <div class="space-y-2">
                        ${data.indicators.map(indicator => `
                            <div class="flex items-start bg-red-50 rounded-lg p-4">
                                <i class="fas fa-exclamation-circle text-red-500 mt-1 mr-3"></i>
                                <p class="text-gray-700">${indicator}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${data.interventions.length > 0 ? `
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-700 mb-3">Recommended Interventions</h3>
                    <div class="space-y-2">
                        ${data.interventions.map(intervention => `
                            <div class="flex items-start bg-blue-50 rounded-lg p-4">
                                <i class="fas fa-check-circle text-blue-500 mt-1 mr-3"></i>
                                <p class="text-gray-700">${intervention}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-purple-800 mb-4">
                    <i class="fas fa-phone mr-2"></i>
                    Crisis Resources
                </h3>
                <div class="space-y-3">
                    ${data.resources.map(resource => `
                        <div class="bg-white rounded-lg p-4">
                            <p class="font-bold text-gray-800">${resource.name}</p>
                            <p class="text-2xl font-bold text-purple-600 my-2">${resource.phone}</p>
                            <p class="text-sm text-gray-600">Available: ${resource.available}</p>
                            ${resource.url ? `
                                <a href="${resource.url}" target="_blank" class="text-purple-600 hover:underline text-sm">
                                    Visit website <i class="fas fa-external-link-alt ml-1"></i>
                                </a>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderRiskDetection(data) {
    const content = document.getElementById('insights-content');
    content.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">
                <i class="fas fa-exclamation-triangle text-pink-500 mr-2"></i>
                Early Risk Detection
            </h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Current Trend</h3>
                    <p class="text-3xl font-bold text-pink-600 capitalize">${data.trend}</p>
                </div>
                <div class="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Risk Score</h3>
                    <p class="text-3xl font-bold text-purple-600">${data.risk_score.toFixed(1)}/10</p>
                </div>
            </div>

            ${data.warning_signs.length > 0 ? `
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-700 mb-3">Warning Signs</h3>
                    <div class="space-y-2">
                        ${data.warning_signs.map(sign => `
                            <div class="flex items-start bg-yellow-50 rounded-lg p-4">
                                <i class="fas fa-exclamation-triangle text-yellow-500 mt-1 mr-3"></i>
                                <p class="text-gray-700">${sign}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 class="font-semibold text-blue-800 mb-2">
                    <i class="fas fa-tasks mr-2"></i>
                    Recommended Actions
                </h3>
                <ul class="list-disc list-inside text-blue-700">
                    ${data.recommended_actions.map(action => `<li>${action}</li>`).join('')}
                </ul>
            </div>

            <div class="text-center text-gray-600">
                <p>Follow-up recommended in <span class="font-semibold">${data.follow_up_days} days</span></p>
            </div>
        </div>
    `;
}

function renderAdvancedAnalytics(data) {
    const content = document.getElementById('insights-content');
    content.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">
                <i class="fas fa-chart-pie text-indigo-500 mr-2"></i>
                Advanced Mood Analytics
            </h2>
            
            <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 mb-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Progress Summary</h3>
                <p class="text-gray-700">${data.progress_summary}</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="bg-green-50 rounded-lg p-4">
                    <h4 class="font-semibold text-green-800 mb-2">Best Times</h4>
                    ${data.best_times.map(time => `
                        <p class="text-gray-700"><strong>${time.time}:</strong> ${time.mood}</p>
                    `).join('')}
                </div>
                <div class="bg-red-50 rounded-lg p-4">
                    <h4 class="font-semibold text-red-800 mb-2">Challenging Times</h4>
                    ${data.worst_times.map(time => `
                        <p class="text-gray-700"><strong>${time.time}:</strong> ${time.mood}</p>
                    `).join('')}
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="bg-blue-100 rounded-lg p-6 text-center">
                    <h4 class="text-sm text-gray-600 mb-2">Mood Variance</h4>
                    <p class="text-3xl font-bold text-blue-600">${data.mood_variance.toFixed(1)}</p>
                </div>
                <div class="bg-purple-100 rounded-lg p-6 text-center">
                    <h4 class="text-sm text-gray-600 mb-2">Stress Management Score</h4>
                    <p class="text-3xl font-bold text-purple-600">${data.stress_management_score}%</p>
                </div>
            </div>

            <div class="mb-6">
                <h3 class="text-lg font-semibold text-gray-700 mb-3">Key Insights</h3>
                <div class="space-y-2">
                    ${data.insights.map(insight => `
                        <div class="flex items-start bg-indigo-50 rounded-lg p-4">
                            <i class="fas fa-chart-line text-indigo-500 mt-1 mr-3"></i>
                            <p class="text-gray-700">${insight}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 class="font-semibold text-yellow-800 mb-2">
                    <i class="fas fa-lightbulb mr-2"></i>
                    Actionable Tips
                </h3>
                <ul class="list-disc list-inside text-yellow-700">
                    ${data.actionable_tips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

async function refreshAllInsights() {
    await loadAllInsights();
}

// Make functions globally available
window.loadFeature = loadFeature;
window.refreshAllInsights = refreshAllInsights;

console.log('[AI Insights] Ready!');
