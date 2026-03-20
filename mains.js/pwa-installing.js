/*mains.js/pwa-install.js*/
// ======================================
// PWA INSTALL + SERVICE WORKER CORE
// ======================================

let deferredPrompt = null;


// ======================================
// REGISTER SERVICE WORKER
// ======================================

export async function registerServiceWorker() {

  if (!("serviceWorker" in navigator)) return;

  try {

    const reg = await navigator.serviceWorker.register("/myUm/sw.js");

    console.log("SW ready");

    return reg;

  } catch (err) {

    console.error("SW error:", err);

  }

}


// ======================================
// DEVICE DETECTION
// ======================================

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
}


// ======================================
// CAPTURE INSTALL EVENT
// ======================================

export function initInstallPromptListener() {

  window.addEventListener("beforeinstallprompt", (e) => {

    console.log("PWA install available");

    e.preventDefault();

    deferredPrompt = e;

  });

}


// ======================================
// TRIGGER INSTALL
// ======================================

export async function triggerInstall() {

  if (!deferredPrompt) {
    alert("Utilisez le menu du navigateur puis 'Installer l'application'.");
    return;
  }

  deferredPrompt.prompt();

  const choice = await deferredPrompt.userChoice;

  console.log("Install result:", choice.outcome);

  deferredPrompt = null;

}


// ======================================
// IOS INSTRUCTIONS
// ======================================

export function getIOSInstallInstructions() {

  return `
    Pour installer l'app :<br><br>
    <i class='bi bi-box-arrow-up'></i> puis 
    <b>Ajouter à l’écran d’accueil</b>
  `;

}


// ======================================
// INIT GLOBAL PWA
// ======================================

export function initPWA() {

  registerServiceWorker();

  initInstallPromptListener();

}
