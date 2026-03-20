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
// QUERY
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

// ============================
// EMPTY STATE
// ============================

if(snap.empty){

list.innerHTML = `
<p class="text-[11px] text-soft/60">
Aucune notification
</p>
`;

if(countEl) countEl.innerText = "0";

return;

}

// ============================
// RENDER
// ============================

snap.forEach(docSnap=>{

const data = docSnap.data();

// compteur non lu
if(!data.read) unread++;

const div = document.createElement("div");

// 🎨 STYLE DYNAMIQUE
div.className = `
p-2 rounded-xl text-xs transition-all
${data.read 
? "opacity-60 bg-[#022b4a]" 
: "bg-[#033c66] border border-accent/30"}
`;

// contenu
div.innerHTML = `
<p class="text-soft">
${formatNotificationMessage(data)}
</p>

<p class="text-[10px] text-soft/60 mt-1">
${data.createdAt?.toDate().toLocaleString() || ""}
</p>
`;

list.appendChild(div);

});

// ============================
// FORMAT MESSAGE
// ============================

function formatNotificationMessage(data){

  if(data.type === "update"){
    return `🚀 ${data.message}`;
  }

  return data.message || "Notification";

}

// ============================
// COUNT
// ============================

if(countEl){
countEl.innerText = unread;
}

}
