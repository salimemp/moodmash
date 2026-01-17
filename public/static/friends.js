// Friends Page JavaScript

let currentTab = 'friends';
let isLoading = false;

// Emotion colors
const emotionColors = {
  happy: '#fbbf24',
  sad: '#60a5fa',
  angry: '#ef4444',
  anxious: '#a855f7',
  calm: '#34d399',
  excited: '#f97316',
  tired: '#94a3b8',
  grateful: '#ec4899',
  neutral: '#9ca3af'
};

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    switchTab(tab);
  });
});

function switchTab(tab) {
  currentTab = tab;
  
  // Update button styles
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.dataset.tab === tab) {
      btn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
      btn.classList.add('bg-blue-600');
    } else {
      btn.classList.remove('bg-blue-600');
      btn.classList.add('bg-gray-700', 'hover:bg-gray-600');
    }
  });
  
  // Show/hide content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });
  document.getElementById(`${tab}-tab`).classList.remove('hidden');
  document.getElementById('search-results').classList.add('hidden');
  
  // Load data
  if (tab === 'friends') loadFriends();
  else if (tab === 'requests') loadRequests();
  else if (tab === 'suggestions') loadSuggestions();
}

// Load friends list
async function loadFriends() {
  if (isLoading) return;
  isLoading = true;
  
  const list = document.getElementById('friends-list');
  list.innerHTML = '<p class="text-gray-400">Loading friends...</p>';
  
  try {
    const res = await fetch('/api/friends?status=accepted');
    const data = await res.json();
    
    if (data.friends && data.friends.length > 0) {
      list.innerHTML = data.friends.map(friend => renderFriendCard(friend, 'friend')).join('');
      attachFriendActions();
    } else {
      list.innerHTML = `
        <div class="text-center py-8">
          <p class="text-gray-400 mb-4">No friends yet</p>
          <p class="text-gray-500 text-sm">Search for users or check out suggestions!</p>
        </div>
      `;
    }
  } catch (err) {
    list.innerHTML = '<p class="text-red-400">Failed to load friends</p>';
    console.error('Error loading friends:', err);
  }
  
  isLoading = false;
}

// Load friend requests
async function loadRequests() {
  if (isLoading) return;
  isLoading = true;
  
  const list = document.getElementById('requests-list');
  list.innerHTML = '<p class="text-gray-400">Loading requests...</p>';
  
  try {
    const res = await fetch('/api/friends?status=pending');
    const data = await res.json();
    
    if (data.friends && data.friends.length > 0) {
      list.innerHTML = data.friends.map(friend => renderFriendCard(friend, 'request')).join('');
      attachFriendActions();
    } else {
      list.innerHTML = `
        <div class="text-center py-8">
          <p class="text-gray-400">No pending requests</p>
        </div>
      `;
    }
  } catch (err) {
    list.innerHTML = '<p class="text-red-400">Failed to load requests</p>';
    console.error('Error loading requests:', err);
  }
  
  isLoading = false;
}

// Load friend suggestions
async function loadSuggestions() {
  if (isLoading) return;
  isLoading = true;
  
  const list = document.getElementById('suggestions-list');
  list.innerHTML = '<p class="text-gray-400">Loading suggestions...</p>';
  
  try {
    const res = await fetch('/api/friends/suggestions');
    const data = await res.json();
    
    if (data.suggestions && data.suggestions.length > 0) {
      list.innerHTML = data.suggestions.map(user => renderFriendCard(user, 'suggestion')).join('');
      attachFriendActions();
    } else {
      list.innerHTML = `
        <div class="text-center py-8">
          <p class="text-gray-400">No suggestions available</p>
          <p class="text-gray-500 text-sm">Try searching for users!</p>
        </div>
      `;
    }
  } catch (err) {
    list.innerHTML = '<p class="text-red-400">Failed to load suggestions</p>';
    console.error('Error loading suggestions:', err);
  }
  
  isLoading = false;
}

