import { db } from "/myUm/mains.js/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const { jsPDF } = window.jspdf;

let currentUserId = null;

document.addEventListener("DOMContentLoaded", () => {

  const storedUser = localStorage.getItem("myum_user");
  if (!storedUser) return;

  const sessionUser = JSON.parse(storedUser);
  currentUserId = sessionUser.id;

  const btn = document.getElementById("exportPdfBtn");
  if (btn) btn.addEventListener("click", generatePDF);

});

async function generatePDF() {

  const snap = await getDoc(doc(db, "users", currentUserId));
  if (!snap.exists()) return;

  const data = snap.data();

  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;

  let y = 20;


  /* ===============================
     PHOTO
  =============================== */

if (data.photoURL) {

  try {

    const imgBase64 = await loadImageBase64(data.photoURL);

    const format = imgBase64.startsWith("data:image/png") ? "PNG" : "JPEG";
pdf.addImage(imgBase64, format, 15, 15, 35, 35);

  } catch (error) {

    console.error("Erreur chargement photo :", error);

  }

}


  /* ===============================
     IDENTITE
  =============================== */

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);

  const fullName = `${data.firstName || ""} ${data.lastName || ""}`;
  pdf.text(fullName.trim(), 60, 25);

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");

  if (data.username) pdf.text("@" + data.username, 60, 32);
  if (data.fonction) pdf.text(data.fonction, 60, 38);

  y = 60;


  /* ===============================
     BIO
  =============================== */

  if (data.bio) {

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text("Présentation", 15, y);

    y += 6;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    const lines = pdf.splitTextToSize(data.bio, 180);
    pdf.text(lines, 15, y);

    y += lines.length * 6 + 4;

  }


  /* ===============================
     INFOS PERSONNELLES
  =============================== */

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("Informations personnelles", 15, y);

  y += 8;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  const personal = [
    ["Genre", data.genre],
    ["État civil", data.etatCivil],
    ["Statut relationnel", data.statutRelationnel],
    ["Téléphone", data.phone],
    ["Commune", data.commune],
    ["Avenue", data.avenue],
    ["Date de naissance", data.birthday],
    ["Âge", data.age]
  ];

  personal.forEach(([label, value]) => {

    if (!value) return;

    pdf.text(`${label} : ${value}`, 15, y);
    y += 6;

  });

  y += 6;


  /* ===============================
     INFOS ECCLESIASTIQUES
  =============================== */

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("Informations ecclésiastiques", 15, y);

  y += 8;

  pdf.setFont("helvetica", "normal");

  const church = [
    ["Église de provenance", data.egliseProvenance],
    ["Année de baptême", data.anneeBapteme],
    ["Responsable ministère", data.responsableMinistere]
  ];

  church.forEach(([label, value]) => {

    if (!value) return;

    pdf.text(`${label} : ${value}`, 15, y);
    y += 6;

  });

  y += 6;


  /* ===============================
     COMPETENCES MUSICALES
  =============================== */

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("Compétences musicales", 15, y);

  y += 8;

  pdf.setFont("helvetica", "normal");

  if (data.registreVoix) {
    pdf.text(`Registre de voix : ${data.registreVoix}`, 15, y);
    y += 6;
  }

  if (data.groupeMusique) {
    pdf.text(`Évolue dans un groupe : ${data.groupeMusique}`, 15, y);
    y += 6;
  }

  y += 8;


  /* ===============================
     VIE SECULIERE
  =============================== */

  if (data.vieSeculiere && data.vieSeculiere.length) {

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text("Vie séculière", 15, y);

    y += 8;

    pdf.setFont("helvetica", "normal");

    const list = Array.isArray(data.vieSeculiere)
      ? data.vieSeculiere.join(", ")
      : data.vieSeculiere;

    pdf.text(list, 15, y);

    y += 8;

  }


  /* ===============================
     FOOTER
  =============================== */

  pdf.setFontSize(9);
  pdf.setTextColor(120);

  pdf.text(
    "Fiche générée via MyUm",
    pageWidth / 2,
    285,
    { align: "center" }
  );


  /* ===============================
     SAVE
  =============================== */

  const filename =
    `${data.firstName || "membre"}-${data.lastName || ""}.pdf`;

  pdf.save(filename);

}



/* ===============================
   IMAGE HELPERS
=============================== */

async function loadImageBase64(url) {

const response = await fetch(url);

if (!response.ok) {
  throw new Error("Impossible de charger l'image");
}

const blob = await response.blob();

  return new Promise((resolve) => {

    const reader = new FileReader();

    reader.onloadend = () => resolve(reader.result);

    reader.readAsDataURL(blob);

  });

}
