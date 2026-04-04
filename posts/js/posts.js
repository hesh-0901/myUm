// ======================================
// IMPORTS
// ======================================

import { db } from "../../mains.js/firebase-config.js";

import {
  collection,
  query,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ======================================
// INIT
// ======================================

document.addEventListener("DOMContentLoaded", async () => {
  await loadPosts();
});

// ======================================
// LOAD POSTS
// ======================================

async function loadPosts() {

  const container = document.getElementById("posts-container");

  container.innerHTML = `
    <div class="text-center text-sm text-gray-400">
      Chargement...
    </div>
  `;

  try {

    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      container.innerHTML = `
        <div class="text-center text-sm text-gray-400">
          Aucun post pour le moment
        </div>
      `;
      return;
    }

    container.innerHTML = "";

    for (const docSnap of snapshot.docs) {

      const post = docSnap.data();

      const postEl = createPostElement(post);

      container.appendChild(postEl);
    }

  } catch (error) {

    console.error("Erreur chargement posts :", error);

    container.innerHTML = `
      <div class="text-center text-sm text-red-500">
        Erreur de chargement
      </div>
    `;
  }

}

// ======================================
// CREATE POST UI (FLAT DESIGN)
// ======================================

function createPostElement(post) {

  const div = document.createElement("div");

  div.className = "pb-4 border-b border-gray-100";

  const time = formatDate(post.createdAt);

  div.innerHTML = `
    
    <!-- HEADER -->
    <div class="flex items-center gap-3">

      <img src="${post.userPhoto || getDefaultAvatar(post.userName)}"
      class="w-10 h-10 rounded-full object-cover">

      <div class="flex flex-col">

        <span class="text-sm font-semibold text-gray-800">
          ${post.userName || "Utilisateur"}
        </span>

        <span class="text-xs text-gray-400">
          ${time}
        </span>

      </div>

    </div>

    <!-- CONTENT -->
    <div class="mt-3 text-sm text-gray-800 leading-relaxed">
      ${post.content || ""}
    </div>

    <!-- IMAGE -->
    ${post.image ? `
      <div class="mt-3">
        <img src="${post.image}"
        class="w-full rounded-xl object-cover">
      </div>
    ` : ""}

    <!-- ACTIONS -->
    <div class="flex items-center gap-6 mt-3 text-gray-400 text-sm">

      <button class="flex items-center gap-1 active:scale-95 transition">
        <i class="bi bi-heart"></i>
        <span>${post.likes || 0}</span>
      </button>

      <button class="flex items-center gap-1 active:scale-95 transition">
        <i class="bi bi-chat"></i>
        <span>0</span>
      </button>

    </div>

  `;

  return div;
}

// ======================================
// HELPERS
// ======================================

function formatDate(timestamp) {

  if (!timestamp) return "";

  const date = timestamp.toDate();

  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return "à l’instant";
  if (diff < 3600) return Math.floor(diff / 60) + " min";
  if (diff < 86400) return Math.floor(diff / 3600) + " h";

  return date.toLocaleDateString();
}

function getDefaultAvatar(name = "") {

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1A3668&color=fff`;
}
