// chat/js/chat-list.js
import { db } from "../../mains.js/firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* =========================
   SESSION
========================= */
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("myum_user"));
  } catch {
    return null;
  }
}

const me = getCurrentUser();
const myId = me?.id;

if (!myId) {
  alert("Session invalide. Veuillez vous reconnecter.");
  window.location.href = "../users/login.html";
}

/* =========================
   DOM
========================= */
const backBtn = document.getElementById("backBtn");
const dashBtn = document.getElementById("dashBtn");
const refreshBtn = document.getElementById("refreshBtn");
const filterInput = document.getElementById("filterInput");

const chatList = document.getElementById("chatList");
const emptyState = document.getElementById("emptyState");

backBtn.addEventListener("click", () => (window.location.href = "index.html"));
dashBtn.addEventListener("click", () => window.goTo("public/dashboard.html"));
refreshBtn.addEventListener("click", () => loadChats());

let cachedChats = []; // for local filter

await loadChats();

filterInput.addEventListener("input", () => {
  const v = (filterInput.value || "").trim().toLowerCase();
  renderChats(v ? cachedChats.filter(c => (c.display || "").toLowerCase().includes(v)) : cachedChats);
});

/* =========================
   LOAD CHATS
========================= */
async function loadChats() {
  chatList.innerHTML = "";
  emptyState.classList.add("hidden");
  cachedChats = [];

  try {
    // Fetch chats where participants includes me
    // IMPORTANT: requires participants array on chats doc
    const chatsRef = collection(db, "chats");

    const q = query(
      chatsRef,
      where("participants", "array-contains", myId),
      orderBy("updatedAt", "desc"),
      limit(50)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      emptyState.classList.remove("hidden");
      return;
    }

    // Build items
    const items = await Promise.all(snap.docs.map(async (d) => {
      const c = d.data();
      const participants = c.participants || [];

      // get other uid
      const otherId = participants.find(p => p !== myId) || null;

      // fallback display
       let display = otherId || "Discussion";
      let u = null;

      if (otherId) {
        const otherSnap = await getDoc(doc(db, "users", otherId)).catch(() => null);
        if (otherSnap && otherSnap.exists()) {
          u = otherSnap.data();
          display =
            (`${u.firstName || ""} ${u.lastName || ""}`).trim() ||
            u.username ||
            otherId;
        }
      }

      return {
        id: d.id,
        otherId,
        display,
        photoURL: u?.photoURL || null,
        firstName: u?.firstName || "",
        lastName: u?.lastName || "",
        lastMessage: c.lastMessage || "",
        updatedAt: c.updatedAt || null
      };
    }));

    cachedChats = items;
    renderChats(items);

  } catch (e) {
    console.error("Erreur load chats:", e);
    chatList.innerHTML = `<div class="text-sm text-red-500">Erreur lors du chargement des conversations.</div>`;
  }
}

/* =========================
   RENDER
========================= */
function renderChats(items) {
  chatList.innerHTML = "";

  if (!items || items.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  items.forEach((c) => {
    const row = document.createElement("div");
    row.className =
      "p-3 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-3 shadow-sm";

        row.innerHTML = `
          <div class="flex items-center gap-3 min-w-0">
        
            <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-xs font-semibold">
        
              ${
                c.photoURL
                ? `<img src="${c.photoURL}" class="w-full h-full object-cover">`
                : `${(c.firstName?.charAt(0) || "")}${(c.lastName?.charAt(0) || "")}`
              }
        
            </div>
        
            <div class="min-w-0">
              <div class="font-semibold text-sm truncate">${escapeHtml(c.display)}</div>
              <div class="text-xs text-gray-500 truncate">${escapeHtml(c.lastMessage || "—")}</div>
            </div>
        
          </div>
        
          <button class="openBtn px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold active:scale-95 transition">
            Ouvrir
          </button>
        `;

    row.querySelector(".openBtn").addEventListener("click", () => {
      // open room with friend id
      if (!c.otherId) return;
      window.location.href = `room.html?uid=${encodeURIComponent(c.otherId)}`;
    });

    chatList.appendChild(row);
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}
