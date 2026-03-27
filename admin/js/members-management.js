/*members-management.js*/
import { db } from "/myUm/mains.js/firebase-config.js";

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const membersList = document.getElementById("membersList");
const searchInput = document.getElementById("searchInput");
const addBtn = document.getElementById("addBtn");

let members = [];
let filtered = [];


// ===============================
// LOAD MEMBERS
// ===============================
async function loadMembers() {

  const snap = await getDocs(collection(db, "members"));

  members = [];

  snap.forEach(docSnap => {
    members.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  filtered = [...members];

  render();
}


// ===============================
// RENDER
// ===============================
function render() {

  membersList.innerHTML = "";

  filtered.forEach(m => {

    const item = document.createElement("div");

    item.className = "bg-white rounded-3xl shadow-sm p-4 space-y-2";

    item.innerHTML = `
      <div class="flex justify-between items-center">

        <div>
          <p class="text-sm font-semibold">${m.fullName}</p>
          <p class="text-xs text-gray-500">${m.matricule}</p>
        </div>

        <div class="flex gap-3">
          <i class="bi bi-pencil edit text-gray-500 cursor-pointer"></i>
          <i class="bi bi-trash delete text-red-500 cursor-pointer"></i>
        </div>

      </div>
    `;

    // EDIT
    item.querySelector(".edit").addEventListener("click", () => {
      editMember(m);
    });

    // DELETE
    item.querySelector(".delete").addEventListener("click", async () => {

      if (!confirm("Supprimer ce membre ?")) return;

      await deleteDoc(doc(db, "members", m.id));
      loadMembers();

    });

    membersList.appendChild(item);
  });
}


// ===============================
// ADD MEMBER
// ===============================
addBtn.addEventListener("click", async () => {

  const name = prompt("Nom complet");
  const matricule = prompt("Matricule");

  if (!name || !matricule) return;

  await addDoc(collection(db, "members"), {
    fullName: name,
    matricule: matricule
  });

  loadMembers();
});


// ===============================
// EDIT MEMBER
// ===============================
async function editMember(m) {

  const name = prompt("Modifier nom", m.fullName);
  const matricule = prompt("Modifier matricule", m.matricule);

  if (!name || !matricule) return;

  await updateDoc(doc(db, "members", m.id), {
    fullName: name,
    matricule: matricule
  });

  loadMembers();
}


// ===============================
// SEARCH
// ===============================
searchInput.addEventListener("input", () => {

  const value = searchInput.value.toLowerCase();

  filtered = members.filter(m =>
    m.fullName.toLowerCase().includes(value) ||
    m.matricule.toLowerCase().includes(value)
  );

  render();
});


// ===============================
loadMembers();
