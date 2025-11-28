self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.open("agrofacil-cache").then(cache =>
      cache.match(event.request).then(response => {
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            if (
              event.request.url.startsWith("http") &&
              networkResponse &&
              networkResponse.status === 200
            ) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => response);
        return response || fetchPromise;
      })
    )
  );
});