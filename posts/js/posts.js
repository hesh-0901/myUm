import { db } from "../../mains.js/firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// USER
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
// LOAD USER (comme profil)
// ==========================
function loadUser() {
  const storedUser = localStorage.getItem("myum_user");

  if (!storedUser) {
    window.location.href = "/myUm/users/login.html";
    return;
  }

  currentUser = JSON.parse(storedUser);

  // Photo
  const photo = document.getElementById("userPhoto");

  if (currentUser.photoURL) {
    photo.src = currentUser.photoURL;
  } else {
    photo.src =
      "https://ui-avatars.com/api/?name=" +
      currentUser.firstName +
      "+" +
      currentUser.lastName +
      "&background=1A3668&color=fff";
  }
}

// ==========================
// HEADER BACK
// ==========================
async function loadHeader() {
  const header = await fetch("/myUm/partials/header-back.html").then(r => r.text());
  document.getElementById("header-container").innerHTML = header;

  await import("/myUm/partials/js/back-header.js");

  document.querySelector("header").setAttribute("data-title", "Posts");
}

// ==========================
// CREATE POST
// ==========================
async function createPost() {
  const input = document.getElementById("postInput");
  const text = input.value.trim();

  if (!text) return;

  try {
    await addDoc(collection(db, "posts"), {
      content: text,
      userId: currentUser.id,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      photoURL: currentUser.photoURL || "",
      createdAt: serverTimestamp()
    });

    input.value = "";
    loadPosts();

  } catch (err) {
    console.error(err);
  }
}

// ==========================
// LOAD POSTS (STYLE FB)
// ==========================
async function loadPosts() {
  const container = document.getElementById("postsList");
  container.innerHTML = "";

  try {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    snap.forEach(doc => {
      const post = doc.data();

      const div = document.createElement("div");
      div.className = "p-4";

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

      container.appendChild(div);
    });

  } catch (err) {
    console.error("Erreur posts:", err);
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
