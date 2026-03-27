import { db } from "/myUm/mains.js/firebase-config.js";

import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


const modal = document.getElementById("attendanceModal");
const closeBtn = document.getElementById("closeAttendanceModal");
const searchInput = document.getElementById("attendanceSearch");
const results = document.getElementById("attendanceResults");

let currentRoomId = null;
let members = [];


// ===============================
// OPEN MODAL
// ===============================
export function openAttendanceModal(roomId) {

  currentRoomId = roomId;
  modal.classList.remove("hidden");

  loadMembers();
}


// ===============================
// CLOSE
// ===============================
closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});


// ===============================
// LOAD MEMBERS
// ===============================
async function loadMembers() {

  const snap = await getDocs(collection(db, "members"));

  members = [];

  snap.forEach(doc => {
    members.push({ id: doc.id, ...doc.data() });
  });

  renderMembers(members);
}


// ===============================
// SEARCH
// ===============================
searchInput.addEventListener("input", () => {

  const value = searchInput.value.toLowerCase();

  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(value)
  );

  renderMembers(filtered);
});


// ===============================
// RENDER
// ===============================
function renderMembers(list) {

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

      <button class="text-primary text-sm font-semibold">
        Ajouter
      </button>
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

  modal.classList.add("hidden");

}
