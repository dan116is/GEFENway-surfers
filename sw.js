/* Service Worker — המשחק נטען מיידית ועובד גם בלי אינטרנט */
const VERSION = 'gefenway-20260818-134842';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js',
  './js/game.js',
  './js/world.js',
  './js/characters.js',
  './js/audio.js',
  './js/util.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon-180.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const NET_TIMEOUT = 2500;

/** קודם רשת (עם פסק זמן), מטמון כגיבוי — כך עדכון באתר מגיע מיד למסך הבית */
async function networkFirst(req){
  const cache = await caches.open(VERSION);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), NET_TIMEOUT);
    const res = await fetch(req, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timer);
    if (res && res.ok && new URL(req.url).origin === location.origin){
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate'){
      const shell = await cache.match('./index.html');
      if (shell) return shell;
    }
    throw new Error('offline and not cached');
  }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;
  e.respondWith(networkFirst(req));
});
