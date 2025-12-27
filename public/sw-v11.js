/**
 * MoodMash Service Worker (v11.0)
 * 
 * Advanced PWA service worker with:
 * - Code splitting and lazy loading support
 * - Advanced caching strategies (Network First, Cache First, Stale While Revalidate)
 * - Background sync for offline operations
 * - Push notifications
 * - Periodic background sync
 * - Cache versioning and cleanup
 * - Performance optimizations
 * - CDN asset caching
 */

// Cache version - increment to force cache refresh
const CACHE_VERSION = 'v11.0.0'
const CACHE_NAME = `moodmash-${CACHE_VERSION}`
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`
const CDN_CACHE = `cdn-${CACHE_VERSION}`
const API_CACHE = `api-${CACHE_VERSION}`
const IMAGE_CACHE = `images-${CACHE_VERSION}`

// Offline queue for failed requests
const OFFLINE_QUEUE = 'offline-queue'

// Static assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/static/app.js',
  '/static/styles.css',
  '/static/utils.js',
  '/static/dark-mode.js',
  '/static/lazy-loader.js',
]

// CDN assets to cache (with longer TTL)
const CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
]

// API endpoints to cache (with shorter TTL)
const API_CACHE_PATTERNS = [
  /\/api\/config/,
  /\/api\/features/,
  /\/api\/activities/,
  /\/api\/stats/,
]

// Images and media to cache
const IMAGE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
  /\/images\//,
  /\/icons\//,
]

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v11.0.0...')
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })))
      }),
      
      // Cache CDN assets
      caches.open(CDN_CACHE).then((cache) => {
        return cache.addAll(CDN_ASSETS)
      }),
    ]).then(() => {
      console.log('[SW] Installation complete, skipping waiting...')
      return self.skipWaiting()
    })
  )
})

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v11.0.0...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (cacheName.startsWith('moodmash-') && cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
          if (cacheName.startsWith('runtime-') && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName)
          }
          if (cacheName.startsWith('cdn-') && cacheName !== CDN_CACHE) {
            return caches.delete(cacheName)
          }
          if (cacheName.startsWith('api-') && cacheName !== API_CACHE) {
            return caches.delete(cacheName)
          }
          if (cacheName.startsWith('images-') && cacheName !== IMAGE_CACHE) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('[SW] Activation complete, claiming clients...')
      return self.clients.claim()
    })
  )
})

/**
 * Fetch event - handle requests with appropriate caching strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    // For POST/PUT/DELETE, try network first, queue on failure
    event.respondWith(
      fetch(request).catch(() => {
        // Queue for background sync
        return queueRequest(request).then(() => {
          return new Response(
            JSON.stringify({ 
              success: true, 
              queued: true,
              message: 'Request queued for background sync' 
            }),
            { 
              status: 202,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        })
      })
    )
    return
  }

  // Strategy 1: CDN assets - Cache First (long TTL)
  if (isCDNAsset(url)) {
    event.respondWith(cacheFirst(request, CDN_CACHE, 7 * 24 * 60 * 60 * 1000)) // 7 days
    return
  }

  // Strategy 2: Images - Cache First (medium TTL)
  if (isImageAsset(url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, 24 * 60 * 60 * 1000)) // 1 day
    return
  }

  // Strategy 3: API calls - Network First with Stale While Revalidate
  if (url.pathname.startsWith('/api/')) {
    // Cacheable API endpoints
    if (isCacheableAPI(url)) {
      event.respondWith(staleWhileRevalidate(request, API_CACHE, 5 * 60 * 1000)) // 5 minutes
    } else {
      // Non-cacheable API - Network First
      event.respondWith(networkFirst(request, RUNTIME_CACHE))
    }
    return
  }

  // Strategy 4: Static assets - Cache First with Network Fallback
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.startsWith('/static/'))) {
    event.respondWith(cacheFirst(request, CACHE_NAME))
    return
  }

  // Strategy 5: HTML pages - Network First
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE))
    return
  }

  // Default: Network First
  event.respondWith(networkFirst(request, RUNTIME_CACHE))
})

/**
 * Cache First strategy - serve from cache, update cache in background
 */
async function cacheFirst(request, cacheName, maxAge = 0) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  if (cached) {
    // Check if cache is stale
    const cacheTime = new Date(cached.headers.get('sw-cache-time') || 0).getTime()
    const now = Date.now()
    
    if (maxAge > 0 && now - cacheTime > maxAge) {
      // Cache is stale, fetch new version in background
      fetchAndCache(request, cacheName)
    }
    
    return cached
  }

  // Not in cache, fetch from network
  return fetchAndCache(request, cacheName)
}

/**
 * Network First strategy - try network, fallback to cache
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // Network failed, try cache
    const cached = await caches.match(request)
    
    if (cached) {
      return cached
    }
    
    // No cache, return offline page
    return createOfflineResponse()
  }
}

/**
 * Stale While Revalidate - serve from cache, update in background
 */
async function staleWhileRevalidate(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  
  // Fetch new version (don't await)
  const fetchPromise = fetchAndCache(request, cacheName)
  
  // Return cached version immediately if available
  if (cached) {
    const cacheTime = new Date(cached.headers.get('sw-cache-time') || 0).getTime()
    const now = Date.now()
    
    // If cache is fresh enough, return it
    if (maxAge === 0 || now - cacheTime < maxAge) {
      return cached
    }
  }
  
  // Wait for network response
  return fetchPromise
}

/**
 * Fetch and cache helper
 */
async function fetchAndCache(request, cacheName) {
  try {
    const response = await fetch(request)
    
    if (response.ok) {
      const cache = await caches.open(cacheName)
      
      // Clone response and add cache timestamp
      const clonedResponse = response.clone()
      const headers = new Headers(clonedResponse.headers)
      headers.set('sw-cache-time', new Date().toISOString())
      
      const cachedResponse = new Response(await clonedResponse.blob(), {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers: headers,
      })
      
      cache.put(request, cachedResponse)
    }
    
    return response
  } catch (error) {
    console.error('[SW] Fetch failed:', error)
    throw error
  }
}

/**
 * Check if URL is a CDN asset
 */
function isCDNAsset(url) {
  return CDN_ASSETS.some(cdn => url.href.startsWith(cdn))
}

/**
 * Check if URL is an image asset
 */
function isImageAsset(url) {
  return IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname))
}

/**
 * Check if API endpoint is cacheable
 */
function isCacheableAPI(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))
}

/**
 * Create offline response
 */
function createOfflineResponse() {
  return new Response(
    JSON.stringify({ 
      error: 'Offline',
      message: 'You are currently offline. Please check your internet connection.' 
    }),
    { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

/**
 * Queue request for background sync
 */
async function queueRequest(request) {
  const queue = await getQueue()
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now(),
  }
  
  queue.push(requestData)
  await saveQueue(queue)
  
  // Register background sync
  if ('sync' in self.registration) {
    await self.registration.sync.register('sync-queue')
  }
}

/**
 * Get offline queue from IndexedDB
 */
async function getQueue() {
  // Simplified: Use cache for queue storage
  const cache = await caches.open(OFFLINE_QUEUE)
  const response = await cache.match('queue')
  
  if (response) {
    return response.json()
  }
  
  return []
}

/**
 * Save offline queue to IndexedDB
 */
async function saveQueue(queue) {
  const cache = await caches.open(OFFLINE_QUEUE)
  const response = new Response(JSON.stringify(queue), {
    headers: { 'Content-Type': 'application/json' }
  })
  
  await cache.put('queue', response)
}

/**
 * Background sync event - process offline queue
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)
  
  if (event.tag === 'sync-queue') {
    event.waitUntil(processQueue())
  }
})

/**
 * Process offline queue
 */
async function processQueue() {
  const queue = await getQueue()
  
  if (queue.length === 0) {
    return
  }
  
  console.log(`[SW] Processing ${queue.length} queued requests...`)
  
  const processed = []
  const failed = []
  
  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      })
      
      if (response.ok) {
        processed.push(item)
      } else {
        failed.push(item)
      }
    } catch (error) {
      console.error('[SW] Failed to sync request:', error)
      failed.push(item)
    }
  }
  
  // Update queue with failed requests
  await saveQueue(failed)
  
  console.log(`[SW] Processed: ${processed.length}, Failed: ${failed.length}`)
}

/**
 * Push notification event
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')
  
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'MoodMash'
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: data.tag || 'default',
    data: data.data || {},
    actions: data.actions || [],
    vibrate: [200, 100, 200],
  }
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag)
  
  event.notification.close()
  
  const urlToOpen = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if window is already open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

/**
 * Message event - handle messages from clients
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        )
      })
    )
  }
  
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION })
  }
})

/**
 * Periodic background sync (for updates)
 */
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered:', event.tag)
  
  if (event.tag === 'update-cache') {
    event.waitUntil(updateCache())
  }
})

/**
 * Update cache in background
 */
async function updateCache() {
  console.log('[SW] Updating cache...')
  
  try {
    const cache = await caches.open(CACHE_NAME)
    await cache.addAll(STATIC_ASSETS)
    console.log('[SW] Cache updated successfully')
  } catch (error) {
    console.error('[SW] Cache update failed:', error)
  }
}

console.log('[SW] Service Worker v11.0.0 loaded')
