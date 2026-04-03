import { db } from "/myUm/mains.js/firebase-config.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export function initChoristeStatus() {

  console.log("🚀 initChoristeStatus lancé");

  const current = document.getElementById("currentStatus");
  const options = document.getElementById("statusOptions");
  const text = document.getElementById("statusText");
  const icon = document.getElementById("statusIcon");

  if (!current || !options) {
    console.log("❌ éléments DOM manquants");
    return;
  }

  // ===============================
  // MAPPING
  // ===============================
  function mapStatusToFirestore(status) {
    return status;
  }

  // ===============================
  // LOAD STATUS (USER LEVEL)
  // ===============================
  async function loadUserStatus() {

    console.log("🔄 loadUserStatus appelé");

    try {

      const user = JSON.parse(localStorage.getItem("myum_user"));

      console.log("USER DEBUG:", user);

      if (!user || !user.id) {
        console.warn("❌ utilisateur invalide");
        return;
      }

      const ref = doc(db, "users", user.id);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        console.log("⚠️ aucun statut trouvé");
        return;
      }

      const data = snap.data();
      const status = data.status;

      console.log("✅ statut récupéré:", status);

      if (!status) return;

      // UI UPDATE
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
      console.error("❌ Erreur load:", err);
    }
  }

  // ===============================
  // TOGGLE
  // ===============================
  current.onclick = () => {
    options.classList.toggle("hidden");
  };

  // ===============================
  // CLICK OPTION
  // ===============================
  document.querySelectorAll(".status-option").forEach(option => {
    option.addEventListener("click", async () => {

      console.log("CLICK STATUS");

      const selected = option.dataset.status;
      console.log("🎯 statut sélectionné:", selected);

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

      // ===============================
      // SAVE FIRESTORE (USER LEVEL)
      // ===============================
      try {

        const user = JSON.parse(localStorage.getItem("myum_user"));

        console.log("SAVE USER:", user);

        if (!user || !user.id) {
          console.warn("❌ save annulé: user invalide");
          return;
        }

        const statusValue = mapStatusToFirestore(selected);

        await setDoc(
          doc(db, "users", user.id),
          {
            status: statusValue,
            statusUpdatedAt: new Date()
          },
          { merge: true }
        );

        console.log("✅ Statut utilisateur sauvegardé");

      } catch (err) {
        console.error("❌ Erreur save:", err);
      }

    });
  });

  // ===============================
  // CLICK OUTSIDE
  // ===============================
  document.addEventListener("click", (e) => {
    if (!current.contains(e.target) && !options.contains(e.target)) {
      options.classList.add("hidden");
    }
  });

  // ===============================
  // INIT LOAD
  // ===============================
  setTimeout(() => {
    loadUserStatus();
  }, 300);

}
