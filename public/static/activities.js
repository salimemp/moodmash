// Configure axios to send cookies with all requests
if (typeof axios !== 'undefined') { axios.defaults.withCredentials = true; }

// MoodMash Wellness Activities JavaScript

const API_BASE = '/api';

// Category icons
const CATEGORY_ICONS = {
    meditation: 'fa-spa',
    exercise: 'fa-dumbbell',
    journaling: 'fa-pen-fancy',
    social: 'fa-users',
    creative: 'fa-palette'
};

// Difficulty colors
const DIFFICULTY_COLORS = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800'
};

// State
let activities = [];
let currentFilter = '';

// Initialize
async function init() {
    await loadActivities();
    renderActivitiesPage();
}

// Load activities
async function loadActivities(emotion = '') {
    try {
        const url = emotion ? `${API_BASE}/activities?emotion=${emotion}` : `${API_BASE}/activities`;
        const response = await axios.get(url);
        activities = response.data.activities;
        currentFilter = emotion;
    } catch (error) {
        console.error('Failed to load activities:', error);
        showError(i18n.t('error_loading_failed'));
    }
}

// Render activities page
function renderActivitiesPage() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="fade-in">
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-800 mb-2">
                    <i class="fas fa-heart text-red-500 mr-2"></i>
                    ${i18n.t('activities_title')}
                </h1>
                <p class="text-gray-600">${i18n.t('activities_subtitle')}</p>
            </div>
            
            <!-- Filter by Emotion -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                <label class="block text-sm font-semibold text-gray-700 mb-3">
                    <i class="fas fa-filter mr-2"></i>
                    ${i18n.t('activities_filter_label')}
                </label>
                <div class="flex flex-wrap gap-2">
                    <button onclick="filterByEmotion('')" 
                            class="px-4 py-2 rounded-lg ${currentFilter === '' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
                        ${i18n.t('activities_all')}
                    </button>
                    <button onclick="filterByEmotion('anxious')" 
                            class="px-4 py-2 rounded-lg ${currentFilter === 'anxious' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
                        ${i18n.t('emotion_anxious')}
                    </button>
                    <button onclick="filterByEmotion('stressed')" 
                            class="px-4 py-2 rounded-lg ${currentFilter === 'stressed' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
                        ${i18n.t('emotion_stressed')}
                    </button>
                    <button onclick="filterByEmotion('sad')" 
                            class="px-4 py-2 rounded-lg ${currentFilter === 'sad' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
                        ${i18n.t('emotion_sad')}
                    </button>
                    <button onclick="filterByEmotion('tired')" 
                            class="px-4 py-2 rounded-lg ${currentFilter === 'tired' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
                        ${i18n.t('emotion_tired')}
                    </button>
                    <button onclick="filterByEmotion('angry')" 
                            class="px-4 py-2 rounded-lg ${currentFilter === 'angry' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
                        ${i18n.t('emotion_angry')}
                    </button>
                </div>
            </div>
            
            <!-- Activities Grid -->
            ${renderActivitiesGrid()}
        </div>
    `;
}

// Render activities grid
function renderActivitiesGrid() {
    if (activities.length === 0) {
        return `
            <div class="bg-white rounded-lg shadow-md p-12 text-center">
                <i class="fas fa-inbox text-gray-400 text-6xl mb-4"></i>
                <p class="text-gray-600 text-lg">${i18n.t('activities_no_results')}</p>
                <button onclick="filterByEmotion('')" class="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700">
                    ${i18n.t('activities_view_all')}
                </button>
            </div>
        `;
    }
    
    return `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${activities.map(activity => renderActivityCard(activity)).join('')}
        </div>
    `;
}

// Render individual activity card
function renderActivityCard(activity) {
    const categoryIcon = CATEGORY_ICONS[activity.category] || 'fa-star';
    const difficultyClass = DIFFICULTY_COLORS[activity.difficulty] || DIFFICULTY_COLORS.medium;
    
    return `
        <div class="activity-card bg-white rounded-lg shadow-md p-6 flex flex-col">
            <!-- Header -->
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <div class="flex items-center mb-2">
                        <i class="fas ${categoryIcon} text-primary text-xl mr-2"></i>
                        <h3 class="text-lg font-semibold text-gray-800">${activity.title}</h3>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="px-2 py-1 ${difficultyClass} text-xs rounded font-medium capitalize">
                            ${activity.difficulty}
                        </span>
                        ${activity.duration_minutes ? `
                            <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                                <i class="far fa-clock mr-1"></i>${activity.duration_minutes} min
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Description -->
            <p class="text-gray-600 text-sm mb-4 flex-1">${activity.description}</p>
            
            <!-- Target Emotions -->
            <div class="mb-4">
                <p class="text-xs font-semibold text-gray-500 mb-2">${i18n.t('activities_helps_with')}:</p>
                <div class="flex flex-wrap gap-1">
                    ${activity.target_emotions.map(emotion => `
                        <span class="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded">
                            ${i18n.t(`emotion_${emotion}`)}
                        </span>
                    `).join('')}
                </div>
            </div>
            
            <!-- Actions -->
            <div class="flex space-x-2">
                <button onclick="startActivity(${activity.id}, '${activity.title}')" 
                        class="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                    <i class="fas fa-play mr-2"></i>${i18n.t('btn_start')}
                </button>
                <button onclick="viewDetails(${activity.id})" 
                        class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                    <i class="fas fa-info-circle"></i>
                </button>
            </div>
        </div>
    `;
}

