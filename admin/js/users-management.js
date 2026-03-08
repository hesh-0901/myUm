// ======================================
// USERS MANAGEMENT MODULE
// ======================================

import { db } from "../../mains.js/firebase-config.js";

import {
collection,
query,
where,
onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ======================================
// CONSTANTES GROUPES
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


// ======================================
// INIT
// ======================================

initFolders();
listenPendingUsers();


// ======================================
// CREER LES DOSSIERS
// ======================================

function initFolders(){

foldersGrid.innerHTML = "";

GROUPS.forEach(group=>{

const folder = document.createElement("div");

folder.className =
"folderCard relative bg-gray-50 border border-gray-200 rounded-2xl p-4 cursor-pointer hover:bg-gray-100 transition";

folder.dataset.group = group;

folder.innerHTML = `

<div class="bubble hidden absolute -top-2 -right-2 bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5"></div>

<i class="bi bi-folder-fill text-3xl text-medium"></i>

<div class="mt-2 text-sm font-semibold">
${group}
</div>

`;

folder.addEventListener("click",()=>{

openFolder(group);

});

foldersGrid.appendChild(folder);

});

}


// ======================================
// ECOUTER LES DEMANDES PENDING
// ======================================

function listenPendingUsers(){

const q = query(
collection(db,"users"),
where("isActive","==","pending")
);

onSnapshot(q,(snapshot)=>{

// reset compteur
const counters = {};

GROUPS.forEach(g=>{
counters[g] = 0;
});

snapshot.forEach(docSnap=>{

const user = docSnap.data();

const group = user.fonction;

if(counters[group] !== undefined){

counters[group]++;

}

});

updateFolderBubbles(counters);

});

}


// ======================================
// METTRE A JOUR LES BUBBLES
// ======================================

function updateFolderBubbles(counters){

document.querySelectorAll(".folderCard").forEach(folder=>{

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

window.location.href =
`users-folder.html?group=${encodeURIComponent(group)}`;

}
