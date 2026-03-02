export function initSidebar() {

  const storedUser = localStorage.getItem("myum_user");
  if (!storedUser) return;

  const user = JSON.parse(storedUser);

  const sidebar = document.getElementById("adminSidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const menuBtn = document.getElementById("menuBtn");

  if (!sidebar || !overlay || !menuBtn) return;

  // Admin uniquement
  if (user.role === "admin" || user.role === "super_admin") {

    menuBtn.classList.remove("hidden");

    // OPEN
    menuBtn.addEventListener("click", () => {
      sidebar.classList.remove("-translate-x-full");
      overlay.classList.remove("hidden");
    });

    // CLOSE
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

    // Super admin section
    if (user.role === "super_admin") {
      const section = document.getElementById("superAdminSection");
      if (section) section.classList.remove("hidden");
    }

  }
}
