import { db } from "../../mains.js/firebase-config.js";

import {
collection,
query,
where,
onSnapshot,
doc,
updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// DOM

const usersList = document.getElementById("usersList");
const userDetail = document.getElementById("userDetail");

const tabActive = document.getElementById("tabActive");
const tabPending = document.getElementById("tabPending");
const tabRejected = document.getElementById("tabRejected");

const backBtn = document.getElementById("backBtn");


// STATE

let currentTab="active";


// INIT

init();

function init(){

listenUsers();

}


// NAV DASHBOARD

backBtn.onclick=()=>{

window.location.href="/myUm/public/dashboard.html";

};


// TABS

tabActive.onclick=()=>switchTab("active");
tabPending.onclick=()=>switchTab("pending");
tabRejected.onclick=()=>switchTab("rejected");


function switchTab(tab){

currentTab=tab;

tabActive.classList.remove("tabActive");
tabPending.classList.remove("tabActive");
tabRejected.classList.remove("tabActive");

if(tab==="active") tabActive.classList.add("tabActive");
if(tab==="pending") tabPending.classList.add("tabActive");
if(tab==="rejected") tabRejected.classList.add("tabActive");

listenUsers();

}


// FIRESTORE

function listenUsers(){

usersList.innerHTML="Chargement...";

const q=query(
collection(db,"users"),
where("isActive","==",currentTab)
);

onSnapshot(q,(snap)=>{

usersList.innerHTML="";

if(snap.empty){

usersList.innerHTML=
"<div class='text-sm opacity-60'>Aucun utilisateur</div>";

return;

}

snap.forEach(docSnap=>{

const user=docSnap.data();

const row=document.createElement("div");

row.className="userRow";

row.innerHTML=`

<i class="bi bi-person-circle text-xl text-lightblue"></i>

<div>

<div class="text-sm font-semibold">

${user.firstName} ${user.lastName}

</div>

<div class="text-xs opacity-70">

${user.phone || ""}

</div>

</div>

`;

row.onclick=()=>openUser(docSnap.id,user);

usersList.appendChild(row);

});

});

}


// USER DETAIL

function openUser(id,user){

usersList.classList.add("hidden");
userDetail.classList.remove("hidden");

userDetail.innerHTML=`

<div class="card space-y-2">

<img src="${user.photoURL || '/myUm/assets/default-avatar.png'}"
class="w-20 h-20 rounded-full object-cover">

<div><b>Nom :</b> ${user.lastName}</div>
<div><b>Prénom :</b> ${user.firstName}</div>
<div><b>Fonction :</b> ${user.fonction}</div>
<div><b>Chorale :</b> ${user.chorale}</div>
<div><b>Téléphone :</b> ${user.phone}</div>

</div>

<div class="flex gap-3">

${renderButtons(id)}

</div>

`;

}


// ACTION BUTTONS

function renderButtons(id){

if(currentTab==="pending"){

return `

<button class="btn btnApprove flex-1"
onclick="approveUser('${id}')">

Approuver

</button>

<button class="btn btnReject flex-1"
onclick="rejectUser('${id}')">

Refuser

</button>

`;

}

if(currentTab==="rejected"){

return `

<button class="btn btnRestore flex-1"
onclick="restoreUser('${id}')">

Restaurer

</button>

`;

}

return "";

}


// ACTIONS

window.approveUser=async(id)=>{

await updateDoc(doc(db,"users",id),{
isActive:"active"
});

location.reload();

};

window.rejectUser=async(id)=>{

await updateDoc(doc(db,"users",id),{
isActive:"rejected"
});

location.reload();

};

window.restoreUser=async(id)=>{

await updateDoc(doc(db,"users",id),{
isActive:"pending"
});

location.reload();

};
