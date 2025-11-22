// Challenges & Achievements - Gamification System
// Integrated with MoodMash i18n system

const API_BASE = '/api';

// State management
const state = {
    challenges: [],
    userProgress: {},
    achievements: [],
    gamification: {},
    loading: false,
    activeTab: 'challenges' // 'challenges' or 'achievements'
};

// Initialize the page
function init() {
    console.log('Challenges: Initializing...');
    loadData();
}

// Load all data
async function loadData() {
    state.loading = true;
    renderChallengesPage();

    try {
        // Load challenges, progress, achievements, and gamification data
        const [challengesRes, achievementsRes, gamificationRes] = await Promise.all([
            fetch(`${API_BASE}/challenges`),
            fetch(`${API_BASE}/achievements`),
            fetch(`${API_BASE}/gamification`)
        ]);

        if (challengesRes.ok) {
            const data = await challengesRes.json();
            state.challenges = data.challenges || [];
            state.userProgress = data.progress || {};
        }

        if (achievementsRes.ok) {
            const data = await achievementsRes.json();
            state.achievements = data.achievements || [];
        }

        if (gamificationRes.ok) {
            const data = await gamificationRes.json();
            state.gamification = data.gamification || {};
        }

        renderChallengesPage();
    } catch (error) {
        console.error('Error loading data:', error);
    } finally {
        state.loading = false;
    }
}

