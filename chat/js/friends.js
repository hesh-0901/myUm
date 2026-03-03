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

const currentUser = getCurrentUser();
const uid = currentUser?.id;

if (!uid) {
  alert("Session invalide. Veuillez vous reconnecter.");
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
  searchBtn.addEventListener("click", onSearch);

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onSearch();
  });

  await renderIncoming();
  await renderFriends();
}

/* =========================
   SEARCH USERS
========================= */

async function onSearch() {

  let term = (searchInput.value || "");
  term = term.replace(/\s+/g, " ").trim();

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

    const [snapUser, snapPhone] = await Promise.all([
      getDocs(qUsername),
      getDocs(qPhone)
    ]);

    const found = new Map();

    snapUser.forEach(docSnap => {
      found.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
    });

    snapPhone.forEach(docSnap => {
      found.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
    });

    if (found.size === 0) {
      searchResults.innerHTML =
        `<div class="text-sm text-gray-500">Aucun utilisateur trouvé.</div>`;
      return;
    }

    for (const user of found.values()) {

      if (user.id === uid) continue;

      const alreadyFriend = await isFriend(uid, user.id);
      const pending = await hasPendingRequest(uid, user.id);

      const name =
        `${user.firstName || ""} ${user.lastName || ""}`.trim()
        || user.username
        || "Utilisateur";

      const sub =
        user.username ? `@${user.username}` :
        user.phone || "";

      const initials = getInitials(name);

      const card = document.createElement("div");
      card.className =
        "bg-gray-50 rounded-2xl p-4 flex items-center justify-between shadow-sm";

      card.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-[#3FA9F5] text-white flex items-center justify-center text-sm font-bold">
            ${initials}
          </div>
          <div>
            <div class="font-semibold text-sm">${escapeHtml(name)}</div>
            <div class="text-xs text-gray-500">${escapeHtml(sub)}</div>
          </div>
        </div>

        <button class="sendBtn px-4 py-2 rounded-xl text-xs font-semibold transition active:scale-95 ${
          alreadyFriend ? "bg-gray-200 text-gray-500" :
          pending ? "bg-yellow-100 text-yellow-700" :
          "bg-[#1A3668] text-white shadow-sm"
        }" ${alreadyFriend || pending ? "disabled" : ""}>
          ${alreadyFriend ? "Déjà ami" : pending ? "En attente" : "Ajouter"}
        </button>
      `;

      if (!alreadyFriend && !pending) {
        card.querySelector(".sendBtn")
          .addEventListener("click", () => sendFriendRequest(user.id));
      }

      searchResults.appendChild(card);
    }

  } catch (error) {
    console.error("Erreur recherche :", error);
    searchResults.innerHTML =
      `<div class="text-sm text-red-500">Erreur lors de la recherche.</div>`;
  }
}

/* =========================
   SEND REQUEST
========================= */

async function sendFriendRequest(toUserId) {

  const outgoingCol =
    collection(db, "users", uid, "friendRequests", "outgoing", "items");

  const newReq = await addDoc(outgoingCol, {
    fromUserId: uid,
    toUserId,
    status: "pending",
    createdAt: serverTimestamp()
  });

  const incomingRef =
    doc(db, "users", toUserId, "friendRequests", "incoming", "items", newReq.id);

  await setDoc(incomingRef, {
    fromUserId: uid,
    toUserId,
    status: "pending",
    createdAt: serverTimestamp()
  });

  await renderIncoming();
  await renderFriends();
  await onSearch();
}

/* =========================
   RENDER INCOMING
========================= */

async function renderIncoming() {

  incomingList.innerHTML = "";

  const incomingCol =
    collection(db, "users", uid, "friendRequests", "incoming", "items");

  const snap =
    await getDocs(query(incomingCol, orderBy("createdAt", "desc"), limit(30)));

  if (snap.empty) {
    incomingList.innerHTML =
      `<div class="text-sm text-gray-500">Aucune demande.</div>`;
    return;
  }

  for (const reqDoc of snap.docs) {

    const req = reqDoc.data();
    if (req.status !== "pending") continue;

    const fromSnap = await getDoc(doc(db, "users", req.fromUserId));
    const fromData = fromSnap.exists() ? fromSnap.data() : {};

    const name =
      `${fromData.firstName || ""} ${fromData.lastName || ""}`.trim()
      || fromData.username
      || "Utilisateur";

    const initials = getInitials(name);

    const row = document.createElement("div");
    row.className =
      "bg-gray-50 rounded-2xl p-4 flex items-center justify-between shadow-sm";

    row.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
          ${initials}
        </div>
        <div class="font-semibold text-sm">${escapeHtml(name)}</div>
      </div>

      <div class="flex gap-2">
        <button class="accept px-3 py-2 rounded-xl bg-green-600 text-white text-xs font-semibold shadow-sm active:scale-95">
          Accepter
        </button>
        <button class="reject px-3 py-2 rounded-xl bg-gray-200 text-xs font-semibold active:scale-95">
          Refuser
        </button>
      </div>
    `;

    row.querySelector(".accept")
      .addEventListener("click", () => acceptRequest(reqDoc.id, req.fromUserId));

    row.querySelector(".reject")
      .addEventListener("click", () => rejectRequest(reqDoc.id, req.fromUserId));

    incomingList.appendChild(row);
  }
}

