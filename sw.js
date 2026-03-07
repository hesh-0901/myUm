/* =========================
   VERSIONING
========================= */

const VERSION = "v9";

const CACHE_STATIC = "myum-static-" + VERSION;
const CACHE_DYNAMIC = "myum-dynamic-" + VERSION;


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
.then(cache => {

console.log("SW: caching static assets");

return cache.addAll(STATIC_ASSETS);

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

const cache = await caches.open(CACHE_DYNAMIC);

cache.put(request,response.clone());

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

const cache = await caches.open(CACHE_DYNAMIC);

cache.put(request,response.clone());

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
// ===============================
// AGE AUTO CALCUL
// ===============================
function initAgeCalculator() {

  const birthInput = document.getElementById("birthday");
  const ageInput = document.getElementById("age");

  if (!birthInput || !ageInput) return;

  birthInput.addEventListener("change", () => {

    const birthDate = new Date(birthInput.value);

    if (isNaN(birthDate)) return;

    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    ageInput.value = age;

  });

}

