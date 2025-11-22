// Social Feed - Community Mood Sharing
// Integrated with MoodMash i18n system

const API_BASE = '/api';

// State management
const state = {
    posts: [],
    currentUser: null,
    filter: 'all', // 'all', 'friends', emotion-specific
    loading: false,
    newPostContent: '',
    newPostEmotion: null,
    newPostPrivacy: 'public'
};

// Emotion emojis
const EMOTION_EMOJIS = {
    happy: '😊',
    sad: '😢',
    anxious: '😰',
    calm: '😌',
    energetic: '⚡',
    tired: '😴',
    angry: '😠',
    peaceful: '☮️',
    stressed: '😫',
    neutral: '😐'
};

// Initialize
function init() {
    console.log('Social Feed: Initializing...');
    loadCurrentUser();
    loadFeed();
}

// Load current user
async function loadCurrentUser() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`);
        if (response.ok) {
            const data = await response.json();
            state.currentUser = data.user;
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

// Load feed
async function loadFeed() {
    state.loading = true;
    renderSocialFeedPage();

    try {
        const response = await fetch(`${API_BASE}/social/feed?filter=${state.filter}`);
        if (response.ok) {
            const data = await response.json();
            state.posts = data.posts || [];
            renderSocialFeedPage();
        }
    } catch (error) {
        console.error('Error loading feed:', error);
    } finally {
        state.loading = false;
    }
}

// Render main page
function renderSocialFeedPage() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
        <div class="max-w-4xl mx-auto px-4 py-8">
            <!-- Header -->
            <div class="text-center mb-8">
                <div class="flex items-center justify-center mb-4">
                    <i class="fas fa-users text-5xl text-purple-500"></i>
                </div>
                <h1 class="text-4xl font-bold text-gray-800 mb-2" data-i18n="social_feed_title">
                    ${i18n.t('social_feed_title')}
                </h1>
                <p class="text-gray-600 text-lg" data-i18n="social_feed_subtitle">
                    ${i18n.t('social_feed_subtitle')}
                </p>
            </div>

            <!-- Create Post Card -->
            ${renderCreatePost()}

            <!-- Feed Filters -->
            ${renderFeedFilters()}

            <!-- Loading State -->
            ${state.loading ? renderLoading() : ''}

            <!-- Posts Feed -->
            <div id="posts-container" class="space-y-6">
                ${state.posts.length === 0 && !state.loading ? renderEmptyState() : ''}
                ${state.posts.map(post => renderPost(post)).join('')}
            </div>
        </div>
    `;
}

