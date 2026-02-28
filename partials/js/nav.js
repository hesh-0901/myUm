// Active state navigation
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item")
      .forEach(b => b.classList.remove("text-primary"));
    btn.classList.add("text-primary");
  });
});

// Bouton présence
const presenceBtn = document.getElementById("presenceBtn");

if (presenceBtn) {
  presenceBtn.addEventListener("click", async () => {

    // Placeholder logique salon
    console.log("Recherche salon de présence actif...");

    // Animation rapide feedback
    presenceBtn.classList.add("scale-110");

    setTimeout(() => {
      presenceBtn.classList.remove("scale-110");
    }, 150);

  });
}
