import {
  collection,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { db } from "/myUm/mains.js/firebase-config.js";

// ===============================
// INIT HEADER ACTIONS
// ===============================
export function initPresenceHeaderActions(roomId) {

  injectDeleteButton();

  bindDeleteEvent(roomId);

}

// ===============================
// INJECT BUTTON
// ===============================
function injectDeleteButton() {

  const header = document.getElementById("header-back");

  if (!header) return;

  // 🔥 fonction d'injection réelle
  function inject() {

    let actionsContainer = header.querySelector(".header-actions");

    // ✅ si pas de container → on le crée
    if (!actionsContainer) {

      actionsContainer = document.createElement("div");

      actionsContainer.className = `
        header-actions
        absolute right-4 top-1/2 -translate-y-1/2
        flex items-center gap-2
      `;

      const headerInner = header.firstElementChild;

      if (!headerInner) return;
      
      headerInner.appendChild(actionsContainer);
    }

    // ✅ éviter doublon
    if (actionsContainer.querySelector(".deletePresenceBtn")) return;

    const btn = document.createElement("button");

    btn.className = `
      deletePresenceBtn
      text-gray-400
      active:scale-95
      transition
    `;

    btn.innerHTML = `<i class="bi bi-trash text-sm"></i>`;

    btn.onclick = () => {
      window.dispatchEvent(new Event("deleteAllPresences"));
    };

    actionsContainer.appendChild(btn);
  }

  // 👀 observer (cas async du partial)
  const observer = new MutationObserver(() => {
    inject();
  });

  observer.observe(header, { childList: true, subtree: true });

  // 🔥 injection immédiate (IMPORTANT)
  inject();
}

// ===============================
// DELETE LOGIC
// ===============================
function bindDeleteEvent(roomId) {

  window.addEventListener("deleteAllPresences", async () => {

    const confirmDelete = confirm("Supprimer toutes les présences ?");

    if (!confirmDelete) return;

    try {

      const snap = await getDocs(
        collection(db, "presenceRooms", roomId, "attendances")
      );

      const promises = [];

      snap.forEach(docSnap => {
        promises.push(
          deleteDoc(
            doc(db, "presenceRooms", roomId, "attendances", docSnap.id)
          )
        );
      });

      await Promise.all(promises);

      window.dispatchEvent(new Event("presenceUpdated"));

    } catch (err) {
      console.error(err);
      alert("Erreur suppression");
    }

  });

}
