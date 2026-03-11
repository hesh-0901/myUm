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

  // --- PALETTE DE COULEURS PROFESSIONNELLE ---
  const colors = {
    primary: [26, 54, 104],    // Bleu Marine (Identité)
    secondary: [37, 150, 217], // Bleu Clair
    text: [33, 37, 41],        // Anthracite
    muted: [108, 117, 125],    // Gris texte secondaire
    border: [222, 226, 230],   // Bordures de cartes
    white: [255, 255, 255],
    sidebarText: [230, 235, 245]
  };

  // --- FOND & SIDEBAR ---
  pdf.setFillColor(250, 251, 253); // Fond de page très léger
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  pdf.setFillColor(...colors.primary);
  pdf.rect(0, 0, 68, pageHeight, "F"); // Sidebar légèrement plus large

  // --- LOGO (PLACEMENT OPTIMISÉ) ---
  try {
    // Placé en haut à gauche pour l'équilibre visuel
    pdf.addImage("/myUm/assets/logo-myum.png", "PNG", 10, 15, 48, 16);
  } catch (e) {
    console.warn("Logo non chargé");
  }

  // --- PHOTO DE PROFIL (STYLE RECTANGULAIRE) ---
  let sideY = 45;
  try {
    const imgElement = document.getElementById("profilePhoto");
    if (imgElement && imgElement.src) {
      const response = await fetch(imgElement.src);
      const blob = await response.blob();
      const base64 = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      // Cadre photo premium
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.8);
      pdf.addImage(base64, "JPEG", 14, sideY, 40, 45, "", "FAST");
      pdf.rect(14, sideY, 40, 45, "D");
      sideY += 55;
    }
  } catch (e) {
    sideY += 10;
  }

  // --- INFOS DE CONTACT (SIDEBAR) ---
  const drawSidebarContact = (label, value) => {
    if (!value) return;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.secondary);
    pdf.text(label.toUpperCase(), 14, sideY);
    sideY += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.sidebarText);
    pdf.text(String(value), 14, sideY, { maxWidth: 42 });
    sideY += 12;
  };

  drawSidebarContact("Téléphone", data.phone);
  drawSidebarContact("Localisation", `${data.commune || ""}, ${data.avenue || ""}`);
  drawSidebarContact("État Civil", data.etatCivil);
  drawSidebarContact("Relation", data.statutRelationnel);

  /* --- EMPLACEMENT RÉSERVÉ POUR QR CODE ---
     Ici, vous pourrez insérer le QR Code généré.
     Exemple : pdf.addImage(qrCodeBase64, "PNG", 19, pageHeight - 60, 30, 30);
  */

  // --- HEADER PRINCIPAL (CORPS) ---
  const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim().toUpperCase();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.setTextColor(...colors.primary);
  pdf.text(fullName, 78, 30);

  // Badge Fonction
  if (data.fonction) {
    pdf.setFillColor(...colors.secondary);
    const roleWidth = pdf.getTextWidth(data.fonction.toUpperCase()) + 10;
    pdf.roundedRect(78, 35, roleWidth, 7, 1.5, 1.5, "F");
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text(data.fonction.toUpperCase(), 83, 40);
  }

  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(11);
  pdf.setTextColor(...colors.muted);
  pdf.text("@" + (data.username || "username"), 78, 48);

  let currentY = 65;

  // --- COMPOSANT CARD ---
  const drawCard = (title, contentLines) => {
    const cardWidth = pageWidth - 93;
    const cardX = 78;
    const padding = 10;
    const lineHeight = 7;
    const titleSpace = 12;
    
    const cardHeight = titleSpace + (contentLines.length * lineHeight) + padding;

    // Ombre simulée et fond
    pdf.setFillColor(240, 240, 240);
    pdf.rect(cardX + 0.5, currentY + 0.5, cardWidth, cardHeight, "F"); // Ombre
    pdf.setFillColor(255, 255, 255);
    pdf.rect(cardX, currentY, cardWidth, cardHeight, "F"); // Carte
    pdf.setDrawColor(...colors.border);
    pdf.setLineWidth(0.2);
    pdf.rect(cardX, currentY, cardWidth, cardHeight, "S"); // Bordure

    // Titre
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.primary);
    pdf.text(title.toUpperCase(), cardX + padding, currentY + 8);
    
    // Contenu
    let textY = currentY + 18;
    contentLines.forEach(line => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...colors.muted);
      pdf.text(line.label, cardX + padding, textY);
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.5);
      pdf.setTextColor(...colors.text);
      pdf.text(String(line.value), cardX + padding + 40, textY);
      textY += lineHeight;
    });

    currentY += cardHeight + 10;
  };

  // --- SECTIONS DE DONNÉES ---
  
  // Présentation
  if (data.bio) {
    const bioLines = pdf.splitTextToSize(data.bio, pageWidth - 113);
    const h = (bioLines.length * 5) + 20;
    pdf.setFillColor(255, 255, 255);
    pdf.rect(78, currentY, pageWidth - 93, h, "F");
    pdf.setDrawColor(...colors.border);
    pdf.rect(78, currentY, pageWidth - 93, h, "S");
    
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.primary);
    pdf.text("PRÉSENTATION", 88, currentY + 8);
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(...colors.text);
    pdf.text(bioLines, 88, currentY + 16);
    currentY += h + 10;
  }

  // Parcours
  drawCard("Parcours Spirituel", [
    { label: "Église", value: data.egliseProvenance || "-" },
    { label: "Baptême", value: data.anneeBapteme || "-" },
    { label: "Type", value: data.typeBapteme || "-" }
  ]);

  // Ministère
  drawCard("Ministère Musical", [
    { label: "Registre", value: data.registreVoix || "-" },
    { label: "Groupe", value: data.groupeMusique || "-" },
    { label: "Responsable", value: data.responsableMinistere || "-" }
  ]);

  // --- SIGNATURE NUMÉRIQUE & FOOTER ---
  const now = new Date();
  const fullDate = now.toLocaleDateString("fr-FR", { 
    day: '2-digit', month: 'long', year: 'numeric' 
  });
  const fullTime = now.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });

  pdf.setFontSize(8);
  pdf.setTextColor(...colors.muted);
  
  // Footer à droite
  pdf.text(`Fiche membre officielle - MyUM Compassion`, pageWidth - 15, pageHeight - 15, { align: "right" });
  pdf.text(`Généré par @${data.username || 'système'} le ${fullDate} à ${fullTime}`, pageWidth - 15, pageHeight - 10, { align: "right" });

  // Sauvegarde
  pdf.save(`MYUM_${data.lastName || "Profil"}.pdf`);
}
