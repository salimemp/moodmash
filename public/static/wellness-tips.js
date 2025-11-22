// Personalized Wellness Tips - AI-Powered Recommendations
// Integrated with MoodMash i18n system

const API_BASE = '/api';

// Wellness categories with icons
const WELLNESS_CATEGORIES = {
    mindfulness: { icon: 'fa-spa', color: '#AA96DA' },
    exercise: { icon: 'fa-running', color: '#6BCB77' },
    sleep: { icon: 'fa-bed', color: '#8D5B4C' },
    nutrition: { icon: 'fa-apple-alt', color: '#95E1D3' },
    social: { icon: 'fa-users', color: '#F38181' }
};

// State management
const state = {
    selectedMood: null,
    selectedCategories: [],
    tips: [],
    loading: false
};

// Initialize the Wellness Tips page
function init() {
    console.log('Wellness Tips: Initializing...');
    renderWellnessTipsPage();
}

// Render the main page
function renderWellnessTipsPage() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
        <div class="max-w-6xl mx-auto px-4 py-8">
            <!-- Header -->
            <div class="text-center mb-8">
                <div class="flex items-center justify-center mb-4">
                    <i class="fas fa-lightbulb text-5xl text-yellow-500"></i>
                </div>
                <h1 class="text-4xl font-bold text-gray-800 mb-2" data-i18n="wellness_tips_title">
                    ${i18n.t('wellness_tips_title')}
                </h1>
                <p class="text-gray-600 text-lg" data-i18n="wellness_tips_subtitle">
                    ${i18n.t('wellness_tips_subtitle')}
                </p>
            </div>

            <!-- Mood Selection -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                    <i class="fas fa-smile mr-2 text-primary"></i>
                    <span data-i18n="wellness_tips_mood_label">${i18n.t('wellness_tips_mood_label')}</span>
                </h2>
                <div id="mood-selector" class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <!-- Moods will be rendered here -->
                </div>
            </div>

            <!-- Category Selection -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                    <i class="fas fa-th-large mr-2 text-primary"></i>
                    <span data-i18n="wellness_tips_category_label">${i18n.t('wellness_tips_category_label')}</span>
                </h2>
                <div id="category-selector" class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <!-- Categories will be rendered here -->
                </div>
            </div>

            <!-- Generate Button -->
            <div class="text-center mb-8">
                <button id="generate-tips-btn" 
                        class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        onclick="generateTips()">
                    <i class="fas fa-magic mr-2"></i>
                    <span data-i18n="wellness_tips_generate">${i18n.t('wellness_tips_generate')}</span>
                </button>
            </div>

            <!-- Loading State -->
            <div id="loading-state" class="hidden text-center py-8">
                <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                <p class="text-gray-600" data-i18n="wellness_tips_generating">${i18n.t('wellness_tips_generating')}</p>
            </div>

            <!-- Tips Display -->
            <div id="tips-container" class="space-y-4">
                <!-- Tips will be rendered here -->
            </div>
        </div>
    `;

    renderMoodSelector();
    renderCategorySelector();
}

// Render mood selector
function renderMoodSelector() {
    const container = document.getElementById('mood-selector');
    if (!container) return;

    const moods = [
        { emotion: 'happy', emoji: '😊', color: '#FFD93D' },
        { emotion: 'sad', emoji: '😢', color: '#6C7A89' },
        { emotion: 'anxious', emoji: '😰', color: '#FF6B6B' },
        { emotion: 'stressed', emoji: '😫', color: '#FF5722' },
        { emotion: 'calm', emoji: '😌', color: '#4ECDC4' },
        { emotion: 'energetic', emoji: '⚡', color: '#F38181' },
        { emotion: 'tired', emoji: '😴', color: '#8D5B4C' },
        { emotion: 'angry', emoji: '😠', color: '#E74C3C' },
        { emotion: 'peaceful', emoji: '☮️', color: '#95E1D3' },
        { emotion: 'neutral', emoji: '😐', color: '#BDC3C7' }
    ];

    container.innerHTML = moods.map(mood => `
        <button class="mood-btn p-4 rounded-lg border-2 border-gray-200 hover:border-primary transition flex flex-col items-center gap-2 ${state.selectedMood === mood.emotion ? 'border-primary bg-purple-50' : 'bg-white'}"
                onclick="selectMood('${mood.emotion}')"
                data-mood="${mood.emotion}">
            <span class="text-3xl">${mood.emoji}</span>
            <span class="text-sm font-medium capitalize" data-i18n="emotion_${mood.emotion}">
                ${i18n.t('emotion_' + mood.emotion)}
            </span>
        </button>
    `).join('');
}

// Render category selector
function renderCategorySelector() {
    const container = document.getElementById('category-selector');
    if (!container) return;

    const categories = ['mindfulness', 'exercise', 'sleep', 'nutrition', 'social'];

    container.innerHTML = categories.map(cat => {
        const catInfo = WELLNESS_CATEGORIES[cat];
        const isSelected = state.selectedCategories.includes(cat);
        
        return `
            <button class="category-btn p-4 rounded-lg border-2 border-gray-200 hover:border-primary transition flex flex-col items-center gap-2 ${isSelected ? 'border-primary bg-purple-50' : 'bg-white'}"
                    onclick="toggleCategory('${cat}')"
                    data-category="${cat}">
                <i class="fas ${catInfo.icon} text-2xl" style="color: ${catInfo.color}"></i>
                <span class="text-sm font-medium capitalize" data-i18n="category_${cat}">
                    ${i18n.t('category_' + cat)}
                </span>
            </button>
        `;
    }).join('');
}

// Select mood
function selectMood(emotion) {
    state.selectedMood = emotion;
    renderMoodSelector();
}

// Toggle category
function toggleCategory(category) {
    if (state.selectedCategories.includes(category)) {
        state.selectedCategories = state.selectedCategories.filter(c => c !== category);
    } else {
        state.selectedCategories.push(category);
    }
    renderCategorySelector();
}

// Generate wellness tips
async function generateTips() {
    if (!state.selectedMood || state.selectedCategories.length === 0) {
        alert(i18n.t('wellness_tips_select_required'));
        return;
    }

    state.loading = true;
    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('tips-container').innerHTML = '';
    document.getElementById('generate-tips-btn').disabled = true;

    try {
        const response = await fetch(`${API_BASE}/wellness-tips/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mood: state.selectedMood,
                categories: state.selectedCategories
            })
        });

        if (!response.ok) throw new Error('Failed to generate tips');

        const data = await response.json();
        state.tips = data.tips || [];
        renderTips();
    } catch (error) {
        console.error('Error generating tips:', error);
        alert(i18n.t('wellness_tips_error'));
    } finally {
        state.loading = false;
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('generate-tips-btn').disabled = false;
    }
}

