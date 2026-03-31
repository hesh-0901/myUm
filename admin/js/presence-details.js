import { db } from "/myUm/mains.js/firebase-config.js";
import { updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
import { openQrScanner } from "/myUm/partials/js/qr-scanner.js";

// ===============================
// import xlsx et pdf
// ===============================
import { exportToXLSX } from "../../export/presence-xlsx-export.js";
import { exportToPDF } from "../../export/presence-pdf-export.js";
import { exportAdvancedPDF } from "../../export/presence-pdf-export-2.js";

// ===============================
// Bind après render DOM
// ===============================
function bindExportButtons() {
  const xlsxBtn = document.getElementById("exportXlsxBtn");
  const pdfBtn = document.getElementById("exportPdfBtn");

  if (xlsxBtn) {
    xlsxBtn.onclick = () => exportToXLSX(allPresences);
  }

  if (pdfBtn) {
    pdfBtn.onclick = async () => {
      await exportAdvancedPDF(allPresences, currentRoom);
    };
  }
}

// ===============================
// DOM
// ===============================
const roomInfo = document.getElementById("roomInfo");
const presenceList = document.getElementById("presenceList");
const presenceCount = document.getElementById("presenceCount");
const openQrScannerBtn = document.getElementById("openQrScannerBtn");
const openRadarBtn = document.getElementById("openRadarBtn");
const addManualBtn = document.getElementById("addManualBtn");

document.addEventListener("click", async (e) => {

  if (e.target && e.target.id === "closeQrScanner") {

    const { stopQrScanner } = await import("/myUm/partials/js/qr-scanner.js");
    stopQrScanner();

  }

});

// ===============================
// STATS
// ===============================
let allPresences = [];
let currentPage = 1;
const perPage = 20;
let currentRoom = {};

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

function getStatusLabel(d) {
  if (!d.status) return "- P";

  if (d.status === "justified") return "- J";
  if (d.status === "suspended") return "- S";
  if (d.status === "special") return "- Sp";

  return "- P";
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
  currentRoom = room;

roomInfo.innerHTML = `
  <div class="flex items-center gap-3">

    <!-- PHOTO -->
    <img 
      src="${room.photoURL || '/myUm/assets/default-avatar.png'}"
      class="w-10 h-10 rounded-full object-cover">

    <!-- CONTENU -->
    <div class="flex-1 space-y-[2px]">

      <!-- LIGNE 1 -->
      <p class="text-sm font-semibold text-gray-800 leading-tight">
        ${room.createdByName || ""} • ${room.chorale} • ${room.type}
      </p>

      <!-- LIGNE 2 -->
      <p class="text-xs text-gray-500 leading-tight">
        ${room.description || "—"} • ${formatDate(room.date)}
      </p>

    </div>

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
  // ✅ AJOUT OBLIGATOIRE
bindExportButtons();
}
// ===============================
// ACTIONS
// ===============================
openRadarBtn.addEventListener("click", async () => {

  if (!roomId) return;

  try {

    const roomRef = doc(db, "presenceRooms", roomId);
    const snap = await getDoc(roomRef);

    if (!snap.exists()) {
      alert("Salon introuvable.");
      return;
    }

    const room = snap.data();

    // ✅ CAS 1 : salon actif → ouvrir radar
    if (room.status === "active") {
      openRadar(roomId);
      return;
    }

    // 🔥 CAS 2 : salon fermé → proposer réouverture
    const confirmReopen = confirm("Ce salon est fermé. Le réactiver ?");

    if (!confirmReopen) return;

    const newEnd = new Date(Date.now() + 30 * 60000); // 30 min

    await updateDoc(roomRef, {
      status: "active",
      startTime: new Date(),
      endTime: newEnd
    });

    openRadar(roomId);

  } catch (error) {
    console.error(error);
    alert("Erreur lors de l'ouverture du radar.");
  }

});

addManualBtn.addEventListener("click", () => {
  if (!roomId) return;
  openAttendanceModal(roomId);
});

openQrScannerBtn.addEventListener("click", () => {

  if (!roomId) return;

openQrScanner(async (qrData) => {

  try {

    const userId = qrData; // si QR = userId

    const userSnap = await getDoc(doc(db, "users", userId));

    if (!userSnap.exists()) {
      alert("Utilisateur inconnu.");
      return;
    }

    const userData = userSnap.data();

    const attendanceRef = doc(
      db,
      "presenceRooms",
      roomId,
      "attendances",
      userId
    );

    const existing = await getDoc(attendanceRef);

    if (existing.exists()) {
      alert("Déjà enregistré.");
      return;
    }

    await setDoc(attendanceRef, {
      userId,
      username: userData.username,
      fullName: `${userData.firstName} ${userData.lastName}`,
      method: "qr",
      timestamp: new Date()
    });

    alert("Présence enregistrée ✅");

    window.dispatchEvent(new Event("presenceUpdated"));

  } catch (error) {
    console.error(error);
    alert("Erreur scan.");
  }

});

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
