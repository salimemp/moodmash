// Profile Page JavaScript

let profileData = null;

// Load profile data
async function loadProfile() {
  try {
    const res = await fetch('/api/auth/me');
    const user = await res.json();
    
    // Load extended profile
    const profileRes = await fetch(`/api/users/${user.id}/profile`);
    profileData = await profileRes.json();
    
    populateProfileForm();
    populatePrivacyForm();
    loadSharedMoods();
  } catch (err) {
    console.error('Error loading profile:', err);
  }
}

// Populate profile form
function populateProfileForm() {
  if (!profileData) return;
  
  document.getElementById('display-name').value = profileData.display_name || '';
  document.getElementById('bio-input').value = profileData.bio || '';
  document.getElementById('location').value = profileData.location || '';
  
  // Update header bio
  const bioEl = document.getElementById('bio');
  if (profileData.bio) {
    bioEl.textContent = profileData.bio;
  }
}

// Populate privacy form
function populatePrivacyForm() {
  if (!profileData) return;
  
  document.getElementById('profile-visibility').value = profileData.profile_visibility || 'public';
  document.getElementById('mood-visibility').value = profileData.mood_visibility || 'friends';
}

// Profile form submit
document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const displayName = document.getElementById('display-name').value.trim();
  const bio = document.getElementById('bio-input').value.trim();
  const location = document.getElementById('location').value.trim();
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';
  
  try {
    const res = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: displayName, bio, location })
    });
    const data = await res.json();
    
    if (data.success) {
      submitBtn.textContent = 'Saved!';
      setTimeout(() => {
        submitBtn.textContent = 'Save Profile';
        submitBtn.disabled = false;
      }, 2000);
      
      // Update header
      document.getElementById('bio').textContent = bio;
    } else {
      submitBtn.textContent = 'Save Profile';
      submitBtn.disabled = false;
      alert(data.error || 'Failed to save');
    }
  } catch (err) {
    submitBtn.textContent = 'Save Profile';
    submitBtn.disabled = false;
    console.error('Error saving profile:', err);
  }
});

// Privacy form submit
document.getElementById('privacy-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const profileVisibility = document.getElementById('profile-visibility').value;
  const moodVisibility = document.getElementById('mood-visibility').value;
  const allowRequests = document.getElementById('allow-requests').checked;
  const showHistory = document.getElementById('show-history').checked;
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';
  
  try {
    const res = await fetch('/api/users/privacy', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile_visibility: profileVisibility,
        mood_visibility: moodVisibility,
        allow_friend_requests: allowRequests,
        show_mood_history: showHistory
      })
    });
    const data = await res.json();
    
    if (data.success) {
      submitBtn.textContent = 'Saved!';
      setTimeout(() => {
        submitBtn.textContent = 'Save Privacy Settings';
        submitBtn.disabled = false;
      }, 2000);
    } else {
      submitBtn.textContent = 'Save Privacy Settings';
      submitBtn.disabled = false;
      alert(data.error || 'Failed to save');
    }
  } catch (err) {
    submitBtn.textContent = 'Save Privacy Settings';
    submitBtn.disabled = false;
    console.error('Error saving privacy:', err);
  }
});

// Load shared moods
async function loadSharedMoods() {
  const container = document.getElementById('shared-moods');
  
  if (!profileData || !profileData.recent_moods || profileData.recent_moods.length === 0) {
    container.innerHTML = `
      <p class="text-gray-400">You haven't shared any moods yet.</p>
      <p class="text-gray-500 text-sm mt-2">Share moods from your dashboard to see them here!</p>
    `;
    return;
  }
  
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
loadProfile();