// Render tips
function renderTips() {
    const container = document.getElementById('tips-container');
    if (!container || state.tips.length === 0) return;

    container.innerHTML = state.tips.map((tip, index) => {
        const catInfo = WELLNESS_CATEGORIES[tip.category] || { icon: 'fa-lightbulb', color: '#8B5CF6' };
        
        return `
            <div class="bg-white rounded-lg shadow-md p-6 animate-fadeIn" style="animation-delay: ${index * 0.1}s">
                <div class="flex items-start gap-4">
                    <div class="flex-shrink-0">
                        <div class="w-12 h-12 rounded-full flex items-center justify-center" 
                             style="background-color: ${catInfo.color}20">
                            <i class="fas ${catInfo.icon} text-xl" style="color: ${catInfo.color}"></i>
                        </div>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-lg font-semibold text-gray-800 capitalize">
                                <span data-i18n="category_${tip.category}">${i18n.t('category_' + tip.category)}</span>
                            </h3>
                            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                AI-Generated
                            </span>
                        </div>
                        <p class="text-gray-700 leading-relaxed mb-4">${tip.tip_text}</p>
                        <div class="flex items-center gap-4">
                            <button onclick="rateTip(${tip.id}, 'helpful')" 
                                    class="text-sm text-green-600 hover:text-green-700 transition">
                                <i class="fas fa-thumbs-up mr-1"></i>
                                <span data-i18n="wellness_tips_helpful">${i18n.t('wellness_tips_helpful')}</span>
                            </button>
                            <button onclick="rateTip(${tip.id}, 'not-helpful')" 
                                    class="text-sm text-red-600 hover:text-red-700 transition">
                                <i class="fas fa-thumbs-down mr-1"></i>
                                <span data-i18n="wellness_tips_not_helpful">${i18n.t('wellness_tips_not_helpful')}</span>
                            </button>
                            <button onclick="saveTip(${tip.id})" 
                                    class="text-sm text-primary hover:text-purple-700 transition">
                                <i class="fas fa-bookmark mr-1"></i>
                                <span data-i18n="wellness_tips_save">${i18n.t('wellness_tips_save')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Rate tip
async function rateTip(tipId, rating) {
    try {
        const response = await fetch(`${API_BASE}/wellness-tips/${tipId}/rate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_helpful: rating === 'helpful' })
        });

        if (response.ok) {
            alert(i18n.t('wellness_tips_thanks'));
        }
    } catch (error) {
        console.error('Error rating tip:', error);
    }
}

// Save tip
async function saveTip(tipId) {
    alert(i18n.t('wellness_tips_saved'));
}

// Wait for i18n to load
function waitForI18n(callback) {
    if (window.i18n && window.i18n.isReady) {
        callback();
    } else {
        setTimeout(() => waitForI18n(callback), 100);
    }
}

// Initialize when DOM and i18n are ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForI18n(init));
} else {
    waitForI18n(init);
}
