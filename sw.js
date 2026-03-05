const CACHE_STATIC = "myum-static-v1";
const CACHE_DYNAMIC = "myum-dynamic-v1";

/* =========================
   FILES TO PRECACHE
========================= */

const STATIC_ASSETS = [

"/myUm/",
"/myUm/index.html",

"/myUm/assets/logo.png",

"/myUm/assets/icons/icon-192.png",
"/myUm/assets/icons/icon-512.png"

];


/* =========================
   INSTALL
========================= */

self.addEventListener("install", event => {

event.waitUntil(

caches.open(CACHE_STATIC)
.then(cache => cache.addAll(STATIC_ASSETS))

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


/* FIREBASE / API = NETWORK FIRST */

if(url.origin.includes("firestore") || url.origin.includes("googleapis")){

event.respondWith(networkFirst(req));
return;

}


/* IMAGES = CACHE FIRST */

if(req.destination === "image"){

event.respondWith(cacheFirst(req));
return;

}


/* HTML PAGES = NETWORK FIRST */

if(req.headers.get("accept").includes("text/html")){

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

if(cached) return cached;

const response = await fetch(request);

const cache = await caches.open(CACHE_DYNAMIC);

cache.put(request,response.clone());

return response;

}


/* =========================
   NETWORK FIRST
========================= */

async function networkFirst(request){

try{

const response = await fetch(request);

const cache = await caches.open(CACHE_DYNAMIC);

cache.put(request,response.clone());

return response;

}

catch{

const cached = await caches.match(request);

return cached;

}

}
