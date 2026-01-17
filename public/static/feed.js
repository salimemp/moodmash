// Activity Feed Page JavaScript

let currentFilter = 'all';
let currentPage = 1;
let isLoading = false;
let hasMore = true;

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

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;
    setFilter(filter);
  });
});

function setFilter(filter) {
  currentFilter = filter;
  currentPage = 1;
  hasMore = true;
  
  document.querySelectorAll('.filter-btn').forEach(btn => {
    if (btn.dataset.filter === filter) {
      btn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
      btn.classList.add('bg-blue-600');
    } else {
      btn.classList.remove('bg-blue-600');
      btn.classList.add('bg-gray-700', 'hover:bg-gray-600');
    }
  });
  
  loadFeed(true);
}

// Load feed
async function loadFeed(reset = false) {
  if (isLoading) return;
  isLoading = true;
  
  const container = document.getElementById('feed-items');
  const loadMoreBtn = document.getElementById('load-more');
  
  if (reset) {
    container.innerHTML = '<p class="text-gray-400">Loading feed...</p>';
  }
  
  try {
    const res = await fetch(`/api/feed?filter=${currentFilter}&page=${currentPage}`);
    const data = await res.json();
    
    if (data.feed && data.feed.length > 0) {
      const html = data.feed.map(item => renderFeedItem(item)).join('');
      
      if (reset) {
        container.innerHTML = html;
      } else {
        container.insertAdjacentHTML('beforeend', html);
      }
      
      attachFeedActions();
      hasMore = data.hasMore;
      loadMoreBtn.classList.toggle('hidden', !hasMore);
    } else if (reset) {
      container.innerHTML = `
        <div class="text-center py-8">
          <p class="text-gray-400 mb-4">No activity yet</p>
          <p class="text-gray-500 text-sm">Connect with friends and join groups to see activity!</p>
        </div>
      `;
      loadMoreBtn.classList.add('hidden');
    }
  } catch (err) {
    if (reset) {
      container.innerHTML = '<p class="text-red-400">Failed to load feed</p>';
    }
    console.error('Error loading feed:', err);
  }
  
  isLoading = false;
}

// Load more button
document.getElementById('load-more').addEventListener('click', () => {
  if (hasMore && !isLoading) {
    currentPage++;
    loadFeed(false);
  }
});

// Render feed item
function renderFeedItem(item) {
  const name = item.author_display_name || item.author_name || 'Anonymous';
  const initial = name.charAt(0).toUpperCase();
  const timeAgo = getTimeAgo(new Date(item.created_at));
  
  let moodBadge = '';
  if (item.emotion) {
    const color = emotionColors[item.emotion] || '#9ca3af';
    moodBadge = `
      <div class="flex items-center gap-2 mt-2">
        <span class="w-3 h-3 rounded-full" style="background-color: ${color}"></span>
        <span style="color: ${color}">${item.emotion}</span>
        <span class="text-gray-500">(${item.intensity}/10)</span>
      </div>
    `;
  }
  
  let groupInfo = '';
  if (item.group_name) {
    groupInfo = `<span class="text-gray-500"> in <a href="/groups/${item.group_id}" class="text-blue-400 hover:underline">${item.group_name}</a></span>`;
  }
  
  const typeLabel = item.type === 'group_post' ? 'shared in group' : 'shared mood';
  
  return `
    <div class="p-4 bg-gray-800 rounded-xl">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
          ${item.author_avatar ? `<img src="${item.author_avatar}" class="w-full h-full rounded-full object-cover">` : initial}
        </div>
        <div class="flex-1">
          <p>
            <a href="/users/${item.user_id}" class="font-semibold hover:text-blue-400">${name}</a>
            <span class="text-gray-500"> ${typeLabel}</span>
            ${groupInfo}
          </p>
          <p class="text-gray-500 text-xs">${timeAgo}</p>
        </div>
      </div>
      ${item.content ? `<p class="mb-2">${item.content}</p>` : ''}
      ${moodBadge}
      <div class="flex gap-4 mt-3 pt-3 border-t border-gray-700">
        <button class="react-btn flex items-center gap-1 text-gray-400 hover:text-blue-400 ${item.user_reaction ? 'text-blue-400' : ''}" data-type="${item.type}" data-id="${item.id}">
          <svg class="w-5 h-5" fill="${item.user_reaction ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
          <span>${item.like_count || 0}</span>
        </button>
        <button class="comment-toggle flex items-center gap-1 text-gray-400 hover:text-blue-400" data-type="${item.type}" data-id="${item.id}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <span>${item.comment_count || 0}</span>
        </button>
      </div>
    </div>
  `;
}

