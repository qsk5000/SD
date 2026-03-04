const CACHE_NAME = ‘mizan-v1’;
const STATIC_ASSETS = [
‘/’,
‘/index.html’,
‘/manifest.json’,
‘/css/style.css’,
‘/js/script.js’,
‘/icons/icon-192x192.png’,
‘/icons/icon-512x512.png’
];

// Install event
self.addEventListener(‘install’, event => {
event.waitUntil(
caches.open(CACHE_NAME)
.then(cache => {
console.log(‘Cache opened, caching static assets’);
return cache.addAll(STATIC_ASSETS)
.catch(err => {
console.warn(‘Failed to cache some assets:’, err);
// Don’t fail the install if some assets fail
return Promise.resolve();
});
})
.then(() => self.skipWaiting())
);
});

// Activate event
self.addEventListener(‘activate’, event => {
event.waitUntil(
caches.keys()
.then(cacheNames => {
return Promise.all(
cacheNames.map(cacheName => {
if (cacheName !== CACHE_NAME) {
console.log(‘Deleting old cache:’, cacheName);
return caches.delete(cacheName);
}
})
);
})
.then(() => self.clients.claim())
);
});

// Fetch event - Network first, fallback to cache
self.addEventListener(‘fetch’, event => {
// Skip non-GET requests
if (event.request.method !== ‘GET’) {
return;
}

event.respondWith(
fetch(event.request)
.then(response => {
// Clone the response
const responseClone = response.clone();

```
    // Cache successful responses
    if (response.status === 200) {
      caches.open(CACHE_NAME)
        .then(cache => {
          cache.put(event.request, responseClone);
        })
        .catch(err => console.warn('Cache update failed:', err));
    }
    
    return response;
  })
  .catch(() => {
    // Network request failed, try cache
    return caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Return offline page if both network and cache fail
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
        
        return new Response('Offline - Resource not available', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      });
  })
```

);
});

// Handle messages from clients
self.addEventListener(‘message’, event => {
if (event.data && event.data.type === ‘SKIP_WAITING’) {
self.skipWaiting();
}
});

console.log(‘Service Worker loaded successfully’);
