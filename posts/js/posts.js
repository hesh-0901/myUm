import { db } from "../../mains.js/firebase-config.js";
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// PARTIALS
async function loadPartials() {
  // Header back
  const header = await fetch("/myUm/partials/header-back.html").then(r => r.text());
  document.getElementById("header-container").innerHTML = header;

  await import("/myUm/partials/js/back-header.js");

  // Set title dynamically (IMPORTANT V4)
  document.querySelector("header").setAttribute("data-title", "Posts");

  // Nav
  const nav = await fetch("/myUm/partials/nav.html").then(r => r.text());
  document.getElementById("nav-container").innerHTML = nav;

  await import("/myUm/partials/js/nav.js");
}

// CREATE POST
async function createPost() {
  const input = document.getElementById("postInput");
  const text = input.value.trim();

  if (!text) return;

  try {
    await addDoc(collection(db, "posts"), {
      content: text,
      createdAt: serverTimestamp()
    });

    input.value = "";
    loadPosts();

  } catch (err) {
    console.error("Erreur création post:", err);
  }
}

// LOAD POSTS
async function loadPosts() {
  const container = document.getElementById("postsList");
  container.innerHTML = "";

  try {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    snap.forEach(doc => {
      const post = doc.data();

      const div = document.createElement("div");
      div.className = "bg-white rounded-xl p-3 shadow-sm text-sm";

      div.innerHTML = `
        <p>${post.content || ""}</p>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error("Erreur chargement posts:", err);
  }
}

// EVENTS
function initEvents() {
  document.getElementById("sendPostBtn").addEventListener("click", createPost);
}

// INIT PAGE
async function init() {
  await loadPartials();
  initEvents();
  loadPosts();
}

init();
