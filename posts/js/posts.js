// ======================================
// IMPORTS
// ======================================

import { db } from "../../mains.js/firebase-config.js";
import {
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ======================================
// INIT
// ======================================

document.addEventListener("DOMContentLoaded", () => {

  setTimeout(async () => {

    await initCreatePost();
    initPublishPost();
    await loadPosts();

  }, 0);

});

// ======================================
// LOAD POSTS
// ======================================

async function loadPosts() {
const container = document.getElementById("posts-list");

if (!container) {
  console.error("posts-list introuvable");
  return;
}

  container.innerHTML = `
    <div class="text-center text-sm text-gray-400">
      Chargement...
    </div>
  `;

  try {

    const snapshot = await getDocs(collection(db, "posts"));

    console.log("POSTS:", snapshot.docs.map(d => d.data()));

    if (snapshot.empty) {
      container.innerHTML = `
        <div class="text-center text-sm text-gray-400">
          Aucun post pour le moment
        </div>
      `;
      return;
    }

    container.innerHTML = "";

    snapshot.forEach(docSnap => {

      const post = docSnap.data();

      const postEl = createPostElement(post);

      container.appendChild(postEl);

    });

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

  if (!timestamp || !timestamp.toDate) return "";

  const date = timestamp.toDate();

  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return "à l’instant";
  if (diff < 3600) return Math.floor(diff / 60) + " min";
  if (diff < 86400) return Math.floor(diff / 3600) + " h";

  return date.toLocaleDateString();
}

async function initCreatePost() {

  const storedUser = localStorage.getItem("myum_user");

  if (!storedUser) return;

  const user = JSON.parse(storedUser);

  const avatar = document.getElementById("userAvatar");

  if (!avatar) return;

  avatar.src = user.photoURL || getDefaultAvatar(user.username);

}

function initPublishPost() {

  const btn = document.getElementById("publishBtn");
  const input = document.getElementById("postInput");

  if (!btn || !input) return;

  btn.addEventListener("click", async () => {

    const content = input.value.trim();

    if (!content) return;

    const storedUser = JSON.parse(localStorage.getItem("myum_user"));

    try {

      await addDoc(collection(db, "posts"), {
        userId: storedUser.id,
        userName: storedUser.username,
        userPhoto: storedUser.photoURL || "",
        content,
        likes: 0,
        createdAt: serverTimestamp()
      });

      input.value = "";

      await loadPosts(); // refresh

    } catch (error) {

      console.error("Erreur création post :", error);

    }

  });

}

function getDefaultAvatar(name = "") {

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1A3668&color=fff`;
}
