export function initBackHeader(customUrl = null) {

  const btn = document.getElementById("globalBackBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {

    if (customUrl) {
      window.location.href = customUrl;
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/myUm/admin/presence-management.html";
    }

  });

}
