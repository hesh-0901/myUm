import { db } from "../../mains.js/firebase-config.js";

import {
collection,
query,
where,
onSnapshot,
doc,
updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// DOSSIERS CHORALES

const GROUPS = [

{code:"PC",name:"Prophetic Choir"},
{code:"WS",name:"Wake up song"},
{code:"VN",name:"Vent Nouveau"},
{code:"IN",name:"Instrumentiste"},
{code:"AD",name:"Administration"},
{code:"GT",name:"Visiteur"}

];


// DOM

const foldersGrid = document.getElementById("foldersGrid");
const foldersView = document.getElementById("foldersView");

const usersView = document.getElementById("usersView");
const userDetailView = document.getElementById("userDetailView");

const backBtn = document.getElementById("backBtn");
const pageTitle = document.getElementById("pageTitle");

let navigationStack=[];


// INIT

init();

function init(){

renderFolders();
listenPending();

}


// DOSSIERS

function renderFolders(){

foldersGrid.innerHTML="";

GROUPS.forEach(group=>{

const folder=document.createElement("div");

folder.className="folder";
folder.dataset.group=group.code;

folder.innerHTML=`
<div class="bubble hidden">0</div>
<i class="bi bi-folder-fill folderIcon"></i>
<div class="folderName">${group.name}</div>
`;

folder.onclick=()=>openFolder(group);

foldersGrid.appendChild(folder);

});

}


// ECOUTER FIRESTORE

function listenPending(){

const q=query(
collection(db,"users"),
where("isActive","==","pending")
);

onSnapshot(q,(snapshot)=>{

const counters={};

GROUPS.forEach(g=>{
counters[g.code]=0;
});

snapshot.forEach(docSnap=>{

const user=docSnap.data();

if(counters[user.chorale]!==undefined){
counters[user.chorale]++;
}

});

updateBubbles(counters);

});

}


// UPDATE BADGES

function updateBubbles(counters){

document.querySelectorAll(".folder").forEach(folder=>{

const code=folder.dataset.group;
const bubble=folder.querySelector(".bubble");

const count=counters[code]||0;

if(count>0){

bubble.textContent=count;
bubble.classList.remove("hidden");

}else{

bubble.classList.add("hidden");

}

});

}


// OUVRIR DOSSIER

function openFolder(group){

navigationStack.push("folders");

foldersView.classList.add("hidden");
usersView.classList.remove("hidden");

backBtn.classList.remove("hidden");

pageTitle.textContent=group.name;

loadUsers(group.code);

}


// CHARGER UTILISATEURS

function loadUsers(code){

usersView.innerHTML="Chargement...";

const q=query(
collection(db,"users"),
where("isActive","==","pending"),
where("chorale","==",code)
);

onSnapshot(q,(snapshot)=>{

usersView.innerHTML="";

snapshot.forEach(docSnap=>{

const user=docSnap.data();

const row=document.createElement("div");

row.className="userRow";

row.innerHTML=`

<i class="bi bi-file-earmark-text text-lightblue text-xl"></i>

<div>

<div class="text-sm font-semibold">
${user.firstName} ${user.lastName}
</div>

<div class="text-xs opacity-70">
${user.phone}
</div>

</div>

`;

row.onclick=()=>openUser(docSnap.id,user);

usersView.appendChild(row);

});

});

}


// FICHE UTILISATEUR

function openUser(id,user){

navigationStack.push("users");

usersView.classList.add("hidden");
userDetailView.classList.remove("hidden");

pageTitle.textContent="Demande";

userDetailView.innerHTML=`

<div class="card space-y-2">

<img src="${user.photoURL || '/myUm/assets/default-avatar.png'}"
class="w-20 h-20 rounded-full object-cover">

<div><b>Nom :</b> ${user.lastName}</div>
<div><b>Prénom :</b> ${user.firstName}</div>
<div><b>Chorale :</b> ${user.chorale}</div>
<div><b>Téléphone :</b> ${user.phone}</div>

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

document.getElementById("approveBtn").onclick=()=>approve(id);
document.getElementById("rejectBtn").onclick=()=>reject(id);

}


// APPROUVER

async function approve(id){

await updateDoc(doc(db,"users",id),{
isActive:"active"
});

alert("Utilisateur approuvé");

location.reload();

}


// REFUSER

async function reject(id){

await updateDoc(doc(db,"users",id),{
isActive:"rejected"
});

alert("Utilisateur refusé");

location.reload();

}


// BACK

backBtn.onclick=()=>{

const last=navigationStack.pop();

if(last==="users"){

userDetailView.classList.add("hidden");
usersView.classList.remove("hidden");

}else{

usersView.classList.add("hidden");
foldersView.classList.remove("hidden");

backBtn.classList.add("hidden");

pageTitle.textContent="Gestion des membres";

}

};
