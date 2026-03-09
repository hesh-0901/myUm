// =======================================
// EXPORT ENREG PDF - MYUM
// =======================================

import { db } from "/myUm/mains.js/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentUserId = null;
let userData = null;

document.addEventListener("DOMContentLoaded", initPDFExport);

async function initPDFExport() {

  const storedUser = localStorage.getItem("myum_user");
  if (!storedUser) return;

  const sessionUser = JSON.parse(storedUser);
  currentUserId = sessionUser.id;

  const snap = await getDoc(doc(db, "users", currentUserId));
  if (!snap.exists()) return;

  userData = snap.data();

  injectPDFButton();
}


// =======================================
// HEADER BUTTON
// =======================================

function injectPDFButton() {

  const actions = document.getElementById("header-actions");
  if (!actions) return;

  const btn = document.createElement("button");

  btn.className =
    "w-10 h-10 flex items-center justify-center rounded-full bg-lightblue/10 text-medium hover:bg-lightblue/20 transition";

  btn.innerHTML = `<i class="bi bi-file-earmark-pdf text-lg"></i>`;

  btn.addEventListener("click", generatePDF);

  actions.appendChild(btn);
}


// =======================================
// GENERATE PDF
// =======================================

async function generatePDF() {

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  let y = 20;

  // =============================
  // PHOTO
  // =============================

  if (userData.photoURL) {

    const img = await loadImage(userData.photoURL);

    doc.addImage(img, "JPEG", 85, y, 40, 40);

  }

  y += 50;

  // =============================
  // NAME
  // =============================

  const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`;

  doc.setFontSize(18);
  doc.text(fullName, 105, y, { align: "center" });

  y += 8;

  doc.setFontSize(12);
  doc.text(`@${userData.username || ""}`, 105, y, { align: "center" });

  y += 6;

  if (userData.fonction) {

    doc.text(userData.fonction, 105, y, { align: "center" });

    y += 10;
  }

  y += 10;

  // =============================
  // PERSONAL INFO
  // =============================

  addSectionTitle(doc, "Informations personnelles", y);
  y += 8;

  y = addLine(doc, "Genre", userData.genre, y);
  y = addLine(doc, "Etat civil", userData.etatCivil, y);
  y = addLine(doc, "Statut relationnel", userData.statutRelationnel, y);
  y = addLine(doc, "Commune", userData.commune, y);
  y = addLine(doc, "Avenue", userData.avenue, y);

  if (userData.vieSeculiere) {

    y = addLine(
      doc,
      "Vie séculière",
      Array.isArray(userData.vieSeculiere)
        ? userData.vieSeculiere.join(", ")
        : userData.vieSeculiere,
      y
    );

  }

  y += 10;

  // =============================
  // CHURCH INFO
  // =============================

  addSectionTitle(doc, "Informations ecclésiastiques", y);
  y += 8;

  y = addLine(doc, "Eglise de provenance", userData.egliseProvenance, y);
  y = addLine(doc, "Année baptême", userData.anneeBapteme, y);
  y = addLine(doc, "Responsable ministère", userData.responsableMinistere, y);

  y += 10;

  // =============================
  // MUSIC
  // =============================

  addSectionTitle(doc, "Compétences musicales", y);
  y += 8;

  y = addLine(doc, "Registre de voix", userData.registreVoix, y);
  y = addLine(doc, "Groupe musical", userData.groupeMusique, y);

  y += 20;

  // =============================
  // CREATED AT
  // =============================

  const now = new Date();

  const dateString = now.toLocaleDateString();
  const timeString = now.toLocaleTimeString();

  doc.setFontSize(10);

  doc.text(
    `Document généré le ${dateString} à ${timeString}`,
    105,
    y,
    { align: "center" }
  );

  y += 15;

  // =============================
  // QR CODE
  // =============================

  const verificationURL =
    `${window.location.origin}/verify.html?user=${userData.username}`;

  const qr = await generateQR(verificationURL);

  doc.addImage(qr, "PNG", 90, y, 30, 30);

  y += 35;

  doc.setFontSize(9);

  doc.text(
    "Scanner pour vérifier l'authenticité",
    105,
    y,
    { align: "center" }
  );

  // =============================
  // SAVE
  // =============================

  doc.save(`myum-${userData.username}.pdf`);
}


// =======================================
// HELPERS
// =======================================

function addSectionTitle(doc, title, y) {

  doc.setFontSize(14);
  doc.text(title, 20, y);

}

function addLine(doc, label, value, y) {

  doc.setFontSize(11);

  doc.text(`${label}:`, 20, y);

  doc.text(value ? String(value) : "-", 70, y);

  return y + 6;
}


// =======================================
// LOAD IMAGE
// =======================================

function loadImage(url) {

  return new Promise((resolve) => {

    const img = new Image();

    img.crossOrigin = "anonymous";

    img.onload = () => {

      const canvas = document.createElement("canvas");

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");

      ctx.drawImage(img, 0, 0);

      resolve(canvas.toDataURL("image/jpeg"));

    };

    img.src = url;

  });

}


// =======================================
// QR CODE
// =======================================

async function generateQR(text) {

  const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;

  return await loadImage(url);

}
