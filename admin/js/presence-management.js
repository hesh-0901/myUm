import { db } from "/myUm/mains.js/firebase-config.js";
import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ================= STATE ================= */

let allRooms = [];
let filteredRooms = [];

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {

  const cached = sessionStorage.getItem("presenceRoomsCache");

  if (cached) {
    allRooms = JSON.parse(cached);
    filteredRooms = [...allRooms];
    populateChoraleFilter();
    renderTable(filteredRooms);
  } else {
    await loadRooms();
  }

  initFilters();
});

/* ================= LOAD ROOMS ================= */

async function loadRooms() {

  const q = query(
    collection(db, "presenceRooms"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  allRooms = [];

  for (const docSnap of snapshot.docs) {

    const room = docSnap.data();
    const roomId = docSnap.id;

    const attendanceSnap = await getDocs(
      collection(db, "presenceRooms", roomId, "attendances")
    );

    allRooms.push({
      id: roomId,
      ...room,
      participants: attendanceSnap.size
    });
  }

  sessionStorage.setItem("presenceRoomsCache", JSON.stringify(allRooms));

  filteredRooms = [...allRooms];

  populateChoraleFilter();
  renderTable(filteredRooms);
}

/* ================= RENDER TABLE ================= */

function renderTable(rooms) {

  const tableBody = document.getElementById("roomsTableBody");
  tableBody.innerHTML = "";

  if (!rooms.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-6 text-gray-400 text-xs">
          Aucun résultat.
        </td>
      </tr>
    `;
    return;
  }

  rooms.forEach(room => {

    const statusBadge = room.status === "closed"
      ? `<span class="px-2 py-1 rounded-full bg-gray-200 text-gray-600 text-[10px]">Clos</span>`
      : `<span class="px-2 py-1 rounded-full bg-green-100 text-green-600 text-[10px]">Actif</span>`;

    tableBody.innerHTML += `
      <tr class="hover:bg-gray-50 transition text-xs">
        <td class="px-3 py-3">${room.date || ""}</td>
        <td class="px-3 py-3 font-medium">${room.chorale || ""}</td>
        <td class="px-3 py-3">${room.type || ""}</td>
        <td class="px-3 py-3 hidden md:table-cell text-gray-500">
          ${room.description || ""}
        </td>
        <td class="px-3 py-3 hidden md:table-cell">
          ${room.createdByName || "Inconnu"}
        </td>
        <td class="px-3 py-3 text-center font-semibold text-primary">
          ${room.participants}
        </td>
        <td class="px-3 py-3 text-center">
          ${statusBadge}
        </td>
        <td class="px-3 py-3 text-center">
          <button onclick="window.location.href='presence-details.html?roomId=${room.id}'"
            class="text-medium text-sm">
            <i class="bi bi-eye"></i>
          </button>
        </td>
      </tr>
    `;
  });
}

/* ================= FILTERS ================= */

function initFilters() {

  const dateInput = document.getElementById("filterDate");
  const choraleSelect = document.getElementById("filterChorale");
  const globalSearch = document.getElementById("globalSearch");

  function applyFilters() {

    let results = [...allRooms];

    if (dateInput.value) {
      results = results.filter(r => r.date === dateInput.value);
    }

    if (choraleSelect.value) {
      results = results.filter(r => r.chorale === choraleSelect.value);
    }

    if (globalSearch.value.trim()) {

      const search = globalSearch.value.toLowerCase();

      results = results.filter(r =>
        (r.type || "").toLowerCase().includes(search) ||
        (r.description || "").toLowerCase().includes(search) ||
        (r.createdByName || "").toLowerCase().includes(search)
      );
    }

    filteredRooms = results;
    renderTable(filteredRooms);
  }

  dateInput.addEventListener("change", applyFilters);
  choraleSelect.addEventListener("change", applyFilters);
  globalSearch.addEventListener("input", applyFilters);

  document.getElementById("exportXLS")
    .addEventListener("click", exportXLS);
}

/* ================= CHORALE FILTER ================= */

function populateChoraleFilter() {

  const select = document.getElementById("filterChorale");
  select.innerHTML = `<option value="">Chorales</option>`;

  const chorales = [...new Set(
    allRooms.map(r => r.chorale).filter(Boolean)
  )];

  chorales.forEach(c => {
    select.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

/* ================= EXPORT XLS ================= */

function exportXLS() {

  const data = filteredRooms.map(room => ({
    Date: room.date,
    Chorale: room.chorale,
    Motif: room.type,
    Description: room.description || "",
    "Ouvert par": room.createdByName,
    Participants: room.participants,
    Statut: room.status
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Presences");

  XLSX.writeFile(workbook, "Fichier_Presences_MyUm.xlsx");
}
