//users/js/login.js

import { db } from "../../mains.js/firebase-config.js";

import {
collection,
query,
where,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// =============================
// DOM READY
// ============================

if(document.readyState === "loading"){
document.addEventListener("DOMContentLoaded", initLogin);
}else{
initLogin();
}

function initLogin(){

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

let autoUser = null;


try{

const savedUser = localStorage.getItem("myum_user");

if(savedUser){
autoUser = JSON.parse(savedUser);
}

}catch(e){

console.error("Erreur parsing user :", e);
localStorage.removeItem("myum_user");
autoUser = null;

}


// ============================
// AUTO LOGIN MODE
// ============================

if(autoUser){

if(loginMain){
loginMain.style.display = "none";
}

if(autoModal){
autoModal.classList.remove("hidden");
}


// nom utilisateur

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
}

});

}

}else{

// afficher login normal

if(loginMain){
loginMain.style.display = "block";
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

const submitBtn = form.querySelector("button");

try {

// ============================
// UI STATE
// ============================

if(submitBtn) submitBtn.disabled = true;

const rememberCheck = document.getElementById("rememberMe");


// ============================
// VALIDATION INPUTS
// ============================

if(!usernameInput || !passwordInput){

alert("Erreur formulaire.");
if(submitBtn) submitBtn.disabled = false;
return;

}

const username = usernameInput.value
.trim()
.replace(/\s/g,"")
.toUpperCase();

const password = passwordInput.value;

if(!username || !password){

alert("Veuillez remplir tous les champs.");
if(submitBtn) submitBtn.disabled = false;
return;

}


// ============================
// HASH PASSWORD (OBLIGATOIRE)
// ============================

const hashedInputPassword = await hashPassword(password);


// ============================
// FIRESTORE QUERY
// ============================

const q = query(
collection(db,"users"),
where("username","==",username)
);

const querySnapshot = await getDocs(q);

if(querySnapshot.empty){

alert("Utilisateur introuvable.");
if(submitBtn) submitBtn.disabled = false;
return;

}

const userDoc = querySnapshot.docs[0];
const userData = userDoc.data();

// ============================
// VERIFICATION APPROBATION ADMIN
// ============================

if(!userData.isActive || userData.isActive === "pending"){

Swal.fire({
title: "Demande envoyée",
html: `
<div style="font-size:14px;line-height:1.6;color:#555">

<p>
Votre inscription a bien été enregistrée.
</p>

<p style="margin-top:8px">
Un administrateur doit maintenant valider votre compte.
</p>

<p style="margin-top:14px;font-weight:500;color:#1A3668">
Vous serez notifié sur WhatsApp dès l’activation.
</p>

</div>
`,
icon: "success",
confirmButtonText: "Compris",
confirmButtonColor: "#1A3668",
background: "#ffffff",
color: "#111",
width: 380,
padding: "1.5rem",
buttonsStyling: true,
allowOutsideClick: false,
allowEscapeKey: false
});

if(submitBtn) submitBtn.disabled = false;

return;

}


// ============================
// VERIFICATION PASSWORD
// ============================

if(hashedInputPassword !== userData.passwordHash){

alert("Mot de passe incorrect.");
if(submitBtn) submitBtn.disabled = false;
return;

}


// ============================
// SESSION
// ============================

const session = {

id: userDoc.id,
username: userData.username,
firstName: userData.firstName,
lastName: userData.lastName,
chorale: userData.chorale,
role: userData.role,
photoURL: userData.photoURL || null

};


// ============================
// STORAGE
// ============================

localStorage.setItem(
"myum_user",
JSON.stringify(session)
);


// ============================
// REDIRECT
// ============================

window.location.href = "../public/dashboard.html";


}catch(error){

console.error("Erreur login :", error);
alert("Erreur lors de la connexion.");

if(submitBtn) submitBtn.disabled = false;

}

});

}


// ============================
// VERIFICATION MOT DE PASSE
// ============================

if(hashedInputPassword !== userData.passwordHash){

alert("Mot de passe incorrect.");

if(submitBtn) submitBtn.disabled = false;

return;

}


// ============================
// SESSION UTILISATEUR
// ============================

const session = {

id:userDoc.id,
username:userData.username,
firstName:userData.firstName,
lastName:userData.lastName,
chorale:userData.chorale,
role:userData.role,
photoURL:userData.photoURL || null

};


// stockage session

localStorage.setItem(
"myum_user",
JSON.stringify(session)
);

// redirect

window.location.href = "../public/dashboard.html";

}catch(error){

console.error("Erreur login :",error);
alert("Erreur lors de la connexion.");

if(submitBtn) submitBtn.disabled = false;

}
});

}

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
