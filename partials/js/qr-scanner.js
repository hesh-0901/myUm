// ==========================================
// QR SCANNER MODULE
// ==========================================

let html5QrCode = null;

// ==========================================
// OUVRIR SCANNER
// ==========================================
export async function openQrScanner(onScanSuccess) {

  const modal = document.getElementById("qrScannerModal");

  if (!modal) {
    console.error("Modal QR introuvable");
    return;
  }

  modal.classList.remove("hidden");

  // ==========================================
  // LOAD LIB SI NÉCESSAIRE
  // ==========================================
  if (!window.Html5Qrcode) {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/html5-qrcode";
    document.body.appendChild(script);

    await new Promise(resolve => {
      script.onload = resolve;
    });
  }

  // ==========================================
  // INIT SCANNER
  // ==========================================
  html5QrCode = new Html5Qrcode("qr-reader");

  let isScanning = true;

  try {

    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: 250
      },

      // ==========================================
      // CALLBACK SCAN
      // ==========================================
      (decodedText) => {

        // éviter double scan
        if (!isScanning) return;
        isScanning = false;

        console.log("QR RAW:", decodedText);

        stopQrScanner();

        let parsed;

        try {
          parsed = JSON.parse(decodedText.trim());
        } catch (err) {
          console.error("Parse error:", err, decodedText);
          alert("QR invalide");
          return;
        }

        if (!parsed.userId) {
          alert("QR invalide (userId manquant)");
          return;
        }

        // callback propre
        if (onScanSuccess) {
          onScanSuccess(parsed);
        }

      }
    );

  } catch (err) {
    console.error(err);
    alert("Impossible d'accéder à la caméra");
  }
}


// ==========================================
// STOP SCANNER
// ==========================================
export async function stopQrScanner() {

  try {
    if (html5QrCode) {
      await html5QrCode.stop();
      html5QrCode.clear();
      html5QrCode = null;
    }
  } catch (err) {
    console.warn("Erreur arrêt scanner:", err);
  }

  const modal = document.getElementById("qrScannerModal");
  if (modal) modal.classList.add("hidden");
}