// Filter by emotion
async function filterByEmotion(emotion) {
    await loadActivities(emotion);
    renderActivitiesPage();
}

// Start activity
function startActivity(activityId, activityTitle) {
    // Show confirmation modal
    const modal = document.createElement('div');
    modal.id = 'activity-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md mx-4">
            <h3 class="text-2xl font-bold text-gray-800 mb-4">
                <i class="fas fa-play-circle text-primary mr-2"></i>
                ${i18n.t('activities_start_title')}
            </h3>
            <p class="text-gray-600 mb-6">
                ${i18n.t('activities_ready').replace('{activity}', activityTitle)}
                <br><br>
                ${i18n.t('activities_ready_desc')}
            </p>
            <div class="flex space-x-4">
                <button onclick="completeActivity(${activityId}, true)" 
                        class="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-indigo-700 font-semibold">
                    <i class="fas fa-check mr-2"></i>${i18n.t('btn_mark_done')}
                </button>
                <button onclick="closeModal()" 
                        class="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    ${i18n.t('btn_cancel')}
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Complete activity
async function completeActivity(activityId, completed) {
    try {
        await axios.post(`${API_BASE}/activities/${activityId}/log`, {
            completed: completed,
            rating: null,
            feedback: null
        });
        
        closeModal();
        
        // Show success message
        showSuccess(i18n.t('success_activity_logged'));
    } catch (error) {
        console.error('Failed to log activity:', error);
        alert(i18n.t('error_activity_log_failed'));
    }
}

// View activity details
function viewDetails(activityId) {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    
    const categoryIcon = CATEGORY_ICONS[activity.category] || 'fa-star';
    const difficultyClass = DIFFICULTY_COLORS[activity.difficulty] || DIFFICULTY_COLORS.medium;
    
    const modal = document.createElement('div');
    modal.id = 'activity-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="flex items-start justify-between mb-6">
                <div>
                    <div class="flex items-center mb-2">
                        <i class="fas ${categoryIcon} text-primary text-2xl mr-3"></i>
                        <h3 class="text-2xl font-bold text-gray-800">${activity.title}</h3>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="px-3 py-1 ${difficultyClass} text-sm rounded-full font-medium capitalize">
                            ${activity.difficulty}
                        </span>
                        ${activity.duration_minutes ? `
                            <span class="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                                <i class="far fa-clock mr-1"></i>${activity.duration_minutes} minutes
                            </span>
                        ` : ''}
                        <span class="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium capitalize">
                            ${activity.category}
                        </span>
                    </div>
                </div>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <div class="mb-6">
                <h4 class="text-sm font-semibold text-gray-700 mb-2">${i18n.t('activities_description')}</h4>
                <p class="text-gray-600">${activity.description}</p>
            </div>
            
            <div class="mb-6">
                <h4 class="text-sm font-semibold text-gray-700 mb-2">${i18n.t('activities_helps_emotions')}</h4>
                <div class="flex flex-wrap gap-2">
                    ${activity.target_emotions.map(emotion => `
                        <span class="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">
                            ${i18n.t(`emotion_${emotion}`)}
                        </span>
                    `).join('')}
                </div>
            </div>
            
            <div class="flex space-x-4">
                <button onclick="startActivity(${activity.id}, '${activity.title}')" 
                        class="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-indigo-700 font-semibold">
                    <i class="fas fa-play mr-2"></i>${i18n.t('activities_start_this')}
                </button>
                <button onclick="closeModal()" 
                        class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    ${i18n.t('btn_close')}
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Close modal
function closeModal() {
    const modal = document.getElementById('activity-modal');
    if (modal) {
        modal.remove();
    }
}

// Show success message
function showSuccess(message) {
    const success = document.createElement('div');
    success.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center';
    success.innerHTML = `
        <i class="fas fa-check-circle mr-3 text-xl"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(success);
    
    setTimeout(() => {
        success.remove();
    }, 3000);
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
