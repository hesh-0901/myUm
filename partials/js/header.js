// ======================================
// HEADER MODULE
// ======================================

import { db } from "../../mains.js/firebase-config.js";
import { initNotifications } from "./notifications.js";

import {
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ======================================
// INIT HEADER
// ======================================

export async function initHeader() {

const storedUser = localStorage.getItem("myum_user");

// ======================================
// SECURITE SESSION
// ======================================

if (!storedUser) {
window.location.href = "/myUm/users/login.html";
return;
}

let user = JSON.parse(storedUser);


// ======================================
// DEMARRER LES NOTIFICATIONS
// ======================================

initNotifications(user.id);


// ======================================
// RAFRAICHIR LES DONNEES FIRESTORE
// ======================================

try {

const userRef = doc(db,"users",user.id);
const snap = await getDoc(userRef);

if (snap.exists()) {

const freshUser = snap.data();

user = {
...user,
...freshUser
};

localStorage.setItem("myum_user",JSON.stringify(user));

}

} catch(error){

console.error("Erreur récupération utilisateur :",error);

}


// ======================================
// NOM UTILISATEUR
// ======================================

const userNameEl = document.getElementById("userName");

if(userNameEl){

userNameEl.innerText =
`${user.firstName || ""} ${user.lastName || ""}`.trim();

}


// ======================================
// AVATAR PHOTO OU INITIALES
// ======================================

const profileBtn = document.getElementById("profileBtn");

if(profileBtn){

profileBtn.innerHTML = "";


// ==============================
// PHOTO FIREBASE
// ==============================

if(user.photoURL){

const img = document.createElement("img");

img.src = user.photoURL;

img.className =
"w-full h-full object-cover rounded-full";

img.loading = "eager";
img.decoding = "async";

img.onerror = () => {

renderInitials();

};

profileBtn.appendChild(img);

}


// ==============================
// INITIALS
// ==============================

else{

renderInitials();

}

}


// ======================================
// RENDU INITIALS
// ======================================

function renderInitials(){

profileBtn.classList.add(
"bg-gradient-to-br",
"from-primary",
"to-medium",
"text-white",
"flex",
"items-center",
"justify-center",
"font-semibold"
);

profileBtn.innerText =
`${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`;

}


// ======================================
// DROPDOWN PROFIL
// ======================================

if(profileBtn){

profileBtn.addEventListener("click",()=>{

const dropdown =
document.getElementById("profileDropdown");

if(dropdown){

dropdown.classList.toggle("hidden");

}

});

}


// ======================================
// LOGOUT
// ======================================

const logoutBtn = document.getElementById("logoutBtn");

if(logoutBtn){

logoutBtn.addEventListener("click",()=>{

sessionStorage.removeItem("myum_session");

localStorage.removeItem("myum_user");
localStorage.removeItem("myum_avatar");

window.location.href = "/myUm/users/login.html";

});

}

}
