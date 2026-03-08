// ======================================
// FIREBASE
// ======================================

import { db } from "../../mains.js/firebase-config.js";

import {
collection,
query,
where,
onSnapshot,
doc,
updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ======================================
// GROUPES (DOSSIERS)
// ======================================

const GROUPS = [

"Administrateur",
"Corps administratif",
"Visiteur",
"Président",
"Vice Président",
"Responsable UM",
"Comité chorale",
"Choriste",
"Conducteur",
"Instrumentiste"

];


// ======================================
// DOM
// ======================================

const foldersGrid = document.getElementById("foldersGrid");
const foldersView = document.getElementById("foldersView");

const usersView = document.getElementById("usersView");
const userDetailView = document.getElementById("userDetailView");

const backBtn = document.getElementById("backBtn");
const pageTitle = document.getElementById("pageTitle");


// ======================================
// STATE
// ======================================

let navigationStack = [];
let currentUsers = [];


// ======================================
// INIT
// ======================================

init();

function init(){

renderFolders();
listenPendingUsers();

}


// ======================================
// CREER DOSSIERS
// ======================================

function renderFolders(){

foldersGrid.innerHTML = "";

GROUPS.forEach(group=>{

const folder = document.createElement("div");

folder.className = "folder";
folder.dataset.group = group;

folder.innerHTML = `
<div class="bubble hidden">0</div>
<i class="bi bi-folder-fill folderIcon"></i>
<div class="folderName">${group}</div>
`;

folder.addEventListener("click",()=>openFolder(group));

foldersGrid.appendChild(folder);

});

}


// ======================================
// ECOUTER LES DEMANDES
// ======================================

function listenPendingUsers(){

const q = query(
collection(db,"users"),
where("isActive","==","pending")
);

onSnapshot(q,(snapshot)=>{

const counters = {};

GROUPS.forEach(g=>{
counters[g] = 0;
});

snapshot.forEach(docSnap=>{

const user = docSnap.data();

if(counters[user.fonction] !== undefined){

counters[user.fonction]++;

}

});

updateFolderBubbles(counters);

});

}


// ======================================
// UPDATE BUBBLES
// ======================================

function updateFolderBubbles(counters){

document.querySelectorAll(".folder").forEach(folder=>{

const group = folder.dataset.group;
const bubble = folder.querySelector(".bubble");

const count = counters[group] || 0;

if(count > 0){

bubble.textContent = count;
bubble.classList.remove("hidden");

}else{

bubble.classList.add("hidden");

}

});

}


// ======================================
// OUVRIR DOSSIER
// ======================================

function openFolder(group){

navigationStack.push("folders");

foldersView.classList.add("hidden");
usersView.classList.remove("hidden");

backBtn.classList.remove("hidden");

pageTitle.textContent = group;

loadUsers(group);

}


// ======================================
// CHARGER UTILISATEURS
// ======================================

function loadUsers(group){

usersView.innerHTML = "Chargement...";

const q = query(
collection(db,"users"),
where("isActive","==","pending"),
where("fonction","==",group)
);

onSnapshot(q,(snapshot)=>{

usersView.innerHTML = "";

currentUsers = [];

snapshot.forEach(docSnap=>{

const user = docSnap.data();

currentUsers.push({
id:docSnap.id,
...user
});

renderUserRow(docSnap.id,user);

});

if(snapshot.empty){

usersView.innerHTML =
"<div class='text-sm opacity-60'>Aucune demande.</div>";

}

});

}


// ======================================
// RENDER USER ROW
// ======================================

function renderUserRow(id,user){

const row = document.createElement("div");

row.className = "userRow";

row.innerHTML = `

<i class="bi bi-file-earmark-text text-lightblue text-xl"></i>

<div>

<div class="text-sm font-semibold">
${user.firstName} ${user.lastName}
</div>

<div class="text-xs opacity-70">
${user.phone || ""}
</div>

</div>

`;

row.addEventListener("click",()=>openUser(id,user));

usersView.appendChild(row);

}


// ======================================
// OUVRIR FICHE UTILISATEUR
// ======================================

function openUser(id,user){

navigationStack.push("users");

usersView.classList.add("hidden");
userDetailView.classList.remove("hidden");

pageTitle.textContent = "Demande";

renderUserDetail(id,user);

}


// ======================================
// RENDER DETAIL
// ======================================

function renderUserDetail(id,user){

userDetailView.innerHTML = `

<div class="card space-y-3">

<img src="${user.photoURL || '/myUm/assets/default-avatar.png'}"
class="w-20 h-20 rounded-full object-cover">

<div><b>Nom :</b> ${user.lastName}</div>
<div><b>Prénom :</b> ${user.firstName}</div>
<div><b>Fonction :</b> ${user.fonction}</div>
<div><b>Chorale :</b> ${user.chorale}</div>
<div><b>Téléphone :</b> ${user.phone}</div>
<div><b>Username :</b> ${user.username}</div>

</div>

<div class="flex gap-3">

<button id="approveBtn"
class="btn btnApprove flex-1">

Approuver

</button>

<button id="rejectBtn"
class="btn btnReject flex-1">

Refuser

</button>

</div>

`;

document
.getElementById("approveBtn")
.addEventListener("click",()=>approveUser(id));

document
.getElementById("rejectBtn")
.addEventListener("click",()=>rejectUser(id));

}


// ======================================
// APPROUVER UTILISATEUR
// ======================================

async function approveUser(id){

await updateDoc(
doc(db,"users",id),
{
isActive:"active"
}
);

alert("Utilisateur approuvé");

goBack();

}


// ======================================
// REFUSER UTILISATEUR
// ======================================

async function rejectUser(id){

await updateDoc(
doc(db,"users",id),
{
isActive:"rejected"
}
);

alert("Utilisateur refusé");

goBack();

}


// ======================================
// NAVIGATION BACK
// ======================================

backBtn.addEventListener("click",goBack);

function goBack(){

const last = navigationStack.pop();

if(last === "users"){

userDetailView.classList.add("hidden");
usersView.classList.remove("hidden");

pageTitle.textContent =
document.querySelector(".folder[data-group]")?.dataset.group || "Dossier";

}

else{

usersView.classList.add("hidden");
foldersView.classList.remove("hidden");

backBtn.classList.add("hidden");

pageTitle.textContent = "Gestion des membres";

}

}
