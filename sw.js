const CACHE_NAME = 'mizan-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. Install event - التخزين الأولي للملفات الأساسية
self.addEventListener('install', event => {
  console.log('🔧 Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Installation complete');
        return self.skipWaiting();
      })
  );
});

// 2. Activate event - تنظيف ذاكرة التخزين القديمة
self.addEventListener('activate', event => {
  console.log('🚀 Activating Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Activation complete');
      return self.clients.claim();
    })
  );
});

// 3. Fetch event - استراتيجية: الشبكة أولاً مع التخزين الاحتياطي
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.url.includes('chrome-extension://')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // تحديث التخزين عند نجاح الاتصال بالشبكة
        if (response.status === 200 && !event.request.url.includes('?')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(err => {
        console.warn('Network request failed, checking cache:', err);
        // عند فشل الشبكة، ابحث في التخزين
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          
          // إذا كان المستخدم يطلب صفحة ويب (Document) ولا يوجد إنترنت، وجهه لـ index.html
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
          
          return new Response('Offline - Resource not available', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      })
  );
});

// 4. Handle messages - للتحكم اليدوي في التحديثات
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('✅ Service Worker loaded');
