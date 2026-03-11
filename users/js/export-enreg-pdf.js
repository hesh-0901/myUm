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

  // CHARTE GRAPHIQUE MYUM
  const colors = {
    primary: [26, 54, 104],   // #1A3668 (Bleu Marine)
    medium: [37, 150, 217],    // #2596D9 (Bleu Moyen)
    text: [40, 40, 40],
    muted: [110, 110, 110],
    light: [240, 242, 245]
  };

  // 1. BARRE LATÉRALE (DESIGN ÉPURÉ)
  pdf.setFillColor(...colors.primary);
  pdf.rect(0, 0, 65, pageHeight, "F");

  // 2. LOGO MYUM DANS LA SIDEBAR
  try {
    // Utilisation du chemin fourni pour le logo
    pdf.addImage("/myUm/assets/logo-myum.png", "PNG", 10, 15, 45, 15);
  } catch (e) {
    console.warn("Logo non trouvé au chemin spécifié");
  }

  // 3. PHOTO DE PROFIL (Cercle blanc autour)
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

      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(1.5);
      pdf.circle(32.5, 65, 20, "D"); // Guide visuel
      pdf.addImage(base64, "JPEG", 15, 48, 35, 35);
    }
  } catch (e) {}

  // 4. HEADER (À DROITE DE LA SIDEBAR)
  const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim().toUpperCase();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.setTextColor(...colors.primary);
  pdf.text(fullName || "MEMBRE MYUM", 75, 30);

  if (data.fonction) {
    pdf.setFontSize(12);
    pdf.setTextColor(...colors.medium);
    pdf.text(data.fonction.toUpperCase(), 75, 38);
  }

  if (data.username) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.muted);
    pdf.text("@" + data.username, 75, 44);
  }

  let y = 65;

  // 5. SECTIONS DE DONNÉES
  const drawSection = (title, fields) => {
    const validFields = fields.filter(f => f[1]);
    if (validFields.length === 0) return;

    if (y > 240) { pdf.addPage(); y = 20; }

    // Titre de section
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...colors.primary);
    pdf.text(title, 75, y);
    
    pdf.setDrawColor(...colors.medium);
    pdf.setLineWidth(0.5);
    pdf.line(75, y + 2, 90, y + 2);
    
    y += 10;

    validFields.forEach(([label, value]) => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.muted);
      pdf.text(label, 75, y);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...colors.text);
      pdf.text(String(value), 120, y);
      
      y += 8;
    });
    y += 5;
  };

  // Bio
  if (data.bio) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...colors.primary);
    pdf.text("PRÉSENTATION", 75, y);
    y += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.text);
    const lines = pdf.splitTextToSize(data.bio, pageWidth - 90);
    pdf.text(lines, 75, y);
    y += (lines.length * 5) + 10;
  }

  drawSection("COORDONNÉES", [
    ["Téléphone", data.phone],
    ["Commune", data.commune],
    ["Avenue", data.avenue],
    ["État civil", data.etatCivil],
    ["Relation", data.statutRelationnel]
  ]);

  drawSection("PARCOURS SPIRITUEL", [
    ["Église", data.egliseProvenance],
    ["Année Baptême", data.anneeBapteme],
    ["Type", data.typeBapteme]
  ]);

  drawSection("MINISTÈRE MUSICAL", [
    ["Registre", data.registreVoix],
    ["Groupe", data.groupeMusique],
    ["Responsable", data.responsableMinistere]
  ]);

  // 6. FOOTER SIDEBAR
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text("Département de Musique", 10, pageHeight - 20);
  pdf.text("UM Compassion", 10, pageHeight - 15);
  
  pdf.setTextColor(...colors.muted);
  pdf.setFontSize(7);
  const dateStr = new Date().toLocaleDateString();
  pdf.text(`Généré le ${dateStr}`, pageWidth - 15, pageHeight - 10, { align: "right" });

  pdf.save(`${data.firstName || "profil"}-${data.lastName || ""}.pdf`);
}
