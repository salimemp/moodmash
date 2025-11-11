// MoodMash Mood Logging JavaScript

const API_BASE = '/api';

// Emotion configuration
const EMOTIONS = {
    happy: { icon: 'fa-smile', color: '#fbbf24', label: 'Happy' },
    sad: { icon: 'fa-sad-tear', color: '#3b82f6', label: 'Sad' },
    anxious: { icon: 'fa-dizzy', color: '#ef4444', label: 'Anxious' },
    calm: { icon: 'fa-smile-beam', color: '#10b981', label: 'Calm' },
    energetic: { icon: 'fa-bolt', color: '#f59e0b', label: 'Energetic' },
    tired: { icon: 'fa-tired', color: '#6b7280', label: 'Tired' },
    angry: { icon: 'fa-angry', color: '#dc2626', label: 'Angry' },
    peaceful: { icon: 'fa-spa', color: '#8b5cf6', label: 'Peaceful' },
    stressed: { icon: 'fa-frown', color: '#ef4444', label: 'Stressed' },
    neutral: { icon: 'fa-meh', color: '#64748b', label: 'Neutral' }
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
function renderLogForm() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="fade-in">
            <div class="bg-white rounded-lg shadow-md p-8">
                <h1 class="text-3xl font-bold text-gray-800 mb-2">
                    <i class="fas fa-pen text-primary mr-2"></i>
                    Log Your Mood
                </h1>
                <p class="text-gray-600 mb-8">Track how you're feeling right now</p>
                
                <!-- Emotion Selection -->
                <div class="mb-8">
                    <label class="block text-sm font-semibold text-gray-700 mb-3">
                        How are you feeling? <span class="text-red-500">*</span>
                    </label>
                    <div class="grid grid-cols-5 gap-3" id="emotion-selector">
                        ${Object.entries(EMOTIONS).map(([key, config]) => `
                            <button type="button" 
                                    class="emotion-btn flex flex-col items-center p-4 rounded-lg border-2 ${formData.emotion === key ? 'border-primary bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}"
                                    onclick="selectEmotion('${key}')"
                                    data-emotion="${key}">
                                <i class="fas ${config.icon} text-3xl mb-2" style="color: ${config.color}"></i>
                                <span class="text-sm font-medium text-gray-700">${config.label}</span>
                            </button>
                        `).join('')}
                    </div>
                    <div id="emotion-error" class="text-red-500 text-sm mt-2 hidden">Please select an emotion</div>
                </div>
                
                <!-- Intensity -->
                <div class="mb-8">
                    <label class="block text-sm font-semibold text-gray-700 mb-3">
                        Intensity <span class="text-red-500">*</span>
                        <span class="text-gray-500 font-normal">(Current: <span id="intensity-value">3</span>)</span>
                    </label>
                    <div class="flex items-center space-x-4">
                        <span class="text-sm text-gray-600">Low</span>
                        <input type="range" 
                               id="intensity-slider" 
                               min="1" 
                               max="5" 
                               value="3" 
                               class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                               oninput="updateIntensity(this.value)">
                        <span class="text-sm text-gray-600">High</span>
                    </div>
                </div>
                
                <!-- Notes -->
                <div class="mb-8">
                    <label class="block text-sm font-semibold text-gray-700 mb-3">
                        Notes (Optional)
                    </label>
                    <textarea id="notes" 
                              rows="3" 
                              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder="What's on your mind? Any triggers or events?"
                              onchange="updateNotes(this.value)"></textarea>
                </div>
                
                <!-- Context: Weather -->
                <div class="mb-6">
                    <label class="block text-sm font-semibold text-gray-700 mb-3">
                        Weather (Optional)
                    </label>
                    <div class="flex flex-wrap gap-2">
                        ${WEATHER_OPTIONS.map(w => `
                            <button type="button" 
                                    class="px-4 py-2 rounded-lg border ${formData.weather === w ? 'border-primary bg-indigo-50 text-primary' : 'border-gray-300 text-gray-700 hover:border-gray-400'}"
                                    onclick="selectWeather('${w}')">
                                ${w.charAt(0).toUpperCase() + w.slice(1)}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Context: Sleep -->
                <div class="mb-6">
                    <label class="block text-sm font-semibold text-gray-700 mb-3">
                        Sleep Hours (Optional)
                    </label>
                    <input type="number" 
                           id="sleep-hours" 
                           min="0" 
                           max="24" 
                           step="0.5" 
                           class="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                           placeholder="e.g., 7.5"
                           onchange="updateSleep(this.value)">
                </div>
                
                <!-- Context: Activities -->
                <div class="mb-6">
                    <label class="block text-sm font-semibold text-gray-700 mb-3">
                        Activities (Optional)
                    </label>
                    <div class="flex flex-wrap gap-2">
                        ${ACTIVITY_OPTIONS.map(a => `
                            <button type="button" 
                                    class="px-4 py-2 rounded-lg border ${formData.activities.includes(a) ? 'border-primary bg-indigo-50 text-primary' : 'border-gray-300 text-gray-700 hover:border-gray-400'}"
                                    onclick="toggleActivity('${a}')">
                                ${a.charAt(0).toUpperCase() + a.slice(1)}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Context: Social -->
                <div class="mb-8">
                    <label class="block text-sm font-semibold text-gray-700 mb-3">
                        Social Interaction (Optional)
                    </label>
                    <div class="flex flex-wrap gap-2">
                        ${SOCIAL_OPTIONS.map(s => `
                            <button type="button" 
                                    class="px-4 py-2 rounded-lg border ${formData.social_interaction === s ? 'border-primary bg-indigo-50 text-primary' : 'border-gray-300 text-gray-700 hover:border-gray-400'}"
                                    onclick="selectSocial('${s}')">
                                ${s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Submit Buttons -->
                <div class="flex items-center justify-between pt-6 border-t border-gray-200">
                    <a href="/" class="text-gray-600 hover:text-gray-800">
                        <i class="fas fa-arrow-left mr-2"></i>Cancel
                    </a>
                    <button type="button" 
                            onclick="submitMood()" 
                            class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-semibold">
                        <i class="fas fa-save mr-2"></i>Save Mood
                    </button>
                </div>
            </div>
            
            <!-- Success Modal (hidden by default) -->
            <div id="success-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
                    <i class="fas fa-check-circle text-green-500 text-6xl mb-4"></i>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">Mood Saved!</h3>
                    <p class="text-gray-600 mb-6">Your mood entry has been recorded successfully.</p>
                    <div class="flex space-x-4">
                        <a href="/" class="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700">
                            View Dashboard
                        </a>
                        <button onclick="resetForm()" class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                            Log Another
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
        alert('Failed to save mood. Please try again.');
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
