// users/js/login.js

import { db } from "../../mains.js/firebase-config.js";

import {
collection,
query,
where,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {

const form = document.getElementById("loginForm");
const passwordToggle = document.querySelector(".togglePassword");

// éléments modal auto login
const autoModal = document.getElementById("autoLoginModal");
const autoText = document.getElementById("autoLoginText");
const confirmBtn = document.getElementById("confirmAutoLogin");
const cancelBtn = document.getElementById("cancelAutoLogin");

// 🔐 AUTO LOGIN CHECK
const savedUserLocal = localStorage.getItem("myum_user");
const savedUserSession = sessionStorage.getItem("myum_user");

let savedUser = savedUserLocal || savedUserSession;

if (savedUser) {

const user = JSON.parse(savedUser);

// afficher message confirmation
if(autoModal && autoText){

autoText.textContent = `Êtes-vous ${user.firstName} ${user.lastName} ?`;
autoModal.classList.remove("hidden");

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
sessionStorage.removeItem("myum_user");

if(autoModal){
autoModal.classList.add("hidden");
}

});

}

}

// 👁️ Toggle password

if(passwordToggle){

passwordToggle.addEventListener("click", function(){

const input = document.getElementById("password");

if(!input) return;

if(input.type === "password"){

input.type = "text";
this.classList.replace("bi-eye","bi-eye-slash");

}else{

input.type = "password";
this.classList.replace("bi-eye-slash","bi-eye");

}

});

}

// 🔐 LOGIN NORMAL

if(form){

form.addEventListener("submit", async function (e) {

e.preventDefault();

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const rememberCheck = document.getElementById("rememberMe");

if(!usernameInput || !passwordInput){
alert("Erreur formulaire.");
return;
}

const username = usernameInput.value.trim().toUpperCase();
const password = passwordInput.value;
const remember = rememberCheck ? rememberCheck.checked : false;

if (!username || !password) {
alert("Veuillez remplir tous les champs.");
return;
}

try {

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

// 🔐 HASH PASSWORD
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
role:userData.role
};

// sauvegarde session

if(remember){

localStorage.setItem("myum_user",JSON.stringify(session));

}else{

sessionStorage.setItem("myum_user",JSON.stringify(session));

}

// redirection
window.location.href="../public/dashboard.html";

}
catch(error){

console.error("Erreur login :",error);
alert("Erreur lors de la connexion.");

}

});

}

});

// 🔐 HASH SHA256

async function hashPassword(password){

const encoder = new TextEncoder();
const data = encoder.encode(password);

const hashBuffer = await crypto.subtle.digest("SHA-256",data);

const hashArray = Array.from(new Uint8Array(hashBuffer));

return hashArray
.map(b => b.toString(16).padStart(2,"0"))
.join("");

}
