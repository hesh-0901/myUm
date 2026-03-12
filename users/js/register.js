// ======================================================
// IMPORT FIREBASE
// ======================================================

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

import { sha256 } from "https://cdn.jsdelivr.net/npm/js-sha256@0.9.0/src/sha256.min.js";


// ======================================================
// INIT STORAGE
// ======================================================

const storage = getStorage();


// ======================================================
// ELEMENTS DOM
// ======================================================

const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");

const cropModal = document.getElementById("cropModal");
const cropImage = document.getElementById("cropImage");

const confirmCrop = document.getElementById("confirmCrop");
const cancelCrop = document.getElementById("cancelCrop");

const birthday = document.getElementById("birthday");
const ageInput = document.getElementById("age");

const registerForm = document.getElementById("registerForm");
const registerBtn = document.getElementById("registerBtn");


// ======================================================
// VARIABLES
// ======================================================

let cropper = null;
let croppedBlob = null;


// ======================================================
// IMAGE SELECTION + OPEN CROP
// ======================================================

photoInput.addEventListener("change", (e) => {

const file = e.target.files[0];

if(!file) return;

const reader = new FileReader();

reader.onload = () => {

cropImage.src = reader.result;

cropModal.classList.remove("hidden");
cropModal.classList.add("flex");

if(cropper) cropper.destroy();

cropper = new Cropper(cropImage,{
aspectRatio:1,
viewMode:1,
dragMode:"move",
autoCropArea:1,
background:false
});

};

reader.readAsDataURL(file);

});


// ======================================================
// CONFIRM CROP
// ======================================================

confirmCrop.addEventListener("click", async () => {

const canvas = cropper.getCroppedCanvas({
width:400,
height:400
});

croppedBlob = await new Promise(resolve =>
canvas.toBlob(resolve,"image/jpeg",0.9)
);

photoPreview.src = URL.createObjectURL(croppedBlob);

cropModal.classList.add("hidden");

if(cropper) cropper.destroy();

});


// ======================================================
// CANCEL CROP
// ======================================================

cancelCrop.addEventListener("click", () => {

cropModal.classList.add("hidden");

if(cropper) cropper.destroy();

});


// ======================================================
// CALCUL AUTOMATIQUE AGE
// ======================================================

birthday.addEventListener("change", () => {

const date = new Date(birthday.value);

const diff = Date.now() - date.getTime();

const ageDate = new Date(diff);

const age = Math.abs(ageDate.getUTCFullYear() - 1970);

ageInput.value = age;

});


// ======================================================
// RESET BOUTON
// ======================================================

function resetRegisterButton(){

registerBtn.disabled = false;

registerBtn.innerHTML = "Créer mon compte";

}


// ======================================================
// SHOW CREDENTIALS MODAL
// ======================================================

function showCredentialsModal(username,password){

const modal = document.getElementById("credentialsModal");

document.getElementById("credUsername").textContent = username;
document.getElementById("credPassword").textContent = password;

modal.classList.remove("hidden");
modal.classList.add("flex");

}


// ======================================================
// DOWNLOAD CREDENTIALS
// ======================================================

document.getElementById("downloadCredentials").addEventListener("click",()=>{

const username = document.getElementById("credUsername").textContent;
const password = document.getElementById("credPassword").textContent;


// ================================
// CREATE CANVAS
// ================================

const canvas = document.createElement("canvas");

canvas.width = 800;
canvas.height = 450;

const ctx = canvas.getContext("2d");


// ================================
// BACKGROUND
// ================================

ctx.fillStyle = "#1A3668";
ctx.fillRect(0,0,canvas.width,canvas.height);


// ================================
// TITLE
// ================================

ctx.fillStyle = "#ffffff";
ctx.font = "bold 40px Inter";

ctx.fillText("MyUm",50,80);


// ================================
// TEXT
// ================================

ctx.font = "24px Inter";

ctx.fillText(`Identifiant : ${username}`,50,200);
ctx.fillText(`Mot de passe : ${password}`,50,260);

ctx.font = "18px Inter";

ctx.fillText("Compte en attente de validation admin",50,340);


// ================================
// EXPORT JPG
// ================================

const image = canvas.toDataURL("image/jpeg",0.9);

const a = document.createElement("a");

a.href = image;
a.download = "identifiants-myum.jpg";

a.click();

});


