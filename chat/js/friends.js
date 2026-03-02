// chat/js/friends.js

import { db } from "../../mains.js/firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  limit,
  serverTimestamp,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ---------------------------
   Session helpers (MyUm)
---------------------------- */
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("myum_user"));
  } catch {
    return null;
  }
}

const currentUser = getCurrentUser();
const uid = currentUser?.id;

if (!uid) {
  alert("Session invalide. Veuillez vous reconnecter.");
  window.location.href = "../users/login.html";
}

/* ---------------------------
   DOM
---------------------------- */
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");
const incomingList = document.getElementById("incomingList");
const friendsList = document.getElementById("friendsList");

init();

async function init() {
  searchBtn.addEventListener("click", onSearch);

  // Enter key = search
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onSearch();
  });

  await renderIncoming();
  await renderFriends();
}

/* ---------------------------
   Search users
---------------------------- */
async function onSearch() {
  const term = (searchInput.value || "").trim();
  searchResults.innerHTML = "";

  if (!term) return;

  // Recherche exacte : username == termUpper OU phone == term
  const usersRef = collection(db, "users");
  const termUpper = term.toUpperCase();

  const qUsername = query(usersRef, where("username", "==", termUpper), limit(10));
  const qPhone = query(usersRef, where("phone", "==", term), limit(10));

  const [s1, s2] = await Promise.all([getDocs(qUsername), getDocs(qPhone)]);

  const found = new Map();
  s1.forEach((d) => found.set(d.id, { id: d.id, ...d.data() }));
  s2.forEach((d) => found.set(d.id, { id: d.id, ...d.data() }));

  if (found.size === 0) {
    searchResults.innerHTML = `<div class="text-sm text-gray-500">Aucun résultat.</div>`;
    return;
  }

  for (const user of found.values()) {
    if (user.id === uid) continue;

    const alreadyFriend = await isFriend(uid, user.id);
    const pending = await hasPendingRequest(uid, user.id);

    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Utilisateur";
    const sub = user.username ? `@${user.username}` : (user.phone || "");

    const card = document.createElement("div");
    card.className = "border rounded-xl p-3 flex items-center justify-between bg-white";

    card.innerHTML = `
      <div>
        <div class="font-semibold text-sm">${escapeHtml(name)}</div>
        <div class="text-xs text-gray-500">${escapeHtml(sub)}</div>
      </div>
      <button class="sendBtn px-3 py-2 rounded-xl text-sm font-semibold ${
        alreadyFriend ? "bg-gray-200 text-gray-500" :
        pending ? "bg-yellow-100 text-yellow-700" :
        "bg-blue-600 text-white"
      }" ${alreadyFriend || pending ? "disabled" : ""}>
        ${alreadyFriend ? "Déjà ami" : pending ? "En attente" : "Ajouter"}
      </button>
    `;

    card.querySelector(".sendBtn")?.addEventListener("click", () => sendFriendRequest(user.id));
    searchResults.appendChild(card);
  }
}

/* ---------------------------
   Friend requests
---------------------------- */
async function sendFriendRequest(toUserId) {
  if (!uid || !toUserId) return;

  // outgoing: users/{uid}/friendRequests/outgoing/items/{autoId}
  const outgoingCol = collection(db, "users", uid, "friendRequests", "outgoing", "items");

  const newReq = await addDoc(outgoingCol, {
    fromUserId: uid,
    toUserId,
    status: "pending",
    createdAt: serverTimestamp()
  });

  // incoming: users/{to}/friendRequests/incoming/items/{sameId}
  const incomingRef = doc(db, "users", toUserId, "friendRequests", "incoming", "items", newReq.id);
  await setDoc(incomingRef, {
    fromUserId: uid,
    toUserId,
    status: "pending",
    createdAt: serverTimestamp()
  });

  alert("Demande envoyée ✅");
  await renderIncoming();
  await renderFriends();
  await onSearch();
}

