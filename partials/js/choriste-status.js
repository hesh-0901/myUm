import { db } from "/myUm/mains.js/firebase-config.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export function initChoristeStatus() {

  const current = document.getElementById("currentStatus");
  const options = document.getElementById("statusOptions");
  const text = document.getElementById("statusText");
  const icon = document.getElementById("statusIcon");

  if (!current || !options) return;

  // mapping
  function mapStatusToFirestore(status) {
    switch (status) {
      case "Actif":
        return "Actif";
      case "Suspendu":
        return "Suspendu";
      case "En déplacement":
        return "En déplacement";
      case "Repos autorisé":
        return "Repos autorisé";
      default:
        return "Actif";
    }
  }

  // ouvrir / fermer
  current.onclick = () => {
    options.classList.toggle("hidden");
  };

  // sélectionner
  document.querySelectorAll(".status-option").forEach(option => {

    option.onclick = async () => {

      const selected = option.dataset.status;

      // UI update
      text.innerText = selected;

      switch (selected) {

        case "Actif":
          icon.className = "bi bi-check-circle-fill text-green-500";
          break;

        case "Suspendu":
          icon.className = "bi bi-pause-circle-fill text-red-500";
          break;

        case "En déplacement":
          icon.className = "bi bi-geo-alt-fill text-blue-500";
          break;

        case "Repos autorisé":
          icon.className = "bi bi-moon-fill text-purple-500";
          break;

      }

      options.classList.add("hidden");

      // 🔥 FIRESTORE
      try {

        const roomId = new URLSearchParams(window.location.search).get("roomId");
        const user = window.currentUser;

        if (!roomId || !user) return;

        const statusValue = mapStatusToFirestore(selected);

        await setDoc(
          doc(db, "presenceRooms", roomId, "attendance", user.username),
          {
            username: user.username,
            fullName: user.fullName,
            chorale: user.chorale,
            status: statusValue,
            updatedAt: new Date()
          },
          { merge: true }
        );

        console.log("✅ Statut sauvegardé");

      } catch (err) {
        console.error("❌ Erreur statut:", err);
      }

    };

  });

  // fermer si clic dehors
  document.addEventListener("click", (e) => {
    if (!current.contains(e.target) && !options.contains(e.target)) {
      options.classList.add("hidden");
    }
  });

}

async function loadUserStatus(text, icon) {

  try {

    const roomId = new URLSearchParams(window.location.search).get("roomId");
    const user = window.currentUser;

    if (!roomId || !user) return;

    const ref = doc(db, "presenceRooms", roomId, "attendance", user.username);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const data = snap.data();
    const status = data.status;

    // 🔥 appliquer UI
    text.innerText = status;

    switch (status) {

      case "Actif":
        icon.className = "bi bi-check-circle-fill text-green-500";
        break;

      case "Suspendu":
        icon.className = "bi bi-pause-circle-fill text-red-500";
        break;

      case "En déplacement":
        icon.className = "bi bi-geo-alt-fill text-blue-500";
        break;

      case "Repos autorisé":
        icon.className = "bi bi-moon-fill text-purple-500";
        break;

    }

  } catch (err) {
    console.error("❌ Erreur chargement statut:", err);
  }
}
