/* ChanchiMercado — service worker mínimo para criterios de instalación PWA en Chrome (Android/desktop).
 * Debe registrar un fetch handler; reenvía la red sin caché offline. */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
