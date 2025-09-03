/**
 * SANTOO - Service Worker
 * PWA caching and offline functionality
 */

const CACHE_NAME = 'santoo-v2.0.0-force-refresh-' + Date.now();
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
// IMPORTANTE: Não cachear arquivos JS críticos para evitar cache corrompido
const CACHE_FILES = [
  '/',
  '/index.html',
  '/css/reset.css',
  '/css/variables.css',
  '/css/components.css',
  '/css/main.css',
  '/assets/images/default-avatar.svg',
  '/manifest.json'
];

// Arquivos JS que NUNCA devem ser cacheados (sempre carregar do servidor)
const NO_CACHE_JS_FILES = [
  '/js/utils.js',
  '/js/api.js',
  '/js/components.js', 
  '/js/auth.js',
  '/js/upload.js',
  '/js/video-player.js',
  '/js/main.js'
];

/**
 * Install event - cache essential files
 */
self.addEventListener('install', (event) => {
  console.log('📦 SW: Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 SW: Caching app shell files');
        return cache.addAll(CACHE_FILES);
      })
      .then(() => {
        console.log('✅ SW: App shell cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ SW: Error caching files:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('🔄 SW: Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ SW: Service worker activated');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - serve cached files or fetch from network
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If fetch succeeds, return the response
          return response;
        })
        .catch(() => {
          // If fetch fails, return cached index.html or offline page
          return caches.match('/index.html')
            .then((cachedResponse) => {
              return cachedResponse || caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }
  
  // ESTRATÉGIA ESPECIAL: JavaScript crítico sempre do servidor
  const isJSFile = NO_CACHE_JS_FILES.some(jsFile => request.url.includes(jsFile));
  
  if (isJSFile) {
    console.log('🚫 SW: Forçando carregamento do servidor para JS:', request.url);
    event.respondWith(
      fetch(request).then((response) => {
        console.log('✅ SW: JS carregado do servidor:', request.url);
        return response;
      }).catch((error) => {
        console.error('❌ SW: Erro ao carregar JS:', request.url, error);
        throw error;
      })
    );
    return;
  }
  
  // Handle other requests with cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('📥 SW: Serving from cache:', request.url);
          return cachedResponse;
        }
        
        // If not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache if not a successful response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response for caching
            const responseToCache = response.clone();
            
            // Cache the response for future requests
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Only cache certain file types
                if (shouldCache(request.url)) {
                  console.log('💾 SW: Caching new resource:', request.url);
                  cache.put(request, responseToCache);
                }
              });
            
            return response;
          })
          .catch((error) => {
            console.error('❌ SW: Network request failed:', request.url, error);
            
            // For images, return a placeholder
            if (request.destination === 'image') {
              return caches.match('/assets/images/default-avatar.svg');
            }
            
            // For other requests, return a generic offline response
            return new Response(
              JSON.stringify({ 
                error: 'Offline', 
                message: 'Recurso não disponível offline' 
              }), 
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'application/json'
                })
              }
            );
          });
      })
  );
});

/**
 * Message event - handle messages from the app
 */
self.addEventListener('message', (event) => {
  console.log('💬 SW: Received message:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_URLS':
      if (event.data.payload && event.data.payload.length > 0) {
        caches.open(CACHE_NAME)
          .then((cache) => {
            return cache.addAll(event.data.payload);
          })
          .then(() => {
            console.log('✅ SW: URLs cached successfully');
          })
          .catch((error) => {
            console.error('❌ SW: Error caching URLs:', error);
          });
      }
      break;
      
    default:
      console.log('🤷 SW: Unknown message type:', event.data.type);
  }
});

/**
 * Push event - handle push notifications
 */
self.addEventListener('push', (event) => {
  console.log('🔔 SW: Push notification received:', event.data?.text());
  
  const options = {
    body: event.data?.text() || 'Nova notificação do Santoo',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    tag: 'santoo-notification',
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: 'Abrir App',
        icon: '/assets/icons/open-action.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/assets/icons/close-action.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Santoo', options)
  );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 SW: Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

/**
 * Background sync event
 */
self.addEventListener('sync', (event) => {
  console.log('🔄 SW: Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

/**
 * Utility functions
 */

/**
 * Check if URL should be cached
 */
function shouldCache(url) {
  const cacheableExtensions = [
    '.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.webp',
    '.woff', '.woff2', '.ttf', '.eot', '.json'
  ];
  
  return cacheableExtensions.some(ext => url.toLowerCase().includes(ext));
}

/**
 * Perform background sync operations
 */
async function doBackgroundSync() {
  try {
    console.log('🔄 SW: Performing background sync...');
    
    // Here you would typically:
    // - Send queued uploads
    // - Sync offline actions
    // - Update cached content
    
    console.log('✅ SW: Background sync completed');
  } catch (error) {
    console.error('❌ SW: Background sync failed:', error);
    throw error; // This will retry the sync
  }
}

console.log('🚀 SW: Service worker script loaded');