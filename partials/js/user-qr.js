export function initUserQr() {

  console.log("QR INIT OK");

  document.addEventListener("click", (e) => {

    // =========================
    // OUVRIR QR
    // =========================
    if (e.target.closest("#openUserQrBtn")) {

      const modal = document.getElementById("userQrModal");
      const canvas = document.getElementById("userQrCanvas");

      if (!modal || !canvas) {
        console.warn("QR modal introuvable");
        return;
      }

      const storedUser = JSON.parse(localStorage.getItem("myum_user"));

      if (!storedUser) {
        alert("Utilisateur non connecté");
        return;
      }

      // 🔥 QR DATA (JSON PROPRE)
      const qrData = JSON.stringify({
        userId: storedUser.id,
        ts: Date.now()
      });

      modal.classList.remove("hidden");

      QRCode.toCanvas(canvas, qrData, {
        width: 200
      });

    }

    // =========================
    // FERMER QR
    // =========================
    if (e.target.closest("#closeUserQr")) {

      const modal = document.getElementById("userQrModal");
      if (modal) modal.classList.add("hidden");

    }

  });

}
