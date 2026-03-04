// chat/js/chat-list.js

import { db } from "../../mains.js/firebase-config.js";
import {
  collection, doc, getDoc, query, where, orderBy, limit, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("myum_user")); }
  catch { return null; }
}
const me = getCurrentUser();
const myId = me?.id;

if (!myId) {
  alert("Session invalide. Veuillez vous reconnecter.");
  window.location.href = "../users/login.html";
}

const backBtn = document.getElementById("backBtn");
const dashBtn = document.getElementById("dashBtn");
const refreshBtn = document.getElementById("refreshBtn");
const filterInput = document.getElementById("filterInput");

const chatList = document.getElementById("chatList");
const emptyState = document.getElementById("emptyState");

backBtn?.addEventListener("click", () => (window.location.href = "index.html"));
dashBtn?.addEventListener("click", () => (window.location.href = "index.html"));
refreshBtn?.addEventListener("click", () => listenChats(true));

let cachedChats = [];
const profileCache = new Map();
let unsubscribeChats = null;

init();

function init() {
  listenChats(false);

  filterInput?.addEventListener("input", () => {
    const v = (filterInput.value || "").trim().toLowerCase();
    renderChats(v ? cachedChats.filter(c => (c.display || "").toLowerCase().includes(v)) : cachedChats);
  });
}

function listenChats(forceRestart = false) {
  if (forceRestart && unsubscribeChats) {
    unsubscribeChats();
    unsubscribeChats = null;
  }

  chatList.innerHTML = `<div class="text-sm text-gray-500">Chargement…</div>`;
  emptyState?.classList.add("hidden");

  const chatsRef = collection(db, "chats");
  const qOrdered = query(
    chatsRef,
    where("participants", "array-contains", myId),
    orderBy("updatedAt", "desc"),
    limit(50)
  );

  if (unsubscribeChats) unsubscribeChats();

  unsubscribeChats = onSnapshot(qOrdered, async (snap) => {
    if (snap.empty) {
      cachedChats = [];
      renderChats([]);
      return;
    }

    const items = await Promise.all(snap.docs.map(async (d) => {
      const c = d.data();
      const otherId = (c.participants || []).find(p => p !== myId) || null;

      const profile = otherId ? await getProfile(otherId) : { display: "Discussion", photoURL: null, firstName: "", lastName: "", online: false };

      const unreadMap = c.unreadCount || {};
      const unread = unreadMap[myId] || 0;

      return {
        id: d.id,
        otherId,
        display: profile.display,
        photoURL: profile.photoURL,
        firstName: profile.firstName,
        lastName: profile.lastName,
        online: profile.online,
        lastMessage: c.lastMessage || "",
        updatedAt: c.updatedAt || null,
        unread
      };
    }));

    cachedChats = items;

    const v = (filterInput?.value || "").trim().toLowerCase();
    renderChats(v ? cachedChats.filter(c => (c.display || "").toLowerCase().includes(v)) : cachedChats);

  }, (err) => {
    console.error("chat list onSnapshot:", err);
    chatList.innerHTML = `<div class="text-sm text-red-600">Erreur chargement conversations</div>`;
  });
}

async function getProfile(uid) {
  if (profileCache.has(uid)) return profileCache.get(uid);

  const snap = await getDoc(doc(db, "users", uid)).catch(() => null);
  let firstName = "", lastName = "", photoURL = null, username = "", display = uid, online = false;

  if (snap && snap.exists()) {
    const u = snap.data();
    firstName = u.firstName || "";
    lastName = u.lastName || "";
    photoURL = u.photoURL || null;
    username = u.username || "";
    online = u.online === true;
    display = (`${firstName} ${lastName}`).trim() || username || uid;
  }

  const value = { display, photoURL, firstName, lastName, username, online };
  profileCache.set(uid, value);
  return value;
}

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

    const initials = `${(c.firstName?.charAt(0) || "")}${(c.lastName?.charAt(0) || "")}`.toUpperCase() || "—";
    const timeText = formatTime(c.updatedAt);

    row.innerHTML = `
      <div class="flex items-center gap-3 min-w-0">
        <div class="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-xs font-semibold">
          ${
            c.photoURL
              ? `<img src="${escapeAttr(c.photoURL)}" class="w-full h-full object-cover">`
              : escapeHtml(initials)
          }
          ${
            c.online
              ? `<span class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>`
              : ``
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

    row.querySelector(".openBtn")?.addEventListener("click", () => {
      if (!c.otherId) return;
      window.location.href = `room.html?uid=${encodeURIComponent(c.otherId)}`;
    });

    chatList.appendChild(row);
  });
}

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

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}
function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;").replace(/</g, "&lt;");
}