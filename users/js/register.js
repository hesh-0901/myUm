//users/js/register.js
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

const cropModal = document.getElementById("cropModal");
const cropImage = document.getElementById("cropImage");

const confirmCrop = document.getElementById("confirmCrop");
const cancelCrop = document.getElementById("cancelCrop");


let cropper = null;
let croppedBlob = null;



// ======================================
// IMAGE SELECTION + OPEN CROP
// ======================================

photoInput.addEventListener("change",(e)=>{

const file = e.target.files[0];

if(!file) return;

const reader = new FileReader();

reader.onload = ()=>{

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



// ======================================
// CONFIRM CROP
// ======================================

confirmCrop.addEventListener("click",async()=>{

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



// ======================================
// CANCEL CROP
// ======================================

cancelCrop.addEventListener("click",()=>{

cropModal.classList.add("hidden");

if(cropper) cropper.destroy();

});



// ======================================
// AGE AUTO
// ======================================

const birthday = document.getElementById("birthday");
const ageInput = document.getElementById("age");

birthday.addEventListener("change",()=>{

const date = new Date(birthday.value);

const diff = Date.now() - date.getTime();

const ageDate = new Date(diff);

const age = Math.abs(ageDate.getUTCFullYear() - 1970);

ageInput.value = age;

});



// ======================================
// FORM SUBMIT
// ======================================

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



if(age < 15){
alert("Impossible de créer le compte.");
return;
}



// ======================================
// CHECK PERSON
// ======================================

const qPerson = query(
collection(db,"users"),
where("firstName","==",firstName),
where("lastName","==",lastName),
where("birthday","==",birth)
);

const snapPerson = await getDocs(qPerson);

if(!snapPerson.empty){
alert("Un compte existe déjà avec ces informations.");
return;
}



// ======================================
// USERNAME
// ======================================

const date = new Date(birth);

const day = String(date.getDate()).padStart(2,"0");
const month = String(date.getMonth()+1).padStart(2,"0");

const username = `${firstName.slice(0,2)}${lastName.slice(0,2)}${day}${month}-${chorale}`;



// ======================================
// CHECK USERNAME
// ======================================

const q = query(collection(db,"users"),where("username","==",username));

const snap = await getDocs(q);

if(!snap.empty){
alert("Username déjà utilisé");
return;
}



// ======================================
// UPLOAD PHOTO
// ======================================

let photoURL = "";

if(croppedBlob){

const storageRef = ref(storage,`profilePhotos/${username}`);

await uploadBytes(storageRef,croppedBlob);

photoURL = await getDownloadURL(storageRef);

}



// ======================================
// SAVE USER
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

isActive:"pending",

createdAt:new Date()

});



createApprovalCard(username,password);

});
