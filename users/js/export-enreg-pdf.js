import { jsPDF } from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

document.addEventListener("DOMContentLoaded", initPdfExport);

/* =====================================================
   CONFIG
===================================================== */

const CONFIG = {
  headerHeight: 60,
  leftColumnWidth: 95,
  startY: 80
};

/* =====================================================
   INIT BUTTON
===================================================== */

function initPdfExport() {

  const container = document.getElementById("header-actions");
  if (!container) return;

  const btn = document.createElement("button");

  btn.className =
    "w-9 h-9 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition";

  btn.innerHTML = `<i class="bi bi-file-earmark-pdf text-lg"></i>`;

  btn.addEventListener("click", generatePDF);

  container.appendChild(btn);
}

/* =====================================================
   MAIN PDF GENERATOR
===================================================== */

async function generatePDF() {

  const doc = new jsPDF("p", "mm", "a4");

  const pageWidth = doc.internal.pageSize.getWidth();

  let yLeft = CONFIG.startY;
  let yRight = CONFIG.startY;

  const user = getUserData();

  const images = await loadImages(user);

  drawHeader(doc, pageWidth, user, images);

  yLeft = drawPersonalSection(doc, yLeft);
  yLeft = drawChurchSection(doc, yLeft);

  yRight = drawMusicSection(doc, pageWidth, yRight);

  drawQR(doc, pageWidth, images.qr);

  drawFooter(doc, pageWidth, user.username);

  doc.save(`fiche-membre-${user.username}.pdf`);
}

/* =====================================================
   USER DATA
===================================================== */

function getUserData() {

  const fullName = document.getElementById("fullName").innerText;
  const username = document.getElementById("username").innerText;
  const fonction = document.getElementById("userFunction").innerText;
  const photoEl = document.getElementById("profilePhoto");

  return {
    fullName,
    username,
    fonction,
    photo: photoEl?.src,
    createdAt: new Date().toLocaleDateString("fr-FR")
  };
}

/* =====================================================
   IMAGE LOADING
===================================================== */

async function loadImages(user) {

  const logo = await loadImageBase64("/myUm/assets/logo-myum.png");

  let photo = null;

  try {
    photo = await loadImageBase64(user.photo);
  } catch (e) {}

  const qr = await loadImageBase64(generateQR(user.username));

  return { logo, photo, qr };
}

/* =====================================================
   HEADER
===================================================== */

function drawHeader(doc, pageWidth, user, images) {

  doc.setFillColor(26, 54, 104);
  doc.rect(0, 0, pageWidth, 60, "F");

  doc.setFillColor(37, 150, 217);
  doc.roundedRect(40, 20, pageWidth - 50, 25, 12, 12, "F");

  if (images.logo)
    doc.addImage(images.logo, "PNG", 15, 15, 40, 12);

  if (images.photo) {

    doc.setFillColor(255, 255, 255);
    doc.circle(30, 32, 18, "F");

    doc.addImage(images.photo, "JPEG", 12, 14, 36, 36);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);

  doc.text(user.fullName, 55, 33);

  doc.setFontSize(12);
  doc.text(user.username, 55, 41);

  doc.setFontSize(11);
  doc.text(user.fonction, 55, 48);
}

/* =====================================================
   SECTIONS
===================================================== */

function drawPersonalSection(doc, y) {

  y = sectionLeft(doc, "Informations personnelles", y);

  y = fieldLeft(doc, "Genre", getField("genre"), y);
  y = fieldLeft(doc, "Etat civil", getField("etatCivil"), y);
  y = fieldLeft(doc, "Relation", getField("statutRelationnel"), y);
  y = fieldLeft(doc, "Vie séculière", getField("vieSeculiere"), y);
  y = fieldLeft(doc, "Commune", getField("commune"), y);
  y = fieldLeft(doc, "Avenue", getField("avenue"), y);

  return y;
}

function drawChurchSection(doc, y) {

  y = sectionLeft(doc, "Informations ecclésiastiques", y);

  y = fieldLeft(doc, "Eglise", getField("egliseProvenance"), y);
  y = fieldLeft(doc, "Année baptême", getField("anneeBapteme"), y);
  y = fieldLeft(doc, "Type baptême", getField("typeBapteme"), y);
  y = fieldLeft(doc, "Affermissement", getField("statutAffermissement"), y);
  y = fieldLeft(doc, "Ancienne fonction", getField("ancienneFonction"), y);
  y = fieldLeft(doc, "Responsable", getField("responsableMinistere"), y);

  return y;
}

function drawMusicSection(doc, pageWidth, y) {

  y = sectionRight(doc, "Compétences musicales", pageWidth, y);

  y = fieldRight(doc, "Registre voix", getField("registreVoix"), pageWidth, y);
  y = fieldRight(doc, "Groupe musique", getField("groupeMusique"), pageWidth, y);

  return y;
}

/* =====================================================
   LEFT COLUMN
===================================================== */

function sectionLeft(doc, title, y) {

  doc.setFillColor(37, 150, 217);
  doc.roundedRect(10, y - 6, CONFIG.leftColumnWidth - 15, 10, 5, 5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);

  doc.text(title, 15, y);

  return y + 10;
}

function fieldLeft(doc, label, value, y) {

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);

  doc.text(label, 15, y);

  doc.setFont("helvetica", "bold");
  doc.text(value || "—", 55, y);

  doc.setFont("helvetica", "normal");

  return y + 7;
}

/* =====================================================
   RIGHT COLUMN
===================================================== */

function sectionRight(doc, title, pageWidth, y) {

  const left = CONFIG.leftColumnWidth;

  doc.setFillColor(37, 150, 217);
  doc.roundedRect(left, y - 6, pageWidth - left - 10, 10, 5, 5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);

  doc.text(title, left + 5, y);

  return y + 10;
}

function fieldRight(doc, label, value, pageWidth, y) {

  const left = CONFIG.leftColumnWidth;

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);

  doc.text(label, left + 5, y);

  doc.setFont("helvetica", "bold");
  doc.text(value || "—", left + 55, y);

  doc.setFont("helvetica", "normal");

  return y + 7;
}

/* =====================================================
   QR CODE
===================================================== */

function drawQR(doc, pageWidth, qr) {

  if (qr)
    doc.addImage(qr, "PNG", pageWidth - 35, 265, 18, 18);
}

/* =====================================================
   FOOTER
===================================================== */

function drawFooter(doc, pageWidth, username) {

  const createdAt = new Date().toLocaleDateString("fr-FR");

  doc.setDrawColor(200, 200, 200);
  doc.line(10, 260, pageWidth - 10, 260);

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);

  doc.text(`Document officiel MyUm`, pageWidth / 2, 268, { align: "center" });

  doc.text(`Créé par ${username} • ${createdAt}`, pageWidth / 2, 273, { align: "center" });

  doc.text(`https://myum.app`, pageWidth / 2, 278, { align: "center" });
}

/* =====================================================
   UTILITIES
===================================================== */

function getField(name) {

  const field = document.querySelector(`.field[data-field="${name}"]`);
  if (!field) return "";

  const value = field.querySelector(".value");
  if (!value) return "";

  return value.innerText;
}

function generateQR(username) {

  const clean = username.replace("@", "");

  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://myum.app/member/${clean}`;
}

async function loadImageBase64(url) {

  try {

    const response = await fetch(url, { mode: "cors" });

    const blob = await response.blob();

    return await new Promise(resolve => {

      const reader = new FileReader();

      reader.onloadend = () => resolve(reader.result);

      reader.readAsDataURL(blob);
    });

  } catch (e) {

    return null;
  }
}
