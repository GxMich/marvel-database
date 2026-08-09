/* ============================================================
   SERVICE WORKER
   Due cache separate, perché i contenuti hanno vite diverse:

   - SHELL: HTML, CSS, JS, icone. Cambiano ad ogni rilascio, quindi
     la cache è versionata e si svuota quando cambia VERSION.
   - MEDIA: locandine TMDB e video di intro. Non cambiano mai e
     pesano molto, quindi sopravvivono ai rilasci.

   Aggiornare VERSION ad ogni modifica di CSS/JS.
   ============================================================ */
const VERSION     = 'v12';
const SHELL_CACHE = `marvel-shell-${VERSION}`;
const MEDIA_CACHE = 'marvel-media';

/* percorsi relativi: funzionano sia in root sia in sottocartella
   (es. /marvel-database/ su GitHub Pages) */
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/base.css',
  './css/intro.css',
  './css/layout.css',
  './css/components.css',
  './css/facets.css',
  './css/responsive.css',
  './js/icons.js',
  './js/data/catalog.js',
  './js/data/franchises.js',
  './js/storage.js',
  './js/posters.js',
  './js/render.js',
  './js/controls.js',
  './js/ui.js',
  './js/intro.js',
  './js/legal.js',
  './js/app.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

/* ---------- installazione ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // addAll fallisce in blocco se un file manca: qui si procede a
    // tentativi singoli, così un asset assente non blocca l'installazione
    await Promise.all(SHELL_ASSETS.map(async (url) => {
      try { await cache.add(new Request(url, { cache: 'reload' })); }
      catch (e) { console.warn('[sw] non memorizzato:', url); }
    }));
    self.skipWaiting();
  })());
});

/* ---------- attivazione: via le shell vecchie ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k.startsWith('marvel-shell-') && k !== SHELL_CACHE)
          .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

/* ---------- richieste ---------- */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  /* Locandine TMDB: non cambiano mai. Prima la cache, e se manca si
     scarica una volta sola. Così l'app funziona anche offline. */
  if (url.hostname === 'image.tmdb.org') {
    event.respondWith((async () => {
      const cache = await caches.open(MEDIA_CACHE);
      const hit = await cache.match(request);
      if (hit) return hit;
      try {
        const res = await fetch(request);
        if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
        return res;
      } catch {
        return new Response('', { status: 504, statusText: 'Locandina non disponibile offline' });
      }
    })());
    return;
  }

  // le altre origini esterne non passano da qui
  if (url.origin !== self.location.origin) return;

  /* Video di intro: pesante e immutabile, va nella cache dei media
     e si serve con supporto alle richieste parziali del player. */
  if (url.pathname.endsWith('.mp4')) {
    event.respondWith((async () => {
      const cache = await caches.open(MEDIA_CACHE);
      const hit = await cache.match(request);
      if (hit) return hit;
      try {
        const res = await fetch(request);
        // le risposte 206 (parziali) non sono memorizzabili
        if (res.ok && res.status === 200) cache.put(request, res.clone());
        return res;
      } catch {
        return new Response('', { status: 504 });
      }
    })());
    return;
  }

  /* Navigazioni: prima la rete (per prendere subito una nuova versione),
     con ritorno alla cache se si è offline. */
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(request);
        const cache = await caches.open(SHELL_CACHE);
        cache.put('./index.html', res.clone());
        return res;
      } catch {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match('./index.html')) || (await cache.match('./')) ||
               new Response('Offline', { status: 503 });
      }
    })());
    return;
  }

  /* Resto della shell: si serve dalla cache e la si aggiorna in
     sottofondo (stale-while-revalidate), così l'apertura è immediata
     e la versione successiva è già pronta.
     ignoreSearch: le pagine chiedono "app.js?v=8" mentre in cache sta
     "app.js", quindi il confronto deve ignorare la query. */
  event.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const hit = await cache.match(request, { ignoreSearch: true });
    const network = fetch(request).then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    }).catch(() => null);
    return hit || (await network) || new Response('', { status: 504 });
  })());
});

/* consente alla pagina di forzare l'attivazione di una nuova versione */
self.addEventListener('message', (e) => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});
