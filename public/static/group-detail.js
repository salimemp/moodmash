// Group Detail Page JavaScript

const groupId = document.body.dataset.groupId;
let groupData = null;
let isMember = false;

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

// Load group data
async function loadGroup() {
  try {
    const res = await fetch(`/api/groups/${groupId}`);
    groupData = await res.json();
    
    if (groupData.error) {
      document.getElementById('group-header').innerHTML = `<p class="text-red-400">${groupData.error}</p>`;
      return;
    }
    
    isMember = groupData.is_member;
    renderGroupHeader();
    
    if (isMember || groupData.privacy === 'public') {
      loadPosts();
      loadMembers();
      loadMoodTrends();
    }
  } catch (err) {
    document.getElementById('group-header').innerHTML = '<p class="text-red-400">Failed to load group</p>';
    console.error('Error loading group:', err);
  }
}

// Render group header
function renderGroupHeader() {
  const header = document.getElementById('group-header');
  const privacyBadge = groupData.privacy === 'private'
    ? '<span class="text-xs bg-gray-600 px-2 py-1 rounded">Private</span>'
    : '<span class="text-xs bg-green-600 px-2 py-1 rounded">Public</span>';
  
  let actionBtn = '';
  if (!isMember && groupData.privacy === 'public') {
    actionBtn = `<button id="join-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">Join Group</button>`;
  } else if (isMember && groupData.user_role !== 'admin') {
    actionBtn = `<button id="leave-btn" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg">Leave Group</button>`;
  } else if (groupData.user_role === 'admin') {
    actionBtn = `
      <span class="text-blue-400 mr-4">Admin</span>
      <button id="settings-btn" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">Settings</button>
    `;
  }
  
  header.innerHTML = `
    <div class="flex justify-between items-start">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <h1 class="text-2xl font-bold">${groupData.name}</h1>
          ${privacyBadge}
        </div>
        ${groupData.description ? `<p class="text-gray-400">${groupData.description}</p>` : ''}
        <p class="text-gray-500 text-sm mt-2">${groupData.member_count} members</p>
      </div>
      <div>
        ${actionBtn}
      </div>
    </div>
  `;
  
  // Attach actions
  if (document.getElementById('join-btn')) {
    document.getElementById('join-btn').addEventListener('click', joinGroup);
  }
  if (document.getElementById('leave-btn')) {
    document.getElementById('leave-btn').addEventListener('click', leaveGroup);
  }
  
  // Hide post form if not member
  if (!isMember) {
    document.getElementById('post-form').parentElement.style.display = 'none';
  }
}

// Join group
async function joinGroup() {
  const btn = document.getElementById('join-btn');
  btn.disabled = true;
  btn.textContent = 'Joining...';
  
  try {
    const res = await fetch(`/api/groups/${groupId}/join`, { method: 'POST' });
    const data = await res.json();
    
    if (data.success) {
      location.reload();
    } else {
      btn.disabled = false;
      btn.textContent = 'Join Group';
      alert(data.error || 'Failed to join');
    }
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Join Group';
    console.error('Error joining group:', err);
  }
}

// Leave group
async function leaveGroup() {
  if (!confirm('Are you sure you want to leave this group?')) return;
  
  const btn = document.getElementById('leave-btn');
  btn.disabled = true;
  
  try {
    const res = await fetch(`/api/groups/${groupId}/leave`, { method: 'POST' });
    const data = await res.json();
    
    if (data.success) {
      window.location.href = '/groups';
    } else {
      btn.disabled = false;
      alert(data.error || 'Failed to leave');
    }
  } catch (err) {
    btn.disabled = false;
    console.error('Error leaving group:', err);
  }
}

// Load posts
async function loadPosts() {
  const container = document.getElementById('group-posts');
  
  try {
    const res = await fetch(`/api/groups/${groupId}/posts`);
    const data = await res.json();
    
    if (data.posts && data.posts.length > 0) {
      container.innerHTML = data.posts.map(post => renderPost(post)).join('');
      attachPostActions();
    } else {
      container.innerHTML = '<p class="text-gray-400">No posts yet. Be the first to share!</p>';
    }
  } catch (err) {
    container.innerHTML = '<p class="text-red-400">Failed to load posts</p>';
    console.error('Error loading posts:', err);
  }
}

