/*members-management.js*/
import { db } from "/myUm/mains.js/firebase-config.js";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const membersList = document.getElementById("membersList");
const searchInput = document.getElementById("searchInput");
const addBtn = document.getElementById("addBtn");

const modal = document.getElementById("memberModal");
const modalName = document.getElementById("modalName");
const modalMatricule = document.getElementById("modalMatricule");
const saveBtn = document.getElementById("saveMember");
const closeModal = document.getElementById("closeModal");

let members = [];
let filtered = [];
let editing = null;

// LOAD
async function loadMembers() {

  membersList.innerHTML = loader();

  const snap = await getDocs(collection(db, "members"));

  members = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  filtered = [...members];

  render();
}

// RENDER
function render() {

  membersList.innerHTML = "";

  if (!filtered.length) {
    membersList.innerHTML = `<p class="text-sm text-gray-400 text-center">Aucun membre</p>`;
    return;
  }

  filtered.forEach(m => {

    const el = document.createElement("div");

    el.className = "bg-white rounded-3xl shadow-sm p-4 flex justify-between items-center";

    el.innerHTML = `
      <div class="flex items-center gap-3">

        <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
          ${m.fullName?.charAt(0) || "U"}
        </div>

        <div>
          <p class="text-sm font-semibold">${m.fullName}</p>
          <p class="text-xs text-gray-500">${m.matricule}</p>
        </div>

      </div>

      <div class="flex gap-3 text-lg">
        <i class="bi bi-pencil edit text-gray-400"></i>
        <i class="bi bi-trash delete text-red-400"></i>
      </div>
    `;

    el.querySelector(".edit").onclick = () => openModal(m);
    el.querySelector(".delete").onclick = async () => {
      if (!confirm("Supprimer ?")) return;
      await deleteDoc(doc(db, "members", m.id));
      loadMembers();
    };

    membersList.appendChild(el);
  });
}

// MODAL OPEN
function openModal(m = null) {

  editing = m;

  modalName.value = m?.fullName || "";
  modalMatricule.value = m?.matricule || "";

  modal.classList.remove("hidden");
}

// SAVE
saveBtn.onclick = async () => {

  const name = modalName.value.trim();
  const mat = modalMatricule.value.trim();

  if (!name || !mat) return;

  if (editing) {
    await updateDoc(doc(db, "members", editing.id), {
      fullName: name,
      matricule: mat
    });
  } else {
    await addDoc(collection(db, "members"), {
      fullName: name,
      matricule: mat
    });
  }

  modal.classList.add("hidden");
  loadMembers();
};

// CLOSE
closeModal.onclick = () => modal.classList.add("hidden");
modal.onclick = e => { if (e.target === modal) modal.classList.add("hidden"); };

// ADD BTN
addBtn.onclick = () => openModal();

// SEARCH
searchInput.oninput = () => {

  const v = searchInput.value.toLowerCase();

  filtered = members.filter(m =>
    (m.fullName || "").toLowerCase().includes(v) ||
    (m.matricule || "").toLowerCase().includes(v)
  );

  render();
};

// LOADER
function loader() {
  return `
  <div class="animate-pulse space-y-2">
    <div class="h-14 bg-gray-100 rounded-xl"></div>
    <div class="h-14 bg-gray-100 rounded-xl"></div>
  </div>`;
}

loadMembers();
