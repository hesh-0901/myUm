// chat/js/friends.js

import { db } from "../../mains.js/firebase-config.js";
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where, limit,
  serverTimestamp, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ============================================================
   FRIENDS MODULE (SEARCH + REQUESTS + FRIENDS)
   Utilité:
   - Recherche: username / phone / firstName / lastName (prefix)
   - Envoyer demande d’ami (idempotent -> anti-spam)
   - Lister demandes entrantes (index requis)
   Index Firestore (IMPORTANT):
   - friendRequests: type asc + status asc + createdAt desc
============================================================ */

/* =========================
   SESSION
========================= */
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("myum_user")); }
  catch { return null; }
}

const currentUser = getCurrentUser();
const uid = currentUser?.id;

if (!uid) {
  alert("Session invalide.");
  window.location.href = "../users/login.html";
}

/* =========================
   DOM
========================= */
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");
const incomingList = document.getElementById("incomingList");
const friendsList = document.getElementById("friendsList");

init();

async function init() {
  searchBtn?.addEventListener("click", onSearch);
  searchInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") onSearch(); });

  // ✅ Recherche live (fluide)
  searchInput?.addEventListener("input", debounce(() => onSearch(true), 250));

  await renderIncoming();
  await renderFriends();
}

/* =========================
   SEARCH (username/phone/first/last prefix)
========================= */
async function onSearch(silent = false) {
  const term = (searchInput?.value || "").trim();
  searchResults.innerHTML = "";
  if (!term) return;

  const usersRef = collection(db, "users");
  const termUpper = term.toUpperCase();

  try {
    // username prefix
    const qUsername = query(
      usersRef,
      where("username", ">=", termUpper),
      where("username", "<=", termUpper + "\uf8ff"),
      limit(10)
    );

    // phone exact
    const qPhone = query(usersRef, where("phone", "==", term), limit(10));

    // firstName prefix (si stocké en uppercase — sinon adapte)
    const qFirst = query(
      usersRef,
      where("firstName", ">=", termUpper),
      where("firstName", "<=", termUpper + "\uf8ff"),
      limit(10)
    );

    // lastName prefix
    const qLast = query(
      usersRef,
      where("lastName", ">=", termUpper),
      where("lastName", "<=", termUpper + "\uf8ff"),
      limit(10)
    );

    const [sU, sP, sF, sL] = await Promise.all([
      getDocs(qUsername),
      getDocs(qPhone),
      getDocs(qFirst),
      getDocs(qLast)
    ]);

    const found = new Map();
    [sU, sP, sF, sL].forEach(s => s.forEach(d => found.set(d.id, { id:d.id, ...d.data() })));

    if (found.size === 0) {
      if (!silent) showToast("Aucun utilisateur trouvé");
      return;
    }

    for (const user of found.values()) {
      if (user.id === uid) continue;

      const alreadyFriend = await isFriend(uid, user.id);
      const pending = await hasPendingRequest(uid, user.id);

      const display =
        (`${user.firstName || ""} ${user.lastName || ""}`).trim() ||
        user.username ||
        "Utilisateur";

      const btnLabel = alreadyFriend ? "Déjà ami" : pending ? "En attente" : "Ajouter";
      const btnClass = alreadyFriend ? "bg-gray-300"
        : pending ? "bg-yellow-200"
        : "bg-blue-600 text-white";

      const card = document.createElement("div");
      card.className = "bg-gray-50 rounded-2xl p-4 flex justify-between items-center shadow-sm";

      card.innerHTML = `
        <div class="min-w-0">
          <div class="font-semibold text-sm truncate">${escapeHtml(display)}</div>
          <div class="text-xs text-gray-500 truncate">@${escapeHtml(user.username || user.id)}</div>
        </div>
        <button class="sendBtn px-3 py-1 rounded-xl text-xs ${btnClass}">${btnLabel}</button>
      `;

      const btn = card.querySelector(".sendBtn");

      if (!alreadyFriend && !pending) {
        btn.addEventListener("click", () => sendFriendRequest(user.id, btn));
      }

      searchResults.appendChild(card);
    }

  } catch (e) {
    console.error("search error:", e);
    showToast("Erreur recherche ❌");
  }
}

