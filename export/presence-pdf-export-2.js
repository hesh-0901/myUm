import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";
import autoTableModule from "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/+esm";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { db } from "/myUm/mains.js/firebase-config.js";

const autoTable = autoTableModule.default;

// ===============================
// IMAGE BASE64
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
// GET MEMBERS
// ===============================
async function getAllMembers() {
  const usersSnap = await getDocs(collection(db, "users"));
  const membersSnap = await getDocs(collection(db, "members"));

  const map = new Map();

  usersSnap.forEach(doc => {
    const d = doc.data();
    if (!d.username) return;

    map.set(d.username, {
      username: d.username,
      fullName: `${d.firstName || ""} ${d.lastName || ""}`.trim(),
      chorale: d.username.split("-").pop()
    });
  });

  membersSnap.forEach(doc => {
    const d = doc.data();
    if (!d.matricule) return;

    if (!map.has(d.matricule)) {
      map.set(d.matricule, {
        username: d.matricule,
        fullName: d.fullName,
        chorale: d.matricule.split("-").pop()
      });
    }
  });

  return Array.from(map.values());
}

// ===============================
// HELPERS
// ===============================
function getStatus(d) {
  if (!d) return "A";
  if (d.status === "justified") return "J";
  if (d.status === "suspended") return "S";
  if (d.status === "special") return "Sp";
  if (d.status === "displacement") return "D";
  return "P";
}

function getTime(d) {
  if (!d?.timestamp) return "";
  return d.timestamp.toDate().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getMethod(d) {
  if (!d) return "";
  return d.method === "manual" ? "Manuel" : "Radar";
}

// ===============================
// EXPORT PDF
// ===============================
export async function exportAdvancedPDF(data = [], room = {}) {

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const dark = [40, 40, 40];
  const light = [120, 120, 120];
  const line = [210, 210, 210];

  // ===============================
  // HEADER
  // ===============================
  function drawHeader() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...dark);

    doc.text("UNION MUSICALE LA COMPASSION", 14, 12);
    doc.text("LUBUMBASHI", 14, 17);

    doc.setFontSize(16);
    doc.text("UM", pageWidth - 14, 14, { align: "right" });

    doc.setFontSize(10);
    doc.setTextColor(...light);
    doc.text("FEUILLE DE PRÉSENCE - MYUM APP", 14, 26);

    doc.setDrawColor(...line);
    doc.line(14, 30, pageWidth - 14, 30);
  }

  // ===============================
  // INFO BLOCK
  // ===============================
  async function drawInfo(y = 36) {

    const avatarSize = 16;

    if (room.photoURL) {
      const img = await loadImageAsBase64(room.photoURL);
      if (img) doc.addImage(img, "JPEG", 14, y, avatarSize, avatarSize);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...dark);

    doc.text(
      (room.createdByName || "").toUpperCase(),
      14 + avatarSize + 4,
      y + 6
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...light);

    doc.text(`${room.chorale || "-"} • ${room.type || "-"}`, 14 + avatarSize + 4, y + 11);
    doc.text(`Date : ${room.date || "-"}`, 14 + avatarSize + 4, y + 16);

    if (room.description) {
      doc.text(room.description, 14, y + 24);
    }

    doc.setDrawColor(...line);
    doc.line(14, y + 30, pageWidth - 14, y + 30);

    return y + 34;
  }

  // ===============================
  // DATA BUILD
  // ===============================
  const allMembers = await getAllMembers();

  const mainMembers = allMembers.filter(m => m.chorale === room.chorale);

  const rows = mainMembers.map((m, i) => {
    const attendance = data.find(d => d.username === m.username);

    return [
      i + 1,
      m.username,
      m.fullName,
      getStatus(attendance),
      getTime(attendance),
      getMethod(attendance)
    ];
  });

  // ===============================
  // STATS
  // ===============================
  function computeStats() {
    let total = mainMembers.length;
    let present = 0;
    let justified = 0;
    let suspended = 0;
    let special = 0;
    let displacement = 0;

    mainMembers.forEach(m => {
      const d = data.find(x => x.username === m.username);
      const s = getStatus(d);

      if (s !== "A") present++;
      if (s === "J") justified++;
      if (s === "S") suspended++;
      if (s === "Sp") special++;
      if (s === "D") displacement++;
    });

    return {
      total,
      present,
      absent: total - present,
      justified,
      suspended,
      special,
      displacement,
      rate: total ? Math.round((present / total) * 100) : 0
    };
  }

  const stats = computeStats();

  // ===============================
  // PAGE 1
  // ===============================
  drawHeader();
  let startY = await drawInfo();

  autoTable(doc, {
    startY: startY + 2,
    head: [["#", "Username", "Nom", "Statut", "Heure", "Mode"]],
    body: rows,
    styles: { fontSize: 8, textColor: dark },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: dark,
      lineWidth: 0.1
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 14, right: 14 }
  });

  let y = doc.lastAutoTable.finalY + 8;

  // ===============================
  // STATS BLOCK
  // ===============================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  doc.text("STATISTIQUES", 14, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...light);

  y += 5;

  [
    `Total membres : ${stats.total}`,
    `Présents : ${stats.present}`,
    `Absents : ${stats.absent}`,
    `Justifiés : ${stats.justified}`,
    `Suspendus : ${stats.suspended}`,
    `Spéciaux : ${stats.special}`,
    `Déplacements : ${stats.displacement}`,
    `Taux de présence : ${stats.rate}%`
  ].forEach((t, i) => {
    doc.text(t, 14, y + i * 5);
  });

  // ===============================
  // PAGE 2 (GROUPES)
  // ===============================
  doc.addPage();
  drawHeader();

  let posY = 40;

  function drawSection(title, list) {

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.text(title, 14, posY);

    const rows = list.map((d, i) => [
      i + 1,
      d.username,
      d.fullName,
      "P",
      getTime(d),
      getMethod(d)
    ]);

    autoTable(doc, {
      startY: posY + 2,
      head: [["#", "Username", "Nom", "Statut", "Heure", "Mode"]],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [240, 240, 240] }
    });

    posY = doc.lastAutoTable.finalY + 8;
  }

  drawSection("INSTRUMENTISTES", data.filter(d => d.chorale === "IN"));
  drawSection("VISITEURS", data.filter(d => d.chorale === "GT"));
  drawSection("ADMINISTRATION", data.filter(d => d.chorale === "AD"));

  // ===============================
  // FOOTER
  // ===============================
  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(...line);
    doc.line(14, pageHeight - 25, 80, pageHeight - 25);

    doc.setFontSize(9);
    doc.setTextColor(...light);

    doc.text("Signature du responsable", 14, pageHeight - 20);

    doc.text(`Page ${i}/${pageCount}`, pageWidth - 14, pageHeight - 10, {
      align: "right"
    });
  }

  doc.save("presence-myum.pdf");
}
