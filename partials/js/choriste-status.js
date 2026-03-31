export function initChoristeStatus() {

  const current = document.getElementById("currentStatus");
  const options = document.getElementById("statusOptions");
  const text = document.getElementById("statusText");
  const icon = document.getElementById("statusIcon");

  if (!current || !options) return;

  // ouvrir / fermer
  current.onclick = () => {
    options.classList.toggle("hidden");
  };

  // sélection
  document.querySelectorAll(".status-option").forEach(option => {

    option.onclick = () => {

      const selected = option.dataset.status;

      text.innerText = selected;

      // changer icône selon statut
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

      // 🔥 ici on pourra sauver Firestore plus tard
      console.log("Nouveau statut :", selected);

    };

  });

}
