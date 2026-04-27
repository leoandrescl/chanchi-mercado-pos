/* ChanchiMercado — v3: navegaciones sin caché HTTP para que tras un deploy de Next/ Vercel
 * siempre se cargue el documento y los nuevos nombres de chunk (_next/static/...). */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode === 'navigate' || (req.destination === 'document' && req.method === 'GET')) {
    event.respondWith(
      fetch(req, { cache: 'no-store', redirect: 'follow' })
    );
    return;
  }
  event.respondWith(fetch(req));
});
