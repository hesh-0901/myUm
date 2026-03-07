// chat/js/chat-home.js

import { db } from "../../mains.js/firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ============================================================
   BLOC 1 : SESSION UTILISATEUR
   Rôle :
   - Identifier l'utilisateur connecté
   - Sécuriser l'accès à la messagerie
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
  alert("Session invalide. Veuillez vous reconnecter.");
  window.location.href = "../users/login.html";
}

/* ============================================================
   BLOC 2 : DOM
   Rôle :
   - Centraliser les références HTML
============================================================ */
const backDashboardBtn = document.getElementById("backDashboardBtn");
const refreshBtn = document.getElementById("refreshBtn");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");

const chatList = document.getElementById("chatList");
const chatEmptyState = document.getElementById("chatEmptyState");

const incomingList = document.getElementById("incomingList");
const friendsList = document.getElementById("friendsList");

/* ============================================================
   BLOC 3 : ÉTAT LOCAL
   Rôle :
   - Caches mémoire pour performance et cohérence
============================================================ */
const profileCache = new Map();
let unsubscribeChats = null;
let cachedConversations = [];

/* ============================================================
   BLOC 4 : NAVIGATION
   Rôle :
   - Retour dashboard
============================================================ */
backDashboardBtn?.addEventListener("click", () => {
  window.location.href = "../public/dashboard.html";
});

refreshBtn?.addEventListener("click", async () => {
  await renderIncoming();
  await renderFriends();
  listenChats(true);
});

/* ============================================================
   BLOC 5 : INIT PRINCIPALE
   Rôle :
   - Démarrer tous les sous-systèmes
============================================================ */
init();

async function init() {
  bindSearch();
  listenChats(false);
  await renderIncoming();
  await renderFriends();
}

/* ============================================================
   BLOC 6 : RECHERCHE TEMPS RÉEL
   Rôle :
   - Rechercher par username / téléphone / prénom / nom
   - Afficher les utilisateurs correspondants
============================================================ */
function bindSearch() {
  searchBtn?.addEventListener("click", () => onSearch(false));

  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onSearch(false);
  });

  searchInput?.addEventListener("input", debounce(() => {
    onSearch(true);
  }, 250));
}