// Render friend card
function renderFriendCard(user, type) {
  const name = user.display_name || user.name || user.email.split('@')[0];
  const avatar = user.avatar_url || '';
  const initial = name.charAt(0).toUpperCase();
  const userId = user.user_id || user.id;
  
  let actions = '';
  if (type === 'friend') {
    actions = `
      <a href="/users/${userId}" class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">View</a>
      <button class="remove-friend px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-sm" data-id="${userId}">Remove</button>
    `;
  } else if (type === 'request') {
    actions = `
      <button class="accept-request px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-sm" data-id="${user.id}">Accept</button>
      <button class="decline-request px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-sm" data-id="${user.id}">Decline</button>
    `;
  } else if (type === 'suggestion') {
    actions = `
      <button class="send-request px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm" data-id="${userId}">Add Friend</button>
    `;
  } else if (type === 'search') {
    if (user.friendship_status === 'friend') {
      actions = `<span class="text-green-400 text-sm">✓ Friends</span>`;
    } else if (user.friendship_status === 'request_sent') {
      actions = `<span class="text-yellow-400 text-sm">Request Sent</span>`;
    } else if (user.friendship_status === 'request_received') {
      actions = `<span class="text-yellow-400 text-sm">Request Pending</span>`;
    } else {
      actions = `
        <button class="send-request px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm" data-id="${userId}">Add Friend</button>
      `;
    }
  }
  
  return `
    <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold">
          ${avatar ? `<img src="${avatar}" class="w-full h-full rounded-full object-cover">` : initial}
        </div>
        <div>
          <a href="/users/${userId}" class="font-semibold hover:text-blue-400">${name}</a>
          ${user.bio ? `<p class="text-gray-400 text-sm">${user.bio.substring(0, 50)}${user.bio.length > 50 ? '...' : ''}</p>` : ''}
          ${user.mutual_friends ? `<p class="text-gray-500 text-xs">${user.mutual_friends} mutual friends</p>` : ''}
        </div>
      </div>
      <div class="flex gap-2">
        ${actions}
      </div>
    </div>
  `;
}

// Attach event listeners to friend action buttons
function attachFriendActions() {
  // Send friend request
  document.querySelectorAll('.send-request').forEach(btn => {
    btn.addEventListener('click', async () => {
      const friendId = btn.dataset.id;
      btn.disabled = true;
      btn.textContent = 'Sending...';
      
      try {
        const res = await fetch('/api/friends/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ friend_id: parseInt(friendId) })
        });
        const data = await res.json();
        
        if (data.success) {
          btn.textContent = 'Request Sent';
          btn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
          btn.classList.add('bg-gray-600');
        } else {
          btn.textContent = 'Add Friend';
          btn.disabled = false;
          alert(data.error || 'Failed to send request');
        }
      } catch (err) {
        btn.textContent = 'Add Friend';
        btn.disabled = false;
        console.error('Error sending request:', err);
      }
    });
  });
  
  // Accept request
  document.querySelectorAll('.accept-request').forEach(btn => {
    btn.addEventListener('click', async () => {
      const requestId = btn.dataset.id;
      btn.disabled = true;
      
      try {
        const res = await fetch(`/api/friends/accept/${requestId}`, { method: 'POST' });
        const data = await res.json();
        
        if (data.success) {
          loadRequests();
        } else {
          btn.disabled = false;
          alert(data.error || 'Failed to accept request');
        }
      } catch (err) {
        btn.disabled = false;
        console.error('Error accepting request:', err);
      }
    });
  });
  
  // Decline request
  document.querySelectorAll('.decline-request').forEach(btn => {
    btn.addEventListener('click', async () => {
      const requestId = btn.dataset.id;
      btn.disabled = true;
      
      try {
        const res = await fetch(`/api/friends/decline/${requestId}`, { method: 'POST' });
        const data = await res.json();
        
        if (data.success) {
          loadRequests();
        } else {
          btn.disabled = false;
          alert(data.error || 'Failed to decline request');
        }
      } catch (err) {
        btn.disabled = false;
        console.error('Error declining request:', err);
      }
    });
  });
  
  // Remove friend
  document.querySelectorAll('.remove-friend').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Remove this friend?')) return;
      
      const friendId = btn.dataset.id;
      btn.disabled = true;
      
      try {
        const res = await fetch(`/api/friends/${friendId}`, { method: 'DELETE' });
        const data = await res.json();
        
        if (data.success) {
          loadFriends();
        } else {
          btn.disabled = false;
          alert(data.error || 'Failed to remove friend');
        }
      } catch (err) {
        btn.disabled = false;
        console.error('Error removing friend:', err);
      }
    });
  });
}

// Search functionality
document.getElementById('search-btn').addEventListener('click', searchUsers);
document.getElementById('search-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchUsers();
});

async function searchUsers() {
  const query = document.getElementById('search-input').value.trim();
  if (query.length < 2) {
    alert('Search query must be at least 2 characters');
    return;
  }
  
  const searchResults = document.getElementById('search-results');
  const searchList = document.getElementById('search-list');
  
  // Hide tabs, show search results
  document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
  searchResults.classList.remove('hidden');
  searchList.innerHTML = '<p class="text-gray-400">Searching...</p>';
  
  try {
    const res = await fetch(`/api/friends/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    
    if (data.users && data.users.length > 0) {
      searchList.innerHTML = data.users.map(user => renderFriendCard(user, 'search')).join('');
      attachFriendActions();
    } else {
      searchList.innerHTML = '<p class="text-gray-400">No users found</p>';
    }
  } catch (err) {
    searchList.innerHTML = '<p class="text-red-400">Search failed</p>';
    console.error('Search error:', err);
  }
}

// Initial load
loadFriends();
