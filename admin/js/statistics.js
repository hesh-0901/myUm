// ===============================
// ADMIN DASHBOARD STATS
// ===============================

import { db } from "/myUm/mains.js/firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { initExportUsers } from "/myUm/export/js/export-users-xlsx.js";

document.addEventListener("DOMContentLoaded", initDashboard);

// ===============================
async function initDashboard() {

  await loadStats();

  initExportUsers();
  initSecretExport();

}

// ===============================
async function loadStats() {

  const snap = await getDocs(collection(db, "users"));

  let totalUsers = snap.size;
  let totalCompletion = 0;
  let completeUsers = 0;

  let hommes = 0;
  let femmes = 0;

  snap.forEach(docSnap => {

    const user = docSnap.data();

    const completion = calculateCompletion(user);
    totalCompletion += completion;

    if (completion === 100) completeUsers++;

    if (user.genre === "Homme") hommes++;
    if (user.genre === "Femme") femmes++;

  });

  const avg = totalUsers ? Math.round(totalCompletion / totalUsers) : 0;

  updateUI({
    totalUsers,
    completeUsers,
    avg,
    hommes,
    femmes
  });

}

// ===============================
function calculateCompletion(user) {

  const fields = [
    "genre","etatCivil","commune","vieSeculiere",
    "typeMembre","egliseProvenance","anneeBapteme","typeBapteme",
    "statutAffermissement","responsableMinistere",
    "registreVoix","groupeMusique"
  ];

  let filled = 0;

  fields.forEach(f => {
    const v = user[f];
    if (v && v !== "" && v !== "—") filled++;
  });

  return Math.round((filled / fields.length) * 100);

}

// ===============================
function updateUI(data) {

  setText("totalUsers", data.totalUsers);
  setText("completeUsers", data.completeUsers);

  const bar = document.getElementById("completionBar");
  const text = document.getElementById("completionText");

  if (bar) bar.style.width = data.avg + "%";
  if (text) text.innerText = data.avg + "%";

  setText("countHommes", data.hommes);
  setText("countFemmes", data.femmes);

}

// ===============================
function initSecretExport() {

  let taps = 0;

  document.addEventListener("click", (e) => {

    if (e.target.closest("h1")) {

      taps++;

      if (taps === 5) {
        document.getElementById("exportUsersBtn")?.click();
        taps = 0;
      }

      setTimeout(() => taps = 0, 2000);
    }

  });

}

// ===============================
function setText(id, value) {

  const el = document.getElementById(id);
  if (el) el.innerText = value;

}
