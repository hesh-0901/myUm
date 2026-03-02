import { db } from "/myUm/mains.js/firebase-config.js";
import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  await loadRooms();
});

async function loadRooms() {

  const tableBody = document.getElementById("roomsTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  const q = query(
    collection(db, "presenceRooms"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-6 text-gray-400">
          Aucun salon enregistré.
        </td>
      </tr>
    `;
    return;
  }

  for (const docSnap of snapshot.docs) {

    const room = docSnap.data();
    const roomId = docSnap.id;

    const attendanceSnap = await getDocs(
      collection(db, "presenceRooms", roomId, "attendances")
    );

    const participantsCount = attendanceSnap.size;

    tableBody.innerHTML += `
      <tr class="hover:bg-gray-50 transition">
        <td class="px-6 py-4">${room.date || ""}</td>
        <td class="px-6 py-4 font-medium">${room.chorale || ""}</td>
        <td class="px-6 py-4">${room.type || ""}</td>
        <td class="px-6 py-4 text-gray-600">
          ${room.createdByName || "Inconnu"}
        </td>
        <td class="px-6 py-4 text-center font-semibold text-primary">
          ${participantsCount}
        </td>
        <td class="px-6 py-4 text-center">
          <span class="
            text-xs px-3 py-1 rounded-full
            ${room.status === "active"
              ? "bg-green-100 text-green-600"
              : room.status === "closed"
              ? "bg-yellow-100 text-yellow-600"
              : "bg-gray-100 text-gray-600"}
          ">
            ${room.status}
          </span>
        </td>
      </tr>
    `;
  }
}
