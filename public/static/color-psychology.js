// Color Psychology Analysis
// Integrated with MoodMash i18n system

const API_BASE = '/api';

// State management
const state = {
    colors: [],
    selectedColor: null,
    loading: false
};

// Initialize
function init() {
    console.log('Color Psychology: Initializing...');
    loadColors();
}

// Load colors
async function loadColors() {
    state.loading = true;
    renderColorPsychologyPage();

    try {
        const response = await fetch(`${API_BASE}/color-psychology`);
        if (response.ok) {
            const data = await response.json();
            state.colors = data.colors || [];
            renderColorPsychologyPage();
        }
    } catch (error) {
        console.error('Error loading colors:', error);
    } finally {
        state.loading = false;
    }
}

// Render main page
function renderColorPsychologyPage() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
        <div class="max-w-6xl mx-auto px-4 py-8">
            <!-- Header -->
            <div class="text-center mb-8">
                <div class="flex items-center justify-center mb-4">
                    <i class="fas fa-palette text-5xl text-pink-500"></i>
                </div>
                <h1 class="text-4xl font-bold text-gray-800 mb-2" data-i18n="color_psych_title">
                    ${i18n.t('color_psych_title')}
                </h1>
                <p class="text-gray-600 text-lg" data-i18n="color_psych_subtitle">
                    ${i18n.t('color_psych_subtitle')}
                </p>
            </div>

            ${state.loading ? renderLoading() : renderColorGrid()}

            ${state.selectedColor ? renderColorDetails(state.selectedColor) : ''}
        </div>
    `;
}

// Render loading
function renderLoading() {
    return `
        <div class="text-center py-12">
            <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p class="text-gray-600" data-i18n="loading_data">Loading...</p>
        </div>
    `;
}

// Render color grid
function renderColorGrid() {
    if (state.colors.length === 0) {
        return `
            <div class="bg-white rounded-lg shadow-md p-8 text-center">
                <i class="fas fa-palette text-5xl text-gray-300 mb-4"></i>
                <p class="text-gray-600">No color data available.</p>
            </div>
        `;
    }

    return `
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            ${state.colors.map(color => renderColorCard(color)).join('')}
        </div>
    `;
}

// Render color card
function renderColorCard(color) {
    const isSelected = state.selectedColor && state.selectedColor.id === color.id;
    
    return `
        <button onclick="selectColor(${color.id})" 
                class="group relative aspect-square rounded-lg shadow-md hover:shadow-xl transition cursor-pointer overflow-hidden ${isSelected ? 'ring-4 ring-primary' : ''}"
                style="background-color: ${color.color_code}">
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition flex items-center justify-center">
                <div class="transform translate-y-full group-hover:translate-y-0 transition text-white text-center p-2">
                    <div class="font-semibold text-sm">${color.color_name}</div>
                </div>
            </div>
        </button>
    `;
}

// Render color details
function renderColorDetails(color) {
    if (!color) return '';

    const attributes = JSON.parse(color.attributes || '[]');
    const effects = color.effects || '';
    const culturalNotes = color.cultural_notes || '';
    const moodAssociations = JSON.parse(color.mood_associations || '[]');
    const recommendedFor = color.recommended_for || '';
    const avoidWhen = color.avoid_when || '';

    return `
        <div class="bg-white rounded-lg shadow-xl p-8 mb-8 animate-slideInUp">
            <!-- Close Button -->
            <button onclick="closeColorDetails()" 
                    class="float-right text-gray-500 hover:text-gray-700 text-2xl">
                <i class="fas fa-times"></i>
            </button>

            <!-- Color Header -->
            <div class="flex items-center gap-6 mb-8">
                <div class="w-24 h-24 rounded-lg shadow-lg" style="background-color: ${color.color_code}"></div>
                <div>
                    <h2 class="text-3xl font-bold text-gray-800 mb-2">${color.color_name}</h2>
                    <p class="text-gray-600 font-mono">${color.color_code}</p>
                </div>
            </div>

            <!-- Attributes -->
            <div class="mb-6">
                <h3 class="text-xl font-semibold text-gray-800 mb-3">
                    <i class="fas fa-tags mr-2 text-primary"></i>
                    <span data-i18n="color_psych_attributes">Attributes</span>
                </h3>
                <div class="flex flex-wrap gap-2">
                    ${attributes.map(attr => `
                        <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm capitalize">
                            ${attr}
                        </span>
                    `).join('')}
                </div>
            </div>

            <!-- Psychological Effects -->
            <div class="mb-6">
                <h3 class="text-xl font-semibold text-gray-800 mb-3">
                    <i class="fas fa-brain mr-2 text-primary"></i>
                    <span data-i18n="color_psych_effects">Psychological Effects</span>
                </h3>
                <p class="text-gray-700 leading-relaxed">${effects}</p>
            </div>

            <!-- Mood Associations -->
            <div class="mb-6">
                <h3 class="text-xl font-semibold text-gray-800 mb-3">
                    <i class="fas fa-heart mr-2 text-primary"></i>
                    <span data-i18n="color_psych_moods">Associated Moods</span>
                </h3>
                <div class="flex flex-wrap gap-2">
                    ${moodAssociations.map(mood => `
                        <span class="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm capitalize">
                            ${mood}
                        </span>
                    `).join('')}
                </div>
            </div>

            <!-- Cultural Notes -->
            ${culturalNotes ? `
                <div class="mb-6">
                    <h3 class="text-xl font-semibold text-gray-800 mb-3">
                        <i class="fas fa-globe mr-2 text-primary"></i>
                        <span data-i18n="color_psych_cultural">Cultural Perspectives</span>
                    </h3>
                    <p class="text-gray-700 leading-relaxed">${culturalNotes}</p>
                </div>
            ` : ''}

            <!-- Usage Recommendations -->
            <div class="grid md:grid-cols-2 gap-6">
                <div class="bg-green-50 rounded-lg p-4">
                    <h4 class="font-semibold text-green-800 mb-2">
                        <i class="fas fa-check-circle mr-2"></i>
                        <span data-i18n="color_psych_use_when">Use When</span>
                    </h4>
                    <p class="text-green-700 text-sm">${recommendedFor}</p>
                </div>
                <div class="bg-red-50 rounded-lg p-4">
                    <h4 class="font-semibold text-red-800 mb-2">
                        <i class="fas fa-times-circle mr-2"></i>
                        <span data-i18n="color_psych_avoid_when">Avoid When</span>
                    </h4>
                    <p class="text-red-700 text-sm">${avoidWhen}</p>
                </div>
            </div>

            <!-- Track Usage Button -->
            <div class="mt-6 text-center">
                <button onclick="trackColorUsage('${color.color_code}')" 
                        class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition">
                    <i class="fas fa-save mr-2"></i>
                    <span data-i18n="color_psych_track">Track This Color</span>
                </button>
            </div>
        </div>
    `;
}

// Select color
function selectColor(colorId) {
    state.selectedColor = state.colors.find(c => c.id === colorId);
    renderColorPsychologyPage();
    
    // Scroll to details
    setTimeout(() => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }, 100);
}

// Close color details
function closeColorDetails() {
    state.selectedColor = null;
    renderColorPsychologyPage();
}

// Track color usage
async function trackColorUsage(colorCode) {
    try {
        const response = await fetch(`${API_BASE}/color-psychology/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ color_code: colorCode })
        });

        if (response.ok) {
            alert(i18n.t('color_psych_tracked'));
        }
    } catch (error) {
        console.error('Error tracking color:', error);
    }
}

// Wait for i18n
function waitForI18n(callback) {
    if (window.i18n && window.i18n.isReady) {
        callback();
    } else {
        setTimeout(() => waitForI18n(callback), 100);
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForI18n(init));
} else {
    waitForI18n(init);
}
