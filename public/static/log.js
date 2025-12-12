// Configure axios to send cookies with all requests
if (typeof axios !== 'undefined') { axios.defaults.withCredentials = true; }

// MoodMash Mood Logging JavaScript

const API_BASE = '/api';

// Emotion configuration
const EMOTIONS = {
    happy: { icon: 'fa-smile', color: '#fbbf24' },
    sad: { icon: 'fa-sad-tear', color: '#3b82f6' },
    anxious: { icon: 'fa-dizzy', color: '#ef4444' },
    calm: { icon: 'fa-smile-beam', color: '#10b981' },
    energetic: { icon: 'fa-bolt', color: '#f59e0b' },
    tired: { icon: 'fa-tired', color: '#6b7280' },
    angry: { icon: 'fa-angry', color: '#dc2626' },
    peaceful: { icon: 'fa-spa', color: '#8b5cf6' },
    stressed: { icon: 'fa-frown', color: '#ef4444' },
    neutral: { icon: 'fa-meh', color: '#64748b' }
};

const WEATHER_OPTIONS = ['sunny', 'cloudy', 'rainy', 'snowy', 'clear'];
const SOCIAL_OPTIONS = ['alone', 'friends', 'family', 'colleagues'];
const ACTIVITY_OPTIONS = ['work', 'exercise', 'social', 'rest', 'hobby', 'meditation', 'reading', 'outdoor'];

// Form state
let formData = {
    emotion: '',
    intensity: 3,
    notes: '',
    weather: '',
    sleep_hours: null,
    activities: [],
    social_interaction: '',
    logged_at: new Date().toISOString()
};

// Initialize
function init() {
    renderLogForm();
}