// ======================================================
// COPY CREDENTIALS
// ======================================================

document.getElementById("copyCredentials").addEventListener("click",()=>{

const username = document.getElementById("credUsername").textContent;
const password = document.getElementById("credPassword").textContent;

const text = `Identifiant : ${username}\nMot de passe : ${password}`;

navigator.clipboard.writeText(text);

alert("Identifiants copiés");

});


// ======================================================
// FORM SUBMIT
// ======================================================

registerForm.addEventListener("submit", async (e) => {

e.preventDefault();


// ================================
// LOADING BUTTON
// ================================

registerBtn.disabled = true;

registerBtn.innerHTML = `
<span class="flex items-center justify-center gap-2">
<i class="bi bi-arrow-repeat animate-spin"></i>
Création du compte...
</span>
`;


// ================================
// GET VALUES
// ================================

const firstName = document.getElementById("firstName").value.trim().toUpperCase();
const lastName = document.getElementById("lastName").value.trim().toUpperCase();
const birth = birthday.value;
const age = parseInt(ageInput.value);
const fonction = document.getElementById("fonction").value;
const chorale = document.getElementById("chorale").value;
const phone = document.getElementById("phone").value;
const password = document.getElementById("password").value;
const confirm = document.getElementById("confirmPassword").value;
const hashedPassword = sha256(password);


// ================================
// PASSWORD CHECK
// ================================

if(password !== confirm){

alert("Les mots de passe ne correspondent pas");

resetRegisterButton();

return;

}


// ================================
// AGE CHECK
// ================================

if(age < 15){

alert("Impossible de créer le compte.");

resetRegisterButton();

return;

}


// ================================
// REQUIRED FIELDS
// ================================

if(!firstName || !lastName || !birth || !fonction || !chorale || !phone){

alert("Veuillez remplir tous les champs.");

resetRegisterButton();

return;

}


// ======================================================
// CHECK PERSON EXIST
// ======================================================

const qPerson = query(
collection(db,"users"),
where("firstName","==",firstName),
where("lastName","==",lastName),
where("birthday","==",birth)
);

const snapPerson = await getDocs(qPerson);

if(!snapPerson.empty){

alert("Un compte existe déjà avec ces informations.");

resetRegisterButton();

return;

}


// ======================================================
// GENERATE USERNAME
// ======================================================

const date = new Date(birth);

const day = String(date.getDate()).padStart(2,"0");
const month = String(date.getMonth()+1).padStart(2,"0");

const username = `${firstName.slice(0,2)}${lastName.slice(0,2)}${day}${month}-${chorale}`;

const q = query(collection(db,"users"),where("username","==",username));

const snap = await getDocs(q);

if(!snap.empty){

alert("Username déjà utilisé");

resetRegisterButton();

return;

}


// ======================================================
// UPLOAD PHOTO
// ======================================================

let photoURL = "";

if(croppedBlob){

const storageRef = ref(storage,`profilePhotos/${username}`);

await uploadBytes(storageRef,croppedBlob);

photoURL = await getDownloadURL(storageRef);

}


// ======================================================
// SAVE USER FIRESTORE
// ======================================================

await addDoc(collection(db,"users"),{

firstName,
lastName,
birthday:birth,
age,
fonction,
chorale,
phone,
username,
password: hashedPassword,   // <-- AJOUTER CETTE LIGNE
photoURL,

role:"choriste",
isActive:"pending",

createdAt:new Date()

});

// ======================================================
// SHOW CREDENTIALS MODAL
// ======================================================

showCredentialsModal(username,password);

resetRegisterButton();

});
