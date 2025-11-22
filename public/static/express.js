// MoodMash Express Your Mood JavaScript

const API_BASE = '/api';

// Extended emoji set for mood expression
const MOOD_EMOJIS = {
    happy: ['😊', '😃', '😄', '😁', '🙂', '😇', '🤗', '🥳'],
    sad: ['😢', '😭', '😞', '😔', '😟', '🥺', '☹️', '😿'],
    anxious: ['😰', '😨', '😧', '😦', '😖', '😣', '😩', '🤯'],
    calm: ['😌', '😊', '🧘', '😴', '💆', '🕊️', '☮️', '🍃'],
    energetic: ['⚡', '💪', '🔥', '🏃', '🎉', '🚀', '⭐', '✨'],
    tired: ['😴', '🥱', '😪', '💤', '😵', '🛌', '💆', '😑'],
    angry: ['😠', '😡', '🤬', '😤', '👿', '💢', '🔥', '😾'],
    peaceful: ['😌', '🧘', '🕊️', '☮️', '🌸', '🍃', '💮', '🌺'],
    stressed: ['😫', '😩', '😖', '😣', '🤯', '😰', '💢', '🌪️'],
    neutral: ['😐', '😑', '😶', '🤷', '😕', '🙂', '😊', '😏'],
    love: ['❤️', '💙', '💜', '💚', '💛', '🧡', '🩷', '💗'],
    excited: ['🤩', '😍', '🥰', '🤗', '🎉', '🎊', '🎈', '✨'],
    confused: ['🤔', '😕', '🤨', '😵', '😖', '😵‍💫', '❓', '🤷'],
    proud: ['😌', '🥇', '🏆', '👑', '💪', '🌟', '⭐', '✨']
};

// Flatten all emojis for display
const ALL_EMOJIS = Object.values(MOOD_EMOJIS).flat();

// Color options for mood expression
const MOOD_COLORS = [
    { name: 'Red', hex: '#FF6B6B', emotion: 'passionate' },
    { name: 'Orange', hex: '#FFA07A', emotion: 'energetic' },
    { name: 'Yellow', hex: '#FFD93D', emotion: 'happy' },
    { name: 'Green', hex: '#6BCB77', emotion: 'calm' },
    { name: 'Blue', hex: '#4D96FF', emotion: 'peaceful' },
    { name: 'Purple', hex: '#9D84B7', emotion: 'creative' },
    { name: 'Pink', hex: '#FFB6C1', emotion: 'loving' },
    { name: 'Gray', hex: '#A8A8A8', emotion: 'neutral' }
];

// State
let currentMode = 'emoji';
let selectedEmojis = [];
let selectedColor = null;
let intensityValue = 3;
let moodText = '';
let privacySetting = 'global';

// Initialize
async function init() {
    await waitForI18n(render);
}

function waitForI18n(callback) {
    if (window.i18n && window.i18n.currentLanguage) {
        callback();
    } else {
        setTimeout(() => waitForI18n(callback), 50);
    }
}

