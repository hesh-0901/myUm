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
const userDetailView = document.getElementById("userDetailView");

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

const tabs = document.querySelectorAll(".tab");


// STATE

let usersCache = [];
let currentStatus = "active";


// INIT

init();

function init(){

listenUsers();
bindTabs();

}


// TABS

function bindTabs(){

tabs.forEach(tab=>{

tab.onclick = ()=>{

tabs.forEach(t=>t.classList.remove("active"));

tab.classList.add("active");

currentStatus = tab.dataset.status;

listenUsers();

};

});

}


// FIRESTORE

function listenUsers(){

const q = query(
collection(db,"users"),
where("isActive","==",currentStatus)
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

const search = searchInput.value.toLowerCase();

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

list.forEach(user=>{

const row=document.createElement("div");

row.className="userRow";

row.innerHTML=`

<i class="bi bi-person-circle text-lightblue text-xl"></i>

<div>

<div class="text-sm font-semibold">
${user.firstName} ${user.lastName}
</div>

<div class="text-xs opacity-70">
${user.phone || ""}
</div>

</div>

`;

row.onclick = ()=>openUser(user);

usersList.appendChild(row);

});

}


// EVENTS

searchInput.oninput = renderUsers;
sortSelect.onchange = renderUsers;


// USER DETAIL

function openUser(user){

userDetailView.classList.remove("hidden");

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

document.getElementById("approveBtn").onclick = ()=>approve(user.id);
document.getElementById("rejectBtn").onclick = ()=>reject(user.id);

}


// ACTIONS

async function approve(id){

await updateDoc(doc(db,"users",id),{
isActive:"active"
});

alert("Utilisateur approuvé");

}

async function reject(id){

await updateDoc(doc(db,"users",id),{
isActive:"rejected"
});

alert("Utilisateur refusé");

}
