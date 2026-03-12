import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ======================================
ELEMENTS DOM
====================================== */

const statusEl = document.getElementById("status");
const profileEl = document.getElementById("profile");

/* ======================================
RECUPERATION ID URL
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

function renderProfile(data){

statusEl.className = "status success";
statusEl.textContent = "Profil vérifié ✔";

/* gestion photo dynamique */

const photo =
data.photoURL ||
data.photo ||
"/myUm/assets/default-avatar.png";

profileEl.innerHTML = `

<img
class="avatar"
src="${photo}"
alt="photo"
onerror="this.src='/myUm/assets/default-avatar.png'"
>

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

const snap = await getDoc(doc(db,"users",userId));

if(!snap.exists()){

showError("Profil introuvable");
return;

}

const data = snap.data();

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
