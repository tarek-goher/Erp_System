// ══════════════════════════════════════════════════════════
// Service Worker — CodeSphere ERP PWA
// ══════════════════════════════════════════════════════════
// استراتيجية التخزين المؤقت:
//  - Shell (HTML/CSS/JS): Cache First
//  - API requests: Network First (مع fallback للـ cache)
//  - Static assets (images/fonts): Cache First مع expiry
// ══════════════════════════════════════════════════════════

const CACHE_NAME     = 'erp-v1'
const API_CACHE_NAME = 'erp-api-v1'

// الملفات اللي بتتحمّل عند الـ install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/login',
  '/offline',
]

// ── Install: cache الـ shell ──────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'no-cache' })))
        .catch(err => console.warn('[SW] Some assets failed to cache:', err))
    })
  )
  self.skipWaiting()
})

// ── Activate: احذف الـ caches القديمة ─────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activating...')
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== API_CACHE_NAME)
          .map(k => { console.log('[SW] Deleting old cache:', k); return caches.delete(k) })
      )
    )
  )
  self.clients.claim()
})

// ── Fetch: استراتيجية التخزين المؤقت ─────────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // تجاهل الطلبات اللي مش HTTP/HTTPS
  if (!url.protocol.startsWith('http')) return

  // تجاهل الـ POST/PUT/DELETE — مفيش cache للكتابة
  if (request.method !== 'GET') return

  // تجاهل الـ browser-sync والـ hot reload
  if (url.pathname.startsWith('/_next/webpack-hmr')) return
  if (url.pathname.startsWith('/__nextjs')) return

  // ── API requests: Network First ───────────────────────
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // ── Next.js static files: Cache First ─────────────────
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirstStrategy(request))
    return
  }

  // ── HTML pages: Network First مع cache fallback ────────
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOfflineFallback(request))
    return
  }

  // ── بقية الملفات (fonts, images): Cache First ─────────
  event.respondWith(cacheFirstStrategy(request))
})

// ══════════════════════════════════════════════════════════
// استراتيجيات التخزين
// ══════════════════════════════════════════════════════════

/** Network First — بيحاول النت أول، لو فشل يرجع للـ cache */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request.clone())
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response(JSON.stringify({ error: 'offline', message: 'لا يوجد اتصال بالإنترنت' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

/** Cache First — بيرجع من الـ cache مباشرة، لو مش موجود يروح للنت */
async function cacheFirstStrategy(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const networkResponse = await fetch(request.clone())
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

/** Network First with Offline Page fallback للـ HTML */
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request.clone())
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    // fallback لصفحة الـ offline
    const offlinePage = await caches.match('/offline')
    return offlinePage || new Response('<h1>أنت غير متصل بالإنترنت</h1>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
}

// ── Background Sync (للطلبات اللي فشلت) ──────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pending-sales') {
    event.waitUntil(syncPendingSales())
  }
})

async function syncPendingSales() {
  console.log('[SW] Syncing pending sales...')
  // هيتم تطبيقه مع IndexedDB في الـ client
}

// ── Push Notifications ────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return

  let data = {}
  try { data = event.data.json() } catch { data = { title: 'إشعار جديد', body: event.data.text() } }

  const options = {
    body:    data.body    || '',
    icon:    data.icon    || '/icons/icon-192x192.png',
    badge:   data.badge   || '/icons/icon-72x72.png',
    tag:     data.tag     || 'erp-notification',
    data:    data.url     || '/',
    actions: data.actions || [],
    dir:     'rtl',
    lang:    'ar',
    vibrate: [200, 100, 200],
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'CodeSphere ERP', options)
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(url) && 'focus' in c)
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})
