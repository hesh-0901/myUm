export function initInstallApp({
  userId,
  button,
  modal,
  modalContent,
  closeBtn,
  installBtn,
  versionEl
}){

if(!button) return;

let state = "install";

const isInstalled =
window.matchMedia('(display-mode: standalone)').matches
|| window.navigator.standalone === true;


// ===============================
// SERVICE WORKER VERSION
// ===============================

if(navigator.serviceWorker){

navigator.serviceWorker.ready.then(reg=>{

if(reg.active){

reg.active.postMessage("GET_VERSION");

navigator.serviceWorker.addEventListener("message", event=>{

if(event.data.type === "VERSION"){

const swVersion = event.data.version;
if(versionEl) versionEl.innerText = "Version " + swVersion;

const localVersion = localStorage.getItem("app_version");

if(!localVersion){
localStorage.setItem("app_version", swVersion);
}

// STATE
if(!isInstalled){
state = "install";
}
else if(localVersion && localVersion !== swVersion){
state = "update";
}
else{
state = "upToDate";
}

renderButton(state, swVersion);

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

button.innerHTML = `
<div class="flex items-center gap-3">
<i class="bi bi-download text-lg"></i>
<span class="text-sm font-medium">
Télécharger l’application
</span>
</div>
`;

button.classList.remove("bg-accent");
button.classList.add("bg-primary");

break;


case "update":

button.innerHTML = `
<div class="flex items-center gap-3">
<i class="bi bi-arrow-repeat text-lg"></i>
<span class="text-sm font-medium">
Mettre à jour (${version})
</span>
</div>
`;

button.classList.remove("bg-primary");
button.classList.add("bg-accent");

if(localStorage.getItem("update_notified") !== version){

import("/myUm/notifications/update.js").then(module=>{
module.pushUpdateNotification(userId, version);
});

localStorage.setItem("update_notified", version);
}

break;


case "upToDate":

button.innerHTML = `
<div class="flex items-center gap-3">
<i class="bi bi-check-circle text-lg"></i>
<span class="text-sm font-medium">
App à jour (${version})
</span>
</div>
`;

button.classList.remove("bg-accent");
button.classList.add("bg-primary");

break;

}

}


// ===============================
// CLICK HANDLER
// ===============================

button.onclick = async ()=>{

switch(state){

case "install":

if(!modal) return;

modal.classList.remove("hidden");
modal.classList.add("flex");

setTimeout(()=>{
modalContent.classList.remove("scale-90","opacity-0");
modalContent.classList.add("scale-100","opacity-100");
},10);

break;


case "update":

location.reload();
break;


case "upToDate":

button.innerHTML = `
<div class="flex items-center gap-3">
<i class="bi bi-arrow-repeat animate-spin text-lg"></i>
<span class="text-sm font-medium">
Vérification...
</span>
</div>
`;

await new Promise(r=>setTimeout(r,1200));

button.innerHTML = `
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
// MODAL EVENTS
// ===============================

closeBtn?.addEventListener("click", closeModal);

modal?.addEventListener("click",(e)=>{
if(e.target === modal) closeModal();
});

function closeModal(){

modalContent.classList.add("scale-90","opacity-0");

setTimeout(()=>{
modal.classList.add("hidden");
modal.classList.remove("flex");
},200);

}


// ===============================
// INSTALL ACTION
// ===============================

if(installBtn){
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
  }
