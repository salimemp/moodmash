/**
 * MoodMash Service Worker
 * Version: 10.3 (Advanced PWA + Background Sync + Push Notifications)
 * 
 * Features:
 * - Cache-first for static assets
 * - Network-first for API calls
 * - Offline fallback
 * - Background sync for mood entries
 * - Push notifications support
 * - Periodic background sync
 */

const CACHE_VERSION = 'v10.3.0';
const CACHE_NAME = `moodmash-${CACHE_VERSION}`;
const OFFLINE_QUEUE = 'offline-queue';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/static/app.js',
  '/static/styles.css',
  '/static/utils.js',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('moodmash-') && name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests (network-first)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Handle static assets (cache-first)
  if (
    url.pathname.startsWith('/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.hostname.includes('cdn.')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Handle navigation requests (network-first with cache fallback)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default: network-first
  event.respondWith(networkFirst(request));
});

// Cache-first strategy (for static assets)
async function cacheFirst(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
      console.log('[SW] Cache hit:', request.url);
      
      // Update cache in background
      fetch(request).then((response) => {
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
      }).catch(() => {});

      return cached;
    }

    console.log('[SW] Cache miss, fetching:', request.url);
    const response = await fetch(request);

    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[SW] Cache-first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network-first strategy (for API and dynamic content)
async function networkFirst(request) {
  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response && response.status === 200 && !request.url.includes('/api/auth/')) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    // Return offline fallback
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    }

    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'No internet connection',
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Background sync for queued mood entries
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-mood-entries') {
    event.waitUntil(syncMoodEntries());
  }
});

async function syncMoodEntries() {
  try {
    // Get queued entries from IndexedDB
    const db = await openDatabase();
    const entries = await getQueuedEntries(db);

    console.log('[SW] Syncing', entries.length, 'queued mood entries');

    for (const entry of entries) {
      try {
        const response = await fetch('/api/moods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry.data),
        });

        if (response.ok) {
          await removeQueuedEntry(db, entry.id);
          console.log('[SW] Synced entry:', entry.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync entry:', entry.id, error);
      }
    }

    // Notify clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        count: entries.length,
      });
    });
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// IndexedDB helpers
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MoodMashOffline', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('queuedEntries')) {
        db.createObjectStore('queuedEntries', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getQueuedEntries(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['queuedEntries'], 'readonly');
    const store = transaction.objectStore('queuedEntries');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeQueuedEntry(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['queuedEntries'], 'readwrite');
    const store = transaction.objectStore('queuedEntries');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'MoodMash';
  const options = {
    body: data.body || 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const url = event.notification.data || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

// Message handler
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        return self.clients.matchAll();
      }).then((clients) => {
        clients.forEach(client => client.postMessage({ type: 'CACHE_CLEARED' }));
      })
    );
  }
});

// Background Sync - sync offline data
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(
      syncOfflineData()
        .then(() => {
          console.log('[SW] Background sync completed');
          return sendMessageToClients({ type: 'BACKGROUND_SYNC_SUCCESS' });
        })
        .catch((error) => {
          console.error('[SW] Background sync failed:', error);
          return sendMessageToClients({ type: 'BACKGROUND_SYNC_FAILED', error: error.message });
        })
    );
  }
});

// Periodic Background Sync - periodic data refresh
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered:', event.tag);

  if (event.tag === 'sync-mood-data') {
    event.waitUntil(
      refreshMoodData().catch((error) => {
        console.error('[SW] Periodic sync failed:', error);
      })
    );
  }
});

// Sync offline data
async function syncOfflineData() {
  // Get offline queue from IndexedDB or cache
  const cache = await caches.open(OFFLINE_QUEUE);
  const requests = await cache.keys();

  if (requests.length === 0) {
    console.log('[SW] No offline data to sync');
    return;
  }

  console.log('[SW] Syncing', requests.length, 'offline requests');

  const results = await Promise.allSettled(
    requests.map(async (request) => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
          return { success: true, request: request.url };
        }
        throw new Error(`HTTP ${response.status}`);
      } catch (error) {
        console.error('[SW] Failed to sync:', request.url, error);
        return { success: false, request: request.url, error: error.message };
      }
    })
  );

  const successful = results.filter(r => r.value?.success).length;
  console.log('[SW] Synced', successful, 'of', requests.length, 'requests');
}

// Refresh mood data periodically
async function refreshMoodData() {
  try {
    const response = await fetch('/api/moods?limit=10');
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put('/api/moods?limit=10', response.clone());
      console.log('[SW] Mood data refreshed');
    }
  } catch (error) {
    console.error('[SW] Failed to refresh mood data:', error);
  }
}

// Send message to all clients
async function sendMessageToClients(message) {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => {
    client.postMessage(message);
  });
}

console.log('[SW] Service Worker loaded, version:', CACHE_VERSION);