// Render create post card
function renderCreatePost() {
    return `
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                    ${state.currentUser?.name?.charAt(0) || 'U'}
                </div>
                <div class="flex-1">
                    <textarea id="new-post-content" 
                              placeholder="${i18n.t('social_feed_post_placeholder')}"
                              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                              rows="3"
                              onkeyup="updateNewPostContent(this.value)"></textarea>
                    
                    <!-- Emotion Selector -->
                    <div class="mt-4">
                        <label class="text-sm text-gray-700 font-medium mb-2 block" data-i18n="social_feed_select_emotion">
                            ${i18n.t('social_feed_select_emotion')}
                        </label>
                        <div class="flex flex-wrap gap-2">
                            ${Object.entries(EMOTION_EMOJIS).map(([emotion, emoji]) => `
                                <button onclick="selectEmotion('${emotion}')" 
                                        class="emotion-btn px-3 py-2 rounded-lg border-2 transition ${state.newPostEmotion === emotion ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}"
                                        data-emotion="${emotion}">
                                    <span class="text-xl">${emoji}</span>
                                    <span class="text-xs ml-1 capitalize">${emotion}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Privacy & Post Button -->
                    <div class="flex items-center justify-between mt-4">
                        <select id="post-privacy" 
                                onchange="updatePostPrivacy(this.value)"
                                class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm">
                            <option value="public">${i18n.t('privacy_public')}</option>
                            <option value="friends">${i18n.t('privacy_friends')}</option>
                            <option value="private">${i18n.t('privacy_private')}</option>
                        </select>
                        <button onclick="createPost()" 
                                class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
                                ${!state.newPostContent || !state.newPostEmotion ? 'disabled' : ''}>
                            <i class="fas fa-paper-plane mr-2"></i>
                            <span data-i18n="social_feed_post">${i18n.t('social_feed_post')}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render feed filters
function renderFeedFilters() {
    return `
        <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button onclick="filterFeed('all')" 
                    class="filter-btn px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${state.filter === 'all' ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}">
                <i class="fas fa-globe mr-2"></i>
                <span data-i18n="social_feed_all">${i18n.t('social_feed_all')}</span>
            </button>
            <button onclick="filterFeed('friends')" 
                    class="filter-btn px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${state.filter === 'friends' ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}">
                <i class="fas fa-user-friends mr-2"></i>
                <span data-i18n="social_feed_friends">${i18n.t('social_feed_friends')}</span>
            </button>
            ${Object.keys(EMOTION_EMOJIS).slice(0, 5).map(emotion => `
                <button onclick="filterFeed('${emotion}')" 
                        class="filter-btn px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${state.filter === emotion ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}">
                    <span class="mr-1">${EMOTION_EMOJIS[emotion]}</span>
                    <span class="capitalize">${emotion}</span>
                </button>
            `).join('')}
        </div>
    `;
}

// Render loading state
function renderLoading() {
    return `
        <div class="text-center py-12">
            <i class="fas fa-spinner fa-spin text-4xl text-purple-500 mb-4"></i>
            <p class="text-gray-600" data-i18n="loading_feed">${i18n.t('loading_feed')}</p>
        </div>
    `;
}

// Render empty state
function renderEmptyState() {
    return `
        <div class="bg-white rounded-lg shadow-md p-12 text-center">
            <i class="fas fa-comments text-5xl text-gray-300 mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-700 mb-2" data-i18n="social_feed_empty_title">
                ${i18n.t('social_feed_empty_title')}
            </h3>
            <p class="text-gray-600" data-i18n="social_feed_empty_text">
                ${i18n.t('social_feed_empty_text')}
            </p>
        </div>
    `;
}

// Render individual post
function renderPost(post) {
    const timeAgo = getTimeAgo(new Date(post.created_at));
    const emoji = EMOTION_EMOJIS[post.emotion] || '😊';
    
    return `
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition animate-fadeIn">
            <!-- Post Header -->
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                        ${post.user_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <h3 class="font-semibold text-gray-800">${post.user_name || 'Anonymous'}</h3>
                        <p class="text-sm text-gray-500">${timeAgo}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-2xl">${emoji}</span>
                    <span class="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        ${post.visibility}
                    </span>
                </div>
            </div>

            <!-- Post Content -->
            <p class="text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">${post.content}</p>

            <!-- Post Actions -->
            <div class="flex items-center gap-6 pt-4 border-t border-gray-100">
                <button onclick="toggleLike(${post.id})" 
                        class="flex items-center gap-2 text-gray-600 hover:text-red-500 transition">
                    <i class="fas fa-heart ${post.user_liked ? 'text-red-500' : ''}"></i>
                    <span class="text-sm font-medium">${post.like_count || 0}</span>
                </button>
                <button onclick="showComments(${post.id})" 
                        class="flex items-center gap-2 text-gray-600 hover:text-purple-500 transition">
                    <i class="fas fa-comment"></i>
                    <span class="text-sm font-medium">${post.comment_count || 0}</span>
                </button>
                <button onclick="sharePost(${post.id})" 
                        class="flex items-center gap-2 text-gray-600 hover:text-green-500 transition">
                    <i class="fas fa-share"></i>
                    <span class="text-sm font-medium">${post.share_count || 0}</span>
                </button>
            </div>
        </div>
    `;
}

// Update new post content
function updateNewPostContent(value) {
    state.newPostContent = value;
    renderSocialFeedPage();
}

// Select emotion for new post
function selectEmotion(emotion) {
    state.newPostEmotion = emotion;
    renderSocialFeedPage();
}

// Update post privacy
function updatePostPrivacy(privacy) {
    state.newPostPrivacy = privacy;
}

// Create new post
async function createPost() {
    if (!state.newPostContent || !state.newPostEmotion) return;

    try {
        const response = await fetch(`${API_BASE}/social/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: state.newPostContent,
                emotion: state.newPostEmotion,
                visibility: state.newPostPrivacy
            })
        });

        if (response.ok) {
            state.newPostContent = '';
            state.newPostEmotion = null;
            state.newPostPrivacy = 'public';
            document.getElementById('new-post-content').value = '';
            loadFeed();
            alert(i18n.t('social_feed_post_success'));
        }
    } catch (error) {
        console.error('Error creating post:', error);
        alert(i18n.t('social_feed_post_error'));
    }
}

// Filter feed
function filterFeed(filter) {
    state.filter = filter;
    loadFeed();
}

// Toggle like on post
async function toggleLike(postId) {
    try {
        const response = await fetch(`${API_BASE}/social/posts/${postId}/like`, {
            method: 'POST'
        });

        if (response.ok) {
            loadFeed(); // Refresh to show updated like count
        }
    } catch (error) {
        console.error('Error toggling like:', error);
    }
}

// Show comments (placeholder)
function showComments(postId) {
    alert(i18n.t('social_feed_comments_coming_soon'));
}

// Share post (placeholder)
function sharePost(postId) {
    alert(i18n.t('social_feed_share_coming_soon'));
}

// Get time ago string
function getTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    return date.toLocaleDateString();
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
