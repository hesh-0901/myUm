export function pushUpdateNotification(userId, version){

  const container = document.getElementById("notifications");
  if(!container) return;

  // ❌ éviter doublon
  if(document.querySelector(".update-notif")) return;

  const notif = document.createElement("div");
  notif.className = `
  update-notif
  flex items-center justify-between
  bg-accent/20 text-white
  px-4 py-3 rounded-xl mb-2
  text-sm backdrop-blur
  animate-fadeIn
  `;

  notif.innerHTML = `
  <div class="flex items-center gap-2">
    <i class="bi bi-arrow-repeat"></i>
    <span>Mise à jour disponible (${version})</span>
  </div>

  <div class="flex items-center gap-3">

    <!-- bouton update -->
    <button class="update-btn text-xs underline opacity-80 hover:opacity-100">
      Mettre à jour
    </button>

    <!-- corbeille DISCRÈTE -->
    <button class="delete-btn opacity-40 hover:opacity-80 transition text-xs">
      <i class="bi bi-trash"></i>
    </button>

  </div>
  `;

  container.appendChild(notif);

  // ===============================
  // ACTION UPDATE
  // ===============================
  notif.querySelector(".update-btn").onclick = ()=>{
    location.reload();
  };

  // ===============================
  // SUPPRESSION MANUELLE 🗑️
  // ===============================
  notif.querySelector(".delete-btn").onclick = ()=>{
    notif.remove();
  };

}
