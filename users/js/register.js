// ======================================
// IMPORT FIREBASE
// ======================================

// connexion à Firestore
import { db } from "../../mains.js/firebase-config.js";

// fonctions Firestore utilisées
import {
collection,
addDoc,
query,
where,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// fonctions Firebase Storage pour upload photo
import {
getStorage,
ref,
uploadBytes,
getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";


// ======================================
// INITIALISATION STORAGE
// ======================================

const storage = getStorage();


// ======================================
// ELEMENTS DOM
// ======================================

// input fichier photo
const photoInput = document.getElementById("photoInput");

// image preview profil
const photoPreview = document.getElementById("photoPreview");

// variable contenant le fichier image sélectionné
let photoFile = null;


// ======================================
// PREVIEW PHOTO PROFIL
// ======================================

// lorsque l'utilisateur sélectionne une image
photoInput.addEventListener("change",(e)=>{

// récupérer le fichier
photoFile = e.target.files[0];

// sécurité si aucun fichier
if(!photoFile) return;

// afficher preview image dans l'avatar
photoPreview.src = URL.createObjectURL(photoFile);

});


// ======================================
// CALCUL AUTOMATIQUE DE L'AGE
// ======================================

// input date de naissance
const birthday = document.getElementById("birthday");

// input age
const ageInput = document.getElementById("age");


// recalcul âge lorsque la date change
birthday.addEventListener("change",()=>{

const date = new Date(birthday.value);

// différence entre aujourd'hui et la date
const diff = Date.now() - date.getTime();

// convertir en date
const ageDate = new Date(diff);

// calcul âge
const age = Math.abs(ageDate.getUTCFullYear() - 1970);

// afficher âge dans champ
ageInput.value = age;

});


// ======================================
// SUBMIT FORMULAIRE INSCRIPTION
// ======================================

document.getElementById("registerForm").addEventListener("submit", async(e)=>{

// empêcher rechargement page
e.preventDefault();


// ======================================
// RECUPERATION DES VALEURS FORMULAIRE
// ======================================

const firstName = document.getElementById("firstName").value.trim().toUpperCase();

const lastName = document.getElementById("lastName").value.trim().toUpperCase();

const birth = birthday.value;

const age = parseInt(ageInput.value);

const fonction = document.getElementById("fonction").value;

const chorale = document.getElementById("chorale").value;

const phone = document.getElementById("phone").value;

const password = document.getElementById("password").value;

const confirm = document.getElementById("confirmPassword").value;


// ======================================
// VERIFICATION MOT DE PASSE
// ======================================

if(password !== confirm){

alert("Les mots de passe ne correspondent pas");

return;

}


// ======================================
// SECURITE AGE MINIMUM
// ======================================

if(age < 15){

alert("Impossible de créer le compte.");

return;

}


// ======================================
// VERIFIER SI UTILISATEUR EXISTE DEJA
// ======================================

const qPerson = query(

collection(db,"users"),

where("firstName","==",firstName),
where("lastName","==",lastName),
where("birthday","==",birth)

);

// requête Firestore
const snapPerson = await getDocs(qPerson);

// si une personne avec mêmes infos existe
if(!snapPerson.empty){

alert("Un compte existe déjà avec ces informations.");

return;

}


// ======================================
// GENERATION USERNAME
// ======================================

// transformer date en objet
const date = new Date(birth);

// extraire jour
const day = String(date.getDate()).padStart(2,"0");

// extraire mois
const month = String(date.getMonth()+1).padStart(2,"0");

// username format
// 2 lettres prénom + 2 lettres nom + JJMM + - + chorale

const username =
`${firstName.slice(0,2)}${lastName.slice(0,2)}${day}${month}-${chorale}`;


// ======================================
// VERIFIER USERNAME UNIQUE
// ======================================

const q = query(
collection(db,"users"),
where("username","==",username)
);

const snap = await getDocs(q);

if(!snap.empty){

alert("Username déjà utilisé");

return;

}


// ======================================
// UPLOAD PHOTO PROFIL
// ======================================

let photoURL = "";

if(photoFile){

// chemin stockage
const storageRef =
ref(storage,`profilePhotos/${username}`);

// upload image
await uploadBytes(storageRef,photoFile);

// récupérer URL publique
photoURL = await getDownloadURL(storageRef);

}


// ======================================
// CREATION UTILISATEUR FIRESTORE
// ======================================

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

// compte en attente validation admin
isActive:"pending",

createdAt:new Date()

});


// ======================================
// GENERATION CARTE INSCRIPTION
// ======================================

createApprovalCard(username,password);

});


// ======================================
// GENERATEUR IMAGE INSCRIPTION
// ======================================

function createApprovalCard(username,password){

// créer canvas
const canvas = document.createElement("canvas");

canvas.width = 900;
canvas.height = 600;

const ctx = canvas.getContext("2d");


// fond MyUm
ctx.fillStyle = "#1A3668";

ctx.fillRect(0,0,900,600);


// texte blanc
ctx.fillStyle = "#fff";


// titre
ctx.font = "bold 40px Inter";

ctx.fillText("Demande envoyée",60,120);


// message
ctx.font = "26px Inter";

ctx.fillText("Votre demande d'inscription a été envoyée.",60,220);

ctx.fillText("Un administrateur étudiera votre dossier.",60,260);

ctx.fillText("Vous serez notifié sur WhatsApp.",60,300);


// username
ctx.fillText("Username : " + username,60,380);


// password
ctx.fillText("Mot de passe : " + password,60,430);


// rappel
ctx.fillText("Conservez ces informations.",60,480);


// téléchargement image
const link = document.createElement("a");

link.download = "myum-inscription.jpg";

link.href = canvas.toDataURL("image/jpeg");

link.click();


// notification
alert("Carte téléchargée. Conservez vos informations.");

}
