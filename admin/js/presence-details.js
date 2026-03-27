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


// ===============================
// ELEMENTS DOM
// ===============================
const roomInfo = document.getElementById("roomInfo");
const presenceList = document.getElementById("presenceList");

const openRadarBtn = document.getElementById("openRadarBtn");
const addManualBtn = document.getElementById("addManualBtn");


// ===============================
// PARAMS
// ===============================
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");


// ===============================
// FORMAT DATE
// ===============================
function formatDate(dateStr) {
  if (!dateStr) return "";

  if (dateStr.includes("/")) return dateStr;

  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}


// ===============================
// LOAD ROOM DETAILS
// ===============================
async function loadRoom() {

  if (!roomId) return;

  try {

    const roomRef = doc(db, "presenceRooms", roomId);
    const snap = await getDoc(roomRef);

    if (!snap.exists()) {
      roomInfo.innerHTML =
        "<p class='text-sm text-gray-500 p-4'>Salon introuvable</p>";
      return;
    }

    const room = snap.data();

    renderRoom(room);

  } catch (error) {
    console.error(error);
  }

}


// ===============================
// RENDER ROOM
// ===============================
function renderRoom(room) {

  const formattedDate = formatDate(room.date);

  roomInfo.innerHTML = `
    <div class="p-4 space-y-3">

      <div class="flex items-center gap-3">

        <img 
          src="${room.photoURL || '/myUm/assets/default-avatar.png'}"
          class="w-12 h-12 rounded-full object-cover">

        <div>
          <p class="text-sm font-semibold text-gray-800">
            ${room.chorale}
          </p>
          <p class="text-xs text-gray-500">
            ${formattedDate} • ${room.type}
          </p>
        </div>

      </div>

      <div class="flex justify-between items-center">

        <span class="text-xs px-2 py-1 rounded-full 
          ${room.status === "active"
            ? "bg-green-100 text-green-600"
            : "bg-gray-100 text-gray-500"}">
          ${room.status === "active" ? "Actif" : "Fermé"}
        </span>

        <p class="text-xs text-gray-400">
          ${room.createdByName || ""}
        </p>

      </div>

      <p class="text-xs text-gray-500">
        ${room.description || "Aucune description"}
      </p>

    </div>
  `;

}


// ===============================
// LOAD PRESENCES
// ===============================
async function loadPresences() {

  if (!roomId) return;

  try {

    const q = query(
      collection(db, "presences"),
      where("roomId", "==", roomId),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    renderPresences(snap);

  } catch (error) {
    console.error(error);
  }

}


// ===============================
// RENDER PRESENCES
// ===============================
function renderPresences(snap) {

  presenceList.innerHTML = "";

  if (snap.empty) {
    presenceList.innerHTML =
      "<p class='text-sm text-gray-500 p-4'>Aucune présence</p>";
    return;
  }

  snap.forEach(doc => {

    const data = doc.data();

    const item = document.createElement("div");

    item.className = `
      flex items-center gap-3 p-4 border-b border-gray-100
    `;

    item.innerHTML = `
      <img 
        src="${data.photoURL || '/myUm/assets/default-avatar.png'}"
        class="w-10 h-10 rounded-full object-cover">

      <div class="flex-1">

        <p class="text-sm font-medium text-gray-800">
          ${data.fullName || "Utilisateur"}
        </p>

        <p class="text-xs text-gray-500">
          ${data.method === "manual" ? "Ajout manuel" : "Radar"}
        </p>

      </div>
    `;

    presenceList.appendChild(item);

  });

}


// ===============================
// ACTIONS
// ===============================

// RADAR
openRadarBtn.addEventListener("click", () => {
  if (!roomId) return;
  openRadar(roomId);
});


// AJOUT MANUEL
addManualBtn.addEventListener("click", () => {
  if (!roomId) return;

  window.location.href =
    `/myUm/admin/add-presence-manual.html?roomId=${roomId}`;
});


// ===============================
// INIT
// ===============================
loadRoom();
loadPresences();
