/* ASPM — Service worker
   - Las páginas se piden primero a la red (contenido siempre fresco) y, si no hay
     conexión o tarda demasiado, se sirve la copia guardada.
   - Iconos, manifest y pwa.js: copia guardada + actualización en segundo plano.
   - Tipografías de Google Fonts: se guardan para que la app se vea igual sin conexión.
   - Para forzar que todos los usuarios descarguen de nuevo los archivos,
     cambia el número de VERSION. */
const VERSION = 'v4';
const SHELL = 'aspm-shell-' + VERSION;
const PAGES = 'aspm-pages-' + VERSION;
const FONTS = 'aspm-fonts-' + VERSION;

// Se guardan al instalar la app. aspi.html pesa ~12 MB: se guarda la primera vez que se visita.
const PRECACHE_SHELL = [
  'manifest.webmanifest',
  'pwa.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png'
];
const PRECACHE_PAGES = [
  './',
  'index.html',
  'junta.html',
  'noticias.html',
  'asociados.html',
  'empleo.html',
  'alianzas.html'
];

const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL);
    const pages = await caches.open(PAGES);
    // allSettled: si un archivo falla, la instalación no se cancela.
    await Promise.allSettled([
      ...PRECACHE_SHELL.map((u) => shell.add(u)),
      ...PRECACHE_PAGES.map((u) => pages.add(u))
    ]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = [SHELL, PAGES, FONTS];
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith('aspm-') && !keep.includes(n)).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

function isFont(url) {
  return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const refresh = fetch(request).then((res) => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone());
    return res;
  }).catch(() => null);
  return cached || (await refresh) || Response.error();
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES);
  const cached = await cache.match(request, { ignoreSearch: true });

  const network = fetch(request).then((res) => {
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  });

  // Sin copia guardada: esperamos a la red sin límite de tiempo.
  if (!cached) {
    try { return await network; }
    catch (e) {
      const home = await cache.match('index.html');
      return home || Response.error();
    }
  }
  // Con copia guardada: red primero, pero si tarda más de 4 s mostramos la copia
  // (la descarga sigue en segundo plano y deja la página actualizada para la próxima vez).
  const timeout = new Promise((resolve) => setTimeout(() => resolve(cached), NETWORK_TIMEOUT_MS));
  try { return await Promise.race([network, timeout]); }
  catch (e) { return cached; }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (isFont(url)) {
    event.respondWith(staleWhileRevalidate(request, FONTS));
    return;
  }
  if (url.origin !== self.location.origin) return; // resto de sitios: navegador normal

  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(networkFirstPage(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request, SHELL));
});