// Render main page
function render() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
            <div class="max-w-2xl mx-auto">
                <!-- Header -->
                <div class="text-center mb-8">
                    <h1 class="text-4xl font-bold text-gray-800 mb-2">
                        ${i18n.t('express_mood_title') || 'Express Your Mood'}
                    </h1>
                    <p class="text-gray-600">
                        ${i18n.t('express_mood_subtitle') || 'Tell us how you\'re feeling today'}
                    </p>
                </div>

                <!-- Mode Selector Card -->
                <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-bold text-gray-800">
                            ${i18n.t('express_mood_card_title') || 'Express Your Mood'}
                        </h2>
                        <button onclick="refreshPage()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>

                    <p class="text-gray-600 mb-6">
                        ${i18n.t('express_mood_instruction') || 'Choose how you want to express your current emotional state'}
                    </p>

                    <!-- Mode Tabs -->
                    <div class="flex flex-wrap gap-2 mb-6 bg-gray-900 rounded-xl p-2">
                        <button onclick="switchMode('emoji')" 
                                class="mode-tab ${currentMode === 'emoji' ? 'active' : ''}" 
                                data-mode="emoji">
                            <i class="fas fa-smile mr-2"></i>
                            ${i18n.t('express_mode_emoji') || 'Emoji'}
                        </button>
                        <button onclick="switchMode('color')" 
                                class="mode-tab ${currentMode === 'color' ? 'active' : ''}"
                                data-mode="color">
                            <i class="fas fa-palette mr-2"></i>
                            ${i18n.t('express_mode_color') || 'Color'}
                        </button>
                        <button onclick="switchMode('intensity')" 
                                class="mode-tab ${currentMode === 'intensity' ? 'active' : ''}"
                                data-mode="intensity">
                            <i class="fas fa-sliders-h mr-2"></i>
                            ${i18n.t('express_mode_intensity') || 'Intensity'}
                        </button>
                        <button onclick="switchMode('text')" 
                                class="mode-tab ${currentMode === 'text' ? 'active' : ''}"
                                data-mode="text">
                            <i class="fas fa-font mr-2"></i>
                            ${i18n.t('express_mode_text') || 'Text'}
                        </button>
                        <button onclick="switchMode('voice')" 
                                class="mode-tab ${currentMode === 'voice' ? 'active' : ''}"
                                data-mode="voice">
                            <i class="fas fa-microphone mr-2"></i>
                            ${i18n.t('express_mode_voice') || 'Voice'}
                        </button>
                    </div>

                    <!-- Mode Content -->
                    <div id="mode-content" class="mb-6">
                        ${renderModeContent()}
                    </div>
                </div>

                <!-- Privacy Settings Card -->
                <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">
                        ${i18n.t('privacy_setting') || 'Privacy Setting'}
                    </h3>
                    
                    <div class="space-y-3">
                        <label class="flex items-center p-4 border-2 rounded-xl cursor-pointer ${privacySetting === 'global' ? 'border-primary bg-indigo-50' : 'border-gray-200'}">
                            <input type="radio" name="privacy" value="global" 
                                   ${privacySetting === 'global' ? 'checked' : ''} 
                                   onchange="updatePrivacy('global')" 
                                   class="mr-3">
                            <i class="fas fa-globe text-primary mr-3"></i>
                            <span class="font-medium">${i18n.t('privacy_global') || 'Global'}</span>
                        </label>
                        
                        <label class="flex items-center p-4 border-2 rounded-xl cursor-pointer ${privacySetting === 'friends' ? 'border-primary bg-indigo-50' : 'border-gray-200'}">
                            <input type="radio" name="privacy" value="friends" 
                                   ${privacySetting === 'friends' ? 'checked' : ''} 
                                   onchange="updatePrivacy('friends')" 
                                   class="mr-3">
                            <i class="fas fa-user-friends text-primary mr-3"></i>
                            <span class="font-medium">${i18n.t('privacy_friends') || 'Friends'}</span>
                        </label>
                        
                        <label class="flex items-center p-4 border-2 rounded-xl cursor-pointer ${privacySetting === 'private' ? 'border-primary bg-indigo-50' : 'border-gray-200'}">
                            <input type="radio" name="privacy" value="private" 
                                   ${privacySetting === 'private' ? 'checked' : ''} 
                                   onchange="updatePrivacy('private')" 
                                   class="mr-3">
                            <i class="fas fa-lock text-primary mr-3"></i>
                            <span class="font-medium">${i18n.t('privacy_private') || 'Private'}</span>
                        </label>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-4">
                    <button onclick="resetForm()" 
                            class="flex-1 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition">
                        <i class="fas fa-redo mr-2"></i>
                        ${i18n.t('btn_reset') || 'Reset'}
                    </button>
                    <button onclick="saveMood()" 
                            class="flex-1 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-indigo-700 transition">
                        <i class="fas fa-bookmark mr-2"></i>
                        ${i18n.t('btn_save_mood') || 'Save Mood'}
                    </button>
                </div>

                <!-- Share Options -->
                <div class="mt-6 text-center">
                    <p class="text-gray-600 mb-3">${i18n.t('share_mood') || 'Share your mood'}</p>
                    <div class="flex justify-center gap-4">
                        <button class="w-10 h-10 rounded-full bg-blue-500 text-white hover:bg-blue-600">
                            <i class="fab fa-twitter"></i>
                        </button>
                        <button class="w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700">
                            <i class="fab fa-facebook-f"></i>
                        </button>
                        <button class="w-10 h-10 rounded-full bg-green-500 text-white hover:bg-green-600">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                        <button class="w-10 h-10 rounded-full bg-gray-600 text-white hover:bg-gray-700">
                            <i class="fas fa-link"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render mode-specific content
function renderModeContent() {
    switch (currentMode) {
        case 'emoji':
            return renderEmojiMode();
        case 'color':
            return renderColorMode();
        case 'intensity':
            return renderIntensityMode();
        case 'text':
            return renderTextMode();
        case 'voice':
            return renderVoiceMode();
        default:
            return '';
    }
}

