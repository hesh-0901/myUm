// chat/js/friends.js

import { db } from "../../mains.js/firebase-config.js";

import {
collection,
doc,
getDoc,
getDocs,
setDoc,
addDoc,
deleteDoc,
query,
where,
limit,
serverTimestamp,
orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* =========================
SESSION
========================= */

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("myum_user"));
  } catch {
    return null;
  }
}

const currentUser = getCurrentUser();
const uid = currentUser?.id;

if (!uid) {
  alert("Session invalide.");
  window.location.href = "../users/login.html";
}

/* =========================
DOM
========================= */

const searchInput = document.getElementById("searchInput");

const searchResults = document.getElementById("searchResults");

const searchModal = document.getElementById("searchModal");

const closeSearchModal = document.getElementById("closeSearchModal");

const incomingList = document.getElementById("incomingSection");

const outgoingList = document.getElementById("outgoingSection");

const friendsList = document.getElementById("friendsSection");

const tabIncoming = document.getElementById("tabIncoming");

const tabOutgoing = document.getElementById("tabOutgoing");

const tabFriends = document.getElementById("tabFriends");

/* =========================
INIT
========================= */

init();

async function init() {

  bindTabs();

  searchInput?.addEventListener("input", debounce(onSearch, 300));

  closeSearchModal?.addEventListener("click", () => {
    searchModal.classList.add("hidden");
  });

  await renderIncoming();

  await renderOutgoing();

  await renderFriends();

}

/* =========================
TABS
========================= */

function bindTabs(){

function switchTab(tab){

incomingList.classList.add("hidden");
outgoingList.classList.add("hidden");
friendsList.classList.add("hidden");

tabIncoming.classList.remove("bg-primary","text-white");
tabOutgoing.classList.remove("bg-primary","text-white");
tabFriends.classList.remove("bg-primary","text-white");

if(tab==="incoming"){
incomingList.classList.remove("hidden");
tabIncoming.classList.add("bg-primary","text-white");
}

if(tab==="outgoing"){
outgoingList.classList.remove("hidden");
tabOutgoing.classList.add("bg-primary","text-white");
}

if(tab==="friends"){
friendsList.classList.remove("hidden");
tabFriends.classList.add("bg-primary","text-white");
}

}

tabIncoming.onclick=()=>switchTab("incoming");
tabOutgoing.onclick=()=>switchTab("outgoing");
tabFriends.onclick=()=>switchTab("friends");

switchTab("incoming");

}

/* =========================
SEARCH
========================= */

async function onSearch(){

const term = normalizeTerm(searchInput?.value || "");

if(term.length < 2) return;

searchModal.classList.remove("hidden");

searchResults.innerHTML = "";

const usersRef = collection(db,"users");

const termUpper = term.toUpperCase();

try{

const qUsername = query(
usersRef,
where("username",">=",termUpper),
where("username","<=",termUpper+"\uf8ff"),
limit(10)
);

const qFirst = query(
usersRef,
where("firstName",">=",termUpper),
where("firstName","<=",termUpper+"\uf8ff"),
limit(10)
);

const qLast = query(
usersRef,
where("lastName",">=",termUpper),
where("lastName","<=",termUpper+"\uf8ff"),
limit(10)
);

const qPhone = query(
usersRef,
where("phone","==",term),
limit(10)
);

const [a,b,c,d] = await Promise.all([
getDocs(qUsername),
getDocs(qFirst),
getDocs(qLast),
getDocs(qPhone)
]);

const found = new Map();

[a,b,c,d].forEach(snap=>{
snap.forEach(docSnap=>{
found.set(docSnap.id,{
id:docSnap.id,
...docSnap.data()
});
});
});

if(found.size===0){
searchResults.innerHTML=`<div class="text-sm text-gray-500">Aucun utilisateur trouvé</div>`;
return;
}

for(const user of found.values()){

if(user.id===uid) continue;

const alreadyFriend = await isFriend(uid,user.id);

const pending = await hasPendingRequest(uid,user.id);

const name =
`${user.firstName || ""} ${user.lastName || ""}`.trim()
|| user.username
|| "Utilisateur";

const sub =
user.username ? "@"+user.username : user.phone || "";

const card = document.createElement("div");

card.className="bg-gray-50 rounded-xl p-3 flex justify-between items-center";

card.innerHTML=`
<div>
<div class="font-semibold text-sm">${escapeHtml(name)}</div>
<div class="text-xs text-gray-500">${escapeHtml(sub)}</div>
</div>

<button class="addBtn px-3 py-1 rounded-lg text-xs font-semibold ${
alreadyFriend ? "bg-gray-300" :
pending ? "bg-yellow-200" :
"bg-primary text-white"
}" ${alreadyFriend || pending ? "disabled":""}>

${alreadyFriend ? "Ami" : pending ? "En attente":"Ajouter"}

</button>
`;

if(!alreadyFriend && !pending){

card.querySelector(".addBtn")
.addEventListener("click",()=>sendFriendRequest(user.id));

}

searchResults.appendChild(card);

}

}catch(e){

console.error("search error",e);

}

}

/* =========================
SEND REQUEST
========================= */

async function sendFriendRequest(toUserId){

const myCol = collection(db,"users",uid,"friendRequests");

const theirCol = collection(db,"users",toUserId,"friendRequests");

const newReq = await addDoc(myCol,{
fromUserId:uid,
toUserId,
type:"outgoing",
status:"pending",
createdAt:serverTimestamp()
});

await setDoc(doc(theirCol,newReq.id),{
fromUserId:uid,
toUserId,
type:"incoming",
status:"pending",
createdAt:serverTimestamp()
});

await renderIncoming();

await renderOutgoing();

await renderFriends();

}

