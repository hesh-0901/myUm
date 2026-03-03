import { goBack } from "./navigation-stack.js";

export function initBackHeader(customUrl = null) {

  const btn = document.getElementById("globalBackBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {

    if (customUrl) {
      window.location.href = customUrl;
      return;
    }

    goBack("/dashboard.html");

  });
}
