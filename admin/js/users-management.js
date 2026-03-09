import {
  db
} from "../../mains.js/firebase-config.js";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* =========================
   DOM
========================= */

const usersContainer = document.getElementById("usersContainer");

const tabActive = document.getElementById("tabActive");
const tabPending = document.getElementById("tabPending");
const tabRejected = document.getElementById("tabRejected");

const modal = document.getElementById("userDetailModal");
const modalCard = document.getElementById("userDetailCard");
const closeModal = document.getElementById("closeUserModal");


/* =========================
   STATE
========================= */

let currentStatus = "active";
let usersCache = [];


/* =========================
   TAB EVENTS
========================= */

tabActive.addEventListener("click", () => {
  switchTab("active");
});

tabPending.addEventListener("click", () => {
  switchTab("pending");
});

tabRejected.addEventListener("click", () => {
  switchTab("rejected");
});


function switchTab(status) {

  currentStatus = status;

  tabActive.classList.remove("bg-[#2596D9]", "text-white");
  tabPending.classList.remove("bg-[#2596D9]", "text-white");
  tabRejected.classList.remove("bg-[#2596D9]", "text-white");

  if (status === "active") {
    tabActive.classList.add("bg-[#2596D9]", "text-white");
  }

  if (status === "pending") {
    tabPending.classList.add("bg-[#2596D9]", "text-white");
  }

  if (status === "rejected") {
    tabRejected.classList.add("bg-[#2596D9]", "text-white");
  }

  loadUsers();

}


/* =========================
   LOAD USERS
========================= */

async function loadUsers() {

  usersContainer.innerHTML = `
  <div class="text-sm opacity-60">Chargement...</div>
  `;

  try {

    const usersRef = collection(db, "users");

    const q = query(
      usersRef,
      where("status", "==", currentStatus)
    );

    const snap = await getDocs(q);

    usersCache = [];

    snap.forEach(docSnap => {

      usersCache.push({
        id: docSnap.id,
        ...docSnap.data()
      });

    });

    renderUsers();

  }

  catch (err) {

    console.error(err);

    usersContainer.innerHTML = `
    <div class="text-sm text-red-500">
    Erreur chargement utilisateurs
    </div>
    `;

  }

}


/* =========================
   RENDER USERS
========================= */

function renderUsers() {

  usersContainer.innerHTML = "";

  if (usersCache.length === 0) {

    usersContainer.innerHTML = `
    <div class="text-sm opacity-60">
    Aucun utilisateur
    </div>
    `;

    return;
  }

  usersCache.forEach(user => {

    const row = document.createElement("div");

    row.className =
      "flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50";

    row.innerHTML = `

      <img
      src="${user.photoURL || "/myUm/assets/default-avatar.png"}"
      class="w-12 h-12 rounded-full object-cover">

      <div class="flex-1">

        <div class="text-sm font-medium">
        ${user.displayName || "Utilisateur"}
        </div>

        <div class="text-xs opacity-60">
        ${user.email || ""}
        </div>

      </div>

      <i class="bi bi-chevron-right text-gray-400"></i>

    `;

    row.addEventListener("click", () => {
      openUserModal(user);
    });

    usersContainer.appendChild(row);

  });

}


/* =========================
   USER MODAL
========================= */

function openUserModal(user) {

  modal.classList.remove("hidden");

  modalCard.innerHTML = `

  <div class="flex flex-col items-center text-center gap-2">

    <img
    src="${user.photoURL || "/myUm/assets/default-avatar.png"}"
    class="w-20 h-20 rounded-full object-cover">

    <div class="text-lg font-semibold">
    ${user.displayName || "Utilisateur"}
    </div>

    <div class="text-sm opacity-60">
    ${user.email || ""}
    </div>

  </div>


  <div class="flex gap-2 pt-2">

  ${buildActions(user)}

  </div>

  `;

}


/* =========================
   ACTION BUTTONS
========================= */

function buildActions(user) {

  if (user.status === "pending") {

    return `

    <button
    id="approveUser"
    class="flex-1 bg-green-600 text-white rounded-xl py-2 text-sm font-semibold">

    Approuver

    </button>

    <button
    id="rejectUser"
    class="flex-1 bg-red-600 text-white rounded-xl py-2 text-sm font-semibold">

    Refuser

    </button>

    `;

  }

  if (user.status === "rejected") {

    return `

    <button
    id="restoreUser"
    class="flex-1 bg-blue-500 text-white rounded-xl py-2 text-sm font-semibold">

    Restaurer

    </button>

    `;

  }

  return `
  <div class="text-sm opacity-60 w-full text-center">
  Utilisateur actif
  </div>
  `;

}


/* =========================
   MODAL EVENTS
========================= */

modal.addEventListener("click", (e) => {

  if (e.target === modal) {
    modal.classList.add("hidden");
  }

});

closeModal.addEventListener("click", () => {

  modal.classList.add("hidden");

});


/* =========================
   USER ACTIONS
========================= */

document.addEventListener("click", async (e) => {

  const approveBtn = e.target.closest("#approveUser");
  const rejectBtn = e.target.closest("#rejectUser");
  const restoreBtn = e.target.closest("#restoreUser");

  if (!approveBtn && !rejectBtn && !restoreBtn) return;

  const userName =
    modalCard.querySelector("div.text-lg").textContent;

  const user = usersCache.find(
    u => u.displayName === userName
  );

  if (!user) return;

  try {

    const ref = doc(db, "users", user.id);

    if (approveBtn) {
      await updateDoc(ref, { status: "active" });
    }

    if (rejectBtn) {
      await updateDoc(ref, { status: "rejected" });
    }

    if (restoreBtn) {
      await updateDoc(ref, { status: "active" });
    }

    modal.classList.add("hidden");

    loadUsers();

  }

  catch (err) {

    console.error(err);

    alert("Erreur mise à jour utilisateur");

  }

});


/* =========================
   INIT
========================= */

loadUsers();
