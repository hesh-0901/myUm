import { db } from "/myUm/mains.js/firebase-config.js";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentRoomId = null;
let users = [];
let members = [];
let finalList = [];
let presentUsernames = new Set();

// ===============================
// OPEN
// ===============================
export async function openAttendanceModal(roomId) {

  currentRoomId = roomId;

  const modal = document.getElementById("attendanceModal");
  if (!modal) return;

  modal.classList.remove("hidden");

  initEvents();

  await loadPresentUsers(); // 🔥 AJOUT

  if (finalList.length === 0) {
    await loadData();
  } else {
    render(finalList);
  }
}

// ===============================
// INIT EVENTS
// ===============================
function initEvents() {

  const closeBtn = document.getElementById("closeAttendanceModal");
  const searchInput = document.getElementById("attendanceSearch");
  const searchType = document.getElementById("searchType");
  const choraleFilter = document.getElementById("choraleFilter");

  if (!closeBtn || !searchInput || !searchType || !choraleFilter) return;

  closeBtn.onclick = () => {
    document.getElementById("attendanceModal").classList.add("hidden");
  };

  searchInput.oninput = applyFilters;
  searchType.onchange = applyFilters;
  choraleFilter.onchange = applyFilters;
}


// ===============================
// LOAD DATA
// ===============================
async function loadData() {

  const [usersSnap, membersSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "members"))
  ]);

  users = [];
  members = [];

    usersSnap.forEach(doc => {
      const d = doc.data();
    
      users.push({
        id: doc.id,
        username: d.username || "",
        fullName: `${d.firstName || ""} ${d.lastName || ""}`.trim(),
        source: "users"
      });
    });
    
    membersSnap.forEach(doc => {
      const d = doc.data();
    
      members.push({
        id: doc.id,
        username: d.matricule || "", // ⚠️ IMPORTANT
        fullName: d.fullName || "",
        source: "members"
      });
    });

  mergeData();
}


// ===============================
// MERGE (users prioritaire)
// ===============================
function mergeData() {

  const usersMap = {};
  users.forEach(u => {
    if (u.username) usersMap[u.username] = true;
  });

  finalList = [...users];

  members.forEach(m => {
    if (!usersMap[m.username]) {
      finalList.push(m);
    }
  });

  render(finalList);
}


// ===============================
// HELPERS
// ===============================
function getChorale(username) {
  if (!username) return "";
  const parts = username.split("-");
  return parts[parts.length - 1] || "";
}

function getName(m) {
  return m.fullName || "";
}


// ===============================
// FILTERS
// ===============================
function applyFilters() {

  const value = document.getElementById("attendanceSearch").value.toLowerCase();
  const type = document.getElementById("searchType").value;
  const chorale = document.getElementById("choraleFilter").value;

  let list = [...finalList];

  // CHORALE
  if (chorale !== "all") {
    list = list.filter(m => getChorale(m.username) === chorale);
  }

  // SEARCH
  if (value) {
    list = list.filter(m => {
      if (type === "id") {
        return (m.username || "").toLowerCase().includes(value);
      }
      return getName(m).toLowerCase().includes(value);
    });
  }

  render(list);
}

async function loadPresentUsers() {

  const snap = await getDocs(
    collection(db, "presenceRooms", currentRoomId, "attendances")
  );

  presentUsernames.clear();

  snap.forEach(doc => {
    const d = doc.data();
    if (d.username) {
      presentUsernames.add(d.username);
    }
  });

}

// ===============================
// RENDER
// ===============================
function render(list) {

  const container = document.getElementById("attendanceResults");
  if (!container) return;

  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML =
      "<p class='text-xs text-gray-400 text-center'>Aucun résultat</p>";
    return;
  }

  list.forEach(m => {

    const isPresent = presentUsernames.has(m.username);

    const item = document.createElement("div");

    item.className = `
      flex items-center justify-between
      p-3 rounded-xl border border-gray-100
      ${isPresent ? "opacity-50" : "active:scale-[0.98]"}
      transition
    `;

    item.innerHTML = `
      <div>
        <p class="text-sm font-semibold text-gray-800">
          ${m.username}
          ${m.source === "members"
            ? '<i class="bi bi-exclamation-circle text-gray-400 text-xs ml-1"></i>'
            : ""}
        </p>

        <p class="text-xs text-gray-500">
          ${m.fullName}
        </p>
      </div>

      ${
        isPresent
          ? `<span class="text-[10px] text-gray-400">déjà présent</span>`
          : `<span class="text-primary text-sm font-semibold">+</span>`
      }
    `;

    // 🔒 Empêche clic si déjà présent
    if (!isPresent) {
      item.onclick = () => addAttendance(m);
    }

    container.appendChild(item);
  });
}


// ===============================
// ADD
// ===============================
async function addAttendance(member) {

  if (!currentRoomId || !member.username) return;

  const fullName = member.fullName?.trim();

  if (!fullName) {
    alert("Nom introuvable pour ce choriste");
    return;
  }

  await addDoc(
    collection(db, "presenceRooms", currentRoomId, "attendances"),
    {
      fullName: fullName,
      username: member.username,
      chorale: getChorale(member.username),
      method: "manual",
      timestamp: serverTimestamp()
    }
  );

  // 🔥 REFRESH MODAL (doublon + badge)
  await loadPresentUsers();
  render(finalList);

  // 🔥 BONUS : prévenir la page principale
  window.dispatchEvent(new Event("presenceUpdated"));

  // fermer modal
  document.getElementById("attendanceModal")?.classList.add("hidden");
}