/* =========================
   SEND REQUEST (ANTI-SPAM PRO)
========================= */
async function sendFriendRequest(toUserId, btn) {
  try {
    if (btn) {
      btn.disabled = true;
      btn.classList.add("opacity-60");
      btn.textContent = "Envoi...";
    }

    // ✅ requestId stable = empêche 50 demandes
    const requestId = `${uid}_${toUserId}`;

    const myReqRef = doc(db, "users", uid, "friendRequests", requestId);
    const theirReqRef = doc(db, "users", toUserId, "friendRequests", requestId);

    const existing = await getDoc(myReqRef);
    if (existing.exists() && existing.data()?.status === "pending") {
      showToast("Demande déjà envoyée ✅");
      if (btn) {
        btn.textContent = "En attente";
        btn.className = "sendBtn px-3 py-1 rounded-xl text-xs bg-yellow-200";
      }
      return;
    }

    await setDoc(myReqRef, {
      fromUserId: uid,
      toUserId,
      type: "outgoing",
      status: "pending",
      createdAt: serverTimestamp()
    });

    await setDoc(theirReqRef, {
      fromUserId: uid,
      toUserId,
      type: "incoming",
      status: "pending",
      createdAt: serverTimestamp()
    });

    showToast("Demande envoyée ✅");

    await renderIncoming();
    await renderFriends();

    if (btn) {
      btn.textContent = "En attente";
      btn.className = "sendBtn px-3 py-1 rounded-xl text-xs bg-yellow-200";
    }

  } catch (e) {
    console.error("sendFriendRequest:", e);
    showToast("Erreur envoi ❌");
    if (btn) {
      btn.disabled = false;
      btn.classList.remove("opacity-60");
      btn.textContent = "Ajouter";
    }
  }
}

/* =========================
   RENDER INCOMING
========================= */
async function renderIncoming() {
  incomingList.innerHTML = "";

  const incomingCol = collection(db, "users", uid, "friendRequests");

  // ⚠️ Index requis: type + status + createdAt desc
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
    const uSnap = await getDoc(doc(db, "users", fromId)).catch(() => null);
    const u = uSnap && uSnap.exists() ? uSnap.data() : {};
    const display = (`${u.firstName || ""} ${u.lastName || ""}`).trim() || u.username || fromId;

    const row = document.createElement("div");
    row.className = "bg-gray-50 rounded-2xl p-3 flex justify-between items-center shadow-sm";

    row.innerHTML = `
      <div class="text-sm font-medium">${escapeHtml(display)}</div>
      <button class="accept text-xs bg-green-600 text-white px-3 py-2 rounded-xl active:scale-95 transition">
        Accepter
      </button>
    `;

    row.querySelector(".accept").addEventListener("click", () => acceptRequest(docSnap.id, fromId));

    incomingList.appendChild(row);
  }
}

/* =========================
   ACCEPT REQUEST
========================= */
async function acceptRequest(requestId, fromUserId) {
  await setDoc(doc(db, "users", uid, "friends", fromUserId), { createdAt: serverTimestamp() });
  await setDoc(doc(db, "users", fromUserId, "friends", uid), { createdAt: serverTimestamp() });

  await deleteDoc(doc(db, "users", uid, "friendRequests", requestId));
  await deleteDoc(doc(db, "users", fromUserId, "friendRequests", requestId));

  showToast("Ami ajouté ✅");

  await renderIncoming();
  await renderFriends();
}

/* =========================
   FRIENDS LIST (display names)
========================= */
async function renderFriends() {
  friendsList.innerHTML = "";

  const snap = await getDocs(collection(db, "users", uid, "friends"));
  if (snap.empty) {
    friendsList.innerHTML = `<div class="text-xs text-gray-500">Aucun ami.</div>`;
    return;
  }

  for (const f of snap.docs) {
    const friendId = f.id;
    const uSnap = await getDoc(doc(db, "users", friendId)).catch(() => null);
    const u = uSnap && uSnap.exists() ? uSnap.data() : {};
    const display = (`${u.firstName || ""} ${u.lastName || ""}`).trim() || u.username || friendId;

    const row = document.createElement("div");
    row.className = "bg-gray-50 rounded-2xl p-3 flex justify-between items-center shadow-sm";

    row.innerHTML = `
      <div class="text-sm font-medium">${escapeHtml(display)}</div>
      <button class="chat text-xs bg-primary text-white px-3 py-2 rounded-xl active:scale-95 transition">
        Chat
      </button>
    `;

    row.querySelector(".chat").addEventListener("click", () => {
      window.location.href = `room.html?uid=${encodeURIComponent(friendId)}`;
    });

    friendsList.appendChild(row);
  }
}

/* =========================
   HELPERS
========================= */
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
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className =
      "fixed top-4 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-4 py-2 rounded-xl shadow-lg opacity-0 transition z-[9999]";
    document.body.appendChild(t);
  }
  t.textContent = message;
  t.style.opacity = "1";
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => (t.style.opacity = "0"), 1600);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[m]));
}