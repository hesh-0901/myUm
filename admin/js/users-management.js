/*admin/js/users-management.js*/
import { db } from "../../mains.js/firebase-config.js";

import {
collection,
query,
where,
orderBy,
limit,
getDocs,
doc,
updateDoc,
startAfter,
onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


const usersContainer = document.getElementById("usersContainer");

const tabActive = document.getElementById("tabActive");
const tabPending = document.getElementById("tabPending");
const tabRejected = document.getElementById("tabRejected");

const searchInput = document.getElementById("searchInput");
const choraleFilter = document.getElementById("choraleFilter");

const countActive = document.getElementById("countActive");
const countPending = document.getElementById("countPending");
const countRejected = document.getElementById("countRejected");

const modal = document.getElementById("userDetailModal");
const modalCard = document.getElementById("userDetailCard");
const closeModal = document.getElementById("closeUserModal");


let users = [];
let filteredUsers = [];

let currentStatus = "active";

const PAGE_LIMIT = 25;

let lastVisible = null;
let loadingMore = false;


init();


function init(){

loadStats();
loadUsers();
initEvents();

}



function initEvents(){

// Tabs navigation

tabActive.addEventListener("click",()=>switchTab("active"));
tabPending.addEventListener("click",()=>switchTab("pending"));
tabRejected.addEventListener("click",()=>switchTab("rejected"));


// Recherche utilisateurs

searchInput.addEventListener("input",filterUsers);
choraleFilter.addEventListener("change",filterUsers);


// Fermeture modal

closeModal.addEventListener("click",()=>{
modal.classList.add("hidden");
});

modal.addEventListener("click",(e)=>{
if(e.target===modal){
modal.classList.add("hidden");
}
});


// Pagination (Load More)

const loadMoreBtn = document.getElementById("loadMoreBtn");

if(loadMoreBtn){
loadMoreBtn.addEventListener("click",loadMoreUsers);
}

}



async function switchTab(status){

currentStatus = status;

tabActive.classList.remove("bg-[#2596D9]","text-white");
tabPending.classList.remove("bg-[#2596D9]","text-white");
tabRejected.classList.remove("bg-[#2596D9]","text-white");

if(status==="active") tabActive.classList.add("bg-[#2596D9]","text-white");
if(status==="pending") tabPending.classList.add("bg-[#2596D9]","text-white");
if(status==="rejected") tabRejected.classList.add("bg-[#2596D9]","text-white");

await loadUsers();

}



function loadStats(){

try{

const ref = collection(db,"users");

onSnapshot(query(ref,where("isActive","==","active")), snap=>{
countActive.textContent = snap.size;
});

onSnapshot(query(ref,where("isActive","==","pending")), snap=>{
countPending.textContent = snap.size;
});

onSnapshot(query(ref,where("isActive","==","rejected")), snap=>{
countRejected.textContent = snap.size;
});

}
catch(err){

console.error("stats error",err);

}

}



async function loadUsers(){

showSkeleton();

try{

const ref = collection(db,"users");

const q = query(
ref,
where("isActive","==",currentStatus),
orderBy("createdAt","desc"),
limit(PAGE_LIMIT)
);

const snap = await getDocs(q);
if(!snap.empty){
lastVisible = snap.docs[snap.docs.length - 1];
}

users = [];

snap.forEach(docSnap=>{
users.push({
id:docSnap.id,
...docSnap.data()
});
});

filteredUsers=[...users];

renderUsers();

}

catch(err){

console.error(err);

usersContainer.innerHTML=`
<div class="text-sm text-red-500">
Erreur chargement utilisateurs
</div>
`;

}

}



function showSkeleton(){

usersContainer.innerHTML="";

for(let i=0;i<5;i++){

const el=document.createElement("div");

el.className="animate-pulse p-3 rounded-xl bg-gray-100 h-16";

usersContainer.appendChild(el);

}

}



function filterUsers(){

const term = searchInput.value.toLowerCase();
const chorale = choraleFilter.value;

filteredUsers = users.filter(user => {

const name = `${user.firstName||""} ${user.lastName||""}`.toLowerCase();
const username = (user.username||"").toLowerCase();

const matchSearch =
name.includes(term) ||
username.includes(term);

const matchChorale =
!chorale || user.chorale === chorale;

return matchSearch && matchChorale;

});

renderUsers();

}



function renderUsers(){

usersContainer.innerHTML="";

if(filteredUsers.length===0){

usersContainer.innerHTML=`
<div class="text-sm opacity-60">
Aucun utilisateur
</div>
`;

return;

}

filteredUsers.forEach((user,index)=>{

const row=document.createElement("div");

row.className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50";

row.innerHTML=`

<div class="text-xs w-6 text-gray-400">
${index+1}
</div>

<img
src="${user.photoURL || "https://ui-avatars.com/api/?name=User"}"
class="w-10 h-10 rounded-full object-cover">

<div class="flex-1">

<div class="text-sm font-medium">

${user.firstName||""} ${user.lastName||""}

</div>

<div class="text-xs text-gray-500">

@${user.username||"username"}

</div>

</div>

<i class="bi bi-chevron-right text-gray-400"></i>

`;

row.addEventListener("click",()=>openUserModal(user));

usersContainer.appendChild(row);

});

}



function openUserModal(user){

modal.classList.remove("hidden");

modalCard.innerHTML=`

<div class="flex flex-col items-center text-center gap-3">

<img
src="${user.photoURL||"/myUm/assets/default-avatar.png"}"
class="w-20 h-20 rounded-full object-cover">

<div class="text-lg font-semibold">

${user.firstName||""} ${user.lastName||""}

</div>

<div class="text-sm text-gray-500">

@${user.username||"username"}

</div>

</div>


<div class="space-y-2 text-sm pt-4">

<div class="flex justify-between">
<span class="text-gray-500">Âge</span>
<span>${user.age||"-"}</span>
</div>

<div class="flex justify-between">
<span class="text-gray-500">Fonction</span>
<span>${user.fonction||"-"}</span>
</div>

<div class="flex justify-between">
<span class="text-gray-500">Chorale</span>
<span>${user.chorale||"-"}</span>
</div>

<div class="flex justify-between">
<span class="text-gray-500">Téléphone</span>
<span>${user.phone||"-"}</span>
</div>

<div class="flex justify-between">
<span class="text-gray-500">Rôle</span>
<span>${user.role||"-"}</span>
</div>

<div class="flex justify-between">
<span class="text-gray-500">Date inscription</span>
<span>${formatDate(user.createdAt)}</span>
</div>

<div class="flex justify-between">
<span class="text-gray-500">Dernière connexion</span>
<span>${formatDateTime(user.lastSeen)}</span>
</div>

</div>


function formatDateTime(timestamp){

if(!timestamp) return "-";

try{

const date = timestamp.toDate
? timestamp.toDate()
: new Date(timestamp);

return date.toLocaleString("fr-FR",{
day:"2-digit",
month:"2-digit",
year:"numeric",
hour:"2-digit",
minute:"2-digit"
});

}catch(e){

return "-";

}

}

<div class="flex gap-2 pt-5">

${buildActions(user)}

</div>

`;

bindActionButtons(user);

}


function buildActions(user){

if(user.isActive==="pending"){

return`

<button id="approveBtn"
class="flex-1 bg-green-600 text-white rounded-xl py-2 text-sm font-semibold">

Approuver

</button>

<button id="rejectBtn"
class="flex-1 bg-red-600 text-white rounded-xl py-2 text-sm font-semibold">

Refuser

</button>

`;

}

if(user.isActive==="rejected"){

return`

<button id="restoreBtn"
class="flex-1 bg-blue-500 text-white rounded-xl py-2 text-sm font-semibold">

Restaurer

</button>

`;

}

return`
<div class="text-sm opacity-60 w-full text-center">
Utilisateur actif
</div>
`;

}



function bindActionButtons(user){

const approveBtn=document.getElementById("approveBtn");
const rejectBtn=document.getElementById("rejectBtn");
const restoreBtn=document.getElementById("restoreBtn");

if(approveBtn){
approveBtn.onclick=()=>updateStatus(user,"active");
}

if(rejectBtn){
rejectBtn.onclick=()=>updateStatus(user,"rejected");
}

if(restoreBtn){
restoreBtn.onclick=()=>updateStatus(user,"active");
}

}



async function updateStatus(user,status){

try{

const ref=doc(db,"users",user.id);

await updateDoc(ref,{isActive:status});

modal.classList.add("hidden");

await loadStats();
await loadUsers();

}

catch(err){

console.error(err);

alert("Erreur mise à jour");

}

}

function formatDate(timestamp){

if(!timestamp) return "-";

try{

const date = timestamp.toDate
? timestamp.toDate()
: new Date(timestamp);

return date.toLocaleDateString("fr-FR",{
day:"2-digit",
month:"2-digit",
year:"numeric"
});

}catch(e){

return "-";

}

}

async function loadMoreUsers(){

if(!lastVisible || loadingMore) return;

loadingMore = true;

try{

const ref = collection(db,"users");

const q = query(
ref,
where("isActive","==",currentStatus),
orderBy("createdAt","desc"),
startAfter(lastVisible),
limit(PAGE_LIMIT)
);

const snap = await getDocs(q);

if(snap.empty){

const loadMoreBtn = document.getElementById("loadMoreBtn");

if(loadMoreBtn){
loadMoreBtn.style.display = "none";
}

loadingMore = false;

return;

}

snap.forEach(docSnap=>{
users.push({
id:docSnap.id,
...docSnap.data()
});
});

lastVisible = snap.docs[snap.docs.length - 1];

filteredUsers = [...users];

renderUsers();

}catch(err){

console.error("pagination error",err);

}

loadingMore = false;

}