async function renderIncoming() {
  incomingList.innerHTML = "";

  const incomingCol = collection(db, "users", uid, "friendRequests", "incoming", "items");
  const snap = await getDocs(query(incomingCol, orderBy("createdAt", "desc"), limit(30)));

  if (snap.empty) {
    incomingList.innerHTML = `<div class="text-sm text-gray-500">Aucune demande.</div>`;
    return;
  }

  // Render each pending request
  for (const reqDoc of snap.docs) {
    const req = reqDoc.data();
    if (req.status !== "pending") continue;

    const fromUserId = req.fromUserId;

    const fromSnap = await getDoc(doc(db, "users", fromUserId));
    const fromData = fromSnap.exists() ? fromSnap.data() : {};

    const name = `${fromData.firstName || ""} ${fromData.lastName || ""}`.trim() || fromData.username || "Utilisateur";
    const sub = fromData.username ? `@${fromData.username}` : "";

    const row = document.createElement("div");
    row.className = "border rounded-xl p-3 flex items-center justify-between";

    row.innerHTML = `
      <div>
        <div class="font-semibold text-sm">${escapeHtml(name)}</div>
        <div class="text-xs text-gray-500">${escapeHtml(sub)}</div>
      </div>
      <div class="flex gap-2">
        <button class="accept px-3 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold">Accepter</button>
        <button class="reject px-3 py-2 rounded-xl bg-gray-200 text-gray-700 text-sm font-semibold">Refuser</button>
      </div>
    `;

    row.querySelector(".accept").addEventListener("click", () => acceptRequest(reqDoc.id, fromUserId));
    row.querySelector(".reject").addEventListener("click", () => rejectRequest(reqDoc.id, fromUserId));

    incomingList.appendChild(row);
  }
}

async function acceptRequest(requestId, fromUserId) {
  // 1) créer relation friends des deux côtés
  await setDoc(doc(db, "users", uid, "friends", "items", fromUserId), {
    createdAt: serverTimestamp()
  });

  await setDoc(doc(db, "users", fromUserId, "friends", "items", uid), {
    createdAt: serverTimestamp()
  });

  // 2) supprimer requests incoming/outgoing
  await deleteDoc(doc(db, "users", uid, "friendRequests", "incoming", "items", requestId)).catch(() => {});
  await deleteDoc(doc(db, "users", fromUserId, "friendRequests", "outgoing", "items", requestId)).catch(() => {});

  alert("Ami ajouté ✅");
  await renderIncoming();
  await renderFriends();
  await onSearch();
}

async function rejectRequest(requestId, fromUserId) {
  await deleteDoc(doc(db, "users", uid, "friendRequests", "incoming", "items", requestId)).catch(() => {});
  await deleteDoc(doc(db, "users", fromUserId, "friendRequests", "outgoing", "items", requestId)).catch(() => {});
  alert("Demande refusée.");
  await renderIncoming();
  await onSearch();
}

/* ---------------------------
   Friends list
---------------------------- */
async function renderFriends() {
  friendsList.innerHTML = "";

  const friendsCol = collection(db, "users", uid, "friends", "items");
  const snap = await getDocs(query(friendsCol, orderBy("createdAt", "desc"), limit(60)));

  if (snap.empty) {
    friendsList.innerHTML = `<div class="text-sm text-gray-500">Aucun ami pour l’instant.</div>`;
    return;
  }

  for (const f of snap.docs) {
    const friendUid = f.id;

    const friendSnap = await getDoc(doc(db, "users", friendUid));
    const friendData = friendSnap.exists() ? friendSnap.data() : {};

    const name = `${friendData.firstName || ""} ${friendData.lastName || ""}`.trim() || friendData.username || "Utilisateur";
    const sub = friendData.username ? `@${friendData.username}` : "";

    const row = document.createElement("div");
    row.className = "border rounded-xl p-3 flex items-center justify-between";

    row.innerHTML = `
      <div>
        <div class="font-semibold text-sm">${escapeHtml(name)}</div>
        <div class="text-xs text-gray-500">${escapeHtml(sub)}</div>
      </div>
      <a class="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold"
         href="room.html?uid=${encodeURIComponent(friendUid)}">
        Chatter
      </a>
    `;
    friendsList.appendChild(row);
  }
}

/* ---------------------------
   Utils
---------------------------- */
async function isFriend(a, b) {
  const d = await getDoc(doc(db, "users", a, "friends", "items", b));
  return d.exists();
}

async function hasPendingRequest(from, to) {
  const outCol = collection(db, "users", from, "friendRequests", "outgoing", "items");
  const snap = await getDocs(query(outCol, where("toUserId", "==", to), where("status", "==", "pending"), limit(1)));
  return !snap.empty;
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