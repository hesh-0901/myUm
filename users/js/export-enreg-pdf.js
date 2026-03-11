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

  // DESIGN SYSTEM MYUM
  const theme = {
    primary: [26, 54, 104],    // #1A3668
    accent: [37, 150, 217],     // #2596D9
    silver: [230, 233, 240],
    darkText: [20, 20, 20],
    bodyText: [60, 60, 60],
    white: [255, 255, 255]
  };

  // 1. FOND ET STRUCTURE
  pdf.setFillColor(...theme.white);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");
  
  // Sidebar gauche stylisée
  pdf.setFillColor(...theme.primary);
  pdf.rect(0, 0, 70, pageHeight, "F");

  // 2. BRANDING (LOGO & DÉPT)
  try {
    pdf.addImage("/myUm/assets/logo-myum.png", "PNG", 12, 15, 46, 15);
  } catch (e) {}

  // 3. PHOTO DE PROFIL CIRCULAIRE (Masque de découpe simulé)
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

      // Cercle décoratif extérieur
      pdf.setDrawColor(...theme.accent);
      pdf.setLineWidth(1);
      pdf.circle(35, 65, 22, "D");
      
      // Image (format carré centré pour l'exemple)
      pdf.addImage(base64, "JPEG", 16, 46, 38, 38);
    }
  } catch (e) {}

  // 4. HEADER INFOS (À DROITE)
  const name = `${data.firstName || ""} ${data.lastName || ""}`.trim().toUpperCase();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(26);
  pdf.setTextColor(...theme.primary);
  pdf.text(name || "MEMBRE", 80, 35);

  // Badge Fonction
  if (data.fonction) {
    const roleWidth = pdf.getTextWidth(data.fonction.toUpperCase()) + 10;
    pdf.setFillColor(...theme.accent);
    pdf.roundedRect(80, 40, roleWidth, 8, 1, 1, "F");
    pdf.setTextColor(...theme.white);
    pdf.setFontSize(10);
    pdf.text(data.fonction.toUpperCase(), 85, 45.5);
  }

  pdf.setTextColor(...theme.bodyText);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "italic");
  pdf.text("@" + (data.username || "username"), 80, 56);

  // Ligne de séparation élégante
  pdf.setDrawColor(...theme.silver);
  pdf.line(80, 65, pageWidth - 20, 65);

  let currentY = 75;

  // 5. BLOCS DE CONTENU
  
  // Présentation (Bio)
  if (data.bio) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...theme.primary);
    pdf.text("PRÉSENTATION", 80, currentY);
    
    currentY += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...theme.bodyText);
    const bioLines = pdf.splitTextToSize(data.bio, pageWidth - 100);
    pdf.text(bioLines, 80, currentY);
    currentY += (bioLines.length * 5) + 12;
  }

  // Fonction utilitaire pour dessiner les grilles d'infos
  const renderGrid = (title, items) => {
    const validItems = items.filter(i => i[1]);
    if (validItems.length === 0) return;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...theme.primary);
    pdf.text(title, 80, currentY);
    
    currentY += 4;
    pdf.setDrawColor(...theme.accent);
    pdf.setLineWidth(0.5);
    pdf.line(80, currentY, 88, currentY); // Petite barre sous titre
    
    currentY += 8;

    validItems.forEach(([label, value]) => {
      // Label
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...theme.bodyText);
      pdf.text(label.toUpperCase(), 80, currentY);
      
      // Value
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(...theme.darkText);
      pdf.text(String(value), 125, currentY);
      
      // Ligne de séparation légère
      pdf.setDrawColor(...theme.silver);
      pdf.setLineWidth(0.1);
      pdf.line(80, currentY + 2, pageWidth - 20, currentY + 2);
      
      currentY += 9;
    });
    currentY += 5;
  };

  renderGrid("COORDONNÉES", [
    ["Téléphone", data.phone],
    ["Commune", data.commune],
    ["Adresse", data.avenue],
    ["État Civil", data.etatCivil],
    ["Relation", data.statutRelationnel],
    ["Naissance", data.birthday],
    ["Âge actuel", data.age ? `${data.age} ans` : null]
  ]);

  renderGrid("PARCOURS & MINISTÈRE", [
    ["Église", data.egliseProvenance],
    ["Baptême", data.anneeBapteme ? `Année ${data.anneeBapteme}` : null],
    ["Registre", data.registreVoix],
    ["Groupe", data.groupeMusique]
  ]);

  // 6. PIED DE PAGE (STYLISÉ DANS LA SIDEBAR)
  pdf.setTextColor(...theme.white);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text("UM COMPASSION", 15, pageHeight - 30);
  
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(200, 200, 200);
  pdf.text("Département de Musique", 15, pageHeight - 25);
  pdf.text("Lubumbashi, RDC", 15, pageHeight - 21);

  // Date à droite
  pdf.setTextColor(...theme.bodyText);
  pdf.setFontSize(7);
  const genDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  pdf.text(`Fiche officielle générée le ${genDate}`, pageWidth - 20, pageHeight - 10, { align: "right" });

  pdf.save(`MYUM_PROFIL_${data.lastName || "USER"}.pdf`);
}
