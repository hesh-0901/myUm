// =======================================
// ENREG.JS - MYUM PREMIUM ENGINE
// =======================================

import { db } from "/myUm/mains.js/firebase-config.js";
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentUserId = null;
let currentUserData = null;

document.addEventListener("DOMContentLoaded", initEnreg);

// ===============================
// INIT
// ===============================
async function initEnreg() {

  const storedUser = localStorage.getItem("myum_user");
  if (!storedUser) return;

  const sessionUser = JSON.parse(storedUser);
  currentUserId = sessionUser.id;

  await loadUserData();
  initEditableSystem();
}

// ===============================
// LOAD USER DATA
// ===============================
async function loadUserData() {

  const snap = await getDoc(doc(db, "users", currentUserId));
  if (!snap.exists()) return;

  currentUserData = snap.data();

  setText("fullName", currentUserData.firstName + " " + currentUserData.lastName);
  setText("username", "@" + currentUserData.username);
  setText("userFunction", currentUserData.fonction || "");

  document.getElementById("profilePhoto").src =
    currentUserData.photoURL || "https://via.placeholder.com/150";

  document.querySelectorAll(".field").forEach(field => {
    const key = field.dataset.field;
    const valueEl = field.querySelector(".value");
    let value = currentUserData[key];

    if (!value || (Array.isArray(value) && value.length === 0)) {

      valueEl.innerHTML = `
        <span class="flex items-center gap-2 text-warning">
          <i class="bi bi-exclamation-circle"></i>
          À compléter
        </span>
      `;

    } else {

      valueEl.innerText = Array.isArray(value)
        ? value.join(", ")
        : value;
    }
  });

  handleEtatCivilVisibility();
}

// ===============================
// RESTE DU CODE STRICTEMENT IDENTIQUE
// (AUCUNE modification logique)
// ===============================

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value || "";
}
