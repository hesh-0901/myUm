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
export function initPresenceHeaderActions(config) {

  const { roomId, delete: enableDelete } = config;

  if (enableDelete) {
    injectDeleteButton();
    bindDeleteEvent(roomId);
  }

}

// ===============================
// INJECT BUTTON
// ===============================
function injectDeleteButton() {

  const header = document.getElementById("header-back");
  if (!header) return;

  function inject() {

    // 🔥 attendre que le header soit chargé
    const headerInner = header.querySelector("div");

    if (!headerInner) return;

    let actionsContainer = headerInner.querySelector(".header-actions");

    // ✅ créer container si absent
    if (!actionsContainer) {

      actionsContainer = document.createElement("div");

      actionsContainer.className = `
        header-actions
        ml-auto flex items-center gap-2
      `;

      headerInner.appendChild(actionsContainer);
    }

    // éviter doublon
    if (actionsContainer.querySelector(".deletePresenceBtn")) return;

    const btn = document.createElement("button");

    btn.className = `
      deletePresenceBtn
      text-gray-400
      hover:text-red-500
      active:scale-95
      transition
    `;

    btn.innerHTML = `<i class="bi bi-trash text-sm"></i>`;

    btn.onclick = () => {
      window.dispatchEvent(new Event("deleteAllPresences"));
    };

    actionsContainer.appendChild(btn);
  }

  // 👀 observer pour attendre le partial
  const observer = new MutationObserver(() => {
    inject();
  });

  observer.observe(header, { childList: true, subtree: true });

  // 🔥 tentative immédiate
  inject();
}

// ===============================
// DELETE LOGIC
// ===============================
function bindDeleteEvent(roomId) {

  if (!roomId) return;

  window.addEventListener("deleteAllPresences", async () => {

    const confirmDelete = confirm("Supprimer toutes les présences ?");

    if (!confirmDelete) return;

    try {

      const attendancesRef = collection(
        db,
        "presenceRooms",
        roomId,
        "attendances"
      );

      const snap = await getDocs(attendancesRef);

      // ===============================
      // CAS 1 : IL Y A DES PRÉSENCES
      // ===============================
      if (!snap.empty) {

        const promises = [];

        snap.forEach(docSnap => {
          promises.push(
            deleteDoc(
              doc(db, "presenceRooms", roomId, "attendances", docSnap.id)
            )
          );
        });

        await Promise.all(promises);

        alert("Présences supprimées");

        window.dispatchEvent(new Event("presenceUpdated"));
        return;
      }

      // ===============================
      // CAS 2 : AUCUNE PRÉSENCE → DELETE ROOM
      // ===============================
      const confirmRoomDelete = confirm(
        "Aucune présence. Supprimer complètement le salon ?"
      );

      if (!confirmRoomDelete) return;

      await deleteDoc(doc(db, "presenceRooms", roomId));

      alert("Salon supprimé");

      // 🔥 redirection propre (IMPORTANT UX)
window.location.href = "/myUm/admin/presence-management.html";

    } catch (err) {
      console.error(err);
      alert("Erreur suppression");
    }

  });

}
