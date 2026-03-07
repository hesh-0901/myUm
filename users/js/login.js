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

const autoModal = document.getElementById("autoLoginModal");
const confirmBtn = document.getElementById("confirmAutoLogin");
const cancelBtn = document.getElementById("cancelAutoLogin");

const nameEl = document.getElementById("autoLoginName");
const usernameEl = document.getElementById("autoLoginUsername");
const avatarImg = document.getElementById("autoAvatarImg");
const avatarInitials = document.getElementById("autoAvatarInitials");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");


// ============================
// RESET INPUTS
// ============================

if(usernameInput) usernameInput.value = "";
if(passwordInput) passwordInput.value = "";


// ============================
// AUTO LOGIN CHECK
// ============================

const savedUser = localStorage.getItem("myum_user");

let autoUser = null;

if(savedUser){

try{
autoUser = JSON.parse(savedUser);
}catch(e){
localStorage.removeItem("myum_user");
}

}


// ============================
// AUTO LOGIN MODE
// ============================

if(autoUser){

if(loginMain){
loginMain.classList.add("hidden");
}

if(autoModal){
autoModal.classList.remove("hidden");
}

if(nameEl){
nameEl.textContent = `${autoUser.firstName} ${autoUser.lastName}`;
}

if(usernameEl){
usernameEl.textContent = `@${autoUser.username}`;
}


// avatar

if(autoUser.photoURL){

if(avatarImg){
avatarImg.src = autoUser.photoURL;
avatarImg.classList.remove("hidden");
}

}else{

const initials =
(autoUser.firstName?.charAt(0) || "") +
(autoUser.lastName?.charAt(0) || "");

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


// autre compte

if(cancelBtn){

cancelBtn.addEventListener("click", () => {

localStorage.removeItem("myum_user");

if(autoModal){
autoModal.classList.add("hidden");
}

if(loginMain){
loginMain.style.display = "block";
loginMain.classList.remove("hidden");
}

});

}

}else{

// afficher login normal

if(loginMain){
loginMain.style.display = "block";
loginMain.classList.remove("hidden");
}

}



// ============================
// TOGGLE PASSWORD
// ============================

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



// ============================
// LOGIN NORMAL
// ============================

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

const hashedInputPassword = await hashPassword(password);

if(hashedInputPassword !== userData.passwordHash){
alert("Mot de passe incorrect.");
return;
}

const userDoc = querySnapshot.docs[0];
const userData = userDoc.data();


// ============================
// VERIFICATION APPROBATION ADMIN
// ============================

if(userData.isActive === "pending"){

alert(
"Votre demande d'inscription est en cours d'étude.\n\nUn administrateur doit approuver votre compte.\nVous serez notifié sur WhatsApp."
);

return;

}


// ============================
// VERIFICATION MOT DE PASSE
// ============================

const hashedInputPassword = await hashPassword(password);


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

// stockage utilisateur mémorisé (pour connexion rapide)

localStorage.setItem(
"myum_user",
JSON.stringify(session)
);

// session active

sessionStorage.setItem(
"myum_session",
"active"
);

// redirect

window.location.href = "../public/dashboard.html";

}catch(error){

console.error("Erreur login :",error);
alert("Erreur lors de la connexion.");

}
});

}

});


// ============================
// HASH PASSWORD
// ============================

async function hashPassword(password){

const encoder = new TextEncoder();
const data = encoder.encode(password);

const hashBuffer = await crypto.subtle.digest("SHA-256",data);

const hashArray = Array.from(new Uint8Array(hashBuffer));

return hashArray
.map(b => b.toString(16).padStart(2,"0"))
.join("");

}
