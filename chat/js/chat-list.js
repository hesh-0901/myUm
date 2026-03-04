// chat/js/chat-list.js

import { db } from "../../mains.js/firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
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
const dashBtn = document.getElementById("dashBtn");      // 🔁 maintenant = retour vers page chat
const refreshBtn = document.getElementById("refreshBtn"); // optionnel, on le garde
const filterInput = document.getElementById("filterInput");

const chatList = document.getElementById("chatList");
const emptyState = document.getElementById("emptyState");

backBtn?.addEventListener("click", () => (window.location.href = "index.html"));
dashBtn?.addEventListener("click", () => (window.location.href = "index.html")); // ✅ plus dashboard
refreshBtn?.addEventListener("click", () => reloadOnce()); // ✅ utile si tu veux forcer un repaint

let cachedChats = [];
const profileCache = new Map(); // otherId -> {display, photoURL, firstName, lastName}

/* =========================
   INIT (no top-level await)
========================= */
init();

function init() {
  listenChats();

  filterInput?.addEventListener("input", () => {
    const v = (filterInput.value || "").trim().toLowerCase();
    renderChats(
      v
        ? cachedChats.filter((c) => (c.display || "").toLowerCase().includes(v))
        : cachedChats
    );
  });
}

/* =========================
   LIVE LISTENER
========================= */
let unsubscribeChats = null;

function listenChats() {
  chatList.innerHTML = `<div class="text-sm text-gray-500">Chargement…</div>`;
  emptyState?.classList.add("hidden");

  const chatsRef = collection(db, "chats");

  const q = query(
    chatsRef,
    where("participants", "array-contains", myId),
    orderBy("updatedAt", "desc"),
    limit(50)
  );

  if (unsubscribeChats) unsubscribeChats();

  unsubscribeChats = onSnapshot(
    q,
    async (snap) => {
      if (snap.empty) {
        cachedChats = [];
        renderChats([]);
        return;
      }

      const items = await Promise.all(
        snap.docs.map(async (d) => {
          const c = d.data();
          const participants = c.participants || [];
          const otherId = participants.find((p) => p !== myId) || null;

          // fallback display
          let display = otherId || "Discussion";
          let photoURL = null;
          let firstName = "";
          let lastName = "";

          if (otherId) {
            const profile = await getProfile(otherId);
            display = profile.display || display;
            photoURL = profile.photoURL || null;
            firstName = profile.firstName || "";
            lastName = profile.lastName || "";
          }

          return {
            id: d.id,
            otherId,
            display,
            photoURL,
            firstName,
            lastName,
            lastMessage: c.lastMessage || "",
            updatedAt: c.updatedAt || null
          };
        })
      );

      cachedChats = items;

      const v = (filterInput?.value || "").trim().toLowerCase();
      renderChats(
        v
          ? cachedChats.filter((c) => (c.display || "").toLowerCase().includes(v))
          : cachedChats
      );
    },
    (err) => {
      console.error("onSnapshot chats error:", err);
      chatList.innerHTML =
        `<div class="text-sm text-red-500">Erreur lors du chargement des conversations.</div>`;
    }
  );
}

/* =========================
   OPTIONAL: manual refresh
========================= */
function reloadOnce() {
  // Re-lance juste l'écoute (utile si tu changes des choses)
  listenChats();
}

/* =========================
   PROFILE CACHE
========================= */
async function getProfile(uid) {
  if (profileCache.has(uid)) return profileCache.get(uid);

  const snap = await getDoc(doc(db, "users", uid)).catch(() => null);

  let firstName = "";
  let lastName = "";
  let photoURL = null;
  let username = "";
  let display = uid;

  if (snap && snap.exists()) {
    const u = snap.data();
    firstName = u.firstName || "";
    lastName = u.lastName || "";
    photoURL = u.photoURL || null;
    username = u.username || "";

    display =
      (`${firstName} ${lastName}`).trim() ||
      username ||
      uid;
  }

  const value = { display, photoURL, firstName, lastName, username };
  profileCache.set(uid, value);
  return value;
}

/* =========================
   RENDER
========================= */
function renderChats(items) {
  chatList.innerHTML = "";

  if (!items || items.length === 0) {
    emptyState?.classList.remove("hidden");
    return;
  }

  emptyState?.classList.add("hidden");

  items.forEach((c) => {
    const row = document.createElement("div");
    row.className =
      "p-3 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-3 shadow-sm";

    const initials =
      `${(c.firstName?.charAt(0) || "")}${(c.lastName?.charAt(0) || "")}`.toUpperCase() || "—";

    const timeText = formatTime(c.updatedAt);

    row.innerHTML = `
      <div class="flex items-center gap-3 min-w-0">

        <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-xs font-semibold">
          ${
            c.photoURL
              ? `<img src="${escapeAttr(c.photoURL)}" class="w-full h-full object-cover">`
              : escapeHtml(initials)
          }
        </div>

        <div class="min-w-0">
          <div class="flex items-center justify-between gap-2">
            <div class="font-semibold text-sm truncate">${escapeHtml(c.display)}</div>
            <div class="text-[11px] text-gray-400 whitespace-nowrap">${escapeHtml(timeText)}</div>
          </div>
          <div class="text-xs text-gray-500 truncate">${escapeHtml(c.lastMessage || "—")}</div>
        </div>

      </div>

      <button class="openBtn px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold active:scale-95 transition">
        Ouvrir
      </button>
    `;

    row.querySelector(".openBtn")?.addEventListener("click", () => {
      if (!c.otherId) return;
      window.location.href = `room.html?uid=${encodeURIComponent(c.otherId)}`;
    });

    chatList.appendChild(row);
  });
}

/* =========================
   TIME
========================= */
function formatTime(ts) {
  if (!ts) return "";
  try {
    const d = ts.toDate();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return "";
  }
}

/* =========================
   SAFE ESCAPES
========================= */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function escapeAttr(str) {
  // pour éviter les injections dans src=""
  return String(str).replace(/"/g, "&quot;").replace(/</g, "&lt;");
}