// partials/js/header.js

import { db } from "../../mains.js/firebase-config.js";
import { collection, query, where, getDocs }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function initHeader() {

  const storedUser = localStorage.getItem("myum_user");

  // 🔒 Sécurité globale
  if (!storedUser) {
    window.location.href = "../users/login.html";
    return;
  }

  const user = JSON.parse(storedUser);

  // Affichage nom
  const userNameEl = document.getElementById("userName");
  if (userNameEl) {
    userNameEl.innerText = user.firstName + " " + user.lastName;
  }

  // Avatar photo ou initiales
  const profileBtn = document.getElementById("profileBtn");

  if (user.photoURL) {
    profileBtn.innerHTML =
      `<img src="${user.photoURL}" class="w-full h-full object-cover">`;
  } else {
    profileBtn.classList.add(
      "bg-gradient-to-br", "from-primary", "to-medium",
      "text-white", "flex", "items-center", "justify-center",
      "font-semibold"
    );
    profileBtn.innerText =
      user.firstName.charAt(0) + user.lastName.charAt(0);
  }

  // Notifications Firestore
  const notifQuery = query(
    collection(db, "notifications"),
    where("userId", "==", user.id),
    where("read", "==", false)
  );

  const snapshot = await getDocs(notifQuery);

  const badge = document.getElementById("notificationBadge");

  if (!snapshot.empty) {
    badge.innerText = snapshot.size;
    badge.classList.remove("hidden");
  }

  // Dropdown
  profileBtn.addEventListener("click", () => {
    document.getElementById("profileDropdown")
      .classList.toggle("hidden");
  });

  // Logout
  document.getElementById("logoutBtn")
    .addEventListener("click", () => {
      localStorage.removeItem("myum_user");
      window.location.href = "../users/login.html";
    });

}
