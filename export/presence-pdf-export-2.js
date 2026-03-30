import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";
import autoTableModule from "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/+esm";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { db } from "/myUm/mains.js/firebase-config.js";

const autoTable = autoTableModule.default;

// ===============================
// IMAGE
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
// 🔥 BUILD LIST (LOGIQUE MÉTIER)
// ===============================
async function buildAttendanceList(data, room) {

  const usersSnap = await getDocs(collection(db, "users"));
  const membersSnap = await getDocs(collection(db, "members"));

  const map = new Map();

  // USERS PRIORITÉ
  usersSnap.forEach(doc => {
    const d = doc.data();
    if (!d.username) return;

    map.set(d.username, {
      username: d.username,
      fullName: `${d.firstName || ""} ${d.lastName || ""}`.trim(),
      chorale: d.username.split("-").pop()
    });
  });

  // MEMBERS fallback
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

  const allMembers = Array.from(map.values());

  const getAttendance = (username) =>
    data.find(d => d.username === username);

  // ===============================
  // CAS UM
  // ===============================
  if (room.chorale === "UM") {

    return allMembers.map(m => {
      const a = getAttendance(m.username);

      return {
        ...m,
        status: getStatus(a),
        time: getTime(a),
        method: getMethod(a)
      };
    });
  }

  // ===============================
  // CAS CHORALE
  // ===============================
  const main = allMembers.filter(m => m.chorale === room.chorale);

  const otherChoralesPresent = data.filter(d =>
    ["VN", "PC", "WS"].includes(d.chorale) &&
    d.chorale !== room.chorale
  );

  const list = [];

  // PARTIE 1 : chorale principale
  main.forEach(m => {
    const a = getAttendance(m.username);

    list.push({
      ...m,
      status: getStatus(a),
      time: getTime(a),
      method: getMethod(a)
    });
  });

  // PARTIE 2 : autres chorales présentes
  otherChoralesPresent.forEach(d => {

    if (list.some(x => x.username === d.username)) return;

    list.push({
      username: d.username,
      fullName: d.fullName,
      chorale: d.chorale,
      status: getStatus(d),
      time: getTime(d),
      method: getMethod(d)
    });
  });

  return list;
}

// ===============================
// GROUPES PAGE 2
// ===============================
function getSecondaryGroups(data) {
  return {
    IN: data.filter(d => d.chorale === "IN"),
    GT: data.filter(d => d.chorale === "GT"),
    AD: data.filter(d => d.chorale === "AD")
  };
}

// ===============================
// STATS
// ===============================
function computeStats(list, groups) {

  const fullList = [
    ...list,
    ...groups.IN,
    ...groups.GT,
    ...groups.AD
  ];

  let stats = {
    totalMembers: fullList.length,
    presentCount: 0,
    absentCount: 0,
    justifiedCount: 0,
    suspendedCount: 0,
    specialCount: 0,
    displacementCount: 0
  };

  fullList.forEach(d => {

    if (d.status === "A") stats.absentCount++;
    else stats.presentCount++;

    if (d.status === "J") stats.justifiedCount++;
    if (d.status === "S") stats.suspendedCount++;
    if (d.status === "Sp") stats.specialCount++;
    if (d.status === "D") stats.displacementCount++;
  });

  stats.rate = stats.totalMembers
    ? ((stats.presentCount / stats.totalMembers) * 100).toFixed(2)
    : "0.00";

  return stats;
}

