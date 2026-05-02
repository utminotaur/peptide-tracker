// Peptide Tracker — Service Worker
// Stale-while-revalidate caching so the app loads instantly and works offline.

const CACHE_NAME = 'peptide-tracker-v11';
const PRECACHE = [
  './',
  './index.html',
  './peptide-tracker.html',
  './peptide-tracker.webmanifest',
  './icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(
        PRECACHE.map(url =>
          cache.add(url).catch(() => null) // ignore individual failures
        )
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Only handle same-origin requests
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, respClone));
        }
        return resp;
      }).catch(() => cached || caches.match('./index.html') || caches.match('./peptide-tracker.html'));
      return cached || network;
    })
  );
});
