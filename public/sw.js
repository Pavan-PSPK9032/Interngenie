const CACHE_VERSION = "v2";
const STATIC_CACHE = `interngenie-static-${CACHE_VERSION}`;
const API_CACHE = `interngenie-api-${CACHE_VERSION}`;
const NAVIGATION_CACHE = `interngenie-nav-${CACHE_VERSION}`;
const OFFLINE_PAGE = "/offline.html";

const MAX_STATIC_ENTRIES = 50;
const MAX_API_ENTRIES = 50;

const APP_SHELL = ["/", "/icon.svg", "/logo.svg"];

const STATIC_ASSET_PATTERNS = [
  /\.(?:css|js)$/,
  /\.(?:png|jpe?g|gif|webp|svg|ico)$/,
  /\.(?:woff2?|ttf|eot|otf)$/,
];

const API_PATH_PATTERNS = [
  /\/api\//,
  /\/trpc\//,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(APP_SHELL);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const validCaches = new Set([STATIC_CACHE, API_CACHE, NAVIGATION_CACHE]);

      await Promise.all(
        cacheNames
          .filter((name) => !validCaches.has(name))
          .map((name) => caches.delete(name))
      );

      const clients = await self.clients.matchAll();
      for (const client of clients) {
        client.postMessage({ type: "SW_ACTIVATED", version: CACHE_VERSION });
      }

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (isApiRequest(url.pathname)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  event.respondWith(networkFirst(request, STATIC_CACHE));
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-queue") {
    event.waitUntil(processSyncQueue());
  }
});

self.addEventListener("message", (event) => {
  const { type, payload } = event.data;

  if (type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (type === "CACHE_URLS" && Array.isArray(payload)) {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        await Promise.all(
          payload.map((url) =>
            fetch(url)
              .then((response) => {
                if (response.ok) return cache.put(url, response);
              })
              .catch(() => {})
          )
        );
      })()
    );
  }

  if (type === "CLEAR_API_CACHE") {
    event.waitUntil(caches.delete(API_CACHE));
  }
});

async function handleNavigation(request) {
  try {
    const networkResponse = await fetchWithTimeout(request, 10000);
    if (networkResponse.ok) {
      const cache = await caches.open(NAVIGATION_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    const offlineResponse = await caches.match(OFFLINE_PAGE);
    if (offlineResponse) return offlineResponse;

    return new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetchWithTimeout(request, 15000);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await trimCache(cacheName, MAX_STATIC_ENTRIES);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response("Asset unavailable offline", { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetchWithTimeout(request, 10000);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await trimCache(cacheName, MAX_API_ENTRIES);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    return new Response(JSON.stringify({ error: "Network unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length <= maxEntries) return;

  const entriesToDelete = keys.length - maxEntries;
  await Promise.all(keys.slice(0, entriesToDelete).map((key) => cache.delete(key)));
}

function isStaticAsset(pathname) {
  return STATIC_ASSET_PATTERNS.some((pattern) => pattern.test(pathname));
}

function isApiRequest(pathname) {
  return API_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

async function processSyncQueue() {
  try {
    const db = await openDB();
    const tx = db.transaction("sync-queue", "readwrite");
    const store = tx.objectStore("sync-queue");
    const requests = await getAllFromStore(store);

    for (const item of requests) {
      try {
        const response = await fetch(item.url, {
          method: item.method || "POST",
          headers: item.headers || { "Content-Type": "application/json" },
          body: item.body ? JSON.stringify(item.body) : undefined,
        });

        if (response.ok) {
          store.delete(item.id);
        }
      } catch {
        break;
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // IndexedDB may not be available; fail gracefully.
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("interngenie-sync", 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("sync-queue")) {
        db.createObjectStore("sync-queue", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
