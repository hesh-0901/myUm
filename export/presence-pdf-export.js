import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";
import autoTableModule from "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/+esm";

// 🔥 FIX ICI
const autoTable = autoTableModule.default;

// ===============================
export function exportToPDF(data = []) {

  if (!data.length) {
    alert("Aucune donnée à exporter");
    return;
  }

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Liste de présence", 14, 15);

  doc.setFontSize(10);
  doc.text(`Total : ${data.length}`, 14, 22);

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
    startY: 28,
    head: [[
      "Index",
      "Username",
      "Nom",
      "Chorale",
      "Heure",
      "Méthode",
      "Statut"
    ]],
    body: rows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [26, 54, 104] }
  });

  doc.save("presences.pdf");
}
