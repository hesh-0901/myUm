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


// ================================
// 🔐 AUTO LOGIN CHECK
// ================================

const savedUser = localStorage.getItem("myum_user");

if(savedUser){

const user = JSON.parse(savedUser);

// cacher login
if(loginMain){
loginMain.classList.add("hidden");
}

// afficher modal
if(autoModal){
autoModal.classList.remove("hidden");
}

// nom
if(nameEl){
nameEl.textContent = `${user.firstName} ${user.lastName}`;
}

// username
if(usernameEl){
usernameEl.textContent = `@${user.username}`;
}

// avatar
if(user.photoURL){

avatarImg.src = user.photoURL;
avatarImg.classList.remove("hidden");

}else{

const initials =
(user.firstName?.charAt(0) || "") +
(user.lastName?.charAt(0) || "");

avatarInitials.textContent = initials.toUpperCase();

}


// continuer session
if(confirmBtn){

confirmBtn.addEventListener("click", () => {

window.location.href = "../public/dashboard.html";

});

}

// autre compte
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



// ================================
// 👁️ Toggle password
// ================================

if(passwordToggle){

passwordToggle.addEventListener("click", () => {

const input = document.getElementById("password");

if(!input) return;

if(input.type === "password"){

input.type = "text";
passwordToggle.classList.replace("bi-eye","bi-eye-slash");

}else{

input.type = "password";
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

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const rememberCheck = document.getElementById("rememberMe");

if(!usernameInput || !passwordInput){
alert("Erreur formulaire.");
return;
}

// champs toujours vides à ouverture
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


// redirect

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
