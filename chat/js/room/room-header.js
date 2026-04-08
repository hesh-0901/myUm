import { db } from "../../../mains.js/firebase-config.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export function listenHeader(friendId, dom) {

  const userRef = doc(db, "users", friendId);

  onSnapshot(userRef, (snap) => {
    if (!snap.exists()) return;

    const u = snap.data();

    const firstName = u.firstName || "";
    const lastName = u.lastName || "";
    const username = u.username || "";
    const photoURL = u.photoURL || null;

    const display =
      `${firstName} ${lastName}`.trim() ||
      username ||
      "Utilisateur";

    dom.roomTitle.textContent = display;

    // avatar
    if (photoURL) {
      dom.roomAvatar.innerHTML =
        `<img src="${photoURL}" class="w-full h-full object-cover">`;
    } else {
      dom.roomAvatar.textContent = display[0] || "U";
    }

    // online
    const lastSeen = u.lastSeen?.toDate ? u.lastSeen.toDate() : null;

    if (lastSeen && Date.now() - lastSeen.getTime() < 45000) {
      dom.roomSub.textContent = "En ligne";
    } else if (lastSeen) {
      const h = String(lastSeen.getHours()).padStart(2, "0");
      const m = String(lastSeen.getMinutes()).padStart(2, "0");
      dom.roomSub.textContent = `Vu à ${h}:${m}`;
    } else {
      dom.roomSub.textContent = "";
    }

  });

}