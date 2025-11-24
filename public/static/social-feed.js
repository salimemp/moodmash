/**
 * MoodMash Social Feed Dashboard
 * Version: 10.0 (Phase 3)
 * Features: Social feed, mood sharing, friend connections, reactions, comments
 */

// ===== GLOBAL STATE =====
let currentUser = null;
let socialFeed = [];
let myFriends = [];
let friendRequests = [];
let mySharedMoods = [];

// ===== API HELPERS =====
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// ===== LOAD DATA FUNCTIONS =====
async function loadSocialFeed() {
  try {
    const data = await apiCall('/api/social/feed');
    socialFeed = data.posts || [];
    renderSocialFeed();
  } catch (error) {
    console.error('Failed to load social feed:', error);
    document.getElementById('social-feed-container').innerHTML = `
      <div class="text-center py-8">
        <p class="text-red-600">Failed to load social feed</p>
      </div>
    `;
  }
}

async function loadMySharedMoods() {
  try {
    const data = await apiCall('/api/social/my-shares?user_id=1');
    mySharedMoods = data.shares || [];
    renderMyShares();
  } catch (error) {
    console.error('Failed to load shared moods:', error);
  }
}

async function loadFriends() {
  try {
    const data = await apiCall('/api/social/friends?user_id=1');
    myFriends = data.friends || [];
    renderFriendsList();
  } catch (error) {
    console.error('Failed to load friends:', error);
  }
}

// ===== MOOD SHARING =====
async function shareNewMood() {
  const emotion = document.getElementById('share-emotion').value;
  const intensity = parseInt(document.getElementById('share-intensity').value);
  const content = document.getElementById('share-content').value;
  const privacy = document.getElementById('share-privacy').value;

  if (!emotion || !content) {
    alert('Please fill in all required fields');
    return;
  }

  try {
    await apiCall('/api/social/share', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 1,
        emotion,
        intensity,
        content,
        privacy_level: privacy,
      }),
    });

    // Reset form
    document.getElementById('share-emotion').value = 'happy';
    document.getElementById('share-intensity').value = '3';
    document.getElementById('share-content').value = '';

    // Reload feeds
    await Promise.all([loadSocialFeed(), loadMySharedMoods()]);

    alert('Mood shared successfully! 🎉');
  } catch (error) {
    alert('Failed to share mood. Please try again.');
  }
}

// ===== REACTIONS =====
async function addReaction(postId, reactionType) {
  try {
    await apiCall('/api/social/reactions', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 1,
        post_id: postId,
        reaction_type: reactionType,
      }),
    });

    await loadSocialFeed();
  } catch (error) {
    console.error('Failed to add reaction:', error);
  }
}

// ===== COMMENTS =====
async function addComment(postId) {
  const commentInput = document.getElementById(`comment-input-${postId}`);
  const content = commentInput.value.trim();

  if (!content) return;

  try {
    await apiCall('/api/social/comments', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 1,
        post_id: postId,
        content,
      }),
    });

    commentInput.value = '';
    await loadSocialFeed();
  } catch (error) {
    console.error('Failed to add comment:', error);
  }
}

