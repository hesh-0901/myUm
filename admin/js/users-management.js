import { db } from "../../mains.js/firebase-config.js";

import {
collection,
query,
where,
onSnapshot,
doc,
updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// CHORALES

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

const usersList = document.getElementById("usersList");

const backBtn = document.getElementById("backBtn");

const pageTitle = document.getElementById("pageTitle");

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");


// STATE

let usersCache=[];
let currentGroup=null;
let nav=[];


// INIT

init();

function init(){

renderFolders();
listenCounters();

}


// DOSSIERS

function renderFolders(){

foldersGrid.innerHTML="";

GROUPS.forEach(group=>{

const folder=document.createElement("div");

folder.className="folder";
folder.dataset.code=group.code;

folder.innerHTML=`

<div class="bubble hidden">0</div>

<i class="bi bi-folder-fill folderIcon"></i>

<div class="folderName">${group.name}</div>

`;

folder.onclick=()=>openFolder(group);

foldersGrid.appendChild(folder);

});

}


// BADGES

function listenCounters(){

const q=query(
collection(db,"users"),
where("isActive","==","pending")
);

onSnapshot(q,(snap)=>{

const counters={};

GROUPS.forEach(g=>{
counters[g.code]=0;
});

snap.forEach(docSnap=>{

const u=docSnap.data();

if(counters[u.chorale]!==undefined){
counters[u.chorale]++;
}

});

updateBubbles(counters);

});

}


function updateBubbles(counters){

document.querySelectorAll(".folder").forEach(folder=>{

const code=folder.dataset.code;
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


// OPEN FOLDER

function openFolder(group){

currentGroup=group.code;

nav.push("folders");

foldersView.classList.add("hidden");
usersView.classList.remove("hidden");

backBtn.classList.remove("hidden");

pageTitle.textContent=group.name;

listenUsers();

}


// USERS

function listenUsers(){

const q=query(
collection(db,"users"),
where("isActive","==","pending"),
where("chorale","==",currentGroup)
);

onSnapshot(q,(snap)=>{

usersCache=[];

snap.forEach(docSnap=>{

usersCache.push({
id:docSnap.id,
...docSnap.data()
});

});

renderUsers();

});

}


// RENDER USERS

function renderUsers(){

let list=[...usersCache];

const search=searchInput.value.toLowerCase();

if(search){

list=list.filter(u=>

(u.firstName||"").toLowerCase().includes(search) ||
(u.lastName||"").toLowerCase().includes(search) ||
(u.phone||"").includes(search) ||
(u.username||"").toLowerCase().includes(search)

);

}


// SORT

if(sortSelect.value==="age"){

list.sort((a,b)=>(b.age||0)-(a.age||0));

}else{

list.sort((a,b)=>{

return (b.createdAt?.seconds||0) -
(a.createdAt?.seconds||0);

});

}


usersList.innerHTML="";

list.forEach(u=>{

const row=document.createElement("div");

row.className="userRow";

row.innerHTML=`

<i class="bi bi-file-earmark-text text-lightblue text-xl"></i>

<div>

<div class="text-sm font-semibold">

${u.firstName} ${u.lastName}

</div>

<div class="text-xs opacity-70">

${u.phone||""}

</div>

</div>

`;

row.onclick=()=>openUser(u);

usersList.appendChild(row);

});

}


// SEARCH EVENTS

searchInput.oninput=renderUsers;

sortSelect.onchange=renderUsers;


// USER DETAIL

function openUser(user){

nav.push("users");

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

document.getElementById("approveBtn").onclick=()=>approve(user.id);
document.getElementById("rejectBtn").onclick=()=>reject(user.id);

}


// APPROVE

async function approve(id){

await updateDoc(doc(db,"users",id),{
isActive:"active"
});

alert("Utilisateur approuvé");

location.reload();

}


// REJECT

async function reject(id){

await updateDoc(doc(db,"users",id),{
isActive:"rejected"
});

alert("Utilisateur refusé");

location.reload();

}


// BACK

backBtn.onclick=()=>{

const last=nav.pop();

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
