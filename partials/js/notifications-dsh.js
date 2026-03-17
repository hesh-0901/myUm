import { db } from "/myUm/mains.js/firebase-config.js";

import {
collection,
query,
where,
getDocs,
orderBy,
limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ============================
// INIT
// ============================

export async function initNotifications(){

const user = JSON.parse(localStorage.getItem("myum_user"));
if(!user) return;

const list = document.getElementById("notificationsList");
const countEl = document.getElementById("notifCount");

if(!list) return;

// ============================
// QUERY (EXEMPLE)
// ============================

const q = query(
collection(db,"notifications"),
where("userId","==",user.id),
orderBy("createdAt","desc"),
limit(5)
);

const snap = await getDocs(q);

list.innerHTML = "";

let unread = 0;

if(snap.empty){
list.innerHTML = `<p class="text-xs text-gray-400">Aucune notification</p>`;
countEl.innerText = "0";
return;
}

// ============================
// RENDER
// ============================

snap.forEach(docSnap=>{

const data = docSnap.data();

if(!data.read) unread++;

const div = document.createElement("div");

div.className = `
p-2 rounded-xl border text-xs
${data.read ? "bg-gray-50" : "bg-blue-50 border-blue-200"}
`;

div.innerHTML = `
<p>${data.message || "Notification"}</p>
<p class="text-[10px] text-gray-400 mt-1">
${data.createdAt?.toDate().toLocaleString() || ""}
</p>
`;

list.appendChild(div);

});

// ============================
// COUNT
// ============================

countEl.innerText = unread;

}
