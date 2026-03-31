import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js";

export function initUserQr() {

  const btn = document.getElementById("openUserQrBtn");
  const modal = document.getElementById("userQrModal");
  const closeBtn = document.getElementById("closeUserQr");
  const canvas = document.getElementById("userQrCanvas");

  if (!btn || !modal || !canvas) return;

  btn.onclick = async () => {

    const storedUser = JSON.parse(localStorage.getItem("myum_user"));

    if (!storedUser) {
      alert("Utilisateur non connecté");
      return;
    }

    const userId = storedUser.id;

    modal.classList.remove("hidden");

    await QRCode.toCanvas(canvas, userId, {
      width: 200
    });

  };

  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.classList.add("hidden");
    };
  }

}
