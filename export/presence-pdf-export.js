import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";
import autoTableModule from "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/+esm";

const autoTable = autoTableModule.default;

// ===============================
export function exportToPDF(data = [], room = {}) {

  if (!data.length) {
    alert("Aucune donnée à exporter");
    return;
  }

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  // ===============================
  // 🎨 COLORS (PRO)
  // ===============================
  const dark = [31, 41, 55];     // gris profond
  const light = [107, 114, 128]; // gris secondaire
  const line = [229, 231, 235];  // gris clair

  // ===============================
  // 🧾 HEADER PREMIUM
  // ===============================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...dark);

  doc.text("UNION MUSICALE LA COMPASSION", 14, 12);
  doc.text("LUBUMBASHI", 14, 18);

  doc.setFontSize(18);
  doc.text("UM", pageWidth - 20, 16, { align: "right" });

  doc.setFontSize(11);
  doc.setTextColor(...light);
  doc.text("FEUILLE DE PRÉSENCE", 14, 28);

  doc.setFontSize(9);
  doc.text("MyUM Application", 14, 33);

  // Ligne fine
  doc.setDrawColor(...line);
  doc.line(14, 36, pageWidth - 14, 36);

// ===============================
// 👤 BLOC RESPONSABLE PREMIUM
// ===============================
let y = 45;

// 🔹 PHOTO (safe fallback)
const avatarSize = 16;

try {
  if (room.photoURL) {
    // ⚠️ image externe peut échouer → on ignore silencieusement
    doc.addImage(room.photoURL, "JPEG", 14, y, avatarSize, avatarSize);
  }
} catch (e) {
  // fallback → rien (design reste propre)
}

// 🔹 TEXTE PRINCIPAL
doc.setFont("helvetica", "bold");
doc.setFontSize(11);
doc.setTextColor(31, 41, 55);

doc.text(
  (room.createdByName || "Responsable inconnu").toUpperCase(),
  14 + avatarSize + 4,
  y + 6
);

// 🔹 META (chorale + type)
doc.setFont("helvetica", "normal");
doc.setFontSize(9);
doc.setTextColor(75, 85, 99);

doc.text(
  `${room.chorale || "-"} • ${room.type || "-"}`,
  14 + avatarSize + 4,
  y + 11
);

// 🔹 DATE (isolée = important visuellement)
doc.setTextColor(107, 114, 128);
doc.text(
  `Date : ${room.date || "-"}`,
  14 + avatarSize + 4,
  y + 16
);

// 🔹 DESCRIPTION (ligne séparée = premium)
if (room.description) {
  doc.setTextColor(107, 114, 128);
  doc.text(
    room.description,
    14,
    y + 24
  );
}

// 🔹 LIGNE FINE
doc.setDrawColor(229, 231, 235);
doc.line(14, y + 30, pageWidth - 14, y + 30);

  // ===============================
  // 📊 TABLE
  // ===============================
  const rows = data.map((d, i) => {

    const date = d.timestamp?.toDate();

    return [
      i + 1,
      d.username || "",
      d.fullName || "",
      d.chorale || "",
      date
        ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "",
      d.method === "manual" ? "Manuel" : "Radar",
      d.status === "justified" ? "J" :
      d.status === "suspended" ? "S" :
      d.status === "special" ? "Sp" :
      "P"
    ];
  });

  autoTable(doc, {
    startY: y + 28,
    head: [[
      "N°",
      "Username",
      "Nom",
      "Chorale",
      "Heure",
      "Méthode",
      "Statut"
    ]],
    body: rows,
    styles: {
      fontSize: 8,
      textColor: dark
    },
    headStyles: {
      fillColor: [245, 247, 250],
      textColor: dark,
      lineWidth: 0.2
    },
    didDrawPage: function () {

      const pageHeight = doc.internal.pageSize.getHeight();
      const pageCount = doc.internal.getNumberOfPages();

      // ===============================
      // ✍️ SIGNATURE
      // ===============================
      doc.setDrawColor(...line);
      doc.line(14, pageHeight - 25, 80, pageHeight - 25);

      doc.setFontSize(9);
      doc.setTextColor(...light);
      doc.text("Signature du responsable", 14, pageHeight - 20);

      // ===============================
      // 📄 PAGINATION
      // ===============================
      doc.text(
        `Page ${doc.internal.getCurrentPageInfo().pageNumber}/${pageCount}`,
        pageWidth - 14,
        pageHeight - 10,
        { align: "right" }
      );
    }
  });

  doc.save("presence-myum.pdf");
}
