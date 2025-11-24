/**
 * MoodMash Mood-Synchronized Groups Dashboard
 * Version: 10.0 (Phase 3)
 * Features: Group management, mood synchronization, group events, member interactions
 */

// ===== GLOBAL STATE =====
let myGroups = [];
let availableGroups = [];
let currentGroup = null;
let groupMembers = [];
let groupEvents = [];
let moodSync = null;

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
async function loadMyGroups() {
  try {
    const data = await apiCall('/api/groups?user_id=1');
    myGroups = data.groups || [];
    renderMyGroups();
  } catch (error) {
    console.error('Failed to load groups:', error);
  }
}

async function loadGroupDetails(groupId) {
  try {
    const data = await apiCall(`/api/groups/${groupId}`);
    currentGroup = data.group;
    groupMembers = data.members || [];
    groupEvents = data.events || [];
    moodSync = data.moodSync || null;
    renderGroupDetails();
  } catch (error) {
    console.error('Failed to load group details:', error);
  }
}

async function loadMoodSync(groupId) {
  try {
    const data = await apiCall(`/api/groups/${groupId}/sync`);
    moodSync = data;
    renderMoodSync();
  } catch (error) {
    console.error('Failed to load mood sync:', error);
  }
}

// ===== GROUP MANAGEMENT =====
async function createNewGroup() {
  const name = document.getElementById('new-group-name').value;
  const description = document.getElementById('new-group-description').value;
  const isPrivate = document.getElementById('new-group-private').checked;

  if (!name) {
    alert('Please enter a group name');
    return;
  }

  try {
    await apiCall('/api/groups', {
      method: 'POST',
      body: JSON.stringify({
        creator_id: 1,
        name,
        description,
        is_private: isPrivate,
      }),
    });

    // Reset form
    document.getElementById('new-group-name').value = '';
    document.getElementById('new-group-description').value = '';
    document.getElementById('new-group-private').checked = false;

    // Close modal and reload groups
    document.getElementById('create-group-modal').classList.add('hidden');
    await loadMyGroups();

    alert('Group created successfully! 🎉');
  } catch (error) {
    alert('Failed to create group. Please try again.');
  }
}

async function joinGroup(groupId) {
  try {
    await apiCall(`/api/groups/${groupId}/join`, {
      method: 'POST',
      body: JSON.stringify({ user_id: 1 }),
    });

    await loadMyGroups();
    alert('Joined group successfully! 🎉');
  } catch (error) {
    alert('Failed to join group. Please try again.');
  }
}

async function leaveGroup(groupId) {
  if (!confirm('Are you sure you want to leave this group?')) {
    return;
  }

  try {
    await apiCall(`/api/groups/${groupId}/leave`, {
      method: 'POST',
      body: JSON.stringify({ user_id: 1 }),
    });

    await loadMyGroups();
    alert('Left group successfully');
  } catch (error) {
    alert('Failed to leave group. Please try again.');
  }
}

// ===== GROUP EVENTS =====
async function createGroupEvent() {
  if (!currentGroup) return;

  const title = document.getElementById('event-title').value;
  const description = document.getElementById('event-description').value;
  const scheduledFor = document.getElementById('event-scheduled-for').value;
  const eventType = document.getElementById('event-type').value;

  if (!title || !scheduledFor) {
    alert('Please fill in all required fields');
    return;
  }

  try {
    await apiCall('/api/groups/events', {
      method: 'POST',
      body: JSON.stringify({
        group_id: currentGroup.id,
        created_by: 1,
        title,
        description,
        event_type: eventType,
        scheduled_for: scheduledFor,
      }),
    });

    // Reset form
    document.getElementById('event-title').value = '';
    document.getElementById('event-description').value = '';
    document.getElementById('event-scheduled-for').value = '';

    // Close modal and reload events
    document.getElementById('create-event-modal').classList.add('hidden');
    await loadGroupDetails(currentGroup.id);

    alert('Event created successfully! 🎉');
  } catch (error) {
    alert('Failed to create event. Please try again.');
  }
}

