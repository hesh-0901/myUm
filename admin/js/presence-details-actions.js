import { db } from "/myUm/mains.js/firebase-config.js";
import {
  doc,
  deleteDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let roomId = new URLSearchParams(window.location.search).get("roomId");

// ===============================
// MENU
// ===============================
export function initPresenceActions() {

  document.body.addEventListener("click", async (e) => {

    const btn = e.target.closest(".actionBtn");

    if (btn) {
      e.stopPropagation(); // 🔥 important

      const id = btn.dataset.id;
      showMenu(btn, id);
      return;
    }

    // 👉 clic ailleurs → ferme menu
    removeMenu();

  });

}
// ===============================
// SHOW MENU
// ===============================
function showMenu(btn, id) {

  removeMenu();

  const menu = document.createElement("div");

  menu.id = "actionMenu";

  menu.className = `
    absolute right-4 bg-white shadow-lg rounded-xl
    text-xs p-2 space-y-1 z-50
  `;

  menu.innerHTML = `
    <div class="actionItem p-2 hover:bg-gray-100 rounded" data-action="delete">Supprimer</div>
    <div class="actionItem p-2 hover:bg-gray-100 rounded" data-action="justified">Justifié</div>
    <div class="actionItem p-2 hover:bg-gray-100 rounded" data-action="suspended">Suspendu</div>
    <div class="actionItem p-2 hover:bg-gray-100 rounded" data-action="special">Spécial</div>
  `;

  document.body.appendChild(menu);

  const rect = btn.getBoundingClientRect();
  menu.style.top = `${rect.bottom + window.scrollY}px`;

  menu.querySelectorAll(".actionItem").forEach(item => {
    item.onclick = () => handleAction(item.dataset.action, id);
  });

}


// ===============================
// REMOVE MENU
// ===============================
function removeMenu() {
  document.getElementById("actionMenu")?.remove();
}


// ===============================
// HANDLE ACTION
// ===============================
async function handleAction(action, id) {

  const ref = doc(db, "presenceRooms", roomId, "attendances", id);

if (action === "delete") {

  const confirmDelete = confirm("Supprimer cette présence ?");

  if (!confirmDelete) return;

  await deleteDoc(ref);
}

  if (action === "justified") {
    await updateDoc(ref, { status: "justified" });
  }

  if (action === "suspended") {
    await updateDoc(ref, { status: "suspended" });
  }

  if (action === "special") {
    await updateDoc(ref, { status: "special" });
  }

  window.dispatchEvent(new Event("presenceUpdated"));
}
