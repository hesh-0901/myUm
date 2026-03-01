export function initSidebar() {

  const storedUser = localStorage.getItem("myum_user");
  if (!storedUser) return;

  const user = JSON.parse(storedUser);

  const sidebar = document.getElementById("adminSidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const menuBtn = document.getElementById("menuBtn");

  // ✅ Afficher le bouton seulement si admin ou super_admin
  if (user.role === "admin" || user.role === "super_admin") {

    menuBtn.classList.remove("hidden");

    // Ouvrir
    menuBtn.addEventListener("click", () => {
      sidebar.classList.remove("-translate-x-full");
      overlay.classList.remove("hidden");
    });

    // Fermer
    overlay.addEventListener("click", () => {
      sidebar.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
    });

  }
}

  // Ouvrir
  menuBtn.addEventListener("click", () => {
    sidebar.classList.remove("-translate-x-full");
    overlay.classList.remove("hidden");
  });

  // Fermer
  overlay.addEventListener("click", () => {
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
  });

  // Navigation
  document.querySelectorAll(".sidebar-link").forEach(btn => {
    btn.addEventListener("click", () => {
      window.location.href = btn.dataset.link;
    });
  });

  // Section super_admin
  if (user.role === "super_admin") {
    document.getElementById("superAdminSection")
      .classList.remove("hidden");
  }
}
