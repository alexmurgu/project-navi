const BUILD_ID = new URL(self.location.href).searchParams.get("v") || "v1";
const CACHE_NAME = `project-navi-pwa-${BUILD_ID}`;
const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/icon.svg",
  "/navi-touch-icon.png",
  "/apple-touch-icon.png",
  "/apple-touch-icon-120.png",
  "/apple-touch-icon-152.png",
  "/apple-touch-icon-167.png",
  "/apple-touch-icon-precomposed.png",
  "/ios-splash-828x1792.png",
  "/ios-splash-1125x2436.png",
  "/ios-splash-1170x2532.png",
  "/ios-splash-1179x2556.png",
  "/ios-splash-1290x2796.png",
  "/icons/icon-180.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" }).catch(() => caches.match(event.request))
    );
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
    );
    return;
  }

  if (url.origin === self.location.origin) {
    if (!url.pathname.startsWith("/assets/") && !STATIC_ASSETS.includes(url.pathname)) {
      event.respondWith(fetch(event.request, { cache: "no-store" }));
      return;
    }

    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;

        return fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
            }
            return response;
          })
          .catch(() => cached);
      })
    );
  }
});
