import { db } from "/myUm/mains.js/firebase-config.js";

import {
collection,
getDocs,
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ============================
// USER
// ============================

const user = JSON.parse(localStorage.getItem("myum_user"));
if(!user) window.location.href = "/myUm/index.html";

// ============================
// LOAD ROOMS
// ============================

async function loadRooms(){

const container = document.getElementById("roomsList");

const snap = await getDocs(collection(db,"presenceRooms"));

let total = 0;
let present = 0;

for(const room of snap.docs){

const data = room.data();
const roomId = room.id;

// check présence utilisateur
const attendanceRef = doc(
db,
"presenceRooms",
roomId,
"attendances",
user.id
);

const attendanceSnap = await getDoc(attendanceRef);

const isPresent = attendanceSnap.exists();

if(isPresent) present++;
total++;

const div = document.createElement("div");

div.className = "bg-white rounded-2xl p-4 shadow-sm text-sm";

div.innerHTML = `
<p class="font-semibold text-gray-700">
${data.type}
</p>

<p class="text-xs text-gray-500">
${data.chorale} • ${data.createdByName}
</p>

<p class="mt-2 text-xs ${isPresent ? "text-green-500" : "text-red-500"}">
${isPresent ? "Présent" : "Absent"}
</p>
`;

container.appendChild(div);

}

// ============================
// STATS
// ============================

const percent = total === 0 ? 0 : Math.round((present/total)*100);

document.getElementById("statsText").innerText =
`${present} présences sur ${total} (${percent}%)`;

}

loadRooms();
