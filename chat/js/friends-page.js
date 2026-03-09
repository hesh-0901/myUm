// chat/js/friends-page.js

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
  serverTimestamp
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

const currentUser = getCurrentUser();
const myId = currentUser?.id;

if (!myId) {
  alert("Session invalide.");
  window.location.href = "../users/login.html";
}

/* ============================================================
   BLOC 2 : DOM
============================================================ */
const backChatBtn = document.getElementById("backChatBtn");

const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const incomingList = document.getElementById("incomingList");
const friendsList = document.getElementById("friendsList");

/* ============================================================
   BLOC 3 : ÉTAT LOCAL
============================================================ */
const profileCache = new Map();

/* ============================================================
   BLOC 4 : NAVIGATION
============================================================ */
backChatBtn?.addEventListener("click", () => {
  window.location.href = "index.html";
});

/* ============================================================
   BLOC 5 : INIT
============================================================ */
init();

async function init() {
  bindSearch();
  await renderIncoming();
  await renderFriends();
}

/* ============================================================
   BLOC 6 : RECHERCHE LIVE
============================================================ */
function bindSearch() {
  searchInput?.addEventListener("input", debounce(() => {
    onSearch(true);
  }, 250));

  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onSearch(false);
  });
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

    const qPhone = query(usersRef, where("phone", "==", term), limit(10));

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
    console.error("Erreur recherche:", error);
    if (!silent) showToast("Erreur recherche ❌");
  }
}

/* ============================================================
   BLOC 7 : DEMANDE D’AMI ANTI-SPAM
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
    console.error("sendFriendRequest:", error);
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
============================================================ */
async function renderIncoming() {
  incomingList.innerHTML = "";

  try {
    const requestsRef = collection(db, "users", myId, "friendRequests");
    const snap = await getDocs(query(
      requestsRef,
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
    console.error("renderIncoming:", error);
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
    console.error("acceptRequest:", error);
    showToast("Erreur acceptation ❌");
  }
}

/* ============================================================
   BLOC 9 : LISTE D’AMIS
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
          Chat
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
    console.error("renderFriends:", error);
    friendsList.innerHTML = `<div class="text-xs text-red-500">Erreur chargement amis.</div>`;
  }
}

/* ============================================================
   BLOC 10 : PROFILE CACHE
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
   BLOC 11 : HELPERS
============================================================ */
async function isFriend(a, b) {
  return (await getDoc(doc(db, "users", a, "friends", b))).exists();
}

async function hasPendingRequest(from, to) {
  const requestId = `${from}_${to}`;
  const snap = await getDoc(doc(db, "users", from, "friendRequests", requestId)).catch(() => null);
  return !!(snap && snap.exists() && snap.data()?.status === "pending");
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function showToast(message) {
  let t = document.getElementById("friends_page_toast");

  if (!t) {
    t = document.createElement("div");
    t.id = "friends_page_toast";
    t.className =
      "fixed top-4 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-4 py-2 rounded-xl shadow-lg opacity-0 transition z-[9999]";
    document.body.appendChild(t);
  }

  t.textContent = message;
  t.style.opacity = "1";

  clearTimeout(window.__friendsToastTimer);
  window.__friendsToastTimer = setTimeout(() => {
    t.style.opacity = "0";
  }, 1600);
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