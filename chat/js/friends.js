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
  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onSearch();
  });

  await renderIncoming();
  await renderFriends();
}

/* =========================
   SEARCH
========================= */

async function onSearch() {
  // Nettoyage anti-collage (espaces invisibles/retours à la ligne)
  let term = (searchInput?.value || "");
  term = term.replace(/\s+/g, " ").trim();

  searchResults.innerHTML = "";
  if (!term) return;

  const usersRef = collection(db, "users");
  const termUpper = term.toUpperCase();

  try {
    // Prefix search username
    const qUsername = query(
      usersRef,
      where("username", ">=", termUpper),
      where("username", "<=", termUpper + "\uf8ff"),
      limit(10)
    );

    // Exact phone
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
    snapUser.forEach((d) => found.set(d.id, { id: d.id, ...d.data() }));
    snapPhone.forEach((d) => found.set(d.id, { id: d.id, ...d.data() }));

    if (found.size === 0) {
      searchResults.innerHTML = `<div class="text-sm text-gray-500">Aucun utilisateur trouvé.</div>`;
      return;
    }

    for (const user of found.values()) {
      if (user.id === uid) continue;

      const alreadyFriend = await isFriend(uid, user.id);
      const pending = await hasPendingRequest(uid, user.id);

      const name =
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        user.username ||
        "Utilisateur";

      const sub = user.username ? `@${user.username}` : (user.phone || "");

      const card = document.createElement("div");
      card.className = "bg-gray-50 rounded-2xl p-4 flex justify-between items-center shadow-sm";

      card.innerHTML = `
        <div class="min-w-0">
          <div class="font-semibold text-sm truncate">${escapeHtml(name)}</div>
          <div class="text-xs text-gray-500 truncate">${escapeHtml(sub)}</div>
        </div>
        <button class="sendBtn px-3 py-2 rounded-xl text-xs font-semibold ${
          alreadyFriend ? "bg-gray-300 text-gray-600" :
          pending ? "bg-yellow-200 text-yellow-900" :
          "bg-blue-600 text-white"
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
    searchResults.innerHTML = `<div class="text-sm text-red-500">Erreur lors de la recherche.</div>`;
  }
}

/* =========================
   SEND REQUEST
========================= */

async function sendFriendRequest(toUserId) {
  const myRequests = collection(db, "users", uid, "friendRequests");
  const theirRequests = collection(db, "users", toUserId, "friendRequests");

  const newReq = await addDoc(myRequests, {
    fromUserId: uid,
    toUserId,
    type: "outgoing",
    status: "pending",
    createdAt: serverTimestamp()
  });

  await setDoc(doc(theirRequests, newReq.id), {
    fromUserId: uid,
    toUserId,
    type: "incoming",
    status: "pending",
    createdAt: serverTimestamp()
  });

  alert("Demande envoyée ✅");

  await renderIncoming();
  await renderFriends();
  await onSearch();
}

/* =========================
   RENDER INCOMING
========================= */

async function renderIncoming() {
  incomingList.innerHTML = "";

  const incomingCol = collection(db, "users", uid, "friendRequests");

  let snap;
  try {
    snap = await getDocs(query(
      incomingCol,
      where("type", "==", "incoming"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
      limit(30)
    ));
  } catch (e) {
    console.error("Erreur incoming :", e);
    incomingList.innerHTML = `<div class="text-sm text-red-500">Impossible de charger les demandes.</div>`;
    return;
  }

  if (snap.empty) {
    incomingList.innerHTML = `<div class="text-sm text-gray-500">Aucune demande.</div>`;
    return;
  }

  // On fetch les users en parallèle
  const rows = await Promise.all(snap.docs.map(async (docSnap) => {
    const req = docSnap.data();
    const fromId = req.fromUserId;

    const fromSnap = await getDoc(doc(db, "users", fromId)).catch(() => null);
    const fromData = fromSnap && fromSnap.exists() ? fromSnap.data() : {};

    const name =
      `${fromData.firstName || ""} ${fromData.lastName || ""}`.trim() ||
      fromData.username ||
      fromId;

    const row = document.createElement("div");
    row.className = "bg-gray-50 rounded-2xl p-3 flex justify-between items-center shadow-sm";

    row.innerHTML = `
      <div class="min-w-0">
        <div class="font-semibold text-sm truncate">${escapeHtml(name)}</div>
        <div class="text-xs text-gray-500 truncate">${fromData.username ? "@"+escapeHtml(fromData.username) : ""}</div>
      </div>
      <div class="flex gap-2">
        <button class="accept text-xs bg-green-600 text-white px-3 py-2 rounded-xl font-semibold">
          Accepter
        </button>
        <button class="reject text-xs bg-gray-200 text-gray-700 px-3 py-2 rounded-xl font-semibold">
          Refuser
        </button>
      </div>
    `;

    row.querySelector(".accept")
      .addEventListener("click", () => acceptRequest(docSnap.id, fromId));

    row.querySelector(".reject")
      .addEventListener("click", () => rejectRequest(docSnap.id, fromId));

    return row;
  }));

  rows.forEach(r => incomingList.appendChild(r));
}

/* =========================
   ACCEPT / REJECT
========================= */

async function acceptRequest(requestId, fromUserId) {
  // Snapshot durable : on stocke le nom dans friends des deux côtés
  const [meSnap, otherSnap] = await Promise.all([
    getDoc(doc(db, "users", uid)),
    getDoc(doc(db, "users", fromUserId))
  ]);

  const me = meSnap.exists() ? meSnap.data() : {};
  const other = otherSnap.exists() ? otherSnap.data() : {};

  const myName =
    `${me.firstName || ""} ${me.lastName || ""}`.trim() ||
    me.username ||
    uid;

  const otherName =
    `${other.firstName || ""} ${other.lastName || ""}`.trim() ||
    other.username ||
    fromUserId;

  // friends/{friendId}
  await setDoc(doc(db, "users", uid, "friends", fromUserId), {
    friendId: fromUserId,
    friendName: otherName,
    friendUsername: other.username || "",
    createdAt: serverTimestamp()
  });

  await setDoc(doc(db, "users", fromUserId, "friends", uid), {
    friendId: uid,
    friendName: myName,
    friendUsername: me.username || "",
    createdAt: serverTimestamp()
  });

  // Supprimer demandes
  await deleteDoc(doc(db, "users", uid, "friendRequests", requestId)).catch(() => {});
  await deleteDoc(doc(db, "users", fromUserId, "friendRequests", requestId)).catch(() => {});

  alert("Ami ajouté ✅");

  await renderIncoming();
  await renderFriends();
}

async function rejectRequest(requestId, fromUserId) {
  await deleteDoc(doc(db, "users", uid, "friendRequests", requestId)).catch(() => {});
  await deleteDoc(doc(db, "users", fromUserId, "friendRequests", requestId)).catch(() => {});
  alert("Demande refusée.");
  await renderIncoming();
}

/* =========================
   FRIENDS LIST
========================= */

async function renderFriends() {
  friendsList.innerHTML = "";

  const friendsCol = collection(db, "users", uid, "friends");

  let snap;
  try {
    snap = await getDocs(query(friendsCol, limit(60)));
  } catch (e) {
    console.error("Erreur friends :", e);
    friendsList.innerHTML = `<div class="text-sm text-red-500">Impossible de charger les amis.</div>`;
    return;
  }

  if (snap.empty) {
    friendsList.innerHTML = `<div class="text-sm text-gray-500">Aucun ami pour l’instant.</div>`;
    return;
  }

  const rows = await Promise.all(snap.docs.map(async (f) => {
    const data = f.data() || {};
    const friendId = data.friendId || f.id;

    // 1) Snapshot immédiat
    let name = data.friendName || "";
    let username = data.friendUsername || "";

    // 2) Fallback fetch user si snapshot absent (anciens amis)
    if (!name) {
      const friendSnap = await getDoc(doc(db, "users", friendId)).catch(() => null);
      if (friendSnap && friendSnap.exists()) {
        const u = friendSnap.data();
        name = (`${u.firstName || ""} ${u.lastName || ""}`).trim() || u.username || friendId;
        username = u.username || "";
      } else {
        name = friendId;
      }
    }

    const row = document.createElement("div");
    row.className = "bg-gray-50 rounded-2xl p-3 flex justify-between items-center shadow-sm";

    row.innerHTML = `
      <div class="min-w-0">
        <div class="font-semibold text-sm truncate">${escapeHtml(name)}</div>
        <div class="text-xs text-gray-500 truncate">${username ? "@"+escapeHtml(username) : ""}</div>
      </div>
      <a href="room.html?uid=${encodeURIComponent(friendId)}"
         class="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold">
        Chatter
      </a>
    `;
    return row;
  }));

  rows.forEach(r => friendsList.appendChild(r));
}

/* =========================
   HELPERS
========================= */

async function isFriend(a, b) {
  return (await getDoc(doc(db, "users", a, "friends", b))).exists();
}

async function hasPendingRequest(from, to) {
  const snap = await getDocs(query(
    collection(db, "users", from, "friendRequests"),
    where("toUserId", "==", to),
    where("status", "==", "pending"),
    limit(1)
  ));
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