// ===============================
// EXPORT
// ===============================
export async function exportAdvancedPDF(data = [], room = {}) {

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const dark = [40, 40, 40];
  const light = [120, 120, 120];
  const line = [210, 210, 210];

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

  async function drawInfo(y = 36) {

    const avatarSize = 16;

    if (room.photoURL) {
      const img = await loadImageAsBase64(room.photoURL);
      if (img) doc.addImage(img, "JPEG", 14, y, avatarSize, avatarSize);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...dark);

    doc.text((room.createdByName || "").toUpperCase(), 34, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...light);

    doc.text(`${room.chorale || "-"} • ${room.type || "-"}`, 34, y + 11);
    doc.text(`Date : ${room.date || "-"}`, 34, y + 16);

    if (room.description) {
      doc.text(room.description, 14, y + 24);
    }

    doc.setDrawColor(...line);
    doc.line(14, y + 30, pageWidth - 14, y + 30);

    return y + 34;
  }

  // ===============================
  // 🔥 BUILD DATA
  // ===============================
  const mainList = await buildAttendanceList(data, room);
  const groups = getSecondaryGroups(data);
  const stats = computeStats(mainList, groups);

  // ===============================
  // PAGE 1
  // ===============================
  drawHeader();
  let startY = await drawInfo();

  autoTable(doc, {
    startY: startY + 2,
    head: [["#", "Username", "Nom", "Statut", "Heure", "Mode"]],
    body: mainList.map((d, i) => [
      i + 1,
      d.username,
      d.fullName,
      d.status,
      d.time,
      d.method
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [240, 240, 240] },
    alternateRowStyles: { fillColor: [250, 250, 250] }
  });

  let y = doc.lastAutoTable.finalY + 8;

  // ===============================
  // STATS
  // ===============================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("STATISTIQUES", 14, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  y += 5;

  [
    `Total membres : ${stats.totalMembers}`,
    `Présents : ${stats.presentCount}`,
    `Absents : ${stats.absentCount}`,
    `Justifiés : ${stats.justifiedCount}`,
    `Suspendus : ${stats.suspendedCount}`,
    `Spéciaux : ${stats.specialCount}`,
    `Déplacements : ${stats.displacementCount}`,
    `Taux de présence : ${stats.rate}%`
  ].forEach((t, i) => doc.text(t, 14, y + i * 5));

  // ===============================
  // PAGE 2
  // ===============================
  doc.addPage();
  drawHeader();

  let posY = 40;

  function drawSection(title, list) {

    if (!list.length) return;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title, 14, posY);

    autoTable(doc, {
      startY: posY + 2,
      head: [["#", "Username", "Nom", "Statut", "Heure", "Mode"]],
      body: list.map((d, i) => [
        i + 1,
        d.username,
        d.fullName,
        "P",
        getTime(d),
        getMethod(d)
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [240, 240, 240] }
    });

    posY = doc.lastAutoTable.finalY + 8;
  }

  drawSection("INSTRUMENTISTES", groups.IN);
  drawSection("VISITEURS", groups.GT);
  drawSection("ADMINISTRATION", groups.AD);

  // ===============================
  // FOOTER
  // ===============================
const pages = doc.internal.getNumberOfPages();

// 🔥 Infos export (horodatage + user)
const now = new Date();

const formattedDate = now.toLocaleDateString("fr-FR");
const formattedTime = now.toLocaleTimeString("fr-FR", {
  hour: "2-digit",
  minute: "2-digit"
});

// ⚠️ adapte selon ton système utilisateur
const exportedBy = room.createdByName || "Utilisateur";

// ===============================
for (let i = 1; i <= pages; i++) {
  doc.setPage(i);

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);

  // ===============================
  // 📄 Pagination (toutes les pages)
  // ===============================
  doc.text(
    `Page ${i}/${pages}`,
    pageWidth - 14,
    pageHeight - 10,
    { align: "right" }
  );

  // ===============================
  // 🕒 Horodatage export (toutes pages)
  // ===============================
  doc.text(
    `Exporté le ${formattedDate} à ${formattedTime}`,
    14,
    pageHeight - 10
  );

  // ===============================
  // ✍️ Signature uniquement dernière page
  // ===============================
  if (i === pages) {

    doc.setDrawColor(210, 210, 210);
    doc.line(14, pageHeight - 28, 80, pageHeight - 28);

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);

    doc.text("Signature du responsable", 14, pageHeight - 23);

    // 👤 Nom responsable
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);

    doc.text(exportedBy.toUpperCase(), 14, pageHeight - 17);
  }
}

doc.save("presence-myum.pdf");
