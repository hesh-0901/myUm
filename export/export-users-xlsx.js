// ===============================
// EXPORT USERS XLSX - MYUM (PRO)
// ===============================

import { db } from "/myUm/mains.js/firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ===============================
// INIT
// ===============================
export function initExportUsers() {

  const btn = document.getElementById("exportUsersBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    await exportUsersToXLSX();
  });

}

// ===============================
// EXPORT
// ===============================
async function exportUsersToXLSX() {

  try {

    const snap = await getDocs(collection(db, "users"));

    const users = [];

    snap.forEach(docSnap => {

      const data = docSnap.data();
      const id = docSnap.id;

      users.push(formatUserForExport(data, id));

    });

    generateXLSX(users);

  } catch (error) {

    console.error("Erreur export XLSX :", error);

  }

}

// ===============================
// FORMAT USER
// ===============================
function formatUserForExport(user, id) {

  return {

    // ===== SYSTEM =====
    "User ID": id,

    // ===== IDENTITÉ =====
    "Prénom": user.firstName || "",
    "Nom": user.lastName || "",
    "Nom complet": `${user.firstName || ""} ${user.lastName || ""}`,
    "Username": user.username || "",
    "Photo URL": user.photoURL || "",

    // ===== INFOS =====
    "Bio": user.bio || "",
    "Téléphone": user.phone || "",
    "Date de naissance": formatDate(user.birthday),
    "Âge": user.age || "",
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

    // 🔥 DATES IMPORTANTES
    "Date adhésion église": formatDate(user.dateAdhesionEglise),
    "Date adhésion département": formatDate(user.dateAdhesionDepartement),

    // 🔥 ANCIENNETÉ
    "Ancienneté église (jours)": calculateDays(user.dateAdhesionEglise),
    "Ancienneté département (jours)": calculateDays(user.dateAdhesionDepartement),

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

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return value || "";

}

function formatDate(date) {

  if (!date) return "";

  const d = new Date(date);

  if (isNaN(d)) return "";

  return d.toLocaleDateString("fr-FR");

}

function calculateDays(date) {

  if (!date) return "";

  const d = new Date(date);

  if (isNaN(d)) return "";

  const diff = Date.now() - d.getTime();

  return Math.floor(diff / (1000 * 60 * 60 * 24));

}

// ===============================
// GENERATE XLSX
// ===============================
function generateXLSX(data) {

  if (!data.length) {
    alert("Aucune donnée à exporter");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);

  // 🔥 Auto width columns (pro)
  const cols = Object.keys(data[0]).map(key => ({
    wch: Math.max(key.length, 15)
  }));

  worksheet["!cols"] = cols;

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

  XLSX.writeFile(workbook, "myum_users.xlsx");

}
