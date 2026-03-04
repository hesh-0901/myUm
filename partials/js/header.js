// ======================================
// HEADER MODULE
// ======================================

import { db } from "../../mains.js/firebase-config.js";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ======================================
// INIT HEADER
// ======================================

export async function initHeader() {

  const storedUser = localStorage.getItem("myum_user");

  // 🔒 Sécurité session
  if (!storedUser) {
    window.location.href = "../users/login.html";
    return;
  }

  let user = JSON.parse(storedUser);


  // ======================================
  // RÉCUPÉRER LES DONNÉES FIRESTORE
  // (important pour photoURL)
  // ======================================

  try {

    const userRef = doc(db, "users", user.id);
    const snap = await getDoc(userRef);

    if (snap.exists()) {

      const freshUser = snap.data();

      // Mise à jour localStorage
      user = {
        ...user,
        ...freshUser
      };

      localStorage.setItem("myum_user", JSON.stringify(user));

    }

  } catch (error) {

    console.error("Erreur récupération utilisateur :", error);

  }


  // ======================================
  // NOM UTILISATEUR
  // ======================================

  const userNameEl = document.getElementById("userName");

  if (userNameEl) {

    userNameEl.innerText =
      user.firstName + " " + user.lastName;

  }


  // ======================================
  // AVATAR PHOTO OU INITIALES
  // ======================================

  const profileBtn = document.getElementById("profileBtn");

  if (profileBtn) {

    if (user.photoURL) {

      profileBtn.innerHTML =
        `<img src="${user.photoURL}" 
        class="w-full h-full object-cover rounded-full">`;

    } else {

      profileBtn.classList.add(
        "bg-gradient-to-br",
        "from-primary",
        "to-medium",
        "text-white",
        "flex",
        "items-center",
        "justify-center",
        "font-semibold"
      );

      profileBtn.innerText =
        user.firstName.charAt(0) +
        user.lastName.charAt(0);

    }

  }


  // ======================================
  // NOTIFICATIONS FIRESTORE
  // ======================================

  try {

    const notifQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.id),
      where("read", "==", false)
    );

    const snapshot = await getDocs(notifQuery);

    const badge = document.getElementById("notificationBadge");

    if (badge && !snapshot.empty) {

      badge.innerText = snapshot.size;

      badge.classList.remove("hidden");

    }

  } catch (error) {

    console.error("Erreur notifications :", error);

  }


  // ======================================
  // DROPDOWN PROFIL
  // ======================================

  if (profileBtn) {

    profileBtn.addEventListener("click", () => {

      const dropdown = document.getElementById("profileDropdown");

      if (dropdown) {

        dropdown.classList.toggle("hidden");

      }

    });

  }


  // ======================================
  // LOGOUT
  // ======================================

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {

      localStorage.removeItem("myum_user");

      window.location.href = "../users/login.html";

    });

  }

}
