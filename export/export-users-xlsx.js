// ===============================
// EXPORT USERS XLSX - MYUM PRO MAX
// ===============================

import { db } from "/myUm/mains.js/firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ===============================
export function initExportUsers() {

  const btn = document.getElementById("exportUsersBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    await exportUsersToXLSX();
  });

}

// ===============================
async function exportUsersToXLSX() {

  try {

    const snap = await getDocs(collection(db, "users"));

    let users = [];

    snap.forEach(docSnap => {

      const data = docSnap.data();
      const id = docSnap.id;

      users.push(formatUser(data, id));

    });

    // 🔥 TRI PAR DATE ADHÉSION (plus récents en haut)
    users.sort((a, b) => {
      return parseDate(b["Date adhésion église"]) - parseDate(a["Date adhésion église"]);
    });

    generateXLSX(users);

  } catch (error) {

    console.error("Erreur export XLSX :", error);

  }

}

// ===============================
function formatUser(user, id) {

  return {

    // ===== SYSTEM =====
    "User ID": id,

    // ===== IDENTITÉ =====
    "Prénom": user.firstName || "",
    "Nom": user.lastName || "",
    "Nom complet": `${user.firstName || ""} ${user.lastName || ""}`,
    "Username": user.username || "",

    // ===== INFOS =====
    "Téléphone": user.phone || "",
    "Date de naissance": formatDate(user.birthday),
    "Fonction": user.fonction || "",

    // ===== PERSONNEL =====
    "Genre": user.genre || "",
    "État civil": user.etatCivil || "",
    "Statut relationnel": user.statutRelationnel || "",
    "Commune": user.commune || "",
    "Vie séculière": formatArray(user.vieSeculiere),

    // ===== EGLISE =====
    "Type membre": user.typeMembre || "",
    "Église provenance": user.egliseProvenance || "",

    // 🔥 DATES PROPRES
    "Date adhésion église": formatDate(user.dateAdhesionEglise),
    "Date adhésion département": formatDate(user.dateAdhesionDepartement),

    "Année baptême": user.anneeBapteme || "",
    "Type baptême": user.typeBapteme || "",
    "Statut affermissement": user.statutAffermissement || "",
    "Responsable ministère": user.responsableMinistere || "",

    // ===== ACTIVITÉS =====
    "Registre voix": user.registreVoix || "",
    "Groupe musique": user.groupeMusique || ""

  };

}

// ===============================
// HELPERS
// ===============================

function formatArray(value) {
  if (Array.isArray(value)) return value.join(", ");
  return value || "";
}

// 🔥 FORMAT DATE ROBUSTE
function formatDate(date) {

  if (!date) return "";

  // année seule
  if (typeof date === "string" && /^\d{4}$/.test(date)) {
    return date;
  }

  const d = new Date(date);

  if (isNaN(d)) return "";

  return d.toLocaleDateString("fr-FR");
}

// 🔥 PARSE POUR TRI
function parseDate(date) {

  if (!date) return 0;

  // année seule
  if (/^\d{4}$/.test(date)) {
    return new Date(date + "-01-01").getTime();
  }

  const parts = date.split("/");

  if (parts.length === 3) {
    return new Date(parts.reverse().join("-")).getTime();
  }

  return 0;

}

// ===============================
function generateXLSX(data) {

  if (!data.length) {
    alert("Aucune donnée à exporter");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(data);

  // 🔥 AUTO FILTER (Excel pro)
  ws["!autofilter"] = { ref: "A1:Z1" };

  // 🔥 LARGEUR COLONNES
  ws["!cols"] = Object.keys(data[0]).map(key => ({
    wch: Math.max(key.length + 2, 18)
  }));

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Users");

  XLSX.writeFile(wb, "myum_users.xlsx");

}
