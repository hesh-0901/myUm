let deferredPrompt;

const modal = document.getElementById("installModal");
const installBtn = document.getElementById("installBtn");
const installText = document.getElementById("installText");
const closeInstall = document.getElementById("closeInstall");


function isIOS(){
return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(){
return window.matchMedia('(display-mode: standalone)').matches
|| window.navigator.standalone === true;
}


/* ANDROID / WINDOWS */

window.addEventListener("beforeinstallprompt",(e)=>{

e.preventDefault();
deferredPrompt = e;

if(!isStandalone()){
showModal();
}

});


/* INSTALL CLICK */

installBtn?.addEventListener("click", async ()=>{

if(!deferredPrompt) return;

deferredPrompt.prompt();

await deferredPrompt.userChoice;

hideModal();

});


/* IOS MESSAGE */

window.addEventListener("load",()=>{

if(isIOS() && !isStandalone()){

installBtn.style.display="none";

if(installText){
  installText.innerHTML = `
  Sur iPhone :<br><br><b>Partager</b>
  <i class="bi bi-box-arrow-up"></i><br>
  puis <b>Ajouter à l’écran d’accueil</b>
  `;
}

showModal();

}

});


closeInstall?.addEventListener("click", hideModal);


function showModal(){
modal?.classList.remove("hidden");
modal?.classList.add("flex");
}

function hideModal(){
modal?.classList.add("hidden");
}

window.addEventListener("beforeinstallprompt", (e)=>{
  console.log("🔥 INSTALL EVENT OK");
});