async function onSearch(silent = false) {
  const term = (searchInput?.value || "").trim();
  searchResults.innerHTML = "";

  if (!term) return;

  const usersRef = collection(db, "users");
  const termUpper = term.toUpperCase();

  try {
    const qUsername = query(
      usersRef,
      where("username", ">=", termUpper),
      where("username", "<=", termUpper + "\uf8ff"),
      limit(10)
    );

    const qPhone = query(
      usersRef,
      where("phone", "==", term),
      limit(10)
    );

    const qFirstName = query(
      usersRef,
      where("firstName", ">=", termUpper),
      where("firstName", "<=", termUpper + "\uf8ff"),
      limit(10)
    );

    const qLastName = query(
      usersRef,
      where("lastName", ">=", termUpper),
      where("lastName", "<=", termUpper + "\uf8ff"),
      limit(10)
    );

    const [sU, sP, sF, sL] = await Promise.all([
      getDocs(qUsername),
      getDocs(qPhone),
      getDocs(qFirstName),
      getDocs(qLastName)
    ]);

    const found = new Map();
    [sU, sP, sF, sL].forEach((snap) => {
      snap.forEach((d) => found.set(d.id, { id: d.id, ...d.data() }));
    });

    if (found.size === 0) {
      if (!silent) showToast("Aucun utilisateur trouvé");
      return;
    }

    for (const user of found.values()) {
      if (user.id === myId) continue;

      const alreadyFriend = await isFriend(myId, user.id);
      const pending = await hasPendingRequest(myId, user.id);

      const displayName =
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        user.username ||
        "Utilisateur";

      const initials =
        `${(user.firstName?.[0] || "")}${(user.lastName?.[0] || "")}`.toUpperCase() ||
        (user.username?.[0] || "").toUpperCase() ||
        "—";

      const btnLabel = alreadyFriend ? "Déjà ami" : pending ? "En attente" : "Ajouter";
      const btnClass = alreadyFriend
        ? "bg-gray-300 text-gray-600"
        : pending
          ? "bg-yellow-200 text-yellow-800"
          : "bg-primary text-white";

      const row = document.createElement("div");
      row.className = "p-3 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-3";

      row.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-700">
            ${
              user.photoURL
                ? `<img src="${escapeAttr(user.photoURL)}" class="w-full h-full object-cover" onerror="this.remove();">`
                : escapeHtml(initials)
            }
          </div>
          <div class="min-w-0">
            <div class="font-semibold text-sm truncate">${escapeHtml(displayName)}</div>
            <div class="text-xs text-gray-500 truncate">@${escapeHtml(user.username || user.id)}</div>
          </div>
        </div>

        <button class="sendBtn px-3 py-2 rounded-xl text-xs font-semibold ${btnClass}">
          ${btnLabel}
        </button>
      `;

      const btn = row.querySelector(".sendBtn");
      if (!alreadyFriend && !pending) {
        btn.addEventListener("click", () => sendFriendRequest(user.id, btn));
      }

      searchResults.appendChild(row);
    }
  } catch (error) {
    console.error("Erreur recherche :", error);
    if (!silent) showToast("Erreur recherche ❌");
  }
}

/* ============================================================
   BLOC 7 : DEMANDE D'AMI ANTI-SPAM
   Rôle :
   - Empêcher les doublons
   - Utiliser un requestId stable
============================================================ */
async function sendFriendRequest(toUserId, btn = null) {
  try {
    if (btn) {
      btn.disabled = true;
      btn.classList.add("opacity-60");
      btn.textContent = "Envoi...";
    }

    const requestId = `${myId}_${toUserId}`;

    const myReqRef = doc(db, "users", myId, "friendRequests", requestId);
    const theirReqRef = doc(db, "users", toUserId, "friendRequests", requestId);

    const existing = await getDoc(myReqRef);
    if (existing.exists() && existing.data()?.status === "pending") {
      showToast("Demande déjà envoyée ✅");
      if (btn) {
        btn.textContent = "En attente";
        btn.className = "sendBtn px-3 py-2 rounded-xl text-xs font-semibold bg-yellow-200 text-yellow-800";
      }
      return;
    }

    await setDoc(myReqRef, {
      fromUserId: myId,
      toUserId,
      type: "outgoing",
      status: "pending",
      createdAt: serverTimestamp()
    });

    await setDoc(theirReqRef, {
      fromUserId: myId,
      toUserId,
      type: "incoming",
      status: "pending",
      createdAt: serverTimestamp()
    });

    showToast("Demande envoyée ✅");
    await renderIncoming();

    if (btn) {
      btn.textContent = "En attente";
      btn.className = "sendBtn px-3 py-2 rounded-xl text-xs font-semibold bg-yellow-200 text-yellow-800";
    }
  } catch (error) {
    console.error("sendFriendRequest error:", error);
    showToast("Erreur d'envoi ❌");

    if (btn) {
      btn.disabled = false;
      btn.classList.remove("opacity-60");
      btn.textContent = "Ajouter";
    }
  }
}

/* ============================================================
   BLOC 8 : DEMANDES REÇUES
   Rôle :
   - Afficher et accepter les demandes d'amis
   Index Firestore requis :
   - friendRequests : type asc + status asc + createdAt desc
============================================================ */
async function renderIncoming() {
  incomingList.innerHTML = "";

  const incomingCol = collection(db, "users", myId, "friendRequests");

  try {
    const snap = await getDocs(query(
      incomingCol,
      where("type", "==", "incoming"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
      limit(30)
    ));

    if (snap.empty) {
      incomingList.innerHTML = `<div class="text-xs text-gray-500">Aucune demande.</div>`;
      return;
    }

    for (const docSnap of snap.docs) {
      const req = docSnap.data();
      const fromId = req.fromUserId;
      const profile = await getProfile(fromId);

      const row = document.createElement("div");
      row.className = "p-3 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-3";

      row.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-700">
            ${
              profile.photoURL
                ? `<img src="${escapeAttr(profile.photoURL)}" class="w-full h-full object-cover" onerror="this.remove();">`
                : escapeHtml(profile.initials)
            }
          </div>
          <div class="min-w-0">
            <div class="font-semibold text-sm truncate">${escapeHtml(profile.display)}</div>
            <div class="text-xs text-gray-500 truncate">Demande d’ami</div>
          </div>
        </div>

        <button class="acceptBtn px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold active:scale-95 transition">
          Accepter
        </button>
      `;

      row.querySelector(".acceptBtn")?.addEventListener("click", () => {
        acceptRequest(docSnap.id, fromId);
      });

      incomingList.appendChild(row);
    }
  } catch (error) {
    console.error("renderIncoming error:", error);
    incomingList.innerHTML = `<div class="text-xs text-red-500">Erreur chargement demandes.</div>`;
  }
}

async function acceptRequest(requestId, fromUserId) {
  try {
    await setDoc(doc(db, "users", myId, "friends", fromUserId), {
      createdAt: serverTimestamp()
    });

    await setDoc(doc(db, "users", fromUserId, "friends", myId), {
      createdAt: serverTimestamp()
    });

    await deleteDoc(doc(db, "users", myId, "friendRequests", requestId));
    await deleteDoc(doc(db, "users", fromUserId, "friendRequests", requestId));

    showToast("Ami ajouté ✅");
    await renderIncoming();
    await renderFriends();
  } catch (error) {
    console.error("acceptRequest error:", error);
    showToast("Erreur acceptation ❌");
  }
}

