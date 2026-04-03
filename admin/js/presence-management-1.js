import { db } from "/myUm/mains.js/firebase-config.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let lastDoc = null;
let isLoading = false;
let hasMore = true;
let paginatedWeeks = [];
let currentPage = 0;


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

function getWeekKey(dateStr) {

  if (!dateStr) return "unknown";

  const date = new Date(dateStr);

  const firstDay = new Date(date);
  firstDay.setDate(date.getDate() - date.getDay());

  return firstDay.toISOString().split("T")[0];
}
// ===============================
// LOAD ROOMS
// ===============================
export async function loadRooms(initial = false) {

  if (isLoading || !hasMore) return;

  isLoading = true;

  let q;

  if (initial) {
    roomsList.innerHTML = "";
    rooms = [];
    lastDoc = null;
    hasMore = true;
  }

  if (lastDoc) {
    q = query(
      collection(db, "presenceRooms"),
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(10)
    );
  } else {
    q = query(
      collection(db, "presenceRooms"),
      orderBy("createdAt", "desc"),
      limit(10)
    );
  }

  const snap = await getDocs(q);

  if (snap.empty) {
    hasMore = false;
    isLoading = false;
    return;
  }

  lastDoc = snap.docs[snap.docs.length - 1];

  snap.forEach(doc => {
    rooms.push({
      id: doc.id,
      ...doc.data()
    });
  });

  filteredRooms = [...rooms];

  renderRooms();

  isLoading = false;
}


// ===============================
// RENDER
// ===============================
export function renderRooms() {

  paginateByWeek();

  roomsList.innerHTML = "";

  const currentRooms = paginatedWeeks[currentPage] || [];

  if (currentRooms.length === 0) {
    roomsList.innerHTML = "<p class='text-sm text-gray-500'>Aucun salon</p>";
    return;
  }

  currentRooms.forEach(room => {

    const item = document.createElement("div");

    item.className = `
      bg-white rounded-3xl shadow-sm p-4 space-y-2 
      active:scale-[0.98] transition cursor-pointer
    `;

    const formattedDate = formatDate(room.date);

item.innerHTML = `
  <div class="flex items-start gap-3">

    <!-- PHOTO -->
    <img 
      src="${room.photoURL || '/myUm/assets/default-avatar.png'}"
      class="w-10 h-10 rounded-full object-cover">

    <!-- CONTENU -->
    <div class="flex-1 space-y-1">

      <div class="flex justify-between items-start">

        <p class="text-xs font-semibold text-gray-800 leading-snug">
          ${formattedDate} • ${room.chorale} • ${room.createdByName} • ${room.type}
        </p>

        <span class="text-[10px] px-2 py-1 rounded-full 
          ${room.status === "active"
            ? "bg-green-100 text-green-600"
            : "bg-gray-100 text-gray-500"}">
          ${room.status === "active" ? "Actif" : "Fermé"}
        </span>

      </div>

      <p class="text-[11px] text-gray-500 line-clamp-2">
        ${room.description || "Aucune description"}
      </p>

    </div>

  </div>
`;

    const indicator = document.getElementById("pageIndicator");

if (indicator) {
  const total = paginatedWeeks.length || 1;
  indicator.textContent = `${currentPage + 1}/${total}`;
}

    // NAVIGATION
    item.addEventListener("click", () => {
      window.location.href = `/myUm/admin/presence-details.html?roomId=${room.id}`;
    });

    roomsList.appendChild(item);

  });

}

// PAGINATION PAR SEMAINE
function paginateByWeek() {

  const map = {};

  filteredRooms.forEach(room => {

    const key = getWeekKey(room.date);

    if (!map[key]) map[key] = [];

    if (map[key].length < 10) {
      map[key].push(room);
    }

  });

  paginatedWeeks = Object.keys(map)
    .sort((a, b) => new Date(b) - new Date(a))
    .map(key => map[key]);

  // 🔒 sécurité pagination
  if (currentPage >= paginatedWeeks.length) {
    currentPage = 0;
  }
}

// ===============================
loadRooms(true);

window.addEventListener("scroll", () => {

  const scrollPosition = window.innerHeight + window.scrollY;
  const bottom = document.body.offsetHeight - 100;

  if (scrollPosition >= bottom) {
    loadRooms();
  }

});

export function setPage(page) {
  currentPage = page;
  renderRooms();
}

export function getPaginationInfo() {
  return {
    current: currentPage,
    total: paginatedWeeks.length
  };
}