/* =========================
INCOMING
========================= */

async function renderIncoming(){

incomingList.innerHTML="";

const col = collection(db,"users",uid,"friendRequests");

const snap = await getDocs(
query(
col,
where("type","==","incoming"),
where("status","==","pending"),
orderBy("createdAt","desc"),
limit(30)
)
);

if(snap.empty){

incomingList.innerHTML=`<div class="text-sm text-gray-500">Aucune demande</div>`;

return;

}

for(const docSnap of snap.docs){

const req = docSnap.data();

const fromId = req.fromUserId;

const fromSnap = await getDoc(doc(db,"users",fromId));

const u = fromSnap.exists()?fromSnap.data():{};

const name =
`${u.firstName || ""} ${u.lastName || ""}`.trim()
|| u.username
|| fromId;

const row=document.createElement("div");

row.className="bg-gray-50 rounded-xl p-3 flex justify-between items-center";

row.innerHTML=`
<div class="text-sm font-semibold">${escapeHtml(name)}</div>

<div class="flex gap-2">

<button class="accept bg-green-600 text-white px-2 py-1 rounded text-xs">
✓
</button>

<button class="reject bg-gray-200 px-2 py-1 rounded text-xs">
✕
</button>

</div>
`;

row.querySelector(".accept")
.onclick=()=>acceptRequest(docSnap.id,fromId);

row.querySelector(".reject")
.onclick=()=>rejectRequest(docSnap.id,fromId);

incomingList.appendChild(row);

}

}

/* =========================
OUTGOING
========================= */

async function renderOutgoing(){

outgoingList.innerHTML="";

const col = collection(db,"users",uid,"friendRequests");

const snap = await getDocs(
query(
col,
where("type","==","outgoing"),
where("status","==","pending"),
limit(30)
)
);

if(snap.empty){

outgoingList.innerHTML=`<div class="text-sm text-gray-500">Aucune demande envoyée</div>`;

return;

}

for(const docSnap of snap.docs){

const req=docSnap.data();

const toId=req.toUserId;

const toSnap=await getDoc(doc(db,"users",toId));

const u=toSnap.exists()?toSnap.data():{};

const name =
`${u.firstName || ""} ${u.lastName || ""}`.trim()
|| u.username
|| toId;

const row=document.createElement("div");

row.className="bg-gray-50 rounded-xl p-3 text-sm";

row.textContent=name;

outgoingList.appendChild(row);

}

}

/* =========================
FRIENDS
========================= */

async function renderFriends(){

friendsList.innerHTML="";

const snap = await getDocs(
query(
collection(db,"users",uid,"friends"),
limit(60)
)
);

if(snap.empty){

friendsList.innerHTML=`<div class="text-sm text-gray-500">Aucun ami</div>`;

return;

}

for(const f of snap.docs){

const data=f.data();

const friendId=data.friendId || f.id;

const name=data.friendName || friendId;

const username=data.friendUsername || "";

const row=document.createElement("div");

row.className="bg-gray-50 rounded-xl p-3 flex justify-between items-center";

row.innerHTML=`
<div>
<div class="font-semibold text-sm">${escapeHtml(name)}</div>
<div class="text-xs text-gray-500">${username? "@"+escapeHtml(username):""}</div>
</div>

<a href="room.html?uid=${encodeURIComponent(friendId)}"
class="bg-primary text-white px-3 py-1 rounded-lg text-xs">

<i class="bi bi-chat-dots"></i>

</a>
`;

friendsList.appendChild(row);

}

}

/* =========================
ACCEPT / REJECT
========================= */

async function acceptRequest(requestId,fromUserId){

await setDoc(doc(db,"users",uid,"friends",fromUserId),{
friendId:fromUserId,
createdAt:serverTimestamp()
});

await setDoc(doc(db,"users",fromUserId,"friends",uid),{
friendId:uid,
createdAt:serverTimestamp()
});

await deleteDoc(doc(db,"users",uid,"friendRequests",requestId));

await deleteDoc(doc(db,"users",fromUserId,"friendRequests",requestId));

await renderIncoming();

await renderOutgoing();

await renderFriends();

}

async function rejectRequest(requestId,fromUserId){

await deleteDoc(doc(db,"users",uid,"friendRequests",requestId));

await deleteDoc(doc(db,"users",fromUserId,"friendRequests",requestId));

await renderIncoming();

}

/* =========================
HELPERS
========================= */

async function isFriend(a,b){
return (await getDoc(doc(db,"users",a,"friends",b))).exists();
}

async function hasPendingRequest(from,to){

const snap = await getDocs(
query(
collection(db,"users",from,"friendRequests"),
where("toUserId","==",to),
where("status","==","pending"),
limit(1)
)
);

return !snap.empty;

}

function normalizeTerm(v){
return String(v).replace(/\s+/g," ").trim();
}

function debounce(fn,delay=300){
let t;
return(...args)=>{
clearTimeout(t);
t=setTimeout(()=>fn(...args),delay);
};
}

function escapeHtml(str){
return String(str).replace(/[&<>"']/g,(m)=>({
"&":"&amp;",
"<":"&lt;",
">":"&gt;",
'"':"&quot;",
"'":"&#039;"
}[m]));
}
