// users/js/profile.js

import { db } from "../../mains.js/firebase-config.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ===============================
// INIT PROFILE
// ===============================

document.addEventListener("DOMContentLoaded", async () => {

  const storedUser = localStorage.getItem("myum_user");
  if (!storedUser) {
    window.location.href = "../users/login.html";
    return;
  }

  const sessionUser = JSON.parse(storedUser);

  await loadUserProfile(sessionUser.id);
  initTabs();
  initLogout();

});

// ===============================
// LOAD USER PROFILE
// ===============================

async function loadUserProfile(userId) {

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const user = userSnap.data();

  // Full name
  document.getElementById("fullName").innerText =
    `${user.firstName} ${user.lastName}`;

  // Username
  document.getElementById("username").innerText =
    `@${user.username}`;

  // Chorale badge
  document.getElementById("choraleBadge").innerText =
    user.chorale;

  // Role badge
  const roleBadge = document.getElementById("roleBadge");

  roleBadge.innerText = user.role;

  if (user.role === "super_admin") {
    roleBadge.className =
      "px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-700 font-medium";
  } else if (user.role === "admin") {
    roleBadge.className =
      "px-3 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium";
  } else {
    roleBadge.className =
      "px-3 py-1 text-xs rounded-full bg-gray-200 text-gray-700 font-medium";
  }

  // Profile photo
  const profilePhoto = document.getElementById("profilePhoto");

  if (user.photoURL) {
    profilePhoto.src = user.photoURL;
  } else {
    profilePhoto.src =
      "https://ui-avatars.com/api/?name=" +
      user.firstName +
      "+" +
      user.lastName +
      "&background=1A3668&color=fff";
  }

  // Friends count
  document.getElementById("friendsCount").innerText =
    user.friendsCount || 0;

  // Load friends data
  await loadFriends(userId);
  await loadFriendRequests(userId);

}

// ===============================
// LOAD FRIENDS
// ===============================

async function loadFriends(userId) {

  const friendsList = document.getElementById("friendsList");
  friendsList.innerHTML = "";

  const friendsRef = collection(db, "users", userId, "friends");
  const snapshot = await getDocs(friendsRef);

  for (const docSnap of snapshot.docs) {

    const friendId = docSnap.id;
    const friendDoc = await getDoc(doc(db, "users", friendId));

    if (!friendDoc.exists()) continue;

    const friend = friendDoc.data();

    friendsList.innerHTML += createFriendItem({
      id: friendId,
      ...friend
    });

  }

}

// ===============================
// LOAD FRIEND REQUESTS
// ===============================

async function loadFriendRequests(userId) {

  const requestsList = document.getElementById("requestsList");
  requestsList.innerHTML = "";

  const q = query(
    collection(db, "friendRequests"),
    where("toUserId", "==", userId),
    where("status", "==", "pending")
  );

  const snapshot = await getDocs(q);

  for (const request of snapshot.docs) {

    const data = request.data();
    const senderDoc = await getDoc(doc(db, "users", data.fromUserId));

    if (!senderDoc.exists()) continue;

    const sender = senderDoc.data();

    requestsList.innerHTML += createRequestItem({
      requestId: request.id,
      id: data.fromUserId,
      ...sender
    });

  }

}

// ===============================
// UI TABS
// ===============================

function initTabs() {

  const tabs = document.querySelectorAll(".tab-btn");

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {

      document.querySelectorAll("#friendsTab, #requestsTab, #discoverTab")
        .forEach(tab => tab.classList.add("hidden"));

      tabs.forEach(t => t.classList.remove("bg-white", "shadow-sm"));

      btn.classList.add("bg-white", "shadow-sm");

      document.getElementById(btn.dataset.tab)
        .classList.remove("hidden");

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
    window.location.href = "../users/login.html";
  });

}

// ===============================
// TEMPLATES
// ===============================

function createFriendItem(user) {
  return `
    <div class="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition">

      <div class="flex items-center gap-3">
        <img src="${user.photoURL || ''}"
             class="w-12 h-12 rounded-full object-cover bg-gray-200">

        <div>
          <p class="text-sm font-medium">${user.firstName} ${user.lastName}</p>
          <p class="text-xs text-gray-500">${user.fonction || ''} • ${user.chorale}</p>
        </div>
      </div>

      <button data-id="${user.id}"
              class="text-xs text-danger font-medium hover:underline">
        Supprimer
      </button>

    </div>
  `;
}

function createRequestItem(user) {
  return `
    <div class="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition">

      <div class="flex items-center gap-3">
        <img src="${user.photoURL || ''}"
             class="w-12 h-12 rounded-full object-cover bg-gray-200">

        <div>
          <p class="text-sm font-medium">${user.firstName} ${user.lastName}</p>
          <p class="text-xs text-gray-500">${user.fonction || ''}</p>
        </div>
      </div>

      <div class="flex gap-2">
        <button class="px-3 py-1 text-xs bg-primary text-white rounded-lg">
          Accepter
        </button>
        <button class="px-3 py-1 text-xs bg-gray-200 rounded-lg">
          Refuser
        </button>
      </div>

    </div>
  `;
}
