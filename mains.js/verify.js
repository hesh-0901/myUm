import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ======================================
ELEMENTS DOM
====================================== */

const statusEl = document.getElementById("status");
const profileEl = document.getElementById("profile");

/* ======================================
RECUPERATION ID DANS URL
====================================== */

const params = new URLSearchParams(window.location.search);
const userId = params.get("id");

/* ======================================
AFFICHAGE ERREUR
====================================== */

function showError(message){

statusEl.className = "status error";
statusEl.textContent = message;

profileEl.innerHTML = "";

}

/* ======================================
AFFICHAGE PROFIL
====================================== */

function renderProfile(data){function renderProfile(data){

statusEl.className = "status success";
statusEl.textContent = "Profil vérifié ✔";

profileEl.innerHTML = `

<img class="avatar"
src="${data.photoURL || "/myUm/assets/default-avatar.png"}"
alt="photo">

<div class="name">
${data.firstName || ""} ${data.lastName || ""}
</div>

<div class="role">
${data.fonction || ""}
</div>

<div class="username">
@${data.username || ""}
</div>

<div class="badge">
✓ Profil authentifié
</div>

`;

}

/* ======================================
CHARGEMENT PROFIL
====================================== */

async function loadProfile(){

try{

if(!userId){

showError("Lien de vérification invalide");
return;

}

/* récupération firestore */

const snap = await getDoc(doc(db,"users",userId));

if(!snap.exists()){

showError("Profil introuvable");
return;

}

const data = snap.data();

/* affichage profil */

renderProfile(data);

}
catch(error){

console.error(error);

showError("Erreur de vérification");

}

}

/* ======================================
INITIALISATION
====================================== */

document.addEventListener("DOMContentLoaded",loadProfile);
