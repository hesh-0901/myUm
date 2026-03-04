const CACHE_NAME = "myum-cache-v1";

const urlsToCache = [
  "/myUm/",
  "/myUm/index.html",
  "/myUm/assets/logo.png"
];

/* INSTALL */

self.addEventListener("install", event => {

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );

  self.skipWaiting();

});


/* ACTIVATE */

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys().then(keys => {

      return Promise.all(

        keys.map(key => {

          if(key !== CACHE_NAME){
            return caches.delete(key);
          }

        })

      );

    })

  );

  self.clients.claim();

});


/* FETCH */

self.addEventListener("fetch", event => {

  event.respondWith(

    caches.match(event.request)
      .then(response => {

        if(response){
          return response;
        }

        return fetch(event.request);

      })

  );

});
