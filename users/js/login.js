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

// 🔐 AUTO LOGIN
const savedUser = localStorage.getItem("myum_user");

if (savedUser) {

window.location.href = "../public/dashboard.html";

}

// 👁️ Toggle password

passwordToggle.addEventListener("click", function(){

const input = document.getElementById("password");

if(input.type === "password"){
input.type="text"
this.classList.replace("bi-eye","bi-eye-slash")
}
else{
input.type="password"
this.classList.replace("bi-eye-slash","bi-eye")
}

});

form.addEventListener("submit", async function (e) {

e.preventDefault();

const username = document.getElementById("username").value.trim().toUpperCase();
const password = document.getElementById("password").value;
const remember = document.getElementById("rememberMe").checked;

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

const hashedInputPassword = await hashPassword(password);

if(hashedInputPassword !== userData.passwordHash){
alert("Mot de passe incorrect.");
return;
}

const session = {
id:userDoc.id,
username:userData.username,
firstName:userData.firstName,
lastName:userData.lastName,
chorale:userData.chorale,
role:userData.role
};

if(remember){

localStorage.setItem("myum_user",JSON.stringify(session));

}else{

sessionStorage.setItem("myum_user",JSON.stringify(session));

}

window.location.href="../public/dashboard.html";

}
catch(error){

console.error("Erreur login :",error);
alert("Erreur lors de la connexion.");

}

});

});

// 🔐 HASH SHA256

async function hashPassword(password){

const encoder = new TextEncoder();
const data = encoder.encode(password);

const hashBuffer = await crypto.subtle.digest("SHA-256",data);

const hashArray = Array.from(new Uint8Array(hashBuffer));

return hashArray
.map(b=>b.toString(16).padStart(2,"0"))
.join("");

}
