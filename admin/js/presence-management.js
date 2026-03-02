import { db } from "/myUm/mains.js/firebase-config.js";
import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let allRooms = [];

document.addEventListener("DOMContentLoaded", async () => {
  await loadRooms();
  initFilters();
});

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

  populateChoraleFilter();
  renderTable(allRooms);
}

// ================= RENDER =================

function renderTable(rooms) {

  const tableBody = document.getElementById("roomsTableBody");
  tableBody.innerHTML = "";

  if (!rooms.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-6 text-gray-400">
          Aucun résultat.
        </td>
      </tr>
    `;
    return;
  }

  rooms.forEach(room => {

    tableBody.innerHTML += `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4">${room.date || ""}</td>
        <td class="px-6 py-4 font-medium">${room.chorale || ""}</td>
        <td class="px-6 py-4">${room.type || ""}</td>
        <td class="px-6 py-4">${room.createdByName || "Inconnu"}</td>
        <td class="px-6 py-4 text-center font-semibold text-primary">
          ${room.participants}
        </td>
        <td class="px-6 py-4 text-center">${room.status}</td>
        <td class="px-6 py-4 text-center">
          <button onclick="window.location.href='presence-details.html?roomId=${room.id}'"
            class="text-medium text-xs font-semibold">
            Voir
          </button>
        </td>
      </tr>
    `;
  });
}

// ================= FILTRES =================

function initFilters() {

  document.getElementById("applyFilters").addEventListener("click", () => {

    const date = document.getElementById("filterDate").value;
    const chorale = document.getElementById("filterChorale").value;

    let filtered = allRooms;

    if (date) {
      filtered = filtered.filter(r => r.date === date);
    }

    if (chorale) {
      filtered = filtered.filter(r => r.chorale === chorale);
    }

    renderTable(filtered);
  });

  document.getElementById("exportXLS").addEventListener("click", exportXLS);
}

function populateChoraleFilter() {

  const select = document.getElementById("filterChorale");
  const chorales = [...new Set(allRooms.map(r => r.chorale).filter(Boolean))];

  chorales.forEach(c => {
    select.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

// ================= EXPORT XLS =================

function exportXLS() {

  const data = allRooms.map(room => ({
    Date: room.date,
    Chorale: room.chorale,
    Motif: room.type,
    "Ouvert par": room.createdByName,
    Participants: room.participants,
    Statut: room.status
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Presences");

  XLSX.writeFile(workbook, "Fichier_Presences_MyUm.xlsx");
}
