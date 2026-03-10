import { db } from "/myUm/mains.js/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const { jsPDF } = window.jspdf;

document.addEventListener("DOMContentLoaded", initExport);

let currentUserId = null;


// ===============================
// INIT
// ===============================
function initExport() {

  const storedUser = localStorage.getItem("myum_user");
  if (!storedUser) return;

  const sessionUser = JSON.parse(storedUser);
  currentUserId = sessionUser.id;

  const btn = document.getElementById("exportPdfBtn");
  if (btn) {
    btn.addEventListener("click", generatePDF);
  }

}


// ===============================
// GENERATE PDF
// ===============================
async function generatePDF() {

  const snap = await getDoc(doc(db, "users", currentUserId));

  if (!snap.exists()) return;

  const data = snap.data();

  const pdf = new jsPDF();

  const pageWidth = pdf.internal.pageSize.width;

  let y = 20;


  // ===============================
  // HEADER
  // ===============================

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);

  const fullName = (data.firstName || "") + " " + (data.lastName || "");

  pdf.text(fullName.trim(), pageWidth / 2, y, { align: "center" });

  y += 8;

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");

  const username = data.username ? "@" + data.username : "";
  pdf.text(username, pageWidth / 2, y, { align: "center" });

  y += 12;


  // ===============================
  // FONCTION
  // ===============================

  if (data.fonction) {

    pdf.setFont("helvetica", "italic");
    pdf.text(data.fonction, pageWidth / 2, y, { align: "center" });

    y += 12;

  }


  // ===============================
  // BIO
  // ===============================

  if (data.bio) {

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text("Présentation", 20, y);

    y += 6;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    const bioLines = pdf.splitTextToSize(data.bio, 170);
    pdf.text(bioLines, 20, y);

    y += bioLines.length * 6 + 6;

  }


  // ===============================
  // INFORMATIONS PERSONNELLES
  // ===============================

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("Informations personnelles", 20, y);

  y += 8;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  const personal = [
    ["Genre", data.genre],
    ["État civil", data.etatCivil],
    ["Statut relationnel", data.statutRelationnel],
    ["Commune", data.commune],
    ["Avenue", data.avenue],
    ["Téléphone", data.phone],
    ["Date de naissance", data.birthday],
    ["Âge", data.age]
  ];

  personal.forEach(([label, value]) => {

    if (!value) return;

    pdf.text(label + " : " + value, 20, y);
    y += 6;

  });

  y += 6;


  // ===============================
  // INFORMATIONS ECCLESIASTIQUES
  // ===============================

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("Informations ecclésiastiques", 20, y);

  y += 8;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  const church = [
    ["Église de provenance", data.egliseProvenance],
    ["Année de baptême", data.anneeBapteme],
    ["Responsable ministère", data.responsableMinistere]
  ];

  church.forEach(([label, value]) => {

    if (!value) return;

    pdf.text(label + " : " + value, 20, y);
    y += 6;

  });

  y += 6;


  // ===============================
  // COMPÉTENCES MUSICALES
  // ===============================

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("Compétences musicales", 20, y);

  y += 8;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  if (data.registreVoix) {

    pdf.text("Registre de voix : " + data.registreVoix, 20, y);
    y += 6;

  }

  if (data.groupeMusique) {

    pdf.text("Évolue dans un groupe : " + data.groupeMusique, 20, y);
    y += 6;

  }

  y += 6;


  // ===============================
  // VIE SÉCULIÈRE
  // ===============================

  if (data.vieSeculiere && data.vieSeculiere.length) {

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text("Vie séculière", 20, y);

    y += 8;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    const list = Array.isArray(data.vieSeculiere)
      ? data.vieSeculiere.join(", ")
      : data.vieSeculiere;

    pdf.text(list, 20, y);

    y += 10;

  }


  // ===============================
  // FOOTER
  // ===============================

  pdf.setFontSize(9);
  pdf.setTextColor(120);

  pdf.text(
    "Fiche générée depuis MyUm",
    pageWidth / 2,
    285,
    { align: "center" }
  );


  // ===============================
  // SAVE
  // ===============================

  const filename =
    (data.firstName || "membre") +
    "-" +
    (data.lastName || "") +
    ".pdf";

  pdf.save(filename);

}
