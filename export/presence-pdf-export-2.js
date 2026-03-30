import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";
import autoTableModule from "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/+esm";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { db } from "/myUm/mains.js/firebase-config.js";

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
// 🔥 GET ALL MEMBERS
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
export async function exportAdvancedPDF(data = [], room = {}) {

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  const dark = [31, 41, 55];
  const light = [107, 114, 128];
  const line = [229, 231, 235];

  // ===============================
  // HEADER
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
  // ROOM BLOCK
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
      (room.createdByName || "").toUpperCase(),
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
    doc.text(`Date : ${room.date || "-"}`, 14 + avatarSize + 4, y + 16);

    doc.setDrawColor(...line);
    doc.line(14, y + 30, pageWidth - 14, y + 30);

    return y + 35;
  }

function getStatus(attendance) {
  if (!attendance) return "A";

  if (attendance.status === "justified") return "J";
  if (attendance.status === "suspended") return "S";
  if (attendance.status === "special") return "Sp";
  if (attendance.status === "displacement") return "D";

  return "P";
}

function getTime(attendance) {
  if (!attendance?.timestamp) return "";

  const d = attendance.timestamp.toDate();

  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getMethod(attendance) {
  if (!attendance) return "";

  return attendance.method === "manual" ? "Manuel" : "Radar";
}  
  // ===============================
  // 🔥 BUILD CHORALE FULL LIST
  // ===============================
  const allMembers = await getAllMembers();

let mainRows = [];

if (room.chorale === "UM") {

  // 🔥 MODE UM → tout le monde
  mainRows = allMembers.map((m, i) => {

    const attendance = data.find(d => d.username === m.username);

    return [
      i + 1,
      m.username,
      m.fullName,
      attendance ? "Présent" : "Absent"
    ];
  });

} else {

  // 🔥 CHORALE PRINCIPALE (TOUS)
  const mainChorale = allMembers.filter(
    m => m.chorale === room.chorale
  );

  // 🔥 AUTRES CHORALES UM (présents seulement)
  const otherChoralesPresent = data.filter(d =>
    ["VN", "PC", "WS"].includes(d.chorale) &&
    d.chorale !== room.chorale
  );

  // 🔥 FUSION
  const combined = [
    ...mainChorale.map(m => ({
      ...m,
      present: data.some(d => d.username === m.username)
    })),

    ...otherChoralesPresent.map(d => ({
      username: d.username,
      fullName: d.fullName,
      present: true
    }))
  ];

  mainRows = combined.map((m, i) => {

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
  
}

  // ===============================
  // OTHER GROUPS (present only)
  // ===============================
  function filterGroup(code) {
    return data.filter(d => d.chorale === code);
  }

  // ===============================
  // PAGE 1
  // ===============================
  drawHeader();
  let startY = await drawRoomBlock();

  doc.setFontSize(11);
  doc.text(`CHORALE : ${room.chorale}`, 14, startY);

  autoTable(doc, {
    startY: startY + 4,
    head: [["#", "Username", "Nom", "Statut", "Heure", "Mode"]],
    body: mainRows,
    styles: { fontSize: 8 }
  });

  // ===============================
  // PAGE 2
  // ===============================
  doc.addPage();
  drawHeader();

  let y = 45;

  function drawSection(title, list) {

const rows = list.map((d, i) => {

  const time = d.timestamp?.toDate()?.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  }) || "";

  const method = d.method === "manual" ? "Manuel" : "Radar";

  return [
    i + 1,
    d.username,
    d.fullName,
    "P",
    time,
    method
  ];
});

    doc.text(title, 14, y);

    autoTable(doc, {
      startY: y + 2,
      head: [["#", "Username", "Nom", "Statut", "Heure", "Mode"]],
      body: rows,
      styles: { fontSize: 8 }
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  drawSection("INSTRUMENTISTES (IN)", filterGroup("IN"));
  drawSection("VISITEURS (GT)", filterGroup("GT"));
  drawSection("ADMINISTRATION (AD)", filterGroup("AD"));

  doc.save("presence-myum-advanced.pdf");
}