/* =========================
   ACCEPT / REJECT
========================= */

async function acceptRequest(requestId, fromUserId) {

  await setDoc(doc(db, "users", uid, "friends", "items", fromUserId), {
    createdAt: serverTimestamp()
  });

  await setDoc(doc(db, "users", fromUserId, "friends", "items", uid), {
    createdAt: serverTimestamp()
  });

  await deleteDoc(doc(db, "users", uid,
    "friendRequests", "incoming", "items", requestId)).catch(() => {});

  await deleteDoc(doc(db, "users", fromUserId,
    "friendRequests", "outgoing", "items", requestId)).catch(() => {});

  await renderIncoming();
  await renderFriends();
}

async function rejectRequest(requestId, fromUserId) {

  await deleteDoc(doc(db, "users", uid,
    "friendRequests", "incoming", "items", requestId)).catch(() => {});

  await deleteDoc(doc(db, "users", fromUserId,
    "friendRequests", "outgoing", "items", requestId)).catch(() => {});

  await renderIncoming();
}

/* =========================
   FRIENDS LIST
========================= */

async function renderFriends() {

  friendsList.innerHTML = "";

  const friendsCol =
    collection(db, "users", uid, "friends", "items");

  const snap =
    await getDocs(query(friendsCol, orderBy("createdAt", "desc"), limit(60)));

  if (snap.empty) {
    friendsList.innerHTML =
      `<div class="text-sm text-gray-500">Aucun ami pour l’instant.</div>`;
    return;
  }

  for (const f of snap.docs) {

    const friendUid = f.id;
    const friendSnap = await getDoc(doc(db, "users", friendUid));
    const friendData = friendSnap.exists() ? friendSnap.data() : {};

    const name =
      `${friendData.firstName || ""} ${friendData.lastName || ""}`.trim()
      || friendData.username
      || "Utilisateur";

    const initials = getInitials(name);

    const row = document.createElement("div");
    row.className =
      "bg-gray-50 rounded-2xl p-4 flex items-center justify-between shadow-sm";

    row.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-[#1A3668] text-white flex items-center justify-center text-sm font-bold">
          ${initials}
        </div>
        <div class="font-semibold text-sm">${escapeHtml(name)}</div>
      </div>

      <a href="room.html?uid=${friendUid}"
         class="px-4 py-2 rounded-xl bg-[#2596D9] text-white text-xs font-semibold shadow-sm active:scale-95 transition">
         <i class="bi bi-chat-dots"></i>
      </a>
    `;

    friendsList.appendChild(row);
  }
}

/* =========================
   HELPERS
========================= */

async function isFriend(a, b) {
  const d = await getDoc(doc(db, "users", a, "friends", "items", b));
  return d.exists();
}

async function hasPendingRequest(from, to) {
  const outCol =
    collection(db, "users", from, "friendRequests", "outgoing", "items");

  const snap =
    await getDocs(query(outCol,
      where("toUserId", "==", to),
      where("status", "==", "pending"),
      limit(1)));

  return !snap.empty;
}

function getInitials(name) {
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}
