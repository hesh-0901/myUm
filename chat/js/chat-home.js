// chat/js/chat-home.js

import { db } from "../../mains.js/firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ============================================================
   BLOC 1 : SESSION
   Rôle :
   - Identifier l’utilisateur connecté
============================================================ */
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("myum_user"));
  } catch {
    return null;
  }
}

const currentUser = getCurrentUser();
const myId = currentUser?.id;

if (!myId) {
  alert("Session invalide.");
  window.location.href = "../users/login.html";
}

/* ============================================================
   BLOC 2 : DOM
============================================================ */
const backDashboardBtn = document.getElementById("backDashboardBtn");
const friendsPageBtn = document.getElementById("friendsPageBtn");
const friendsCardBtn = document.getElementById("friendsCardBtn");

const friendRequestsBadge = document.getElementById("friendRequestsBadge");
const friendRequestsBadgeCard = document.getElementById("friendRequestsBadgeCard");

const conversationSearchInput = document.getElementById("conversationSearchInput");

const chatList = document.getElementById("chatList");
const chatEmptyState = document.getElementById("chatEmptyState");

/* ============================================================
   BLOC 3 : ÉTAT LOCAL
============================================================ */
let unsubscribeChats = null;
let unsubscribeRequests = null;
let cachedConversations = [];
const profileCache = new Map();

/* ============================================================
   BLOC 4 : NAVIGATION
============================================================ */
backDashboardBtn?.addEventListener("click", () => {
  window.location.href = "../public/dashboard.html";
});

friendsPageBtn?.addEventListener("click", () => {
  window.location.href = "friends.html";
});

friendsCardBtn?.addEventListener("click", () => {
  window.location.href = "friends.html";
});

/* ============================================================
   BLOC 5 : INIT
============================================================ */
init();

function init() {
  listenChats();
  listenFriendRequestsBadge();

  conversationSearchInput?.addEventListener("input", () => {
    const term = (conversationSearchInput.value || "").trim().toLowerCase();

    const filtered = term
      ? cachedConversations.filter((c) =>
          (c.display || "").toLowerCase().includes(term) ||
          (c.lastMessage || "").toLowerCase().includes(term)
        )
      : cachedConversations;

    renderConversations(filtered);
  });
}

/* ============================================================
   BLOC 6 : BADGE DEMANDES D’AMIS
   Rôle :
   - Afficher le nombre de demandes en attente
============================================================ */
function listenFriendRequestsBadge() {
  const requestsRef = collection(db, "users", myId, "friendRequests");

  const q = query(
    requestsRef,
    where("type", "==", "incoming"),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  if (unsubscribeRequests) unsubscribeRequests();

  unsubscribeRequests = onSnapshot(q, (snap) => {
    const total = snap.size;
    updateFriendBadge(total);
  }, (error) => {
    console.error("Erreur badge friend requests:", error);
  });
}

function updateFriendBadge(total) {
  const value = total > 99 ? "99+" : String(total);

  [friendRequestsBadge, friendRequestsBadgeCard].forEach((badge) => {
    if (!badge) return;

    if (total > 0) {
      badge.textContent = value;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  });
}

/* ============================================================
   BLOC 7 : CONVERSATIONS REALTIME
   Rôle :
   - Liste principale des messages
   - Typing dans la liste
   - Online
   - Badge non lus
============================================================ */
function listenChats() {
  chatList.innerHTML = `<div class="text-sm text-gray-500">Chargement…</div>`;
  chatEmptyState?.classList.add("hidden");

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
      cachedConversations = [];
      renderConversations([]);
      return;
    }

    const items = await Promise.all(
      snap.docs.map(async (docSnap) => {
        const chat = docSnap.data();
        const participants = chat.participants || [];
        const otherId = participants.find((p) => p !== myId) || null;

        const profile = otherId
          ? await getProfile(otherId)
          : { display: "Discussion", photoURL: null, initials: "—", online: false };

        const unread = (chat.unreadCount && chat.unreadCount[myId]) ? chat.unreadCount[myId] : 0;
        const typingMap = chat.typing || {};
        const otherTyping = otherId ? typingMap[otherId] === true : false;

        return {
          chatId: docSnap.id,
          otherId,
          display: profile.display,
          photoURL: profile.photoURL,
          initials: profile.initials,
          online: profile.online,
          lastMessage: chat.lastMessage || "—",
          updatedAt: chat.updatedAt || null,
          unread,
          typing: otherTyping
        };
      })
    );

    cachedConversations = items;

    const term = (conversationSearchInput?.value || "").trim().toLowerCase();
    const filtered = term
      ? cachedConversations.filter((c) =>
          (c.display || "").toLowerCase().includes(term) ||
          (c.lastMessage || "").toLowerCase().includes(term)
        )
      : cachedConversations;

    renderConversations(filtered);
  }, (error) => {
    console.error("Erreur conversations:", error);
    chatList.innerHTML = `<div class="text-sm text-red-500">Erreur chargement conversations.</div>`;
  });
}

/* ============================================================
   BLOC 8 : RENDER CONVERSATIONS
   Rôle :
   - Toute la ligne ouvre la room
   - Design plus propre, moins “barata”
============================================================ */
function renderConversations(items) {
  chatList.innerHTML = "";

  if (!items || items.length === 0) {
    chatEmptyState?.classList.remove("hidden");
    return;
  }

  chatEmptyState?.classList.add("hidden");

  items.forEach((c) => {
    const row = document.createElement("div");
    row.className =
      "p-3 rounded-3xl bg-white border border-gray-100 shadow-sm flex items-center justify-between gap-3 active:scale-[0.99] transition";
    row.style.cursor = "pointer";

    const timeText = formatTime(c.updatedAt);

    row.innerHTML = `
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <div class="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 shrink-0">
          ${
            c.photoURL
              ? `<img src="${escapeAttr(c.photoURL)}" class="w-full h-full object-cover" onerror="this.remove();">`
              : escapeHtml(c.initials)
          }
          ${
            c.online
              ? `<span class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white"></span>`
              : ``
          }
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <div class="font-semibold text-sm truncate">${escapeHtml(c.display)}</div>
            <div class="text-[11px] text-gray-400 whitespace-nowrap">${escapeHtml(timeText)}</div>
          </div>

          <div class="text-xs truncate ${c.typing ? "text-lightblue font-medium" : "text-gray-500"}">
            ${c.typing ? "… écrit" : escapeHtml(c.lastMessage || "—")}
          </div>
        </div>
      </div>

      ${
        c.unread > 0
          ? `<span class="min-w-[22px] h-[22px] px-2 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">${c.unread}</span>`
          : ``
      }
    `;

    row.addEventListener("click", () => {
      if (!c.otherId) return;
      window.location.href = `room.html?uid=${encodeURIComponent(c.otherId)}`;
    });

    chatList.appendChild(row);
  });
}

/* ============================================================
   BLOC 9 : PROFILE CACHE
   Rôle :
   - Optimiser la récupération des infos utilisateur
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
   BLOC 10 : HELPERS UI
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