/* ChanchiMercado — v3: navegaciones sin caché HTTP para que tras un deploy de Next/ Vercel
 * siempre se cargue el documento y los nuevos nombres de chunk (_next/static/...). */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