// ===== RENDER FUNCTIONS =====
function renderMyGroups() {
  const container = document.getElementById('my-groups-container');

  if (!myGroups.length) {
    container.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-users text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-600 text-lg mb-4">You haven't joined any groups yet</p>
        <button
          onclick="showCreateGroupModal()"
          class="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          <i class="fas fa-plus mr-2"></i>
          Create Your First Group
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = myGroups
    .map(
      (group) => `
    <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" onclick="loadGroupDetails(${group.id})">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-xl font-bold text-gray-800">${group.name}</h3>
        <span class="px-3 py-1 rounded-full text-xs font-medium ${group.is_private ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
          <i class="fas fa-${group.is_private ? 'lock' : 'globe'}"></i>
          ${group.is_private ? 'Private' : 'Public'}
        </span>
      </div>
      
      <p class="text-gray-600 mb-4 line-clamp-2">${group.description || 'No description'}</p>
      
      <div class="flex items-center justify-between text-sm text-gray-500">
        <div class="flex items-center space-x-4">
          <span><i class="fas fa-users mr-1"></i> ${group.member_count || 0} members</span>
          <span><i class="fas fa-calendar mr-1"></i> ${group.event_count || 0} events</span>
        </div>
        <button
          onclick="event.stopPropagation(); leaveGroup(${group.id})"
          class="text-red-600 hover:text-red-700"
        >
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </div>
  `
    )
    .join('');
}

function renderGroupDetails() {
  if (!currentGroup) return;

  const container = document.getElementById('group-details-container');

  container.innerHTML = `
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <!-- Group Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-3xl font-bold text-gray-800 mb-2">${currentGroup.name}</h2>
          <p class="text-gray-600">${currentGroup.description || 'No description'}</p>
        </div>
        <div class="flex items-center space-x-3">
          <span class="px-4 py-2 rounded-full text-sm font-medium ${currentGroup.is_private ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
            <i class="fas fa-${currentGroup.is_private ? 'lock' : 'globe'}"></i>
            ${currentGroup.is_private ? 'Private' : 'Public'}
          </span>
          <button
            onclick="showCreateEventModal()"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <i class="fas fa-plus mr-2"></i>
            Create Event
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Members</p>
              <p class="text-2xl font-bold text-gray-800">${groupMembers.length}</p>
            </div>
            <i class="fas fa-users text-3xl text-blue-600"></i>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Events</p>
              <p class="text-2xl font-bold text-gray-800">${groupEvents.length}</p>
            </div>
            <i class="fas fa-calendar text-3xl text-purple-600"></i>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Mood Sync</p>
              <p class="text-2xl font-bold text-gray-800">${moodSync ? moodSync.average_intensity?.toFixed(1) : 'N/A'}</p>
            </div>
            <i class="fas fa-heartbeat text-3xl text-green-600"></i>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="-mb-px flex space-x-8">
          <button
            onclick="switchTab('members')"
            id="tab-members"
            class="tab-button border-b-2 border-purple-600 text-purple-600 py-4 px-1 font-medium"
          >
            Members
          </button>
          <button
            onclick="switchTab('events')"
            id="tab-events"
            class="tab-button border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 font-medium"
          >
            Events
          </button>
          <button
            onclick="switchTab('mood-sync')"
            id="tab-mood-sync"
            class="tab-button border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 font-medium"
          >
            Mood Sync
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div id="tab-content">
        ${renderMembersTab()}
      </div>
    </div>
  `;

  // Load mood sync data
  loadMoodSync(currentGroup.id);
}

function renderMembersTab() {
  if (!groupMembers.length) {
    return `
      <div class="text-center py-12">
        <p class="text-gray-600">No members yet</p>
      </div>
    `;
  }

  return `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${groupMembers
        .map(
          (member) => `
        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div class="flex items-center">
            <div class="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold mr-3">
              ${member.name ? member.name.charAt(0).toUpperCase() : 'M'}
            </div>
            <div>
              <h4 class="font-semibold text-gray-800">${member.name || 'Member'}</h4>
              <p class="text-sm text-gray-500">
                ${member.role === 'admin' ? '👑 Admin' : member.role === 'moderator' ? '⭐ Moderator' : '👤 Member'}
              </p>
            </div>
          </div>
          <div class="text-sm text-gray-500">
            Joined ${formatDate(member.joined_at)}
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

function renderEventsTab() {
  if (!groupEvents.length) {
    return `
      <div class="text-center py-12">
        <i class="fas fa-calendar text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-600 mb-4">No events scheduled</p>
        <button
          onclick="showCreateEventModal()"
          class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <i class="fas fa-plus mr-2"></i>
          Create First Event
        </button>
      </div>
    `;
  }

  return `
    <div class="space-y-4">
      ${groupEvents
        .map(
          (event) => `
        <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-xl font-bold text-gray-800 mb-2">${event.title}</h3>
              <p class="text-gray-600">${event.description || 'No description'}</p>
            </div>
            <span class="px-3 py-1 rounded-full text-sm font-medium ${getEventTypeColor(event.event_type)}">
              ${getEventTypeIcon(event.event_type)} ${event.event_type}
            </span>
          </div>
          
          <div class="flex items-center justify-between text-sm text-gray-500">
            <div class="flex items-center space-x-4">
              <span><i class="fas fa-clock mr-1"></i> ${formatDateTime(event.scheduled_for)}</span>
              <span><i class="fas fa-users mr-1"></i> ${event.participant_count || 0} participants</span>
            </div>
            <button class="text-purple-600 hover:text-purple-700 font-medium">
              Join Event <i class="fas fa-arrow-right ml-1"></i>
            </button>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

function renderMoodSyncTab() {
  if (!moodSync) {
    return `
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading mood synchronization...</p>
      </div>
    `;
  }

  return `
    <div class="space-y-6">
      <!-- Group Mood Overview -->
      <div class="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-heartbeat text-purple-600 mr-2"></i>
          Group Mood Pulse
        </h3>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-lg p-4">
            <p class="text-sm text-gray-600 mb-1">Dominant Mood</p>
            <p class="text-2xl font-bold text-gray-800">${getMoodEmoji(moodSync.dominant_mood)} ${moodSync.dominant_mood || 'N/A'}</p>
          </div>
          
          <div class="bg-white rounded-lg p-4">
            <p class="text-sm text-gray-600 mb-1">Avg Intensity</p>
            <p class="text-2xl font-bold text-gray-800">${moodSync.average_intensity?.toFixed(1) || 'N/A'}/5</p>
          </div>
          
          <div class="bg-white rounded-lg p-4">
            <p class="text-sm text-gray-600 mb-1">Active Members</p>
            <p class="text-2xl font-bold text-gray-800">${moodSync.active_members || 0}</p>
          </div>
          
          <div class="bg-white rounded-lg p-4">
            <p class="text-sm text-gray-600 mb-1">Sync Score</p>
            <p class="text-2xl font-bold text-gray-800">${moodSync.sync_score || 0}%</p>
          </div>
        </div>
      </div>

      <!-- Mood Distribution -->
      <div class="bg-white rounded-lg p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Mood Distribution</h3>
        <div class="space-y-3">
          ${Object.entries(moodSync.mood_distribution || {})
            .map(
              ([mood, count]) => `
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-gray-700">${getMoodEmoji(mood)} ${mood}</span>
                <span class="text-sm text-gray-600">${count} members</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-purple-600 h-2 rounded-full" style="width: ${(count / moodSync.active_members) * 100}%"></div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Recommendations -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-3">
          <i class="fas fa-lightbulb text-yellow-600 mr-2"></i>
          Group Recommendations
        </h3>
        <ul class="space-y-2">
          ${(moodSync.recommendations || [])
            .map(
              (rec) => `
            <li class="flex items-start">
              <i class="fas fa-check-circle text-green-600 mr-2 mt-1"></i>
              <span class="text-gray-700">${rec}</span>
            </li>
          `
            )
            .join('')}
        </ul>
      </div>
    </div>
  `;
}

function renderMoodSync() {
  const tabContent = document.getElementById('tab-content');
  if (tabContent) {
    tabContent.innerHTML = renderMoodSyncTab();
  }
}

// ===== TAB SWITCHING =====
function switchTab(tab) {
  // Update tab buttons
  document.querySelectorAll('.tab-button').forEach((btn) => {
    btn.classList.remove('border-purple-600', 'text-purple-600');
    btn.classList.add('border-transparent', 'text-gray-500');
  });
  document.getElementById(`tab-${tab}`).classList.remove('border-transparent', 'text-gray-500');
  document.getElementById(`tab-${tab}`).classList.add('border-purple-600', 'text-purple-600');

  // Update content
  const tabContent = document.getElementById('tab-content');
  if (tab === 'members') {
    tabContent.innerHTML = renderMembersTab();
  } else if (tab === 'events') {
    tabContent.innerHTML = renderEventsTab();
  } else if (tab === 'mood-sync') {
    tabContent.innerHTML = renderMoodSyncTab();
  }
}

// ===== MODAL FUNCTIONS =====
function showCreateGroupModal() {
  document.getElementById('create-group-modal').classList.remove('hidden');
}

function hideCreateGroupModal() {
  document.getElementById('create-group-modal').classList.add('hidden');
}

function showCreateEventModal() {
  document.getElementById('create-event-modal').classList.remove('hidden');
}

function hideCreateEventModal() {
  document.getElementById('create-event-modal').classList.add('hidden');
}

// ===== UTILITY FUNCTIONS =====
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

function getEventTypeIcon(type) {
  const icons = {
    meditation: '🧘',
    'group-activity': '🎯',
    'mood-check': '💭',
    support: '🤝',
    celebration: '🎉',
  };
  return icons[type] || '📅';
}

function getEventTypeColor(type) {
  const colors = {
    meditation: 'bg-green-100 text-green-800',
    'group-activity': 'bg-blue-100 text-blue-800',
    'mood-check': 'bg-purple-100 text-purple-800',
    support: 'bg-pink-100 text-pink-800',
    celebration: 'bg-yellow-100 text-yellow-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString();
}

function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

// ===== MAIN DASHBOARD RENDER =====
function renderDashboard() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-4xl font-bold text-gray-800 mb-2">
            <i class="fas fa-user-friends text-purple-600 mr-2"></i>
            Mood-Synchronized Groups
          </h1>
          <p class="text-gray-600">Connect with others and share synchronized emotional experiences</p>
        </div>
        <button
          onclick="showCreateGroupModal()"
          class="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          <i class="fas fa-plus mr-2"></i>
          Create Group
        </button>
      </div>

      <!-- My Groups -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">My Groups</h2>
        <div id="my-groups-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="text-center py-12 col-span-full">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p class="text-gray-600">Loading groups...</p>
          </div>
        </div>
      </div>

      <!-- Group Details -->
      <div id="group-details-container"></div>
    </div>

    <!-- Create Group Modal -->
    <div id="create-group-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-800">Create New Group</h2>
          <button onclick="hideCreateGroupModal()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Group Name *</label>
            <input
              type="text"
              id="new-group-name"
              placeholder="e.g., Mindfulness Warriors"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              id="new-group-description"
              rows="3"
              placeholder="Describe the group's purpose..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            ></textarea>
          </div>

          <div class="flex items-center">
            <input
              type="checkbox"
              id="new-group-private"
              class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label for="new-group-private" class="ml-2 text-sm text-gray-700">
              <i class="fas fa-lock mr-1"></i>
              Make this group private (invite-only)
            </label>
          </div>

          <button
            onclick="createNewGroup()"
            class="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <i class="fas fa-plus mr-2"></i>
            Create Group
          </button>
        </div>
      </div>
    </div>

    <!-- Create Event Modal -->
    <div id="create-event-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-800">Create Group Event</h2>
          <button onclick="hideCreateEventModal()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Event Title *</label>
            <input
              type="text"
              id="event-title"
              placeholder="e.g., Morning Meditation"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              id="event-description"
              rows="2"
              placeholder="Event details..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
            <select id="event-type" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              <option value="meditation">🧘 Meditation</option>
              <option value="group-activity">🎯 Group Activity</option>
              <option value="mood-check">💭 Mood Check-in</option>
              <option value="support">🤝 Support Session</option>
              <option value="celebration">🎉 Celebration</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Scheduled For *</label>
            <input
              type="datetime-local"
              id="event-scheduled-for"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            onclick="createGroupEvent()"
            class="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <i class="fas fa-calendar-plus mr-2"></i>
            Create Event
          </button>
        </div>
      </div>
    </div>
  `;

  // Load initial data
  loadMyGroups();
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  renderDashboard();
});
