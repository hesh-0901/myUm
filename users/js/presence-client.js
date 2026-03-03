import { db } from "/myUm/mains.js/firebase-config.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { openRadar } from "/myUm/partials/js/radar.js";

const presenceBtn = document.getElementById("presenceBtn");

if (presenceBtn) {

  presenceBtn.addEventListener("click", async () => {

    presenceBtn.classList.add("opacity-70");

    const storedUser = localStorage.getItem("myum_user");
    if (!storedUser) {
      alert("Session expirée.");
      presenceBtn.classList.remove("opacity-70");
      return;
    }

    const user = JSON.parse(storedUser);

    // ==========================
    // CHERCHER SALON ACTIF
    // ==========================

    const q = query(
      collection(db, "presenceRooms"),
      where("status", "==", "active")
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      alert("Aucun salon actif pour le moment.");
      presenceBtn.classList.remove("opacity-70");
      return;
    }

    const roomDoc = snap.docs[0];
    const roomData = roomDoc.data();

    // ==========================
    // VERIFIER CHORALE
    // ==========================

    if (
      roomData.chorale !== user.chorale &&
      roomData.chorale !== "UM"
    ) {
      alert("Ce salon ne concerne pas votre chorale.");
      presenceBtn.classList.remove("opacity-70");
      return;
    }

    // ==========================
    // LANCER RADAR
    // ==========================

    openRadar(roomDoc.id);

    presenceBtn.classList.remove("opacity-70");

  });

}
