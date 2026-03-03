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
  searchBtn.addEventListener("click", onSearch);
  searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") onSearch();
  });

  await renderIncoming();
  await renderFriends();
}

/* =========================
   SEARCH
========================= */

async function onSearch() {

  let term = (searchInput.value || "").trim();
  searchResults.innerHTML = "";
  if (!term) return;

  const usersRef = collection(db, "users");
  const termUpper = term.toUpperCase();

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

  snapUser.forEach(d => found.set(d.id, { id: d.id, ...d.data() }));
  snapPhone.forEach(d => found.set(d.id, { id: d.id, ...d.data() }));

  for (const user of found.values()) {

    if (user.id === uid) continue;

    const alreadyFriend = await isFriend(uid, user.id);
    const pending = await hasPendingRequest(uid, user.id);

    const name =
      `${user.firstName || ""} ${user.lastName || ""}`.trim()
      || user.username
      || "Utilisateur";

    const card = document.createElement("div");
    card.className =
      "bg-gray-50 rounded-2xl p-4 flex justify-between shadow-sm";

    card.innerHTML = `
      <div>${escapeHtml(name)}</div>
      <button class="sendBtn px-3 py-1 rounded-xl text-xs ${
        alreadyFriend ? "bg-gray-300" :
        pending ? "bg-yellow-200" :
        "bg-blue-600 text-white"
      }">
        ${alreadyFriend ? "Déjà ami" : pending ? "En attente" : "Ajouter"}
      </button>
    `;

    if (!alreadyFriend && !pending) {
      card.querySelector(".sendBtn")
        .addEventListener("click", () => sendFriendRequest(user.id));
    }

    searchResults.appendChild(card);
  }
}

/* =========================
   SEND REQUEST
========================= */

async function sendFriendRequest(toUserId) {

  const myRequests =
    collection(db, "users", uid, "friendRequests");

  const theirRequests =
    collection(db, "users", toUserId, "friendRequests");

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

  await renderIncoming();
  await renderFriends();
}

/* =========================
   RENDER INCOMING
========================= */

async function renderIncoming() {

  incomingList.innerHTML = "";

  const incomingCol =
    collection(db, "users", uid, "friendRequests");

  const snap =
    await getDocs(query(
      incomingCol,
      where("type", "==", "incoming"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
      limit(30)
    ));

  snap.forEach(docSnap => {

    const req = docSnap.data();

    const row = document.createElement("div");
    row.className =
      "bg-gray-50 rounded-2xl p-3 flex justify-between shadow-sm";

    row.innerHTML = `
      <div>${escapeHtml(req.fromUserId)}</div>
      <button class="accept text-xs bg-green-600 text-white px-2 rounded">
        Accepter
      </button>
    `;

    row.querySelector(".accept")
      .addEventListener("click",
        () => acceptRequest(docSnap.id, req.fromUserId));

    incomingList.appendChild(row);
  });
}

/* =========================
   ACCEPT
========================= */

async function acceptRequest(requestId, fromUserId) {

  await setDoc(doc(db, "users", uid, "friends", fromUserId), {
    createdAt: serverTimestamp()
  });

  await setDoc(doc(db, "users", fromUserId, "friends", uid), {
    createdAt: serverTimestamp()
  });

  await deleteDoc(doc(db, "users", uid, "friendRequests", requestId));
  await deleteDoc(doc(db, "users", fromUserId, "friendRequests", requestId));

  await renderIncoming();
  await renderFriends();
}

/* =========================
   FRIENDS LIST
========================= */

async function renderFriends() {

  friendsList.innerHTML = "";

  const snap =
    await getDocs(collection(db, "users", uid, "friends"));

  snap.forEach(f => {
    const row = document.createElement("div");
    row.textContent = f.id;
    friendsList.appendChild(row);
  });
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
  return String(str).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}
