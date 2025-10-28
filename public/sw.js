// Service Worker for Saudi Mais Inventory System
// Provides offline support and advanced caching

const CACHE_NAME = 'saudi-mais-v1';
const STATIC_CACHE_NAME = 'saudi-mais-static-v1';
const DYNAMIC_CACHE_NAME = 'saudi-mais-dynamic-v1';
const API_CACHE_NAME = 'saudi-mais-api-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  // Add critical CSS and JS files here
];

// API endpoints to cache with different strategies
const API_CACHE_PATTERNS = [
  { pattern: /\/api\/inventory/, strategy: 'networkFirst', ttl: 5 * 60 * 1000 }, // 5 minutes
  { pattern: /\/api\/analytics/, strategy: 'cacheFirst', ttl: 15 * 60 * 1000 }, // 15 minutes
  { pattern: /\/api\/reports/, strategy: 'networkFirst', ttl: 10 * 60 * 1000 }, // 10 minutes
  { pattern: /\/api\/settings/, strategy: 'cacheFirst', ttl: 60 * 60 * 1000 }, // 1 hour
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME && 
                cacheName !== API_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Handle navigation requests (pages)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Default: network first for other requests
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});

// Handle API requests with different caching strategies
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Find matching cache pattern
  const cachePattern = API_CACHE_PATTERNS.find(pattern => 
    pattern.pattern.test(url.pathname)
  );
  
  if (!cachePattern) {
    // Default: network only for unconfigured APIs
    return fetch(request);
  }

  const cache = await caches.open(API_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  switch (cachePattern.strategy) {
    case 'cacheFirst':
      return handleCacheFirst(request, cache, cachedResponse, cachePattern.ttl);
    
    case 'networkFirst':
      return handleNetworkFirst(request, cache, cachedResponse, cachePattern.ttl);
    
    default:
      return fetch(request);
  }
}

// Cache first strategy - use cache if available and not expired
async function handleCacheFirst(request, cache, cachedResponse, ttl) {
  if (cachedResponse && !isCacheExpired(cachedResponse, ttl)) {
    console.log('[SW] Serving from cache (cache-first):', request.url);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      console.log('[SW] Updated cache from network:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, serving stale cache:', request.url);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Network first strategy - try network first, fallback to cache
async function handleNetworkFirst(request, cache, cachedResponse, ttl) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      console.log('[SW] Served from network and cached:', request.url);
      return networkResponse;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    if (cachedResponse && !isCacheExpired(cachedResponse, ttl)) {
      console.log('[SW] Network failed, serving from cache:', request.url);
      return cachedResponse;
    }
    console.log('[SW] No cache available for failed request:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

// Handle static assets with cache first strategy
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log('[SW] Serving static asset from cache:', request.url);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      console.log('[SW] Cached static asset:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch static asset:', request.url);
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Handle navigation requests (pages)
async function handleNavigation(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      console.log('[SW] Cached page:', request.url);
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving cached page:', request.url);
      return cachedResponse;
    }
    
    // Fallback to offline page
    const offlinePage = await cache.match('/offline');
    return offlinePage || new Response('Page not available offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Check if cached response is expired
function isCacheExpired(response, ttl) {
  const cachedTime = response.headers.get('sw-cached-time');
  if (!cachedTime) return true;
  
  const age = Date.now() - parseInt(cachedTime);
  return age > ttl;
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some(ext => pathname.endsWith(ext)) || 
         pathname.startsWith('/_next/static/');
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'inventory-sync') {
    event.waitUntil(syncInventoryData());
  }
});

// Sync inventory data when back online
async function syncInventoryData() {
  try {
    // Get pending offline actions from IndexedDB
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body,
        });
        
        // Remove successful action from pending list
        await removePendingAction(action.id);
        console.log('[SW] Synced offline action:', action.id);
      } catch (error) {
        console.error('[SW] Failed to sync action:', action.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Placeholder functions for IndexedDB operations
async function getPendingActions() {
  // Implementation would use IndexedDB to get pending actions
  return [];
}

async function removePendingAction(id) {
  // Implementation would remove action from IndexedDB
  console.log('[SW] Removing pending action:', id);
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icon-explore.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Saudi Mais Inventory', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

console.log('[SW] Service worker script loaded');