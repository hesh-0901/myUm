// =======================================
// EXPORT ENREG PDF - MYUM
// =======================================

import { db } from "/myUm/mains.js/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let userData = null;
let currentUserId = null;

document.addEventListener("DOMContentLoaded", init);


// =======================================
// INIT
// =======================================

async function init() {

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
// BUTTON HEADER
// =======================================

function injectPDFButton() {

  const container = document.getElementById("header-actions");
  if (!container) return;

  const btn = document.createElement("button");

  btn.className =
  "w-10 h-10 flex items-center justify-center rounded-full bg-lightblue/10 text-medium hover:bg-lightblue/20 transition";

  btn.innerHTML = `<i class="bi bi-file-earmark-pdf text-lg"></i>`;

  btn.addEventListener("click", generatePDF);

  container.appendChild(btn);

}


// =======================================
// GENERATE PDF
// =======================================

async function generatePDF() {

  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  let y = 20;

  // =========================
  // LOGO
  // =========================

  const logo = await loadImage("/myUm/assets/logo-myum.png");

  pdf.addImage(logo, "PNG", 85, 10, 40, 15);

  y = 35;

  pdf.setFontSize(16);
  pdf.text("Fiche d'enregistrement", 105, y, { align: "center" });

  y += 15;


  // =========================
  // PHOTO
  // =========================

  const imgEl = document.getElementById("profilePhoto");

  if (imgEl && imgEl.src) {

    const base64 = imageToBase64(imgEl);

    pdf.addImage(base64, "JPEG", 85, y, 40, 40);

  }

  y += 50;


  // =========================
  // NOM
  // =========================

  const fullName =
  `${userData.firstName || ""} ${userData.lastName || ""}`;

  pdf.setFontSize(18);
  pdf.text(fullName, 105, y, { align: "center" });

  y += 8;

  pdf.setFontSize(12);
  pdf.text(`@${userData.username}`, 105, y, { align: "center" });

  y += 6;

  if (userData.fonction) {

    pdf.text(userData.fonction, 105, y, { align: "center" });

    y += 10;

  }

  y += 10;


  // =========================
  // INFOS PERSONNELLES
  // =========================

  addSection(pdf, "Informations personnelles", y);

  y += 8;

  y = addLine(pdf, "Genre", userData.genre, y);
  y = addLine(pdf, "Etat civil", userData.etatCivil, y);
  y = addLine(pdf, "Statut relationnel", userData.statutRelationnel, y);
  y = addLine(pdf, "Commune", userData.commune, y);
  y = addLine(pdf, "Avenue", userData.avenue, y);

  if (userData.vieSeculiere) {

    const value =
    Array.isArray(userData.vieSeculiere)
    ? userData.vieSeculiere.join(", ")
    : userData.vieSeculiere;

    y = addLine(pdf, "Vie séculière", value, y);

  }

  y += 10;


  // =========================
  // INFOS EGLISE
  // =========================

  addSection(pdf, "Informations ecclésiastiques", y);

  y += 8;

  y = addLine(pdf, "Eglise", userData.egliseProvenance, y);
  y = addLine(pdf, "Année baptême", userData.anneeBapteme, y);
  y = addLine(pdf, "Responsable", userData.responsableMinistere, y);

  y += 10;


  // =========================
  // MUSIQUE
  // =========================

  addSection(pdf, "Compétences musicales", y);

  y += 8;

  y = addLine(pdf, "Registre", userData.registreVoix, y);
  y = addLine(pdf, "Groupe", userData.groupeMusique, y);

  y += 20;


  // =========================
  // DATE
  // =========================

  const now = new Date();

  pdf.setFontSize(10);

  pdf.text(
  `Document généré le ${now.toLocaleDateString()} à ${now.toLocaleTimeString()}`,
  105,
  y,
  { align: "center" }
  );

  y += 15;


  // =========================
  // QR CODE
  // =========================

  const verifyURL =
  `${window.location.origin}/verify.html?user=${userData.username}`;

  const qr = await loadImage(
  `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyURL)}`
  );

  pdf.addImage(qr, "PNG", 90, y, 30, 30);

  y += 35;

  pdf.setFontSize(9);

  pdf.text(
  "Scanner pour vérifier l'authenticité",
  105,
  y,
  { align: "center" }
  );


  // =========================
  // SAVE
  // =========================

  pdf.save(`myum-${userData.username}.pdf`);

}


// =======================================
// SECTIONS
// =======================================

function addSection(pdf, title, y) {

  pdf.setFontSize(14);
  pdf.text(title, 20, y);

}

function addLine(pdf, label, value, y) {

  pdf.setFontSize(11);

  pdf.text(`${label}:`, 20, y);

  pdf.text(value ? String(value) : "-", 70, y);

  return y + 6;

}


// =======================================
// IMAGE CONVERSION
// =======================================

function imageToBase64(img) {

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  ctx.drawImage(img, 0, 0);

  return canvas.toDataURL("image/jpeg");

}


// =======================================
// LOAD IMAGE
// =======================================

async function loadImage(url) {

  const res = await fetch(url);
  const blob = await res.blob();

  return new Promise(resolve => {

    const reader = new FileReader();

    reader.onloadend = () => resolve(reader.result);

    reader.readAsDataURL(blob);

  });

}
