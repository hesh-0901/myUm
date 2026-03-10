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
   PHOTO (depuis l'image affichée)
=============================== */

/* ===============================
   PHOTO
=============================== */

if (data.photoURL) {

  try {

    const img = new Image();
    img.src = data.photoURL;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    pdf.addImage(img, "JPEG", 15, 15, 35, 35);

  } catch (error) {

    console.warn("Photo non chargée :", error);

  }

}
  /* ===============================
     HEADER IDENTITE
  =============================== */

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);

  const fullName = `${data.firstName || ""} ${data.lastName || ""}`;
  pdf.text(fullName.toUpperCase(), 60, 25);

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");

  if (data.username) pdf.text("@" + data.username, 60, 32);
  if (data.fonction) pdf.text(data.fonction, 60, 38);

  pdf.setDrawColor(0,116,166);
  pdf.setLineWidth(1);
  pdf.line(15, 50, pageWidth - 15, 50);

  y = 60;


  /* ===============================
     BIO
  =============================== */

  if (data.bio) {

    sectionTitle(pdf, "Présentation", y);
    y += 8;

    const bioLines = pdf.splitTextToSize(data.bio, 180);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    pdf.text(bioLines, 15, y);
    y += bioLines.length * 6 + 5;

  }


  /* ===============================
     INFORMATIONS PERSONNELLES
  =============================== */

  sectionTitle(pdf, "Informations personnelles", y);
  y += 8;

  y = renderTable(pdf, y, [
    ["Genre", data.genre],
    ["Téléphone", data.phone],
    ["État civil", data.etatCivil],
    ["Statut relationnel", data.statutRelationnel],
    ["Commune", data.commune],
    ["Avenue", data.avenue],
    ["Date de naissance", data.birthday],
    ["Âge", data.age]
  ]);


  /* ===============================
     INFORMATIONS ECCLESIASTIQUES
  =============================== */

  sectionTitle(pdf, "Église & ministère", y);
  y += 8;

  y = renderTable(pdf, y, [
    ["Église de provenance", data.egliseProvenance],
    ["Année de baptême", data.anneeBapteme],
    ["Type de baptême", data.typeBapteme],
    ["Responsable ministère", data.responsableMinistere]
  ]);


  /* ===============================
     COMPETENCES MUSICALES
  =============================== */

  sectionTitle(pdf, "Compétences musicales", y);
  y += 8;

  y = renderTable(pdf, y, [
    ["Registre de voix", data.registreVoix],
    ["Évolue dans un groupe", data.groupeMusique]
  ]);


  /* ===============================
     VIE SECULIERE
  =============================== */

  if (data.vieSeculiere && data.vieSeculiere.length) {

    sectionTitle(pdf, "Vie séculière", y);
    y += 8;

    pdf.setFont("helvetica", "normal");

    const text = Array.isArray(data.vieSeculiere)
      ? data.vieSeculiere.join(", ")
      : data.vieSeculiere;

    pdf.text(text, 15, y);
    y += 8;

  }


  /* ===============================
     FOOTER
  =============================== */

  pdf.setFontSize(9);
  pdf.setTextColor(120);

  pdf.text(
    `Généré le ${new Date().toLocaleDateString("fr-FR")}`,
    pageWidth / 2,
    285,
    { align: "center" }
  );

  pdf.setTextColor(0,116,166);

  pdf.text(
    "MyUm — Département de musique",
    pageWidth / 2,
    290,
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
   SECTION TITLE
=============================== */

function sectionTitle(pdf, title, y) {

  pdf.setFillColor(0,116,166);
  pdf.rect(15, y - 4, 180, 7, "F");

  pdf.setTextColor(255);
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");

  pdf.text(title, 18, y);

  pdf.setTextColor(0);

}


/* ===============================
   TABLE RENDER
=============================== */

function renderTable(pdf, y, fields) {

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  fields.forEach(([label, value]) => {

    if (!value) return;

    pdf.setFont("helvetica", "bold");
    pdf.text(label, 15, y);

    pdf.setFont("helvetica", "normal");
    pdf.text(String(value), 80, y);

    y += 6;

  });

  return y + 4;

}


/* ===============================
   IMAGE LOADER
=============================== */

