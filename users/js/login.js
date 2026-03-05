// users/js/login.js

import { db } from "../../mains.js/firebase-config.js";

import {
collection,
query,
where,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {

const form = document.getElementById("loginForm");
const passwordToggle = document.querySelector(".togglePassword");
const loginMain = document.getElementById("loginMain");

// modal auto login
const autoModal = document.getElementById("autoLoginModal");
const confirmBtn = document.getElementById("confirmAutoLogin");
const cancelBtn = document.getElementById("cancelAutoLogin");

// avatar
const nameEl = document.getElementById("autoLoginName");
const usernameEl = document.getElementById("autoLoginUsername");
const avatarImg = document.getElementById("autoAvatarImg");
const avatarInitials = document.getElementById("autoAvatarInitials");

// inputs
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");


// ================================
// 🔐 RESET CHAMPS (toujours vides)
// ================================

if(usernameInput) usernameInput.value = "";
if(passwordInput) passwordInput.value = "";


// ================================
// 🔐 AUTO LOGIN CHECK
// ================================

const savedUser = localStorage.getItem("myum_user");

if(savedUser){

let user = null;

try{
user = JSON.parse(savedUser);
}catch{
localStorage.removeItem("myum_user");
}

if(user){

// cacher complètement le login
if(loginMain){
loginMain.classList.add("hidden");
}

// afficher modal connexion rapide
if(autoModal){
autoModal.classList.remove("hidden");
}

// afficher nom
if(nameEl){
nameEl.textContent = `${user.firstName} ${user.lastName}`;
}

// afficher username
if(usernameEl){
usernameEl.textContent = `@${user.username}`;
}

// avatar photo
if(user.photoURL){

if(avatarImg){
avatarImg.src = user.photoURL;
avatarImg.classList.remove("hidden");
}

}else{

const initials =
(user.firstName?.charAt(0) || "") +
(user.lastName?.charAt(0) || "");

if(avatarInitials){
avatarInitials.textContent = initials.toUpperCase();
}

}

// continuer session
if(confirmBtn){

confirmBtn.addEventListener("click", () => {

window.location.href = "../public/dashboard.html";

});

}

// utiliser autre compte
if(cancelBtn){

cancelBtn.addEventListener("click", () => {

localStorage.removeItem("myum_user");

if(autoModal){
autoModal.classList.add("hidden");
}

if(loginMain){
loginMain.classList.remove("hidden");
}

});

}

}

}


// ================================
// 👁️ Toggle password
// ================================

if(passwordToggle){

passwordToggle.addEventListener("click", () => {

if(!passwordInput) return;

if(passwordInput.type === "password"){

passwordInput.type = "text";
passwordToggle.classList.replace("bi-eye","bi-eye-slash");

}else{

passwordInput.type = "password";
passwordToggle.classList.replace("bi-eye-slash","bi-eye");

}

});

}


// ================================
// 🔐 LOGIN NORMAL
// ================================

if(form){

form.addEventListener("submit", async (e) => {

e.preventDefault();

const rememberCheck = document.getElementById("rememberMe");

if(!usernameInput || !passwordInput){
alert("Erreur formulaire.");
return;
}

const username = usernameInput.value.trim().toUpperCase();
const password = passwordInput.value;
const remember = rememberCheck ? rememberCheck.checked : false;

if(!username || !password){

alert("Veuillez remplir tous les champs.");
return;

}

try{

const q = query(
collection(db,"users"),
where("username","==",username)
);

const querySnapshot = await getDocs(q);

if(querySnapshot.empty){

alert("Utilisateur introuvable.");
return;

}

const userDoc = querySnapshot.docs[0];
const userData = userDoc.data();


// hash password

const hashedInputPassword = await hashPassword(password);

if(hashedInputPassword !== userData.passwordHash){

alert("Mot de passe incorrect.");
return;

}


// session utilisateur

const session = {

id:userDoc.id,
username:userData.username,
firstName:userData.firstName,
lastName:userData.lastName,
chorale:userData.chorale,
role:userData.role,
photoURL:userData.photoURL || null

};


// remember me

if(remember){

localStorage.setItem(
"myum_user",
JSON.stringify(session)
);

}else{

sessionStorage.setItem(
"myum_user",
JSON.stringify(session)
);

}


// redirection

window.location.href = "../public/dashboard.html";

}
catch(error){

console.error("Erreur login :",error);
alert("Erreur lors de la connexion.");

}

});

}

});


// ================================
// 🔐 HASH PASSWORD
// ================================

async function hashPassword(password){

const encoder = new TextEncoder();
const data = encoder.encode(password);

const hashBuffer = await crypto.subtle.digest("SHA-256",data);

const hashArray = Array.from(new Uint8Array(hashBuffer));

return hashArray
.map(b => b.toString(16).padStart(2,"0"))
.join("");

}
