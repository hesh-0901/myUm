// users/js/profile.js

import { db } from "../../mains.js/firebase-config.js";
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentUserId = null;
let currentUserData = null;

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", async () => {

  const storedUser = localStorage.getItem("myum_user");

  if (!storedUser) {
    window.location.href = "/myUm/users/login.html";
    return;
  }

  const sessionUser = JSON.parse(storedUser);
  currentUserId = sessionUser.id;

  await loadUserProfile();
  initEditButtons();
  initLogout();

});

// ===============================
// LOAD USER DATA
// ===============================
async function loadUserProfile() {

  const userRef = doc(db, "users", currentUserId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return;

  currentUserData = snap.data();

  // Header
// ===============================
// HEADER PROFIL
// ===============================

// Nom complet
document.getElementById("fullName").innerText =
  `${currentUserData.firstName} ${currentUserData.lastName}`;

// Fonction (poste)
const functionEl = document.getElementById("userFunction");
if (functionEl) {
  functionEl.innerText = currentUserData.fonction || "";
}

// Username
document.getElementById("username").innerText =
  `@${currentUserData.username}`;

// Chorale badge
const choraleBadge = document.getElementById("choraleBadge");
choraleBadge.innerText = currentUserData.chorale || "";
choraleBadge.className =
  "px-3 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium";

// Role badge
const roleBadge = document.getElementById("roleBadge");
roleBadge.innerText = currentUserData.role || "";

// 🎨 Style dynamique du rôle
switch (currentUserData.role) {

  case "super_admin":
    roleBadge.className =
      "px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-700 font-semibold";
    break;

  case "admin":
    roleBadge.className =
      "px-3 py-1 text-xs rounded-full bg-primary/10 text-primary font-semibold";
    break;

  default:
    roleBadge.className =
      "px-3 py-1 text-xs rounded-full bg-gray-200 text-gray-700 font-medium";
}

  // Photo
  const profilePhoto = document.getElementById("profilePhoto");

  if (currentUserData.photoURL) {
    profilePhoto.src = currentUserData.photoURL;
  } else {
    profilePhoto.src =
      "https://ui-avatars.com/api/?name=" +
      currentUserData.firstName +
      "+" +
      currentUserData.lastName +
      "&background=1A3668&color=fff";
  }

  // Informations module
  setField("bio", currentUserData.bio);
  setField("phone", currentUserData.phone);
  setField("birthday", currentUserData.birthday);
  setField("age", currentUserData.age);
  setField("fonction", currentUserData.fonction);

}

// ===============================
// SET FIELD
// ===============================
function setField(field, value) {
  const el = document.getElementById("info-" + field);
  if (!el) return;
  el.innerText = value || "—";
}

// ===============================
// EDIT BUTTONS
// ===============================
function initEditButtons() {

  document.querySelectorAll(".edit-btn").forEach(btn => {

    btn.addEventListener("click", async () => {

      const field = btn.dataset.field;
      const valueElement = document.getElementById("info-" + field);

      const currentValue = valueElement.innerText === "—"
        ? ""
        : valueElement.innerText;

      // Si déjà en mode input → sauvegarder
      if (valueElement.tagName === "INPUT" || valueElement.tagName === "TEXTAREA") {
        return;
      }

      // Remplacer par input
      let input;

      if (field === "bio") {
        input = document.createElement("textarea");
        input.className =
          "w-full mt-1 p-2 text-sm border rounded-lg focus:outline-none focus:border-primary";
      } else {
        input = document.createElement("input");
        input.type = "text";
        input.className =
          "w-full mt-1 p-2 text-sm border rounded-lg focus:outline-none focus:border-primary";
      }

      input.value = currentValue;

      valueElement.replaceWith(input);
      input.id = "info-" + field;

      // Changer icône
      btn.innerHTML = '<i class="bi bi-check-lg text-primary"></i>';

      btn.onclick = async () => {

        const newValue = input.value.trim();

        await updateDoc(doc(db, "users", currentUserId), {
          [field]: newValue
        });

        currentUserData[field] = newValue;

        const newText = document.createElement("p");
        newText.id = "info-" + field;
        newText.className = "text-sm mt-1";
        newText.innerText = newValue || "—";

        input.replaceWith(newText);

        btn.innerHTML = '<i class="bi bi-pencil"></i>';
        initEditButtons(); // rebind

      };

    });

  });

}

// ===============================
// LOGOUT
// ===============================
function initLogout() {

  const logoutBtn = document.getElementById("logoutBtn");

  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("myum_user");
    window.location.href = "/myUm/users/login.html";
  });

}
