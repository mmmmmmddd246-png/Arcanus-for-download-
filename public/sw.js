// ══════════════════════════════════════
// Arcanus Service Worker v2
// Handles: notifications, caching, offline shell
// ══════════════════════════════════════

const CACHE_NAME = 'arcanus-v2';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/main.js',
  '/api.js',
  '/platform-detector.js',
  '/i18n.js',
  '/notifications.js',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/ui/input-view.js',
  '/ui/preview-view.js',
  '/ui/history-view.js',
  '/ui/settings-view.js',
  '/ui/toast-view.js',
  '/locales/en.json',
  '/locales/ar.json',
];

// ── Install: cache the app shell ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch(err => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for shell ──
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API requests and SSE: always go to network
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/locales/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Static assets: cache-first, then network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      if (event.request.destination === 'document') {
        return caches.match('/index.html');
      }
    })
  );
});

// ── Push Notifications ──
self.addEventListener('push', (event) => {
  let data = { title: 'Arcanus', body: 'Download complete!', icon: '/icons/icon-192.svg' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192.svg',
      badge: '/icons/icon-96.svg',
      vibrate: [200, 100, 200],
      tag: data.tag || 'arcanus-notification',
      renotify: true,
      actions: data.actions || [],
      data: data.data || {},
    })
  );
});

// ── Notification Click ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow('/');
    })
  );
});

// ── Message handler ──
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag, actions } = event.data;
    self.registration.showNotification(title, {
      body,
      icon: icon || '/icons/icon-192.svg',
      badge: '/icons/icon-96.svg',
      vibrate: [200, 100, 200],
      tag: tag || 'arcanus-download',
      renotify: true,
      actions: actions || [],
    });
  }
});
