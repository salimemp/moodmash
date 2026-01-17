// User Profile Page JavaScript (viewing other users)

const userId = document.body.dataset.userId;
let profileData = null;

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

// Load user profile
async function loadUserProfile() {
  const container = document.getElementById('user-profile');
  
  try {
    const res = await fetch(`/api/users/${userId}/profile`);
    profileData = await res.json();
    
    if (profileData.error) {
      container.innerHTML = `<p class="text-red-400">${profileData.error}</p>`;
      return;
    }
    
    renderProfile();
    
    if (profileData.recent_moods && profileData.recent_moods.length > 0) {
      renderMoods();
    } else {
      document.getElementById('moods-list').innerHTML = '<p class="text-gray-400">No shared moods</p>';
    }
  } catch (err) {
    container.innerHTML = '<p class="text-red-400">Failed to load profile</p>';
    console.error('Error loading profile:', err);
  }
}

// Render profile
function renderProfile() {
  const container = document.getElementById('user-profile');
  const name = profileData.display_name || profileData.name || 'Anonymous';
  const initial = name.charAt(0).toUpperCase();
  
  let actionBtn = '';
  if (profileData.friendship_status === 'self') {
    actionBtn = `<a href="/profile" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">Edit Profile</a>`;
  } else if (profileData.friendship_status === 'accepted') {
    actionBtn = `
      <span class="text-green-400 mr-4">✓ Friends</span>
      <button id="remove-friend" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg">Remove</button>
    `;
  } else if (profileData.friendship_status === 'pending') {
    actionBtn = `<span class="text-yellow-400">Request Pending</span>`;
  } else {
    actionBtn = `<button id="add-friend" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">Add Friend</button>`;
  }
  
  container.innerHTML = `
    <div class="flex items-start gap-6">
      <div class="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold">
        ${profileData.avatar_url ? `<img src="${profileData.avatar_url}" class="w-full h-full rounded-full object-cover">` : initial}
      </div>
      <div class="flex-1">
        <h1 class="text-2xl font-bold">${name}</h1>
        ${profileData.location ? `<p class="text-gray-500">${profileData.location}</p>` : ''}
        ${profileData.bio ? `<p class="text-gray-300 mt-2">${profileData.bio}</p>` : ''}
        <p class="text-gray-500 text-sm mt-2">${profileData.friend_count} friends</p>
      </div>
      <div>
        ${actionBtn}
      </div>
    </div>
  `;
  
  // Attach actions
  if (document.getElementById('add-friend')) {
    document.getElementById('add-friend').addEventListener('click', addFriend);
  }
  if (document.getElementById('remove-friend')) {
    document.getElementById('remove-friend').addEventListener('click', removeFriend);
  }
}

// Add friend
async function addFriend() {
  const btn = document.getElementById('add-friend');
  btn.disabled = true;
  btn.textContent = 'Sending...';
  
  try {
    const res = await fetch('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friend_id: parseInt(userId) })
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
    console.error('Error adding friend:', err);
  }
}

// Remove friend
async function removeFriend() {
  if (!confirm('Remove this friend?')) return;
  
  const btn = document.getElementById('remove-friend');
  btn.disabled = true;
  
  try {
    const res = await fetch(`/api/friends/${userId}`, { method: 'DELETE' });
    const data = await res.json();
    
    if (data.success) {
      location.reload();
    } else {
      btn.disabled = false;
      alert(data.error || 'Failed to remove friend');
    }
  } catch (err) {
    btn.disabled = false;
    console.error('Error removing friend:', err);
  }
}

// Render moods
function renderMoods() {
  const container = document.getElementById('moods-list');
  
  container.innerHTML = profileData.recent_moods.map(mood => {
    const color = emotionColors[mood.emotion] || '#9ca3af';
    const date = new Date(mood.created_at).toLocaleDateString();
    
    return `
      <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
        <div class="flex items-center gap-3">
          <span class="w-3 h-3 rounded-full" style="background-color: ${color}"></span>
          <span style="color: ${color}">${mood.emotion}</span>
          <span class="text-gray-500">(${mood.intensity}/10)</span>
        </div>
        <div class="text-gray-500 text-sm">${date}</div>
      </div>
    `;
  }).join('');
}

// Initial load
loadUserProfile();