// Emoji mode
function renderEmojiMode() {
    return `
        <div class="emoji-grid grid grid-cols-8 gap-3">
            ${ALL_EMOJIS.map((emoji, index) => `
                <button onclick="toggleEmoji('${emoji}')" 
                        class="emoji-btn text-4xl p-2 rounded-lg hover:bg-gray-100 transition ${selectedEmojis.includes(emoji) ? 'bg-indigo-100 ring-2 ring-primary' : ''}"
                        data-emoji="${emoji}">
                    ${emoji}
                </button>
            `).join('')}
        </div>
        ${selectedEmojis.length > 0 ? `
            <div class="mt-6 p-4 bg-indigo-50 rounded-xl">
                <p class="text-sm text-gray-600 mb-2">${i18n.t('selected_emojis') || 'Selected'}: </p>
                <div class="text-5xl flex gap-2 flex-wrap">
                    ${selectedEmojis.map(emoji => `<span>${emoji}</span>`).join('')}
                </div>
            </div>
        ` : ''}
    `;
}

// Color mode
function renderColorMode() {
    return `
        <div class="space-y-4">
            <div class="grid grid-cols-4 gap-4">
                ${MOOD_COLORS.map(color => `
                    <button onclick="selectColor('${color.hex}')" 
                            class="color-btn aspect-square rounded-2xl transition transform hover:scale-105 ${selectedColor === color.hex ? 'ring-4 ring-primary ring-offset-2' : ''}"
                            style="background: ${color.hex};">
                        ${selectedColor === color.hex ? '<i class="fas fa-check text-white text-2xl"></i>' : ''}
                    </button>
                `).join('')}
            </div>
            ${selectedColor ? `
                <div class="p-6 rounded-xl text-center" style="background: ${selectedColor}20;">
                    <div class="w-20 h-20 rounded-full mx-auto mb-3" style="background: ${selectedColor};"></div>
                    <p class="font-semibold text-gray-800">${MOOD_COLORS.find(c => c.hex === selectedColor)?.emotion || ''}</p>
                </div>
            ` : ''}
        </div>
    `;
}

