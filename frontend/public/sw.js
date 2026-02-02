// RuralHealthAI Service Worker
// Enables offline access by caching static assets and API responses

const CACHE_NAME = 'ruralhealthai-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
];

// API routes to cache for offline access
const API_CACHE_ROUTES = [
    '/api/stats/dashboard',
    '/api/stats/analytics',
    '/api/screening/patients',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Service Worker: Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('Service Worker: Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }

    // Handle static assets with cache-first strategy
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request).then((response) => {
                // Don't cache non-successful responses
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Clone the response for caching
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseToCache);
                });

                return response;
            }).catch(() => {
                // Return offline fallback for navigation requests
                if (request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
                return new Response('Offline', { status: 503 });
            });
        })
    );
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
    const url = new URL(request.url);

    // Check if this is a cacheable API route
    const isCacheable = API_CACHE_ROUTES.some(route => url.pathname.startsWith(route));

    try {
        // Try network first
        const response = await fetch(request);

        // Cache successful GET requests for cacheable routes
        if (response.ok && isCacheable) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        // Network failed, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('Service Worker: Serving cached API response for:', url.pathname);
            return cachedResponse;
        }

        // Return error response for offline API requests
        return new Response(
            JSON.stringify({
                error: 'Offline',
                message: 'You are offline. This data is not available.',
                offline: true
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Handle background sync
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered');
    if (event.tag === 'sync-screenings') {
        event.waitUntil(syncScreenings());
    }
});

// Sync screenings when back online
async function syncScreenings() {
    console.log('Service Worker: Syncing screenings...');
    // Notify all clients to trigger sync
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({ type: 'SYNC_TRIGGERED' });
    });
}

// Handle messages from the app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('Service Worker: Loaded');