// Render post
function renderPost(post) {
  const name = post.author_display_name || post.author_name || 'Anonymous';
  const initial = name.charAt(0).toUpperCase();
  const timeAgo = getTimeAgo(new Date(post.created_at));
  
  let moodBadge = '';
  if (post.emotion) {
    const color = emotionColors[post.emotion] || '#9ca3af';
    moodBadge = `
      <span class="inline-flex items-center gap-1 px-2 py-1 rounded text-sm" style="background-color: ${color}20; color: ${color}">
        ${post.emotion} (${post.intensity}/10)
      </span>
    `;
  }
  
  return `
    <div class="p-4 bg-gray-700 rounded-xl">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
          ${post.author_avatar ? `<img src="${post.author_avatar}" class="w-full h-full rounded-full object-cover">` : initial}
        </div>
        <div>
          <a href="/users/${post.user_id}" class="font-semibold hover:text-blue-400">${name}</a>
          <p class="text-gray-500 text-xs">${timeAgo}</p>
        </div>
      </div>
      <p class="mb-3">${post.content}</p>
      ${moodBadge}
      <div class="flex gap-4 mt-3 pt-3 border-t border-gray-600">
        <button class="react-btn flex items-center gap-1 text-gray-400 hover:text-blue-400" data-type="group_post" data-id="${post.id}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
          <span>${post.reaction_count || 0}</span>
        </button>
        <button class="comment-btn flex items-center gap-1 text-gray-400 hover:text-blue-400" data-type="group_post" data-id="${post.id}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <span>${post.comment_count || 0}</span>
        </button>
      </div>
    </div>
  `;
}

// Attach post actions
function attachPostActions() {
  document.querySelectorAll('.react-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetType = btn.dataset.type;
      const targetId = btn.dataset.id;
      
      try {
        const res = await fetch('/api/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target_type: targetType, target_id: parseInt(targetId), type: 'like' })
        });
        const data = await res.json();
        
        if (data.success) {
          loadPosts();
        }
      } catch (err) {
        console.error('Error reacting:', err);
      }
    });
  });
}

// Load members
async function loadMembers() {
  const container = document.getElementById('group-members');
  
  try {
    const res = await fetch(`/api/groups/${groupId}/members?limit=5`);
    const data = await res.json();
    
    if (data.members && data.members.length > 0) {
      container.innerHTML = data.members.map(member => {
        const name = member.display_name || member.name || member.email.split('@')[0];
        const initial = name.charAt(0).toUpperCase();
        const roleColor = member.role === 'admin' ? 'text-blue-400' : (member.role === 'moderator' ? 'text-green-400' : 'text-gray-500');
        
        return `
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
              ${member.avatar_url ? `<img src="${member.avatar_url}" class="w-full h-full rounded-full object-cover">` : initial}
            </div>
            <div class="flex-1">
              <a href="/users/${member.user_id}" class="text-sm hover:text-blue-400">${name}</a>
            </div>
            <span class="text-xs ${roleColor}">${member.role}</span>
          </div>
        `;
      }).join('');
      
      if (data.total > 5) {
        container.innerHTML += `<p class="text-center text-gray-500 text-sm mt-2">+${data.total - 5} more</p>`;
      }
    } else {
      container.innerHTML = '<p class="text-gray-400 text-sm">No members</p>';
    }
  } catch (err) {
    container.innerHTML = '<p class="text-red-400 text-sm">Failed to load</p>';
    console.error('Error loading members:', err);
  }
}

// Load mood trends
async function loadMoodTrends() {
  const container = document.getElementById('group-mood-trends');
  
  try {
    const res = await fetch(`/api/groups/${groupId}/trends?days=7`);
    const data = await res.json();
    
    if (data.trends && data.trends.length > 0) {
      // Group by emotion
      const emotionCounts = {};
      data.trends.forEach(t => {
        emotionCounts[t.emotion] = (emotionCounts[t.emotion] || 0) + t.count;
      });
      
      const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
      
      container.innerHTML = sorted.slice(0, 5).map(([emotion, count]) => {
        const color = emotionColors[emotion] || '#9ca3af';
        return `
          <div class="flex items-center gap-2 mb-2">
            <span class="w-3 h-3 rounded-full" style="background-color: ${color}"></span>
            <span class="flex-1 text-sm">${emotion}</span>
            <span class="text-gray-500 text-sm">${count}</span>
          </div>
        `;
      }).join('');
    } else {
      container.innerHTML = '<p class="text-gray-400 text-sm">No mood data yet</p>';
    }
  } catch (err) {
    container.innerHTML = '<p class="text-red-400 text-sm">Failed to load</p>';
    console.error('Error loading trends:', err);
  }
}

// Post form
if (document.getElementById('post-form')) {
  document.getElementById('post-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const content = document.getElementById('post-content').value.trim();
    if (!content) return;
    
    const includeMood = document.getElementById('include-mood').checked;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';
    
    try {
      // TODO: If includeMood, get latest mood entry
      const res = await fetch(`/api/groups/${groupId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      
      if (data.success) {
        document.getElementById('post-content').value = '';
        document.getElementById('include-mood').checked = false;
        loadPosts();
      } else {
        alert(data.error || 'Failed to post');
      }
    } catch (err) {
      console.error('Error posting:', err);
    }
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Post';
  });
}

// Helper: time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

// Initial load
loadGroup();
