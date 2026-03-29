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
  // HEADER OFFICIEL
  // ===============================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("UNION MUSICALE LA COMPASSION LUBUMBASHI", pageWidth / 2, 10, { align: "center" });

  doc.setFontSize(14);
  doc.text("UM", pageWidth / 2, 16, { align: "center" });

  doc.setFontSize(11);
  doc.text("FEUILLE DE PRESENCE MYUM APP", pageWidth / 2, 22, { align: "center" });

  // Ligne séparatrice
  doc.setLineWidth(0.5);
  doc.line(14, 26, pageWidth - 14, 26);

  // ===============================
  // INFOS ROOM
  // ===============================
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  let startY = 32;

  doc.text(`Responsable : ${room.createdByName || "-"}`, 14, startY);
  doc.text(`Chorale : ${room.chorale || "-"}`, 14, startY + 5);
  doc.text(`Type : ${room.type || "-"}`, 14, startY + 10);

  doc.text(`Date : ${room.date || "-"}`, 120, startY);
  doc.text(`Description : ${room.description || "-"}`, 120, startY + 5);

  // ===============================
  // TABLE DATA
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
    startY: 48,
    head: [[
      "N°",
      "Username",
      "Nom complet",
      "Chorale",
      "Heure",
      "Méthode",
      "Statut"
    ]],
    body: rows,
    styles: {
      fontSize: 8,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [26, 54, 104],
      textColor: 255,
      halign: "center"
    },
    bodyStyles: {
      halign: "center"
    },
    didDrawPage: function (dataArg) {

      const pageCount = doc.internal.getNumberOfPages();
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.getHeight();

      // ===============================
      // FOOTER SIGNATURE
      // ===============================
      doc.setFontSize(9);
      doc.text("Signature du responsable", 14, pageHeight - 20);

      doc.line(14, pageHeight - 18, 80, pageHeight - 18);

      // ===============================
      // PAGINATION
      // ===============================
      doc.text(
        `Page ${doc.internal.getCurrentPageInfo().pageNumber}/${pageCount}`,
        pageWidth - 20,
        pageHeight - 10,
        { align: "right" }
      );
    }
  });

  doc.save("presence-myum.pdf");
}
