import { db } from "/myUm/mains.js/firebase-config.js";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { openRadar } from "/myUm/partials/js/radar.js";


// DOM
const roomInfo = document.getElementById("roomInfo");
const presenceList = document.getElementById("presenceList");
const presenceCount = document.getElementById("presenceCount");

const openRadarBtn = document.getElementById("openRadarBtn");
const addManualBtn = document.getElementById("addManualBtn");


// PARAM
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");


// FORMAT
function formatDate(dateStr) {
  if (!dateStr) return "";

  if (dateStr.includes("/")) return dateStr;

  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function formatTime(timestamp) {
  if (!timestamp) return "";

  const date = timestamp.toDate();

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}


// LOAD ROOM
async function loadRoom() {

  const snap = await getDoc(doc(db, "presenceRooms", roomId));

  if (!snap.exists()) {
    roomInfo.innerHTML =
      "<p class='text-sm text-gray-500'>Salon introuvable</p>";
    return;
  }

  const room = snap.data();

  roomInfo.innerHTML = `
    <div class="flex items-center gap-3">

      <img 
        src="${room.photoURL || '/myUm/assets/default-avatar.png'}"
        class="w-10 h-10 rounded-full object-cover">

      <div class="flex-1">

        <p class="text-sm font-semibold text-gray-800">
          ${room.chorale}
        </p>

        <p class="text-xs text-gray-500">
          ${formatDate(room.date)} • ${room.type}
        </p>

      </div>

      <span class="text-[10px] px-2 py-1 rounded-full
        ${room.status === "active"
          ? "bg-green-100 text-green-600"
          : "bg-gray-100 text-gray-500"}">
        ${room.status === "active" ? "Actif" : "Fermé"}
      </span>

    </div>
  `;
}


// LOAD PRESENCES
async function loadPresences() {

  const q = query(
    collection(db, "presenceRooms", roomId, "attendances"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  renderPresences(snap);
}


// RENDER
function renderPresences(snap) {

  presenceList.innerHTML = "";

  if (snap.empty) {
    presenceList.innerHTML =
      "<p class='text-sm text-gray-500'>Aucune présence</p>";
    presenceCount.innerText = "0 présence";
    return;
  }

  presenceCount.innerText = `${snap.size} présence(s)`;

  snap.forEach(doc => {

    const d = doc.data();

    const row = document.createElement("div");

    row.className = `
      flex items-center gap-3
      p-3 rounded-xl border border-gray-100
      active:scale-[0.98] transition
    `;

    row.innerHTML = `
      <img 
        src="${d.photoURL || '/myUm/assets/default-avatar.png'}"
        class="w-9 h-9 rounded-full object-cover">

      <div class="flex-1">

        <p class="text-sm font-medium text-gray-800">
          ${d.fullName || "Utilisateur"}
        </p>

        <p class="text-xs text-gray-500">
          ${d.chorale || "—"} • ${formatTime(d.createdAt)}
        </p>

      </div>

      <span class="text-[10px] px-2 py-1 rounded-full
        ${d.method === "manual"
          ? "bg-blue-100 text-blue-600"
          : "bg-green-100 text-green-600"}">
        ${d.method === "manual" ? "Manuel" : "Radar"}
      </span>
    `;

    presenceList.appendChild(row);

  });

}


// ACTIONS
openRadarBtn.addEventListener("click", () => {
  if (!roomId) return;
  openRadar(roomId);
});

addManualBtn.addEventListener("click", () => {
  if (!roomId) return;
  window.location.href =
    `/myUm/admin/add-presence-manual.html?roomId=${roomId}`;
});


// INIT
loadRoom();
loadPresences();
