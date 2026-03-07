import { db } from "../../mains.js/firebase-config.js";

import {
collection,
addDoc,
query,
where,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
getStorage,
ref,
uploadBytes,
getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";


const storage = getStorage();


const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");

let photoFile = null;


/* preview image */

photoInput.addEventListener("change",(e)=>{

photoFile = e.target.files[0];

if(!photoFile) return;

photoPreview.src = URL.createObjectURL(photoFile);

});


/* age auto */

const birthday = document.getElementById("birthday");
const ageInput = document.getElementById("age");

birthday.addEventListener("change",()=>{

const date = new Date(birthday.value);

const diff = Date.now() - date.getTime();

const ageDate = new Date(diff);

const age = Math.abs(ageDate.getUTCFullYear() - 1970);

ageInput.value = age;

});


/* form submit */

document.getElementById("registerForm").addEventListener("submit", async(e)=>{

e.preventDefault();


const firstName = document.getElementById("firstName").value.trim().toUpperCase();
const lastName = document.getElementById("lastName").value.trim().toUpperCase();

const birth = birthday.value;
const age = parseInt(ageInput.value);

const fonction = document.getElementById("fonction").value;
const chorale = document.getElementById("chorale").value;

const phone = document.getElementById("phone").value;

const password = document.getElementById("password").value;
const confirm = document.getElementById("confirmPassword").value;


if(password !== confirm){

alert("Les mots de passe ne correspondent pas");

return;

}


/* sécurité age */

if(age < 15){

alert("Impossible de créer le compte.");

return;

}


/* username */

const date = new Date(birth);

const day = String(date.getDate()).padStart(2,"0");
const month = String(date.getMonth()+1).padStart(2,"0");

const username = `${firstName.slice(0,2)}${lastName.slice(0,2)}${day}${month}-${chorale}`;


/* check username */

const q = query(collection(db,"users"),where("username","==",username));

const snap = await getDocs(q);

if(!snap.empty){

alert("Username déjà utilisé");

return;

}


/* upload photo */

let photoURL = "";

if(photoFile){

const storageRef = ref(storage,`profilePhotos/${username}`);

await uploadBytes(storageRef,photoFile);

photoURL = await getDownloadURL(storageRef);

}


/* save */

await addDoc(collection(db,"users"),{

firstName,
lastName,
birthday:birth,
age,
fonction,
chorale,
phone,

username,

photoURL,

role:"choriste",

isActive:"pending",

createdAt:new Date()

});


/* modal canvas */

createApprovalCard(username,password);

});


/* card generator */

function createApprovalCard(username,password){

const canvas = document.createElement("canvas");

canvas.width=900;
canvas.height=600;

const ctx = canvas.getContext("2d");

ctx.fillStyle="#1A3668";
ctx.fillRect(0,0,900,600);

ctx.fillStyle="#fff";

ctx.font="bold 40px Inter";
ctx.fillText("Demande envoyée",60,120);

ctx.font="26px Inter";
ctx.fillText("Votre demande d'inscription a été envoyée.",60,220);

ctx.fillText("Un administrateur étudiera votre dossier.",60,260);

ctx.fillText("Vous serez notifié sur WhatsApp.",60,300);

ctx.fillText("Username : "+username,60,380);

ctx.fillText("Mot de passe : "+password,60,430);

ctx.fillText("Conservez ces informations.",60,480);

const link=document.createElement("a");

link.download="myum-inscription.jpg";

link.href=canvas.toDataURL("image/jpeg");

link.click();

alert("Carte téléchargée. Conservez vos informations.");

}
