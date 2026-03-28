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


// ===============================
// OPEN
// ===============================
export function openAttendanceModal(roomId) {

  currentRoomId = roomId;

  const modal = document.getElementById("attendanceModal");
  if (!modal) return;

  modal.classList.remove("hidden");

  initEvents();
  loadData();
}


// ===============================
// INIT EVENTS
// ===============================
function initEvents() {

  const closeBtn = document.getElementById("closeAttendanceModal");
  const searchInput = document.getElementById("attendanceSearch");
  const searchType = document.getElementById("searchType");
  const choraleFilter = document.getElementById("choraleFilter");

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

  const usersSnap = await getDocs(collection(db, "users"));
  const membersSnap = await getDocs(collection(db, "members"));

  users = [];
  members = [];

  usersSnap.forEach(doc => users.push({ id: doc.id, ...doc.data(), source: "users" }));
  membersSnap.forEach(doc => members.push({ id: doc.id, ...doc.data(), source: "members" }));

  mergeData();
}


// ===============================
// MERGE
// ===============================
function mergeData() {

  const usersMap = {};
  users.forEach(u => usersMap[u.username] = u);

  finalList = [...users];

  members.forEach(m => {
    if (!usersMap[m.username]) {
      finalList.push(m);
    }
  });

  render(finalList);
}


// ===============================
// FILTERS
// ===============================
function getChorale(username) {
  if (!username) return "";
  const parts = username.split("-");
  return parts[parts.length - 1];
}

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
        return m.username?.toLowerCase().includes(value);
      }
      return (m.fullName || m.name || "").toLowerCase().includes(value);
    });
  }

  render(list);
}


// ===============================
// RENDER
// ===============================
function render(list) {

  const container = document.getElementById("attendanceResults");
  container.innerHTML = "";

  list.forEach(m => {

    const item = document.createElement("div");

    item.className = `
      flex items-center justify-between
      p-3 rounded-xl border border-gray-100
      active:scale-[0.98] transition
    `;

    item.innerHTML = `
      <div>
        <p class="text-sm font-semibold text-gray-800">
          ${m.username || ""}
          ${m.source === "members"
            ? '<i class="bi bi-exclamation-circle text-gray-400 text-xs ml-1"></i>'
            : ""}
        </p>
        <p class="text-xs text-gray-500">
  ${m.fullName || m.name || ""}
</p>
      </div>

      <span class="text-primary text-sm font-semibold">+</span>
    `;

    item.onclick = () => addAttendance(m);

    container.appendChild(item);
  });
}


// ===============================
// ADD
// ===============================
async function addAttendance(member) {

  if (!currentRoomId) return;

  await addDoc(
    collection(db, "presenceRooms", currentRoomId, "attendances"),
    {
      fullName: member.fullName || member.name || "",
      username: member.username,
      chorale: getChorale(member.username),

      method: "manual",
      timestamp: serverTimestamp()
    }
  );

  document.getElementById("attendanceModal").classList.add("hidden");
}
