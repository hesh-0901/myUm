// ======================================
// INSTALL APP MODULE (PROFILE PAGE)
// ======================================

export function initInstallApp(currentUserId){

const btn = document.getElementById("installAppBtn");
const modal = document.getElementById("appModal");
const content = document.getElementById("modalContent");
const closeBtn = document.getElementById("closeAppModal");
const installBtn = document.getElementById("installBtn");
const versionEl = document.getElementById("appVersion");

if(!btn) return;

let state = "install";

// ===============================
// DETECTION INSTALL
// ===============================

const isInstalled =
window.matchMedia('(display-mode: standalone)').matches
|| window.navigator.standalone === true;


// ===============================
// VERSION SERVICE WORKER
// ===============================

if(navigator.serviceWorker){

navigator.serviceWorker.ready.then(reg=>{

if(reg.active){

reg.active.postMessage("GET_VERSION");

navigator.serviceWorker.addEventListener("message", event=>{

if(event.data.type === "VERSION"){

const swVersion = event.data.version;
versionEl.innerText = "Version " + swVersion;

const localVersion = localStorage.getItem("app_version");

if(!localVersion){
localStorage.setItem("app_version", swVersion);
}

// ===============================
// DETERMINE STATE
// ===============================

if(!isInstalled){
state = "install";
}
else if(localVersion && localVersion !== swVersion){
state = "update";
}
else{
state = "upToDate";
}

// ===============================
// RENDER
// ===============================

renderButton(state, swVersion);

// sauvegarde
localStorage.setItem("app_version", swVersion);

}

});

}

});

}


// ===============================
// RENDER BUTTON
// ===============================

function renderButton(state, version){

switch(state){

case "install":

btn.innerHTML = `
<div class="flex items-center gap-3">
<i class="bi bi-download text-lg"></i>
<span class="text-sm font-medium">
Télécharger l’application
</span>
</div>
`;

btn.classList.remove("bg-accent");
btn.classList.add("bg-primary");

break;


case "update":

btn.innerHTML = `
<div class="flex items-center gap-3">
<i class="bi bi-arrow-repeat text-lg"></i>
<span class="text-sm font-medium">
Mettre à jour (${version})
</span>
</div>
`;

btn.classList.remove("bg-primary");
btn.classList.add("bg-accent");

// notification anti-spam
if(localStorage.getItem("update_notified") !== version){

import("/myUm/notifications/update.js").then(module=>{
module.pushUpdateNotification(currentUserId, version);
});

localStorage.setItem("update_notified", version);
}

break;


case "upToDate":

btn.innerHTML = `
<div class="flex items-center gap-3">
<i class="bi bi-check-circle text-lg"></i>
<span class="text-sm font-medium">
App à jour (${version})
</span>
</div>
`;

btn.classList.remove("bg-accent");
btn.classList.add("bg-primary");

break;

}

}


// ===============================
// CLICK HANDLER UNIQUE
// ===============================

btn.onclick = async ()=>{

switch(state){

case "install":

modal.classList.remove("hidden");
modal.classList.add("flex");

setTimeout(()=>{
content.classList.remove("scale-90","opacity-0");
content.classList.add("scale-100","opacity-100");
},10);

break;


case "update":

location.reload();

break;


case "upToDate":

btn.innerHTML = `
<div class="flex items-center gap-3">
<i class="bi bi-arrow-repeat animate-spin text-lg"></i>
<span class="text-sm font-medium">
Vérification...
</span>
</div>
`;

await new Promise(r=>setTimeout(r,1200));

btn.innerHTML = `
<div class="flex items-center gap-3">
<i class="bi bi-check-circle text-lg"></i>
<span class="text-sm font-medium">
Application à jour
</span>
</div>
`;

break;

}

};


// ===============================
// MODAL
// ===============================

closeBtn?.addEventListener("click", closeModal);

modal?.addEventListener("click",(e)=>{
if(e.target === modal) closeModal();
});

function closeModal(){

content.classList.add("scale-90","opacity-0");

setTimeout(()=>{
modal.classList.add("hidden");
modal.classList.remove("flex");
},200);

}


// ===============================
// INSTALL ACTION
// ===============================

installBtn.onclick = async ()=>{

if(!window.deferredPrompt){
alert("Utilisez le menu du navigateur pour installer");
return;
}

window.deferredPrompt.prompt();

const choice = await window.deferredPrompt.userChoice;

if(choice.outcome === "accepted"){
closeModal();
navigator.vibrate?.(50);
}

window.deferredPrompt = null;

};

}