// Intensity mode
function renderIntensityMode() {
    return `
        <div class="space-y-6">
            <div class="text-center">
                <div class="text-6xl font-bold text-primary mb-2">${intensityValue}</div>
                <p class="text-gray-600">${i18n.t('intensity_level') || 'Intensity Level'}</p>
            </div>
            
            <div class="space-y-4">
                <input type="range" 
                       id="intensity-range" 
                       min="1" 
                       max="10" 
                       value="${intensityValue}" 
                       oninput="updateIntensity(this.value)"
                       class="w-full h-4 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-full appearance-none cursor-pointer">
                
                <div class="flex justify-between text-sm text-gray-600">
                    <span>${i18n.t('intensity_low') || 'Low'}</span>
                    <span>${i18n.t('intensity_medium') || 'Medium'}</span>
                    <span>${i18n.t('intensity_high') || 'High'}</span>
                </div>
            </div>

            <div class="grid grid-cols-10 gap-2">
                ${Array.from({length: 10}, (_, i) => i + 1).map(num => `
                    <button onclick="setIntensity(${num})" 
                            class="aspect-square rounded-lg font-semibold ${intensityValue === num ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'} hover:bg-primary hover:text-white transition">
                        ${num}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

// Text mode
function renderTextMode() {
    return `
        <div class="space-y-4">
            <textarea id="mood-text" 
                      rows="6" 
                      class="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 resize-none"
                      placeholder="${i18n.t('express_text_placeholder') || 'Describe how you\'re feeling... What\'s on your mind? What happened today?'}"
                      oninput="updateMoodText(this.value)">${moodText}</textarea>
            
            <div class="flex items-center justify-between text-sm text-gray-600">
                <span>${i18n.t('character_count') || 'Characters'}: <span id="char-count">${moodText.length}</span>/500</span>
                <span class="text-gray-400">${i18n.t('express_text_hint') || 'Be as detailed as you want'}</span>
            </div>
        </div>
    `;
}

// Voice mode
function renderVoiceMode() {
    return `
        <div class="text-center space-y-6">
            <div class="w-32 h-32 mx-auto bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
                <i class="fas fa-microphone text-white text-5xl"></i>
            </div>
            
            <div class="space-y-2">
                <h3 class="text-xl font-semibold text-gray-800">
                    ${i18n.t('voice_record_title') || 'Voice Recording'}
                </h3>
                <p class="text-gray-600">
                    ${i18n.t('voice_record_desc') || 'Tap to start recording your feelings'}
                </p>
            </div>

            <button onclick="toggleVoiceRecording()" 
                    id="voice-record-btn"
                    class="px-8 py-4 bg-primary text-white rounded-full font-semibold hover:bg-indigo-700 transition">
                <i class="fas fa-circle mr-2"></i>
                ${i18n.t('btn_start_recording') || 'Start Recording'}
            </button>

            <div id="voice-status" class="hidden p-4 bg-red-50 rounded-xl">
                <div class="flex items-center justify-center gap-3">
                    <div class="recording-pulse"></div>
                    <span class="text-red-600 font-medium">${i18n.t('recording') || 'Recording...'}</span>
                </div>
            </div>

            <p class="text-sm text-gray-500">
                ${i18n.t('voice_note') || 'Note: Voice recordings are processed locally and securely'}
            </p>
        </div>
    `;
}

// Mode switcher
function switchMode(mode) {
    currentMode = mode;
    
    // Update tab styles
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    
    // Update content
    document.getElementById('mode-content').innerHTML = renderModeContent();
}

// Emoji functions
function toggleEmoji(emoji) {
    if (selectedEmojis.includes(emoji)) {
        selectedEmojis = selectedEmojis.filter(e => e !== emoji);
    } else {
        selectedEmojis.push(emoji);
    }
    
    document.getElementById('mode-content').innerHTML = renderEmojiMode();
}

// Color functions
function selectColor(hex) {
    selectedColor = hex;
    document.getElementById('mode-content').innerHTML = renderColorMode();
}

// Intensity functions
function updateIntensity(value) {
    intensityValue = parseInt(value);
    document.getElementById('mode-content').innerHTML = renderIntensityMode();
}

function setIntensity(num) {
    intensityValue = num;
    document.getElementById('mode-content').innerHTML = renderIntensityMode();
}

// Text functions
function updateMoodText(text) {
    moodText = text.substring(0, 500);
    const charCount = document.getElementById('char-count');
    if (charCount) charCount.textContent = moodText.length;
}

// Voice functions
let isRecording = false;
let mediaRecorder = null;

async function toggleVoiceRecording() {
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.start();
            isRecording = true;
            
            document.getElementById('voice-record-btn').innerHTML = '<i class="fas fa-stop mr-2"></i>' + (i18n.t('btn_stop_recording') || 'Stop Recording');
            document.getElementById('voice-status').classList.remove('hidden');
            
        } catch (error) {
            alert(i18n.t('voice_error') || 'Unable to access microphone. Please check permissions.');
        }
    } else {
        if (mediaRecorder) {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        isRecording = false;
        
        document.getElementById('voice-record-btn').innerHTML = '<i class="fas fa-circle mr-2"></i>' + (i18n.t('btn_start_recording') || 'Start Recording');
        document.getElementById('voice-status').classList.add('hidden');
    }
}

// Privacy functions
function updatePrivacy(setting) {
    privacySetting = setting;
}

// Form functions
function resetForm() {
    selectedEmojis = [];
    selectedColor = null;
    intensityValue = 3;
    moodText = '';
    privacySetting = 'global';
    currentMode = 'emoji';
    render();
}

async function saveMood() {
    const moodData = {
        mode: currentMode,
        emojis: selectedEmojis,
        color: selectedColor,
        intensity: intensityValue,
        text: moodText,
        privacy: privacySetting,
        logged_at: new Date().toISOString()
    };
    
    // Validation
    if (currentMode === 'emoji' && selectedEmojis.length === 0) {
        alert(i18n.t('error_select_emoji') || 'Please select at least one emoji');
        return;
    }
    
    if (currentMode === 'color' && !selectedColor) {
        alert(i18n.t('error_select_color') || 'Please select a color');
        return;
    }
    
    if (currentMode === 'text' && moodText.trim() === '') {
        alert(i18n.t('error_enter_text') || 'Please enter some text');
        return;
    }
    
    try {
        // TODO: Save to API
        console.log('Saving mood:', moodData);
        
        // Show success message
        alert(i18n.t('success_mood_saved') || 'Your mood has been saved!');
        
        // Redirect to dashboard
        window.location.href = '/';
    } catch (error) {
        console.error('Error saving mood:', error);
        alert(i18n.t('error_saving_mood') || 'Failed to save mood. Please try again.');
    }
}

function refreshPage() {
    location.reload();
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
