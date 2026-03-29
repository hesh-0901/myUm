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
  // 👤 BLOC RESPONSABLE (PRO)
  // ===============================
  let y = 45;

  // Photo (si dispo)
  if (room.photoURL) {
    try {
      const img = new Image();
      img.src = room.photoURL;

      // ⚠️ jsPDF image async limité → fallback si erreur
      doc.addImage(img, "JPEG", 14, y, 14, 14);
    } catch {}
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...dark);

  doc.text(room.createdByName || "-", 32, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...light);

  doc.text(`${room.chorale || "-"} • ${room.type || "-"}`, 32, y + 11);

  doc.text(
    `${room.date || "-"} • ${room.description || "-"}`,
    32,
    y + 16
  );

  // Ligne séparation
  doc.setDrawColor(...line);
  doc.line(14, y + 22, pageWidth - 14, y + 22);

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
