/* =========================
   VERSIONING
========================= */

const VERSION = "v1.35.6.1.3.4"; 
/* 
Enoch MWALIMU
découpage chat-room.js : fixing bugs d'affichage
upgrading chat Maintenance for dashboard bouton ==> DONE
*/

const CACHE_STATIC = "myum-static-" + VERSION;
const CACHE_DYNAMIC = "myum-dynamic-" + VERSION;


/* =========================
   FILES TO PRECACHE
========================= */

const STATIC_ASSETS = [

"/myUm/",
"/myUm/index.html",

/* assets */
"/myUm/assets/logo.png",
"/myUm/assets/icons/icon-192.png",
"/myUm/assets/icons/icon-512.png",

/* users */
"/myUm/users/login.html",
"/myUm/users/register.html",
"/myUm/users/profile.html",
"/myUm/users/presence.html",
"/myUm/users/enreg.html",

/* chat */
"/myUm/chat/room.html",
"/myUm/chat/dashboard.html",
/* admin */
"/myUm/admin/annonce-admin.html",
"/myUm/admin/open-room.html",
"/myUm/admin/presence-details.html",
"/myUm/admin/presence-management.html",
"/myUm/admin/user-details.html",
"/myUm/admin/users-management.html",
/* JS CRITIQUE */
"/myUm/admin/js/users-management.js",


   /* partials */
"/myUm/partials/header.html"

];


/* =========================
   INSTALL
========================= */

self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_STATIC)
    .then(async cache => {

      console.log("SW: caching static assets");

      await Promise.all(
        STATIC_ASSETS.map(async (url) => {
          try {
            await cache.add(url);
          } catch (err) {
            console.warn("❌ Cache fail:", url);
          }
        })
      );

    })

  );

  self.skipWaiting();

});

/* =========================
   ACTIVATE
========================= */

self.addEventListener("activate", event => {

event.waitUntil(

caches.keys().then(keys => {

return Promise.all(

keys.map(key => {

if(key !== CACHE_STATIC && key !== CACHE_DYNAMIC){

console.log("SW: deleting old cache", key);

return caches.delete(key);

}

})

);

})

);

self.clients.claim();

});


/* =========================
   FETCH STRATEGY
========================= */

self.addEventListener("fetch", event => {

const req = event.request;
const url = new URL(req.url);


/* IGNORER EXTENSIONS ET CDN EXTERNES */

if(
url.protocol === "chrome-extension:" ||
url.origin !== location.origin
){
return;
}


/* FIREBASE / API = NETWORK FIRST */

if(
url.origin.includes("firestore") ||
url.origin.includes("googleapis")
){

event.respondWith(networkFirst(req));
return;

}


/* IMAGES = CACHE FIRST */

if(req.destination === "image"){

event.respondWith(cacheFirst(req));
return;

}


/* HTML PAGES = NETWORK FIRST */

if(req.headers.get("accept") &&
req.headers.get("accept").includes("text/html")){

event.respondWith(networkFirst(req));
return;

}


/* DEFAULT */

event.respondWith(cacheFirst(req));

});


/* =========================
   CACHE FIRST
========================= */

async function cacheFirst(request){

const cached = await caches.match(request);

if(cached){
return cached;
}

try{

const response = await fetch(request);

if(
response &&
(response.status === 200 || response.status === 0)
){

const cache = await caches.open(CACHE_DYNAMIC);

cache.put(request,response.clone());

}

return response;

}

catch(error){

return new Response("Offline", {
status:503,
statusText:"Offline"
});

}

}


/* =========================
   NETWORK FIRST
========================= */

async function networkFirst(request){

try{

const response = await fetch(request);

if(
response &&
(response.status === 200 || response.status === 0)
){

const cache = await caches.open(CACHE_DYNAMIC);

cache.put(request,response.clone());

}

return response;

}

catch(error){

const cached = await caches.match(request);

if(cached){
return cached;
}

return new Response("Offline",{
status:503,
statusText:"Offline"
});

}

}

self.addEventListener("message", event => {

  if (event.data === "SKIP_WAITING") {
    console.log("⚡ SKIP WAITING RECEIVED");
    self.skipWaiting();
  }

  if (event.data === "GET_VERSION") {
    event.source.postMessage({
      type: "VERSION",
      version: VERSION
    });
  }

});
/* =========================
   GET VERSION (CLIENT)
========================= */

self.addEventListener("message", event => {

  if(event.data === "GET_VERSION"){

    event.source.postMessage({
      type: "VERSION",
      version: VERSION
    });

  }

});
