// Service worker: keeps the site usable offline in the kitchen.
// - Pages: network first (always fresh when online), saved copy when offline,
//   and a friendly offline page for pages never opened before.
// - Build assets and images: cache first (their file names change on every release).
const CACHE = "recipe-scaler-v1";
const SCOPE = new URL(self.registration.scope).pathname; // "/" or "/Recipe_Scaler/"
const OFFLINE_PAGE = `${SCOPE}offline/`;
const PRECACHE = [SCOPE, OFFLINE_PAGE, `${SCOPE}saved/`, `${SCOPE}shopping-list/`, `${SCOPE}pantry/`, `${SCOPE}import/`, `${SCOPE}my-recipes/`];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request, fallbackToOfflinePage) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: !fallbackToOfflinePage });
    if (cached) return cached;
    if (fallbackToOfflinePage) return (await cache.match(OFFLINE_PAGE)) ?? Response.error();
    return Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, true));
  } else if (/\/(_next\/static|images|icons)\//.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else {
    // Page data Next.js fetches for in-app navigation.
    event.respondWith(networkFirst(request, false));
  }
});
