// IMPORT dynamique de la librairie
let html5QrCode = null;

export async function openQrScanner(onScanSuccess) {

  const modal = document.getElementById("qrScannerModal");

  if (!modal) {
    console.error("Modal QR introuvable");
    return;
  }

  modal.classList.remove("hidden");

  // charger lib si pas encore chargée
  if (!window.Html5Qrcode) {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/html5-qrcode";
    document.body.appendChild(script);

    await new Promise(resolve => {
      script.onload = resolve;
    });
  }

  html5QrCode = new Html5Qrcode("qr-reader");

  try {

    await html5QrCode.start(
      { facingMode: "environment" }, // caméra arrière
      {
        fps: 10,
        qrbox: 250
      },
      (decodedText) => {
        // 🎯 QR détecté
        stopQrScanner();

        if (onScanSuccess) {
          onScanSuccess(decodedText);
        }
      }
    );

  } catch (err) {
    console.error(err);
    alert("Impossible d'accéder à la caméra");
  }
}

export async function stopQrScanner() {

  if (html5QrCode) {
    await html5QrCode.stop();
    html5QrCode.clear();
    html5QrCode = null;
  }

  const modal = document.getElementById("qrScannerModal");
  if (modal) modal.classList.add("hidden");
}