// Attach feed item actions
function attachFeedActions() {
  // React buttons
  document.querySelectorAll('.react-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetType = btn.dataset.type === 'group_post' ? 'group_post' : 'shared_mood';
      const targetId = btn.dataset.id;
      
      try {
        const res = await fetch('/api/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target_type: targetType, target_id: parseInt(targetId), type: 'like' })
        });
        const data = await res.json();
        
        if (data.success) {
          // Update UI
          const countSpan = btn.querySelector('span');
          const currentCount = parseInt(countSpan.textContent) || 0;
          if (data.action === 'added') {
            countSpan.textContent = currentCount + 1;
            btn.classList.add('text-blue-400');
          } else if (data.action === 'removed') {
            countSpan.textContent = Math.max(0, currentCount - 1);
            btn.classList.remove('text-blue-400');
          }
        }
      } catch (err) {
        console.error('Error reacting:', err);
      }
    });
  });
}

// Notifications
const notificationsBtn = document.getElementById('notifications-btn');
const notificationsPanel = document.getElementById('notifications-panel');
const closeNotifications = document.getElementById('close-notifications');
const unreadCountEl = document.getElementById('unread-count');

notificationsBtn.addEventListener('click', (e) => {
  e.preventDefault();
  notificationsPanel.classList.toggle('translate-x-full');
  loadNotifications();
});

closeNotifications.addEventListener('click', () => {
  notificationsPanel.classList.add('translate-x-full');
});

async function loadNotifications() {
  const list = document.getElementById('notifications-list');
  
  try {
    const res = await fetch('/api/activities');
    const data = await res.json();
    
    // Update badge
    if (data.unread_count > 0) {
      unreadCountEl.textContent = data.unread_count > 9 ? '9+' : data.unread_count;
      unreadCountEl.classList.remove('hidden');
    } else {
      unreadCountEl.classList.add('hidden');
    }
    
    if (data.activities && data.activities.length > 0) {
      list.innerHTML = data.activities.map(activity => {
        const name = activity.actor_display_name || activity.actor_name || 'Someone';
        const message = activity.data?.message || getActivityMessage(activity);
        const timeAgo = getTimeAgo(new Date(activity.created_at));
        const bgClass = activity.is_read ? 'bg-gray-700' : 'bg-gray-600';
        
        return `
          <div class="p-3 ${bgClass} rounded-lg">
            <p class="text-sm">${message}</p>
            <p class="text-gray-500 text-xs mt-1">${timeAgo}</p>
          </div>
        `;
      }).join('');
      
      // Mark as read
      if (data.unread_count > 0) {
        markNotificationsRead();
      }
    } else {
      list.innerHTML = '<p class="text-gray-400 text-center">No notifications</p>';
    }
  } catch (err) {
    list.innerHTML = '<p class="text-red-400">Failed to load</p>';
    console.error('Error loading notifications:', err);
  }
}

function getActivityMessage(activity) {
  switch (activity.type) {
    case 'friend_request': return 'sent you a friend request';
    case 'friend_accepted': return 'accepted your friend request';
    case 'mood_shared': return 'shared their mood';
    case 'group_joined': return 'joined your group';
    case 'group_post': return 'posted in your group';
    case 'reaction': return 'reacted to your post';
    case 'comment': return 'commented on your post';
    default: return 'did something';
  }
}

async function markNotificationsRead() {
  try {
    await fetch('/api/activities/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true })
    });
    unreadCountEl.classList.add('hidden');
  } catch (err) {
    console.error('Error marking as read:', err);
  }
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

// Check for unread notifications on load
async function checkUnread() {
  try {
    const res = await fetch('/api/activities?unread=true&limit=1');
    const data = await res.json();
    
    if (data.unread_count > 0) {
      unreadCountEl.textContent = data.unread_count > 9 ? '9+' : data.unread_count;
      unreadCountEl.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Error checking unread:', err);
  }
}

// Initial load
loadFeed(true);
checkUnread();

// Poll for updates every 30 seconds
setInterval(() => {
  checkUnread();
}, 30000);
