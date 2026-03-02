import { db } from "/myUm/mains.js/firebase-config.js";
import {
  doc,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let attendanceData = [];

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("roomId");

  if (!roomId) {
    alert("Salon introuvable.");
    return;
  }

  await loadRoomDetails(roomId);
  await loadAttendances(roomId);

  document.getElementById("exportXLS")
    .addEventListener("click", exportXLS);
});

// ================= ROOM INFO =================

async function loadRoomDetails(roomId) {

  const roomSnap = await getDoc(doc(db, "presenceRooms", roomId));

  if (!roomSnap.exists()) return;

  const room = roomSnap.data();

  const container = document.getElementById("roomInfo");

  container.innerHTML = `
    <p><strong>Date :</strong> ${room.date || ""}</p>
    <p><strong>Chorale :</strong> ${room.chorale || ""}</p>
    <p><strong>Motif :</strong> ${room.type || ""}</p>
    <p><strong>Ouvert par :</strong> ${room.createdByName || "Inconnu"}</p>
    <p><strong>Statut :</strong> ${room.status}</p>
  `;
}

// ================= ATTENDANCES =================

async function loadAttendances(roomId) {

  const snapshot = await getDocs(
    collection(db, "presenceRooms", roomId, "attendances")
  );

  const tableBody = document.getElementById("attendanceTableBody");
  tableBody.innerHTML = "";

  attendanceData = [];

  if (snapshot.empty) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-6 text-gray-400">
          Aucun participant.
        </td>
      </tr>
    `;
    return;
  }

  snapshot.forEach(docSnap => {

    const data = docSnap.data();

    const date = data.timestamp?.toDate();
    const formattedDate = date
      ? date.toLocaleString("fr-FR")
      : "-";

    attendanceData.push({
      Nom: data.fullName,
      Username: data.username,
      Genre: data.genre,
      Méthode: data.method,
      Horodatage: formattedDate
    });

    tableBody.innerHTML += `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4">${data.fullName}</td>
        <td class="px-6 py-4">${data.username}</td>
        <td class="px-6 py-4 text-center">${data.genre}</td>
        <td class="px-6 py-4">${data.method}</td>
        <td class="px-6 py-4">${formattedDate}</td>
      </tr>
    `;
  });
}

// ================= EXPORT XLS =================

function exportXLS() {

  if (!attendanceData.length) {
    alert("Aucune donnée à exporter.");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(attendanceData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Participants");

  XLSX.writeFile(workbook, "Participants_Salon_MyUm.xlsx");
}
