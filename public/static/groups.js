// Groups Page JavaScript

let currentTab = 'joined';
let isLoading = false;

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    switchTab(tab);
  });
});

function switchTab(tab) {
  currentTab = tab;
  
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.dataset.tab === tab) {
      btn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
      btn.classList.add('bg-blue-600');
    } else {
      btn.classList.remove('bg-blue-600');
      btn.classList.add('bg-gray-700', 'hover:bg-gray-600');
    }
  });
  
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });
  document.getElementById(`${tab}-tab`).classList.remove('hidden');
  
  if (tab === 'joined') loadJoinedGroups();
  else if (tab === 'discover') loadDiscoverGroups();
}

// Load joined groups
async function loadJoinedGroups() {
  if (isLoading) return;
  isLoading = true;
  
  const container = document.getElementById('joined-groups');
  container.innerHTML = '<p class="text-gray-400">Loading groups...</p>';
  
  try {
    const res = await fetch('/api/groups?filter=joined');
    const data = await res.json();
    
    if (data.groups && data.groups.length > 0) {
      container.innerHTML = data.groups.map(group => renderGroupCard(group)).join('');
    } else {
      container.innerHTML = `
        <div class="col-span-2 text-center py-8">
          <p class="text-gray-400 mb-4">You haven't joined any groups yet</p>
          <button onclick="switchTab('discover')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">Discover Groups</button>
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = '<p class="text-red-400">Failed to load groups</p>';
    console.error('Error loading groups:', err);
  }
  
  isLoading = false;
}

// Load discover groups
async function loadDiscoverGroups() {
  if (isLoading) return;
  isLoading = true;
  
  const container = document.getElementById('discover-groups');
  container.innerHTML = '<p class="text-gray-400">Loading groups...</p>';
  
  try {
    const res = await fetch('/api/groups?filter=all');
    const data = await res.json();
    
    if (data.groups && data.groups.length > 0) {
      container.innerHTML = data.groups.map(group => renderGroupCard(group, true)).join('');
      attachGroupActions();
    } else {
      container.innerHTML = `
        <div class="col-span-2 text-center py-8">
          <p class="text-gray-400 mb-4">No groups available</p>
          <p class="text-gray-500 text-sm">Be the first to create a group!</p>
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = '<p class="text-red-400">Failed to load groups</p>';
    console.error('Error loading groups:', err);
  }
  
  isLoading = false;
}

// Render group card
function renderGroupCard(group, showJoinBtn = false) {
  const privacyBadge = group.privacy === 'private' 
    ? '<span class="text-xs bg-gray-600 px-2 py-1 rounded">Private</span>'
    : '<span class="text-xs bg-green-600 px-2 py-1 rounded">Public</span>';
  
  const memberLabel = group.member_count === 1 ? 'member' : 'members';
  
  let actionBtn = '';
  if (showJoinBtn && !group.user_role) {
    actionBtn = `<button class="join-group px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm" data-id="${group.id}">Join</button>`;
  } else if (group.user_role) {
    actionBtn = `<span class="text-green-400 text-sm">✓ ${group.user_role}</span>`;
  }
  
  return `
    <a href="/groups/${group.id}" class="block p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors">
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-semibold">${group.name}</h3>
        ${privacyBadge}
      </div>
      ${group.description ? `<p class="text-gray-400 text-sm mb-3">${group.description.substring(0, 100)}${group.description.length > 100 ? '...' : ''}</p>` : ''}
      <div class="flex justify-between items-center">
        <span class="text-gray-500 text-sm">${group.member_count} ${memberLabel}</span>
        ${actionBtn}
      </div>
    </a>
  `;
}

// Attach group actions
function attachGroupActions() {
  document.querySelectorAll('.join-group').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const groupId = btn.dataset.id;
      btn.disabled = true;
      btn.textContent = 'Joining...';
      
      try {
        const res = await fetch(`/api/groups/${groupId}/join`, { method: 'POST' });
        const data = await res.json();
        
        if (data.success) {
          btn.textContent = '✓ Joined';
          btn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
          btn.classList.add('bg-green-600');
        } else {
          btn.textContent = 'Join';
          btn.disabled = false;
          alert(data.error || 'Failed to join group');
        }
      } catch (err) {
        btn.textContent = 'Join';
        btn.disabled = false;
        console.error('Error joining group:', err);
      }
    });
  });
}

// Create group modal
const modal = document.getElementById('create-modal');
const createBtn = document.getElementById('create-group-btn');
const cancelBtn = document.getElementById('cancel-create');
const createForm = document.getElementById('create-group-form');

createBtn.addEventListener('click', () => {
  modal.classList.remove('hidden');
  modal.classList.add('flex');
});

cancelBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
  modal.classList.remove('flex');
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
});

createForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('group-name').value.trim();
  const description = document.getElementById('group-description').value.trim();
  const privacy = document.getElementById('group-privacy').value;
  
  const submitBtn = createForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating...';
  
  try {
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, privacy })
    });
    const data = await res.json();
    
    if (data.success) {
      window.location.href = `/groups/${data.group.id}`;
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create';
      alert(data.error || 'Failed to create group');
    }
  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create';
    console.error('Error creating group:', err);
  }
});

// Initial load
loadJoinedGroups();
