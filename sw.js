/* Service worker mínimo: permite la instalación; no cachea nada (el sitio siempre se ve actualizado). */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
