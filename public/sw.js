// MoodMash Service Worker
// Version 8.0.0 - Magic Link Authentication

const CACHE_NAME = 'moodmash-v8.0.0';
const ASSETS_TO_CACHE = [
    '/',
    '/login',
    '/register',
    '/auth/magic',
    '/log',
    '/activities',
    '/express',
    '/insights',
    '/quick-select',
    '/wellness-tips',
    '/challenges',
    '/color-psychology',
    '/social-feed',
    '/about',
    '/static/styles.css',
    '/static/app.js',
    '/static/log.js',
    '/static/activities.js',
    '/static/express.js',
    '/static/insights.js',
    '/static/quick-select.js',
    '/static/wellness-tips.js',
    '/static/challenges.js',
    '/static/color-psychology.js',
    '/static/social-feed.js',
    '/static/i18n.js',
    '/static/utils.js',
    '/static/onboarding.js',
    '/static/chatbot.js',
    '/static/accessibility.js',
    '/static/auth.js',
    '/static/magic-link.js',
    '/manifest.json',
    // CDN resources (cached separately)
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
    'https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('Service Worker: Installed successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Installation failed', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated successfully');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip API requests (always fetch from network)
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return new Response(
                        JSON.stringify({ error: 'Offline - API unavailable' }),
                        {
                            headers: { 'Content-Type': 'application/json' },
                            status: 503
                        }
                    );
                })
        );
        return;
    }
    
    // Network-first strategy for JavaScript files (always get latest)
    if (event.request.url.includes('/static/') && event.request.url.endsWith('.js')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Clone and cache the response
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(event.request);
                })
        );
        return;
    }
    
    // Cache-first strategy for other assets
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version and update in background
                    fetchAndCache(event.request);
                    return cachedResponse;
                }
                
                // Not in cache, fetch from network
                return fetchAndCache(event.request);
            })
            .catch((error) => {
                console.error('Service Worker: Fetch failed', error);
                
                // Return offline page if available
                return caches.match('/offline.html')
                    .then((offlineResponse) => {
                        return offlineResponse || new Response(
                            'Offline - Please check your internet connection',
                            {
                                headers: { 'Content-Type': 'text/html' },
                                status: 503
                            }
                        );
                    });
            })
    );
});

// Helper function to fetch and cache
function fetchAndCache(request) {
    return fetch(request)
        .then((response) => {
            // Don't cache non-success responses
            if (!response || response.status !== 200 || response.type === 'error') {
                return response;
            }
            
            // Clone response (can only be read once)
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
                .then((cache) => {
                    cache.put(request, responseToCache);
                });
            
            return response;
        });
}

// Background sync for offline mood entries
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered');
    
    if (event.tag === 'sync-mood-entries') {
        event.waitUntil(syncMoodEntries());
    }
});

async function syncMoodEntries() {
    try {
        // Get offline mood entries from IndexedDB (if implemented)
        console.log('Service Worker: Syncing offline mood entries');
        
        // This would sync any mood entries created while offline
        // Implementation would depend on IndexedDB usage
        
        return Promise.resolve();
    } catch (error) {
        console.error('Service Worker: Sync failed', error);
        return Promise.reject(error);
    }
}

// Push notification support (for future use)
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New update available',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View',
                icon: '/icons/icon-96x96.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icons/icon-96x96.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('MoodMash', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked');
    
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});

// Message handler for communication with main app
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received', event.data);
    
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
    
    if (event.data.action === 'clearCache') {
        event.waitUntil(
            caches.delete(CACHE_NAME)
                .then(() => {
                    console.log('Service Worker: Cache cleared');
                    return self.clients.claim();
                })
        );
    }
});
