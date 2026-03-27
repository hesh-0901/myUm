import { db } from "/myUm/mains.js/firebase-config.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


const roomsList = document.getElementById("roomsList");

export let rooms = [];
export let filteredRooms = [];


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
// LOAD ROOMS
// ===============================
export async function loadRooms() {

  const snap = await getDocs(collection(db, "presenceRooms"));

  rooms = [];

  snap.forEach(doc => {
    rooms.push({
      id: doc.id,
      ...doc.data()
    });
  });

  // TRI PRO : actifs en haut + récents
  rooms.sort((a, b) => {

    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;

    return new Date(b.date) - new Date(a.date);

  });

  filteredRooms = [...rooms];

  renderRooms();
}


// ===============================
// RENDER
// ===============================
export function renderRooms() {

  roomsList.innerHTML = "";

  if (filteredRooms.length === 0) {
    roomsList.innerHTML = "<p class='text-sm text-gray-500'>Aucun salon</p>";
    return;
  }

  filteredRooms.forEach(room => {

    const item = document.createElement("div");

    item.className = `
      bg-white rounded-3xl shadow-sm p-4 space-y-2 
      active:scale-[0.98] transition cursor-pointer
    `;

    const formattedDate = formatDate(room.date);

    item.innerHTML = `
      <div class="flex justify-between items-start">

        <div class="space-y-1">

          <p class="text-xs font-semibold text-gray-800 leading-snug">
            ${formattedDate} • ${room.chorale} • ${room.createdByName} • ${room.type}
          </p>

          <p class="text-xs text-gray-500 line-clamp-2">
            ${room.description || "Aucune description"}
          </p>

        </div>

        <span class="text-xs px-2 py-1 rounded-full 
          ${room.status === "active"
            ? "bg-green-100 text-green-600"
            : "bg-gray-100 text-gray-500"}">
          ${room.status === "active" ? "Actif" : "Fermé"}
        </span>

      </div>
    `;

    // NAVIGATION
    item.addEventListener("click", () => {
      window.location.href = `/myUm/admin/presence-details.html?roomId=${room.id}`;
    });

    roomsList.appendChild(item);

  });

}


// ===============================
loadRooms();
