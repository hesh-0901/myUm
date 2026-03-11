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
  const pageHeight = pdf.internal.pageSize.height;

  // PALETTE DE COULEURS ÉLÉGANTE
  const colors = {
    sidebar: [41, 50, 65],    // Bleu nuit pro
    accent: [61, 90, 128],    // Bleu accent
    bg: [255, 255, 255],      // Blanc pur
    text: [45, 45, 45],       // Gris anthracite
    muted: [100, 100, 100],   // Gris doux
    light: [240, 242, 245]    // Gris très clair
  };

  // 1. STRUCTURE DE FOND (Sidebar latérale)
  pdf.setFillColor(...colors.sidebar);
  pdf.rect(0, 0, 65, pageHeight, "F");

  // 2. PHOTO DE PROFIL AVEC BORDURE
  try {
    const imgElement = document.getElementById("profilePhoto");
    if (imgElement && imgElement.src) {
      const response = await fetch(imgElement.src);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64 = await new Promise(resolve => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      // Bordure blanche décorative
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(1);
      pdf.rect(14.5, 19.5, 36, 36, "D");
      pdf.addImage(base64, "JPEG", 15, 20, 35, 35);
    }
  } catch (e) {
    console.error("Erreur photo:", e);
  }

  // 3. EN-TÊTE (NOM ET RÔLE)
  const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim().toUpperCase();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(...colors.text);
  pdf.text(fullName || "MEMBRE MYUM", 75, 32);

  if (data.fonction) {
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...colors.accent);
    pdf.text(data.fonction.toUpperCase(), 75, 40);
  }

  if (data.username) {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.muted);
    pdf.text("@" + data.username, 75, 46);
  }

  // Ligne de séparation sous l'en-tête
  pdf.setDrawColor(...colors.light);
  pdf.setLineWidth(0.5);
  pdf.line(75, 52, pageWidth - 15, 52);

  let y = 65;

  // 4. BIO / PRÉSENTATION
  if (data.bio) {
    y = drawSectionTitle(pdf, "PRÉSENTATION", y, colors, 75);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.text);
    const lines = pdf.splitTextToSize(data.bio, pageWidth - 90);
    pdf.text(lines, 75, y);
    y += (lines.length * 5) + 12;
  }

  // 5. BLOCS D'INFORMATIONS (Corps Principal)
  y = drawFieldsStyled(pdf, "COORDONNÉES & INFOS", [
    ["📞 Téléphone", data.phone],
    ["📍 Commune", data.commune],
    ["🏠 Avenue", data.avenue],
    ["💍 État civil", data.etatCivil],
    ["❤️ Relation", data.statutRelationnel],
    ["🎂 Naissance", data.birthday],
    ["⏳ Âge", data.age ? `${data.age} ans` : null]
  ], y, colors, 75, pageWidth);

  y = drawFieldsStyled(pdf, "PARCOURS SPIRITUEL", [
    ["⛪ Église", data.egliseProvenance],
    ["📅 Baptême", data.anneeBapteme],
    ["💧 Type", data.typeBapteme]
  ], y, colors, 75, pageWidth);

  y = drawFieldsStyled(pdf, "MINISTÈRE MUSICAL", [
    ["🎤 Registre", data.registreVoix],
    ["🎶 Groupe", data.groupeMusique],
    ["👤 Responsable", data.responsableMinistere]
  ], y, colors, 75, pageWidth);

  // 6. FOOTER (Dans la Sidebar)
  const now = new Date();
  pdf.setFontSize(8);
  pdf.setTextColor(200, 200, 200);
  pdf.setFont("helvetica", "bold");
  pdf.text("UM COMPASSION", 15, pageHeight - 25);
  
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.text("Département de Musique", 15, pageHeight - 21);
  pdf.text("Lubumbashi, RDC", 15, pageHeight - 17);
  
  pdf.setTextColor(...colors.muted);
  pdf.text(`Document généré le ${now.toLocaleDateString()}`, pageWidth - 15, pageHeight - 10, { align: "right" });

  pdf.save(`${data.firstName || "profil"}-${data.lastName || ""}.pdf`);
}

// FONCTION TITRE DE SECTION AMÉLIORÉE
function drawSectionTitle(pdf, title, y, colors, xPos) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.accent);
  pdf.text(title, xPos, y);
  
  // Petite ligne décorative sous le titre
  pdf.setDrawColor(...colors.accent);
  pdf.setLineWidth(0.8);
  pdf.line(xPos, y + 2, xPos + 10, y + 2);
  
  return y + 10;
}

// FONCTION CHAMP STYLISÉ AVEC GRILLE SUBTILE
function drawFieldsStyled(pdf, title, fields, y, colors, xPos, pageWidth) {
  // Vérifier s'il y a des données valides avant de dessiner la section
  const validFields = fields.filter(f => f[1]);
  if (validFields.length === 0) return y;

  // Saut de page si nécessaire
  if (y > 240) { pdf.addPage(); y = 20; }

  y = drawSectionTitle(pdf, title, y, colors, xPos);

  validFields.forEach(([label, value]) => {
    if (y > 275) { pdf.addPage(); y = 20; }

    // Fond léger pour chaque ligne
    pdf.setFillColor(248, 249, 250);
    pdf.rect(xPos - 2, y - 4, pageWidth - xPos - 8, 6, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.muted);
    pdf.text(label, xPos, y);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...colors.text);
    pdf.text(String(value), xPos + 45, y);

    y += 8;
  });

  return y + 6;
}
