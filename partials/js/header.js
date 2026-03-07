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

// 🔒 Sécurité session
if (!storedUser) {
window.location.href = "/myUm/users/login.html";
return;
}

let user = JSON.parse(storedUser);

// démarrer le module notifications
initNotifications(user.id);


// ======================================
// RÉCUPÉRER LES DONNÉES FIRESTORE
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
user.firstName + " " + user.lastName;

}


// ======================================
// AVATAR PHOTO OU INITIALES (CACHE)
// ======================================

const profileBtn = document.getElementById("profileBtn");

if(profileBtn){

const cachedAvatar = localStorage.getItem("myum_avatar");


// ==============================
// AVATAR CACHE (instant)
// ==============================

if(cachedAvatar){

profileBtn.innerHTML =
`<img src="${cachedAvatar}"
class="w-full h-full object-cover rounded-full">`;

}


// ==============================
// TELECHARGER DEPUIS FIREBASE
// ==============================

else if(user.photoURL){

const img = new Image();

img.src = user.photoURL;

img.onload = () => {

const canvas = document.createElement("canvas");

canvas.width = img.width;
canvas.height = img.height;

const ctx = canvas.getContext("2d");

ctx.drawImage(img,0,0);

const base64 = canvas.toDataURL("image/jpeg",0.8);

// sauvegarde locale
localStorage.setItem("myum_avatar",base64);

profileBtn.innerHTML =
`<img src="${base64}"
class="w-full h-full object-cover rounded-full">`;

};

}


// ==============================
// INITIALS SI PAS DE PHOTO
// ==============================

else{

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
user.firstName.charAt(0) +
user.lastName.charAt(0);

}

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
