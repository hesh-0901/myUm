export function initChoristeStatus() {

  const current = document.getElementById("currentStatus");
  const options = document.getElementById("statusOptions");
  const text = document.getElementById("statusText");
  const icon = document.getElementById("statusIcon");

  if (!current || !options || !text || !icon) {
    console.warn("Choriste status: éléments manquants");
    return;
  }

  // ===============================
  // TOGGLE (ouvrir / fermer)
  // ===============================
  current.addEventListener("click", () => {
    options.classList.toggle("hidden");
  });

  // ===============================
  // CLICK SUR OPTION
  // ===============================
  const allOptions = document.querySelectorAll(".status-option");

  allOptions.forEach(option => {

    option.addEventListener("click", () => {

      const selected = option.dataset.status;

      // 🔥 changer texte
      text.innerText = selected;

      // 🔥 changer icône
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

        default:
          icon.className = "bi bi-person text-gray-400";
      }

      // 🔒 refermer menu
      options.classList.add("hidden");

      // 🔥 DEBUG
      console.log("Statut choisi :", selected);

      // 👉 PLUS TARD : Firestore ici
      // saveUserStatus(selected);

    });

  });

  // ===============================
  // CLICK OUTSIDE (fermer si clic dehors)
  // ===============================
  document.addEventListener("click", (e) => {

    if (!current.contains(e.target) && !options.contains(e.target)) {
      options.classList.add("hidden");
    }

  });

}
