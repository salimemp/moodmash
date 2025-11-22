// MoodMash Quick Select Component

// Quick Select Manager
class QuickSelectManager {
    constructor() {
        this.isVisible = false;
        this.recentEmojis = this.loadRecentEmojis();
        this.selectedEmoji = null;
        this.currentTab = 'recent'; // recent or all
    }

    // Load recent emojis from localStorage
    loadRecentEmojis() {
        try {
            const stored = localStorage.getItem('recent_emojis');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    }

    // Save recent emoji
    saveRecentEmoji(emoji) {
        // Add to beginning of array
        this.recentEmojis = [emoji, ...this.recentEmojis.filter(e => e !== emoji)];
        // Keep only last 16 emojis
        this.recentEmojis = this.recentEmojis.slice(0, 16);
        localStorage.setItem('recent_emojis', JSON.stringify(this.recentEmojis));
    }

    // All available emojis
    getAllEmojis() {
        return [
            '😊', '😃', '😄', '😁', '🙂', '😇', '🤗', '🥳',
            '😢', '😭', '😞', '😔', '😟', '🥺', '☹️', '😿',
            '😰', '😨', '😧', '😦', '😖', '😣', '😩', '🤯',
            '😌', '😊', '🧘', '😴', '💆', '🕊️', '☮️', '🍃',
            '⚡', '💪', '🔥', '🏃', '🎉', '🚀', '⭐', '✨',
            '😴', '🥱', '😪', '💤', '😵', '🛌', '💆', '😑',
            '😠', '😡', '🤬', '😤', '👿', '💢', '🔥', '😾',
            '😌', '🧘', '🕊️', '☮️', '🌸', '🍃', '💮', '🌺',
            '😫', '😩', '😖', '😣', '🤯', '😰', '💢', '🌪️',
            '😐', '😑', '😶', '🤷', '😕', '🙂', '😊', '😏',
            '❤️', '💙', '💜', '💚', '💛', '🧡', '🩷', '💗',
            '🤩', '😍', '🥰', '🤗', '🎉', '🎊', '🎈', '✨'
        ];
    }

    // Show quick select modal
    show() {
        if (this.isVisible) return;
        this.isVisible = true;
        this.render();
    }

    // Hide quick select modal
    hide() {
        this.isVisible = false;
        const modal = document.getElementById('quick-select-modal');
        if (modal) {
            modal.remove();
        }
    }

    // Switch tab
    switchTab(tab) {
        this.currentTab = tab;
        this.render();
    }

    // Select emoji
    selectEmoji(emoji) {
        this.selectedEmoji = emoji;
        this.render();
    }

    // Record mood
    async recordMood() {
        if (!this.selectedEmoji) {
            alert(window.i18n?.t('error_select_emoji') || 'Please select an emoji');
            return;
        }

        try {
            // Save to recent emojis
            this.saveRecentEmoji(this.selectedEmoji);

            // Mock API call - will be replaced with real API
            console.log('Recording mood:', this.selectedEmoji);

            // Close modal
            this.hide();

            // Show success message
            this.showSuccessMessage();

            // Refresh page data if on dashboard
            if (window.location.pathname === '/') {
                setTimeout(() => {
                    location.reload();
                }, 1500);
            }
        } catch (error) {
            console.error('Failed to record mood:', error);
            alert(window.i18n?.t('error_recording_mood') || 'Failed to record mood. Please try again.');
        }
    }

    // Show success message
    showSuccessMessage() {
        const message = document.createElement('div');
        message.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slideInUp';
        message.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fas fa-check-circle"></i>
                <span class="font-semibold">${window.i18n?.t('mood_recorded_success') || 'Mood recorded successfully!'}</span>
            </div>
        `;
        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    // Render the modal
    render() {
        if (!this.isVisible) return;

        // Remove existing modal
        const existing = document.getElementById('quick-select-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'quick-select-modal';
        modal.className = 'quick-select-modal';
        modal.onclick = (e) => {
            if (e.target === modal) this.hide();
        };

        const emojisToShow = this.currentTab === 'recent' ? this.recentEmojis : this.getAllEmojis();

        modal.innerHTML = `
            <div class="quick-select-content">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold text-gray-800">
                        ${window.i18n?.t('how_are_you_feeling') || 'How are you feeling?'}
                    </h2>
                    <button onclick="quickSelectManager.hide()" 
                            class="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>

                <p class="text-gray-600 mb-6">
                    ${window.i18n?.t('select_emoji_current_mood') || 'Select an emoji that best represents your current mood'}
                </p>

                <!-- Tab Selector -->
                <div class="flex gap-2 mb-6 bg-gray-100 rounded-xl p-1">
                    <button onclick="quickSelectManager.switchTab('recent')" 
                            class="flex-1 py-2 px-4 rounded-lg font-medium transition ${this.currentTab === 'recent' ? 'bg-white text-primary shadow' : 'text-gray-600'}">
                        <i class="fas fa-clock mr-2"></i>
                        ${window.i18n?.t('tab_recent') || 'Recent'}
                    </button>
                    <button onclick="quickSelectManager.switchTab('all')" 
                            class="flex-1 py-2 px-4 rounded-lg font-medium transition ${this.currentTab === 'all' ? 'bg-white text-primary shadow' : 'text-gray-600'}">
                        <i class="fas fa-smile mr-2"></i>
                        ${window.i18n?.t('tab_all') || 'All'}
                    </button>
                </div>

                <!-- Emoji Grid -->
                ${emojisToShow.length > 0 ? `
                    <div class="grid grid-cols-8 gap-2 mb-6 max-h-96 overflow-y-auto">
                        ${emojisToShow.map(emoji => `
                            <button onclick="quickSelectManager.selectEmoji('${emoji}')" 
                                    class="recent-emoji ${this.selectedEmoji === emoji ? 'ring-2 ring-primary' : ''}"
                                    title="${emoji}">
                                ${emoji}
                            </button>
                        `).join('')}
                    </div>
                ` : `
                    <div class="text-center py-12">
                        <p class="text-gray-500 mb-4">
                            ${window.i18n?.t('no_recent_emojis') || 'No recent emojis yet'}
                        </p>
                        <button onclick="quickSelectManager.switchTab('all')" 
                                class="text-primary hover:underline">
                            ${window.i18n?.t('browse_all_emojis') || 'Browse all emojis'}
                        </button>
                    </div>
                `}

                <!-- Selected Emoji Display -->
                ${this.selectedEmoji ? `
                    <div class="bg-indigo-50 rounded-xl p-4 mb-6 text-center">
                        <p class="text-sm text-gray-600 mb-2">
                            ${window.i18n?.t('selected_emoji') || 'Selected'}:
                        </p>
                        <div class="text-6xl">${this.selectedEmoji}</div>
                    </div>
                ` : `
                    <p class="text-center text-sm text-gray-500 mb-6">
                        ${window.i18n?.t('select_emoji_to_record') || 'Select an emoji to record your mood'}
                    </p>
                `}

                <!-- Action Button -->
                <button onclick="quickSelectManager.recordMood()" 
                        class="w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        ${!this.selectedEmoji ? 'disabled' : ''}>
                    <i class="fas fa-check mr-2"></i>
                    ${window.i18n?.t('btn_record_mood') || 'Record Mood'}
                </button>
            </div>
        `;

        document.body.appendChild(modal);
    }
}

// Create global instance
const quickSelectManager = new QuickSelectManager();

// Add floating button to pages
function addQuickSelectButton() {
    // Don't add on Express or Log pages (they have their own logging)
    if (window.location.pathname === '/express' || window.location.pathname === '/log') {
        return;
    }

    // Check if button already exists
    if (document.getElementById('quick-select-btn')) return;

    const button = document.createElement('button');
    button.id = 'quick-select-btn';
    button.className = 'fixed bottom-20 right-6 w-16 h-16 bg-gradient-to-br from-primary to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition hover:scale-110 z-40';
    button.onclick = () => quickSelectManager.show();
    button.innerHTML = '<i class="fas fa-plus text-2xl"></i>';
    button.title = window.i18n?.t('quick_select_tooltip') || 'Quick Mood Select';

    document.body.appendChild(button);
}

// Initialize on page load
function initQuickSelect() {
    if (window.i18n && window.i18n.currentLanguage) {
        addQuickSelectButton();
    } else {
        setTimeout(initQuickSelect, 100);
    }
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuickSelect);
} else {
    initQuickSelect();
}

// Export for use in other scripts
window.quickSelectManager = quickSelectManager;
