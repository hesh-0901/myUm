import { db } from "../../mains.js/firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentUser = null;

// ==========================
// INIT
// ==========================
async function init() {
  loadUser();
  await loadHeader();
  initEvents();
  loadPosts();
}

// ==========================
// USER SESSION (comme profil)
// ==========================
function loadUser() {
  const storedUser = localStorage.getItem("myum_user");

  if (!storedUser) {
    window.location.href = "/myUm/users/login.html";
    return;
  }

  currentUser = JSON.parse(storedUser);

  const photo = document.getElementById("userPhoto");

  photo.src = currentUser.photoURL
    ? currentUser.photoURL
    : `https://ui-avatars.com/api/?name=${currentUser.firstName}+${currentUser.lastName}&background=1A3668&color=fff`;
}

// ==========================
// HEADER BACK (V4 compliant)
// ==========================
async function loadHeader() {
  const headerHTML = await fetch("/myUm/partials/header-back.html").then(r => r.text());
  document.getElementById("header-container").innerHTML = headerHTML;

  await import("/myUm/partials/js/back-header.js");

  document.querySelector("header").setAttribute("data-title", "Posts");
}

// ==========================
// CREATE POST
// ==========================
async function createPost() {
  const input = document.getElementById("postInput");
  const content = input.value.trim();

  if (!content) return;

  try {
    await addDoc(collection(db, "posts"), {
      content,
      userId: currentUser.id,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      photoURL: currentUser.photoURL || "",
      createdAt: serverTimestamp()
    });

    input.value = "";
    loadPosts();

  } catch (error) {
    console.error("Erreur post:", error);
  }
}

// ==========================
// RENDER POST (UI propre)
// ==========================
function renderPost(post) {
  const div = document.createElement("div");

  div.className = "bg-white rounded-2xl p-4 shadow-sm";

  div.innerHTML = `
    <div class="flex items-center space-x-3 mb-2">
      <img src="${post.photoURL || `https://ui-avatars.com/api/?name=${post.firstName}+${post.lastName}&background=1A3668&color=fff`}" 
           class="w-10 h-10 rounded-full object-cover" />

      <div>
        <p class="text-sm font-semibold">
          ${post.firstName} ${post.lastName}
        </p>
      </div>
    </div>

    <p class="text-sm text-gray-800">
      ${post.content}
    </p>
  `;

  return div;
}

// ==========================
// LOAD POSTS
// ==========================
async function loadPosts() {
  const container = document.getElementById("postsList");
  container.innerHTML = "";

  try {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    snap.forEach(doc => {
      container.appendChild(renderPost(doc.data()));
    });

  } catch (error) {
    console.error("Erreur chargement:", error);
  }
}

// ==========================
// EVENTS
// ==========================
function initEvents() {
  document
    .getElementById("sendPostBtn")
    .addEventListener("click", createPost);
}

init();