// Render main page
function renderChallengesPage() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
        <div class="max-w-6xl mx-auto px-4 py-8">
            <!-- Header with Stats -->
            <div class="text-center mb-8">
                <div class="flex items-center justify-center mb-4">
                    <i class="fas fa-trophy text-5xl text-yellow-500"></i>
                </div>
                <h1 class="text-4xl font-bold text-gray-800 mb-2" data-i18n="challenges_title">
                    ${i18n.t('challenges_title')}
                </h1>
                <p class="text-gray-600 text-lg" data-i18n="challenges_subtitle">
                    ${i18n.t('challenges_subtitle')}
                </p>
            </div>

            <!-- User Stats Card -->
            ${renderUserStats()}

            <!-- Tabs -->
            <div class="flex gap-2 mb-6">
                <button onclick="switchTab('challenges')" 
                        class="tab-btn flex-1 py-3 px-6 rounded-lg font-semibold transition ${state.activeTab === 'challenges' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}">
                    <i class="fas fa-tasks mr-2"></i>
                    <span data-i18n="challenges_tab">${i18n.t('challenges_tab')}</span>
                </button>
                <button onclick="switchTab('achievements')" 
                        class="tab-btn flex-1 py-3 px-6 rounded-lg font-semibold transition ${state.activeTab === 'achievements' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}">
                    <i class="fas fa-medal mr-2"></i>
                    <span data-i18n="achievements_tab">${i18n.t('achievements_tab')}</span>
                </button>
            </div>

            <!-- Content -->
            <div id="tab-content">
                ${state.activeTab === 'challenges' ? renderChallenges() : renderAchievements()}
            </div>
        </div>
    `;
}

// Render user stats
function renderUserStats() {
    const stats = state.gamification;
    const level = stats.current_level || 1;
    const points = stats.total_points || 0;
    const nextLevel = stats.points_to_next_level || 100;
    const progress = (points % nextLevel) / nextLevel * 100;

    return `
        <div class="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg p-6 mb-8 text-white">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div class="text-center">
                    <div class="text-3xl font-bold">${level}</div>
                    <div class="text-sm opacity-90" data-i18n="challenges_level">Level</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold">${points}</div>
                    <div class="text-sm opacity-90" data-i18n="challenges_points">Points</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold">${stats.current_streak || 0}</div>
                    <div class="text-sm opacity-90" data-i18n="challenges_streak">Day Streak</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold">${stats.total_achievements_unlocked || 0}</div>
                    <div class="text-sm opacity-90" data-i18n="challenges_achievements">Achievements</div>
                </div>
            </div>
            
            <!-- Progress Bar -->
            <div class="mt-4">
                <div class="flex justify-between text-sm mb-1">
                    <span data-i18n="challenges_progress">Progress to Next Level</span>
                    <span>${Math.round(progress)}%</span>
                </div>
                <div class="w-full bg-white bg-opacity-30 rounded-full h-3">
                    <div class="bg-white rounded-full h-3 transition-all duration-500" style="width: ${progress}%"></div>
                </div>
                <div class="text-right text-sm mt-1">
                    ${points % nextLevel} / ${nextLevel} points
                </div>
            </div>
        </div>
    `;
}

// Render challenges
function renderChallenges() {
    if (state.challenges.length === 0) {
        return `
            <div class="bg-white rounded-lg shadow-md p-8 text-center">
                <i class="fas fa-tasks text-5xl text-gray-300 mb-4"></i>
                <p class="text-gray-600" data-i18n="challenges_no_data">No challenges available yet.</p>
            </div>
        `;
    }

    // Group challenges by type
    const daily = state.challenges.filter(c => c.challenge_type === 'weekly');
    const monthly = state.challenges.filter(c => c.challenge_type === 'monthly');

    return `
        <div class="space-y-8">
            ${renderChallengeSection('Weekly Challenges', daily, 'challenges_weekly')}
            ${renderChallengeSection('Monthly Challenges', monthly, 'challenges_monthly')}
        </div>
    `;
}

// Render challenge section
function renderChallengeSection(title, challenges, i18nKey) {
    if (challenges.length === 0) return '';

    return `
        <div>
            <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                <span data-i18n="${i18nKey}">${i18n.t(i18nKey)}</span>
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${challenges.map(challenge => renderChallengeCard(challenge)).join('')}
            </div>
        </div>
    `;
}

// Render individual challenge card
function renderChallengeCard(challenge) {
    const progress = state.userProgress[challenge.id] || {};
    const percentage = progress.completion_percentage || 0;
    const isCompleted = progress.is_completed || false;

    return `
        <div class="bg-white rounded-lg shadow-md p-6 ${isCompleted ? 'border-2 border-green-500' : ''}">
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center" 
                         style="background-color: ${challenge.badge_color}20">
                        <i class="fas ${challenge.badge_icon} text-xl" style="color: ${challenge.badge_color}"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">${challenge.title}</h3>
                        <span class="inline-block px-2 py-1 text-xs rounded ${
                            challenge.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            challenge.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                        }">
                            ${challenge.difficulty.toUpperCase()}
                        </span>
                    </div>
                </div>
                ${isCompleted ? '<i class="fas fa-check-circle text-2xl text-green-500"></i>' : ''}
            </div>
            
            <p class="text-gray-600 text-sm mb-4">${challenge.description}</p>
            
            <!-- Progress Bar -->
            <div class="mb-4">
                <div class="flex justify-between text-sm mb-1">
                    <span class="text-gray-600" data-i18n="challenges_progress_label">Progress</span>
                    <span class="font-semibold text-gray-800">${Math.round(percentage)}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                    <div class="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full h-3 transition-all duration-500" 
                         style="width: ${percentage}%"></div>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                    ${progress.current_value || 0} / ${challenge.goal_value} ${challenge.goal_metric}
                </div>
            </div>
            
            <!-- Reward -->
            <div class="flex items-center justify-between pt-4 border-t">
                <div class="flex items-center gap-2 text-yellow-600">
                    <i class="fas fa-star"></i>
                    <span class="font-semibold">${challenge.points} points</span>
                </div>
                ${!isCompleted && percentage > 0 ? 
                    `<button onclick="continueChallenging(${challenge.id})" 
                             class="text-sm text-primary hover:text-purple-700 transition">
                        <span data-i18n="challenges_continue">Continue →</span>
                    </button>` : ''}
            </div>
        </div>
    `;
}

// Render achievements
function renderAchievements() {
    if (state.achievements.length === 0) {
        return `
            <div class="bg-white rounded-lg shadow-md p-8 text-center">
                <i class="fas fa-medal text-5xl text-gray-300 mb-4"></i>
                <p class="text-gray-600" data-i18n="achievements_no_data">Complete challenges to unlock achievements!</p>
            </div>
        `;
    }

    return `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${state.achievements.map(achievement => renderAchievementCard(achievement)).join('')}
        </div>
    `;
}

// Render achievement card
function renderAchievementCard(achievement) {
    return `
        <div class="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition">
            <div class="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" 
                 style="background-color: ${achievement.badge_color}20">
                <i class="fas ${achievement.badge_icon} text-3xl" style="color: ${achievement.badge_color}"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">${achievement.title}</h3>
            <p class="text-gray-600 text-sm mb-3">${achievement.description}</p>
            <div class="flex items-center justify-center gap-2 text-yellow-600">
                <i class="fas fa-star"></i>
                <span class="font-semibold">${achievement.points} points</span>
            </div>
            <div class="text-xs text-gray-500 mt-2">
                ${new Date(achievement.unlocked_at).toLocaleDateString()}
            </div>
        </div>
    `;
}

// Switch tab
function switchTab(tab) {
    state.activeTab = tab;
    renderChallengesPage();
}

// Continue challenge (navigate to relevant feature)
function continueChallenging(challengeId) {
    // Navigate to log mood page
    window.location.href = '/log';
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
