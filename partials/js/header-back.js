export function initBackHeader(customUrl = null) {

  const btn = document.getElementById("globalBackBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {

    // 1️⃣ Si URL forcée
    if (customUrl) {
      window.location.href = customUrl;
      return;
    }

    // 2️⃣ Si page précédente mémorisée
    const previousPage = sessionStorage.getItem("previousPage");

    if (previousPage) {
      window.location.href = previousPage;
      return;
    }

    // 3️⃣ Fallback sécurité
    window.history.back();

  });

}
