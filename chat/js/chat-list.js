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

/* ============================================================
   BLOC 1 : SESSION
============================================================ */
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

/* ============================================================
   BLOC 2 : DOM
============================================================ */
const backBtn = document.getElementById("backBtn");
const refreshBtn = document.getElementById("refreshBtn");
const filterInput = document.getElementById("filterInput");
const chatList = document.getElementById("chatList");
const emptyState = document.getElementById("emptyState");

backBtn?.addEventListener("click", () => (window.location.href = "index.html"));
refreshBtn?.addEventListener("click", () => listenChats(true));

/* ============================================================
   BLOC 3 : ÉTAT LOCAL
============================================================ */
let cached = [];
let unsubscribeChats = null;
const profileCache = new Map();

/* ============================================================
   BLOC 4 : INIT
============================================================ */
init();

function init() {
  listenChats(false);

  filterInput?.addEventListener("input", () => {
    const v = (filterInput.value || "").trim().toLowerCase();
    const items = v
      ? cached.filter((x) => (x.display || "").toLowerCase().includes(v))
      : cached;
    render(items);
  });
}

/* ============================================================
   BLOC 5 : LISTEN CHATS
   Rôle :
   - Realtime list
   - Badge non lu
   - Typing indicator dans la liste
============================================================ */
function listenChats(forceRestart) {
  if (forceRestart && unsubscribeChats) {
    unsubscribeChats();
    unsubscribeChats = null;
  }

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

  unsubscribeChats = onSnapshot(q, async (snap) => {
    if (snap.empty) {
      cached = [];
      render([]);
      return;
    }

    const items = await Promise.all(
      snap.docs.map(async (d) => {
        const c = d.data();
        const participants = c.participants || [];
        const otherId = participants.find((p) => p !== myId) || null;

        const u = otherId
          ? await getProfile(otherId)
          : { display: "Discussion", photoURL: null, initials: "—", online: false };

        const unread = (c.unreadCount && c.unreadCount[myId]) ? c.unreadCount[myId] : 0;

        const typingMap = c.typing || {};
        const otherTyping = otherId ? typingMap[otherId] === true : false;

        return {
          chatId: d.id,
          otherId,
          display: u.display,
          photoURL: u.photoURL,
          initials: u.initials,
          online: u.online,
          lastMessage: c.lastMessage || "—",
          updatedAt: c.updatedAt || null,
          unread,
          typing: otherTyping
        };
      })
    );

    cached = items;

    const v = (filterInput?.value || "").trim().toLowerCase();
    render(
      v
        ? cached.filter((x) => (x.display || "").toLowerCase().includes(v))
        : cached
    );
  }, (err) => {
    console.error("chat list error:", err);
    chatList.innerHTML = `<div class="text-sm text-red-600">Erreur chargement conversations.</div>`;
  });
}

/* ============================================================
   BLOC 6 : PROFILE CACHE
============================================================ */
async function getProfile(uid) {
  if (profileCache.has(uid)) return profileCache.get(uid);

  const snap = await getDoc(doc(db, "users", uid)).catch(() => null);

  let firstName = "";
  let lastName = "";
  let username = "";
  let photoURL = null;
  let lastSeenDate = null;

  if (snap && snap.exists()) {
    const u = snap.data();
    firstName = u.firstName || "";
    lastName = u.lastName || "";
    username = u.username || "";
    photoURL = u.photoURL || null;
    lastSeenDate = u.lastSeen?.toDate ? u.lastSeen.toDate() : null;
  }

  const display =
    `${firstName} ${lastName}`.trim() ||
    username ||
    uid;

  const initials =
    `${(firstName?.[0] || "")}${(lastName?.[0] || "")}`.toUpperCase() ||
    (username?.[0] || "").toUpperCase() ||
    "—";

  const online = lastSeenDate
    ? (Date.now() - lastSeenDate.getTime() < 45000)
    : false;

  const data = { display, photoURL, initials, online };
  profileCache.set(uid, data);
  return data;
}

/* ============================================================
   BLOC 7 : RENDER
   Rôle :
   - Toute la ligne ouvre la conversation
   - Si typing = true, on remplace le dernier message
============================================================ */
function render(items) {
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
    row.style.cursor = "pointer";

    const timeText = formatTime(c.updatedAt);

    row.innerHTML = `
      <div class="flex items-center gap-3 min-w-0">
        <div class="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-xs font-semibold">
          ${
            c.photoURL
              ? `<img src="${escapeAttr(c.photoURL)}" class="w-full h-full object-cover" onerror="this.remove();">`
              : escapeHtml(c.initials)
          }
          ${c.online ? `<span class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>` : ``}
        </div>

        <div class="min-w-0">
          <div class="flex items-center justify-between gap-2">
            <div class="font-semibold text-sm truncate">${escapeHtml(c.display)}</div>
            <div class="text-[11px] text-gray-400 whitespace-nowrap">${escapeHtml(timeText)}</div>
          </div>

          <div class="text-xs truncate ${
            c.typing ? "text-lightblue font-medium" : "text-gray-500"
          }">
            ${c.typing ? "… écrit" : escapeHtml(c.lastMessage || "—")}
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        ${
          c.unread > 0
            ? `<span class="min-w-[22px] h-[22px] px-2 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">${c.unread}</span>`
            : ``
        }
        <button class="openBtn px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold active:scale-95 transition">
          Ouvrir
        </button>
      </div>
    `;

    row.addEventListener("click", () => {
      if (!c.otherId) return;
      window.location.href = `room.html?uid=${encodeURIComponent(c.otherId)}`;
    });

    row.querySelector(".openBtn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!c.otherId) return;
      window.location.href = `room.html?uid=${encodeURIComponent(c.otherId)}`;
    });

    chatList.appendChild(row);
  });
}

/* ============================================================
   BLOC 8 : HELPERS
============================================================ */
function formatTime(ts) {
  if (!ts) return "";
  try {
    const d = ts.toDate();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return "";
  }
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

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;").replace(/</g, "&lt;");
}