/* ============================================================
   BLOC 9 : MES AMIS
   Rôle :
   - Liste rapide des amis
   - Ouverture directe de la room
============================================================ */
async function renderFriends() {
  friendsList.innerHTML = "";

  try {
    const snap = await getDocs(collection(db, "users", myId, "friends"));

    if (snap.empty) {
      friendsList.innerHTML = `<div class="text-xs text-gray-500">Aucun ami.</div>`;
      return;
    }

    for (const f of snap.docs) {
      const friendId = f.id;
      const profile = await getProfile(friendId);

      const row = document.createElement("div");
      row.className = "p-3 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-3";
      row.style.cursor = "pointer";

      row.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-700">
            ${
              profile.photoURL
                ? `<img src="${escapeAttr(profile.photoURL)}" class="w-full h-full object-cover" onerror="this.remove();">`
                : escapeHtml(profile.initials)
            }
          </div>
          <div class="min-w-0">
            <div class="font-semibold text-sm truncate">${escapeHtml(profile.display)}</div>
            <div class="text-xs text-gray-500 truncate">${profile.online ? "En ligne" : "Ami"}</div>
          </div>
        </div>

        <button class="chatBtn px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold active:scale-95 transition">
          Ouvrir
        </button>
      `;

      row.addEventListener("click", () => {
        window.location.href = `room.html?uid=${encodeURIComponent(friendId)}`;
      });

      row.querySelector(".chatBtn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        window.location.href = `room.html?uid=${encodeURIComponent(friendId)}`;
      });

      friendsList.appendChild(row);
    }
  } catch (error) {
    console.error("renderFriends error:", error);
    friendsList.innerHTML = `<div class="text-xs text-red-500">Erreur chargement amis.</div>`;
  }
}

/* ============================================================
   BLOC 10 : CONVERSATIONS EN TEMPS RÉEL
   Rôle :
   - Fusion de l’ancien list.html dans index.html
   - Typing + unread + avatar + online
============================================================ */
function listenChats(forceRestart) {
  if (forceRestart && unsubscribeChats) {
    unsubscribeChats();
    unsubscribeChats = null;
  }

  chatList.innerHTML = `<div class="text-xs text-gray-500">Chargement…</div>`;
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
      snap.docs.map(async (d) => {
        const c = d.data();
        const participants = c.participants || [];
        const otherId = participants.find((p) => p !== myId) || null;

        const profile = otherId
          ? await getProfile(otherId)
          : { display: "Discussion", photoURL: null, initials: "—", online: false };

        const unread = (c.unreadCount && c.unreadCount[myId]) ? c.unreadCount[myId] : 0;
        const typingMap = c.typing || {};
        const otherTyping = otherId ? typingMap[otherId] === true : false;

        return {
          chatId: d.id,
          otherId,
          display: profile.display,
          photoURL: profile.photoURL,
          initials: profile.initials,
          online: profile.online,
          lastMessage: c.lastMessage || "—",
          updatedAt: c.updatedAt || null,
          unread,
          typing: otherTyping
        };
      })
    );

    cachedConversations = items;
    renderConversations(items);
  }, (error) => {
    console.error("listenChats error:", error);
    chatList.innerHTML = `<div class="text-xs text-red-500">Erreur chargement conversations.</div>`;
  });
}

function renderConversations(items) {
  chatList.innerHTML = "";

  if (!items || items.length === 0) {
    chatEmptyState?.classList.remove("hidden");
    return;
  }

  chatEmptyState?.classList.add("hidden");

  items.forEach((c) => {
    const row = document.createElement("div");
    row.className = "p-3 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-3 shadow-sm";
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

          <div class="text-xs truncate ${c.typing ? "text-lightblue font-medium" : "text-gray-500"}">
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
      </div>
    `;

    row.addEventListener("click", () => {
      if (!c.otherId) return;
      window.location.href = `room.html?uid=${encodeURIComponent(c.otherId)}`;
    });

    chatList.appendChild(row);
  });
}

/* ============================================================
   BLOC 11 : PROFILE CACHE
   Rôle :
   - Éviter de relire Firestore 20 fois pour le même user
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
   BLOC 12 : HELPERS LOGIQUES
============================================================ */
async function isFriend(a, b) {
  return (await getDoc(doc(db, "users", a, "friends", b))).exists();
}

async function hasPendingRequest(from, to) {
  const requestId = `${from}_${to}`;
  const snap = await getDoc(doc(db, "users", from, "friendRequests", requestId)).catch(() => null);
  return !!(snap && snap.exists() && snap.data()?.status === "pending");
}

/* ============================================================
   BLOC 13 : UTILITAIRES UI
============================================================ */
function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function showToast(message) {
  let t = document.getElementById("chat_home_toast");

  if (!t) {
    t = document.createElement("div");
    t.id = "chat_home_toast";
    t.className =
      "fixed top-4 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-4 py-2 rounded-xl shadow-lg opacity-0 transition z-[9999]";
    document.body.appendChild(t);
  }

  t.textContent = message;
  t.style.opacity = "1";

  clearTimeout(window.__chatHomeToastTimer);
  window.__chatHomeToastTimer = setTimeout(() => {
    t.style.opacity = "0";
  }, 1600);
}

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