// ===== RENDER FUNCTIONS =====
function renderSocialFeed() {
  const container = document.getElementById('social-feed-container');

  if (!socialFeed.length) {
    container.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-users text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-600 text-lg">No posts yet. Share your mood to get started!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = socialFeed
    .map(
      (post) => `
    <div class="bg-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow">
      <!-- Post Header -->
      <div class="flex items-center mb-4">
        <div class="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold mr-3">
          ${post.user_name ? post.user_name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div>
          <h3 class="font-semibold text-gray-800">${post.user_name || 'Anonymous User'}</h3>
          <p class="text-sm text-gray-500">${formatTimestamp(post.created_at)}</p>
        </div>
      </div>

      <!-- Mood Badge -->
      <div class="mb-3">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getMoodColor(post.emotion)}">
          ${getMoodEmoji(post.emotion)} ${post.emotion} 
          <span class="ml-1 text-xs">(${post.intensity}/5)</span>
        </span>
      </div>

      <!-- Post Content -->
      <p class="text-gray-700 mb-4">${post.content || ''}</p>

      <!-- Reactions Bar -->
      <div class="flex items-center justify-between border-t pt-3">
        <div class="flex space-x-4">
          <button onclick="addReaction(${post.id}, 'like')" class="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors">
            <i class="fas fa-thumbs-up"></i>
            <span>${post.like_count || 0}</span>
          </button>
          <button onclick="addReaction(${post.id}, 'love')" class="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors">
            <i class="fas fa-heart"></i>
            <span>${post.love_count || 0}</span>
          </button>
          <button onclick="addReaction(${post.id}, 'support')" class="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors">
            <i class="fas fa-hands-helping"></i>
            <span>${post.support_count || 0}</span>
          </button>
          <button class="flex items-center space-x-1 text-gray-600 hover:text-purple-600 transition-colors">
            <i class="fas fa-comment"></i>
            <span>${post.comment_count || 0}</span>
          </button>
        </div>
      </div>

      <!-- Comment Input -->
      <div class="mt-4 pt-4 border-t">
        <div class="flex items-center space-x-2">
          <input
            type="text"
            id="comment-input-${post.id}"
            placeholder="Write a supportive comment..."
            class="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onclick="addComment(${post.id})"
            class="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
          >
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  `
    )
    .join('');
}

function renderMyShares() {
  const container = document.getElementById('my-shares-container');

  if (!mySharedMoods.length) {
    container.innerHTML = `
      <div class="text-center py-8">
        <p class="text-gray-500">You haven't shared any moods yet</p>
      </div>
    `;
    return;
  }

  container.innerHTML = mySharedMoods
    .map(
      (share) => `
    <div class="bg-white rounded-lg p-4 mb-3 border border-gray-200">
      <div class="flex items-center justify-between mb-2">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getMoodColor(share.emotion)}">
          ${getMoodEmoji(share.emotion)} ${share.emotion}
        </span>
        <span class="text-xs text-gray-500">${formatTimestamp(share.created_at)}</span>
      </div>
      <p class="text-gray-700 text-sm mb-2">${share.content || ''}</p>
      <div class="flex items-center justify-between text-xs text-gray-500">
        <span>
          <i class="fas fa-${share.privacy_level === 'public' ? 'globe' : share.privacy_level === 'friends' ? 'user-friends' : 'lock'}"></i>
          ${share.privacy_level}
        </span>
        <div class="space-x-3">
          <span><i class="fas fa-thumbs-up"></i> ${share.like_count || 0}</span>
          <span><i class="fas fa-comment"></i> ${share.comment_count || 0}</span>
        </div>
      </div>
    </div>
  `
    )
    .join('');
}

function renderFriendsList() {
  const container = document.getElementById('friends-list-container');

  if (!myFriends.length) {
    container.innerHTML = `
      <div class="text-center py-8">
        <p class="text-gray-500">No friends yet. Start connecting!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = myFriends
    .map(
      (friend) => `
    <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 mb-2">
      <div class="flex items-center">
        <div class="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold mr-3">
          ${friend.name ? friend.name.charAt(0).toUpperCase() : 'F'}
        </div>
        <div>
          <h4 class="font-medium text-gray-800">${friend.name || 'Friend'}</h4>
          <p class="text-xs text-gray-500">Connected</p>
        </div>
      </div>
      <button class="text-purple-600 hover:text-purple-700">
        <i class="fas fa-user-circle"></i>
      </button>
    </div>
  `
    )
    .join('');
}

// ===== UTILITY FUNCTIONS =====
function getMoodColor(emotion) {
  const colors = {
    happy: 'bg-yellow-100 text-yellow-800',
    sad: 'bg-blue-100 text-blue-800',
    anxious: 'bg-orange-100 text-orange-800',
    calm: 'bg-green-100 text-green-800',
    angry: 'bg-red-100 text-red-800',
    excited: 'bg-pink-100 text-pink-800',
    tired: 'bg-gray-100 text-gray-800',
    energetic: 'bg-purple-100 text-purple-800',
    peaceful: 'bg-teal-100 text-teal-800',
  };
  return colors[emotion] || 'bg-gray-100 text-gray-800';
}

function getMoodEmoji(emotion) {
  const emojis = {
    happy: '😊',
    sad: '😢',
    anxious: '😰',
    calm: '😌',
    angry: '😠',
    excited: '🤩',
    tired: '😴',
    energetic: '⚡',
    peaceful: '☮️',
  };
  return emojis[emotion] || '😐';
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// ===== MAIN DASHBOARD RENDER =====
function renderDashboard() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">
          <i class="fas fa-users text-purple-600 mr-2"></i>
          Social Feed
        </h1>
        <p class="text-gray-600">Connect, share, and support each other's emotional journeys</p>
      </div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Sidebar - Share Mood -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-share-alt text-purple-600 mr-2"></i>
              Share Your Mood
            </h2>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Emotion</label>
                <select id="share-emotion" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option value="happy">😊 Happy</option>
                  <option value="sad">😢 Sad</option>
                  <option value="anxious">😰 Anxious</option>
                  <option value="calm">😌 Calm</option>
                  <option value="angry">😠 Angry</option>
                  <option value="excited">🤩 Excited</option>
                  <option value="tired">😴 Tired</option>
                  <option value="energetic">⚡ Energetic</option>
                  <option value="peaceful">☮️ Peaceful</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Intensity (1-5)</label>
                <input type="range" id="share-intensity" min="1" max="5" value="3" class="w-full">
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Mild</span>
                  <span>Moderate</span>
                  <span>Intense</span>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">What's on your mind?</label>
                <textarea
                  id="share-content"
                  rows="4"
                  placeholder="Share your thoughts, feelings, or experiences..."
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Privacy</label>
                <select id="share-privacy" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option value="public">🌍 Public - Everyone can see</option>
                  <option value="friends">👥 Friends Only</option>
                  <option value="private">🔒 Private - Only me</option>
                </select>
              </div>

              <button
                onclick="shareNewMood()"
                class="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                <i class="fas fa-share-alt mr-2"></i>
                Share Mood
              </button>
            </div>
          </div>

          <!-- My Shared Moods -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-history text-blue-600 mr-2"></i>
              My Recent Shares
            </h2>
            <div id="my-shares-container">
              <div class="text-center py-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Feed -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-2xl font-bold text-gray-800">
                <i class="fas fa-stream text-purple-600 mr-2"></i>
                Community Feed
              </h2>
              <button onclick="loadSocialFeed()" class="text-purple-600 hover:text-purple-700">
                <i class="fas fa-sync-alt"></i>
              </button>
            </div>

            <div id="social-feed-container">
              <div class="text-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p class="text-gray-500 mt-4">Loading feed...</p>
              </div>
            </div>
          </div>

          <!-- Friends Section -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-user-friends text-green-600 mr-2"></i>
              Friends & Connections
            </h2>
            <div id="friends-list-container">
              <div class="text-center py-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Load all data
  Promise.all([loadSocialFeed(), loadMySharedMoods(), loadFriends()]);
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  renderDashboard();
});
