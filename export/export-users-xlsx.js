// ===============================
// EXPORT USERS XLSX - MYUM PRO MAX FINAL
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

    generateXLSX(users);

  } catch (error) {

    console.error("Erreur export XLSX :", error);

  }

}

// ===============================
function formatUser(user, id) {

  const eglise = splitDate(
    user.dateAdhesionEglise,
    user.anneeAdhesionEglise
  );

  const departement = splitDate(
    user.dateAdhesionDepartement,
    user.anneeAdhesionDepartement
  );

return {

  "User ID": id,

  "Nom complet": `${user.firstName || ""} ${user.lastName || ""}`,
  "Username": user.username || "",

  "Genre": user.genre || "",
  "Commune": user.commune || "",

  "Type membre": user.typeMembre || "",

  // 🔥 ÉGLISE
  "Année adhésion église": eglise.year,
  "Date adhésion église": eglise.date,

  // 🔥 DÉPARTEMENT
  "Année adhésion département": departement.year,
  "Date adhésion département": departement.date,

  "Statut affermissement": user.statutAffermissement || "",
  "Responsable ministère": user.responsableMinistere || "",
  "Groupe musique": user.groupeMusique || "",

  // ===============================
  // 🔥 NOUVEAUX CHAMPS INFORMATIONS
  // ===============================
  "Bio": user.bio || "",
  "Téléphone": user.phone || "",
  "Date de naissance": formatBirthday(user.birthday),
  "Âge": user.age || "",
  "Fonction": user.fonction || ""

};
  
}

// ===============================
// 🔥 SPLIT INTELLIGENT
// ===============================
function splitDate(dateValue, yearValue) {

  // 🔥 PRIORITÉ À LA DATE (nouveaux membres)
  if (dateValue) {

    const d = new Date(dateValue);

    if (!isNaN(d)) {
      return {
        year: "",
        date: d.toLocaleDateString("fr-FR")
      };
    }

  }

  // 🔥 SINON ANNÉE (anciens membres)
  if (yearValue) {

    return {
      year: yearValue,
      date: ""
    };

  }

  return { year: "", date: "" };

}

// ===============================
function generateXLSX(data) {

  if (!data.length) {
    alert("Aucune donnée à exporter");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(data);

  // filtre Excel
  ws["!autofilter"] = { ref: "A1:Z1" };

  // largeur propre
  ws["!cols"] = Object.keys(data[0]).map(key => ({
    wch: Math.max(key.length + 2, 20)
  }));

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Users");

  XLSX.writeFile(wb, "myum_users.xlsx");

}
