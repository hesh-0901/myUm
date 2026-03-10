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

  let y = 30;

  /* ===============================
     COLORS
  =============================== */

  const bg = [247,246,243];
  const card = [231,223,213];
  const accent = [140,122,107];
  const text = [43,43,43];

  /* ===============================
     BACKGROUND
  =============================== */

  pdf.setFillColor(...bg);
  pdf.rect(0, 0, pageWidth, 297, "F");


  /* ===============================
     HEADER CARD
  =============================== */

  pdf.setFillColor(...card);
  pdf.roundedRect(15, 15, pageWidth - 30, 40, 8, 8, "F");


  /* ===============================
     PHOTO (safe)
  =============================== */

  try {

    const imgElement = document.getElementById("profilePhoto");

    if (imgElement && imgElement.src) {

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imgElement.src;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const base64 = canvas.toDataURL("image/jpeg");

      pdf.addImage(base64, "JPEG", 20, 20, 30, 30);

    }

  } catch (error) {

    console.warn("Photo non chargée :", error);

  }


  /* ===============================
     NAME
  =============================== */

  pdf.setTextColor(...text);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);

  const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();

  pdf.text(fullName || "Membre MyUM", 60, 32);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  if (data.fonction)
    pdf.text(data.fonction, 60, 40);

  if (data.username)
    pdf.text("@" + data.username, 60, 46);


  y = 70;


  /* ===============================
     BIO
  =============================== */

  if (data.bio) {

    pdf.setFillColor(...card);
    pdf.roundedRect(15, y, pageWidth - 30, 40, 8, 8, "F");

    pdf.setTextColor(...text);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);

    pdf.text("Présentation", 20, y + 8);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    const lines = pdf.splitTextToSize(data.bio, pageWidth - 50);

    pdf.text(lines, 20, y + 16);

    y += 16 + (lines.length * 5) + 10;

  }


  /* ===============================
     INFORMATIONS
  =============================== */

  y = renderSection(pdf, "Informations personnelles", y, [
    ["Téléphone", data.phone],
    ["Commune", data.commune],
    ["Avenue", data.avenue],
    ["État civil", data.etatCivil],
    ["Statut relationnel", data.statutRelationnel],
    ["Date naissance", data.birthday],
    ["Âge", data.age]
  ]);


  /* ===============================
     EGLISE
  =============================== */

  y = renderSection(pdf, "Église & Baptême", y, [
    ["Église", data.egliseProvenance],
    ["Année baptême", data.anneeBapteme],
    ["Type baptême", data.typeBapteme]
  ]);


  /* ===============================
     MUSIQUE
  =============================== */

  y = renderSection(pdf, "Ministère musical", y, [
    ["Voix", data.registreVoix],
    ["Groupe", data.groupeMusique],
    ["Responsable", data.responsableMinistere]
  ]);


  /* ===============================
     FOOTER
  =============================== */

  pdf.setFontSize(9);
  pdf.setTextColor(...accent);

  pdf.text(
    "MyUM — Département musique",
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
   SECTION
=============================== */

function renderSection(pdf, title, y, fields) {

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);

  pdf.text(title, 15, y);

  y += 8;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  fields.forEach(([label, value]) => {

    if (!value) return;

    pdf.setFont("helvetica", "bold");
    pdf.text(label, 15, y);

    pdf.setFont("helvetica", "normal");

    const text = pdf.splitTextToSize(String(value), 120);

    pdf.text(text, 70, y);

    y += text.length * 6;

  });

  return y + 8;

}
