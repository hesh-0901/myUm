import { db } from "/myUm/mains.js/firebase-config.js";

import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ===============================
// STATE
// ===============================
let currentRoomId = null;
let members = [];


// ===============================
// OPEN MODAL
// ===============================
export function openAttendanceModal(roomId) {

  currentRoomId = roomId;

  const modal = document.getElementById("attendanceModal");

  if (!modal) return;

  modal.classList.remove("hidden");

  initModalEvents(); // 🔥 important

  loadMembers();
}


// ===============================
// INIT EVENTS (APRÈS INJECTION)
// ===============================
function initModalEvents() {

  const modal = document.getElementById("attendanceModal");
  const closeBtn = document.getElementById("closeAttendanceModal");
  const searchInput = document.getElementById("attendanceSearch");

  if (!modal || !closeBtn || !searchInput) return;

  // CLOSE
  closeBtn.onclick = () => {
    modal.classList.add("hidden");
  };

  // SEARCH
  searchInput.oninput = () => {

    const value = searchInput.value.toLowerCase();

    const filtered = members.filter(m =>
      m.name?.toLowerCase().includes(value)
    );

    renderMembers(filtered);
  };

}


// ===============================
// LOAD MEMBERS
// ===============================
async function loadMembers() {

  const results = document.getElementById("attendanceResults");

  if (!results) return;

  const snap = await getDocs(collection(db, "members"));

  members = [];

  snap.forEach(doc => {
    members.push({ id: doc.id, ...doc.data() });
  });

  renderMembers(members);
}


// ===============================
// RENDER
// ===============================
function renderMembers(list) {

  const results = document.getElementById("attendanceResults");

  if (!results) return;

  results.innerHTML = "";

  list.forEach(m => {

    const item = document.createElement("div");

    item.className = `
      flex items-center justify-between
      p-3 rounded-xl border border-gray-100
      active:scale-[0.98] transition
    `;

    item.innerHTML = `
      <div>
        <p class="text-sm font-medium text-gray-800">${m.name}</p>
        <p class="text-xs text-gray-500">${m.chorale || ""}</p>
      </div>

      <span class="text-primary text-sm font-semibold">
        Ajouter
      </span>
    `;

    item.addEventListener("click", () => addAttendance(m));

    results.appendChild(item);

  });

}


// ===============================
// ADD ATTENDANCE
// ===============================
async function addAttendance(member) {

  if (!currentRoomId) return;

  const modal = document.getElementById("attendanceModal");

  await addDoc(
    collection(db, "presenceRooms", currentRoomId, "attendances"),
    {
      fullName: member.name,
      chorale: member.chorale || "",
      userId: member.id,

      method: "manual",

      timestamp: serverTimestamp()
    }
  );

  if (modal) modal.classList.add("hidden");

}
