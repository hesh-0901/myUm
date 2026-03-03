// ===============================
// BASE PATH (GitHub Pages compatible)
// ===============================

function getBasePath() {
  const { pathname } = window.location;
  const parts = pathname.split("/").filter(Boolean);
  const isGitHubIO = window.location.hostname.includes("github.io");

  if (isGitHubIO && parts.length > 0) {
    return "/" + parts[0] + "/";
  }

  return "/";
}

// 🔥 On attache à window pour HTML onclick
window.goTo = function(path) {
  const base = getBasePath();
  window.location.href = base + path;
};


// ===============================
// ACTIVE STATE NAVIGATION
// ===============================

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item")
      .forEach(b => b.classList.remove("text-primary"));
    btn.classList.add("text-primary");
  });
});


// ===============================
// BOUTON CENTRAL PRESENCE
// ===============================

const presenceBtn = document.getElementById("presenceBtn");

if (presenceBtn) {

  presenceBtn.addEventListener("click", () => {

    presenceBtn.classList.add("scale-110");

    setTimeout(() => {
      presenceBtn.classList.remove("scale-110");

      // Redirection propre compatible GitHub Pages
      window.goTo("users/presence.html");

    }, 150);

  });

}
