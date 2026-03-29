import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";
import autoTableModule from "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/+esm";

const autoTable = autoTableModule.default;

// ===============================
// LOAD IMAGE BASE64
// ===============================
async function loadImageAsBase64(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();

    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ===============================
export async function exportAdvancedPDF(data = [], room = {}) {

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  const dark = [31, 41, 55];
  const light = [107, 114, 128];
  const line = [229, 231, 235];

  // ===============================
  // HEADER FUNCTION
  // ===============================
  function drawHeader() {

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

    doc.setDrawColor(...line);
    doc.line(14, 36, pageWidth - 14, 36);
  }

  // ===============================
  // RESPONSABLE BLOCK
  // ===============================
  async function drawRoomBlock(y = 45) {

    const avatarSize = 16;

    try {
      if (room.photoURL) {
        const base64 = await loadImageAsBase64(room.photoURL);
        if (base64) {
          doc.addImage(base64, "JPEG", 14, y, avatarSize, avatarSize);
        }
      }
    } catch {}

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...dark);

    doc.text(
      (room.createdByName || "Responsable inconnu").toUpperCase(),
      14 + avatarSize + 4,
      y + 6
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);

    doc.text(
      `${room.chorale || "-"} • ${room.type || "-"}`,
      14 + avatarSize + 4,
      y + 11
    );

    doc.setTextColor(...light);
    doc.text(
      `Date : ${room.date || "-"}`,
      14 + avatarSize + 4,
      y + 16
    );

    if (room.description) {
      doc.text(room.description, 14, y + 24);
    }

    doc.setDrawColor(...line);
    doc.line(14, y + 30, pageWidth - 14, y + 30);

    return y + 35;
  }

  // ===============================
  // FORMAT TABLE
  // ===============================
  function formatRows(list) {
    return list.map((d, i) => {

      const date = d.timestamp?.toDate();

      return [
        i + 1,
        d.username || "",
        d.fullName || "",
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
  }

  // ===============================
  // GROUPING
  // ===============================
  const mainGroup = data.filter(d => d.chorale === room.chorale);
  const IN = data.filter(d => d.chorale === "IN");
  const GT = data.filter(d => d.chorale === "GT");
  const AD = data.filter(d => d.chorale === "AD");

  // ===============================
  // PAGE 1 → CHORALE
  // ===============================
  drawHeader();
  let startY = await drawRoomBlock();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...dark);
  doc.text(`CHORALE : ${room.chorale || "-"}`, 14, startY);

  autoTable(doc, {
    startY: startY + 4,
    head: [["#", "Username", "Nom", "Heure", "Méthode", "Statut"]],
    body: formatRows(mainGroup),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [245, 247, 250], textColor: dark }
  });

  // ===============================
  // PAGE 2 → AUTRES GROUPES
  // ===============================
  doc.addPage();
  drawHeader();

  let y = 45;

  function drawSection(title, list) {

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.text(title, 14, y);

    autoTable(doc, {
      startY: y + 2,
      head: [["#", "Username", "Nom", "Heure", "Méthode", "Statut"]],
      body: formatRows(list),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [245, 247, 250], textColor: dark }
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  drawSection("INSTRUMENTISTES (IN)", IN);
  drawSection("VISITEURS (GT)", GT);
  drawSection("ADMINISTRATION (AD)", AD);

  // ===============================
  // FOOTER GLOBAL
  // ===============================
  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setDrawColor(...line);
    doc.line(14, pageHeight - 25, 80, pageHeight - 25);

    doc.setFontSize(9);
    doc.setTextColor(...light);
    doc.text("Signature du responsable", 14, pageHeight - 20);

    doc.text(
      `Page ${i}/${pageCount}`,
      pageWidth - 14,
      pageHeight - 10,
      { align: "right" }
    );
  }

  doc.save("presence-myum-advanced.pdf");
}
