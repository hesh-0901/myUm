// ===============================
// EXPORT USERS XLSX - MYUM
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
// EXPORT FUNCTION
// ===============================
async function exportUsersToXLSX() {

  try {

    const snap = await getDocs(collection(db, "users"));

    const users = [];

    snap.forEach(docSnap => {

      const data = docSnap.data();

      users.push(formatUserForExport(data));

    });

    generateXLSX(users);

  } catch (error) {

    console.error("Erreur export XLSX :", error);

  }

}

// ===============================
// FORMAT USER DATA
// ===============================
function formatUserForExport(user) {

  return {

    // ===== PROFIL =====
    "Nom complet": (user.firstName || "") + " " + (user.lastName || ""),
    "Username": user.username || "",
    "Fonction": user.fonction || "",

    // ===== INFOS =====
    "Bio": user.bio || "",
    "Téléphone": user.phone || "",
    "Date de naissance": user.birthday || "",
    "Âge": user.age || "",

    // ===== PERSONNEL =====
    "Genre": user.genre || "",
    "État civil": user.etatCivil || "",
    "Statut relationnel": user.statutRelationnel || "",
    "Commune": user.commune || "",
    "Vie séculière": formatArray(user.vieSeculiere),

    // ===== EGLISE =====
    "Type membre": user.typeMembre || "",
    "Église provenance": user.egliseProvenance || "",
    
    // 🔥 AJOUT ICI
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

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return value || "";

}

// ===============================
// FORMAT DATE
// ===============================
function formatDate(date) {

  if (!date) return "";

  const d = new Date(date);

  if (isNaN(d)) return "";

  return d.toLocaleDateString("fr-FR");

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

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

  XLSX.writeFile(workbook, "myum_users.xlsx");

}