// Render log form
async function renderLogForm() {
    const app = document.getElementById('app');
    
    // Check if user is authenticated and get their info
    let welcomeMessage = i18n.t('log_mood_title');
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.username) {
        welcomeMessage = `Welcome ${currentUser.username}! ${i18n.t('log_mood_title')}`;
    }
    
    app.innerHTML = `
        <div class="fade-in">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                    <i class="fas fa-pen text-primary mr-2"></i>
                    ${welcomeMessage}
                </h1>
                <p class="text-gray-600 dark:text-gray-300 mb-8">${i18n.t('log_mood_subtitle')}</p>
                
                <!-- Emotion Selection -->
                <div class="mb-8">
                    <label class="block text-sm font-semibold text-gray-700 mb-3">
                        ${i18n.t('form_emotion_label')} <span class="text-red-500">*</span>
                    </label>
                    <div class="grid grid-cols-5 gap-3" id="emotion-selector">
                        ${Object.entries(EMOTIONS).map(([key, config]) => `
                            <button type="button" 
                                    class="emotion-btn flex flex-col items-center p-4 rounded-lg border-2 ${formData.emotion === key ? 'border-primary bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}"
                                    onclick="selectEmotion('${key}')"
                                    data-emotion="${key}">
                                <i class="fas ${config.icon} text-3xl mb-2" style="color: ${config.color}"></i>
                                <span class="text-sm font-medium text-gray-700">${i18n.t(`emotion_${key}`)}</span>
                            </button>
                        `).join('')}
                    </div>
                    <div id="emotion-error" class="text-red-500 text-sm mt-2 hidden">${i18n.t('error_emotion_required')}</div>
                </div>
                
                <!-- Intensity -->
                <div class="mb-8">
                    <label class="block text-sm font-semibold text-gray-700 mb-3">
                        ${i18n.t('form_intensity_label')} <span class="text-red-500">*</span>
                        <span class="text-gray-500 font-normal">(${i18n.t('form_intensity_current')}: <span id="intensity-value">3</span>)</span>
                    </label>
                    <div class="flex items-center space-x-4">
                        <span class="text-sm text-gray-600">${i18n.t('form_intensity_low')}</span>
                        <input type="range" 
                               id="intensity-slider" 
                               min="1" 
                               max="5" 
                               value="3" 
                               class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                               oninput="updateIntensity(this.value)">
                        <span class="text-sm text-gray-600">${i18n.t('form_intensity_high')}</span>
                    </div>
                </div>
                
                <!-- Notes -->
                <div class="mb-8">
                    <label class="block text-sm font-semibold text-gray-700 mb-3">
                        ${i18n.t('form_notes_label')}
                    </label>
                    <textarea id="notes" 
                              rows="3" 
                              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder="${i18n.t('form_notes_placeholder')}"
                              onchange="updateNotes(this.value)"></textarea>
                </div>
                
                <!-- Context: Weather -->
                <div class="mb-6">
                    <label class="block text-sm font-semibold text-gray-700 mb-3">
                        ${i18n.t('form_weather_label')}
                    </label>
                    <div class="flex flex-wrap gap-2">
                        ${WEATHER_OPTIONS.map(w => `
                            <button type="button" 
                                    class="px-4 py-2 rounded-lg border ${formData.weather === w ? 'border-primary bg-indigo-50 text-primary' : 'border-gray-300 text-gray-700 hover:border-gray-400'}"
                                    onclick="selectWeather('${w}')">
                                ${i18n.t(`weather_${w}`)}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Context: Sleep -->
                <div class="mb-6">
                    <label class="block text-sm font-semibold text-gray-700 mb-3">
                        ${i18n.t('form_sleep_label')}
                    </label>
                    <input type="number" 
                           id="sleep-hours" 
                           min="0" 
                           max="24" 
                           step="0.5" 
                           class="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                           placeholder="${i18n.t('form_sleep_placeholder')}"
                           onchange="updateSleep(this.value)">
                </div>
                
                <!-- Context: Activities -->
                <div class="mb-6">
                    <label class="block text-sm font-semibold text-gray-700 mb-3">
                        ${i18n.t('form_activities_label')}
                    </label>
                    <div class="flex flex-wrap gap-2">
                        ${ACTIVITY_OPTIONS.map(a => `
                            <button type="button" 
                                    class="px-4 py-2 rounded-lg border ${formData.activities.includes(a) ? 'border-primary bg-indigo-50 text-primary' : 'border-gray-300 text-gray-700 hover:border-gray-400'}"
                                    onclick="toggleActivity('${a}')">
                                ${i18n.t(`activity_${a}`)}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Context: Social -->
                <div class="mb-8">
                    <label class="block text-sm font-semibold text-gray-700 mb-3">
                        ${i18n.t('form_social_label')}
                    </label>
                    <div class="flex flex-wrap gap-2">
                        ${SOCIAL_OPTIONS.map(s => `
                            <button type="button" 
                                    class="px-4 py-2 rounded-lg border ${formData.social_interaction === s ? 'border-primary bg-indigo-50 text-primary' : 'border-gray-300 text-gray-700 hover:border-gray-400'}"
                                    onclick="selectSocial('${s}')">
                                ${i18n.t(`social_${s}`)}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Submit Buttons -->
                <div class="flex items-center justify-between pt-6 border-t border-gray-200">
                    <a href="/" class="text-gray-600 hover:text-gray-800">
                        <i class="fas fa-arrow-left mr-2"></i>${i18n.t('btn_cancel')}
                    </a>
                    <button type="button" 
                            onclick="submitMood()" 
                            class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-semibold">
                        <i class="fas fa-save mr-2"></i>${i18n.t('btn_save')}
                    </button>
                </div>
            </div>
            
            <!-- Success Modal (hidden by default) -->
            <div id="success-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
                    <i class="fas fa-check-circle text-green-500 text-6xl mb-4"></i>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">${i18n.t('success_mood_saved_title')}</h3>
                    <p class="text-gray-600 mb-6">${i18n.t('success_mood_saved')}</p>
                    <div class="flex space-x-4">
                        <a href="/" class="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700">
                            ${i18n.t('btn_view_dashboard')}
                        </a>
                        <button onclick="resetForm()" class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                            ${i18n.t('btn_log_another')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Select emotion
function selectEmotion(emotion) {
    formData.emotion = emotion;
    
    // Update UI
    document.querySelectorAll('.emotion-btn').forEach(btn => {
        if (btn.dataset.emotion === emotion) {
            btn.classList.add('border-primary', 'bg-indigo-50');
            btn.classList.remove('border-gray-200');
        } else {
            btn.classList.remove('border-primary', 'bg-indigo-50');
            btn.classList.add('border-gray-200');
        }
    });
    
    // Hide error
    document.getElementById('emotion-error').classList.add('hidden');
}

// Update intensity
function updateIntensity(value) {
    formData.intensity = parseInt(value);
    document.getElementById('intensity-value').textContent = value;
}

// Update notes
function updateNotes(value) {
    formData.notes = value.trim();
}

// Select weather
function selectWeather(weather) {
    formData.weather = formData.weather === weather ? '' : weather;
    renderLogForm(); // Re-render to update button states
    
    // Restore form state
    if (formData.emotion) selectEmotion(formData.emotion);
    document.getElementById('intensity-slider').value = formData.intensity;
    document.getElementById('intensity-value').textContent = formData.intensity;
    document.getElementById('notes').value = formData.notes;
    if (formData.sleep_hours) document.getElementById('sleep-hours').value = formData.sleep_hours;
}

// Toggle activity
function toggleActivity(activity) {
    const index = formData.activities.indexOf(activity);
    if (index > -1) {
        formData.activities.splice(index, 1);
    } else {
        formData.activities.push(activity);
    }
    renderLogForm();
    
    // Restore form state
    if (formData.emotion) selectEmotion(formData.emotion);
    document.getElementById('intensity-slider').value = formData.intensity;
    document.getElementById('intensity-value').textContent = formData.intensity;
    document.getElementById('notes').value = formData.notes;
    if (formData.sleep_hours) document.getElementById('sleep-hours').value = formData.sleep_hours;
}

// Select social interaction
function selectSocial(social) {
    formData.social_interaction = formData.social_interaction === social ? '' : social;
    renderLogForm();
    
    // Restore form state
    if (formData.emotion) selectEmotion(formData.emotion);
    document.getElementById('intensity-slider').value = formData.intensity;
    document.getElementById('intensity-value').textContent = formData.intensity;
    document.getElementById('notes').value = formData.notes;
    if (formData.sleep_hours) document.getElementById('sleep-hours').value = formData.sleep_hours;
}

// Update sleep
function updateSleep(value) {
    formData.sleep_hours = value ? parseFloat(value) : null;
}

// Submit mood
async function submitMood() {
    // Validate required fields
    if (!formData.emotion) {
        document.getElementById('emotion-error').classList.remove('hidden');
        return;
    }
    
    try {
        // Prepare data
        const moodEntry = {
            emotion: formData.emotion,
            intensity: formData.intensity,
            notes: formData.notes || null,
            weather: formData.weather || null,
            sleep_hours: formData.sleep_hours,
            activities: formData.activities.length > 0 ? formData.activities : null,
            social_interaction: formData.social_interaction || null,
            logged_at: new Date().toISOString()
        };
        
        // Submit to API
        await axios.post(`${API_BASE}/moods`, moodEntry);
        
        // Show success modal
        document.getElementById('success-modal').classList.remove('hidden');
    } catch (error) {
        console.error('Failed to save mood:', error);
        alert(i18n.t('error_mood_save_failed'));
    }
}

// Reset form
function resetForm() {
    formData = {
        emotion: '',
        intensity: 3,
        notes: '',
        weather: '',
        sleep_hours: null,
        activities: [],
        social_interaction: '',
        logged_at: new Date().toISOString()
    };
    
    document.getElementById('success-modal').classList.add('hidden');
    renderLogForm();
}

// Listen for auth ready event and render
window.addEventListener('authReady', (event) => {
    console.log('[Log] Auth ready, rendering form');
    renderLogForm();
});

// Fallback: Initialize on page load if auth event doesn't fire
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
