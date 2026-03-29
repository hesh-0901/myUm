import { db } from "/myUm/mains.js/firebase-config.js";

import {
  doc,
  getDoc,
  collection,
  query,
  getDocs,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { openRadar } from "/myUm/partials/js/radar.js";
import { openAttendanceModal } from "/myUm/partials/js/add-attendance-modal.js";
import { initPresenceActions } from "/myUm/admin/js/presence-details-actions.js";



// ===============================
// DOM
// ===============================
const roomInfo = document.getElementById("roomInfo");
const presenceList = document.getElementById("presenceList");
const presenceCount = document.getElementById("presenceCount");

const openRadarBtn = document.getElementById("openRadarBtn");
const addManualBtn = document.getElementById("addManualBtn");

// ===============================
// STATS
// ===============================
let allPresences = [];
let currentPage = 1;
const perPage = 20;

// ===============================
// PARAM
// ===============================
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");


// ===============================
// FORMAT
// ===============================
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


// ===============================
// LOAD ROOM
// ===============================
async function loadRoom() {

  if (!roomId) return;

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


// ===============================
// LOAD PRESENCES
// ===============================
async function loadPresences() {

  if (!roomId) return;

  const q = query(
    collection(db, "presenceRooms", roomId, "attendances"),
    orderBy("timestamp", "desc")
  );

  const snap = await getDocs(q);

  allPresences = [];

  snap.forEach(doc => {
    allPresences.push({ id: doc.id, ...doc.data() });
  });

  renderPaginated();
}


// ===============================
// RENDER
// ===============================
function renderPresences(list, startIndex = 0) {

  presenceList.innerHTML = "";

  if (!list.length) {
    presenceList.innerHTML =
      "<p class='text-sm text-gray-500'>Aucune présence</p>";
    presenceCount.innerText = "0 présence";
    return;
  }

  presenceCount.innerText = `${allPresences.length} présence(s)`;

  list.forEach((d, i) => {

    const index = startIndex + i + 1;

    const row = document.createElement("div");

    row.className = `
      flex items-center justify-between
      px-4 py-2
      border-b border-gray-100
    `;

    row.innerHTML = `
      <div class="flex-1">

        <p class="text-sm text-gray-800 font-medium">
          ${index.toString().padStart(2, "0")} • ${d.username || ""}
        </p>

        <p class="text-xs text-gray-500">
          ${d.fullName || ""} • ${formatTime(d.timestamp)}
          <span class="ml-1 ${
            d.method === "manual"
              ? "text-blue-600"
              : "text-green-600"
          }">
            ${d.method === "manual" ? "Manuel" : "Radar"}
          </span>
          <span class="ml-1 text-gray-400">
            ${getStatusLabel(d)}
          </span>
        </p>

      </div>

      <!-- ACTIONS -->
      <button class="actionBtn p-2 text-gray-500"
        data-id="${d.id || ""}"
        data-username="${d.username}">
        <i class="bi bi-three-dots-vertical"></i>
      </button>
    `;

    presenceList.appendChild(row);

  });
}
// ===============================
// ACTIONS
// ===============================
openRadarBtn.addEventListener("click", () => {
  if (!roomId) return;
  openRadar(roomId);
});

addManualBtn.addEventListener("click", () => {
  if (!roomId) return;
  openAttendanceModal(roomId);
});


// ===============================
// MAJ AUTO
// ===============================
window.addEventListener("presenceUpdated", () => {
  loadPresences();
});

// ===============================
// PAGINATION
// ===============================
function renderPaginated() {

  const totalPages = Math.ceil(allPresences.length / perPage);

  if (currentPage > totalPages) currentPage = totalPages || 1;

  const start = (currentPage - 1) * perPage;
  const pageData = allPresences.slice(start, start + perPage);

  renderPresences(pageData, start);

  renderPaginationControls(totalPages);
}

// ===============================
// CONTROL PAGINATION
// ===============================
function renderPaginationControls(totalPages) {

  let controls = document.getElementById("paginationControls");

  if (!controls) {
    controls = document.createElement("div");
    controls.id = "paginationControls";
    controls.className = "flex items-center justify-center gap-4 py-3 text-sm text-gray-600";

    presenceList.after(controls);
  }

  controls.innerHTML = `
    <button ${currentPage === 1 ? "disabled" : ""}
      class="px-2">
      ←
    </button>

    <span>${currentPage} / ${totalPages || 1}</span>

    <button ${currentPage === totalPages ? "disabled" : ""}
      class="px-2">
      →
    </button>
  `;

  const [prevBtn, nextBtn] = controls.querySelectorAll("button");

  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderPaginated();
    }
  };

  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderPaginated();
    }
  };
}

// ===============================
// INIT
// ===============================
loadRoom();
loadPresences();
initPresenceActions();
